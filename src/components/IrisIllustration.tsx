import { motion } from 'motion/react';
import { Species } from '../types';

interface IrisIllustrationProps {
  species: Species;
  className?: string;
}

export default function IrisIllustration({ species, className = '' }: IrisIllustrationProps) {
  // We'll render a beautiful stylized SVG representing each species.
  // Setosa: Small petals, compact upright build.
  // Versicolor: Medium petals, balanced color.
  // Virginica: Large, drooping petals, robust build.

  const renderFlower = () => {
    switch (species) {
      case 'Iris-setosa':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stem & Leaves */}
            <path d="M50 80 Q48 100 50 120" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <motion.path
              d="M50 95 Q30 90 20 75 Q32 85 50 95"
              fill="#059669"
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            />
            <motion.path
              d="M50 105 Q70 100 80 85 Q68 95 50 105"
              fill="#059669"
              animate={{ rotate: [2, -2, 2] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
            />

            {/* Setosa Flower head: upright, small petals */}
            <g transform="translate(50, 60)">
              {/* Back Sepals (Small) */}
              <motion.path
                d="M0 0 Q-15 -30 -30 -15 Q-15 0 0 0"
                fill="#60a5fa"
                opacity="0.8"
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q15 -30 30 -15 Q15 0 0 0"
                fill="#60a5fa"
                opacity="0.8"
                animate={{ scale: [0.98, 1.02, 0.98] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
              />

              {/* Main Center Petals - upright & compact */}
              <motion.path
                d="M0 0 Q-10 -40 0 -50 Q10 -40 0 0"
                fill="#3b82f6"
                animate={{ rotate: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q-20 -25 -10 -40 Q0 -25 0 0"
                fill="#2563eb"
                opacity="0.9"
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q20 -25 10 -40 Q0 -25 0 0"
                fill="#2563eb"
                opacity="0.9"
                animate={{ rotate: [2, -2, 2] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
              />

              {/* Yellow center nectar guide */}
              <circle cx="0" cy="-15" r="4" fill="#fbbf24" />
              <path d="M-4 -15 Q0 -5 4 -15" stroke="#f59e0b" strokeWidth="1.5" />
            </g>
          </svg>
        );

      case 'Iris-versicolor':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stem & Leaves */}
            <path d="M50 75 Q52 98 50 120" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            <motion.path
              d="M50 90 Q25 80 15 60 Q28 75 50 90"
              fill="#059669"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            />
            <motion.path
              d="M50 100 Q75 90 85 70 Q70 85 50 100"
              fill="#059669"
              animate={{ rotate: [3, -3, 3] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.7 }}
            />

            {/* Versicolor Flower head: elegant, medium sized drooping petals */}
            <g transform="translate(50, 55)">
              {/* Drooping Sepals */}
              <motion.path
                d="M0 0 Q-25 -15 -35 15 Q-15 15 0 0"
                fill="#818cf8"
                animate={{ rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q25 -15 35 15 Q15 15 0 0"
                fill="#818cf8"
                animate={{ rotate: [2, -2, 2] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.3 }}
              />

              {/* Upright standards */}
              <motion.path
                d="M0 0 Q-15 -35 -5 -55 Q10 -40 0 0"
                fill="#6366f1"
                opacity="0.95"
                animate={{ scale: [0.97, 1.03, 0.97] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q15 -35 5 -55 Q-10 -40 0 0"
                fill="#6366f1"
                opacity="0.95"
                animate={{ scale: [0.97, 1.03, 0.97] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 }}
              />

              {/* Center dome and details */}
              <motion.path
                d="M0 0 Q0 -25 -10 -15 Q-5 0 0 0"
                fill="#4f46e5"
                animate={{ rotate: [-1, 1, -1] }}
              />
              <motion.path
                d="M0 0 Q0 -25 10 -15 Q5 0 0 0"
                fill="#4f46e5"
                animate={{ rotate: [1, -1, 1] }}
              />

              {/* Signal/Guides: Yellow highlights on sepals */}
              <path d="M-15 2 Q-22 5 -25 10" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
              <path d="M15 2 Q22 5 25 10" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        );

      case 'Iris-virginica':
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Stem & Leaves */}
            <path d="M50 70 Q49 95 50 120" stroke="#047857" strokeWidth="5.5" strokeLinecap="round" />
            <motion.path
              d="M50 85 Q20 70 8 45 Q24 65 50 85"
              fill="#065f46"
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            />
            <motion.path
              d="M50 95 Q80 80 92 55 Q76 75 50 95"
              fill="#065f46"
              animate={{ rotate: [4, -4, 4] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
            />

            {/* Virginica Flower head: large, beautiful drooping purple-pink petals */}
            <g transform="translate(50, 50)">
              {/* Massive drooping side sepals */}
              <motion.path
                d="M0 0 Q-35 -5 -45 35 Q-15 25 0 0"
                fill="#f472b6"
                opacity="0.85"
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q35 -5 45 35 Q15 25 0 0"
                fill="#f472b6"
                opacity="0.85"
                animate={{ rotate: [3, -3, 3] }}
                transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut', delay: 0.4 }}
              />

              {/* Large hanging center sepal */}
              <motion.path
                d="M0 0 Q-15 15 0 45 Q15 15 0 0"
                fill="#db2777"
                animate={{ scaleY: [0.96, 1.04, 0.96] }}
                transition={{ repeat: Infinity, duration: 4.8, ease: 'easeInOut' }}
              />

              {/* Robust upright standards */}
              <motion.path
                d="M0 0 Q-25 -40 -10 -60 Q10 -35 0 0"
                fill="#ec4899"
                animate={{ rotate: [-1.5, 1.5, -1.5] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              />
              <motion.path
                d="M0 0 Q25 -40 10 -60 Q-10 -35 0 0"
                fill="#ec4899"
                animate={{ rotate: [1.5, -1.5, 1.5] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.6 }}
              />

              {/* Nectar Guides with detailed patterns */}
              <path d="M-15 12 Q-22 18 -26 24" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M15 12 Q22 18 26 24" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="0" cy="18" r="3" fill="#fbbf24" />
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative flex items-center justify-center p-3 select-none ${className}`}>
      {/* Background glow matching the species color */}
      <div
        className={`absolute inset-0 rounded-full filter blur-xl opacity-20 transition-all duration-700 ${
          species === 'Iris-setosa'
            ? 'bg-blue-500'
            : species === 'Iris-versicolor'
            ? 'bg-indigo-500'
            : 'bg-pink-500'
        }`}
      />
      <div className="w-full h-full max-w-[160px] max-h-[160px] relative z-10">
        {renderFlower()}
      </div>
    </div>
  );
}
