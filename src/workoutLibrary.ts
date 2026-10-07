import { librarySchema, parameterNames, WorkoutLibrary, WorkoutParameters, parametersSchema } from './libraryTypes';
import type { Workout, GarminFitness } from './types';

export function parseWorkoutLibrary(markdown: string): WorkoutLibrary {
  if (markdown.length > 120000) throw new Error('Workout library must be at most 120,000 characters.');
  const blocks = [...markdown.matchAll(/^```json\s*\r?\n([\s\S]*?)^```\s*$/gm)];
  if (blocks.length !== 1) throw new Error('Workout library requires exactly one fenced ```json block.');
  let library: WorkoutLibrary;
  try { library = librarySchema.parse(JSON.parse(blocks[0]![1]!)); }
  catch (e) { throw new Error(`Invalid workout library: ${e instanceof Error ? e.message : 'invalid JSON'}`); }
  const ids = new Set<string>();
  for (const t of library.templates) {
    if (ids.has(t.id) || ['REST','EVENT'].includes(t.id)) throw new Error(`Duplicate or reserved template ID: ${t.id}`);
    ids.add(t.id);
    for (const sport of ['run','ride'] as const) {
      const config=t.sports[sport];
      for (const name of parameterNames) {
        const values=config.parameters[name];
        if (name !== 'intensityRpe' && values.some(v=>!Number.isInteger(v))) throw new Error(`${t.id}/${sport}: ${name} must use integer values.`);
        const maximum = name === 'sets' ? 3 : name === 'repetitions' ? 30 : name === 'intensityRpe' ? 10 : 21600;
        const minimum = ['workSeconds','sets','repetitions','intensityRpe'].includes(name) ? 1 : 0;
        if (values[0]<minimum || values[2]>maximum) throw new Error(`${t.id}/${sport}: ${name} is outside supported bounds.`);
      }
      if (sport==='run' && config.ftpPercent) throw new Error(`${t.id}: FTP targets apply to cycling only.`);
      if (config.ftpPercent && config.ftpPercent[2]>250) throw new Error(`${t.id}: FTP percentage exceeds supported range.`);
      const defaults = Object.fromEntries(parameterNames.map(k=>[k,config.parameters[k][1]])) as Omit<WorkoutParameters,'ftpPercent'>;
      validateParameters(t,sport,{...defaults,ftpPercent:config.ftpPercent?.[1]??null});
    }
  }
  return library;
}
export function validateParameters(template: WorkoutLibrary['templates'][number], sport: 'run'|'ride', input: WorkoutParameters) {
  const p=parametersSchema.parse(input), config=template.sports[sport];
  for (const name of parameterNames) {
    const [min,,max]=config.parameters[name];
    if (p[name]<min || p[name]>max) throw new Error(`${template.id}/${sport}: ${name} must be ${min}–${max}.`);
  }
  const work=p.workSeconds*p.repetitions*p.sets;
  if(config.totalWorkSeconds && (work<config.totalWorkSeconds[0] || work>config.totalWorkSeconds[1])) throw new Error(`${template.id}: total work must be ${config.totalWorkSeconds.join('–')} seconds.`);
  if(config.recoveryRatio && (p.recoverySeconds/p.workSeconds<config.recoveryRatio[0] || p.recoverySeconds/p.workSeconds>config.recoveryRatio[1])) throw new Error(`${template.id}: recovery/work ratio is outside library bounds.`);
  if(p.ftpPercent!==null && (!config.ftpPercent || p.ftpPercent<config.ftpPercent[0] || p.ftpPercent>config.ftpPercent[2])) throw new Error(`${template.id}/${sport}: FTP target is outside library bounds.`);
  if(template.structure!=='interval' && (p.repetitions!==1 || p.sets!==1 || p.recoverySeconds || p.setRecoverySeconds)) throw new Error(`${template.id}: continuous/progressive sessions cannot contain intervals.`);
  if(template.structure!=='progressive' && p.finishSeconds) throw new Error(`${template.id}: only progressive sessions have a moderate finish.`);
  const duration=p.warmupSeconds+p.sets*(p.repetitions*p.workSeconds+(p.repetitions-1)*p.recoverySeconds)+(p.sets-1)*p.setRecoverySeconds+p.finishSeconds+p.cooldownSeconds;
  if(duration>21600)throw new Error(`${template.id}: a library session cannot exceed six hours.`);
  return p;
}
export function instantiateWorkout(template: WorkoutLibrary['templates'][number], sport: 'run'|'ride', parameters: WorkoutParameters, date: string, distanceKm: number, fitness: GarminFitness): Workout {
  const p=validateParameters(template,sport,parameters);
  const ftp=fitness.power?.ftpW;
  const target = `${p.intensityRpe}/10 RPE${sport==='ride' && p.ftpPercent!==null ? ` · ${p.ftpPercent}% FTP${ftp ? ` (${Math.round(ftp*p.ftpPercent/100)} W)` : ''}` : ''}`;
  const steps: Workout['steps']=[];
  const push=(kind: Workout['steps'][number]['kind'],seconds:number,target:string)=>{if(seconds)steps.push({kind,seconds,repeats:1,target});};
  push('warmup',p.warmupSeconds,'Easy, gradually increasing effort');
  for(let set=0;set<p.sets;set++) {
    for(let rep=0;rep<p.repetitions;rep++) {push('work',p.workSeconds,target);if(rep<p.repetitions-1)push('recovery',p.recoverySeconds,'Easy recovery');}
    if(set<p.sets-1)push('recovery',p.setRecoverySeconds,'Easy recovery between sets');
  }
  push('work',p.finishSeconds,'Moderate, controlled finish');push('cooldown',p.cooldownSeconds,'Easy cooldown');
  return {id:`${date}-${sport}`,date,title:template.name,detail:`${template.goal}. ${template.sports[sport].targetCue}`,sport,
    durationSeconds:steps.reduce((n,s)=>n+s.seconds,0),distanceKm,intensity:template.intensity,long:template.long,completed:false,steps,
    templateId:template.id,parameters:p};
}
