import { z } from 'zod';
import { AppState, GenerationDraft, Plan, Workout } from './types';
import { outlineSchema, parameterResponseSchema, parameterNames, parametersSchema, TrainingOutline, WorkoutBlock, WorkoutLibrary } from './libraryTypes';
import { parseWorkoutLibrary, instantiateWorkout } from './workoutLibrary';
import { buildCoachContext, completion, generationSignature, portableSchema } from './llm';
import { addDays, datesBetween, dayOfWeek, today } from './dates';
import { checkedPlan } from './plan';
import { constraintIssues } from './constraints';

const cancelled = (signal?: AbortSignal) => { if(signal?.aborted)throw new Error('Generation cancelled. Saved planning stages remain available to resume.'); };
const unique = (values: string[], label: string) => {if(new Set(values).size!==values.length)throw new Error(`Duplicate ${label}.`);};
function preserved(state: AppState, date: string): Workout[] {
  return state.plan?.workouts.filter(w=>w.date===date && (w.completed || w.date<today())) ?? [];
}
export function validateOutline(outline: TrainingOutline, library: WorkoutLibrary, state: AppState, start: string, end: string) {
  const dates=datesBetween(start,end);
  if(outline.weeks.length!==Math.ceil(dates.length/7))throw new Error('Outline must cover exactly every creation-anchored week through the event.');
  unique(outline.variants.map(v=>v.id),'variant IDs');unique(outline.patterns.map(p=>p.id),'pattern IDs');unique(outline.progressions.map(p=>p.id),'progression IDs');
  for(const p of outline.progressions)if(!library.templates.some(t=>t.id===p.templateId))throw new Error(`Unknown progression template: ${p.templateId}`);
  for(const v of outline.variants) {
    if(['REST','EVENT'].includes(v.id)||!library.templates.some(t=>t.id===v.templateId))throw new Error(`Unknown or reserved variant: ${v.id}/${v.templateId}`);
    const p=outline.progressions.find(p=>p.id===v.progressionId);
    if(!p||p.sport!==v.sport||p.templateId!==v.templateId)throw new Error(`Variant ${v.id} must reference a matching progression.`);
  }
  for(const p of outline.patterns)for(const id of p.days)if(!['REST','EVENT'].includes(id)&&!outline.variants.some(v=>v.id===id))throw new Error(`Unknown pattern variant: ${id}`);
  let previousHard=false;
  for(let week=0;week<outline.weeks.length;week++) {
    const days=dates.slice(week*7,week*7+7), pattern=outline.patterns.find(p=>p.id===outline.weeks[week]!.patternId);
    if(!pattern||pattern.days.length<days.length)throw new Error(`Week ${week+1} has missing dates or pattern.`);
    let rest=0;
    days.forEach((date,offset)=>{
      const id=pattern.days[offset]!;
      if(id==='EVENT'&&date!==end)throw new Error(`EVENT is only allowed on ${end}.`);
      const variant=outline.variants.find(v=>v.id===id), template=library.templates.find(t=>t.id===variant?.templateId);
      const old=preserved(state,date);
      const isRest=old.length ? old.every(w=>w.sport==='rest') : id==='REST';
      const hard=old.length ? old.some(w=>w.intensity==='hard') : id==='EVENT'||template?.intensity==='hard';
      const long=old.length ? old.some(w=>w.long) : !!template?.long;
      if(isRest)rest++;
      if(long&&state.settings.rules.weekendLong&&![0,6].includes(dayOfWeek(date)))throw new Error(`Long session must be on a weekend: ${date}`);
      if(hard&&previousHard&&state.settings.rules.noConsecutiveHard)throw new Error(`Consecutive hard days: ${date}`);
      previousHard=!!hard;
      if(date===end&&id!=='EVENT'&&!old.length)throw new Error(`Schedule the target EVENT on ${end}.`);
    });
    if(days.length===7&&rest<state.settings.rules.restDays)throw new Error(`Not enough rest days in week ${week+1}.`);
  }
  if(constraintIssues(state.settings.constraints,state.settings.rules).length&&!outline.constraintDecisions.length)throw new Error('Explain how ambiguous or conflicting guidance was resolved in constraintDecisions for user review.');
}
export function assembleLibraryPlan(outline: TrainingOutline, blocks: WorkoutBlock[], library: WorkoutLibrary, state: AppState, start: string, end: string): Plan {
  validateOutline(outline,library,state,start,end);
  unique(blocks.map(b=>b.variantId),'block IDs');
  if(blocks.length!==outline.variants.length||blocks.some(b=>!outline.variants.some(v=>v.id===b.variantId)))throw new Error('Provide exactly one parameter block per outline variant.');
  const instances=new Map(blocks.map(b=>{
    const v=outline.variants.find(v=>v.id===b.variantId)!;
    const t=library.templates.find(t=>t.id===v.templateId)!;
    return [b.variantId,instantiateWorkout(t,v.sport,b.parameters,start,b.distanceKm,state.fitness)] as const;
  }));
  const dates=datesBetween(start,end), workouts:Workout[]=[], overview:Plan['overview']=[];
  for(let index=0;index<outline.weeks.length;index++) {
    const week=outline.weeks[index]!,days=dates.slice(index*7,index*7+7),pattern=outline.patterns.find(p=>p.id===week.patternId)!;
    for(let offset=0;offset<days.length;offset++) {
      const date=days[offset]!, old=preserved(state,date), id=pattern.days[offset]!;
      if(old.length){workouts.push(...old);continue;}
      if(id==='REST')workouts.push({id:`${date}-rest`,date,title:'Rest',detail:'Rest and recover.',sport:'rest',durationSeconds:0,distanceKm:0,intensity:'rest',long:false,completed:false,steps:[]});
      else if(id==='EVENT')workouts.push({id:`${date}-run`,date,title:state.event!.name,detail:'Target event. Follow the reviewed pacing strategy and adjust to conditions.',sport:'run',durationSeconds:state.event!.targetSeconds,distanceKm:state.event!.distanceKm,intensity:'hard',long:false,completed:false,steps:[]});
      else {
        const base=instances.get(id)!;
        // Each dated occurrence owns its own steps, identity and completion state.
        workouts.push({...base,id:`${date}-${base.sport}`,date,steps:base.steps.map(s=>({...s})),parameters:{...base.parameters!}});
      }
    }
    const sessions=workouts.filter(w=>w.date>=days[0]!&&w.date<=days.at(-1)!);
    overview.push({start:days[0]!,end:days.at(-1)!,phase:week.phase,focus:week.focus,
      runningKm:sessions.filter(w=>w.sport==='run').reduce((n,w)=>n+w.distanceKm,0),cyclingKm:sessions.filter(w=>w.sport==='ride').reduce((n,w)=>n+w.distanceKm,0)});
  }
  return checkedPlan({version:1,revision:(state.plan?.revision??0)+1,event:state.event!,start,end,rules:state.settings.rules,workouts,overview,
    strategy:outline.strategy,progressions:outline.progressions,constraintDecisions:outline.constraintDecisions});
}
async function requestValidated<T>(schema: z.ZodType<T>, state: AppState, key: string, messages: {role:string;content:string}[], validate:(value:T)=>void, progress:(text:string)=>void, stage:string, signal?:AbortSignal):Promise<T> {
  for(let attempt=0;attempt<2;attempt++) {
    cancelled(signal);progress(attempt ? `Repairing ${stage} (1/1)…` : `Generating ${stage}…`);
    const text=await completion(key,state.settings.model,messages,portableSchema(z.toJSONSchema(schema)),signal);
    try{const value=schema.parse(JSON.parse(text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')));validate(value);return value;}
    catch(e){const reason=e instanceof Error?e.message:'Invalid response';if(attempt)throw new Error(`${stage} failed validation: ${reason}`);messages.push({role:'assistant',content:text},{role:'user',content:`Repair the complete response. Resolve this conflict within library bounds and enforced calendar rules; do not ignore it: ${reason}`});}
  }
  throw new Error('No valid response.');
}
export async function generateLibraryPlan(state: AppState, key: string, request='', progress:(text:string)=>void=()=>{}, signal?:AbortSignal, persistence?:{draft:GenerationDraft|null;save:(draft:GenerationDraft)=>Promise<void>}):Promise<Plan> {
  if(!key.trim())throw new Error('Add your OpenRouter API key in Settings before generating a plan.');
  if(!state.event)throw new Error('Load a goal in Settings first.');
  const library=parseWorkoutLibrary(state.settings.workoutLibrary), signature=generationSignature(state,request,true), old=persistence?.draft;
  if(old&&old.signature!==signature)throw new Error('The saved draft uses different generation inputs. Discard it before starting a different plan.');
  const start=old?.start??state.plan?.start??today(),end=state.event.date;
  if(end<today())throw new Error('The event is in the past. Import a future goal.');
  let draft:GenerationDraft={version:1,signature,request,start,end,workouts:[],overview:[],pipeline:'library',outline:null,blocks:null,...old};
  const save=async()=>{await persistence?.save({...draft});};
  if(!old)await save();
  const dates=datesBetween(start,end);
  const calendar=Array.from({length:Math.ceil(dates.length/7)},(_,i)=>({week:i+1,start:dates[i*7],days:dates.slice(i*7,i*7+7).map(date=>({date,weekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dayOfWeek(date)],maximumSeconds:dayOfWeek(date)===1?state.settings.rules.mondayMaxMinutes*60:null,longAllowed:!state.settings.rules.weekendLong||[0,6].includes(dayOfWeek(date))}))}));
  const context=buildCoachContext({...state,plan:null},true);
  let conflict='';
  // One outline rebuild is allowed if valid-looking blocks reveal a calendar conflict.
  for(let pass=0;pass<2;pass++) {
    cancelled(signal);
    if(!draft.outline) {
      draft.outline=await requestValidated(outlineSchema,state,key,[{role:'system',content:context},{role:'user',content:`Create the HIGH-LEVEL training progression first, using this workout library as the only training building blocks: ${JSON.stringify(library)}
You, the LLM, choose all progression, recovery weeks, tapering, training distribution, prescriptions and scheduling-conflict resolutions. Do not impose a universal 80/20 rule. Explain ambiguous/conflicting additional guidance in constraintDecisions for user review; explicit enforced rules take priority. Do not diagnose injury or force maximum protocol doses.
Overall dates ${start} through ${end} inclusive. Return strategy, constraintDecisions, progressions, reusable variants, reusable patterns and weeks. A progression identifies templateId, sport and approach; each variant references its matching progressionId and contains a concise prescription for the parameterizer. Define each genuinely identical workout variant ONCE and reuse its ID. Patterns contain variant IDs or REST/EVENT in creation-anchored day order. Weeks select patternId, phase and focus, including planned recovery/taper/event weeks. Last partial week uses only its actual calendar dates. EVENT must appear only on ${end}; the app uses the target event distance/time. Use one session or REST per date. Every complete week requires at least ${state.settings.rules.restDays} REST dates. LONG templates only use permitted dates; all templates marked hard (including moderate/progressive) obey no consecutive hard days across week boundaries. Monday total duration includes all warmup/recovery/cooldown and must fit its cap. If a library minimum cannot fit, choose another template or REST. Your choices, not local heuristics, determine progression.
ENFORCED RULES: ${JSON.stringify(state.settings.rules)}
CALENDAR: ${JSON.stringify(calendar)}
ADDITIONAL CONSTRAINTS: ${state.settings.constraints.slice(0,20000)}
PRESERVED HISTORY (past/completed sessions are copied unchanged locally; do not regenerate their details): ${JSON.stringify(state.plan?.workouts.filter(w=>w.completed||w.date<today()).map(({date,sport,intensity,long,durationSeconds,distanceKm,completed})=>({date,sport,intensity,long,durationSeconds,distanceKm,completed}))??[])}
CURRENT FUTURE SESSIONS (respect unchanged work when proposing a targeted revision): ${JSON.stringify(state.plan?.workouts.filter(w=>!w.completed&&w.date>=today()).map(({date,templateId,sport,intensity,long,durationSeconds,distanceKm})=>({date,templateId,sport,intensity,long,durationSeconds,distanceKm}))??[])}
USER REQUEST: ${request||'Initial personalized plan.'}
${conflict ? `The previous outline/parameters could not satisfy: ${conflict}. Resolve the conflicting schedule in this new outline.`:''}`}],value=>validateOutline(value,library,state,start,end),progress,'overall progression',signal);
      draft.blocks=null;await save();
    }
    try {
      if(!draft.blocks) {
        const outline=draft.outline;
        const decode=(value:z.infer<typeof parameterResponseSchema>):WorkoutBlock[]=>value.blocks.map(b=>({variantId:b.variantId,distanceKm:b.distanceKm,parameters:parametersSchema.parse({...Object.fromEntries(parameterNames.map((name,i)=>[name,b.values[i]])),ftpPercent:b.values[9]})}));
        const result=await requestValidated(parameterResponseSchema,state,key,[{role:'system',content:context},{role:'user',content:`Parameterize EACH UNIQUE variant exactly once; do not regenerate repeated instances. Return blocks with variantId, values and estimated distanceKm (metric, athlete-specific). values is an array of EXACTLY TEN entries in this order: [warmupSeconds, workSeconds, repetitions, recoverySeconds, sets, setRecoverySeconds, cooldownSeconds, finishSeconds, intensityRpe, ftpPercent]. Only the final ftpPercent entry may be null; FTP is cycling-only. Use this compact array instead of repeatedly writing parameter names. All parameters must respect the sport-specific library ranges, total work limits and recovery ratios. Ranges mean [minimum,default,maximum]. Recovery occurs between repetitions only, set recovery between sets only. Total duration = warmup + sets*(repetitions*work + (repetitions-1)*recovery) + (sets-1)*setRecovery + finish + cooldown; the app calculates it. Respect the LLM's progression, recovery/taper choices and exact calendar constraints. Warmups/cooldowns are not proportionally stretched. No invented FTP watts or interchangeable running/cycling targets.
LIBRARY: ${JSON.stringify(library)}
APPROVED-FOR-CONSTRUCTION OUTLINE (still unreviewed): ${JSON.stringify(outline)}
CALENDAR: ${JSON.stringify(calendar)}
ENFORCED RULES: ${JSON.stringify(state.settings.rules)}
ADDITIONAL CONSTRAINTS: ${state.settings.constraints.slice(0,20000)}`}],value=>{assembleLibraryPlan(outline,decode(value),library,state,start,end);},progress,'unique workout blocks',signal);
        draft.blocks=decode(result);await save();
      }
      const plan=assembleLibraryPlan(draft.outline,draft.blocks,library,state,start,end);
      for(let i=draft.overview.length;i<plan.overview.length;i++) {
        cancelled(signal);progress(`Generating local week ${i+1} of ${plan.overview.length}…`);
        const last=plan.overview[i]!.end;
        draft={...draft,overview:plan.overview.slice(0,i+1),workouts:plan.workouts.filter(w=>w.date<=last)};await save();
      }
      return plan;
    } catch(e) {
      if(signal?.aborted || !(e instanceof Error) || !e.message.includes('failed validation'))throw e;
      if(pass===1)throw new Error(`${e.message}. The active plan is unchanged. Saved planning stages remain available; resume or discard the draft.`);
      conflict=e.message;draft={...draft,outline:null,blocks:null,workouts:[],overview:[]};await save();
    }
  }
  throw new Error('No valid library plan.');
}
