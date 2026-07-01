/**
 * Animated purple particle-network mesh — desktop/web only.
 * Canvas is created imperatively so it bypasses React Native's
 * component type system while staying compatible with RN Web.
 */
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

export function ParticleMesh() {
  const mountRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const mount = mountRef.current as HTMLDivElement | null;
    if (!mount) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
    mount.appendChild(canvas);

    let W = 0,
      H = 0;
    let pts: Particle[] = [];
    let raf = 0;

    function resize() {
      W = mount!.offsetWidth;
      H = mount!.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function init() {
      pts = Array.from({ length: 72 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.5,
        alpha: Math.random() * 0.55 + 0.2,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      // connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            const a = (1 - d / 130) * 0.14;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(139,92,246,${a})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // particles + soft glow
      for (const p of pts) {
        // glow halo
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(139,92,246,${p.alpha * 0.28})`);
        g.addColorStop(1, "rgba(139,92,246,0)");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,181,253,${p.alpha})`;
        ctx.fill();

        // move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(mount);

    resize();
    init();
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (mount.contains(canvas)) mount.removeChild(canvas);
    };
  }, []);

  if (Platform.OS !== "web") return null;

  return React.createElement("div", {
    ref: mountRef,
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
    },
  }) as any;
}
