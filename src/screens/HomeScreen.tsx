// ─── Home Screen — HackShastra minimal ───────────────────────────────────────
import { useState } from 'react';
import { motion } from 'framer-motion';
import { HackShastraLogo } from '../components/Logo';

interface HomeScreenProps {
  onHostClick: () => void;
  onPlayerClick: (code: string) => void;
}

export function HomeScreen({ onHostClick, onPlayerClick }: HomeScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) { setError('Enter the room code from the big screen'); return; }
    setError('');
    onPlayerClick(trimmed);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--bg-base)',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '3.5rem' }}
      >
        <HackShastraLogo size={42} showText={true} />
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <h1
          style={{
            fontFamily: "'League Spartan', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Live Quiz
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
          GrandHack IPEC · Mentee Session
        </p>
      </motion.div>

      {/* Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          width: '100%',
          maxWidth: 400,
        }}
      >
        {/* Host */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: '1.75rem', borderBottom: 'none', borderRadius: '14px 14px 0 0' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Big Screen
              </p>
              <h2
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.375rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                Host a Room
              </h2>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--crimson-muted)',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                flexShrink: 0,
              }}
            >
              🖥
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Generate a QR code, watch avatars join live, and run the quiz from the big screen.
          </p>
          <motion.button
            onClick={onHostClick}
            className="btn-primary"
            style={{ width: '100%' }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            Launch Host Screen
          </motion.button>
        </motion.div>

        {/* Divider line */}
        <div style={{ background: 'var(--border)', height: '1px' }} />

        {/* Player */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="card"
          style={{ padding: '1.75rem', borderTop: 'none', borderRadius: '0 0 14px 14px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>
                Phone
              </p>
              <h2
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.375rem',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}
              >
                Join Quiz
              </h2>
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                flexShrink: 0,
              }}
            >
              📱
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            Scan the QR on the big screen, or enter the room code below.
          </p>
          <input
            type="text"
            className="input"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase().slice(0, 6)); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="ROOM CODE"
            style={{
              textAlign: 'center',
              fontFamily: "'League Spartan', sans-serif",
              fontWeight: 700,
              fontSize: '1.25rem',
              letterSpacing: '0.15em',
              marginBottom: error ? 6 : '0.875rem',
            }}
          />
          {error && (
            <p style={{ color: 'var(--wrong)', fontSize: '0.75rem', marginBottom: '0.875rem' }}>{error}</p>
          )}
          <motion.button
            onClick={handleJoin}
            className="btn-ghost"
            style={{ width: '100%' }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            Join →
          </motion.button>
        </motion.div>
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          marginTop: '2.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        Demo: open two tabs — Host + Player — to simulate the full experience
      </motion.p>
    </div>
  );
}
