"use client";
import { useEffect, useRef } from "react";

/**
 * Organic, slowly drifting geometric forms — a constellation of nodes
 * connected by faint lines, subtly evoking a blockchain network.
 * Pure canvas, no libraries. Warm sienna palette in light mode,
 * soft amber glow in dark mode.
 */
export function HeroCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Check for dark mode
    const isDark = () => document.documentElement.classList.contains("dark");

    // Node system — 3D projected to 2D
    const N = 18;
    const nodes: {
      x: number; y: number; z: number;
      vx: number; vy: number; vz: number;
      radius: number;
    }[] = [];

    for (let i = 0; i < N; i++) {
      nodes.push({
        x: (Math.random() - 0.5) * 300,
        y: (Math.random() - 0.5) * 300,
        z: (Math.random() - 0.5) * 200,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: (Math.random() - 0.5) * 0.08,
        radius: 1.5 + Math.random() * 2.5,
      });
    }

    // Slow global rotation
    let angle = 0;

    const project = (x: number, y: number, z: number) => {
      // Rotate around Y axis
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;

      // Mild perspective
      const perspective = 600;
      const scale = perspective / (perspective + rz + 300);
      return {
        sx: w / 2 + rx * scale,
        sy: h / 2 + y * scale,
        scale,
        z: rz,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();

      // Update positions
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;
        // Soft bounds
        if (Math.abs(n.x) > 200) n.vx *= -1;
        if (Math.abs(n.y) > 200) n.vy *= -1;
        if (Math.abs(n.z) > 150) n.vz *= -1;
      }
      angle += 0.0008;

      // Project all
      const projected = nodes.map((n, i) => ({ ...project(n.x, n.y, n.z), i, r: n.radius }));

      // Draw connections
      const connColor = dark ? "rgba(180,140,100," : "rgba(140,100,70,";
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.sx - b.sx;
          const dy = a.sy - b.sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const opacity = (1 - dist / 140) * 0.18 * ((a.scale + b.scale) / 2);
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.strokeStyle = connColor + opacity.toFixed(3) + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw nodes — sorted by z for depth
      projected.sort((a, b) => a.z - b.z);
      for (const p of projected) {
        const r = p.r * p.scale;
        const opacity = 0.25 + p.scale * 0.5;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? `rgba(200,160,120,${opacity.toFixed(3)})`
          : `rgba(120,80,50,${opacity.toFixed(3)})`;
        ctx.fill();
      }

      // Central "seal" — a slow-breathing ring
      const breathe = 1 + Math.sin(Date.now() * 0.001) * 0.06;
      const sealR = 45 * breathe;
      const cx = w / 2, cy = h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, sealR, 0, Math.PI * 2);
      ctx.strokeStyle = dark ? "rgba(200,160,120,0.15)" : "rgba(120,80,50,0.12)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.arc(cx, cy, sealR * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = dark ? "rgba(200,160,120,0.08)" : "rgba(120,80,50,0.07)";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      frameRef.current = requestAnimationFrame(draw);
    };

    // Delay first frame slightly for layout
    const t = setTimeout(() => { resize(); draw(); }, 50);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    />
  );
}
