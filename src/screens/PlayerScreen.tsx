// ─── Player Screen — HackShastra minimal ──────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerGame } from '../hooks/useGameStore';
import { QUESTIONS } from '../data/questions';
import { CountdownRing } from '../components/CountdownRing';
import { Avatar } from '../components/Avatar';
import { Leaderboard } from '../components/Leaderboard';
import { HackShastraLogo } from '../components/Logo';
import { ordinal } from '../lib/utils';
import type { Player } from '../types';

interface PlayerScreenProps {
  roomCode: string;
}

const PLAYER_KEY = 'mq_my_player';
const LETTER_COLORS = ['#C41111', '#D97706', '#16A34A', '#2563EB'];
const LETTERS = ['A', 'B', 'C', 'D'];

function loadMyPlayer(): Player | null {
  try { return JSON.parse(sessionStorage.getItem(PLAYER_KEY) || 'null'); }
  catch { return null; }
}
function saveMyPlayer(p: Player) {
  sessionStorage.setItem(PLAYER_KEY, JSON.stringify(p));
}

export function PlayerScreen({ roomCode }: PlayerScreenProps) {
  const [phase, setPhase] = useState<'join' | 'waiting' | 'quiz' | 'results'>('join');
  const [myPlayer, setMyPlayer] = useState<Player | null>(() => loadMyPlayer());
  const [nickname, setNickname] = useState('');
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Question answer selection & locking
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [baseScore, setBaseScore] = useState<number>(0);
  const prevQIdxRef = useRef<number>(-1);

  const { room, players, timeLeft, hasAnswered, submitAnswer, joinGame } = usePlayerGame(
    roomCode,
    myPlayer?.tempId || '',
  );

  const currentQ = room?.status === 'playing' ? QUESTIONS[room.currentQuestionIndex] : null;
  const isTimeUp = timeLeft <= 0;

  // Compute rank for results
  const myRankData = (() => {
    if (!myPlayer) return null;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex((p) => p.tempId === myPlayer.tempId) + 1;
    const found = players.find((p) => p.tempId === myPlayer.tempId);
    return { rank: rank || 1, player: found || myPlayer };
  })();

  const currentScore = myRankData?.player.score ?? myPlayer?.score ?? 0;

  // Reset selection and lock on each new question; snapshot base score
  useEffect(() => {
    if (room && room.status === 'playing') {
      if (prevQIdxRef.current !== room.currentQuestionIndex) {
        prevQIdxRef.current = room.currentQuestionIndex;
        setSelectedIdx(null);
        setIsLocked(false);
        setBaseScore(currentScore);
      }
    }
  }, [room?.currentQuestionIndex, room?.status, currentScore]);

  // Phase transitions
  useEffect(() => {
    if (!room) return;
    if (room.status === 'waiting' && phase === 'join' && myPlayer) setPhase('waiting');
    if (room.status === 'playing' && phase !== 'quiz') setPhase('quiz');
    if (room.status === 'finished') setPhase('results');
  }, [room?.status, phase, myPlayer]);

  // Auto-lock and submit if timer runs out with an option selected but not locked
  useEffect(() => {
    if (isTimeUp && selectedIdx !== null && !isLocked && !hasAnswered) {
      setIsLocked(true);
      submitAnswer(selectedIdx);
    }
  }, [isTimeUp, selectedIdx, isLocked, hasAnswered, submitAnswer]);

  const handleJoin = useCallback(async () => {
    setIsJoining(true);
    setJoinError(null);
    const result = await joinGame(nickname);
    setIsJoining(false);
    if (!result.ok) {
      setJoinError(result.error || 'Failed to join room. Please check the code.');
      return;
    }
    if (result.player) {
      saveMyPlayer(result.player);
      setMyPlayer(result.player);
      setBaseScore(result.player.score);
      setPhase('waiting');
    }
  }, [joinGame, nickname]);

  const handleSelectOption = useCallback((idx: number) => {
    if (isLocked) {
      setShakeIdx(idx);
      setTimeout(() => setShakeIdx(null), 350);
      return;
    }
    if (isTimeUp) return;
    setSelectedIdx(idx);
  }, [isLocked, isTimeUp]);

  const handleLockIn = useCallback(() => {
    if (selectedIdx === null || isLocked || isTimeUp) return;
    setIsLocked(true);
    submitAnswer(selectedIdx);
  }, [selectedIdx, isLocked, isTimeUp, submitAnswer]);

  // Score shown on quiz: stays at baseScore while timer runs; reveals final score when time is up
  const displayedScore = isTimeUp
    ? currentScore
    : baseScore;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AnimatePresence mode="wait">

        {/* ─── JOIN ─── */}
        {phase === 'join' && (
          <motion.div
            key="join"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1.5rem',
            }}
          >
            <HackShastraLogo size={34} showText={true} style={{ marginBottom: '2.5rem' }} />

            {/* Room badge */}
            <div className="badge badge-crimson" style={{ marginBottom: '2rem' }}>
              Room {roomCode}
            </div>

            <h1
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 800,
                fontSize: '1.75rem',
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                marginBottom: '0.375rem',
                textAlign: 'center',
              }}
            >
              You're joining
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem', textAlign: 'center' }}>
              No sign-up needed — you'll get an avatar instantly
            </p>

            <div style={{ width: '100%', maxWidth: 360 }}>
              <input
                type="text"
                className="input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Nickname (optional)"
                style={{ marginBottom: '0.75rem', textAlign: 'center' }}
              />
              <motion.button
                onClick={handleJoin}
                disabled={isJoining}
                className="btn-primary"
                style={{ width: '100%', opacity: isJoining ? 0.7 : 1, cursor: isJoining ? 'wait' : 'pointer' }}
                whileHover={isJoining ? {} : { scale: 1.02 }}
                whileTap={isJoining ? {} : { scale: 0.97 }}
              >
                {isJoining ? 'Joining…' : 'Join Quiz →'}
              </motion.button>
              {joinError && (
                <p style={{ color: '#EF4444', fontSize: '0.8125rem', marginTop: '0.75rem', textAlign: 'center' }}>
                  {joinError}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── WAITING ─── */}
        {phase === 'waiting' && myPlayer && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1.5rem',
              textAlign: 'center',
            }}
          >
            <HackShastraLogo size={28} showText={true} style={{ marginBottom: '2.5rem' }} />

            <Avatar seed={myPlayer.avatarSeed} size={72} bob={true} ring={true} />

            <h2
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 800,
                fontSize: '1.5rem',
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                marginTop: '1.25rem',
                marginBottom: 4,
              }}
            >
              {myPlayer.nickname}
            </h2>
            <span className="badge badge-crimson" style={{ marginBottom: '2rem' }}>
              {myPlayer.tempId}
            </span>

            {/* Score & Room status cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.875rem',
                width: '100%',
                maxWidth: 340,
                marginBottom: '2.5rem',
              }}
            >
              <div className="card" style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Current Score
                </p>
                <motion.span
                  key={currentScore}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  style={{
                    fontFamily: "'League Spartan', sans-serif",
                    fontWeight: 900,
                    fontSize: '2rem',
                    letterSpacing: '-0.03em',
                    color: 'var(--text-primary)',
                    display: 'block',
                  }}
                >
                  {currentScore.toLocaleString()}
                </motion.span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>pts</span>
              </div>

              <div className="card" style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Hackers in Room
                </p>
                <motion.span
                  key={players.length}
                  initial={{ scale: 1.2, color: '#C41111' }}
                  animate={{ scale: 1, color: '#F0F0F0' }}
                  style={{
                    fontFamily: "'League Spartan', sans-serif",
                    fontWeight: 900,
                    fontSize: '2rem',
                    letterSpacing: '-0.03em',
                    color: 'var(--crimson)',
                    display: 'block',
                  }}
                >
                  {players.length}
                </motion.span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>connected</span>
              </div>
            </div>

            {/* Waiting dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="dot"
                  style={{
                    width: 6, height: 6,
                    background: 'var(--text-muted)',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 12 }}>
              Waiting for the host to start
            </p>
          </motion.div>
        )}

        {/* ─── QUIZ ─── */}
        {phase === 'quiz' && currentQ && myPlayer && (
          <motion.div
            key={`quiz-${room?.currentQuestionIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              maxWidth: 500,
              width: '100%',
              margin: '0 auto',
              padding: '1rem 1.25rem 1.5rem',
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Question
                </p>
                <p
                  style={{
                    fontFamily: "'League Spartan', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  {(room?.currentQuestionIndex || 0) + 1}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.875rem' }}>
                    /{QUESTIONS.length}
                  </span>
                </p>
              </div>

              <CountdownRing timeLeft={timeLeft} size={60} strokeWidth={4} />

              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Score
                </p>
                <p
                  style={{
                    fontFamily: "'League Spartan', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 6,
                  }}
                >
                  {displayedScore.toLocaleString()}
                  {isTimeUp && selectedIdx !== null && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        fontFamily: "'League Spartan', sans-serif",
                        fontWeight: 900,
                        fontSize: '0.875rem',
                        color: selectedIdx === currentQ.correctIndex ? 'var(--correct)' : 'var(--wrong)',
                      }}
                    >
                      {selectedIdx === currentQ.correctIndex ? '+100' : '-50'}
                    </motion.span>
                  )}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="progress-track" style={{ marginBottom: '1.25rem' }}>
              <div
                className="progress-fill"
                style={{ width: `${(((room?.currentQuestionIndex || 0)) / QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Streak badge */}
            {myPlayer.streak >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ marginBottom: '0.875rem' }}
              >
                <span
                  className="badge"
                  style={{
                    background: 'rgba(217, 119, 6, 0.1)',
                    color: '#D97706',
                    border: '1px solid rgba(217,119,6,0.25)',
                  }}
                >
                  🔥 {myPlayer.streak}× streak
                </span>
              </motion.div>
            )}

            {/* Question */}
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card"
              style={{ padding: '1.25rem', marginBottom: '1rem' }}
            >
              <p
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 700,
                  fontSize: '1.0625rem',
                  lineHeight: 1.45,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                }}
              >
                {currentQ.text}
              </p>
            </motion.div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentQ.options.map((opt, idx) => {
                let cls = 'option-btn';
                const isSelected = selectedIdx === idx;

                if (!isTimeUp) {
                  if (isSelected) {
                    cls += ' option-selected';
                    if (isLocked) cls += ' option-locked';
                  } else if (isLocked) {
                    cls += ' option-dimmed';
                  }
                } else {
                  if (idx === currentQ.correctIndex) {
                    cls += ' option-correct';
                  } else if (isSelected) {
                    cls += ' option-wrong';
                  } else {
                    cls += ' option-dimmed';
                  }
                }

                return (
                  <motion.button
                    key={idx}
                    className={`${cls} ${shakeIdx === idx ? 'shake' : ''}`}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isLocked || isTimeUp}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={!isLocked && !isTimeUp ? { x: 2 } : {}}
                    whileTap={!isLocked && !isTimeUp ? { scale: 0.98 } : {}}
                  >
                    <span
                      className="option-letter"
                      style={{
                        color: isSelected ? '#FFFFFF' : LETTER_COLORS[idx],
                        background: isSelected ? 'var(--crimson)' : `${LETTER_COLORS[idx]}12`,
                      }}
                    >
                      {LETTERS[idx]}
                    </span>
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: isSelected ? 600 : 500 }}>
                      {opt}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '0.875rem' }}>
                        {isLocked ? '🔒' : '●'}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Lock-In Action & Time-Up Feedback Bar */}
            <div style={{ marginTop: '1.25rem' }}>
              {!isTimeUp && !isLocked && (
                <div>
                  {selectedIdx !== null ? (
                    <motion.button
                      onClick={handleLockIn}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '0.875rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>Lock In Option {LETTERS[selectedIdx]}</span>
                      <span>🔒</span>
                    </motion.button>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '0.875rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      Tap an option above to select your answer
                    </div>
                  )}
                </div>
              )}

              {!isTimeUp && isLocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: '0.875rem 1.25rem',
                    background: 'var(--bg-card)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>🔒</span>
                  <span style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 700, fontSize: '0.9375rem', color: '#F0F0F0' }}>
                    Option {selectedIdx !== null ? LETTERS[selectedIdx] : ''} Locked In
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>· Result reveals at timer end</span>
                </motion.div>
              )}

              {isTimeUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-card)',
                    border: `1px solid ${
                      selectedIdx === currentQ.correctIndex
                        ? 'rgba(34, 197, 94, 0.5)'
                        : selectedIdx !== null
                        ? 'rgba(239, 68, 68, 0.5)'
                        : 'var(--border)'
                    }`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                  }}
                >
                  {selectedIdx === currentQ.correctIndex ? (
                    <div>
                      <p style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--correct)', marginBottom: 2 }}>
                        ✓ Correct Answer! +100 pts
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        Option {LETTERS[currentQ.correctIndex]} is right
                      </p>
                    </div>
                  ) : selectedIdx !== null ? (
                    <div>
                      <p style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: 'var(--wrong)', marginBottom: 2 }}>
                        ✗ Wrong Answer! -50 pts
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        Correct was Option {LETTERS[currentQ.correctIndex]}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontFamily: "'League Spartan', sans-serif", fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                        ⏰ Time Expired — No Answer (0 pts)
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        Correct was Option {LETTERS[currentQ.correctIndex]}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── RESULTS ─── */}
        {phase === 'results' && myPlayer && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '2rem 1.5rem',
            }}
          >
            <HackShastraLogo size={28} showText={true} style={{ marginBottom: '2rem' }} />

            <Avatar seed={myPlayer.avatarSeed} size={64} bob={true} ring={true} />

            <h2
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 900,
                fontSize: '1.75rem',
                letterSpacing: '-0.035em',
                color: 'var(--text-primary)',
                marginTop: '1rem',
                marginBottom: 4,
              }}
            >
              {myPlayer.nickname}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
              GrandHack IPEC · Final Result
            </p>

            {/* Result card */}
            <div
              className="card-accent"
              style={{
                width: '100%',
                maxWidth: 340,
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  {
                    label: 'Rank',
                    value: myRankData?.rank ? ordinal(myRankData.rank) : '—',
                    color: 'var(--crimson-light)',
                  },
                  {
                    label: 'Score',
                    value: (myRankData?.player.score ?? myPlayer.score).toLocaleString(),
                    color: 'var(--text-primary)',
                  },
                  {
                    label: 'Correct',
                    value: `${myRankData?.player.correctAnswers ?? myPlayer.correctAnswers}/20`,
                    color: 'var(--correct)',
                  },
                  {
                    label: 'Best Streak',
                    value: `${myRankData?.player.bestStreak ?? myPlayer.bestStreak}×`,
                    color: '#D97706',
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '0.875rem 0' }}>
                    <p
                      style={{
                        fontFamily: "'League Spartan', sans-serif",
                        fontWeight: 900,
                        fontSize: '1.625rem',
                        letterSpacing: '-0.03em',
                        color,
                        marginBottom: 3,
                      }}
                    >
                      {value}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="divider" style={{ margin: '1rem 0 0.875rem' }} />

              <button
                onClick={() => {
                  navigator.share?.({
                    title: 'HackShastra Quiz Result',
                    text: `I scored ${myPlayer.score.toLocaleString()} pts at GrandHack IPEC! 🚀`,
                  }).catch(() => {});
                }}
                className="btn-ghost"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                📤 Share Result
              </button>
            </div>

            {/* Leaderboard */}
            {players.length > 0 && (
              <div style={{ width: '100%', maxWidth: 400 }}>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    marginBottom: '0.75rem',
                  }}
                >
                  Leaderboard
                </p>
                <Leaderboard players={players} maxShow={10} myTempId={myPlayer.tempId} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
