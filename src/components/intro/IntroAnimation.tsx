import React, { useEffect, useRef, useState } from 'react';
import { CCS_LOGO_PATHS, LOGO_CENTER } from '../3d/logoCoordinates';

interface IntroAnimationProps {
  onComplete: () => void;
}

interface PathPoint {
  x: number;
  y: number;
}

interface ComponentPathData {
  points: PathPoint[];
  cumLengths: number[];
  totalLength: number;
  origin: PathPoint;
  incomingPoints: PathPoint[];
  incomingCumLengths: number[];
  incomingTotalLength: number;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [logoBottom, setLogoBottom] = useState<number>(() => {
    if (typeof window === 'undefined') return 520;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const scale = Math.min(W * 0.45, H * 0.45) / 380;
    const cy = H / 2 - 45;
    return cy + 193 * scale;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime: number | null = null;
    const duration = 4600; // ~4.6 seconds total

    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const W = window.innerWidth;
      const H = window.innerHeight;
      const scale = Math.min(W * 0.45, H * 0.45) / 380;
      const cy = H / 2 - 45;
      setLogoBottom(cy + 193 * scale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // ESC key skips intro
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipIntro();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Particle spark system
    const sparks: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }> = [];

    // Helper: compute cumulative lengths of a polygon / polyline
    const buildPathData = (): ComponentPathData[] => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const scale = Math.min(W * 0.45, H * 0.45) / 380;
      const cx = W / 2;
      const cy = H / 2 - 45;

      // 3 string origins from 3 distinct screen edges:
      // String 0: Left edge (enters outer C)
      // String 1: Right edge (enters middle C)
      // String 2: Top edge (enters inner S)
      const origins: PathPoint[] = [
        { x: -50, y: H * 0.38 },
        { x: W + 50, y: H * 0.58 },
        { x: W * 0.5, y: -50 },
      ];

      return CCS_LOGO_PATHS.map((comp, compIdx) => {
        // Map raw coordinates to screen
        const points: PathPoint[] = comp.points.map(([x, y]) => ({
          x: cx + (x - LOGO_CENTER.cx) * scale,
          y: cy + (y - LOGO_CENTER.cy) * scale,
        }));

        // Compute perimeter cumulative lengths
        const cumLengths: number[] = [0];
        let totalLength = 0;
        for (let i = 0; i < points.length; i++) {
          const next = points[(i + 1) % points.length];
          const segDist = Math.hypot(next.x - points[i].x, next.y - points[i].y);
          totalLength += segDist;
          cumLengths.push(totalLength);
        }

        // Build a smooth cubic Bezier incoming trajectory from screen edge to points[0]
        const origin = origins[compIdx];
        const target = points[0];
        const incomingPoints: PathPoint[] = [];
        const steps = 40;

        // Control points for organic curved approach
        let cp1: PathPoint;
        let cp2: PathPoint;

        if (compIdx === 0) {
          // Left string: swoops down-right towards top of outer C
          cp1 = { x: origin.x + W * 0.18, y: origin.y - 40 };
          cp2 = { x: target.x - W * 0.12, y: target.y - 60 };
        } else if (compIdx === 1) {
          // Right string: swoops up-left towards middle C
          cp1 = { x: origin.x - W * 0.18, y: origin.y + 40 };
          cp2 = { x: target.x + W * 0.12, y: target.y + 50 };
        } else {
          // Top string: drops down with subtle S-curve towards S
          cp1 = { x: origin.x + 50, y: origin.y + H * 0.15 };
          cp2 = { x: target.x + 30, y: target.y - H * 0.1 };
        }

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const invT = 1 - t;
          const x =
            invT * invT * invT * origin.x +
            3 * invT * invT * t * cp1.x +
            3 * invT * t * t * cp2.x +
            t * t * t * target.x;
          const y =
            invT * invT * invT * origin.y +
            3 * invT * invT * t * cp1.y +
            3 * invT * t * t * cp2.y +
            t * t * t * target.y;
          incomingPoints.push({ x, y });
        }

        // Cumulative lengths of incoming line
        const incomingCumLengths: number[] = [0];
        let incomingTotalLength = 0;
        for (let i = 0; i < incomingPoints.length - 1; i++) {
          const segDist = Math.hypot(
            incomingPoints[i + 1].x - incomingPoints[i].x,
            incomingPoints[i + 1].y - incomingPoints[i].y
          );
          incomingTotalLength += segDist;
          incomingCumLengths.push(incomingTotalLength);
        }

        return {
          points,
          cumLengths,
          totalLength,
          origin,
          incomingPoints,
          incomingCumLengths,
          incomingTotalLength,
        };
      });
    };

    let pathDataList = buildPathData();

    // Helper: interpolate point along polyline given distance
    const getPointAlongPolyline = (
      pts: PathPoint[],
      cumLens: number[],
      dist: number
    ): PathPoint => {
      if (dist <= 0) return pts[0];
      const maxDist = cumLens[cumLens.length - 1];
      if (dist >= maxDist) return pts[pts.length - 1];

      for (let i = 0; i < cumLens.length - 1; i++) {
        if (dist >= cumLens[i] && dist <= cumLens[i + 1]) {
          const segLen = cumLens[i + 1] - cumLens[i];
          const frac = segLen > 0 ? (dist - cumLens[i]) / segLen : 0;
          return {
            x: pts[i].x + (pts[(i + 1) % pts.length].x - pts[i].x) * frac,
            y: pts[i].y + (pts[(i + 1) % pts.length].y - pts[i].y) * frac,
          };
        }
      }
      return pts[pts.length - 1];
    };

    const render = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Dark background with subtle trail persistence
      ctx.fillStyle = 'rgba(8, 8, 8, 0.35)';
      ctx.fillRect(0, 0, width, height);

      // Phase 1: 0 - 1.0s -> Incoming strings fly in from edges
      // Phase 2: 0.9s - 2.7s -> Strings merge seamlessly into logo contour and trace around
      // Phase 3: 2.7s - 3.4s -> Logo complete! Brilliant luminous neon crimson pulse & glow
      // Phase 4: 3.3s - 4.6s -> Name and tagline reveal, smooth transition to hero

      const pTrace = Math.max(0, Math.min(1, (elapsed - 150) / 2600));

      if (elapsed > 3300 && !showText) {
        setShowText(true);
      }

      if (elapsed > 4200 && !fadingOut) {
        setFadingOut(true);
      }

      const cx = width / 2;
      const cy = height / 2 - 45;

      // Check if logo is fully created -> triggers subtle, clean glowing neon accent
      const isLogoCreated = elapsed > 2650;
      let glowMultiplier = 0;
      if (isLogoCreated) {
        const timeSinceCreated = elapsed - 2650;
        const swell = Math.min(1, timeSinceCreated / 400);
        // Subtle breathing pulse effect
        const breath = Math.sin(timeSinceCreated * 0.005) * 0.15;
        glowMultiplier = swell * (1 + breath);

        // 1. Subtle, tight ambient crimson back-glow contained strictly around the logo center (does not reach text below)
        const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
        bgGlow.addColorStop(0, `rgba(229, 9, 32, ${0.12 * glowMultiplier})`);
        bgGlow.addColorStop(0.5, `rgba(229, 9, 32, ${0.04 * glowMultiplier})`);
        bgGlow.addColorStop(1, 'rgba(229, 9, 32, 0)');
        ctx.fillStyle = bgGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw each of the 3 components with seamless coming & merging stroke
      pathDataList.forEach((compData, compIdx) => {
        const {
          points,
          cumLengths,
          totalLength,
          incomingPoints,
          incomingCumLengths,
          incomingTotalLength,
        } = compData;

        // Combined journey: incomingTotalLength + totalLength
        const fullDistance = incomingTotalLength + totalLength;

        // Non-linear smooth progress
        const tEase = easeInOutCubic(pTrace);
        const currentHeadDist = tEase * fullDistance;

        // Tail follows head:
        // While approaching (head < incomingTotalLength), tail starts at origin (0).
        // Once head enters the logo, the tail steadily pulls in from the screen edge!
        let currentTailDist = 0;
        if (currentHeadDist > incomingTotalLength) {
          const overLogo = currentHeadDist - incomingTotalLength;
          // Tail reels in from 0 to incomingTotalLength
          currentTailDist = Math.min(
            incomingTotalLength,
            overLogo * 1.6
          );
        }

        // Build continuous path to draw
        const drawPolyline: PathPoint[] = [];

        // 1. Portion of incoming curve still visible
        if (currentTailDist < incomingTotalLength) {
          const inStartDist = currentTailDist;
          const inEndDist = Math.min(incomingTotalLength, currentHeadDist);

          // Add start point
          drawPolyline.push(
            getPointAlongPolyline(incomingPoints, incomingCumLengths, inStartDist)
          );

          // Add intermediate incoming points
          for (let i = 0; i < incomingPoints.length; i++) {
            const d = incomingCumLengths[i];
            if (d > inStartDist && d < inEndDist) {
              drawPolyline.push(incomingPoints[i]);
            }
          }

          // Add end of incoming portion
          if (inEndDist > inStartDist) {
            drawPolyline.push(
              getPointAlongPolyline(incomingPoints, incomingCumLengths, inEndDist)
            );
          }
        }

        // 2. Portion of logo perimeter traced
        if (currentHeadDist > incomingTotalLength) {
          const logoDist = currentHeadDist - incomingTotalLength;

          // Start from first logo point
          if (drawPolyline.length === 0) {
            drawPolyline.push(points[0]);
          }

          // Add passed vertex points of logo
          for (let i = 0; i < points.length; i++) {
            const d = cumLengths[i];
            if (d > 0 && d < logoDist) {
              drawPolyline.push(points[i]);
            }
          }

          // Add exact head tip position along perimeter
          const headTip = getPointAlongPolyline(points, cumLengths, logoDist);
          drawPolyline.push(headTip);

          // Spawn subtle trailing spark particles at tip while drawing
          if (Math.random() > 0.45 && logoDist < totalLength) {
            sparks.push({
              x: headTip.x,
              y: headTip.y,
              vx: (Math.random() - 0.5) * 2.5,
              vy: (Math.random() - 0.5) * 2.5,
              life: 1,
              maxLife: Math.random() * 18 + 12,
              color: compIdx === 1 ? '#FFFFFF' : '#E50920',
              size: Math.random() * 2 + 1,
            });
          }
        }

        // Render the continuous stroke
        if (drawPolyline.length > 1) {
          // Layer 1: Crimson Outer Glow (crisp and restrained)
          ctx.beginPath();
          ctx.moveTo(drawPolyline[0].x, drawPolyline[0].y);
          for (let k = 1; k < drawPolyline.length; k++) {
            ctx.lineTo(drawPolyline[k].x, drawPolyline[k].y);
          }
          if (currentHeadDist >= fullDistance) {
            ctx.closePath();
          }

          ctx.strokeStyle = isLogoCreated
            ? `rgba(229, 9, 32, ${0.9 + 0.1 * Math.sin((elapsed - 2650) * 0.005)})`
            : 'rgba(229, 9, 32, 0.88)';
          ctx.lineWidth = isLogoCreated ? 3.0 : 2.6;
          ctx.shadowColor = '#E50920';
          ctx.shadowBlur = isLogoCreated ? (16 + glowMultiplier * 6) : 10;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Layer 2: White Core Stroke with Clean Definition
          ctx.beginPath();
          ctx.moveTo(drawPolyline[0].x, drawPolyline[0].y);
          for (let k = 1; k < drawPolyline.length; k++) {
            ctx.lineTo(drawPolyline[k].x, drawPolyline[k].y);
          }
          if (currentHeadDist >= fullDistance) {
            ctx.closePath();
          }
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.6;
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = isLogoCreated ? 6 : 0;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Leading tip glowing particle (while still tracing)
          if (currentHeadDist < fullDistance) {
            const tip = drawPolyline[drawPolyline.length - 1];
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 3.2, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#E50920';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }

        // When shape is fully traced, subtle frosted fill
        if (currentHeadDist >= fullDistance) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let j = 1; j < points.length; j++) {
            ctx.lineTo(points[j].x, points[j].y);
          }
          ctx.closePath();
          ctx.fillStyle = `rgba(229, 9, 32, ${0.05 * glowMultiplier})`;
          ctx.fill();
        }
      });

      // Update and draw spark particles
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 1 / s.maxLife;

        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = s.color === '#FFFFFF'
          ? `rgba(255, 255, 255, ${s.life})`
          : `rgba(229, 9, 32, ${s.life})`;
        ctx.shadowColor = '#E50920';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (progress < 1) {
        animId = requestAnimationFrame(render);
      } else {
        setTimeout(onComplete, 400);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  const skipIntro = () => {
    setFadingOut(true);
    setTimeout(onComplete, 300);
  };

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  return (
    <div
      data-intro-screen="true"
      className={`fixed inset-0 z-50 bg-[#080808] flex flex-col items-center justify-center transition-opacity duration-700 select-none overflow-hidden ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Society Name and Tagline reveal - Nestled cleanly just beneath the logo */}
      <div
        className={`absolute inset-x-0 mx-auto z-10 text-center px-4 max-w-5xl transition-all duration-1000 transform ${
          showText ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}
        style={{ top: `${logoBottom + 18}px` }}
      >
        <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-[2.65rem] font-black tracking-[0.12em] sm:tracking-[0.16em] md:tracking-[0.18em] font-display text-white uppercase whitespace-nowrap drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
          CODE & COMPUTE SOCIETY
        </h1>
        <p className="text-xs sm:text-sm md:text-base tracking-[0.38em] sm:tracking-[0.5em] text-zinc-300 mt-1.5 sm:mt-2 font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          THINK. CODE. CREATE.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 sm:mt-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E50920] animate-ping" />
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.35em] sm:tracking-[0.4em] text-[#E50920] font-mono font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            INITIALIZING CODEBASE
          </p>
        </div>
      </div>
    </div>
  );
};
