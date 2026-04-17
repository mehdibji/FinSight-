import React, { useCallback, useMemo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useLocation } from 'react-router-dom';

export const AntiGravityBackground = () => {
  const [init, setInit] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  // Determine biome color based on location
  const color = useMemo(() => {
    const path = location.pathname;
    if (path.includes('markets') || path.includes('asset')) return '#06B6D4'; // Cyan
    if (path.includes('copilot') || path.includes('alerts')) return '#6366F1'; // Indigo
    return '#F97316'; // Orange default (Dashboard)
  }, [location.pathname]);

  const options = useMemo(
    () => ({
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onClick: { enable: true, mode: 'push' },
          onHover: { enable: true, mode: 'repulse' },
          resize: { enable: true, delay: 0.5 }
        },
        modes: {
          push: { quantity: 4 },
          repulse: { distance: 150, duration: 0.4 },
        },
      },
      particles: {
        color: { value: color },
        links: {
          color: color,
          distance: 150,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        move: {
          direction: 'none' as const,
          enable: true,
          outModes: { default: 'bounce' as const },
          random: false,
          speed: 1,
          straight: false,
        },
        number: {
          density: { enable: true, width: 800, height: 800 },
          value: 60,
        },
        opacity: { value: 0.5 },
        shape: { type: 'circle' },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
    }),
    [color]
  );

  if (!init) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
       {/* Nebula Canvas Gradient Overlay */}
       <div 
         className="absolute inset-0 opacity-40 transition-colors duration-1000 mix-blend-screen"
         style={{
            background: `radial-gradient(circle at 50% 50%, ${color}20 0%, transparent 60%)`
         }}
       />
       
       <Particles
          id="tsparticles"
          options={options}
          className="absolute inset-0"
       />
    </div>
  );
};
