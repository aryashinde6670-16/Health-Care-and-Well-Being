import React, { useState } from 'react';
import { TriageAssessment, ChatMessage, UserProfile } from '../types';
import { 
  Stethoscope, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  HeartHandshake, 
  RefreshCw,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface SymptomTriageProps {
  profile: UserProfile;
  triageHistory: TriageAssessment[];
  onSaveAssessment: (assessment: TriageAssessment) => void;
}

const PRESET_SYMPTOMS = [
  { name: 'Tension Headache', severity: 'Mild' as const, duration: '1-2 days', notes: 'Dull ache across temples after long desk work' },
  { name: 'Afternoon Energy Crash', severity: 'Mild' as const, duration: 'Today (<24h)', notes: 'Sudden slumping fatigue around 3 PM' },
  { name: 'Digital Eye Strain & Brain Fog', severity: 'Mild' as const, duration: '2-3 days', notes: 'Heavy eyes and difficulty focusing on text' },
  { name: 'Neck & Upper Trapezius Stiffness', severity: 'Moderate' as const, duration: '3-5 days', notes: 'Tightness when turning head, desk worker posture' },
  { name: 'Sleep-Onset Restlessness', severity: 'Mild' as const, duration: '1-2 weeks', notes: 'Racing mind and tossing for 45+ minutes in bed' },
  { name: 'Post-Workout Quadricep Soreness', severity: 'Mild' as const, duration: '1-2 days', notes: 'Delayed onset muscle stiffness following leg day' },
];

export const SymptomTriage: React.FC<SymptomTriageProps> = ({
  profile,
  triageHistory,
  onSaveAssessment,
}) => {
  // Form State
  const [symptomInput, setSymptomInput] = useState('');
  const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe'>('Mild');
  const [duration, setDuration] = useState('1-2 days');
  const [contextNotes, setContextNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Active Assessment State
  const [currentAssessment, setCurrentAssessment] = useState<TriageAssessment | null>(
    triageHistory.length > 0 ? triageHistory[0] : null
  );

  // Follow-up Coach Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${profile.name}! I am Coach Mira, your certified wellness and lifestyle advisor. How can I help you support your physical comfort, recovery, or hydration today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [userChatInput, setUserChatInput] = useState('');
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  // Handle Symptom Submission
  const handleSubmitTriage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptomInput.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptom: symptomInput.trim(),
          severity,
          duration,
          notes: contextNotes.trim(),
          healthProfile: {
            age: profile.ageGroup,
            waterGoal: `${profile.waterGoalMl}ml`,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to retrieve triage guidance');
      const data = await response.json();

      const newAssessment: TriageAssessment = {
        id: `triage-${Date.now()}`,
        timestamp: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        symptom: symptomInput.trim(),
        severity,
        duration,
        notes: contextNotes.trim(),
        riskLevel: data.riskLevel || 'low',
        riskBadge: data.riskBadge || 'Low Risk · Lifestyle Self-Care',
        summary: data.summary,
        potentialFactors: data.potentialFactors || [],
        selfCareSteps: (data.selfCareSteps || []).map((step: any) => ({ ...step, completed: false })),
        redFlags: data.redFlags || [],
        recommendedDurationToDoctor: data.recommendedDurationToDoctor,
        disclaimer: data.disclaimer,
      };

      setCurrentAssessment(newAssessment);
      onSaveAssessment(newAssessment);
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_SYMPTOMS[0]) => {
    setSymptomInput(preset.name);
    setSeverity(preset.severity);
    setDuration(preset.duration);
    setContextNotes(preset.notes);
  };

  const toggleSelfCareStep = (stepIndex: number) => {
    if (!currentAssessment) return;
    const updatedSteps = [...currentAssessment.selfCareSteps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      completed: !updatedSteps[stepIndex].completed,
    };
    const updatedAssessment = {
      ...currentAssessment,
      selfCareSteps: updatedSteps,
    };
    setCurrentAssessment(updatedAssessment);
    onSaveAssessment(updatedAssessment);
  };

  const handleSendCoachMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userChatInput.trim() || isCoachThinking) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userChatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setUserChatInput('');
    setIsCoachThinking(true);

    try {
      const response = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: chatMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Coach service unavailable');
      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || 'Hydration and balanced rest will help you regain your vitality.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Coach Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: 'Stay well hydrated with warm water, avoid extended screen glare, and take five slow breaths. If discomfort continues, check in with your primary doctor.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsCoachThinking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
            <span>Clinical-Grade Wellness</span>
            <span aria-hidden="true">·</span>
            <span>Educational Triage</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            AI Wellness Coach & Symptom Triage
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Evaluate everyday physiological discomforts, receive evidence-informed lifestyle recovery steps, and identify potential medical red flags.
          </p>
        </div>

        {/* Coach Mira Profile Capsule */}
        <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-teal-100 border border-teal-200 shrink-0">
            <img
              src="/src/assets/images/avatar_wellness_coach_1793177775746.jpg"
              alt="Coach Mira, Certified Wellness Specialist"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Coach Mira</span>
              <span className="text-[11px] font-normal text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-sm">
                Certified
              </span>
            </div>
            <div className="text-xs text-slate-500">Integrative Health & Recovery</div>
          </div>
          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className="ml-2 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {showChat ? 'Close Chat' : 'Ask Mira'}
          </button>
        </div>
      </div>

      {/* Main Grid: Form / Input (Left) + AI Assessment Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Form & Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900">Describe Your Symptom or Discomfort</h2>
            </div>

            <form onSubmit={handleSubmitTriage} className="space-y-4">
              {/* Primary Symptom Search / Input */}
              <div>
                <label htmlFor="symptom-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Symptom or Issue
                </label>
                <div className="relative">
                  <input
                    id="symptom-input"
                    type="text"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    placeholder="e.g. Throbbing tension headache, Afternoon brain fog..."
                    className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                    required
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Severity Selector */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Perceived Severity Level
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Mild', 'Moderate', 'Severe'] as const).map((sev) => {
                    const isSelected = severity === sev;
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                          isSelected
                            ? sev === 'Mild'
                              ? 'bg-teal-50 border-teal-500 text-teal-800 font-semibold shadow-xs'
                              : sev === 'Moderate'
                              ? 'bg-amber-50 border-amber-500 text-amber-800 font-semibold shadow-xs'
                              : 'bg-rose-50 border-rose-500 text-rose-800 font-semibold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <label htmlFor="duration-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  How long has this persisted?
                </label>
                <select
                  id="duration-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                >
                  <option value="Today (<24 hours)">Today (&lt; 24 hours)</option>
                  <option value="1-2 days">1-2 days</option>
                  <option value="3-5 days">3-5 days</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="More than 2 weeks">More than 2 weeks (Chronic)</option>
                </select>
              </div>

              {/* Context / Trigger Notes */}
              <div>
                <label htmlFor="context-notes" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Context, Triggers or Notes <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="context-notes"
                  rows={2}
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="e.g. Skipped lunch, worked 8 hours at laptop, poor night's sleep..."
                  className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !symptomInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Physiological Factors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Triage Guidance</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Presets Section */}
            <div className="pt-3 border-t border-slate-100">
              <span className="block text-xs font-semibold text-slate-500 mb-2">
                Common Scenarios
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SYMPTOMS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-md border border-slate-200 transition-colors text-left cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Past Triage History Pill-free List */}
          {triageHistory.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Recent Triage Logs
              </div>
              <div className="divide-y divide-slate-100">
                {triageHistory.slice(0, 4).map((hist) => (
                  <button
                    key={hist.id}
                    type="button"
                    onClick={() => setCurrentAssessment(hist)}
                    className="w-full text-left py-2.5 hover:bg-slate-50 px-2 rounded-lg transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {hist.symptom}
                      </div>
                      <div className="text-[11px] text-slate-500 font-tabular">
                        {hist.timestamp} · {hist.severity} · {hist.riskBadge}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Triage Response Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {currentAssessment ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
              {/* Header with Risk Assessment Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 font-tabular">
                    Logged: {currentAssessment.timestamp}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                    {currentAssessment.symptom}
                  </h2>
                </div>

                {/* Safety Assessment Badge */}
                <div
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0 flex items-center gap-1.5 ${
                    currentAssessment.riskLevel === 'high'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : currentAssessment.riskLevel === 'moderate'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-teal-50 border-teal-200 text-teal-800'
                  }`}
                >
                  {currentAssessment.riskLevel === 'high' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  )}
                  <span>{currentAssessment.riskBadge}</span>
                </div>
              </div>

              {/* Assessment Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-teal-700" />
                  Triage Summary & Clinical Context
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {currentAssessment.summary}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentAssessment.recommendedDurationToDoctor}</span>
                </div>
              </div>

              {/* Potential Contributing Factors */}
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Potential Non-Medical Contributors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentAssessment.potentialFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step-by-Step Self-Care Plan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Recommended Self-Care Recovery Plan
                  </h3>
                  <span className="text-xs text-slate-500 font-tabular">
                    {currentAssessment.selfCareSteps.filter((s) => s.completed).length} of{' '}
                    {currentAssessment.selfCareSteps.length} completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentAssessment.selfCareSteps.map((step, idx) => {
                    const isDone = !!step.completed;
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleSelfCareStep(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isDone
                            ? 'bg-teal-50/60 border-teal-200'
                            : 'bg-white border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                            isDone
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isDone ? '✓' : step.step}
                        </div>
                        <div className="flex-1">
                          <div
                            className={`text-sm font-semibold transition-colors ${
                              isDone ? 'line-through text-teal-900' : 'text-slate-900'
                            }`}
                          >
                            {step.title}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Warning Red Flags Callout */}
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Clinical Red Flags: Seek Prompt In-Person Medical Attention If:</span>
                </div>
                <ul className="text-xs text-rose-900/90 space-y-1 pl-6 list-disc">
                  {currentAssessment.redFlags.map((flag, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Medical Disclaimer Banner */}
              <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  <strong className="font-semibold text-slate-800">Mandatory Medical Notice: </strong>
                  {currentAssessment.disclaimer}
                </p>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">
                  Ready for Symptom Triage & Recovery Guidance
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Select a common wellness scenario from the left or type your symptom to receive risk assessment, potential lifestyle factors, and an interactive recovery checklist.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating / Expandable Coach Mira Interactive Consultation Drawer */}
      {showChat && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[480px]">
          {/* Chat Header */}
          <div className="px-4 py-3 bg-teal-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-teal-600 border border-teal-300">
                <img
                  src="/src/assets/images/avatar_wellness_coach_1793177775746.jpg"
                  alt="Coach Mira"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-xs font-bold">Coach Mira · Wellness Chat</div>
                <div className="text-[10px] text-teal-200">Non-medical lifestyle guidance</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowChat(false)}
              className="text-teal-200 hover:text-white text-xs px-2 py-1 rounded-md"
            >
              ✕
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-teal-700 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-tabular">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            {isCoachThinking && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Coach Mira is formulating advice...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendCoachMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={userChatInput}
              onChange={(e) => setUserChatInput(e.target.value)}
              placeholder="Ask a question about your self-care..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
            />
            <button
              type="submit"
              disabled={isCoachThinking || !userChatInput.trim()}
              className="px-3 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
