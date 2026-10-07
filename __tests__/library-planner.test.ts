import { generateLibraryPlan, assembleLibraryPlan } from '../src/libraryPlanner';
import { parseWorkoutLibrary } from '../src/workoutLibrary';
import { defaultWorkoutLibrary } from '../src/workoutLibraryDefaults';
import { parameterNames, TrainingOutline, WorkoutBlock, WorkoutParameters } from '../src/libraryTypes';
import { emptyState } from '../src/defaults';
import { GenerationDraft } from '../src/types';
import { fixturePlan } from './fixtures';
import { encodeBackup, decodeBackup } from '../src/backup';
const library=parseWorkoutLibrary(defaultWorkoutLibrary);
const parameters=(id:string):WorkoutParameters=>({...Object.fromEntries(parameterNames.map(k=>[k,library.templates.find(t=>t.id===id)!.sports.run.parameters[k][1]])),ftpPercent:null}) as WorkoutParameters;
const outline=():TrainingOutline=>({strategy:'Build gradually, recover, then taper to the event; use mostly easy work.',constraintDecisions:[],
  progressions:[{id:'easy-progression',templateId:'ENDURANCE',sport:'run',approach:'Repeat easy runs; the final week is a taper.'}],
  variants:[{id:'easy',templateId:'ENDURANCE',sport:'run',progressionId:'easy-progression',prescription:'30 minutes easy conversational running.'}],
  patterns:[{id:'week',days:['easy','REST','easy','easy','REST','easy','EVENT']}],
  weeks:[{patternId:'week',phase:'Taper',focus:'Arrive fresh'}]});
const blocks=():WorkoutBlock[]=>[{variantId:'easy',parameters:{...parameters('ENDURANCE'),workSeconds:1800},distanceKm:5}];
const response=(data:unknown)=>{
  const body=(data as {blocks?:WorkoutBlock[]}).blocks ? {blocks:(data as {blocks:WorkoutBlock[]}).blocks.map(b=>({variantId:b.variantId,distanceKm:b.distanceKm,values:[...parameterNames.map(k=>b.parameters[k]),b.parameters.ftpPercent]}))} : data;
  return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify(body)},finish_reason:'stop'}]})};
};
describe('High-level LLM planning and local assembly',()=>{
  beforeEach(()=>{global.fetch=jest.fn();jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));});afterEach(()=>jest.useRealTimers());
  it('creates a plan in two requests, reuses blocks, computes dates/totals and waits for review',async()=>{
    const state=emptyState();state.event=fixturePlan().event;(fetch as jest.Mock).mockResolvedValueOnce(response(outline())).mockResolvedValueOnce(response({blocks:blocks()}));
    let draft:GenerationDraft|null=null;
    const plan=await generateLibraryPlan(state,'key','',()=>{},undefined,{draft:null,save:async d=>{draft=JSON.parse(JSON.stringify(d));}});
    expect(fetch).toHaveBeenCalledTimes(2);expect(plan.workouts).toHaveLength(7);expect(plan.workouts.at(-1)).toMatchObject({date:'2027-04-11',distanceKm:21.1,durationSeconds:7200});expect(plan.strategy).toContain('taper');expect(state.plan).toBeNull();
    const copies=plan.workouts.filter(w=>w.templateId==='ENDURANCE');expect(copies).toHaveLength(4);expect(new Set(copies.map(w=>w.id)).size).toBe(4);
    copies[0]!.steps[0]!.seconds=1;expect(copies[1]!.steps[0]!.seconds).toBe(1800);
    expect(draft!.pipeline).toBe('library');expect(draft!.blocks).toHaveLength(1);
    const clean=assembleLibraryPlan(outline(),blocks(),library,state,'2027-04-05','2027-04-11');expect(decodeBackup(encodeBackup(clean))).toEqual(clean);
    (fetch as jest.Mock).mockClear();await generateLibraryPlan(state,'key','',()=>{},undefined,{draft,save:async()=>{}});expect(fetch).not.toHaveBeenCalled();
  });
  it('retains a successful outline when the parameter request fails, then resumes only stage two',async()=>{
    const state=emptyState();state.event=fixturePlan().event;let draft:GenerationDraft|null=null;const save=async(d:GenerationDraft)=>{draft=JSON.parse(JSON.stringify(d));};
    (fetch as jest.Mock).mockResolvedValueOnce(response(outline())).mockRejectedValueOnce(new TypeError('network'));
    await expect(generateLibraryPlan(state,'key','',()=>{},undefined,{draft:null,save})).rejects.toThrow('Unable to reach');expect(draft!.outline).not.toBeNull();expect(draft!.blocks).toBeNull();
    jest.setSystemTime(new Date('2027-04-06T12:00:00Z'));(fetch as jest.Mock).mockReset().mockResolvedValue(response({blocks:blocks()}));
    const plan=await generateLibraryPlan(state,'key','',()=>{},undefined,{draft,save});expect(fetch).toHaveBeenCalledTimes(1);expect(plan.start).toBe('2027-04-05');
  });
  it('asks the LLM to repair parameter/calendar conflicts rather than adjusting intensity or moving days locally',async()=>{
    const state=emptyState();state.event=fixturePlan().event;const tooLong=blocks();tooLong[0]!.parameters.workSeconds=2700;
    (fetch as jest.Mock).mockResolvedValueOnce(response(outline())).mockResolvedValueOnce(response({blocks:tooLong})).mockResolvedValueOnce(response({blocks:blocks()}));
    const plan=await generateLibraryPlan(state,'key');expect(plan.workouts[0]!.durationSeconds).toBe(1800);expect(fetch).toHaveBeenCalledTimes(3);
    const repair=JSON.parse((fetch as jest.Mock).mock.calls[2][1].body);expect(repair.messages.at(-1).content).toContain('Monday exceeds 40');
    const first=JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);expect(first.messages[1].content).toContain('choose all progression, recovery weeks, tapering');expect(first.model).toBe(state.settings.model);
  });
  it('rejects a changed library before spending and requires explicit decisions on conflicting prose',async()=>{
    const state=emptyState();state.event=fixturePlan().event;state.settings.constraints='Train hard every day.';
    expect(()=>assembleLibraryPlan(outline(),blocks(),library,state,'2027-04-05','2027-04-11')).toThrow('Explain');
    const o=outline();o.constraintDecisions=['Use two rest days and no consecutive hard days; daily hard training conflicts with enforced rules.'];
    expect(assembleLibraryPlan(o,blocks(),library,state,'2027-04-05','2027-04-11').constraintDecisions).toHaveLength(1);
    const draft:GenerationDraft={version:1,signature:'other',request:'',start:'2027-04-05',end:'2027-04-11',workouts:[],overview:[],pipeline:'library'};
    await expect(generateLibraryPlan(state,'key','',()=>{},undefined,{draft,save:async()=>{}})).rejects.toThrow('different generation inputs');expect(fetch).not.toHaveBeenCalled();
  });
  it('returns an unresolved parameter/calendar conflict to the LLM for one bounded outline rebuild',async()=>{
    const state=emptyState();state.event=fixturePlan().event;const longBlocks=blocks();longBlocks[0]!.parameters.workSeconds=2700;
    const repaired=outline();repaired.patterns[0]!.days=['REST','easy','easy','easy','REST','easy','EVENT'];
    (fetch as jest.Mock).mockResolvedValueOnce(response(outline())).mockResolvedValueOnce(response({blocks:longBlocks})).mockResolvedValueOnce(response({blocks:longBlocks})).mockResolvedValueOnce(response(repaired)).mockResolvedValueOnce(response({blocks:longBlocks}));
    const plan=await generateLibraryPlan(state,'key');expect(fetch).toHaveBeenCalledTimes(5);expect(plan.workouts[0]!.sport).toBe('rest');
    expect(JSON.parse((fetch as jest.Mock).mock.calls[3][1].body).messages[1].content).toContain('Monday exceeds 40');
  });
  it('preserves completed history and rejects unknown blocks, long weekday sessions and consecutive hard days',()=>{
    const state=emptyState();state.event=fixturePlan().event;state.plan=fixturePlan();state.plan.workouts[0]!.completed=true;
    const plan=assembleLibraryPlan(outline(),blocks(),library,state,'2027-04-05','2027-04-11');expect(plan.workouts[0]).toEqual(state.plan.workouts[0]);
    expect(()=>assembleLibraryPlan(outline(),[],library,state,'2027-04-05','2027-04-11')).toThrow('exactly one');
    const o=outline();o.variants[0]!.templateId='LONG_ENDURANCE';o.progressions[0]!.templateId='LONG_ENDURANCE';state.plan=null;
    expect(()=>assembleLibraryPlan(o,blocks(),library,state,'2027-04-05','2027-04-11')).toThrow('weekend');
    o.variants[0]!.templateId='TEMPO';o.progressions[0]!.templateId='TEMPO';expect(()=>assembleLibraryPlan(o,blocks(),library,state,'2027-04-05','2027-04-11')).toThrow('Consecutive hard');
  });
  it('covers a 27-week horizon with repeated patterns and a final partial event week using only two requests',async()=>{
    jest.setSystemTime(new Date('2026-10-07T12:00:00Z'));const state=emptyState();state.event=fixturePlan().event;const o=outline();
    o.patterns=[{id:'repeat',days:['easy','REST','easy','easy','REST','easy','easy']},{id:'event',days:['easy','REST','easy','easy','EVENT']}];
    o.weeks=Array.from({length:27},(_,i)=>({patternId:i===26?'event':'repeat',phase:i===26?'Taper':i%4===3?'Recovery':'Base',focus:'LLM-selected progression'}));
    (fetch as jest.Mock).mockResolvedValueOnce(response(o)).mockResolvedValueOnce(response({blocks:blocks()}));
    const plan=await generateLibraryPlan(state,'key');expect(fetch).toHaveBeenCalledTimes(2);expect(plan.workouts).toHaveLength(187);expect(plan.overview).toHaveLength(27);expect(plan.start).toBe('2026-10-07');expect(plan.end).toBe('2027-04-11');
  });
});
