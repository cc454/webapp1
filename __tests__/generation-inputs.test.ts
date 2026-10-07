import { generationSignature } from '../src/llm';
import { stableInputJson, matchesGenerationInputs } from '../src/generationInputs';
import { emptyState } from '../src/defaults';
import { stateSchema } from '../src/types';
import { fixturePlan } from './fixtures';
describe('Generation input compatibility across persistence',()=>{
  it('compares nested values without depending on legacy JSON property order',()=>{
    const saved=JSON.stringify({model:'chosen',event:{date:'2027-04-11',name:'Race'},activities:[{seconds:1200,km:5}]});
    const expected=stableInputJson({activities:[{km:5,seconds:1200}],event:{name:'Race',date:'2027-04-11'},model:'chosen'});
    expect(matchesGenerationInputs(saved,expected)).toBe(true);
    expect(matchesGenerationInputs(saved,expected.replace('chosen','changed'))).toBe(false);
    expect(matchesGenerationInputs('damaged',expected)).toBe(false);
  });
  it('produces the same signature after Zod/SQLite round-trip ordering changes',()=>{
    const state=emptyState();state.event=fixturePlan().event;
    state.activities=[{distanceKm:5,durationSeconds:1200,name:'Run',startedAt:'2026-10-07',sport:'run',id:1}];
    const before=generationSignature(state,'',true), after=generationSignature(stateSchema.parse(JSON.parse(JSON.stringify(state))),'',true);
    expect(before).toBe(after);
    state.settings.workoutLibrary+='\nChanged guidance';expect(matchesGenerationInputs(before,generationSignature(state,'',true))).toBe(false);
  });
});
