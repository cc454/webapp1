import { generatePlan, generationSignature, normalizeGeneratedBatch } from '../src/llm';
import { emptyState } from '../src/defaults';
import { GenerationDraft } from '../src/types';
import { fixturePlan } from './fixtures';
import { addDays } from '../src/dates';
import { checkedPlan } from '../src/plan';
const response = (plan: unknown) => ({ok:true,text:async()=>JSON.stringify({choices:[{message:{content:JSON.stringify(plan)},finish_reason:'stop'}]})});
describe('Late-week failure and durable generation',()=>{
  beforeEach(()=>{global.fetch=jest.fn();jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));});
  afterEach(()=>jest.useRealTimers());
  it('calculates interval totals locally, including repeats, without another paid repair',async()=>{
    const state=emptyState();state.event=fixturePlan().event;
    const plan=fixturePlan();const workout=plan.workouts.find(w=>w.date==='2027-04-08')!;
    workout.durationSeconds=3600;workout.steps=[{kind:'warmup',seconds:300,repeats:1,target:'easy'},{kind:'work',seconds:600,repeats:2,target:'comfortable'},{kind:'cooldown',seconds:300,repeats:1,target:'easy'}];
    (fetch as jest.Mock).mockResolvedValue(response(plan));
    const result=await generatePlan(state,'key');expect(result.workouts.find(w=>w.date==='2027-04-08')!.durationSeconds).toBe(1800);expect(fetch).toHaveBeenCalledTimes(1);expect(state.plan).toBeNull();
  });
  it('still rejects a Monday whose derived step total exceeds the cap',()=>{
    const plan=fixturePlan();plan.workouts[0]!.steps=[{kind:'work',seconds:3000,repeats:1,target:'easy'}];
    expect(()=>checkedPlan(normalizeGeneratedBatch(plan))).toThrow('Monday exceeds 40');
  });
  it('retains successful weeks and resumes only the failed week, even on the next day',async()=>{
    const first=fixturePlan();const second=fixturePlan();second.start=addDays(second.start,7);second.end=addDays(second.end,7);
    second.workouts=second.workouts.map(w=>({...w,date:addDays(w.date,7),id:addDays(w.date,7)}));second.overview=second.overview.map(w=>({...w,start:addDays(w.start,7),end:addDays(w.end,7)}));
    const state=emptyState();state.event={...first.event,date:second.end};
    let draft:GenerationDraft|null=null;const save=jest.fn(async (value:GenerationDraft)=>{draft=JSON.parse(JSON.stringify(value));});
    const broken={...second,workouts:second.workouts.slice(1)};
    (fetch as jest.Mock).mockResolvedValueOnce(response(first)).mockResolvedValue(response(broken));
    await expect(generatePlan(state,'key','',()=>{},undefined,{draft:null,save})).rejects.toThrow('Validated weeks remain');
    expect(draft!.overview).toHaveLength(1);expect(draft!.workouts).toHaveLength(7);expect(state.plan).toBeNull();
    jest.setSystemTime(new Date('2027-04-06T12:00:00Z'));(fetch as jest.Mock).mockReset().mockResolvedValue(response(second));
    const result=await generatePlan(state,'key','',()=>{},undefined,{draft,save});
    expect(fetch).toHaveBeenCalledTimes(1);expect(result.start).toBe('2027-04-05');expect(result.workouts).toHaveLength(14);expect(state.plan).toBeNull();
    (fetch as jest.Mock).mockClear();await generatePlan(state,'key','',()=>{},undefined,{draft,save});expect(fetch).not.toHaveBeenCalled();
  });
  it('refuses a checkpoint from changed inputs before making a paid request',async()=>{
    const state=emptyState();state.event=fixturePlan().event;
    const draft:GenerationDraft={version:1,request:'',signature:generationSignature(state,''),start:'2027-04-05',end:'2027-04-11',workouts:[],overview:[]};
    state.settings.rules.mondayMaxMinutes=20;
    await expect(generatePlan(state,'key','',()=>{},undefined,{draft,save:jest.fn()})).rejects.toThrow('different generation inputs');expect(fetch).not.toHaveBeenCalled();
  });
  it('does not put API keys or the Garmin account identifier in draft signatures',()=>{
    const state=emptyState();state.settings.garminEmail='private@example.com';expect(generationSignature(state,'')).not.toContain('private@example.com');
  });
  it('reduces generation context while preserving the selected model and athlete metrics',async()=>{
    const state=emptyState();state.event=fixturePlan().event;state.settings.model='chosen/model';
    state.activities=[{id:987654321,name:'verbose activity title',sport:'run',startedAt:'2027-04-01T09:00:00Z',distanceKm:8,durationSeconds:2400,averageHeartRate:140}];
    (fetch as jest.Mock).mockResolvedValue(response(fixturePlan()));
    await generatePlan(state,'key');
    const body=JSON.parse((fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.model).toBe('chosen/model');
    expect(body.messages[0].content).toContain('"km":8');
    expect(body.messages[0].content).toContain('"hr":140');
    expect(body.messages[0].content).not.toContain('verbose activity title');
    expect(body.messages[0].content).not.toContain('987654321');
    expect(body.messages[1].content).toContain('concise, at most 2 sentences');
    expect(body.messages[1].content).toContain('Prior generated sessions: []');
  });
});
