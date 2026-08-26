import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ResumeData, EMPTY_RESUME, sanitizeResumeData } from './types';

interface ResumeContextValue {
  data: ResumeData;
  setData: (dataOrUpdater: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
  updateField: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  resetData: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function useResume(): ResumeContextValue {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within <ResumeProvider>');
  return ctx;
}

interface ResumeProviderProps {
  children: ReactNode;
  initialData?: ResumeData;
}

export function ResumeProvider({ children, initialData }: ResumeProviderProps) {
  const [data, setDataInternal] = useState<ResumeData>(() => sanitizeResumeData(initialData));

  const setData = useCallback((dataOrUpdater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setDataInternal(prev => {
      const next = typeof dataOrUpdater === 'function' ? dataOrUpdater(prev) : dataOrUpdater;
      return sanitizeResumeData(next);
    });
  }, []);

  const updateField = useCallback(<K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setDataInternal(prev => sanitizeResumeData({ ...prev, [key]: value }));
  }, []);

  const resetData = useCallback(() => {
    setDataInternal({ ...EMPTY_RESUME });
  }, []);

  return (
    <ResumeContext.Provider value={{ data, setData, updateField, resetData }}>
      {children}
    </ResumeContext.Provider>
  );
}
