// ─── Player Screen — HackShastra minimal ──────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
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

  const { room, players, timeLeft, hasAnswered, lastAnswer, submitAnswer, joinGame } = usePlayerGame(
    roomCode,
    myPlayer?.tempId || '',
  );

  // Phase transitions
  useEffect(() => {
    if (!room) return;
    if (room.status === 'waiting' && phase === 'join' && myPlayer) setPhase('waiting');
    if (room.status === 'playing' && phase !== 'quiz') setPhase('quiz');
    if (room.status === 'finished') setPhase('results');
  }, [room?.status, phase, myPlayer]);

  // Shake on wrong
  useEffect(() => {
    if (lastAnswer && !lastAnswer.correct) {
      setShakeIdx(null); // trigger re-render if same wrong
    }
  }, [lastAnswer]);

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
      setPhase('waiting');
    }
  }, [joinGame, nickname]);

  const handleAnswer = useCallback((idx: number) => {
    if (hasAnswered) return;
    submitAnswer(idx);
    const q = room ? QUESTIONS[room.currentQuestionIndex] : null;
    if (q && idx !== q.correctIndex) {
      setShakeIdx(idx);
      setTimeout(() => setShakeIdx(null), 400);
    }
  }, [hasAnswered, submitAnswer, room]);

  const currentQ = room?.status === 'playing' ? QUESTIONS[room.currentQuestionIndex] : null;

  // Compute rank for results
  const myRankData = (() => {
    if (!myPlayer) return null;
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const rank = sorted.findIndex((p) => p.tempId === myPlayer.tempId) + 1;
    const found = players.find((p) => p.tempId === myPlayer.tempId);
    return { rank: rank || 1, player: found || myPlayer };
  })();

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

            <div
              className="card"
              style={{ padding: '1.25rem 2rem', marginBottom: '2.5rem' }}
            >
              <motion.span
                key={players.length}
                initial={{ scale: 1.2, color: '#C41111' }}
                animate={{ scale: 1, color: '#F0F0F0' }}
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  letterSpacing: '-0.04em',
                  display: 'block',
                }}
              >
                {players.length}
              </motion.span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>hackers in the room</span>
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
                  }}
                >
                  {myPlayer.score.toLocaleString()}
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

            {/* Feedback overlay */}
            <AnimatePresence>
              {lastAnswer && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 50,
                    background: 'var(--bg-card)',
                    border: `1px solid ${lastAnswer.correct ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    borderRadius: 16,
                    padding: '1.75rem 2.25rem',
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)',
                    minWidth: 200,
                  }}
                >
                  <p style={{ fontSize: '2rem', marginBottom: 8 }}>
                    {lastAnswer.correct ? '✓' : '✗'}
                  </p>
                  <p
                    style={{
                      fontFamily: "'League Spartan', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.375rem',
                      letterSpacing: '-0.02em',
                      color: lastAnswer.correct ? 'var(--correct)' : 'var(--wrong)',
                    }}
                  >
                    {lastAnswer.correct ? `+${lastAnswer.points}` : 'Wrong'}
                  </p>
                  {lastAnswer.correct && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4 }}>points</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentQ.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (hasAnswered) {
                  if (idx === currentQ.correctIndex) cls += ' option-correct';
                  else cls += ' option-dimmed';
                }
                const isWrong = lastAnswer && !lastAnswer.correct &&
                  idx !== currentQ.correctIndex &&
                  hasAnswered;

                return (
                  <motion.button
                    key={idx}
                    className={`${cls} ${shakeIdx === idx ? 'shake' : ''}`}
                    onClick={() => handleAnswer(idx)}
                    disabled={hasAnswered}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: hasAnswered && idx !== currentQ.correctIndex && !isWrong ? 0.35 : 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    whileHover={!hasAnswered ? { x: 2 } : {}}
                    whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                  >
                    <span
                      className="option-letter"
                      style={{
                        color: LETTER_COLORS[idx],
                        background: `${LETTER_COLORS[idx]}12`,
                      }}
                    >
                      {LETTERS[idx]}
                    </span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
                  </motion.button>
                );
              })}
            </div>

            {hasAnswered && !lastAnswer && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
                Locked in — waiting for next question
              </p>
            )}
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
