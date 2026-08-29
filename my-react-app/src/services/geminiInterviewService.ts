// ─── Gemini Interview Service ────────────────────────────────────────────────
// All Gemini API calls for the AI Interview feature are isolated here.
// To swap in a backend proxy later, only this file needs to change.

import {
  InterviewConfig,
  TranscriptEntry,
  InterviewSummaryResult,
  CODE_QUESTION_MARKER,
} from '../interview/types';

// ─── API Config ──────────────────────────────────────────────────────────────

const getGeminiApiKey = (): string => {
  return (process.env.REACT_APP_GEMINI_API_KEY ?? '').trim();
};

const PRIMARY_MODEL = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.6-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ─── System Instruction Builder ──────────────────────────────────────────────

function buildSystemInstruction(config: InterviewConfig): string {
  return `You are a professional ${config.seniority}-level technical interviewer conducting a ${config.interviewType} interview for the role of "${config.role}".

CANDIDATE BACKGROUND (from their resume):
${config.resumeText || 'No resume provided.'}

INTERVIEW RULES:
1. Ask ONE question at a time. Wait for the candidate's response before asking the next question.
2. Keep your responses conversational and concise — like a real interviewer, not an essay. 2-4 sentences max for commentary, then your next question.
3. For ${config.interviewType === 'technical' ? 'this technical interview, focus on coding challenges, system design, and technical problem-solving' : config.interviewType === 'behavioral' ? 'this behavioral interview, focus on STAR-method questions about past experiences, teamwork, leadership, and conflict resolution' : 'this mixed interview, alternate between behavioral questions (STAR method) and technical questions (coding, system design)'}.
4. Calibrate difficulty for a ${config.seniority}-level candidate.
5. When you want the candidate to write code, prefix your ENTIRE message with exactly "${CODE_QUESTION_MARKER}" (including the brackets). After the marker, describe the coding problem clearly. Only use this marker for actual coding problems — not for verbal technical questions.
6. After receiving code submissions, review the code briefly, point out any issues or improvements, then move on.
7. The interview is ${config.duration} minutes long. You will be told when time is running low — wrap up naturally at that point.
8. Start by introducing yourself briefly, then ask your first question.
9. Be professional, encouraging, and realistic. Give brief positive acknowledgment of good answers, and gently probe weak ones.
10. Do NOT reveal you are an AI. Act as a human interviewer named "Alex".`;
}

// ─── Conversation History Formatter ──────────────────────────────────────────

interface GeminiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

function transcriptToGeminiContents(transcript: TranscriptEntry[]): GeminiContent[] {
  return transcript.map((entry) => ({
    role: entry.role === 'candidate' ? 'user' : 'model',
    parts: [
      {
        text: entry.codeSubmission
          ? `${entry.text}\n\n[Submitted Code (${entry.codeLanguage || 'unknown'})]\n\`\`\`\n${entry.codeSubmission}\n\`\`\``
          : entry.text,
      },
    ],
  }));
}

// ─── Core API Caller ─────────────────────────────────────────────────────────

async function callGemini(
  systemInstruction: string,
  contents: GeminiContent[],
  temperature: number = 0.8
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file and restart the development server.'
    );
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents,
    generationConfig: {
      temperature,
      topP: 0.95,
      maxOutputTokens: 1024,
    },
  };

  const callModel = async (model: string): Promise<string> => {
    const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

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
        fallbackErr?.message || 'Failed to connect to AI interviewer. Please check your network connection.'
      );
    }
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Start a new interview conversation. Returns the AI interviewer's opening message.
 */
export async function startInterviewConversation(config: InterviewConfig): Promise<string> {
  const systemInstruction = buildSystemInstruction(config);

  // Send a "start" message to kick off the interview
  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [{ text: 'Hello, I\'m ready for the interview. Please begin.' }],
    },
  ];

  return callGemini(systemInstruction, contents);
}

/**
 * Send the candidate's answer and get the interviewer's next response.
 */
export async function sendInterviewTurn(
  config: InterviewConfig,
  transcript: TranscriptEntry[],
  candidateAnswer: string,
  timeWarning?: string
): Promise<string> {
  const systemInstruction = buildSystemInstruction(config);
  const contents = transcriptToGeminiContents(transcript);

  // Append the new candidate answer
  let answerText = candidateAnswer;
  if (timeWarning) {
    answerText += `\n\n[SYSTEM NOTE: ${timeWarning}]`;
  }
  contents.push({
    role: 'user',
    parts: [{ text: answerText }],
  });

  return callGemini(systemInstruction, contents);
}

/**
 * Get a structured evaluation of the completed interview.
 */
export async function getInterviewSummary(
  config: InterviewConfig,
  transcript: TranscriptEntry[]
): Promise<InterviewSummaryResult> {
  const summaryInstruction = `You are an expert interview evaluator. Analyze the following interview transcript and provide a structured evaluation.

INTERVIEW CONTEXT:
- Role: ${config.role}
- Type: ${config.interviewType}
- Seniority: ${config.seniority}

RESPOND IN VALID JSON ONLY (no markdown, no code fences, no explanation). Use this exact schema:
{
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "score": <number 1-10>,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "overallFeedback": "A 2-3 sentence overall assessment"
}`;

  const transcriptText = transcript
    .map((entry) => {
      const role = entry.role === 'interviewer' ? 'Interviewer' : 'Candidate';
      let text = entry.text;
      if (entry.codeSubmission) {
        text += `\n[Code Submission]\n${entry.codeSubmission}`;
      }
      return `${role}: ${text}`;
    })
    .join('\n\n');

  const contents: GeminiContent[] = [
    {
      role: 'user',
      parts: [{ text: `Here is the full interview transcript:\n\n${transcriptText}\n\nPlease evaluate this interview.` }],
    },
  ];

  const response = await callGemini(summaryInstruction, contents, 0.3);

  try {
    // Try to parse the JSON response — strip any accidental markdown fences
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned) as InterviewSummaryResult;

    // Validate and sanitize
    return {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      score: typeof parsed.score === 'number' ? Math.min(10, Math.max(1, Math.round(parsed.score))) : 5,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      overallFeedback: typeof parsed.overallFeedback === 'string' ? parsed.overallFeedback : 'Interview evaluation completed.',
    };
  } catch {
    // If JSON parsing fails, return a fallback with the raw text
    console.warn('Failed to parse interview summary JSON, using fallback');
    return {
      strengths: ['Completed the interview'],
      weaknesses: ['Unable to parse detailed evaluation'],
      score: 5,
      suggestions: ['Try again for a more detailed evaluation'],
      overallFeedback: response.slice(0, 500),
    };
  }
}
