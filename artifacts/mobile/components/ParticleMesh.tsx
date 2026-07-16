/**
 * Warm drifting dust particles background component (Web only).
 * Matches the paper/library showcase style of the login screen.
 */
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

interface DustParticle {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  drift: number;
  phase: number;
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

    let W = 0, H = 0;
    let particles: DustParticle[] = [];
    let raf = 0;

    function resize() {
      if (!mount) return;
      W = mount.offsetWidth;
      H = mount.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function init() {
      particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * W,
        y: H + Math.random() * 50,
        r: Math.random() * 1.5 + 0.6,
        alpha: Math.random() * 0.35 + 0.15,
        speed: Math.random() * 0.4 + 0.2,
        drift: (Math.random() - 0.5) * 0.3,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      
      // Draw warm gold dust particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // Gold bright: #D2AC79
        ctx.fillStyle = `rgba(210, 172, 121, ${p.alpha})`;
        ctx.fill();

        // Move particle up
        p.y -= p.speed;
        p.x += p.drift + Math.sin(p.y * 0.01 + p.phase) * 0.2;

        // Reset if goes off top
        if (p.y < -10) {
          p.y = H + Math.random() * 20;
          p.x = Math.random() * W;
        }
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
      if (mount && mount.contains(canvas)) mount.removeChild(canvas);
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
