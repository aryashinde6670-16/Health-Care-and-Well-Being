import React, { useState } from 'react';
import { DailyRecord, Habit, UserProfile, TriageAssessment } from '../types';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Droplets, 
  Moon, 
  Smile, 
  TrendingUp, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  FileSpreadsheet, 
  RefreshCw,
  HeartPulse
} from 'lucide-react';
import { exportDataAsCsv, exportDataAsJson, formatDateLabel } from '../utils/storage';

interface AnalyticsDashboardProps {
  records: Record<string, DailyRecord>;
  habits: Habit[];
  profile: UserProfile;
  triageHistory: TriageAssessment[];
  onResetSeedData: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  records,
  habits,
  profile,
  triageHistory,
  onResetSeedData,
}) => {
  const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('14');
  const [activeChart, setActiveChart] = useState<'hydration' | 'stress' | 'sleep'>('hydration');

  const rangeDays = parseInt(dateRange, 10);

  // Filter records within the selected range
  const sortedDates = Object.keys(records).sort();
  const filteredDates = sortedDates.slice(-rangeDays);
  const activeRecords = filteredDates.map((date) => records[date]);

  // Aggregate stats
  const totalWater = activeRecords.reduce((acc, r) => acc + (r.waterIntakeMl || 0), 0);
  const avgWater = activeRecords.length > 0 ? Math.round(totalWater / activeRecords.length) : 0;
  const hydrationGoalRate = Math.round((avgWater / profile.waterGoalMl) * 100);

  const totalHabitsPossible = activeRecords.length * habits.length;
  const totalHabitsCompleted = activeRecords.reduce(
    (acc, r) => acc + (r.completedHabitIds?.length || 0),
    0
  );
  const habitConsistency =
    totalHabitsPossible > 0 ? Math.round((totalHabitsCompleted / totalHabitsPossible) * 100) : 0;

  const validStressRecords = activeRecords.filter((r) => r.stressScore !== undefined);
  const avgStress =
    validStressRecords.length > 0
      ? (
          validStressRecords.reduce((acc, r) => acc + (r.stressScore || 0), 0) /
          validStressRecords.length
        ).toFixed(1)
      : '3.2';

  const validSleepRecords = activeRecords.filter((r) => r.sleepHours !== undefined);
  const avgSleep =
    validSleepRecords.length > 0
      ? (
          validSleepRecords.reduce((acc, r) => acc + (r.sleepHours || 0), 0) /
          validSleepRecords.length
        ).toFixed(1)
      : '7.4';

  // Mood frequency breakdown
  const moodCounts: Record<string, number> = {};
  for (const r of activeRecords) {
    const m = r.primaryMood || 'Calm';
    moodCounts[m] = (moodCounts[m] || 0) + 1;
  }
  const moodEntries = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);

  // Habits completed by day of week (0 Sun to 6 Sat)
  const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekOccurrences: number[] = [0, 0, 0, 0, 0, 0, 0];

  for (const r of activeRecords) {
    const parts = r.date.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayIndex = d.getDay();
      dayOfWeekCounts[dayIndex] += r.completedHabitIds?.length || 0;
      dayOfWeekOccurrences[dayIndex] += 1;
    }
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayAverages = dayLabels.map((lbl, idx) => {
    const count = dayOfWeekCounts[idx];
    const occ = dayOfWeekOccurrences[idx] || 1;
    return {
      day: lbl,
      avg: +(count / occ).toFixed(1),
    };
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            <span>Aggregated Trends & Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Personal Health Flow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Personal Health Analytics Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Correlate hydration fidelity, sleep duration, and autonomic stress trends across longitudinal observation windows.
          </p>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportDataAsCsv(records)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Download CSV file for Excel or Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportDataAsJson(records, habits, profile)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Download JSON data"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-semibold text-slate-700">Observation Window:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['7', '14', '30'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  dateRange === r
                    ? 'bg-white text-teal-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last {r} Days
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetSeedData}
            className="text-xs text-slate-500 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
            title="Refill realistic 14-day sample records"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Sample Records
          </button>
        </div>
      </div>

      {/* Key Metric Summary Cards Strip (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Hydration Average */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Daily Hydration Avg</span>
            <Droplets className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-tabular">
            {avgWater} ml
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className={hydrationGoalRate >= 90 ? 'text-teal-700 font-semibold' : 'text-amber-700'}>
              {hydrationGoalRate}% of 2.5L goal
            </span>
          </div>
        </div>

        {/* Card 2: Habit Consistency Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Habit Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-tabular">
            {habitConsistency}%
          </div>
          <div className="text-xs text-slate-500">
            {totalHabitsCompleted} completed in window
          </div>
        </div>

        {/* Card 3: Average Stress Index */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Average Stress Index</span>
            <HeartPulse className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-tabular">
            {avgStress} / 10
          </div>
          <div className="text-xs text-slate-500">
            {parseFloat(avgStress) <= 4 ? 'Optimal parasympathetic zone' : 'Elevated nervous strain'}
          </div>
        </div>

        {/* Card 4: Average Rest & Sleep */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Average Nightly Sleep</span>
            <Moon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-tabular">
            {avgSleep} hrs
          </div>
          <div className="text-xs text-slate-500">
            Target: 8.0 hours restorative
          </div>
        </div>
      </div>

      {/* Main Charts Area: Segmented Chart Switcher & Interactive SVG Visualizations */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        
        {/* Chart Header & Segmented Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeChart === 'hydration'
                ? 'Daily Hydration Intake vs. 2,500ml Baseline'
                : activeChart === 'stress'
                ? 'Stress Index vs. Mood Balance Over Time'
                : 'Sleep Duration & Nightly Rest Recovery'}
            </h2>
            <div className="text-xs text-slate-500 font-tabular mt-0.5">
              Tracking {activeRecords.length} consecutive daily data points
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setActiveChart('hydration')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeChart === 'hydration'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hydration (ml)
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('stress')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeChart === 'stress'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stress Index
            </button>
            <button
              type="button"
              onClick={() => setActiveChart('sleep')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeChart === 'sleep'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sleep (hrs)
            </button>
          </div>
        </div>

        {/* SVG Interactive Chart View */}
        <div className="h-64 w-full relative">
          
          {activeChart === 'hydration' && (
            <div className="h-full flex flex-col justify-end">
              {/* Target Line at 2500ml */}
              <div className="relative w-full h-48 flex items-end gap-1.5 sm:gap-3 px-2 border-b border-slate-200">
                <div 
                  className="absolute left-0 right-0 border-t border-dashed border-teal-400 z-10 pointer-events-none"
                  style={{ bottom: '75%' }} // 2500ml out of 3300 max
                >
                  <span className="absolute -top-4 right-2 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1 rounded">
                    2.5L Target
                  </span>
                </div>

                {activeRecords.map((rec) => {
                  const maxDisplay = 3200;
                  const heightPercent = Math.min(100, Math.round(((rec.waterIntakeMl || 0) / maxDisplay) * 100));
                  const isMet = (rec.waterIntakeMl || 0) >= 2500;
                  return (
                    <div
                      key={rec.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-tabular py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                        {formatDateLabel(rec.date)}: {rec.waterIntakeMl}ml
                      </div>

                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isMet ? 'bg-teal-600 hover:bg-teal-700' : 'bg-teal-300 hover:bg-teal-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X Axis Date Labels */}
              <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-400 font-tabular">
                <span>{filteredDates[0] ? formatDateLabel(filteredDates[0]) : ''}</span>
                <span>{filteredDates[Math.floor(filteredDates.length / 2)] ? formatDateLabel(filteredDates[Math.floor(filteredDates.length / 2)]) : ''}</span>
                <span>{filteredDates[filteredDates.length - 1] ? formatDateLabel(filteredDates[filteredDates.length - 1]) : ''}</span>
              </div>
            </div>
          )}

          {activeChart === 'stress' && (
            <div className="h-full flex flex-col justify-end">
              <div className="relative w-full h-48 flex items-end gap-1.5 sm:gap-3 px-2 border-b border-slate-200">
                {activeRecords.map((rec) => {
                  const stress = rec.stressScore ?? 4;
                  const heightPercent = (stress / 10) * 100;
                  return (
                    <div
                      key={rec.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-tabular py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                        {formatDateLabel(rec.date)}: Stress {stress}/10 · {rec.primaryMood}
                      </div>

                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          stress <= 3
                            ? 'bg-teal-500'
                            : stress <= 6
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-400 font-tabular">
                <span>{filteredDates[0] ? formatDateLabel(filteredDates[0]) : ''}</span>
                <span>{filteredDates[filteredDates.length - 1] ? formatDateLabel(filteredDates[filteredDates.length - 1]) : ''}</span>
              </div>
            </div>
          )}

          {activeChart === 'sleep' && (
            <div className="h-full flex flex-col justify-end">
              <div className="relative w-full h-48 flex items-end gap-1.5 sm:gap-3 px-2 border-b border-slate-200">
                {activeRecords.map((rec) => {
                  const sleep = rec.sleepHours ?? 7;
                  const heightPercent = Math.min(100, (sleep / 10) * 100);
                  return (
                    <div
                      key={rec.date}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-tabular py-1 px-2 rounded whitespace-nowrap z-20 pointer-events-none">
                        {formatDateLabel(rec.date)}: {sleep} hrs
                      </div>

                      <div
                        className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between px-2 pt-2 text-[10px] text-slate-400 font-tabular">
                <span>{filteredDates[0] ? formatDateLabel(filteredDates[0]) : ''}</span>
                <span>{filteredDates[filteredDates.length - 1] ? formatDateLabel(filteredDates[filteredDates.length - 1]) : ''}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Secondary Analytics: Habit Frequency by Weekday & Mood Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Habit Frequency by Weekday */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Average Habit Execution by Weekday
          </h3>
          <p className="text-xs text-slate-600">
            Identifies weekly behavioral patterns where routines drop off (e.g. weekend transitions).
          </p>

          <div className="space-y-2.5 pt-2">
            {dayAverages.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-semibold text-slate-700">{item.day}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (item.avg / habits.length) * 100)}%` }}
                  />
                </div>
                <span className="w-14 text-xs text-right font-tabular text-slate-600 font-semibold">
                  {item.avg} / {habits.length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Emotional State Distribution
          </h3>
          <p className="text-xs text-slate-600">
            Frequency breakdown of logged feelings during observation window.
          </p>

          <div className="space-y-2.5 pt-2">
            {moodEntries.map(([mood, count]) => {
              const pct = Math.round((count / activeRecords.length) * 100);
              return (
                <div key={mood} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-semibold text-slate-700">{mood}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-teal-700 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-xs text-right font-tabular text-slate-600 font-semibold">
                    {count}d ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Printable Clinical & Wellness Summary Sheet (Visible in normal view and styled for window.print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-bold text-teal-800 uppercase tracking-wider">
              Health Flow · Patient Wellness Summary
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {profile.name} — Lifestyle & Triage Progress
            </h2>
            <div className="text-xs text-slate-500 font-tabular mt-0.5">
              Report Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              Active Streak: 7 Days
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <strong className="block text-slate-800 font-semibold">Baseline Habits</strong>
            <p className="text-slate-600">{habits.length} daily wellness habits monitored</p>
            <p className="text-slate-600 font-tabular">Consistency rate: {habitConsistency}%</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <strong className="block text-slate-800 font-semibold">Hydration Status</strong>
            <p className="text-slate-600">Daily Average: {avgWater} ml / 2,500 ml target</p>
            <p className="text-slate-600 font-tabular">Goal achievement rate: {hydrationGoalRate}%</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <strong className="block text-slate-800 font-semibold">Stress & Recovery</strong>
            <p className="text-slate-600">Average Stress Level: {avgStress} / 10</p>
            <p className="text-slate-600 font-tabular">Average Sleep: {avgSleep} hrs/night</p>
          </div>
        </div>

        {/* Recent Triage Summary In Report */}
        {triageHistory.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Logged Symptom Triage Records
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              {triageHistory.slice(0, 3).map((item) => (
                <div key={item.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{item.symptom}</span>
                    <span className="text-slate-500 font-tabular ml-2">
                      ({item.severity} · {item.timestamp})
                    </span>
                  </div>
                  <span className="font-medium text-teal-800">{item.riskBadge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <strong>Mandatory Medical Notice:</strong> This summary document is created for personal tracking and educational purposes only. It is not an official medical record or clinical diagnostic report. Share with your primary doctor or healthcare specialist during routine appointments to inform holistic lifestyle discussions.
        </div>
      </div>
    </div>
  );
};
