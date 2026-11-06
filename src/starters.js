/** Starter habits offered when the vault has no habits yet. */
import { DEFAULT_COLOR } from './constants.js';
import { isoDate } from './dates.js';
import { t } from './i18n.js';

const base = () => ({
  description: '',
  category: 'Health',
  direction: 'build',
  days: [],
  unit: 'time',
  cue: '',
  reward: '',
  startDate: isoDate(),
  endDate: ''
});

/** Five small habits that cover count, check, weekly and a clock time. */
export function starterHabits() {
  return [
    {
      ...base(),
      title: t('Drink water'),
      description: t('Eight glasses across the day.'),
      period: 'morning',
      frequency: 'daily',
      target: 8,
      unit: t('glass'),
      icon: 'glass-water',
      color: '#0891b2'
    },
    {
      ...base(),
      title: t('Walk 20 minutes'),
      period: 'afternoon',
      frequency: 'daily',
      target: 1,
      icon: 'footprints',
      color: '#059669'
    },
    {
      ...base(),
      title: t('Read 10 pages'),
      period: 'evening',
      frequency: 'daily',
      target: 10,
      unit: t('page'),
      icon: 'book-open',
      color: '#d97706'
    },
    {
      ...base(),
      title: t('Workout 3 times a week'),
      period: 'anytime',
      frequency: 'weekly',
      target: 3,
      icon: 'dumbbell',
      color: '#7c3aed'
    },
    {
      ...base(),
      title: t('Sleep before 23:00'),
      category: 'Personal',
      period: 'evening',
      time: '23:00',
      frequency: 'daily',
      target: 1,
      icon: 'bed',
      color: '#2563eb'
    }
  ].map((habit) => ({ ...habit, color: habit.color || DEFAULT_COLOR }));
}
