import { readFileSync } from 'fs';
import { defaultWorkoutLibrary } from '../src/workoutLibraryDefaults';
import { parseWorkoutLibrary, instantiateWorkout, validateParameters } from '../src/workoutLibrary';
import { parameterNames, WorkoutParameters } from '../src/libraryTypes';
import { emptyState } from '../src/defaults';
import { stateSchema } from '../src/types';
const library=parseWorkoutLibrary(defaultWorkoutLibrary);
export const defaultParameters=(id:string,sport:'run'|'ride'='run'):WorkoutParameters=>{
  const config=library.templates.find(t=>t.id===id)!.sports[sport];
  return {...Object.fromEntries(parameterNames.map(k=>[k,config.parameters[k][1]])),ftpPercent:config.ftpPercent?.[1]??null} as WorkoutParameters;
};
describe('Editable workout primitives',()=>{
  it('ships exactly the ten requested categories and matches the editable Markdown file',()=>{
    expect(library.templates.map(t=>t.id)).toEqual(['ENDURANCE','LONG_ENDURANCE','TEMPO','THRESHOLD','VO2_LONG','VO2_SHORT','SPRINT','ANAEROBIC','PROGRESSIVE','RECOVERY']);
    expect(readFileSync('training/workouts.md','utf8')).toBe(defaultWorkoutLibrary);
    for(const t of library.templates)for(const sport of ['run','ride'] as const)expect(()=>validateParameters(t,sport,defaultParameters(t.id,sport))).not.toThrow();
  });
  it('migrates legacy settings without replacing plan, chats or credentials',()=>{
    const old=JSON.parse(JSON.stringify(emptyState()));delete old.settings.workoutLibrary;old.settings.garminEmail='keep@example.com';
    const loaded=stateSchema.parse(old);expect(loaded.settings.workoutLibrary).toBe(defaultWorkoutLibrary);expect(loaded.settings.garminEmail).toBe('keep@example.com');
  });
  it('rejects malformed Markdown, multiple blocks, duplicate IDs and inverted ranges',()=>{
    expect(()=>parseWorkoutLibrary('# no JSON')).toThrow('exactly one');expect(()=>parseWorkoutLibrary(defaultWorkoutLibrary+defaultWorkoutLibrary)).toThrow('exactly one');
    const edit=JSON.parse(JSON.stringify(library));edit.templates[1].id='ENDURANCE';expect(()=>parseWorkoutLibrary('```json\n'+JSON.stringify(edit)+'\n```')).toThrow('Duplicate');
    edit.templates[1].id='LONG_ENDURANCE';edit.templates[0].sports.run.parameters.workSeconds=[3000,2000,1000];expect(()=>parseWorkoutLibrary('```json\n'+JSON.stringify(edit)+'\n```')).toThrow('Range');
  });
  it('requires defaults to be valid coupled protocols and forbids cycling targets on runs',()=>{
    const edit=JSON.parse(JSON.stringify(library));edit.templates[4].sports.run.parameters.repetitions=[3,3,6];edit.templates[4].sports.run.parameters.workSeconds=[180,180,300];
    expect(()=>parseWorkoutLibrary('```json\n'+JSON.stringify(edit)+'\n```')).toThrow('total work');
    expect(()=>validateParameters(library.templates[0]!,'run',{...defaultParameters('ENDURANCE'),ftpPercent:65})).toThrow('FTP');
  });
  it('uses recovery between repetitions and sets, never after the final repetition',()=>{
    const t=library.templates.find(t=>t.id==='VO2_LONG')!,p=defaultParameters(t.id),w=instantiateWorkout(t,'run',p,'2027-04-08',5,emptyState().fitness);
    expect(w.durationSeconds).toBe(600+4*240+3*180+420);expect(w.steps.filter(s=>s.kind==='recovery')).toHaveLength(3);
    const short=library.templates.find(t=>t.id==='VO2_SHORT')!,s=instantiateWorkout(short,'run',defaultParameters(short.id),'2027-04-08',5,emptyState().fitness);
    expect(s.durationSeconds).toBe(600+2*(10*30+9*30)+180+420);
  });
  it('checks total hard work, recovery ratio, bounds and discrete counts',()=>{
    const t=library.templates.find(t=>t.id==='VO2_LONG')!,p=defaultParameters(t.id);
    expect(()=>validateParameters(t,'run',{...p,repetitions:6,workSeconds:300})).toThrow('total work');
    expect(()=>validateParameters(t,'run',{...p,recoverySeconds:90})).toThrow('ratio');
    expect(()=>validateParameters(t,'run',{...p,workSeconds:600})).toThrow('workSeconds');
    expect(()=>validateParameters(t,'run',{...p,repetitions:3.5})).toThrow();
  });
  it('uses measured cycling FTP for watts and leaves missing FTP unconverted',()=>{
    const t=library.templates[0]!,p=defaultParameters(t.id,'ride');const fitness={...emptyState().fitness,power:{ftpW:200,wattsPerKg:3,date:null,fetchedAt:'now'}};
    expect(instantiateWorkout(t,'ride',p,'2027-04-08',20,fitness).steps[0]!.target).toContain('130 W');
    expect(instantiateWorkout(t,'ride',p,'2027-04-08',20,emptyState().fitness).steps[0]!.target).not.toContain(' W)');
  });
});
