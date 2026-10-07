import { Plan } from './types';
import { checkedPlan } from './plan';
export function encodeBackup(plan: Plan) {
  return JSON.stringify({ format: 'stride-ai-plan', version: 1, plan: checkedPlan(plan) }, null, 2);
}
export function decodeBackup(text: string): Plan {
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('This is not a valid JSON backup.'); }
  if (value?.format !== 'stride-ai-plan' || value.version !== 1) throw new Error('Unsupported backup format or version. Your current plan was not changed.');
  return checkedPlan(value.plan);
}
