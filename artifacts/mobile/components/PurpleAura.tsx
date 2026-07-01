/**
 * Softly animated purple glow-orb background for onboarding.
 * Uses CSS keyframes (injected once) + three translucent blobs.
 * Web-only, zero dependencies.
 */
import React, { useEffect } from "react";
import { Platform } from "react-native";

const CSS_ID = "purple-aura-kf";

function injectKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(CSS_ID)) return;
  const el = document.createElement("style");
  el.id = CSS_ID;
  el.textContent = `
    @keyframes aura1 {
      0%,100% { transform: translate(0,0) scale(1);    opacity:.16; }
      50%      { transform: translate(40px,-30px) scale(1.06); opacity:.22; }
    }
    @keyframes aura2 {
      0%,100% { transform: translate(0,0) scale(1);    opacity:.10; }
      50%      { transform: translate(-30px,40px) scale(1.10); opacity:.17; }
    }
    @keyframes aura3 {
      0%,100% { transform: translate(0,0) scale(1.03); opacity:.07; }
      50%      { transform: translate(20px,20px) scale(1);   opacity:.13; }
    }
  `;
  document.head.appendChild(el);
}

export function PurpleAura() {
  useEffect(() => {
    if (Platform.OS === "web") injectKeyframes();
  }, []);

  if (Platform.OS !== "web") return null;

  const blob = (key: string, anim: string, size: string, top?: string, bottom?: string, left?: string, right?: string) =>
    React.createElement("div", {
      key,
      style: {
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(139,92,246,0.30) 0%, transparent 70%)",
        top,
        bottom,
        left,
        right,
        animation: anim,
      },
    });

  return React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
    },
    children: [
      blob("a1", "aura1 9s ease-in-out infinite",  "55vw", "-15%", undefined, "-8%",  undefined),
      blob("a2", "aura2 11s ease-in-out infinite", "45vw", undefined, "-12%", undefined, "-4%"),
      blob("a3", "aura3 13s ease-in-out infinite", "38vw", "35%",   undefined, "28%",  undefined),
    ],
  }) as any;
}
