import React, { useEffect, useRef } from 'react';

interface InkSplatterOverlayProps {
  origin: { x: number; y: number } | null;
  targetTheme: 'dark' | 'light';
  duration?: number;
}

interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  decay: number;
  isCrimson: boolean;
  shapeNoise: number;
}

export const InkSplatterOverlay: React.FC<InkSplatterOverlayProps> = ({
  origin,
  targetTheme,
  duration = 2000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!origin) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    let animId: number;
    const startTime = performance.now();

    // Generate organic liquid ink splatter droplets
    const dropletCount = 55;
    const droplets: Droplet[] = Array.from({ length: dropletCount }, (_, i) => {
      const angle = (i / dropletCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 9 + 4;
      return {
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 7 + 2.5,
        alpha: Math.random() * 0.4 + 0.6,
        decay: Math.random() * 0.0006 + 0.0004,
        isCrimson: Math.random() > 0.75, // 25% crimson energy droplets
        shapeNoise: Math.random() * 2 + 1,
      };
    });

    const isLightTarget = targetTheme === 'light';
    const mainInkColor = isLightTarget ? '255, 255, 255' : '8, 8, 8';

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      ctx.clearRect(0, 0, width, height);

      droplets.forEach((d) => {
        // Fluid friction & expansion
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.96;
        d.vy *= 0.96;

        const currentAlpha = Math.max(0, d.alpha * (1 - progress * 1.1));

        ctx.save();
        ctx.beginPath();
        // Slightly irregular teardrop/droplet shape
        ctx.arc(d.x, d.y, d.radius * (1 + progress * 0.4), 0, Math.PI * 2);

        if (d.isCrimson) {
          ctx.fillStyle = `rgba(229, 9, 32, ${currentAlpha * 0.85})`;
          ctx.shadowColor = '#E50920';
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = `rgba(${mainInkColor}, ${currentAlpha * 0.9})`;
          ctx.shadowColor = isLightTarget ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 10;
        }

        ctx.fill();
        ctx.restore();
      });

      if (progress < 1) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [origin, targetTheme, duration]);

  if (!origin) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99998]"
    />
  );
};

