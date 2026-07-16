import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { Feather } from "@expo/vector-icons";

const isWeb = Platform.OS === "web";

// ─── Design tokens (Exact matches from the HTML file) ─────────────────────────
const NAVY        = "#152238";
const NAVY_DEEP   = "#0d1729";
const NAVY_SOFT   = "#1E3050";
const CREAM       = "#F5EFE0";
const CREAM_2     = "#EFE7D3";
const PAPER       = "#FBF8EF";
const GOLD        = "#B8935A";
const GOLD_BRIGHT = "#D2AC79";
const OXBLOOD     = "#9B3131";
const INK         = "#2A2622";
const INK_SOFT    = "#5B5648";
// ──────────────────────────────────────────────────────────────────────────────

// ─── CSS keyframe injection (web only) ────────────────────────────────────────
function InjectStyles() {
  if (!isWeb) return null;
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    * { box-sizing: border-box; }

    @keyframes driftA {
      0%,100%{ transform:translate(0,0) scale(1); }
      50%{ transform:translate(40px,50px) scale(1.15); }
    }
    @keyframes driftB {
      0%,100%{ transform:translate(0,0) scale(1); }
      50%{ transform:translate(-35px,-30px) scale(1.1); }
    }
    @keyframes gridPan {
      from{ background-position:0 0, 0 0; }
      to{ background-position:38px 76px, 38px 76px; }
    }
    @keyframes rise {
      0%{ transform:translateY(0) translateX(0); opacity:0; }
      8%{ opacity:0.55; }
      92%{ opacity:0.35; }
      100%{ transform:translateY(-620px) translateX(var(--drift,20px)); opacity:0; }
    }
    @keyframes bob1 { 0%,100%{ transform:translate(0,0); } 50%{ transform:translate(0,-6px); } }
    @keyframes bob2 { 0%,100%{ transform:translate(14px,0); } 50%{ transform:translate(14px,-6px); } }
    @keyframes bob3 { 0%,100%{ transform:translate(28px,0); } 50%{ transform:translate(28px,-6px); } }
    @keyframes sealPulse {
      0%,100%{ box-shadow:0 0 0 0 rgba(210,172,121,0.0); }
      50%{ box-shadow:0 0 0 6px rgba(210,172,121,0.08); }
    }
    @keyframes cardIn {
      from{ opacity:0; transform:translateY(16px); }
      to{ opacity:1; transform:translateY(0); }
    }

    .ag-glow-1 {
      animation: driftA 16s ease-in-out infinite;
    }
    .ag-glow-2 {
      animation: driftB 20s ease-in-out infinite;
    }
    .ag-grid {
      animation: gridPan 34s linear infinite;
    }
    .ag-card-1 { animation: bob1 5.5s ease-in-out infinite; }
    .ag-card-2 { animation: bob2 5.5s ease-in-out infinite; animation-delay: 0.6s; }
    .ag-card-3 { animation: bob3 5.5s ease-in-out infinite; animation-delay: 1.2s; }
    
    .ag-seal {
      animation: sealPulse 3.2s ease-in-out infinite;
    }
    .ag-ticket {
      animation: cardIn 0.7s cubic-bezier(.2,.8,.2,1) both;
    }
    .ag-input:focus-within {
      border-color: ${GOLD} !important;
      background: ${PAPER} !important;
    }
    .ag-btn-signin:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(13,23,41,0.34) !important;
    }
    .ag-btn-signin:active {
      transform: translateY(0px) scale(0.99);
    }
  `;
  return React.createElement("style", { dangerouslySetInnerHTML: { __html: css } });
}

// ─── Main login screen ────────────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthLoading, emailLogin, isAdmin } = useAuth();
  const isDesktop = useIsDesktop();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // Count-up stats state
  const [stats, setStats] = useState({ notes: 0, flashcards: 0, quizzes: 0 });

  useEffect(() => {
    if (!isWeb) return;
    let start = performance.now();
    const duration = 1400;
    let animId: number;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setStats({
        notes: Math.floor(progress * 120),
        flashcards: Math.floor(progress * 45),
        quizzes: Math.floor(progress * 30),
      });
      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Floating particles state (web only)
  const [particles] = useState(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const size = 2 + Math.random() * 3;
      const left = Math.random() * 100;
      const duration = 9 + Math.random() * 10;
      const delay = Math.random() * 14;
      const drift = (Math.random() * 60 - 30) + "px";
      return {
        id: i,
        style: {
          position: "absolute" as const,
          bottom: "-10px",
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          borderRadius: "50%",
          background: GOLD_BRIGHT,
          opacity: 0,
          animation: `rise ${duration}s linear ${delay}s infinite`,
          "--drift": drift,
          pointerEvents: "none" as const,
        } as any
      };
    });
  });

  if (!isAuthLoading && user) return <Redirect href={isAdmin ? "/(admin)" : "/(tabs)"} />;

  async function handleLogin() {
    setError("");
    if (!email.trim())  { setError("Please enter your email"); return; }
    if (!password)      { setError("Please enter your password"); return; }
    setLoading(true);
    const result = await emailLogin(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  // ── Web (Split Showcase + Ticket Card) ─────────────────────────────────────
  if (isWeb) {
    return (
      <View style={{ flex: 1, flexDirection: "row", minHeight: "100vh" as any, backgroundColor: CREAM }}>
        <InjectStyles />

        {/* ================= LEFT PANEL — Live Showcase ================= */}
        {React.createElement("section", {
          style: {
            flex: 1.15,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 56px",
            overflow: "hidden",
            minHeight: "100vh",
            background: NAVY,
            isolation: "isolate",
          }
        },
          // Drifting glows
          React.createElement("div", {
            className: "ag-glow-1",
            style: {
              position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.55, zIndex: 0, pointerEvents: "none",
              width: "420px", height: "420px",
              background: "radial-gradient(circle, rgba(184,147,90,0.30), transparent 70%)",
              top: "-120px", left: "-100px",
            }
          }),
          React.createElement("div", {
            className: "ag-glow-2",
            style: {
              position: "absolute", borderRadius: "50%", filter: "blur(70px)", opacity: 0.55, zIndex: 0, pointerEvents: "none",
              width: "360px", height: "360px",
              background: "radial-gradient(circle, rgba(155,49,49,0.20), transparent 70%)",
              bottom: "-100px", right: "-80px",
            }
          }),

          // Moving grid
          React.createElement("div", {
            className: "ag-grid",
            style: {
              position: "absolute", inset: "-2px", zIndex: 0, pointerEvents: "none",
              backgroundImage: `
                linear-gradient(rgba(245,239,224,0.045) 1px, transparent 1px),
                linear-gradient(90deg, rgba(245,239,224,0.045) 1px, transparent 1px)
              `,
              backgroundSize: "38px 38px",
            }
          }),

          // Particles
          React.createElement("div", {
            style: { position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }
          },
            particles.map(p => React.createElement("div", { key: p.id, style: p.style }))
          ),

          // Header
          React.createElement("div", {
            style: {
              display: "flex", alignItems: "center", gap: "10px",
              fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "22px",
              color: CREAM, position: "relative", zIndex: 3,
            }
          },
            React.createElement("div", {
              style: {
                width: "34px", height: "34px", border: `1.5px solid ${GOLD}`, borderRadius: "4px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", color: GOLD_BRIGHT,
              }
            }, "S"),
            "StudyMate"
          ),

          // Hero
          React.createElement("div", {
            style: { position: "relative", zIndex: 3, maxWidth: "460px" }
          },
            React.createElement("span", {
              style: {
                fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", letterSpacing: "0.14em",
                textTransform: "uppercase", color: GOLD_BRIGHT, marginBottom: "18px", display: "block",
              }
            }, "Notes · Flashcards · Quizzes"),
            React.createElement("h1", {
              style: {
                fontFamily: "'Playfair Display', serif", fontWeight: "600", fontStyle: "italic",
                fontSize: "38px", lineHeight: "1.25", color: CREAM, marginBottom: "16px",
              }
            }, "Every subject, kept exactly where you left it."),
            React.createElement("p", {
              style: {
                fontSize: "15px", lineHeight: "1.7", color: "#C6CBD6", maxWidth: "400px", fontFamily: "'IBM Plex Sans', sans-serif"
              }
            }, "Sign in to pick up your CSE and EEE notes, revise with flashcards, and test yourself before the exam — all in one shelf."),

            // Bobbing cards
            React.createElement("div", {
              style: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "44px", maxWidth: "400px" }
            },
              React.createElement("div", {
                className: "ag-card-1",
                style: {
                  background: PAPER, borderRadius: "3px", padding: "13px 16px", display: "flex", alignItems: "center", gap: "12px",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.28)", borderLeft: `3px solid ${OXBLOOD}`
                }
              },
                React.createElement("span", {
                  style: {
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", fontWeight: "500", letterSpacing: "0.04em",
                    color: INK_SOFT, backgroundColor: CREAM_2, padding: "3px 7px", borderRadius: "2px", whiteSpace: "nowrap"
                  }
                }, "CSE · U3"),
                React.createElement("span", { style: { fontSize: "13.5px", fontWeight: 500, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" } }, "Operating Systems — Deadlock Handling")
              ),
              React.createElement("div", {
                className: "ag-card-2",
                style: {
                  background: PAPER, borderRadius: "3px", padding: "13px 16px", display: "flex", alignItems: "center", gap: "12px",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.28)", borderLeft: `3px solid ${GOLD}`
                }
              },
                React.createElement("span", {
                  style: {
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", fontWeight: "500", letterSpacing: "0.04em",
                    color: INK_SOFT, backgroundColor: CREAM_2, padding: "3px 7px", borderRadius: "2px", whiteSpace: "nowrap"
                  }
                }, "EEE · U5"),
                React.createElement("span", { style: { fontSize: "13.5px", fontWeight: 500, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" } }, "Circuit Theory — Network Theorems")
              ),
              React.createElement("div", {
                className: "ag-card-3",
                style: {
                  background: PAPER, borderRadius: "3px", padding: "13px 16px", display: "flex", alignItems: "center", gap: "12px",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.28)", borderLeft: "3px solid #3D5A44"
                }
              },
                React.createElement("span", {
                  style: {
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", fontWeight: "500", letterSpacing: "0.04em",
                    color: INK_SOFT, backgroundColor: CREAM_2, padding: "3px 7px", borderRadius: "2px", whiteSpace: "nowrap"
                  }
                }, "CSE · U2"),
                React.createElement("span", { style: { fontSize: "13.5px", fontWeight: 500, color: INK, fontFamily: "'IBM Plex Sans', sans-serif" } }, "Data Structures — Trees & Graphs")
              )
            )
          ),

          // Stats
          React.createElement("div", {
            style: {
              display: "flex", gap: "34px", marginTop: "40px", paddingTop: "24px",
              borderTop: "1px solid rgba(245,239,224,0.14)", position: "relative", zIndex: 3
            }
          },
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } },
              React.createElement("span", { style: { fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "700", color: GOLD_BRIGHT } }, `${stats.notes}+`),
              React.createElement("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#8B93A6" } }, "Study Notes")
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } },
              React.createElement("span", { style: { fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "700", color: GOLD_BRIGHT } }, `${stats.flashcards}+`),
              React.createElement("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#8B93A6" } }, "Flashcard Decks")
            ),
            React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "3px" } },
              React.createElement("span", { style: { fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "700", color: GOLD_BRIGHT } }, `${stats.quizzes}+`),
              React.createElement("span", { style: { fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "#8B93A6" } }, "Quizzes")
            )
          )
        )}

        {/* ================= RIGHT PANEL — Ticket Form ================= */}
        {React.createElement("section", {
          style: {
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px",
            background: `radial-gradient(circle at 80% 15%, rgba(184,147,90,0.10), transparent 45%), ${CREAM}`,
            position: "relative",
          }
        },
          React.createElement("div", {
            className: "ag-ticket",
            style: {
              width: "100%", maxWidth: "398px", background: PAPER, borderRadius: "10px",
              border: `1px solid rgba(184,147,90,0.35)`,
              boxShadow: "0 1px 2px rgba(42,38,34,0.05), 0 24px 50px rgba(21,34,56,0.14)",
              overflow: "hidden", position: "relative",
            }
          },
            // Ticket Header
            React.createElement("div", {
              style: {
                background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_SOFT} 100%)`,
                padding: "22px 30px 26px", color: CREAM,
              }
            },
              React.createElement("div", {
                className: "ag-seal",
                style: {
                  width: "38px", height: "38px", border: `1.5px solid ${GOLD_BRIGHT}`, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "16px",
                  color: GOLD_BRIGHT, marginBottom: "12px",
                }
              }, "S"),
              React.createElement("span", {
                style: {
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.14em",
                  textTransform: "uppercase", color: GOLD_BRIGHT, display: "block", marginBottom: "5px"
                }
              }, "Member Access"),
              React.createElement("h2", {
                style: { fontFamily: "'Playfair Display', serif", fontSize: "25px", fontWeight: "700" }
              }, "Welcome back")
            ),

            // Perforated Edge
            React.createElement("div", {
              style: { position: "relative", height: 0 }
            },
              React.createElement("div", {
                style: {
                  position: "absolute", top: "-9px", width: "18px", height: "18px",
                  background: CREAM, borderRadius: "50%", left: "-9px"
                }
              }),
              React.createElement("div", {
                style: {
                  position: "absolute", top: "-9px", width: "18px", height: "18px",
                  background: CREAM, borderRadius: "50%", right: "-9px"
                }
              })
            ),
            React.createElement("div", {
              style: { borderTop: `1.5px dashed rgba(184,147,90,0.5)` }
            }),

            // Form Body
            React.createElement("div", {
              style: { padding: "26px 30px 30px" }
            },
              React.createElement("p", {
                style: { fontSize: "13px", color: INK_SOFT, marginBottom: "22px", fontFamily: "'IBM Plex Sans', sans-serif" }
              }, "Sign in with your email and password to continue."),

              React.createElement("form", { onSubmit: (e: any) => { e.preventDefault(); handleLogin(); } },
                // Email Field
                React.createElement("div", { style: { marginBottom: "18px" } },
                  React.createElement("label", {
                    style: {
                      display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                      letterSpacing: "0.09em", textTransform: "uppercase", color: INK_SOFT, marginBottom: "7px"
                    }
                  }, "Student Email"),
                  React.createElement("div", {
                    className: "ag-input",
                    style: {
                      display: "flex", alignItems: "center", gap: "9px", background: CREAM_2,
                      border: "1px solid transparent", borderRadius: "8px", padding: "12px 14px",
                      transition: "border-color 0.2s ease, background 0.2s ease"
                    }
                  },
                    // Mail SVG Icon
                    React.createElement("span", { style: { color: INK_SOFT, display: "flex", alignItems: "center" } },
                      React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" },
                        React.createElement("path", { d: "M4 4h16v16H4z", stroke: "none" }),
                        React.createElement("path", { d: "M22 6l-10 7L2 6" }),
                        React.createElement("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" })
                      )
                    ),
                    React.createElement("input", {
                      type: "email",
                      placeholder: "you@college.edu",
                      value: email,
                      onChange: (e: any) => setEmail(e.target.value),
                      required: true,
                      style: {
                        flex: 1, border: "none", outline: "none", background: "transparent",
                        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", color: INK
                      }
                    })
                  )
                ),

                // Password Field
                React.createElement("div", { style: { marginBottom: "18px" } },
                  React.createElement("label", {
                    style: {
                      display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                      letterSpacing: "0.09em", textTransform: "uppercase", color: INK_SOFT, marginBottom: "7px"
                    }
                  }, "Password"),
                  React.createElement("div", {
                    className: "ag-input",
                    style: {
                      display: "flex", alignItems: "center", gap: "9px", background: CREAM_2,
                      border: "1px solid transparent", borderRadius: "8px", padding: "12px 14px",
                      transition: "border-color 0.2s ease, background 0.2s ease"
                    }
                  },
                    // Lock SVG Icon
                    React.createElement("span", { style: { color: INK_SOFT, display: "flex", alignItems: "center" } },
                      React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" },
                        React.createElement("rect", { x: "3", y: "11", width: "18", height: "10", rx: "2" }),
                        React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
                      )
                    ),
                    React.createElement("input", {
                      type: showPassword ? "text" : "password",
                      placeholder: "Your password",
                      value: password,
                      onChange: (e: any) => setPassword(e.target.value),
                      required: true,
                      style: {
                        flex: 1, border: "none", outline: "none", background: "transparent",
                        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", color: INK
                      }
                    }),
                    React.createElement("button", {
                      type: "button",
                      onClick: () => setShowPassword(v => !v),
                      style: {
                        background: "none", border: "none", cursor: "pointer", color: "#A79C82",
                        display: "flex", alignItems: "center", padding: "2px"
                      }
                    },
                      React.createElement("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8" },
                        showPassword 
                          ? React.createElement("path", { d: "M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.22-5.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" })
                          : React.createElement(React.Fragment, null,
                              React.createElement("path", { d: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" }),
                              React.createElement("circle", { cx: "12", cy: "12", r: "3" })
                            )
                      )
                    )
                  )
                ),

                // Forgot Password link
                React.createElement("div", {
                  style: { display: "flex", justifyContent: "flex-end", marginBottom: "22px" }
                },
                  React.createElement("a", {
                    href: "#",
                    style: { fontSize: "12.5px", color: GOLD, fontWeight: "500", borderBottom: "1px solid transparent" }
                  }, "Forgot password?")
                ),

                // Error Display
                error ? React.createElement("div", {
                  style: {
                    display: "flex", alignItems: "center", gap: "8px", background: "rgba(248,113,113,0.08)",
                    border: "1px solid rgba(248,113,113,0.18)", borderRadius: "10px", padding: "12px", marginBottom: "12px"
                  }
                },
                  React.createElement("span", { style: { color: "#F87171", fontSize: "13px", fontFamily: "'IBM Plex Sans', sans-serif" } }, error)
                ) : null,

                // Submit Button
                React.createElement("button", {
                  className: "ag-btn-signin",
                  type: "submit",
                  disabled: loading,
                  style: {
                    width: "100%", background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
                    color: CREAM, border: "none", borderRadius: "8px", padding: "14px 18px",
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", fontWeight: "600",
                    letterSpacing: "0.02em", cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "9px", transition: "transform 0.15s ease, box-shadow 0.2s ease",
                    boxShadow: "0 8px 18px rgba(13,23,41,0.28)", opacity: loading ? 0.7 : 1,
                  }
                },
                  loading ? React.createElement("span", { style: { fontSize: "14px" } }, "⟳") : React.createElement(React.Fragment, null,
                    React.createElement("svg", { width: "15", height: "15", viewBox: "0 0 24 24", fill: "none", stroke: GOLD_BRIGHT, strokeWidth: "2" },
                      React.createElement("path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }),
                      React.createElement("polyline", { points: "10 17 15 12 10 7" }),
                      React.createElement("line", { x1: "15", y1: "12", x2: "3", y2: "12" })
                    ),
                    "Sign In"
                  )
                )
              ),

              // Signup Divider
              React.createElement("div", {
                style: { display: "flex", alignItems: "center", gap: "12px", margin: "24px 0 18px" }
              },
                React.createElement("div", { style: { flex: 1, height: "1px", background: "#DDD3B8" } }),
                React.createElement("span", {
                  style: { fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", color: "#A79C82", letterSpacing: "0.06em" }
                }, "NEW TO STUDYMATE"),
                React.createElement("div", { style: { flex: 1, height: "1px", background: "#DDD3B8" } })
              ),

              // Signup Line
              React.createElement("p", {
                style: { textAlign: "center", fontSize: "13px", color: INK_SOFT, fontFamily: "'IBM Plex Sans', sans-serif" }
              },
                "Don't have an account? ",
                React.createElement("span", {
                  onClick: () => router.push("/signup"),
                  style: { color: OXBLOOD, fontWeight: "600", cursor: "pointer", textDecoration: "underline" }
                }, "Create one")
              )
            )
          )
        )}
      </View>
    );
  }

  // ── Native Fallback ────────────────────────────────────────────────────────
  const topPad = insets.top + 24;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: NAVY }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[NAVY, NAVY_SOFT]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[nativeS.header, { paddingTop: topPad }]}
        >
          <View style={nativeS.logoBox}>
            <Text style={{ fontSize: 24, color: GOLD_BRIGHT, fontWeight: "bold" }}>S</Text>
          </View>
          <Text style={nativeS.appName}>StudyMate</Text>
          <Text style={nativeS.tagline}>Smart notes for engineering students</Text>
        </LinearGradient>

        <View style={[nativeS.body, { backgroundColor: CREAM }]}>
          <View style={[nativeS.card, { backgroundColor: PAPER, borderColor: "rgba(184,147,90,0.3)" }]}>
            <Text style={[nativeS.welcomeTitle, { color: INK }]}>Welcome back!</Text>
            <Text style={[nativeS.welcomeDesc, { color: INK_SOFT }]}>Sign in with your email and password</Text>

            <Text style={[nativeS.label, { color: INK_SOFT }]}>Email Address</Text>
            <TextInput
              style={[nativeS.input, { color: INK, borderColor: "rgba(184,147,90,0.2)", backgroundColor: CREAM_2 }]}
              placeholder="you@college.edu"
              placeholderTextColor="#A79C82"
              value={email} onChangeText={setEmail}
              keyboardType="email-address" autoCapitalize="none"
            />
            <Text style={[nativeS.label, { color: INK_SOFT }]}>Password</Text>
            <View style={[nativeS.pwRow, { borderColor: "rgba(184,147,90,0.2)", backgroundColor: CREAM_2 }]}>
              <TextInput
                style={[nativeS.pwInput, { color: INK }]}
                placeholder="Your password" placeholderTextColor="#A79C82"
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onSubmitEditing={handleLogin} returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color="#A79C82" />
              </TouchableOpacity>
            </View>

            {!!error && (
              <View style={nativeS.errorBox}>
                <Feather name="alert-circle" size={14} color="#F87171" />
                <Text style={nativeS.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} disabled={loading}
              style={[nativeS.loginBtn, { marginTop: 16 }]}>
              <LinearGradient colors={[NAVY, NAVY_DEEP]} style={nativeS.loginGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={nativeS.loginBtnInner}>
                    <Feather name="log-in" size={18} color={GOLD_BRIGHT} style={{ marginRight: 10 }} />
                    <Text style={nativeS.loginText}>Sign In</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/signup")} style={nativeS.switchLink}>
              <Text style={[nativeS.switchText, { color: INK_SOFT }]}>
                Don't have an account?{" "}
                <Text style={{ color: OXBLOOD, fontWeight: "bold" }}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Native Styles ────────────────────────────────────────────────────────────
const nativeS = StyleSheet.create({
  header:      { alignItems: "center", paddingHorizontal: 24, paddingBottom: 48 },
  logoBox: {
    width: 60, height: 60, borderRadius: 12,
    borderWidth: 1.5, borderColor: GOLD,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  appName:     { color: "#fff", fontSize: 28, fontFamily: "System", fontWeight: "bold", marginBottom: 6 },
  tagline:     { color: "rgba(255,255,255,0.8)", fontSize: 15, fontFamily: "System" },
  body:        { flex: 1, padding: 20, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  card:        { borderRadius: 16, borderWidth: 1, padding: 24, gap: 8, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  welcomeTitle:{ fontSize: 22, fontWeight: "bold", marginBottom: 4, textAlign: "center" },
  welcomeDesc: { fontSize: 14, lineHeight: 20, marginBottom: 8, textAlign: "center" },
  label:       { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, marginTop: 4 },
  input: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  pwRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 2,
  },
  pwInput:     { flex: 1, paddingVertical: 10, fontSize: 15 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, padding: 12,
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1, borderColor: "rgba(248,113,113,0.18)",
  },
  errorText:   { color: "#F87171", fontSize: 13, flex: 1 },
  loginBtn:    { borderRadius: 8, overflow: "hidden" },
  loginGradient: { height: 50, alignItems: "center", justifyContent: "center" },
  loginBtnInner: { flexDirection: "row", alignItems: "center" },
  loginText:   { color: "#fff", fontSize: 16, fontWeight: "bold" },
  switchLink:  { alignItems: "center", paddingVertical: 12 },
  switchText:  { fontSize: 14 },
});
