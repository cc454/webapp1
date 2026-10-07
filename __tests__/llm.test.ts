import { askCoach, buildCoachContext, completion, generatePlan } from '../src/llm';
import { emptyState } from '../src/defaults';
import { fixturePlan } from './fixtures';
import { addDays } from '../src/dates';
const response = (content: string) => ({ ok: true, json: async () => ({ choices: [{ message: { content }, finish_reason: 'stop' }] }) });
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
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'partial' }, finish_reason: 'length' }] }) });
    await expect(completion('key', 'model', [])).rejects.toThrow('incomplete');
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
});
