import { ExpenseRepository } from './ExpenseRepository';
import { RecurringRepository } from './RecurringRepository';
import { toISODateString } from '../lib/date';

function computeNextDate(fromDateStr: string, frequency: string): string {
  const d = new Date(fromDateStr);
  if (isNaN(d.getTime())) return fromDateStr;

  // Normalize to local midnight for clean day arithmetic
  d.setHours(0, 0, 0, 0);

  const targetDay = d.getDate();

  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly': {
      d.setMonth(d.getMonth() + 1);
      // Clamp day overflow: Jan 31 → Feb 28 (not Mar 3)
      if (d.getDate() < targetDay) {
        d.setDate(0);
      }
      break;
    }
  }

  return toISODateString(d);
}

export const RecurringService = {
  computeNextDate,

  async generateMissedInstances(): Promise<number> {
    const templates = await RecurringRepository.getActiveTemplates();
    const today = toISODateString(new Date());
    let count = 0;

    for (const template of templates) {
      if (!template.last_generated_date) continue;

      let next = computeNextDate(template.last_generated_date, template.recurrence_frequency);
      let lastDate = template.last_generated_date;

      while (next <= today) {
        await ExpenseRepository.addExpenseInstance(
          {
            amount: template.amount,
            category_id: template.category_id,
            date: next,
            note: template.note || undefined,
            is_recurring: true,
            recurrence_frequency: template.recurrence_frequency,
          },
          template.id
        );
        count++;
        lastDate = next;
        next = computeNextDate(next, template.recurrence_frequency);
      }

      if (lastDate !== template.last_generated_date) {
        await RecurringRepository.updateLastGeneratedDate(template.id, lastDate);
      }
    }

    return count;
  },
};
