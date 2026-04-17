import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard = ({ children, className, hoverEffect = false }: GlassCardProps) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -5, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={cn(
        "glass-panel rounded-3xl p-6 relative overflow-hidden group",
        hoverEffect && "hover:border-white/20 hover:shadow-[0_8px_40px_rgba(255,255,255,0.05)] transition-all duration-500",
        className
      )}
    >
      {/* Subtle background glow effect on hover */}
      {hoverEffect && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};
