import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Pick a good English voice
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prefer a natural-sounding English voice
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Google') ||
          v.name.includes('Samantha') ||
          v.name.includes('Daniel'))
    );
    if (preferred) return preferred;
    // Fallback: any English voice
    const english = voices.find((v) => v.lang.startsWith('en'));
    return english || voices[0] || null;
  }, [isSupported]);

  // Chrome has a bug where speechSynthesis pauses after ~15s.
  // Work around by splitting long text into chunks and chaining them.
  const splitIntoChunks = useCallback((text: string, maxLen = 180): string[] => {
    if (text.length <= maxLen) return [text];

    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length > maxLen && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = current ? current + ' ' + sentence : sentence;
      }
    }
    if (current.trim()) {
      chunks.push(current.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      utterancesRef.current = [];

      const cleanText = text
        .replace(/\[CODE_QUESTION\]/g, '')
        .replace(/```[\s\S]*?```/g, '(code block)')
        .replace(/`[^`]+`/g, (match) => match.replace(/`/g, ''))
        .trim();

      if (!cleanText) return;

      const chunks = splitIntoChunks(cleanText);
      const voice = getVoice();

      const speakChunk = (index: number) => {
        if (index >= chunks.length) {
          setIsSpeaking(false);
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
          speakChunk(index + 1);
        };

        utterance.onerror = (event) => {
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            console.warn('Speech synthesis error:', event.error);
          }
          setIsSpeaking(false);
        };

        utterancesRef.current.push(utterance);
        window.speechSynthesis.speak(utterance);
      };

      setIsSpeaking(true);
      speakChunk(0);
    },
    [isSupported, getVoice, splitIntoChunks]
  );

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utterancesRef.current = [];
    setIsSpeaking(false);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  // Load voices (they load asynchronously in some browsers)
  useEffect(() => {
    if (!isSupported) return;
    // Trigger voice loading
    window.speechSynthesis.getVoices();
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isSupported]);

  return { speak, cancel, isSpeaking, isSupported };
}
