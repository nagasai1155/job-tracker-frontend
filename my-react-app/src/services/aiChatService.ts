// AI Chat Service using Google Gemini API

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const getGeminiApiKey = (): string => {
  return (process.env.REACT_APP_GEMINI_API_KEY ?? '').trim();
};

const SYSTEM_INSTRUCTION = `You are "CareerBot", an elite AI Career Coach and Job Application Assistant integrated into JobTracker Pro.
Your mission is to help job seekers, developers, and professionals succeed in their job search.

You specialize in:
1. Resume Reviews & Bullet Point Optimization (using the Action Verb + Context + Quantifiable Metric formula).
2. Tech & Behavioral Interview Preparation (STAR method, system design, DSA, cultural fit).
3. Cold Outreach & Networking Messages (LinkedIn DMs, referral requests, recruiter follow-ups).
4. Application Strategy & Pipeline Organization (handling rejection, managing multiple offers, salary negotiation).

Guidelines:
- Give concise, highly practical, structured answers with bullet points and bold highlights.
- When reviewing resumes or drafting emails, provide concrete, ready-to-copy examples.
- Be encouraging, confident, and professional.`;

const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.6-flash';

export async function sendChatMessage(
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file and restart the development server.'
    );
  }

  // Build the conversation history payload for Gemini
  const contents = history.map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  // Append current user message
  contents.push({
    role: 'user',
    parts: [{ text: newMessage }],
  });

  const requestBody = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  };

  const callModel = async (model: string): Promise<string> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No text response received from AI model.');
    }

    return text;
  };

  try {
    return await callModel(PRIMARY_MODEL);
  } catch (primaryErr) {
    console.warn(`Primary model (${PRIMARY_MODEL}) failed, trying fallback (${FALLBACK_MODEL})...`, primaryErr);
    try {
      return await callModel(FALLBACK_MODEL);
    } catch (fallbackErr: any) {
      console.error('All AI models failed:', fallbackErr);
      throw new Error(
        fallbackErr?.message || 'Failed to connect to AI assistant. Please check your network connection.'
      );
    }
  }
}
