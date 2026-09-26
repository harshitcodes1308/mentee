// ─── Avatar Component — HackShastra style ─────────────────────────────────────
import { motion } from 'framer-motion';
import { getAvatarUrl } from '../lib/utils';

interface AvatarProps {
  seed: string;
  size?: number;
  bob?: boolean;
  className?: string;
  ring?: boolean;
}

export function Avatar({ seed, size = 48, bob = false, className = '', ring = false }: AvatarProps) {
  const url = getAvatarUrl(seed);

  return (
    <motion.div
      className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: ring ? '0 0 0 2px #C41111' : undefined,
        background: 'rgba(255,255,255,0.04)',
      }}
      animate={bob ? { y: [0, -4, 0] } : {}}
      transition={bob ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </motion.div>
  );
}

// ─── Avatar Wall ──────────────────────────────────────────────────────────────
interface AvatarWallProps {
  players: Array<{ tempId: string; avatarSeed: string; nickname: string }>;
}

export function AvatarWall({ players }: AvatarWallProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {players.map((p, i) => (
        <motion.div
          key={p.tempId}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 28,
            delay: Math.min(i * 0.04, 0.6),
          }}
          title={p.nickname}
        >
          <Avatar
            seed={p.avatarSeed}
            size={44}
            bob={true}
            ring={true}
          />
        </motion.div>
      ))}
    </div>
  );
}
