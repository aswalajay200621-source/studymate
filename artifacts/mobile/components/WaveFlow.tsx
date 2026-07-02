/**
 * Dense slow-moving particle wave — dusty purple sine-wave ribbon.
 * Particles cluster tightly along two wave curves with a drifting bright focal glow.
 */
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

export function WaveFlow({ style }: { style?: any }) {
  const mountRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const mount = mountRef.current as HTMLDivElement | null;
    if (!mount) return;

    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d")!;
    Object.assign(canvas.style, {
      position: "absolute", inset: "0",
      width: "100%", height: "100%", pointerEvents: "none",
    });
    mount.appendChild(canvas);

    let W = 0, H = 0, raf = 0;
    let phase = 0;

    // Two parallel wave ribbons sweeping across the screen
    const WAVES = [
      { amp: 0.36, freq: 0.75, yBase: 0.50, spread: 25, count: 2000 },
      { amp: 0.32, freq: 0.90, yBase: 0.55, spread: 18, count: 1500 },
    ];

    interface Pt {
      nx:  number;  // 0..1 along x
      off: number;  // perpendicular scatter (px)
      a:   number;  // base alpha
      r:   number;  // radius
      wi:  number;
    }

    let pts: Pt[] = [];

    function gauss() {
      // Box-Muller — tighter std so particles cluster near centre of band
      const u1 = Math.random(), u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1 + 1e-9)) * Math.cos(2 * Math.PI * u2);
    }

    function buildParticles() {
      pts = [];
      for (let wi = 0; wi < WAVES.length; wi++) {
        const wv = WAVES[wi];
        for (let i = 0; i < wv.count; i++) {
          const g   = gauss();
          const off = g * wv.spread * 0.15; // tight ribbon
          // alpha falls off with distance from centre: closer = brighter
          const distFrac = Math.abs(g);
          const baseA    = Math.max(0.04, (0.85 - distFrac * 0.60) * (Math.random() * 0.3 + 0.7));
          pts.push({
            nx: Math.random(),
            off,
            a:  baseA,
            r:  Math.random() * 0.6 + 0.2, // slightly smaller particles for a dusty look
            wi,
          });
        }
      }
    }

    function resize() {
      W = mount!.offsetWidth;
      H = mount!.offsetHeight;
      canvas.width  = W;
      canvas.height = H;
    }

    function waveY(wv: typeof WAVES[0], nx: number) {
      return wv.yBase * H + Math.sin(nx * wv.freq * Math.PI * 2 - phase) * wv.amp * H;
    }

    function drawFocalGlow() {
      const gnx = ((phase * 0.035) % 1 + 1) % 1;
      const gx  = gnx * W;
      const gy  = waveY(WAVES[0], gnx);

      // Soft outer halo
      const og = ctx.createRadialGradient(gx, gy, 0, gx, gy, 100);
      og.addColorStop(0,   "rgba(200,160,255,0.15)");
      og.addColorStop(0.6, "rgba(140,90,220,0.05)");
      og.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(gx, gy, 100, 0, Math.PI * 2);
      ctx.fillStyle = og; ctx.fill();

      // Bright white core
      const ig = ctx.createRadialGradient(gx, gy, 0, gx, gy, 16);
      ig.addColorStop(0,   "rgba(255,255,255,0.95)");
      ig.addColorStop(0.35,"rgba(220,190,255,0.55)");
      ig.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(gx, gy, 16, 0, Math.PI * 2);
      ctx.fillStyle = ig; ctx.fill();
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      phase += 0.0025; // very slow drift

      for (const p of pts) {
        const wv = WAVES[p.wi];
        const px = p.nx * W;
        const py = waveY(wv, p.nx) + p.off;

        // Edge fade on x
        const ef = Math.min(p.nx, 1 - p.nx) * 6;
        const a  = p.a * Math.min(ef, 1);
        if (a < 0.02) continue;

        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(158,115,205,${a.toFixed(3)})`;
        ctx.fill();
      }

      drawFocalGlow();
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => { resize(); buildParticles(); });
    ro.observe(mount);
    resize();
    buildParticles();
    tick();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
  }, []);

  if (Platform.OS !== "web") return null;
  return React.createElement("div", {
    ref: mountRef,
    style: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", ...(style ?? {}) },
  });
}
