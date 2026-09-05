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
  const parentCtx = useContext(ResumeContext);
  if (parentCtx && !initialData) {
    return <>{children}</>;
  }
  return <ResumeProviderBase initialData={initialData}>{children}</ResumeProviderBase>;
}

function ResumeProviderBase({ children, initialData }: ResumeProviderProps) {
  const [data, setDataInternal] = useState<ResumeData>(() => {
    if (initialData) return sanitizeResumeData(initialData);
    try {
      const cached = localStorage.getItem('cached_resume_data');
      if (cached) {
        return sanitizeResumeData(JSON.parse(cached));
      }
    } catch { }
    return { ...EMPTY_RESUME };
  });

  // Automatically synchronize state to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('cached_resume_data', JSON.stringify(data));
    } catch { }
  }, [data]);

  const setData = useCallback((dataOrUpdater: ResumeData | ((prev: ResumeData) => ResumeData)) => {
    setDataInternal(prev => {
      const next = typeof dataOrUpdater === 'function' ? dataOrUpdater(prev) : dataOrUpdater;
      const sanitized = sanitizeResumeData(next);
      try {
        localStorage.setItem('cached_resume_data', JSON.stringify(sanitized));
      } catch { }
      return sanitized;
    });
  }, []);

  const updateField = useCallback(<K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setDataInternal(prev => {
      const updated = sanitizeResumeData({ ...prev, [key]: value });
      try {
        localStorage.setItem('cached_resume_data', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  }, []);

  const resetData = useCallback(() => {
    try {
      localStorage.removeItem('cached_resume_data');
    } catch { }
    setDataInternal({ ...EMPTY_RESUME });
  }, []);

  return (
    <ResumeContext.Provider value={{ data, setData, updateField, resetData }}>
      {children}
    </ResumeContext.Provider>
  );
}
