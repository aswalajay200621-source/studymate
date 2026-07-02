/**
 * Animated flowing purple particle-wave streams — web only.
 * Draws multiple sine waves of glowing dots that drift across the screen.
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
    const ctx = canvas.getContext("2d")!;
    Object.assign(canvas.style, {
      position: "absolute", inset: "0",
      width: "100%", height: "100%", pointerEvents: "none",
    });
    mount.appendChild(canvas);

    let W = 0, H = 0, raf = 0, t = 0;

    const WAVES = [
      { amp: 0.13, freq: 1.8, speed: 0.008, yBase: 0.22, color: "rgba(139,92,246,", dots: 90, size: 1.5, glow: 6 },
      { amp: 0.09, freq: 2.4, speed: 0.010, yBase: 0.28, color: "rgba(109,40,217,",  dots: 70, size: 1.1, glow: 4 },
      { amp: 0.11, freq: 1.5, speed: 0.006, yBase: 0.72, color: "rgba(139,92,246,", dots: 90, size: 1.5, glow: 6 },
      { amp: 0.07, freq: 2.2, speed: 0.009, yBase: 0.78, color: "rgba(167,139,250,", dots: 60, size: 1.0, glow: 3 },
    ];

    function resize() {
      W = mount!.offsetWidth;
      H = mount!.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      t += 1;

      for (const wave of WAVES) {
        for (let i = 0; i < wave.dots; i++) {
          const nx   = i / wave.dots;                                  // 0..1 along wave
          const px   = nx * W;
          const py   = wave.yBase * H
                     + Math.sin(nx * wave.freq * Math.PI * 2 - t * wave.speed * 60) * wave.amp * H;

          // proximity fade — brighter near centre of x
          const dist  = Math.abs(nx - 0.5);
          const alpha = (0.55 - dist * 0.6) * (0.6 + 0.4 * Math.sin(i * 0.8 + t * 0.03));
          if (alpha <= 0) continue;

          // glow halo
          const gr = ctx.createRadialGradient(px, py, 0, px, py, wave.glow * 2.5);
          gr.addColorStop(0, `${wave.color}${(alpha * 0.5).toFixed(2)})`);
          gr.addColorStop(1, `${wave.color}0)`);
          ctx.beginPath();
          ctx.arc(px, py, wave.glow * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = gr;
          ctx.fill();

          // core dot
          ctx.beginPath();
          ctx.arc(px, py, wave.size, 0, Math.PI * 2);
          ctx.fillStyle = `${wave.color}${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(mount);
    resize();
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.remove();
    };
  }, []);

  if (Platform.OS !== "web") return null;
  return React.createElement("div", {
    ref: mountRef,
    style: {
      position: "absolute", inset: 0,
      overflow: "hidden", pointerEvents: "none",
      ...(style ?? {}),
    },
  });
}
