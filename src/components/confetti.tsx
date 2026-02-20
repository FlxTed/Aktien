"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a855f7"];

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (!active || ran.current) return;
    ran.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const el = canvas;
    const resize = () => {
      el.width = window.innerWidth;
      el.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; rot: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: el.width / 2,
        y: el.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.6) * 10,
        color: COLORS[i % COLORS.length],
        size: 4 + Math.random() * 6,
        rot: Math.random() * 360,
      });
    }

    let frame = 0;
    const maxFrames = 90;

    function draw() {
      const context = el.getContext("2d");
      if (frame >= maxFrames || !context) {
        window.removeEventListener("resize", resize);
        return;
      }
      context.clearRect(0, 0, el.width, el.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.rot += 4;
        context.save();
        context.translate(p.x, p.y);
        context.rotate((p.rot * Math.PI) / 180);
        context.fillStyle = p.color;
        context.globalAlpha = 1 - frame / maxFrames;
        context.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        context.restore();
      }
      frame++;
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    return () => window.removeEventListener("resize", resize);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
