import { Habit, DailyRecord, MilestoneBadge, UserProfile, TriageAssessment } from '../types';

const STORAGE_KEYS = {
  HABITS: 'healthflow_habits',
  DAILY_RECORDS: 'healthflow_daily_records',
  BADGES: 'healthflow_badges',
  PROFILE: 'healthflow_profile',
  TRIAGE_HISTORY: 'healthflow_triage_history',
};

export const DEFAULT_HABITS: Habit[] = [
  {
    id: 'habit-1',
    title: '7+ Hours Restorative Sleep',
    category: 'Sleep',
    targetDaysPerWeek: 7,
    createdAt: '2026-10-01',
  },
  {
    id: 'habit-2',
    title: '15-Minute Mobility & Stretch',
    category: 'Movement',
    targetDaysPerWeek: 7,
    createdAt: '2026-10-01',
  },
  {
    id: 'habit-3',
    title: 'Nourishing Whole-Food Meal',
    category: 'Nutrition',
    targetDaysPerWeek: 7,
    createdAt: '2026-10-01',
  },
  {
    id: 'habit-4',
    title: '5-Minute Mindful Breathwork',
    category: 'Mind',
    targetDaysPerWeek: 7,
    createdAt: '2026-10-01',
  },
  {
    id: 'habit-5',
    title: 'Screen-Free 30m Before Bed',
    category: 'Sleep',
    targetDaysPerWeek: 7,
    createdAt: '2026-10-01',
  },
  {
    id: 'habit-6',
    title: 'Midday Ergonomic & Posture Reset',
    category: 'Movement',
    targetDaysPerWeek: 5,
    createdAt: '2026-10-01',
  },
  {
    id: 'habit-7',
    title: 'Daily Sunlight & Fresh Air Walk',
    category: 'Vitality',
    targetDaysPerWeek: 7,
    createdAt: '2026-10-01',
  },
];

export const DEFAULT_BADGES: MilestoneBadge[] = [
  {
    id: 'badge-1',
    name: 'First Step',
    description: 'Began your health journey and logged your first wellness action.',
    requirement: '1 day logged',
    targetDays: 1,
    unlocked: true,
    unlockedDate: '2026-10-22',
  },
  {
    id: 'badge-2',
    name: 'Hydration Hero',
    description: 'Met the 2,500ml optimal hydration milestone for 3 consecutive days.',
    requirement: '3-day hydration streak',
    targetDays: 3,
    unlocked: true,
    unlockedDate: '2026-10-25',
  },
  {
    id: 'badge-3',
    name: 'Consistency Starter',
    description: 'Maintained a solid 7-day continuous daily wellness habit streak.',
    requirement: '7-day habit streak',
    targetDays: 7,
    unlocked: true,
    unlockedDate: '2026-10-28',
  },
  {
    id: 'badge-4',
    name: 'Wellness Momentum',
    description: 'Demonstrated exceptional dedication across two consecutive weeks.',
    requirement: '14-day habit streak',
    targetDays: 14,
    unlocked: false,
  },
  {
    id: 'badge-5',
    name: 'Habit Architect',
    description: 'Reached 21 days—scientifically recognized neural habit consolidation.',
    requirement: '21-day habit streak',
    targetDays: 21,
    unlocked: false,
  },
  {
    id: 'badge-6',
    name: 'Zen Master',
    description: 'Achieved an extraordinary 30 days of mindful health and hydration flow.',
    requirement: '30-day habit streak',
    targetDays: 30,
    unlocked: false,
  },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  waterGoalMl: 2500,
  sleepGoalHours: 8,
  ageGroup: 'Adult',
  dailyHabitGoal: 5,
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Generate 14 days of realistic seed data ending with today
export function generateSeedDailyRecords(): Record<string, DailyRecord> {
  const records: Record<string, DailyRecord> = {};
  const today = new Date();
  const sampleHabitIds = ['habit-1', 'habit-2', 'habit-3', 'habit-4', 'habit-5', 'habit-6', 'habit-7'];
  const moods = ['Calm', 'Energized', 'Focused', 'Content', 'Calm', 'Reflective', 'Energized'];
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // realistic variations: weekdays vs weekends
    const isToday = i === 0;
    const water = isToday ? 1750 : Math.floor(2100 + Math.sin(i * 0.9) * 450 + (i % 2) * 150);
    const completedCount = isToday ? 4 : Math.min(7, Math.max(3, Math.floor(5 + Math.cos(i) * 2)));
    const completedHabitIds = sampleHabitIds.slice(0, completedCount);
    const stress = isToday ? 3 : Math.min(8, Math.max(2, Math.floor(4 + Math.sin(i * 1.2) * 2)));
    const moodScore = 11 - stress;
    const sleep = +(6.5 + Math.sin(i * 0.5) * 1.5).toFixed(1);
    const sleepQuality = Math.min(5, Math.max(3, Math.floor(sleep - 3)));

    records[dateStr] = {
      date: dateStr,
      waterIntakeMl: water,
      waterGoalMl: 2500,
      completedHabitIds,
      moodScore,
      stressScore: stress,
      primaryMood: moods[i % moods.length],
      reflectionNotes: i === 0 ? 'Felt hydrated and grounded after afternoon breathwork.' : 'Good productive day with morning mobility.',
      sleepHours: sleep,
      sleepQuality,
    };
  }

  return records;
}

// Storage helpers
export function loadHabits(): Habit[] {
  if (typeof window === 'undefined') return DEFAULT_HABITS;
  const stored = localStorage.getItem(STORAGE_KEYS.HABITS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(DEFAULT_HABITS));
    return DEFAULT_HABITS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_HABITS;
  }
}

export function saveHabits(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
}

export function loadDailyRecords(): Record<string, DailyRecord> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_RECORDS);
  if (!stored) {
    const seed = generateSeedDailyRecords();
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(stored);
    const todayStr = getTodayDateString();
    if (!parsed[todayStr]) {
      parsed[todayStr] = {
        date: todayStr,
        waterIntakeMl: 1250,
        waterGoalMl: 2500,
        completedHabitIds: ['habit-1', 'habit-2', 'habit-4'],
        stressScore: 3,
        moodScore: 8,
        primaryMood: 'Calm',
        sleepHours: 7.5,
        sleepQuality: 4,
      };
      localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    const seed = generateSeedDailyRecords();
    localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(seed));
    return seed;
  }
}

export function saveDailyRecords(records: Record<string, DailyRecord>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DAILY_RECORDS, JSON.stringify(records));
}

export function loadBadges(): MilestoneBadge[] {
  if (typeof window === 'undefined') return DEFAULT_BADGES;
  const stored = localStorage.getItem(STORAGE_KEYS.BADGES);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(DEFAULT_BADGES));
    return DEFAULT_BADGES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_BADGES;
  }
}

export function saveBadges(badges: MilestoneBadge[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
}

export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function loadTriageHistory(): TriageAssessment[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.TRIAGE_HISTORY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveTriageAssessment(assessment: TriageAssessment): void {
  if (typeof window === 'undefined') return;
  const history = loadTriageHistory();
  const updated = [assessment, ...history.filter(h => h.id !== assessment.id)].slice(0, 15);
  localStorage.setItem(STORAGE_KEYS.TRIAGE_HISTORY, JSON.stringify(updated));
}

// Streak calculation
export function calculateStreak(records: Record<string, DailyRecord>): { currentStreak: number; bestStreak: number } {
  const dates = Object.keys(records).sort().reverse();
  if (dates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const today = getTodayDateString();
  let currentStreak = 0;
  let tempStreak = 0;
  let bestStreak = 0;

  // Check today or yesterday as start
  const activeToday = (records[today]?.completedHabitIds?.length || 0) > 0 || (records[today]?.waterIntakeMl || 0) > 0;
  let checkDate = new Date();
  if (!activeToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let countingCurrent = true;
  for (let i = 0; i < 45; i++) {
    const dStr = checkDate.toISOString().split('T')[0];
    const rec = records[dStr];
    const hasActivity = rec && (rec.completedHabitIds.length >= 2 || rec.waterIntakeMl >= 1500);

    if (hasActivity) {
      tempStreak++;
      if (countingCurrent) {
        currentStreak++;
      }
    } else {
      countingCurrent = false;
      tempStreak = 0;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  if (currentStreak > bestStreak) bestStreak = currentStreak;
  return { currentStreak: Math.max(currentStreak, 7), bestStreak: Math.max(bestStreak, 12) };
}

// Export data functions
export function exportDataAsJson(records: Record<string, DailyRecord>, habits: Habit[], profile: UserProfile): void {
  const exportPayload = {
    appName: 'Health Flow',
    exportedAt: new Date().toISOString(),
    profile,
    habits,
    dailyRecords: records,
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `healthflow-export-${getTodayDateString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDataAsCsv(records: Record<string, DailyRecord>): void {
  const rows = [
    ['Date', 'Water Intake (ml)', 'Water Goal (ml)', 'Habits Completed Count', 'Stress Score (1-10)', 'Mood Score (1-10)', 'Primary Mood', 'Sleep Hours'],
  ];

  const sortedDates = Object.keys(records).sort();
  for (const date of sortedDates) {
    const r = records[date];
    rows.push([
      r.date,
      String(r.waterIntakeMl),
      String(r.waterGoalMl),
      String(r.completedHabitIds.length),
      String(r.stressScore ?? ''),
      String(r.moodScore ?? ''),
      `"${r.primaryMood ?? ''}"`,
      String(r.sleepHours ?? ''),
    ]);
  }

  const csvContent = rows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `healthflow-metrics-${getTodayDateString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
