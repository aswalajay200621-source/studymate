/**
 * Interactive dot-grid background inspired by Google Antigravity.
 * Dots near the mouse cursor grow and glow purple.
 * Canvas-only, zero dependencies, web-only.
 */
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

const SPACING = 30;
const BASE_R = 1.1;
const MAX_R = 3.8;
const INFLUENCE = 110;

export function DotGrid() {
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
    let mx = -9999,
      my = -9999;
    let raf = 0;

    function resize() {
      W = mount!.offsetWidth;
      H = mount!.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      const cols = Math.ceil(W / SPACING) + 1;
      const rows = Math.ceil(H / SPACING) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING;
          const y = r * SPACING;
          const dx = x - mx;
          const dy = y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          const inf = Math.max(0, 1 - d / INFLUENCE);
          const radius = BASE_R + inf * (MAX_R - BASE_R);
          const baseAlpha = 0.10;
          const alpha = baseAlpha + inf * 0.55;

          if (inf > 0.05) {
            // glow halo
            const g = ctx.createRadialGradient(x, y, 0, x, y, radius * 3.5);
            g.addColorStop(0, `rgba(139,92,246,${inf * 0.22})`);
            g.addColorStop(1, "rgba(139,92,246,0)");
            ctx.beginPath();
            ctx.arc(x, y, radius * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(167,139,250,${alpha})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, BASE_R, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${baseAlpha})`;
            ctx.fill();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    }
    function onLeave() {
      mx = -9999;
      my = -9999;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    resize();
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
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
