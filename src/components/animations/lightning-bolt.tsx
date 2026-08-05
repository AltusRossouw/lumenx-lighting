"use client";

import { useEffect, useRef, useCallback } from "react";

interface LightningBoltProps {
  className?: string;
  color?: string;
  boltCount?: number;
  interval?: number;
  intensity?: number;
}

interface Bolt {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  segments: { x: number; y: number }[];
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function LightningBolt({
  className = "",
  color = "#00D4FF",
  boltCount = 3,
  interval = 4000,
  intensity = 1,
}: LightningBoltProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);
  const widthRef = useRef(0);
  const heightRef = useRef(0);
  const animRef = useRef<{
    bolts: Bolt[];
    startTime: number;
    flashEl: HTMLDivElement | null;
  } | null>(null);

  const generateBolt = useCallback((): Bolt => {
    const w = widthRef.current;
    const h = heightRef.current;
    const startX = Math.random() * w * 0.8 + w * 0.1;
    const targetX = startX + (Math.random() - 0.5) * w * 0.6;
    const targetY = h * (Math.random() * 0.7 + 0.1);
    const segmentCount = Math.floor(Math.random() * 6) + 4;
    const segments: { x: number; y: number }[] = [];

    for (let i = 1; i < segmentCount; i++) {
      const t = i / segmentCount;
      const displacement =
        (Math.random() - 0.5) * w * 0.25 * (1 - Math.abs(t - 0.5) * 2);
      segments.push({
        x: startX + (targetX - startX) * t + displacement,
        y: targetY * t,
      });
    }

    return {
      x: startX,
      y: 0,
      targetX,
      targetY: targetY + h * 0.15,
      segments,
    };
  }, []);

  const drawBolt = useCallback(
    (bolt: Bolt, opacity: number) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * intensity;

      const allPoints = [
        { x: bolt.x, y: bolt.y },
        ...bolt.segments,
        { x: bolt.targetX, y: bolt.targetY },
      ];

      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3.5 * intensity;
      ctx.beginPath();
      ctx.moveTo(allPoints[0].x, allPoints[0].y);
      for (let i = 1; i < allPoints.length; i++) {
        ctx.lineTo(allPoints[i].x, allPoints[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 7 * intensity;
      ctx.shadowBlur = 30 * intensity;
      ctx.beginPath();
      ctx.moveTo(allPoints[0].x, allPoints[0].y);
      for (let i = 1; i < allPoints.length; i++) {
        ctx.lineTo(allPoints[i].x, allPoints[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = color;
      ctx.lineWidth = 16 * intensity;
      ctx.shadowBlur = 50 * intensity;
      ctx.globalAlpha = opacity * 0.25;
      ctx.beginPath();
      ctx.moveTo(allPoints[0].x, allPoints[0].y);
      for (let i = 1; i < allPoints.length; i++) {
        ctx.lineTo(allPoints[i].x, allPoints[i].y);
      }
      ctx.stroke();

      for (let j = 1; j < allPoints.length - 1; j++) {
        if (Math.random() > 0.5) continue;
        const branchCount = Math.floor(Math.random() * 2) + 1;
        for (let b = 0; b < branchCount; b++) {
          const angle = (Math.random() - 0.5) * Math.PI * 0.6;
          const length = Math.random() * 50 * intensity + 20;
          const bx = allPoints[j].x + Math.cos(angle) * length;
          const by = allPoints[j].y + Math.abs(Math.sin(angle)) * length;

          ctx.strokeStyle = color;
          ctx.lineWidth = 0.8 * intensity;
          ctx.shadowBlur = 10 * intensity;
          ctx.globalAlpha = opacity * 0.5;
          ctx.beginPath();
          ctx.moveTo(allPoints[j].x, allPoints[j].y);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }
      }

      ctx.restore();
    },
    [color, intensity],
  );

  const animateLoop = useCallback(
    (timestamp: number) => {
      const anim = animRef.current;
      if (!anim) return;

      const ctx = ctxRef.current;
      if (!ctx) return;

      const elapsed = timestamp - anim.startTime;
      const totalDuration = 800;
      const progress = Math.min(elapsed / totalDuration, 1);

      const w = widthRef.current;
      const h = heightRef.current;
      ctx.clearRect(0, 0, w, h);

      anim.bolts.forEach((bolt, idx) => {
        const boltDelay = idx * 80 / totalDuration;
        const boltProgress = Math.max(
          0,
          Math.min(1, (progress - boltDelay) / (1 - boltDelay)),
        );
        const opacity = Math.sin(boltProgress * Math.PI) * 0.9;
        if (opacity > 0.01) drawBolt(bolt, opacity);

        if (boltProgress > 0.5) {
          const afterglowOpacity = (Math.random() * 0.3 + 0.1) * intensity;
          const agFade = (boltProgress - 0.5) / 0.5;
          const agAlpha = afterglowOpacity * (1 - agFade);
          if (agAlpha > 0.01) {
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = `rgba(0,0,0,${0.008 * intensity * agAlpha})`;
            ctx.fillRect(0, 0, w, h);
          }
        }
      });

      if (anim.flashEl) {
        const flashPhase = Math.min(elapsed / 500, 1);
        const flashOpacity = flashPhase < 0.5
          ? lerp(0, 0.6, flashPhase * 2)
          : lerp(0.6, 0, (flashPhase - 0.5) * 2);
        anim.flashEl.style.opacity = String(flashOpacity);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animateLoop);
      } else {
        if (anim.flashEl) {
          anim.flashEl.remove();
        }
        animRef.current = null;
      }
    },
    [drawBolt, intensity],
  );

  const triggerBolts = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const w = widthRef.current;
    const h = heightRef.current;

    ctx.clearRect(0, 0, w, h);

    const flashEl = document.createElement("div");
    flashEl.style.cssText =
      `position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,${color}22 0%,transparent 70%);z-index:9;`;

    const canvas = canvasRef.current;
    if (canvas?.parentElement) {
      canvas.parentElement.appendChild(flashEl);
    }

    animRef.current = {
      bolts: Array.from({ length: boltCount }, () => generateBolt()),
      startTime: performance.now(),
      flashEl,
    };

    rafRef.current = requestAnimationFrame(animateLoop);
  }, [boltCount, color, generateBolt, animateLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      widthRef.current = rect.width;
      heightRef.current = rect.height;
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    resize();
    window.addEventListener("resize", resize);

    const run = () => {
      cancelAnimationFrame(rafRef.current);
      triggerBolts();
      timeoutRef.current = window.setTimeout(
        run,
        interval + Math.random() * interval * 0.5,
      );
    };

    run();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const anim = animRef.current;
      if (anim?.flashEl) anim.flashEl.remove();
    };
  }, [triggerBolts, interval]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
    />
  );
}
