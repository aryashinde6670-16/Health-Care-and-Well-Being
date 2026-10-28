import React, { useState } from 'react';
import { Habit, DailyRecord, MilestoneBadge, HabitCategory } from '../types';
import { 
  Droplets, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Flame, 
  Award, 
  Check, 
  PlusCircle, 
  Minus, 
  Sparkles, 
  Calendar, 
  Target,
  Moon,
  Activity,
  Apple,
  Wind,
  Sun
} from 'lucide-react';

interface HabitTrackerProps {
  habits: Habit[];
  dailyRecord: DailyRecord;
  pastRecords: Record<string, DailyRecord>;
  badges: MilestoneBadge[];
  streakInfo: { currentStreak: number; bestStreak: number };
  onUpdateWater: (newAmount: number) => void;
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

const CATEGORY_ICONS: Record<HabitCategory, React.ReactNode> = {
  Sleep: <Moon className="w-3.5 h-3.5 text-indigo-500" />,
  Movement: <Activity className="w-3.5 h-3.5 text-teal-600" />,
  Nutrition: <Apple className="w-3.5 h-3.5 text-emerald-600" />,
  Mind: <Wind className="w-3.5 h-3.5 text-cyan-600" />,
  Vitality: <Sun className="w-3.5 h-3.5 text-amber-500" />,
};

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  dailyRecord,
  pastRecords,
  badges,
  streakInfo,
  onUpdateWater,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
}) => {
  // New habit form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HabitCategory>('Movement');
  const [newFrequency, setNewFrequency] = useState(7);
  const [customWaterInput, setCustomWaterInput] = useState('');

  // Hydration calculations
  const waterTarget = dailyRecord.waterGoalMl || 2500;
  const currentWater = dailyRecord.waterIntakeMl || 0;
  const waterPercent = Math.min(100, Math.round((currentWater / waterTarget) * 100));
  const remainingWater = Math.max(0, waterTarget - currentWater);

  // SVG Circular progress math
  const ringRadius = 54;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (waterPercent / 100) * circumference;

  // Habits calculations
  const totalHabits = habits.length;
  const completedHabitsCount = dailyRecord.completedHabitIds.length;
  const habitsPercent = totalHabits > 0 ? Math.round((completedHabitsCount / totalHabits) * 100) : 0;

  // Handlers for quick water additions
  const handleAddWaterQuick = (amount: number) => {
    onUpdateWater(Math.max(0, currentWater + amount));
  };

  const handleCustomWaterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customWaterInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateWater(currentWater + parsed);
      setCustomWaterInput('');
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: Habit = {
      id: `custom-habit-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      targetDaysPerWeek: newFrequency,
      createdAt: new Date().toISOString(),
    };

    onAddHabit(created);
    setNewTitle('');
    setShowAddModal(false);
  };

  // 7-day mini matrix (last 7 days)
  const last7Days: { dateStr: string; label: string; count: number; waterMet: boolean }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rec = pastRecords[dateStr];
    last7Days.push({
      dateStr,
      label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      count: rec?.completedHabitIds?.length || 0,
      waterMet: (rec?.waterIntakeMl || 0) >= 2500,
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header & Streak Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            <span>Daily Routines & Hydration</span>
            <span aria-hidden="true">·</span>
            <span>Target: 2.5 Liters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Daily Habits & Hydration Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Cultivate biological resilience through consistent water intake, morning movement, restorative sleep, and nervous system regulation.
          </p>
        </div>

        {/* Streak & Milestone Quick Bar */}
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Flame className="w-6 h-6 fill-amber-500 text-amber-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Active Wellness Streak</div>
            <div className="text-lg font-extrabold text-slate-900 font-tabular flex items-baseline gap-1.5">
              <span>{streakInfo.currentStreak} Days</span>
              <span className="text-[11px] font-normal text-slate-400">
                (Best: {streakInfo.bestStreak}d)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary 2-Column Split: Hydration (Left 5 cols) & Habits (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Daily Water Counter & Visual Ring (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Daily Hydration Meter</h2>
              </div>
              <span className="text-xs font-semibold text-teal-800 font-tabular">
                {currentWater} / {waterTarget} ml
              </span>
            </div>

            {/* Circular Progress Ring & Bottle Level */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              {/* SVG Ring */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                  {/* Track circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r={ringRadius}
                    className="text-slate-100"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  {/* Animated Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r={ringRadius}
                    className="text-teal-600 transition-all duration-500 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-slate-900 font-tabular">
                    {waterPercent}%
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {remainingWater === 0 ? 'Goal Reached!' : `${remainingWater}ml left`}
                  </span>
                </div>
              </div>

              {/* Water Volume Stats */}
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-500">Target Volume: 2.5 Liters</div>
                <div className="text-xl font-bold text-teal-900 font-tabular">
                  {(currentWater / 1000).toFixed(2)} L
                </div>
                <p className="text-xs text-slate-600 max-w-[180px] leading-relaxed">
                  Drinking water regularly optimizes cognitive focus, stabilizes joints, and prevents headaches.
                </p>
              </div>
            </div>

            {/* Quick-Add Buttons (+250ml, +500ml, +100ml, +750ml, -250ml) */}
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2.5">
                Quick-Add Volume
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddWaterQuick(250)}
                  className="py-2 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
                >
                  <span>+250 ml</span>
                  <span className="text-[10px] text-teal-600 font-normal">Glass</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWaterQuick(500)}
                  className="py-2 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
                >
                  <span>+500 ml</span>
                  <span className="text-[10px] text-teal-600 font-normal">Bottle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWaterQuick(100)}
                  className="py-2 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
                >
                  <span>+100 ml</span>
                  <span className="text-[10px] text-slate-500 font-normal">Sip</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWaterQuick(-250)}
                  disabled={currentWater === 0}
                  className="py-2 px-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-semibold transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
                >
                  <span>-250 ml</span>
                  <span className="text-[10px] font-normal">Undo</span>
                </button>
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleCustomWaterSubmit} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="number"
                min="10"
                max="3000"
                step="50"
                value={customWaterInput}
                onChange={(e) => setCustomWaterInput(e.target.value)}
                placeholder="Custom amount (e.g. 350 ml)"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!customWaterInput}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Add ml
              </button>
            </form>
          </div>

          {/* Lifestyle Visual Inspiration Banner */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="relative h-44 w-full bg-slate-100">
              <img
                src="/src/assets/images/hero_wellness_lifestyle_1793177774928.jpg"
                alt="Hydration Carafe with Fresh Mint and Citrus"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent flex items-end p-4">
                <div className="text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                    Hydration Habit
                  </div>
                  <div className="text-sm font-bold">Infuse with Cucumber, Citrus & Mint</div>
                </div>
              </div>
            </div>
            <div className="p-4 text-xs text-slate-600 leading-relaxed">
              Adding trace mineral salt and a twist of citrus optimizes cellular electrolyte transport, helping eliminate afternoon brain fog and fatigue.
            </div>
          </div>
        </div>

        {/* Right Column: Daily Habits Checklist & Milestones (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Habits Header & Progress */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Today's Essential Wellness Habits</h2>
                <div className="text-xs text-slate-500 font-tabular mt-0.5">
                  {completedHabitsCount} of {totalHabits} completed ({habitsPercent}%)
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Habit
              </button>
            </div>

            {/* Visual Habit Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${habitsPercent}%` }}
              />
            </div>

            {/* Habit Checklist Items */}
            <div className="space-y-2.5">
              {habits.map((habit) => {
                const isCompleted = dailyRecord.completedHabitIds.includes(habit.id);
                return (
                  <div
                    key={habit.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-teal-50/50 border-teal-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Toggle button & title */}
                    <button
                      type="button"
                      onClick={() => onToggleHabit(habit.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted
                            ? 'bg-teal-600 text-white'
                            : 'border-2 border-slate-300 hover:border-teal-500 bg-white'
                        }`}
                      >
                        {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>

                      <div>
                        <div
                          className={`text-sm font-semibold transition-colors ${
                            isCompleted ? 'text-teal-950 line-through' : 'text-slate-900'
                          }`}
                        >
                          {habit.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            {CATEGORY_ICONS[habit.category]}
                            <span>{habit.category}</span>
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-tabular">{habit.targetDaysPerWeek}x per week</span>
                        </div>
                      </div>
                    </button>

                    {/* Delete custom habit affordance */}
                    {habit.id.startsWith('custom-') && (
                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                        title="Delete custom habit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 7-Day Consistency Dot Matrix */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Past 7-Day Activity Matrix
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {last7Days.map((day, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-600">{day.label}</div>
                    <div className="mt-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          day.count >= 4
                            ? 'bg-teal-600'
                            : day.count > 0
                            ? 'bg-teal-300'
                            : 'bg-slate-200'
                        }`}
                        title={`${day.count} habits completed`}
                      />
                      <span className="text-[10px] text-slate-500 font-tabular">{day.count}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Milestone Badges Gallery */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Streak Milestones & Achievements</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((badge) => {
                const isUnlocked = badge.unlocked;
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      isUnlocked
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{badge.name}</span>
                        {isUnlocked && (
                          <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                            Unlocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {badge.description}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-1 font-tabular">
                        Goal: {badge.requirement}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Wellness Habit</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 10-Minute Evening Meditation"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as HabitCategory)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                >
                  <option value="Movement">Movement</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Nutrition">Nutrition</option>
                  <option value="Mind">Mind</option>
                  <option value="Vitality">Vitality</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Frequency (Days per Week)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(parseInt(e.target.value, 10))}
                    className="flex-1 accent-teal-600"
                  />
                  <span className="text-sm font-bold text-teal-800 font-tabular w-8 text-right">
                    {newFrequency}x
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
