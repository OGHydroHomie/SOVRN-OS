import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onComplete: () => void;
}

/* Three lines, each: fade in 1s → hold 2s → fade out 0.5s (3.5s total).
   Screen C emphasizes "visible" in ember red. Plays once per session. */
const LINES: React.ReactNode[] = [
  'Every life follows a pattern.',
  'Most remain invisible.',
  <>Yours is about to become <span style={{ color: '#C21F2C' }}>visible</span>.</>,
];

export default function IntroCeremony({ onComplete }: Props) {
  const [i, setI] = useState(0);

  return (
    <motion.div
      key="ceremony"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      onClick={onComplete}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: '#0A0E1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 28px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
    >
      <motion.p
        key={i}
        className="sv-display"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 3.5, times: [0, 0.286, 0.857, 1], ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (i < LINES.length - 1) setI(i + 1);
          else onComplete();
        }}
        style={{
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.4,
          color: '#F4F1EA',
          maxWidth: 340,
        }}
      >
        {LINES[i]}
      </motion.p>
    </motion.div>
  );
}
