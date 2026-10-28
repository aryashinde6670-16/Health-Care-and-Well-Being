import React, { useState, useEffect } from 'react';
import { NavTab, Habit, DailyRecord, MilestoneBadge, UserProfile, TriageAssessment } from './types';
import { 
  loadHabits, 
  saveHabits, 
  loadDailyRecords, 
  saveDailyRecords, 
  loadBadges, 
  saveBadges, 
  loadProfile, 
  loadTriageHistory, 
  saveTriageAssessment, 
  getTodayDateString, 
  calculateStreak,
  generateSeedDailyRecords
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { SymptomTriage } from './components/SymptomTriage';
import { HabitTracker } from './components/HabitTracker';
import { MindfulnessHub } from './components/MindfulnessHub';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { QuickCheckinModal } from './components/QuickCheckinModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('triage');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>({});
  const [badges, setBadges] = useState<MilestoneBadge[]>([]);
  const [profile, setProfile] = useState<UserProfile>(loadProfile());
  const [triageHistory, setTriageHistory] = useState<TriageAssessment[]>([]);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize data from localStorage
  useEffect(() => {
    const loadedHabits = loadHabits();
    const loadedRecords = loadDailyRecords();
    const loadedBadges = loadBadges();
    const loadedTriage = loadTriageHistory();
    const loadedProfile = loadProfile();

    setHabits(loadedHabits);
    setDailyRecords(loadedRecords);
    setBadges(loadedBadges);
    setTriageHistory(loadedTriage);
    setProfile(loadedProfile);
    setIsLoaded(true);
  }, []);

  const todayStr = getTodayDateString();
  const todayRecord: DailyRecord = dailyRecords[todayStr] || {
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

  const streakInfo = calculateStreak(dailyRecords);

  // Update water intake
  const handleUpdateWater = (newAmount: number) => {
    const updatedRecord: DailyRecord = {
      ...todayRecord,
      waterIntakeMl: newAmount,
    };
    const updatedAll = {
      ...dailyRecords,
      [todayStr]: updatedRecord,
    };
    setDailyRecords(updatedAll);
    saveDailyRecords(updatedAll);

    // Check Hydration Hero badge
    if (newAmount >= 2500) {
      checkBadges(updatedAll);
    }
  };

  // Toggle habit
  const handleToggleHabit = (habitId: string) => {
    const isCompleted = todayRecord.completedHabitIds.includes(habitId);
    const newCompleted = isCompleted
      ? todayRecord.completedHabitIds.filter((id) => id !== habitId)
      : [...todayRecord.completedHabitIds, habitId];

    const updatedRecord: DailyRecord = {
      ...todayRecord,
      completedHabitIds: newCompleted,
    };
    const updatedAll = {
      ...dailyRecords,
      [todayStr]: updatedRecord,
    };
    setDailyRecords(updatedAll);
    saveDailyRecords(updatedAll);
    checkBadges(updatedAll);
  };

  // Add custom habit
  const handleAddHabit = (newHabit: Habit) => {
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
  };

  // Delete habit
  const handleDeleteHabit = (habitId: string) => {
    const updated = habits.filter((h) => h.id !== habitId);
    setHabits(updated);
    saveHabits(updated);
  };

  // Save mood check-in
  const handleSaveMoodCheckin = (stress: number, mood: number, primaryMood: string, notes: string) => {
    const updatedRecord: DailyRecord = {
      ...todayRecord,
      stressScore: stress,
      moodScore: mood,
      primaryMood,
      reflectionNotes: notes,
    };
    const updatedAll = {
      ...dailyRecords,
      [todayStr]: updatedRecord,
    };
    setDailyRecords(updatedAll);
    saveDailyRecords(updatedAll);
  };

  // Save symptom triage assessment
  const handleSaveAssessment = (assessment: TriageAssessment) => {
    setTriageHistory((prev) => [assessment, ...prev.filter((p) => p.id !== assessment.id)]);
    saveTriageAssessment(assessment);
  };

  // Check and unlock badges
  const checkBadges = (records: Record<string, DailyRecord>) => {
    const { currentStreak } = calculateStreak(records);
    let changed = false;

    const updatedBadges = badges.map((b) => {
      if (!b.unlocked && currentStreak >= b.targetDays) {
        changed = true;
        return {
          ...b,
          unlocked: true,
          unlockedDate: todayStr,
        };
      }
      return b;
    });

    if (changed) {
      setBadges(updatedBadges);
      saveBadges(updatedBadges);
    }
  };

  // Reset/reseed sample data
  const handleResetSeedData = () => {
    const freshSeed = generateSeedDailyRecords();
    setDailyRecords(freshSeed);
    saveDailyRecords(freshSeed);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm font-semibold text-teal-800">Loading Health Flow...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        todayWaterMl={todayRecord.waterIntakeMl}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'triage' && (
          <SymptomTriage
            profile={profile}
            triageHistory={triageHistory}
            onSaveAssessment={handleSaveAssessment}
          />
        )}

        {currentTab === 'habits' && (
          <HabitTracker
            habits={habits}
            dailyRecord={todayRecord}
            pastRecords={dailyRecords}
            badges={badges}
            streakInfo={streakInfo}
            onUpdateWater={handleUpdateWater}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {currentTab === 'mindfulness' && (
          <MindfulnessHub
            todayRecord={todayRecord}
            onSaveMoodCheckin={handleSaveMoodCheckin}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsDashboard
            records={dailyRecords}
            habits={habits}
            profile={profile}
            triageHistory={triageHistory}
            onResetSeedData={handleResetSeedData}
          />
        )}
      </main>

      {/* Quick Check-in Modal */}
      <QuickCheckinModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        habits={habits}
        dailyRecord={todayRecord}
        onAddWater={(ml) => handleUpdateWater(todayRecord.waterIntakeMl + ml)}
        onToggleHabit={handleToggleHabit}
        onSaveMood={handleSaveMoodCheckin}
      />

      {/* Minimalist Footing with Medical Disclaimer & Copyright */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Health Flow</span>
            <span>·</span>
            <span>Empowering daily biological wellness & mindful habit flow</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Non-medical lifestyle guidance · Consult a licensed physician for diagnosis
          </div>
        </div>
      </footer>
    </div>
  );
}
