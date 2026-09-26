// ─── Countdown Ring — Crimson minimal ─────────────────────────────────────────
import { motion } from 'framer-motion';
import { QUESTION_TIME_SEC } from '../data/questions';

interface CountdownRingProps {
  timeLeft: number;
  size?: number;
  strokeWidth?: number;
}

export function CountdownRing({ timeLeft, size = 80, strokeWidth = 5 }: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / QUESTION_TIME_SEC;
  const offset = circumference * (1 - progress);

  // Crimson → amber → muted at 0
  const color =
    timeLeft > 8 ? '#C41111' :
    timeLeft > 4 ? '#D97706' :
                   '#EF4444';

  const isUrgent = timeLeft <= 3 && timeLeft > 0;

  return (
    <motion.div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
      animate={isUrgent ? { scale: [1, 1.04, 1] } : { scale: 1 }}
      transition={isUrgent ? { duration: 0.7, repeat: Infinity } : {}}
    >
      <svg
        className="countdown-svg"
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Arc */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </svg>
      {/* Number */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.span
          key={Math.ceil(timeLeft)}
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            fontFamily: "'League Spartan', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.3,
            color,
            letterSpacing: '-0.02em',
          }}
        >
          {Math.ceil(timeLeft)}
        </motion.span>
      </div>
    </motion.div>
  );
}
