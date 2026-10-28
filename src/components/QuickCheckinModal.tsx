import React, { useState } from 'react';
import { DailyRecord, Habit } from '../types';
import { Droplets, CheckCircle2, Heart, X, Check } from 'lucide-react';

interface QuickCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  dailyRecord: DailyRecord;
  onAddWater: (amountMl: number) => void;
  onToggleHabit: (habitId: string) => void;
  onSaveMood: (stress: number, mood: number, primaryMood: string, notes: string) => void;
}

export const QuickCheckinModal: React.FC<QuickCheckinModalProps> = ({
  isOpen,
  onClose,
  habits,
  dailyRecord,
  onAddWater,
  onToggleHabit,
  onSaveMood,
}) => {
  const [stress, setStress] = useState(dailyRecord.stressScore ?? 3);
  const [mood, setMood] = useState(dailyRecord.primaryMood ?? 'Calm');
  const [notes, setNotes] = useState(dailyRecord.reflectionNotes ?? '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveMood(stress, 11 - stress, mood, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
              30-Second Reset
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">Quick Wellness Check-In</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Water Boost */}
        <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-950">
                Hydration: {dailyRecord.waterIntakeMl} / 2500 ml
              </div>
              <div className="text-[11px] text-teal-800">Tap to log quick intake</div>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => onAddWater(250)}
              className="px-2.5 py-1 text-xs font-semibold bg-white text-teal-800 border border-teal-200 rounded-lg shadow-xs hover:bg-teal-100 transition-colors cursor-pointer"
            >
              +250ml
            </button>
            <button
              type="button"
              onClick={() => onAddWater(500)}
              className="px-2.5 py-1 text-xs font-semibold bg-teal-700 text-white rounded-lg shadow-xs hover:bg-teal-800 transition-colors cursor-pointer"
            >
              +500ml
            </button>
          </div>
        </div>

        {/* Quick Habit Toggles (Top 4) */}
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Quick Habit Checklist
          </div>
          <div className="space-y-1.5">
            {habits.slice(0, 4).map((h) => {
              const done = dailyRecord.completedHabitIds.includes(h.id);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => onToggleHabit(h.id)}
                  className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    done
                      ? 'bg-teal-50 border-teal-200 text-teal-950 line-through'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{h.title}</span>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      done ? 'bg-teal-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {done && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Mood & Stress */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Stress Level: {stress}/10</span>
            <span className="text-slate-400 font-tabular">
              {stress <= 3 ? 'Calm' : stress <= 6 ? 'Manageable' : 'High Stress'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={stress}
            onChange={(e) => setStress(parseInt(e.target.value, 10))}
            className="w-full accent-teal-600"
          />

          <div className="grid grid-cols-4 gap-1.5">
            {['Calm', 'Energized', 'Focused', 'Fatigued'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`py-1.5 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  mood === m
                    ? 'bg-teal-700 border-teal-700 text-white font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Save & Finish
          </button>
        </div>
      </div>
    </div>
  );
};
