// These are editable starting protocols supplied by the owner, not universal prescriptions.
const range = (min: number, value: number, max: number) => [min, value, max];
const continuous = (min: number, value: number, max: number, rpe = [2, 3, 4]) => ({
  warmupSeconds: range(0, 0, 0), workSeconds: range(min, value, max), repetitions: range(1, 1, 1),
  recoverySeconds: range(0, 0, 0), sets: range(1, 1, 1), setRecoverySeconds: range(0, 0, 0),
  cooldownSeconds: range(0, 0, 0), finishSeconds: range(0, 0, 0), intensityRpe: rpe,
});
const intervals = (reps: number[], work: number[], recovery: number[], rpe: number[]) => ({
  ...continuous(1, 1, 1), warmupSeconds: range(480, 600, 1200), cooldownSeconds: range(300, 420, 900),
  repetitions: reps, workSeconds: work, recoverySeconds: recovery, intensityRpe: rpe,
});
function protocol(id: string, name: string, goal: string, structure: 'continuous' | 'interval' | 'progressive', intensity: 'easy' | 'hard', run: object, ride: object, workTime: number[] | null = null, ratio: number[] | null = null, ftp: number[] | null = null, progression = 'Increase duration gradually when appropriate; the LLM chooses recovery and tapering.') {
  return { id, name, goal, structure, intensity, long: id === 'LONG_ENDURANCE', progression,
    sports: {
      run: { parameters: run, totalWorkSeconds: workTime, recoveryRatio: ratio, ftpPercent: null, targetCue: id === 'SPRINT' ? 'Controlled strides or short hill accelerations; full recovery.' : 'Use running-specific pace/HR where known; RPE is the fallback. Easy means conversational, below LT1/VT1 where known.' },
      ride: { parameters: ride, totalWorkSeconds: workTime, recoveryRatio: ratio, ftpPercent: ftp, targetCue: 'Use cycling power where available; RPE is the fallback. Do not equate cycling power with running pace.' },
    } };
}
const library = { version: 1, templates: [
  protocol('ENDURANCE', 'Easy endurance', 'Aerobic base', 'continuous', 'easy', continuous(1800, 2700, 5400), continuous(2700, 3600, 10800), null, null, [55, 65, 75]),
  protocol('LONG_ENDURANCE', 'Long easy', 'Aerobic capacity and durability', 'continuous', 'easy', continuous(3600, 5400, 10800), continuous(7200, 10800, 21600), null, null, [55, 65, 75]),
  protocol('TEMPO', 'Tempo', 'Sustainable speed or power', 'interval', 'hard', intervals([2, 3, 4], [600, 600, 1800], [120, 180, 300], [5, 6, 7]), intervals([2, 3, 4], [600, 900, 1800], [120, 180, 300], [5, 6, 7]), null, null, [76, 85, 90], 'Increase work duration or repetitions before intensity. Planner selects race specificity and recovery.'),
  protocol('THRESHOLD', 'Threshold', 'LT2 / FTP / race-specific endurance', 'interval', 'hard', intervals([3, 4, 6], [360, 600, 900], [120, 180, 240], [6, 7, 8]), intervals([3, 4, 6], [360, 600, 900], [120, 180, 240], [6, 7, 8]), null, null, [91, 97, 105], 'Increase repetitions or work duration before intensity. Running uses threshold-specific effort, not FTP percentages.'),
  protocol('VO2_LONG', 'Long VO₂ intervals', 'VO₂max / aerobic power', 'interval', 'hard', intervals([3, 4, 6], [180, 240, 300], [90, 180, 300], [8, 8, 9]), intervals([3, 4, 6], [180, 240, 300], [90, 180, 300], [8, 8, 9]), [720, 1500], [0.5, 1], [105, 110, 120], 'Increase repetitions, then work duration, then reduce recovery within bounds. Do not increase intensity first. Example 4×4 → 5×4 → 4×5; LLM decides deload.'),
  protocol('VO2_SHORT', 'Short VO₂ intervals', 'Time near VO₂max', 'interval', 'hard', { ...intervals([10, 10, 30], [30, 30, 90], [15, 30, 90], [8, 8, 9]), sets: [1, 2, 3], setRecoverySeconds: [120, 180, 300] }, { ...intervals([10, 10, 30], [30, 30, 90], [15, 30, 90], [8, 8, 9]), sets: [1, 2, 3], setRecoverySeconds: [120, 180, 300] }, [600, 1200], [1 / 3, 1], null, 'Use 30/30, 40/20 or 60/30-style parameters within bounds; increase total work before intensity.'),
  protocol('SPRINT', 'Neuromuscular sprints', 'Speed / power / coordination', 'interval', 'hard', intervals([4, 6, 10], [6, 10, 15], [90, 180, 300], [8, 9, 10]), intervals([4, 6, 10], [6, 10, 15], [90, 180, 300], [9, 10, 10]), null, null, null, 'Preserve long recovery and short efforts. Running favors controlled strides/hills; do not turn this into VO₂ or Wingate training.'),
  protocol('ANAEROBIC', 'Hard short intervals', 'Anaerobic capacity', 'interval', 'hard', intervals([4, 6, 10], [30, 45, 60], [90, 180, 240], [9, 9, 10]), intervals([4, 6, 10], [30, 45, 60], [90, 180, 240], [9, 9, 10]), null, null, null, 'Use selectively for the event and athlete; preserve recovery. Not the default endurance stimulus.'),
  protocol('PROGRESSIVE', 'Progressive endurance', 'Aerobic endurance and fatigue resistance', 'progressive', 'hard', { ...continuous(1200, 1800, 3600), finishSeconds: [300, 600, 1800], cooldownSeconds: [180, 300, 600] }, { ...continuous(1800, 2700, 7200), finishSeconds: [300, 900, 1800], cooldownSeconds: [180, 300, 600] }, null, null, [55, 65, 75], 'Begin easy and finish moderate/controlled; do not turn every finish into a maximal effort. Conservatively counts as hard for scheduling.'),
  protocol('RECOVERY', 'Recovery', 'Recovery / circulation', 'continuous', 'easy', continuous(1200, 1800, 3600, [1, 2, 3]), continuous(1200, 1800, 3600, [1, 2, 3]), null, null, [40, 50, 55], 'Keep very easy. The LLM chooses recovery days/weeks; a recovery session does not replace a required rest day.'),
] };
export const defaultWorkoutLibrary = `# Workout library

Ten shared stimuli with separate running and cycling prescriptions. Edit this Markdown file, then import it in Workout Library. The single JSON block is the source used by the planner. Ranges are [minimum, default, maximum]; times are seconds and RPE is 1–10. Recovery occurs BETWEEN repetitions, and set recovery BETWEEN sets; no recovery follows the final repetition. Total duration includes warmup, work, recoveries, finish and cooldown.

Defaults are starting protocols from the owner's specification, not a required training distribution. The LLM chooses progression, recovery, tapering, sport-specific parameters and conflict resolution. Library bounds constrain execution; no fixed 80/20 rule is imposed. Rest and the target event are calendar entries outside the ten training primitives. FTP percentages are cycling-only; missing FTP does not invent watts. Moderate/hard templates conservatively count as hard for scheduling.

Evidence context (these reviews do not establish every exact parameter range below):
- [Training intensity distributions](https://pubmed.ncbi.nlm.nih.gov/38717713/)
- [Running intensity distribution](https://pubmed.ncbi.nlm.nih.gov/34749417/)
- Owner-provided additional references: https://pubmed.ncbi.nlm.nih.gov/41740126/ , https://pubmed.ncbi.nlm.nih.gov/36165995/ , https://pubmed.ncbi.nlm.nih.gov/39788807/

\`\`\`json
${JSON.stringify(library, null, 2)}
\`\`\`
`;
