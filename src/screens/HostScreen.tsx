// ─── Host Screen — HackShastra minimal ────────────────────────────────────────
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import ReactConfetti from 'react-confetti';
import { useHostGame } from '../hooks/useGameStore';
import { QUESTIONS } from '../data/questions';
import { CountdownRing } from '../components/CountdownRing';
import { AvatarWall } from '../components/Avatar';
import { Leaderboard, Podium } from '../components/Leaderboard';
import { HackShastraLogo } from '../components/Logo';

const JOIN_URL = window.location.origin + '?join=';

const LETTERS = ['A', 'B', 'C', 'D'];
const LETTER_COLORS = ['#C41111', '#D97706', '#16A34A', '#2563EB'];

export function HostScreen() {
  const { room, players, leaderboard, timeLeft, createRoom, startQuiz, nextQuestion } = useHostGame();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    createRoom();
    const onResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (room?.status === 'finished') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 7000);
    }
  }, [room?.status]);

  if (!room) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontFamily: "'League Spartan', sans-serif" }}>
        Setting up room…
      </p>
    </div>
  );

  const joinUrl = JOIN_URL + room.code;
  const currentQ = QUESTIONS[room.currentQuestionIndex];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      {showConfetti && (
        <ReactConfetti
          width={windowSize.w}
          height={windowSize.h}
          numberOfPieces={200}
          recycle={false}
          colors={['#C41111', '#D97706', '#f5f5f5', '#16A34A', '#2563EB']}
        />
      )}

      <AnimatePresence mode="wait">

        {/* ─────────── WAITING ─────────── */}
        {room.status === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <HackShastraLogo size={32} showText={true} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#22C55E',
                    boxShadow: '0 0 0 3px rgba(34,197,94,0.15)',
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Waiting for players
                </span>
              </div>
            </div>

            {/* Main */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 0,
                padding: '2.5rem',
                maxWidth: 1280,
                width: '100%',
                margin: '0 auto',
              }}
            >
              {/* Left: QR + code */}
              <div style={{ width: 280, flexShrink: 0 }}>
                <div
                  className="card"
                  style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}
                >
                  {/* QR */}
                  <div
                    style={{
                      padding: '1rem',
                      background: '#fff',
                      borderRadius: 10,
                      lineHeight: 0,
                    }}
                  >
                    <QRCodeSVG
                      value={joinUrl}
                      size={188}
                      bgColor="#ffffff"
                      fgColor="#0D0D0D"
                      level="M"
                    />
                  </div>

                  {/* Room code */}
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                      Room Code
                    </p>
                    <motion.div
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                      style={{
                        fontFamily: "'League Spartan', sans-serif",
                        fontWeight: 900,
                        fontSize: '2.25rem',
                        letterSpacing: '0.2em',
                        color: 'var(--crimson)',
                      }}
                    >
                      {room.code}
                    </motion.div>
                  </div>

                  <div className="divider" />

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {window.location.host}
                  </p>
                </div>

                {/* Player count */}
                <div
                  className="card"
                  style={{ marginTop: '1rem', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Players in</span>
                  <motion.span
                    key={players.length}
                    initial={{ scale: 1.3, color: '#C41111' }}
                    animate={{ scale: 1, color: '#F0F0F0' }}
                    style={{
                      fontFamily: "'League Spartan', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.5rem',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {players.length}
                  </motion.span>
                </div>

                {/* Start button */}
                <motion.button
                  onClick={startQuiz}
                  disabled={players.length === 0}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  whileHover={players.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={players.length > 0 ? { scale: 0.98 } : {}}
                >
                  {players.length === 0 ? 'Waiting for players…' : `Start Quiz (${players.length})`}
                </motion.button>
              </div>

              {/* Right: Avatar wall */}
              <div
                style={{
                  padding: '0 0 0 2.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {players.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem',
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          border: '1px dashed var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                        }}
                      >
                        👥
                      </div>
                    </motion.div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      Waiting for hackers to scan…
                    </p>
                  </div>
                ) : (
                  <div>
                    <p
                      style={{
                        fontFamily: "'League Spartan', sans-serif",
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        marginBottom: '1.25rem',
                      }}
                    >
                      In the room
                    </p>
                    <AvatarWall players={players} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────── PLAYING ─────────── */}
        {room.status === 'playing' && currentQ && (
          <motion.div
            key={`q-${room.currentQuestionIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 2rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <HackShastraLogo size={28} showText={true} />

              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, maxWidth: 400, margin: '0 2rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', flexShrink: 0 }}>
                  {room.currentQuestionIndex + 1}/{QUESTIONS.length}
                </span>
                <div className="progress-track" style={{ flex: 1 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${((room.currentQuestionIndex) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-primary)', fontFamily: "'League Spartan', sans-serif", fontWeight: 700 }}>
                    {players.length}
                  </span> playing
                </span>
                <CountdownRing timeLeft={timeLeft} size={72} strokeWidth={5} />
                <motion.button
                  onClick={nextQuestion}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontFamily: "'League Spartan', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                  }}
                >
                  Next →
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: 0,
                maxWidth: 1280,
                width: '100%',
                margin: '0 auto',
                padding: '2rem',
              }}
            >
              {/* Question + options */}
              <div style={{ paddingRight: '2rem' }}>
                {/* Category badge */}
                <span className="badge badge-crimson" style={{ marginBottom: '1.25rem', display: 'inline-flex' }}>
                  {currentQ.category} · {currentQ.difficulty}
                </span>

                <h2
                  style={{
                    fontFamily: "'League Spartan', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                    marginBottom: '2rem',
                  }}
                >
                  {currentQ.text}
                </h2>

                {/* Options grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {currentQ.options.map((opt, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        padding: '1rem 1.125rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${LETTER_COLORS[idx]}15`,
                          border: `1px solid ${LETTER_COLORS[idx]}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontFamily: "'League Spartan', sans-serif",
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          color: LETTER_COLORS[idx],
                          flexShrink: 0,
                        }}
                      >
                        {LETTERS[idx]}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{opt}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: mini leaderboard */}
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: '0.875rem',
                  }}
                >
                  Standings
                </p>
                <Leaderboard players={leaderboard} maxShow={8} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─────────── FINISHED ─────────── */}
        {room.status === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '3rem 2rem',
            }}
          >
            <HackShastraLogo size={32} showText={true} />

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                marginTop: '2rem',
                textAlign: 'center',
              }}
            >
              Quiz Complete
            </motion.h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
              {leaderboard.length} players · GrandHack IPEC
            </p>

            <Podium players={leaderboard} />

            <div style={{ width: '100%', maxWidth: 480, marginTop: '2.5rem' }}>
              <p
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.875rem',
                }}
              >
                Final Leaderboard
              </p>
              <Leaderboard players={leaderboard} maxShow={10} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

