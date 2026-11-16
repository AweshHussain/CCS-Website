import React, { useEffect, useRef } from 'react';

interface ParticleBackgroundProps {
  reducedMotion?: boolean;
  theme?: 'dark' | 'light';
}

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  isCrimson: boolean;
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  reducedMotion = false,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for subtle interactive float
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 140,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate floating mesh dots
    const count = Math.min(65, Math.floor(window.innerWidth / 24));
    const dots: Dot[] = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.8 + 0.8,
      baseAlpha: Math.random() * 0.3 + 0.15,
      isCrimson: Math.random() > 0.65, // ~35% crimson nodes, 65% neutral
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isLight = theme === 'light';

      dots.forEach((dot) => {
        // Natural gentle drift
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Wrap around boundaries
        if (dot.x < 0) dot.x = width;
        if (dot.x > width) dot.x = 0;
        if (dot.y < 0) dot.y = height;
        if (dot.y > height) dot.y = 0;

        // Mouse proximity reaction
        const dx = dot.x - mouse.x;
        const dy = dot.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        let extraAlpha = 0;

        if (dist < mouse.radius && dist > 0) {
          const factor = (1 - dist / mouse.radius);
          const angle = Math.atan2(dy, dx);
          dot.x += Math.cos(angle) * factor * 1.5;
          dot.y += Math.sin(angle) * factor * 1.5;
          extraAlpha = factor * 0.5;
        }

        const currentAlpha = Math.min(1, dot.baseAlpha + extraAlpha);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size + (extraAlpha > 0 ? 0.8 : 0), 0, Math.PI * 2);

        if (dot.isCrimson || extraAlpha > 0.1) {
          ctx.fillStyle = `rgba(229, 9, 32, ${currentAlpha * 0.9})`;
        } else {
          ctx.fillStyle = isLight
            ? `rgba(71, 85, 105, ${currentAlpha * 0.6})`
            : `rgba(255, 255, 255, ${currentAlpha * 0.7})`;
        }
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion, theme]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{
        opacity: theme === 'light' ? 0.85 : 0.75,
      }}
    />
  );
};
