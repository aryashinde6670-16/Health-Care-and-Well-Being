export type NavTab = 'triage' | 'habits' | 'mindfulness' | 'analytics';

export interface SelfCareStep {
  step: number;
  title: string;
  description: string;
  completed?: boolean;
}

export interface TriageAssessment {
  id: string;
  timestamp: string;
  symptom: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  duration: string;
  notes?: string;
  riskLevel: 'low' | 'moderate' | 'high';
  riskBadge: string;
  summary: string;
  potentialFactors: string[];
  selfCareSteps: SelfCareStep[];
  redFlags: string[];
  recommendedDurationToDoctor: string;
  disclaimer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type HabitCategory = 'Sleep' | 'Movement' | 'Nutrition' | 'Mind' | 'Vitality';

export interface Habit {
  id: string;
  title: string;
  category: HabitCategory;
  targetDaysPerWeek: number;
  createdAt: string;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  waterIntakeMl: number;
  waterGoalMl: number;
  completedHabitIds: string[];
  moodScore?: number; // 1-10
  stressScore?: number; // 1-10
  primaryMood?: string;
  reflectionNotes?: string;
  sleepHours?: number;
  sleepQuality?: number; // 1-5
}

export interface MilestoneBadge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  targetDays: number;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface UserProfile {
  name: string;
  waterGoalMl: number;
  sleepGoalHours: number;
  ageGroup: string;
  dailyHabitGoal: number;
}
