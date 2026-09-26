// ─── Leaderboard — minimal ────────────────────────────────────────────────────
import { motion } from 'framer-motion';
import type { Player } from '../types';
import { Avatar } from './Avatar';
import { ordinal } from '../lib/utils';

function sortPlayers(players: Player[]) {
  return [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
    return a.totalTimeMs - b.totalTimeMs;
  });
}

const RANK_COLORS = ['#D4AF37', '#9EA3A8', '#9C6B2E'];

interface LeaderboardProps {
  players: Player[];
  maxShow?: number;
  myTempId?: string;
}

export function Leaderboard({ players, maxShow = 10, myTempId }: LeaderboardProps) {
  const sorted = sortPlayers(players).slice(0, maxShow);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {sorted.map((p, i) => {
        const isMe = p.tempId === myTempId;
        const rankColor = RANK_COLORS[i] || 'var(--text-secondary)';

        return (
          <motion.div
            key={p.tempId}
            className={`lb-row ${isMe ? 'lb-row-me' : ''}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, ease: 'easeOut' }}
          >
            {/* Rank */}
            <span
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 800,
                fontSize: '1rem',
                color: rankColor,
                width: 28,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
            </span>

            <Avatar seed={p.avatarSeed} size={32} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: isMe ? 'var(--crimson-light)' : 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.01em',
                }}
              >
                {p.nickname || `Player ${p.tempId.slice(-4)}`}
                {isMe && (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.75rem', marginLeft: 6 }}>
                    you
                  </span>
                )}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>
                {p.correctAnswers}/20
                {p.bestStreak > 1 && ` · ${p.bestStreak}× streak`}
              </p>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: rankColor,
                  letterSpacing: '-0.01em',
                }}
              >
                {p.score.toLocaleString()}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Podium (top 3) ────────────────────────────────────────────────────────────
interface PodiumProps {
  players: Player[];
}

const PODIUM_H = [110, 150, 80];
const PODIUM_ORDER = [1, 0, 2]; // visual: 2nd, 1st, 3rd

export function Podium({ players }: PodiumProps) {
  const sorted = sortPlayers(players).slice(0, 3);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginTop: 24 }}>
      {PODIUM_ORDER.map((pIdx) => {
        const player = sorted[pIdx];
        if (!player) return <div key={pIdx} style={{ width: 96 }} />;
        const color = RANK_COLORS[pIdx] || '#888';

        return (
          <motion.div
            key={player.tempId}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (2 - pIdx) * 0.25, type: 'spring', stiffness: 180 }}
          >
            {/* Medal emoji */}
            <span style={{ fontSize: 24, marginBottom: 8 }}>
              {['🥇', '🥈', '🥉'][pIdx]}
            </span>

            <Avatar seed={player.avatarSeed} size={50} bob={true} ring={true} />

            <p
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 700,
                fontSize: '0.8rem',
                color,
                marginTop: 8,
                maxWidth: 88,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '-0.01em',
              }}
            >
              {player.nickname || `P-${player.tempId.slice(-4)}`}
            </p>
            <p
              style={{
                fontFamily: "'League Spartan', sans-serif",
                fontWeight: 800,
                fontSize: '1rem',
                color,
                letterSpacing: '-0.02em',
              }}
            >
              {player.score.toLocaleString()}
            </p>

            {/* Block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: PODIUM_H[pIdx] }}
              transition={{ delay: (2 - pIdx) * 0.25 + 0.15, duration: 0.5, ease: 'easeOut' }}
              style={{
                width: 88,
                marginTop: 8,
                borderRadius: '6px 6px 0 0',
                background: `${color}12`,
                border: `1px solid ${color}30`,
                borderBottom: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 10,
              }}
            >
              <span
                style={{
                  fontFamily: "'League Spartan', sans-serif",
                  fontWeight: 900,
                  fontSize: '1.75rem',
                  color: `${color}50`,
                }}
              >
                {pIdx + 1}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export { ordinal };
