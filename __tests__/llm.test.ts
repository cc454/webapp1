import { askCoach, buildCoachContext, completion, decodeCompletion, generatePlan } from '../src/llm';
import { emptyState } from '../src/defaults';
import { fixturePlan } from './fixtures';
import { addDays, datesBetween } from '../src/dates';
const response = (content: string) => ({ ok: true, text: async () => JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }) });
describe('AT-07,19–24,40: OpenRouter', () => {
  beforeEach(() => { global.fetch = jest.fn(); });
  it('bounds guidance and includes baseline/current plan without credential fields', () => {
    const state = emptyState(); state.event = fixturePlan().event; state.plan = fixturePlan(); state.settings.research = 'r'.repeat(20001); state.settings.constraints = 'c'.repeat(20001);
    const context = buildCoachContext(state);
    expect(context).toContain('Never diagnose'); expect(context).toContain('CURRENT PLAN'); expect(context).toContain('unknown');
    expect(context).not.toContain('r'.repeat(20001)); expect(context).not.toContain('c'.repeat(20001)); expect(context).not.toContain('garminEmail');
  });
  it('blocks network without a configured key', async () => {
    await expect(askCoach('Help', emptyState(), '')).rejects.toThrow('API key');
    await expect(generatePlan(emptyState(), '')).rejects.toThrow('API key'); expect(fetch).not.toHaveBeenCalled();
  });
  it('uses OpenRouter bearer authentication, model, and recent messages', async () => {
    (fetch as jest.Mock).mockResolvedValue(response('Run easy.'));
    const state = emptyState(); state.settings.model = 'chosen/model';
    await expect(askCoach('Help', state, 'secret', [{ role: 'user', content: 'Prior', at: 'now' }])).resolves.toBe('Run easy.');
    const [url, options] = (fetch as jest.Mock).mock.calls[0]; const body = JSON.parse(options.body);
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions'); expect(options.headers.Authorization).toBe('Bearer secret');
    expect(body.model).toBe('chosen/model'); expect(options.body).not.toContain('secret'); expect(body.messages[1].content).toBe('Prior');
  });
  it.each([401, 402, 404, 429, 500])('surfaces HTTP %s without leaking response text', async status => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, status }); await expect(completion('key', 'model', [])).rejects.toThrow(/OpenRouter|model/);
  });
  it('rejects incomplete responses', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, text: async () => JSON.stringify({ choices: [{ message: { content: 'partial' }, finish_reason: 'length' }] }) });
    await expect(completion('key', 'model', [])).rejects.toThrow('incomplete');
  });
  it('falls back from unavailable structured output to locally validated JSON', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 400 }).mockResolvedValueOnce(response('{"value":1}'));
    await expect(completion('key', 'model', [], { type: 'object' })).resolves.toBe('{"value":1}');
    const fallback = JSON.parse((fetch as jest.Mock).mock.calls[1][1].body);
    expect(fallback.response_format).toBeUndefined(); expect(fallback.messages[0].content).toContain('Return only a JSON object');
  });
  it('reads complete SSE with keep-alives, CRLF, and escaped JSON fragments', () => {
    const stream = ': OPENROUTER PROCESSING\r\n\r\ndata: '+JSON.stringify({choices:[{index:0,delta:{content:'{"a":'}}]})+'\r\n\r\ndata: '+JSON.stringify({choices:[{index:0,delta:{content:'1}'},finish_reason:'stop'}]})+'\r\n\r\ndata: [DONE]\r\n\r\n';
    expect(decodeCompletion(stream)).toBe('{"a":1}');
  });
  it.each(['', '{"choices":', 'data: {"choices":[]}\n\n', 'data: {"choices":[{"delta":{"content":"partial"}}]}\n\ndata: [DONE]\n\n'])('rejects empty/truncated envelope or unfinished stream %s', raw => {
    expect(() => decodeCompletion(raw)).toThrow('incomplete');
  });
  it('handles HTTP 200 provider errors without accepting partial text or exposing metadata', () => {
    expect(() => decodeCompletion(JSON.stringify({error:{code:429,message:'private provider details'}}))).toThrow('rate limit');
    expect(() => decodeCompletion('data: {"error":{"code":502},"choices":[{"delta":{"content":"partial"}}]}\n\n')).toThrow('502');
  });
  it('retries an empty response once and still produces a validated unsaved proposal', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));
    const state = emptyState(); state.event = fixturePlan().event;
    (fetch as jest.Mock).mockResolvedValueOnce({ok:true,text:async()=>''}).mockResolvedValueOnce(response(JSON.stringify(fixturePlan())));
    expect((await generatePlan(state, 'key')).workouts).toHaveLength(7);
    expect(fetch).toHaveBeenCalledTimes(2); expect(state.plan).toBeNull();
    expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).stream).toBe(true); jest.useRealTimers();
  });
  it('bounds transport retries and preserves the saved plan on repeated truncation', async () => {
    (fetch as jest.Mock).mockResolvedValue({ok:true,text:async()=>'{'});
    await expect(completion('key','model',[],{type:'object'})).rejects.toThrow('incomplete'); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('repairs an invalid weekly response before offering a proposal', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));
    const state = emptyState(); state.event = fixturePlan().event;
    const invalid = fixturePlan(); invalid.workouts.pop();
    (fetch as jest.Mock).mockResolvedValueOnce(response(JSON.stringify(invalid))).mockResolvedValueOnce(response(JSON.stringify(fixturePlan())));
    const progress = jest.fn(); const result = await generatePlan(state, 'key', '', progress);
    expect(result.workouts).toHaveLength(7); expect(fetch).toHaveBeenCalledTimes(2); expect(state.plan).toBeNull();
    expect(progress).toHaveBeenCalledWith('Repairing week 1 (1/2)…'); jest.useRealTimers();
  });
  it('assembles a validated proposal without altering saved state', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));
    const state = emptyState(); state.event = fixturePlan().event;
    (fetch as jest.Mock).mockResolvedValue(response(JSON.stringify(fixturePlan())));
    const proposed = await generatePlan(state, 'key'); expect(proposed.workouts).toHaveLength(7); expect(state.plan).toBeNull();
    expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).response_format.type).toBe('json_schema'); jest.useRealTimers();
  });
  it('rejects invalid AI plans instead of saving them', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));
    const state = emptyState(); state.event = fixturePlan().event; const plan = fixturePlan(); plan.workouts.pop();
    (fetch as jest.Mock).mockResolvedValue(response(JSON.stringify(plan)));
    await expect(generatePlan(state, 'key')).rejects.toThrow('Missing day'); expect(state.plan).toBeNull(); jest.useRealTimers();
  });
  it('assembles multiple weekly batches while preserving the actual event', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2027-04-05T12:00:00Z'));
    const first = fixturePlan(); const second = fixturePlan();
    second.start = addDays(second.start, 7); second.end = addDays(second.end, 7);
    second.workouts = second.workouts.map(w => ({ ...w, date: addDays(w.date, 7), id: `${addDays(w.date, 7)}-${w.sport}` }));
    second.overview = second.overview.map(w => ({ ...w, start: addDays(w.start, 7), end: addDays(w.end, 7) }));
    const state = emptyState(); state.event = { ...first.event, date: second.end };
    (fetch as jest.Mock).mockResolvedValueOnce(response(JSON.stringify(first))).mockResolvedValueOnce(response(JSON.stringify(second)));
    const proposed = await generatePlan(state, 'key');
    expect(proposed.workouts).toHaveLength(14); expect(proposed.event.date).toBe('2027-04-18'); expect(proposed.overview).toHaveLength(2);
    expect(state.plan).toBeNull(); expect(fetch).toHaveBeenCalledTimes(2);
    const requestSchema = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body).response_format.json_schema.schema;
    expect(requestSchema.properties.event).toBeUndefined(); jest.useRealTimers();
  });
  it('covers the actual creation-to-event horizon across 27 weekly requests', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-07T12:00:00Z'));
    const state=emptyState(); state.event=fixturePlan().event;
    const days=datesBetween('2026-10-07',state.event.date);
    const batches=[];
    for(let i=0;i<days.length;i+=7) {
      const batch=fixturePlan(); batch.start=days[i]!; batch.end=days[Math.min(i+6,days.length-1)]!;
      batch.workouts=batch.workouts.slice(0,Math.min(7,days.length-i)).map((w,j)=>({...w,date:days[i+j]!,id:days[i+j]!}));
      batch.overview=[{...batch.overview[0]!,start:batch.start,end:batch.end,runningKm:batch.workouts.filter(w=>w.sport==='run').reduce((n,w)=>n+w.distanceKm,0),cyclingKm:batch.workouts.filter(w=>w.sport==='ride').reduce((n,w)=>n+w.distanceKm,0)}];
      batches.push(batch);
    }
    for(const batch of batches) (fetch as jest.Mock).mockResolvedValueOnce(response(JSON.stringify(batch)));
    const proposed=await generatePlan(state,'key');
    expect(proposed.workouts.map(w=>w.date)).toEqual(days); expect(proposed.overview).toHaveLength(27); expect(state.plan).toBeNull(); jest.useRealTimers();
  });
});
