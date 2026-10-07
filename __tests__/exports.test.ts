import { ics, markdown, pdfHtml, safeFilename } from '../src/exportContent';
import { fixturePlan, session } from './fixtures';
describe('AT-33–34: export content', () => {
  it('uses stored dates across year boundaries, stable IDs, and escaped text', () => {
    const plan = fixturePlan(); const w = session('2026-12-31'); w.title = 'Ride, then; rest'; w.detail = 'First\nSecond';
    const text = ics(plan.event, [w], new Date('2026-12-30T12:00:00Z'));
    expect(text).toContain('DTSTART;VALUE=DATE:20261231'); expect(text).toContain('Ride\\, then\\; rest'); expect(text).toContain('First\\nSecond');
    expect(text).toContain('DTSTAMP:20261230T120000Z'); expect(text).toContain('END:VCALENDAR\r\n');
    expect(text.match(/UID:.*/)?.[0]).toBe(ics(plan.event, [w]).match(/UID:.*/)?.[0]);
  });
  it('escapes HTML and creates safe filenames', () => {
    const plan = fixturePlan(); plan.event.name = '<script>bad</script> / Race';
    expect(pdfHtml(plan.event, plan.workouts)).not.toContain('<script>'); expect(pdfHtml(plan.event, plan.workouts)).toContain('&lt;script&gt;');
    expect(safeFilename('../Race/:*?')).not.toMatch(/[/:*?]/); expect(markdown(plan.event, plan.workouts)).toContain('2027-04-05');
  });
  it('folds long unicode lines to at most 75 UTF-8 bytes', () => {
    const plan = fixturePlan(); plan.workouts[0]!.detail = 'é😊'.repeat(100);
    for (const line of ics(plan.event, plan.workouts).split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });
});
