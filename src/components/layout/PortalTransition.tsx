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
        scale: 0.8, 
        filter: "blur(20px) hue-rotate(90deg)"
      }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        filter: "blur(0px) hue-rotate(0deg)"
      }}
      exit={{ 
        opacity: 0, 
        scale: 1.2, 
        filter: "blur(20px) hue-rotate(-90deg)"
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.76, 0, 0.24, 1] 
      }}
      className="w-full h-full"
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  );
};
