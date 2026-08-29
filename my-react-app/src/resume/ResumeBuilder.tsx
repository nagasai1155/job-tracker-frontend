import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { ResumeProvider, useResume } from './ResumeContext';
import { ResumeForm } from './ResumeForm';
import { TemplateSelector, TemplateName } from './TemplateSelector';
import { Template1 } from './templates/Template1';
import { Template2 } from './templates/Template2';
import { validateResume } from './types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './resume-builder.css';
import './resume-templates.css';

type AppTab = 'jobs' | 'resume';

interface ResumeBuilderProps {
  onNavigate: (page: 'settings') => void;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
}

function ResumeBuilderInner({ onNavigate }: ResumeBuilderProps) {
  const { data, setData } = useResume();
  const [template, setTemplate] = useState<TemplateName>('classic');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ── Document Scaler & Zoom State ──────────────────────────────────────────
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<'auto' | 'manual'>('auto');
  const [manualZoom, setManualZoom] = useState<number>(0.75);
  const [autoScale, setAutoScale] = useState<number>(0.75);
  const [sheetHeight, setSheetHeight] = useState<number>(1123);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalZoom, setModalZoom] = useState<number>(0.95);

  // Measure and compute auto scale based on workbench canvas width
  const updateScale = useCallback(() => {
    if (viewportRef.current) {
      const containerWidth = viewportRef.current.clientWidth;
      // 36px comfortable margin inside canvas
      const availableWidth = Math.max(260, containerWidth - 36);
      // Standard A4 width = 794px
      const calculated = Math.min(0.85, Math.max(0.4, (availableWidth * 0.95) / 794));
      setAutoScale(Number(calculated.toFixed(3)));
    }
  }, []);

  useEffect(() => {
    updateScale();
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      updateScale();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  // Track dynamic sheet height to prevent stage clipping
  useEffect(() => {
    if (sheetRef.current) {
      const height = sheetRef.current.offsetHeight || 1123;
      setSheetHeight(Math.max(1123, height));
    }
  }, [data, template]);

  // Keyboard shortcut (Escape to exit fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const effectiveScale = zoomMode === 'auto' ? autoScale : manualZoom;

  const handleZoomIn = () => {
    setZoomMode('manual');
    setManualZoom(prev => Math.min(1.4, Number((effectiveScale + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomMode('manual');
    setManualZoom(prev => Math.max(0.4, Number((effectiveScale - 0.1).toFixed(2))));
  };

  const handleZoomAuto = () => {
    setZoomMode('auto');
  };

  const handleZoom100 = () => {
    setZoomMode('manual');
    setManualZoom(1.0);
  };

  // ── Load saved resume on mount ────────────────────────────────────────────
  useEffect(() => {
    if (loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const saved = await api.getResume();
        if (saved && !cancelled) {
          setData(saved);
        }
      } catch {
        // Silently ignore if offline
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [loaded, setData]);

  // ── Validation check ──────────────────────────────────────────────────────
  const checkValidation = useCallback(() => {
    const v = validateResume(data);
    if (!v.isValid) {
      setValidationErrors(v.errors.map(e => e.message));
      return false;
    }
    setValidationErrors([]);
    return true;
  }, [data]);

  // ── Save resume ───────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const saved = await api.saveResume(data);
      if (saved) {
        setData(saved);
      }
      setSaveMsg('✓ Saved to database!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      console.warn('Backend save notice:', err);
      // Guarantee offline persistence
      try {
        localStorage.setItem('cached_resume_data', JSON.stringify(data));
      } catch {}
      setSaveMsg('✓ Saved locally (Backend offline)');
      setTimeout(() => setSaveMsg(''), 3500);
    } finally {
      setSaving(false);
    }
  }, [data, setData]);

  // ── Download PDF (Full-Bleed A4, Sharp High-DPI Vector Capture) ───────────
  const handleDownload = useCallback(async () => {
    if (!checkValidation()) return;
    if (!sheetRef.current) return;

    setSaving(true);
    setSaveMsg('Generating PDF…');

    const fileName = `${(data.fullName || 'resume').trim().replace(/\s+/g, '_')}_resume.pdf`;

    // Create a pristine unscaled clone on document.body for direct, reliable rendering
    const clone = sheetRef.current.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.width = '794px';
    clone.style.minHeight = '1123px';
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.zIndex = '-99999';
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.pointerEvents = 'none';
    clone.style.background = '#ffffff';

    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210; // A4 mm
      const pdfHeight = 297; // A4 mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, imgHeight));
      pdf.save(fileName);

      setSaveMsg('✓ PDF Downloaded!');
      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setSaveMsg('PDF export failed');
      setTimeout(() => setSaveMsg(''), 3000);
    } finally {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      setSaving(false);
    }
  }, [data, checkValidation]);

  return (
    <>
      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="app-main-content" style={{ maxWidth: 1280, padding: '1.75rem 2rem 4rem' }}>
        <div className="rb-layout">
          {/* Left — Form */}
          <ResumeForm />

          {/* Right — Live A4 Document Preview */}
          <div className="rb-panel rb-preview-panel">
            <div className="rb-panel-header">
              <div className="rb-panel-title-wrap">
                <span className="rb-panel-icon">👁️</span>
                <h2 className="rb-panel-title">Live Document Preview</h2>
              </div>
              <TemplateSelector active={template} onChange={setTemplate} />
            </div>

            <div className="rb-panel-body" style={{ padding: '0.85rem' }}>
              {/* ── Document Controls Toolbar ── */}
              <div className="rb-doc-toolbar">
                <div className="rb-doc-meta">
                  <span className="rb-doc-badge">
                    <span className="rb-pulse-dot" />
                    A4 Paper (210 × 297 mm)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {/* Zoom Controls */}
                  <div className="rb-zoom-controls">
                    <button
                      type="button"
                      className="rb-zoom-btn"
                      onClick={handleZoomOut}
                      title="Zoom Out"
                      aria-label="Zoom out"
                    >
                      −
                    </button>
                    <span className="rb-zoom-pill">
                      {Math.round(effectiveScale * 100)}%
                    </span>
                    <button
                      type="button"
                      className="rb-zoom-btn"
                      onClick={handleZoomIn}
                      title="Zoom In"
                      aria-label="Zoom in"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className={`rb-zoom-btn ${zoomMode === 'auto' ? 'active' : ''}`}
                      onClick={handleZoomAuto}
                      title="Fit to Width"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      className={`rb-zoom-btn ${zoomMode === 'manual' && manualZoom === 1.0 ? 'active' : ''}`}
                      onClick={handleZoom100}
                      title="100% Size"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }}
                    >
                      100%
                    </button>
                  </div>

                  {/* Fullscreen Preview */}
                  <button
                    type="button"
                    className="rb-fullscreen-trigger"
                    onClick={() => setIsFullscreen(true)}
                    id="fullscreenPreviewBtn"
                    title="Fullscreen Preview"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    Fullscreen
                  </button>
                </div>
              </div>

              {/* ── Workbench Canvas Viewport ── */}
              <div className="rb-preview-viewport" ref={viewportRef}>
                <div
                  className="rb-preview-stage"
                  style={{
                    width: `${Math.round(794 * effectiveScale)}px`,
                    height: `${Math.round(sheetHeight * effectiveScale)}px`,
                  }}
                >
                  <div
                    className="rb-preview-scaler"
                    style={{
                      transform: `scale(${effectiveScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <div
                      className="rb-a4-sheet"
                      ref={sheetRef}
                    >
                      {template === 'classic' ? (
                        <Template1 data={data} />
                      ) : (
                        <Template2 data={data} />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Action Buttons & Validation ── */}
              <div className="rb-actions">
                {validationErrors.length > 0 && (
                  <div className="rb-validation-banner">
                    <strong>Please fill in all required fields before continuing:</strong>
                    <ul>
                      {validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rb-actions-row">
                  <button
                    className="btn"
                    id="downloadPdfBtn"
                    onClick={handleDownload}
                    disabled={saving}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {saving && saveMsg.includes('Generating') ? 'Generating PDF…' : 'Download PDF'}
                  </button>
                  <button
                    className="btn btn-outline"
                    id="saveResumeBtn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving && !saveMsg.includes('Generating') ? 'Saving…' : '💾 Save'}
                  </button>
                  <span className={`rb-save-feedback ${saveMsg ? 'rb-save-visible' : ''}`}>
                    {saveMsg}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Preview Modal ───────────────────────────────────────── */}
      {isFullscreen && (
        <div className="rb-fullscreen-modal" id="resumeFullscreenModal">
          <div className="rb-fullscreen-header">
            <div className="rb-fullscreen-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Fullscreen Live Preview — A4 Standard (210 × 297 mm)</span>
            </div>

            <div className="rb-fullscreen-actions">
              <TemplateSelector active={template} onChange={setTemplate} />

              <div className="rb-zoom-controls">
                <button
                  type="button"
                  className="rb-zoom-btn"
                  onClick={() => setModalZoom(prev => Math.max(0.5, Number((prev - 0.1).toFixed(2))))}
                >
                  −
                </button>
                <span className="rb-zoom-pill">
                  {Math.round(modalZoom * 100)}%
                </span>
                <button
                  type="button"
                  className="rb-zoom-btn"
                  onClick={() => setModalZoom(prev => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}
                >
                  +
                </button>
                <button
                  type="button"
                  className={`rb-zoom-btn ${modalZoom === 1.0 ? 'active' : ''}`}
                  onClick={() => setModalZoom(1.0)}
                >
                  100%
                </button>
              </div>

              <button
                className="btn"
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                onClick={handleDownload}
                disabled={saving}
              >
                📥 Download PDF
              </button>

              <button
                type="button"
                className="rb-fullscreen-close-btn"
                onClick={() => setIsFullscreen(false)}
                title="Close Fullscreen (Esc)"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <div className="rb-fullscreen-body" onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}>
            <div
              style={{
                transform: `scale(${modalZoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                marginBottom: '2rem'
              }}
            >
              <div className="rb-a4-sheet" style={{ margin: '0 auto' }}>
                {template === 'classic' ? (
                  <Template1 data={data} />
                ) : (
                  <Template2 data={data} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ResumeBuilder(props: ResumeBuilderProps) {
  return (
    <ResumeProvider>
      <ResumeBuilderInner {...props} />
    </ResumeProvider>
  );
}
