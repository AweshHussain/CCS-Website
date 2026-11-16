import React, { useEffect, useRef } from 'react';

interface InteractiveWireframeMeshProps {
  reducedMotion?: boolean;
  theme?: 'dark' | 'light';
}

interface Point {
  x0: number;
  y0: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export const InteractiveWireframeMesh: React.FC<InteractiveWireframeMeshProps> = ({
  reducedMotion = false,
  theme = 'dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 170,
      active: false,
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      mouse.active = true;
      if ('touches' in e && e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
      }
    };

    const handlePointerLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      mouse.active = false;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    // Grid creation
    const spacing = 52; // Optimal density for cyber wireframe net
    let cols = Math.ceil(width / spacing) + 2;
    let rows = Math.ceil(height / spacing) + 2;
    let points: Point[][] = [];

    const initGrid = () => {
      cols = Math.ceil(width / spacing) + 2;
      rows = Math.ceil(height / spacing) + 2;
      points = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        for (let c = 0; c < cols; c++) {
          const x0 = (c - 1) * spacing;
          const y0 = (r - 1) * spacing;
          points[r][c] = {
            x0,
            y0,
            x: x0,
            y: y0,
            vx: 0,
            vy: 0,
          };
        }
      }
    };

    initGrid();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initGrid();
    };
    window.addEventListener('resize', handleResize);

    // Physics parameters
    const springK = 0.055;
    const damping = 0.88;
    const repelStrength = 18;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.016;

      // Smooth mouse coordinates
      mouse.x += (mouse.targetX - mouse.x) * 0.2;
      mouse.y += (mouse.targetY - mouse.y) * 0.2;

      const isLight = theme === 'light';

      // 1. Update points physics
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];

          if (!reducedMotion) {
            // Subtle organic ambient sine wave
            const waveX = Math.sin(time * 0.9 + p.y0 * 0.01) * 3;
            const waveY = Math.cos(time * 0.8 + p.x0 * 0.01) * 3;
            const targetX = p.x0 + waveX;
            const targetY = p.y0 + waveY;

            // Mouse cursor interaction & repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < mouse.radius && dist > 0) {
              const factor = (1 - dist / mouse.radius);
              const angle = Math.atan2(dy, dx);
              const force = factor * factor * repelStrength;

              p.vx += Math.cos(angle) * force;
              p.vy += Math.sin(angle) * force;
            }

            // Spring return force
            const fx = (targetX - p.x) * springK;
            const fy = (targetY - p.y) * springK;

            p.vx = (p.vx + fx) * damping;
            p.vy = (p.vy + fy) * damping;

            p.x += p.vx;
            p.y += p.vy;
          } else {
            p.x = p.x0;
            p.y = p.y0;
          }
        }
      }

      // 2. Draw wire mesh lines
      ctx.lineWidth = 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const p = points[r][c];

          // Compute distance to mouse for reactive color transition
          const distToMouse = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const mouseFactor = Math.max(0, 1 - distToMouse / (mouse.radius * 1.3));

          // Base wireframe color vs. crimson reactive color near cursor
          const defaultLineColor = isLight
            ? 'rgba(0, 0, 0, 0.06)'
            : 'rgba(255, 255, 255, 0.05)';

          const activeLineColor = isLight
            ? `rgba(229, 9, 32, ${0.15 + mouseFactor * 0.55})`
            : `rgba(229, 9, 32, ${0.15 + mouseFactor * 0.65})`;

          ctx.strokeStyle = mouseFactor > 0.05 ? activeLineColor : defaultLineColor;

          // Horizontal wire segment
          if (c < cols - 1) {
            const pRight = points[r][c + 1];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.stroke();
          }

          // Vertical wire segment
          if (r < rows - 1) {
            const pDown = points[r + 1][c];
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pDown.x, pDown.y);
            ctx.stroke();
          }

          // Subtle diagonal cyber-wire (alternate every 2 cells for high-tech aesthetic)
          if ((r + c) % 2 === 0 && r < rows - 1 && c < cols - 1) {
            const pDiag = points[r + 1][c + 1];
            ctx.strokeStyle = isLight
              ? `rgba(0, 0, 0, ${0.02 + mouseFactor * 0.2})`
              : `rgba(255, 255, 255, ${0.02 + mouseFactor * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pDiag.x, pDiag.y);
            ctx.stroke();
          }

          // Glowing vertex node if near cursor
          if (mouseFactor > 0.2) {
            const nodeRadius = 1.2 + mouseFactor * 2.2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(229, 9, 32, ${mouseFactor * 0.85})`;
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500"
      style={{
        opacity: theme === 'light' ? 0.9 : 0.75,
      }}
    />
  );
};

