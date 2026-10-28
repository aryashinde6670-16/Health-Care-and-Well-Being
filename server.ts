import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Fallback triage knowledge base if API key is not present or rate limited
function getFallbackTriage(symptom: string, severity: string, duration: string) {
  const isHigh = severity.toLowerCase() === 'severe' || duration.toLowerCase().includes('more than 2 weeks');
  const isModerate = severity.toLowerCase() === 'moderate';

  const riskLevel = isHigh ? 'high' : isModerate ? 'moderate' : 'low';
  const riskBadge = isHigh
    ? 'High Risk · Consult Healthcare Professional'
    : isModerate
    ? 'Moderate Caution · Monitor Closely'
    : 'Low Risk · Lifestyle Self-Care';

  return {
    riskLevel,
    riskBadge,
    summary: `Based on reported ${severity.toLowerCase()} ${symptom} persisting for ${duration}, this triage provides evidence-informed lifestyle comfort guidance.`,
    potentialFactors: [
      'Inadequate hydration and electrolyte balance',
      'Prolonged static posture or physical muscle tension',
      'Circadian rhythm disruption or insufficient restorative sleep',
      'Elevated mental fatigue and digital screen overload'
    ],
    selfCareSteps: [
      {
        step: 1,
        title: 'Immediate Fluid & Electrolyte Replenishment',
        description: 'Drink 250-400ml of room temperature water or an electrolyte solution in gentle sips.'
      },
      {
        step: 2,
        title: 'Sensory Decompression & Posture Reset',
        description: 'Step away from all backlit screens for 15 minutes. Perform gentle neck and shoulder rolls.'
      },
      {
        step: 3,
        title: 'Rest & Gentle Observation',
        description: 'Lie down in a dim, well-ventilated room with elevated knees for 20 minutes to relieve cardiovascular strain.'
      },
      {
        step: 4,
        title: 'Nutritious Anti-Inflammatory Nourishment',
        description: 'Consume a clean, light meal with wholesome proteins, greens, and complex carbohydrates while avoiding excess caffeine.'
      }
    ],
    redFlags: [
      'Sudden onset severe unbearable pain or "worst symptom of life"',
      'Fever exceeding 38.5°C (101.3°F) or persistent chills',
      'Shortness of breath, dizziness, chest pressure, or fainting',
      'Neurological alterations such as numbness, tingling, or vision disturbances'
    ],
    recommendedDurationToDoctor: isHigh
      ? 'Seek prompt clinical medical evaluation today.'
      : 'If symptoms persist or worsen beyond 48-72 hours, schedule an appointment with your primary physician.',
    disclaimer: 'Mandatory Medical Notice: Health Flow AI Wellness Coach provides non-medical lifestyle and wellness education only. It does not provide medical diagnoses, treatment plans, or clinical prescriptions. Always seek the advice of your qualified healthcare provider with any medical questions.'
  };
}

// Symptom Triage Endpoint
app.post('/api/triage', async (req, res) => {
  const { symptom, severity, duration, notes, healthProfile } = req.body;

  if (!symptom) {
    return res.status(400).json({ error: 'Symptom is required' });
  }

  // Attempt Gemini API call
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are Health Flow's certified AI Wellness and Symptom Triage Advisor.
Analyze the user's reported symptom:
- Symptom / Issue: "${symptom}"
- Severity: "${severity || 'Mild'}"
- Duration: "${duration || '1-2 days'}"
- Context / Notes: "${notes || 'None provided'}"
- User Profile: Age ${healthProfile?.age || 'Adult'}, Activity: ${healthProfile?.activityLevel || 'Moderate'}, Water Goal: ${healthProfile?.waterGoal || '2500ml'}.

Provide a calm, non-medical triage assessment. Determine if this warrants:
1) "low" risk (lifestyle self-care, dehydration, fatigue, minor muscular tension, poor posture, stress),
2) "moderate" risk (caution, needs monitoring over 48 hours, lifestyle remedies plus close observation), or
3) "high" risk (red flag symptoms, severe pain, chronic persistence, requires professional clinical evaluation).

Follow strict JSON schema output.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskLevel: {
                type: Type.STRING,
                description: '"low", "moderate", or "high"',
              },
              riskBadge: {
                type: Type.STRING,
                description: 'Clear safety assessment badge label (e.g., "Low Risk · Lifestyle Self-Care" or "High Risk · Consult Doctor")',
              },
              summary: {
                type: Type.STRING,
                description: 'Empathetic, clear, objective 2-sentence summary of the assessment.',
              },
              potentialFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-4 realistic lifestyle, ergonomic, sleep, or dietary contributors.',
              },
              selfCareSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ['step', 'title', 'description'],
                },
                description: '3-4 sequential, actionable, non-medical self-care steps for comfort and recovery.',
              },
              redFlags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-4 specific warning signs that require immediate urgent medical attention.',
              },
              recommendedDurationToDoctor: {
                type: Type.STRING,
                description: 'Clear timeframe regarding when to consult a licensed medical doctor.',
              },
              disclaimer: {
                type: Type.STRING,
                description: 'Clear medical disclaimer emphasizing educational non-medical triage.',
              },
            },
            required: [
              'riskLevel',
              'riskBadge',
              'summary',
              'potentialFactors',
              'selfCareSteps',
              'redFlags',
              'recommendedDurationToDoctor',
              'disclaimer',
            ],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return res.json(parsed);
      }
    } catch (err: any) {
      console.warn('Gemini Triage API error, using intelligent fallback:', err?.message || err);
    }
  }

  // Graceful fallback
  const fallback = getFallbackTriage(symptom, severity || 'Mild', duration || '1-2 days');
  return res.json(fallback);
});

// Wellness Coach Chat Endpoint
app.post('/api/coach-chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = `You are "Coach Mira", a supportive, certified integrative health and wellness specialist at Health Flow.
Your communication tone:
- Warm, empathetic, calm, scientifically grounded, and concise.
- Provide actionable lifestyle advice: hydration, stress mitigation, sleep hygiene, gentle mobility, ergonomic adjustments, and mindful breathing.
- NEVER diagnose illnesses, prescribe medications, or replace doctors.
- When symptoms sound concerning or high-risk, kindly advise consulting a licensed physician.
- Keep responses readable, structured with short paragraphs or 2-3 bullet points.`;

      const contents = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          contents.push({
            role: item.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: item.content }],
          });
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text || 'I am here with you to support your wellness goals. How can I assist you with your habits or recovery today?';
      return res.json({ reply });
    } catch (err: any) {
      console.warn('Gemini Coach Chat API error, using fallback:', err?.message || err);
    }
  }

  return res.json({
    reply: "I am here to support your daily wellness journey! Remember to drink plenty of clean water, take brief screen breaks every 45 minutes, and practice mindful deep breathing to keep your nervous system in balance. What habits are you focusing on today?"
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Health Flow server active on port ${port}`);
  });
}

startServer();
