import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import type { QuizData } from '../types';
import { trackEvent } from '../utils/storage';

interface Props {
  text: string;
  isDone: boolean;
  quizData: QuizData;
}

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdarebvj';
/* Optional external application form for the founding circle. When empty,
   APPLY captures interest via Formspree instead of opening a dead link. */
const FOUNDING_CIRCLE_FORM_URL = '';

/* Superset of every section header the oracle can emit (backend emits four). */
const SECTION_HEADERS = [
  'SOUL ARCHITECTURE',
  'HIDDEN GIFTS',
  'SHADOW PATTERN',
  'RELATIONSHIP BLUEPRINT',
  'CAREER DESTINY',
  'TRUE NORTH',
  'FIRST SOVEREIGN ACT',
];
const HEADER_SET = new Set(SECTION_HEADERS);

interface Section { title: string; lines: string[]; }

function parseBlueprint(text: string): { preamble: string; sections: Section[] } {
  const lines = text.split('\n');
  const preamble: string[] = [];
  const sections: Section[] = [];
  let cur: Section | null = null;
  for (const line of lines) {
    const t = line.trim();
    if (HEADER_SET.has(t)) {
      cur = { title: t, lines: [] };
      sections.push(cur);
    } else if (cur) {
      cur.lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  return { preamble: preamble.join('\n').trim(), sections };
}

function isQuoteLine(t: string): boolean {
  if (!t) return false;
  return /^["“]/.test(t) || /^[—–]/.test(t) || (t.startsWith('-') && t.length > 40);
}

function renderBody(lines: string[], showCursor: boolean) {
  const out: React.ReactNode[] = [];
  let lastText = -1;
  lines.forEach((l, i) => { if (l.trim()) lastText = i; });

  lines.forEach((line, i) => {
    const t = line.trim();
    const cursor = showCursor && i === lastText ? <span className="sv-cursor-light" /> : null;
    if (t === '') {
      out.push(<div key={i} style={{ height: 10 }} />);
    } else if (isQuoteLine(t)) {
      out.push(
        <p key={i} className="sv-display" style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 18, lineHeight: 1.5, color: '#C21F2C', margin: '10px 0' }}>
          {line}{cursor}
        </p>
      );
    } else {
      out.push(
        <p key={i} className="sv-serif" style={{ fontSize: 16, lineHeight: 1.7, color: '#4A4A4A', marginBottom: 4 }}>
          {line}{cursor}
        </p>
      );
    }
  });
  return out;
}

export default function BlueprintPage({ text, isDone, quizData }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [blueprintNo] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [showDailyOS, setShowDailyOS] = useState(false);

  // Paced reveal — the text is inscribed at a readable cadence rather than
  // flooding in. `displayed` lags behind `text`, catching up on bursts.
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (displayed.length >= text.length) return;
    const remaining = text.length - displayed.length;
    const step = Math.max(4, Math.ceil(remaining / 20));
    const id = window.setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + step));
    }, 30);
    return () => window.clearTimeout(id);
  }, [text, displayed]);

  const revealing = displayed.length < text.length;
  const fullyDone = isDone && !revealing;

  useEffect(() => { trackEvent('pageView', 'blueprint'); }, []);

  // Keep the latest inscribed text in view
  useEffect(() => {
    if (!fullyDone && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayed, fullyDone]);

  const { preamble, sections } = parseBlueprint(displayed);
  const twoTone = ['#C21F2C', '#1A1A1A'];

  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const ember: [number, number, number] = [194, 31, 44];
    const ink: [number, number, number] = [26, 26, 26];
    const body: [number, number, number] = [74, 74, 74];
    const muted: [number, number, number] = [154, 154, 154];

    const fill = () => { doc.setFillColor(251, 250, 247); doc.rect(0, 0, pageWidth, pageHeight, 'F'); };
    fill();
    const checkPage = (needed: number) => { if (y + needed > 272) { doc.addPage(); fill(); y = 20; } };

    doc.setFont('times', 'normal');
    doc.setFontSize(10); doc.setTextColor(...ember);
    doc.text('SOVRN', pageWidth / 2, y, { align: 'center' }); y += 10;
    doc.setFontSize(20); doc.setTextColor(...ink);
    doc.text('SOVEREIGN BLUEPRINT', pageWidth / 2, y, { align: 'center' }); y += 9;
    doc.setFontSize(11); doc.setTextColor(...muted);
    doc.text(`Prepared for ${quizData.name}  ·  No. ${blueprintNo}`, pageWidth / 2, y, { align: 'center' }); y += 12;
    doc.setDrawColor(232, 230, 225); doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y); y += 10;

    for (const line of text.split('\n')) {
      const t = line.trim();
      if (HEADER_SET.has(t)) {
        checkPage(18); y += 4;
        doc.setFontSize(13); doc.setTextColor(...ink);
        doc.text(t, margin, y); y += 9;
      } else if (t === '') {
        y += 3;
      } else {
        const quote = isQuoteLine(t);
        doc.setFontSize(quote ? 12 : 10);
        doc.setTextColor(...(quote ? ember : body));
        const wrapped = doc.splitTextToSize(line, contentWidth);
        checkPage(wrapped.length * 5 + 2);
        doc.text(wrapped, margin, y); y += wrapped.length * (quote ? 6 : 5) + 2;
      }
    }
    checkPage(10); y += 8;
    doc.setFontSize(8); doc.setTextColor(...muted);
    doc.text('SOVRN — 2026', pageWidth / 2, y, { align: 'center' });
    doc.save(`SOVRN-Blueprint-${quizData.name.replace(/\s+/g, '-')}.pdf`);
  };

  const handleTransform = () => { trackEvent('ctaClick'); setShowDailyOS(true); };

  return (
    <div style={{ minHeight: '100svh', background: '#FBFAF7', color: '#4A4A4A', padding: '24px 20px 56px', position: 'relative' }}>
      {/* Dawn bloom — materialize into daylight as the dark loading screen crossfades out */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ position: 'fixed', inset: 0, background: '#FBFAF7', pointerEvents: 'none', zIndex: 10 }}
      />
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Masthead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="sv-eyebrow" style={{ fontSize: 13, letterSpacing: '0.22em', color: '#1A1A1A' }}>SOVRN</span>
          <span className="sv-label" style={{ fontSize: 11, color: '#9A9A9A', letterSpacing: '0.12em' }}>
            Blueprint No. {blueprintNo}
          </span>
        </div>
        <div style={{ height: 1, background: '#E8E6E1', margin: '14px 0 18px' }} />
        <p className="sv-label" style={{ fontSize: 11, color: '#C21F2C', letterSpacing: '0.18em', fontWeight: 500 }}>
          Results · Verified Reading
        </p>

        {/* Core quote (screenshot moment) */}
        {preamble && (
          <p className="sv-display" style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(24px, 6.6vw, 28px)', lineHeight: 1.35, color: '#C21F2C', textAlign: 'center', maxWidth: 480, margin: '48px auto', padding: '0 4px' }}>
            {preamble}
            {!fullyDone && sections.length === 0 && <span className="sv-cursor-light" />}
          </p>
        )}

        {/* Section cards */}
        <div style={{ marginTop: preamble ? 8 : 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map((s, i) => {
            const isLast = i === sections.length - 1;
            const num = String(i + 1).padStart(2, '0');
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', borderLeft: `3px solid ${twoTone[i % 2]}`, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h2 className="sv-label" style={{ fontSize: 12, color: '#1A1A1A', fontWeight: 700, letterSpacing: '0.1em' }}>{s.title}</h2>
                  <span className="sv-label" style={{ fontSize: 12, color: '#E8E6E1', fontWeight: 700 }}>{num}</span>
                </div>
                <div style={{ marginTop: 12 }}>{renderBody(s.lines, !fullyDone && isLast)}</div>
              </motion.div>
            );
          })}
        </div>

        <div ref={endRef} />

        {/* Completion */}
        {fullyDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div style={{ height: 32 }} />
            <div style={{ height: 1, background: '#E8E6E1' }} />
            <p className="sv-display" style={{ fontStyle: 'italic', fontWeight: 400, fontSize: 16, color: '#9A9A9A', textAlign: 'center', margin: '24px auto 0', maxWidth: 420 }}>
              This is your architecture. What you do with it defines everything.
            </p>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <button
                onClick={handleDownload}
                style={{ width: '100%', maxWidth: 340, minHeight: 48, background: 'transparent', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '18px 24px', cursor: 'pointer' }}
              >
                Download Blueprint
              </button>
              <button className="sv-btn" style={{ background: '#C21F2C' }} onClick={handleTransform}>
                Begin Your Transformation
              </button>
            </div>
            <p style={{ marginTop: 40, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 400, fontSize: 11, letterSpacing: '0.1em', color: '#9A9A9A', textAlign: 'center' }}>
              SOVRN — 2026
            </p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showDailyOS && (
          <DailyOSModal
            name={quizData.name}
            onClose={() => setShowDailyOS(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── The Daily OS — waitlist modal (replaces the old offer link) ── */
function DailyOSModal({ name, onClose }: { name: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (signupType: 'daily_os_waitlist' | 'founding_circle') => {
    if (signupType === 'founding_circle' && FOUNDING_CIRCLE_FORM_URL) {
      window.open(FOUNDING_CIRCLE_FORM_URL, '_blank', 'noopener');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email.'); return; }
    setError('');
    setState('submitting');
    try {
      await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, name, signup_type: signupType, source: 'blueprint_daily_os' }),
      });
    } catch {
      /* fire-and-forget — still thank them */
    }
    setState('done');
  };

  const features = [
    ['Morning', 'Personalized affirmation rewrites from your chart'],
    ['Afternoon', "One mission calibrated to today's transits"],
    ['Evening', 'Shadow check-in and sovereignty score'],
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,14,26,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', borderRadius: 16, boxShadow: '0 16px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 400, maxHeight: '90svh', overflowY: 'auto', padding: 28, position: 'relative' }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 999, border: '1px solid #E8E6E1', background: 'transparent', color: '#9A9A9A', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}
        >
          ×
        </button>

        {state === 'done' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p className="sv-display" style={{ fontWeight: 800, fontSize: 22, color: '#1A1A1A' }}>You're in.</p>
            <p className="sv-serif" style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: '#4A4A4A' }}>
              We'll email <strong style={{ color: '#1A1A1A' }}>{email}</strong> the moment the Daily OS opens. You're on the founding list.
            </p>
            <button className="sv-btn" style={{ background: '#C21F2C', marginTop: 24 }} onClick={onClose}>Back to my blueprint</button>
          </div>
        ) : (
          <>
            <p className="sv-label" style={{ fontSize: 12, color: '#C21F2C', letterSpacing: '0.14em', fontWeight: 700 }}>The Daily OS</p>
            <p className="sv-serif" style={{ marginTop: 8, fontSize: 16, lineHeight: 1.5, color: '#4A4A4A' }}>
              Your blueprint revealed the pattern. Break it daily.
            </p>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {features.map(([when, what]) => (
                <div key={when} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span className="sv-label" style={{ fontSize: 10, color: '#C21F2C', letterSpacing: '0.1em', minWidth: 68 }}>{when}</span>
                  <span className="sv-serif" style={{ fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>{what}</span>
                </div>
              ))}
            </div>

            <p className="sv-display" style={{ marginTop: 20, fontWeight: 700, fontSize: 18, color: '#1A1A1A' }}>$29/month · 3-day free trial</p>
            <p style={{ marginTop: 4, fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, color: '#9A9A9A', letterSpacing: '0.04em' }}>Launching soon — be first in.</p>

            <div style={{ marginTop: 18 }}>
              <input
                type="email" inputMode="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: '100%', minHeight: 48, background: '#FBFAF7', border: '1px solid #E8E6E1', borderRadius: 12, padding: '12px 14px', color: '#1A1A1A', fontFamily: 'Georgia, serif', fontSize: 16, outline: 'none' }}
              />
              {error && <p style={{ marginTop: 8, fontFamily: 'Georgia, serif', fontSize: 13, color: '#C21F2C' }}>{error}</p>}
              <button
                className="sv-btn"
                style={{ background: '#C21F2C', marginTop: 12, opacity: state === 'submitting' ? 0.7 : 1 }}
                disabled={state === 'submitting'}
                onClick={() => submit('daily_os_waitlist')}
              >
                {state === 'submitting' ? 'Joining…' : 'Join the Waitlist'}
              </button>
            </div>

            <div style={{ height: 1, background: '#E8E6E1', margin: '24px 0 18px' }} />

            <p className="sv-label" style={{ fontSize: 11, color: '#1A1A1A', letterSpacing: '0.12em', fontWeight: 700 }}>Or join the founding circle</p>
            <p className="sv-serif" style={{ marginTop: 6, fontSize: 15, lineHeight: 1.5, color: '#4A4A4A' }}>
              5 seats. 8 weeks. Free for founding members.
            </p>
            <button
              onClick={() => submit('founding_circle')}
              style={{ width: '100%', maxWidth: 340, minHeight: 48, marginTop: 12, background: 'transparent', color: '#1A1A1A', border: '1px solid #1A1A1A', borderRadius: 12, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '16px 24px', cursor: 'pointer' }}
            >
              Apply
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
