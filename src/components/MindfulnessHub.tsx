import React, { useState, useEffect, useRef } from 'react';
import { DailyRecord } from '../types';
import { playChime, soundscapeEngine, SoundscapeType } from '../utils/audio';
import { 
  Wind, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Heart, 
  Sparkles, 
  Check, 
  Sliders, 
  Eye, 
  Music, 
  Smile, 
  Frown, 
  Meh, 
  Compass,
  Headphones
} from 'lucide-react';

interface MindfulnessHubProps {
  todayRecord: DailyRecord;
  onSaveMoodCheckin: (stress: number, mood: number, primaryMood: string, notes: string) => void;
}

type BreathingTechnique = 'box' | 'relax478' | 'coherence';

interface TechniqueConfig {
  name: string;
  description: string;
  cycleDuration: number;
  phases: { name: string; duration: number; action: string }[];
}

const TECHNIQUES: Record<BreathingTechnique, TechniqueConfig> = {
  box: {
    name: 'Box Breathing (4-4-4-4)',
    description: 'Used by athletes and tactical specialists to quickly downregulate adrenaline and focus cognition.',
    cycleDuration: 16,
    phases: [
      { name: 'Inhale', duration: 4, action: 'Inhale smoothly through your nose' },
      { name: 'Hold', duration: 4, action: 'Hold breath with calm lungs' },
      { name: 'Exhale', duration: 4, action: 'Exhale slowly through slightly parted lips' },
      { name: 'Hold', duration: 4, action: 'Remain empty and composed' },
    ],
  },
  relax478: {
    name: '4-7-8 Relaxing Breath',
    description: 'Dr. Andrew Weil’s tranquilizer for the nervous system, ideal before sleep or during peak stress.',
    cycleDuration: 19,
    phases: [
      { name: 'Inhale', duration: 4, action: 'Inhale quietly through nose' },
      { name: 'Hold', duration: 7, action: 'Hold breath with gentle stillness' },
      { name: 'Exhale', duration: 8, action: 'Audibly exhale whooshing through mouth' },
    ],
  },
  coherence: {
    name: 'Coherence Breathing (5-5)',
    description: 'Balances autonomic heart rate variability (HRV) for deep emotional equilibrium.',
    cycleDuration: 10,
    phases: [
      { name: 'Inhale', duration: 5, action: 'Inhale smoothly and rhythmically' },
      { name: 'Exhale', duration: 5, action: 'Exhale continuously without pause' },
    ],
  },
};

const MOOD_OPTIONS = [
  { label: 'Calm', emoji: '🌿', color: 'teal' },
  { label: 'Energized', emoji: '⚡', color: 'amber' },
  { label: 'Focused', emoji: '🎯', color: 'indigo' },
  { label: 'Grateful', emoji: '✨', color: 'emerald' },
  { label: 'Fatigued', emoji: '💤', color: 'slate' },
  { label: 'Anxious', emoji: '🌊', color: 'rose' },
  { label: 'Overwhelmed', emoji: '🌧️', color: 'purple' },
];

export const MindfulnessHub: React.FC<MindfulnessHubProps> = ({
  todayRecord,
  onSaveMoodCheckin,
}) => {
  // Breathing state
  const [technique, setTechnique] = useState<BreathingTechnique>('box');
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsInPhase, setSecondsInPhase] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [chimeEnabled, setChimeEnabled] = useState(true);

  // Mood Logger State
  const [stressScore, setStressScore] = useState(todayRecord.stressScore ?? 3);
  const [moodScore, setMoodScore] = useState(todayRecord.moodScore ?? 8);
  const [selectedMood, setSelectedMood] = useState(todayRecord.primaryMood ?? 'Calm');
  const [reflectionNotes, setReflectionNotes] = useState(todayRecord.reflectionNotes ?? '');
  const [moodLoggedNotification, setMoodLoggedNotification] = useState(false);

  // Grounding 5-4-3-2-1 State
  const [groundingStep, setGroundingStep] = useState(1);
  const [groundingChecked, setGroundingChecked] = useState<Record<number, boolean>>({});

  // Soundscape State
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType | null>(null);
  const [soundVolume, setSoundVolume] = useState(0.4);

  const activeTechniqueConfig = TECHNIQUES[technique];
  const currentPhase = activeTechniqueConfig.phases[phaseIndex];

  // Breathwork Timer Hook
  useEffect(() => {
    let timer: any = null;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setSecondsInPhase((prevSec) => {
          const nextSec = prevSec + 1;
          if (nextSec >= currentPhase.duration) {
            // Move to next phase
            const nextPhaseIndex = (phaseIndex + 1) % activeTechniqueConfig.phases.length;
            if (nextPhaseIndex === 0) {
              setCompletedCycles((c) => c + 1);
            }
            setPhaseIndex(nextPhaseIndex);
            if (chimeEnabled) {
              playChime(nextPhaseIndex === 0 ? 528 : 432);
            }
            return 0;
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive, phaseIndex, currentPhase, activeTechniqueConfig, chimeEnabled]);

  // Soundscape toggle handler
  const handleToggleSoundscape = (type: SoundscapeType) => {
    if (activeSoundscape === type) {
      soundscapeEngine.stop();
      setActiveSoundscape(null);
    } else {
      soundscapeEngine.start(type, soundVolume);
      setActiveSoundscape(type);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setSoundVolume(vol);
    soundscapeEngine.setVolume(vol);
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      soundscapeEngine.stop();
    };
  }, []);

  const handleResetBreathwork = () => {
    setIsBreathingActive(false);
    setPhaseIndex(0);
    setSecondsInPhase(0);
  };

  const handleSaveCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMoodCheckin(stressScore, moodScore, selectedMood, reflectionNotes);
    setMoodLoggedNotification(true);
    setTimeout(() => setMoodLoggedNotification(false), 3000);
  };

  // Calculate dynamic scale factor for orb
  const isInhale = currentPhase.name.toLowerCase().includes('inhale');
  const isExhale = currentPhase.name.toLowerCase().includes('exhale');
  const phaseProgress = secondsInPhase / currentPhase.duration;

  let orbScale = 1.0;
  if (isInhale) {
    orbScale = 1.0 + phaseProgress * 0.45; // Expand from 1.0 to 1.45
  } else if (isExhale) {
    orbScale = 1.45 - phaseProgress * 0.45; // Contract from 1.45 to 1.0
  } else {
    // Hold phase
    orbScale = phaseIndex === 1 ? 1.45 : 1.0;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            <span>Autonomic Nervous System Regulation</span>
            <span aria-hidden="true">·</span>
            <span>Mindfulness & Stress Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Interactive Stress & Mindfulness Hub
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Shift from sympathetic fight-or-flight into restorative parasympathetic calmness through guided breathwork, procedural acoustic soundscapes, and mood check-ins.
          </p>
        </div>

        {/* Ambient Procedural Audio Control Strip */}
        <div className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
          <Headphones className="w-4 h-4 text-teal-700 ml-1.5" />
          <div className="flex items-center gap-1">
            {(['rain', 'ocean', 'binaural', 'forest'] as SoundscapeType[]).map((type) => {
              const isPlaying = activeSoundscape === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToggleSoundscape(type)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
          {activeSoundscape && (
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 accent-teal-600"
                title="Soundscape volume"
              />
            </div>
          )}
        </div>
      </div>

      {/* Grid: Interactive Breathwork (7 cols) + Quick Mood & Grounding (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Breathwork Orb & Guide (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            
            {/* Technique Picker Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Breathing Protocol
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeTechniqueConfig.name}
                </h2>
              </div>

              {/* Technique Selector buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['box', 'relax478', 'coherence'] as BreathingTechnique[]).map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => {
                      setTechnique(tech);
                      handleResetBreathwork();
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      technique === tech
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tech === 'box' ? 'Box 4-4' : tech === 'relax478' ? '4-7-8' : 'Coherence 5-5'}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeTechniqueConfig.description}
            </p>

            {/* Visual Interactive Breathing Orb Container */}
            <div className="relative py-12 flex flex-col items-center justify-center min-h-[340px] bg-gradient-to-b from-teal-50/50 to-slate-50 rounded-2xl border border-teal-100/60 overflow-hidden">
              
              {/* Outer atmospheric aura */}
              <div
                className="absolute w-64 h-64 rounded-full bg-teal-200/40 blur-2xl transition-transform duration-1000 ease-out"
                style={{ transform: `scale(${orbScale * 1.2})` }}
              />

              {/* Main Animated Orb */}
              <div
                className="relative z-10 w-44 h-44 rounded-full bg-gradient-to-tr from-teal-600 to-cyan-400 text-white flex flex-col items-center justify-center shadow-lg transition-transform duration-1000 ease-out"
                style={{ transform: `scale(${orbScale})` }}
              >
                <span className="text-xs font-medium uppercase tracking-wider text-teal-100">
                  {isBreathingActive ? currentPhase.name : 'Ready'}
                </span>
                <span className="text-3xl font-extrabold font-tabular mt-0.5">
                  {isBreathingActive ? currentPhase.duration - secondsInPhase : 'Start'}
                </span>
                <span className="text-[10px] text-teal-100/90 font-medium mt-1">
                  {isBreathingActive ? `${phaseIndex + 1}/${activeTechniqueConfig.phases.length}` : 'Tap Play'}
                </span>
              </div>

              {/* Live Guidance Prompt */}
              <div className="relative z-10 mt-6 text-center max-w-sm px-4">
                <div className="text-sm font-bold text-slate-800">
                  {isBreathingActive ? currentPhase.action : 'Click Start to begin session'}
                </div>
                <div className="text-xs text-slate-500 font-tabular mt-1">
                  Completed Cycles: <strong className="text-teal-800">{completedCycles}</strong> ·{' '}
                  {((completedCycles * activeTechniqueConfig.cycleDuration) / 60).toFixed(1)} mins logged
                </div>
              </div>
            </div>

            {/* Controls Bar: Play, Pause, Reset, Chime */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
                    isBreathingActive
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {isBreathingActive ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause Breathing
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Start Breathwork
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetBreathwork}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                  title="Reset cycle"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Crystal Singing Bowl Chime Toggle */}
              <button
                type="button"
                onClick={() => setChimeEnabled(!chimeEnabled)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  chimeEnabled
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {chimeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{chimeEnabled ? 'Bowl Chime On' : 'Muted'}</span>
              </button>
            </div>
          </div>

          {/* Serene Nature Visual Card */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="relative h-48 w-full bg-slate-100">
              <img
                src="/src/assets/images/mindfulness_serene_nature_1793177775419.jpg"
                alt="Tranquil Zen Water Reflection and Forest"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-5">
                <div className="text-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                    Vagus Nerve Reset
                  </div>
                  <h3 className="text-base font-bold">Nature Attunement & Slow Breathing</h3>
                </div>
              </div>
            </div>
            <div className="p-4 text-xs text-slate-600 leading-relaxed">
              Studies show that slow 0.1Hz breathing (6 breaths per minute) maximizes respiratory sinus arrhythmia, lowering resting heart rate and circulating cortisol within 3 minutes.
            </div>
          </div>
        </div>

        {/* Right Column: Mood & Stress Logger + 5-4-3-2-1 Grounding (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Quick Mood & Stress Logger */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-900">Daily Stress & Mood Check-In</h2>
              </div>
              {moodLoggedNotification && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Logged! ✓
                </span>
              )}
            </div>

            <form onSubmit={handleSaveCheckin} className="space-y-4">
              {/* Stress Slider (1-10) */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700">Perceived Stress Load</span>
                  <span className="font-extrabold text-teal-800 font-tabular">
                    {stressScore} / 10 ({stressScore <= 3 ? 'Low · Serene' : stressScore <= 6 ? 'Moderate' : 'High Alert'})
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={stressScore}
                  onChange={(e) => setStressScore(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>1 Calm</span>
                  <span>5 Balanced</span>
                  <span>10 Overwhelmed</span>
                </div>
              </div>

              {/* Mood State Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Dominant Emotional State
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMood === mood.label;
                    return (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() => setSelectedMood(mood.label)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-teal-700 border-teal-700 text-white font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{mood.emoji}</span>
                        <span>{mood.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes / Reflection */}
              <div>
                <label htmlFor="mindfulness-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mindfulness Reflection
                </label>
                <textarea
                  id="mindfulness-notes"
                  rows={2}
                  value={reflectionNotes}
                  onChange={(e) => setReflectionNotes(e.target.value)}
                  placeholder="What thoughts or sensations are you noticing?"
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Save Today's Check-In
              </button>
            </form>
          </div>

          {/* 2-Minute Grounding Technique (5-4-3-2-1 Sensory Protocol) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Compass className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">5-4-3-2-1 Sensory Grounding</h2>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Interrupt intrusive anxiety or racing thoughts by systematically anchoring in your physical environment.
            </p>

            <div className="space-y-2">
              {[
                { count: 5, sense: 'See', prompt: 'Notice 5 things you can observe around you.' },
                { count: 4, sense: 'Touch', prompt: 'Feel 4 textures (clothing, table, feet on floor).' },
                { count: 3, sense: 'Hear', prompt: 'Listen for 3 distinct ambient sounds.' },
                { count: 2, sense: 'Smell', prompt: 'Identify 2 natural scents in the air.' },
                { count: 1, sense: 'Taste', prompt: 'Notice 1 taste or take a mindful sip of water.' },
              ].map((step) => {
                const isChecked = !!groundingChecked[step.count];
                return (
                  <div
                    key={step.count}
                    onClick={() =>
                      setGroundingChecked((prev) => ({
                        ...prev,
                        [step.count]: !prev[step.count],
                      }))
                    }
                    className={`p-3 rounded-lg border text-xs flex items-center gap-3 transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-teal-50 border-teal-200 text-teal-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 font-bold text-[11px] ${
                        isChecked ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isChecked ? '✓' : step.count}
                    </div>
                    <div className="flex-1">
                      <strong className="font-semibold">{step.sense}:</strong> {step.prompt}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
