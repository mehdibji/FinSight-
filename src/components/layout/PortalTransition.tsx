import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';

export const PortalTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ 
        opacity: 0, 
        scale: 0.95,
        y: 10
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: 0
      }}
      exit={{ 
        opacity: 0, 
        scale: 1.02,
        y: -10
      }}
      transition={{ 
        duration: 0.35, 
        ease: [0.76, 0, 0.24, 1] 
      }}
      className="w-full h-full"
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
};
