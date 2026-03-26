"use client"

import { useEffect, useState, useRef } from "react"
import IdeaRefinement from "@/components/IdeaRefinement"
import WorkflowMap from "@/components/WorkflowMap"
import TechStack from "@/components/TechStack"
import SystemArchitecture from "@/components/SystemArchitecture"
import BuildRoadmap from "@/components/BuildRoadmap"
import PromptBuilder from "@/components/PromptBuilder"
import { getIdea, getRefinement, PROJECT_EVENT } from "@/lib/project"

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  white:      "rgba(255,255,255,1)",
  whiteHi:    "rgba(255,255,255,0.92)",
  whiteMid:   "rgba(255,255,255,0.60)",
  whiteLow:   "rgba(255,255,255,0.35)",
  whiteGhost: "rgba(255,255,255,0.10)",
  accent:     "rgba(120,180,255,1)",
  accentMid:  "rgba(120,180,255,0.55)",
  ready:      "rgba(100,220,255,1)",
}

// ─── MODULES ──────────────────────────────────────────────────────────────────
// Exploded view: 3 modules fan out to the left, 3 to the right
const MODULES = [
  {
    id: "refinement", code: "01", label: "IDEA REFINEMENT",
    description: "Refines your raw idea into a structured product concept.",
    detail: null, status: "READY",
    side: "left", row: 0,
  },
  {
    id: "workflow", code: "02", label: "WORKFLOW MAP",
    description: "Generates step-by-step user flows and interaction diagrams.",
    detail: ["User Onboarding", "Core Actions", "Edge Cases", "Exit Paths"],
    status: "READY",
    side: "right", row: 0,
  },
  {
    id: "techstack", code: "03", label: "TECH STACK",
    description: "Recommends the ideal stack based on your requirements.",
    detail: ["Frontend", "Backend", "Database", "Infra & CI/CD"],
    status: "READY",
    side: "left", row: 1,
  },
  {
    id: "architecture", code: "04", label: "SYSTEM ARCHITECTURE",
    description: "Generates your PRD and architectural system diagram.",
    detail: ["Problem Statement", "Core Features", "System Layers", "Data Flow"],
    status: "READY",
    side: "right", row: 1,
  },
  {
    id: "roadmap", code: "05", label: "BUILD ROADMAP",
    description: "Generates an actionable, step-by-step development roadmap.",
    detail: ["Milestones", "Tasks", "Terminal Commands", "AI Prompts"],
    status: "READY",
    side: "left", row: 2,
  },
  {
    id: "promptbuilder", code: "06", label: "PROMPT BUILDER",
    description: "Synthesizes your blueprint into a master prompt for AI IDEs.",
    detail: ["Target IDEs", "Architecture Rules", "Context Injection", "Instruction Set"],
    status: "READY",
    side: "right", row: 2,
  },
]

const HUB = { x: 50, y: 50 }

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function BlueprintPage() {
  const [idea, setIdea] = useState("")
  const [activeModule, setActiveModule] = useState(null)
  const [isRefined, setIsRefined] = useState(false)

  const checkRefinement = () => {
    if (typeof window !== "undefined") {
      const refined = getRefinement()
      setIsRefined(!!refined)
    }
  }

  useEffect(() => {
    const stored = getIdea()
    if (stored) setIdea(stored)

    checkRefinement()

    const onUpdate = () => checkRefinement()
    window.addEventListener(PROJECT_EVENT, onUpdate)
    return () => window.removeEventListener(PROJECT_EVENT, onUpdate)
  }, [])

  return (
    <main className="blueprint-bg min-h-screen relative font-mono overflow-hidden" style={{ color: C.whiteHi }}>

      {/* TOP SCALE */}
      <div className="absolute top-6 left-0 right-0 text-[8px]"
        style={{ display: "grid", gridTemplateColumns: "repeat(13, 80px)", justifyContent: "center", color: "rgba(255,255,255,0.22)", opacity: 1 }}>
        {[0,10,20,30,40,50,60,70,80,90,100,110,120].map(n => <span key={n} style={{ fontFamily: "monospace", fontWeight: 500 }}>{n}</span>)}
      </div>

      {/* LEFT SCALE */}
      <div className="absolute left-6 top-0 bottom-0 text-[8px]"
        style={{ display: "grid", gridTemplateRows: "repeat(13, 80px)", alignContent: "center", color: "rgba(255,255,255,0.22)", opacity: 1 }}>
        {[0,10,20,30,40,50,60,70,80,90,100,110,120].map(n => <span key={n} style={{ fontFamily: "monospace", fontWeight: 500 }}>{n}</span>)}
      </div>

      {/* CORNER MARKERS */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t border-l opacity-20" style={{ borderColor: C.white }} />
      <div className="absolute top-4 right-4 w-12 h-12 border-t border-r opacity-20" style={{ borderColor: C.white }} />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l opacity-20" style={{ borderColor: C.white }} />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r opacity-20" style={{ borderColor: C.white }} />

      {/* L-SHAPED WORKSPACE INDICATOR (bottom-left) */}
      <div className="absolute pointer-events-none" style={{
        bottom: "24px", left: "24px", zIndex: 5,
      }}>
        {/* L-shape bracket */}
        <div style={{
          width: "140px", height: "120px", position: "relative",
          borderLeft: "1.5px solid rgba(255,255,255,0.15)",
          borderBottom: "1.5px solid rgba(255,255,255,0.15)",
        }}>
          {/* Corner dot */}
          <div style={{
            position: "absolute", bottom: "-3px", left: "-3px",
            width: "5px", height: "5px", borderRadius: "50%",
            background: "rgba(120,180,255,0.6)",
            boxShadow: "0 0 8px rgba(120,180,255,0.4)",
          }} />
          {/* Top tick */}
          <div style={{
            position: "absolute", top: "0", left: "-6px",
            width: "11px", height: "1px", background: "rgba(255,255,255,0.2)",
          }} />
          {/* Right tick */}
          <div style={{
            position: "absolute", bottom: "-5px", right: "0",
            width: "1px", height: "11px", background: "rgba(255,255,255,0.2)",
          }} />

          {/* Spec text inside the L */}
          <div style={{
            position: "absolute", bottom: "10px", left: "12px",
            fontSize: "8px", color: "rgba(255,255,255,0.25)",
            letterSpacing: "0.12em", lineHeight: "1.8",
            textTransform: "uppercase", fontFamily: "monospace",
          }}>
            <div>Project_Ver: 0.9.4.SF</div>
            <div>Resolution: 4K_Vector</div>
            <div>Anchor_Set: Dynamic_Hub</div>
            <div style={{ color: "rgba(100,220,255,0.35)" }}>Context_Sync: Active</div>
          </div>
        </div>
      </div>

      {/* FIXED SIGNATURE (Centered at bottom) */}
      <div style={{
        position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)",
        textAlign: "center", zIndex: 10
      }}>
        <a 
          href="https://rizanmi.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            fontSize: "14px", color: C.accentMid, letterSpacing: "0.2em", textDecoration: "none",
            borderBottom: "1px solid transparent", transition: "all 0.3s ease", fontWeight: "bold",
            display: "inline-block", padding: "4px 10px", background: "rgba(8,25,90,0.6)",
            backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.05)"
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.borderBottomColor = C.ready }}
          onMouseLeave={e => { e.currentTarget.style.color = C.accentMid; e.currentTarget.style.borderBottomColor = "transparent" }}
        >
          // FORGED BY RIZAN
        </a>
      </div>

      {/* HEADER */}
      <div style={{
        position: "absolute", top: "58px", left: "50%", transform: "translateX(-50%)",
        textAlign: "center", zIndex: 20, pointerEvents: "none",
        background: "rgba(8,25,90,0.6)", backdropFilter: "blur(4px)",
        padding: "6px 20px", border: "1px solid rgba(255,255,255,0.1)", whiteSpace: "nowrap",
      }}>
        <h1 style={{ fontSize: "12px", letterSpacing: "0.14em", color: C.white, margin: 0 }}>
          &gt; SYSTEMFORGE BLUEPRINT
        </h1>
        <p style={{ fontSize: "9px", color: C.whiteLow, marginTop: "3px", letterSpacing: "0.06em" }}>
          RAW IDEA: {idea} {isRefined && <span style={{ color: C.ready }}> (REFINED ✓)</span>}
        </p>
      </div>

      {!activeModule ? (
        <HubDiagram 
          modules={MODULES.map(m => {
            // Apply refined status to READY modules
            if (m.status === "READY" && isRefined) {
              return { ...m, status: "REFINED" }
            }
            return m
          })} 
          onSelect={mod => { if (mod.status === "READY" || mod.status === "REFINED") setActiveModule(mod.id) }} 
        />
      ) : (
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "80px 60px 80px 80px", position: "relative", zIndex: 10 }}>
          <ModulePanel
            module={MODULES.find(m => m.id === activeModule)}
            idea={idea}
            onBack={() => setActiveModule(null)}
          />
        </div>
      )}
    </main>
  )
}

// ─── BLUEPRINT LAYOUT ─────────────────────────────────────────────────────────
function HubDiagram({ modules, onSelect }) {
  const [hovered, setHovered] = useState(null)
  const containerRef = useRef(null)
  const hubRef = useRef(null)
  const cardRefs = useRef({})
  const [lines, setLines] = useState([])

  const leftMods  = modules.filter((_, i) => i % 2 === 0)   // 01, 03, 05
  const rightMods = modules.filter((_, i) => i % 2 === 1)   // 02, 04, 06

  const computeLines = () => {
    const container = containerRef.current
    const hubEl = hubRef.current
    if (!container || !hubEl) return

    const cRect = container.getBoundingClientRect()
    const hRect = hubEl.getBoundingClientRect()
    const hubCx = hRect.left + hRect.width / 2 - cRect.left
    const hubCy = hRect.top + hRect.height / 2 - cRect.top

    const computed = modules.map(mod => {
      const el = cardRefs.current[mod.id]
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cardCx = r.left + r.width / 2 - cRect.left
      const cardCy = r.top + r.height / 2 - cRect.top

      // Connect from edge of card closest to hub
      const isLeft = cardCx < hubCx
      const edgeX = isLeft ? r.right - cRect.left : r.left - cRect.left

      return { id: mod.id, x1: edgeX, y1: cardCy, x2: hubCx, y2: hubCy }
    }).filter(Boolean)

    setLines(computed)
  }

  useEffect(() => {
    const t = setTimeout(computeLines, 150)
    window.addEventListener("resize", computeLines)
    return () => { clearTimeout(t); window.removeEventListener("resize", computeLines) }
  }, [])

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>

      {/* SVG Lines */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
        <defs>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {lines.map(({ id, x1, y1, x2, y2 }) => {
          const isHov = hovered === id
          const mod = modules.find(m => m.id === id)
          const isReady = mod?.status === "READY" || mod?.status === "REFINED"
          return (
            <line key={id}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isHov && isReady ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.08)"}
              strokeWidth={isHov ? "1" : "0.5"}
              strokeDasharray="5 4"
              filter={isHov && isReady ? "url(#lineGlow)" : "none"}
              style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
            />
          )
        })}
      </svg>

      {/* 3‑column flex layout */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "30px 40px",
        gap: "0px",
        zIndex: 3,
      }}>

        {/* Left column */}
        <div style={{
          flex: "0 0 240px", display: "flex", flexDirection: "column",
          gap: "24px", maxHeight: "100%",
        }}>
          {leftMods.map(mod => (
            <ExplodedCard
              key={mod.id}
              mod={mod}
              refCallback={el => { cardRefs.current[mod.id] = el; setTimeout(computeLines, 50) }}
              style={{ width: "100%" }}
              isHovered={hovered === mod.id}
              onHover={setHovered}
              onClick={() => onSelect(mod)}
            />
          ))}
        </div>

        {/* Center — reactor hub */}
        <div style={{
          flex: "0 0 520px",
          display: "flex", alignItems: "center", justifyContent: "center",
          maxWidth: 520,
        }}>
          <div ref={hubRef}>
            <Hub2D />
          </div>
        </div>

        {/* Right column */}
        <div style={{
          flex: "0 0 240px", display: "flex", flexDirection: "column",
          gap: "36px", maxHeight: "100%",
        }}>
          {rightMods.map(mod => (
            <ExplodedCard
              key={mod.id}
              mod={mod}
              refCallback={el => { cardRefs.current[mod.id] = el; setTimeout(computeLines, 50) }}
              style={{ width: "100%" }}
              isHovered={hovered === mod.id}
              onHover={setHovered}
              onClick={() => onSelect(mod)}
            />
          ))}
        </div>
      </div>

      {/* Bottom workspace label */}
      <p style={{
        position: "absolute", bottom: "18px", left: "30px",
        fontSize: "8px", color: C.whiteLow, letterSpacing: "0.15em", whiteSpace: "nowrap", zIndex: 3,
        opacity: 0.3
      }}>
        SYSTEMFORGE_WORKSPACE_v1.4 // BLUEPRINT_SCHEMATIC_VIEW
      </p>
    </div>
  )
}

// ─── EXPLODED MODULE CARD (Blueprint wireframe style) ─────────────────────────
function ExplodedCard({ mod, style, isHovered, onHover, onClick, refCallback }) {
  const isReady = mod.status === "READY" || mod.status === "REFINED"
  const borderColor = isHovered && isReady ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.18)"
  const bracketColor = isHovered && isReady ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.22)"
  const bracketSize = 12

  return (
    <div
      ref={refCallback}
      onMouseEnter={() => onHover(mod.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => { if (isReady) onClick() }}
      style={{
        ...style,
        cursor: isReady ? "pointer" : "default",
        opacity: isReady ? 1 : 0.45,
        transition: "all 0.25s ease",
        zIndex: 4,
      }}
    >
      {/* Outer wrapper with corner brackets */}
      <div style={{ position: "relative", padding: "2px" }}>

        {/* Corner brackets — ┌ ┐ └ ┘ */}
        {/* Top-left */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: bracketSize, height: bracketSize,
          borderTop: `1.5px solid ${bracketColor}`,
          borderLeft: `1.5px solid ${bracketColor}`,
          transition: "border-color 0.25s",
        }} />
        {/* Top-right */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: bracketSize, height: bracketSize,
          borderTop: `1.5px solid ${bracketColor}`,
          borderRight: `1.5px solid ${bracketColor}`,
          transition: "border-color 0.25s",
        }} />
        {/* Bottom-left */}
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: bracketSize, height: bracketSize,
          borderBottom: `1.5px solid ${bracketColor}`,
          borderLeft: `1.5px solid ${bracketColor}`,
          transition: "border-color 0.25s",
        }} />
        {/* Bottom-right */}
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: bracketSize, height: bracketSize,
          borderBottom: `1.5px solid ${bracketColor}`,
          borderRight: `1.5px solid ${bracketColor}`,
          transition: "border-color 0.25s",
        }} />

        {/* Inner card content */}
        <div style={{
          border: `0.5px solid ${borderColor}`,
          background: isHovered && isReady ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.015)",
          padding: "14px 16px",
          backdropFilter: "blur(4px)",
          transition: "all 0.25s ease",
          boxShadow: isHovered && isReady ? "0 0 30px rgba(255,255,255,0.06)" : "none",
        }}>

          {/* Header: code + status */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{
              fontSize: "9px", color: "rgba(255,255,255,0.30)", letterSpacing: "0.15em",
              fontFamily: "monospace",
            }}>
              // MODULE {mod.code}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{
                width: 4, height: 4, borderRadius: "50%", display: "inline-block",
                background: isReady ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)",
                boxShadow: isReady ? "0 0 6px rgba(255,255,255,0.4)" : "none",
              }} />
              <span style={{ fontSize: "7px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
                {mod.status}
              </span>
            </div>
          </div>

          {/* Module name */}
          <p style={{
            fontSize: "12px", color: "rgba(255,255,255,0.88)", letterSpacing: "0.06em",
            marginBottom: "6px", fontWeight: "600", margin: "0 0 6px 0",
          }}>
            {mod.label}
          </p>

          {/* Description */}
          <p style={{
            fontSize: "10px", color: "rgba(255,255,255,0.35)", lineHeight: "1.55",
            margin: "0 0 2px 0",
          }}>
            {mod.description}
          </p>

          {/* Detail list */}
          {mod.detail && (
            <div style={{
              marginTop: "8px", paddingTop: "8px",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
              display: "flex", flexWrap: "wrap", gap: "4px 12px",
            }}>
              {mod.detail.map((item, i) => (
                <span key={i} style={{
                  fontSize: "8px", color: "rgba(255,255,255,0.22)",
                  letterSpacing: "0.06em",
                }}>
                  ◇ {item}
                </span>
              ))}
            </div>
          )}

          {/* Hover action */}
          {isReady && isHovered && (
            <p style={{
              fontSize: "9px", color: "rgba(255,255,255,0.50)", marginTop: "10px",
              letterSpacing: "0.08em", margin: "10px 0 0 0",
            }}>
              → CLICK TO OPEN MODULE
            </p>
          )}
        </div>

        {/* Dimension annotation — bottom-right corner */}
        <span style={{
          position: "absolute", bottom: -14, right: 4,
          fontSize: "7px", color: "rgba(255,255,255,0.10)", letterSpacing: "0.1em",
          fontFamily: "monospace",
        }}>
          {mod.side === "left" ? `←  ${style.width}px` : `${style.width}px  →`}
        </span>
      </div>
    </div>
  )
}
function Hub2D() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const size = 280;
  const cx = size / 2, cy = size / 2;
  const toRad = d => (d - 90) * Math.PI / 180;

  if (!mounted) return <div style={{ width: size, height: size }} />

  // ── Helper: generate arc segment paths ──
  const makeSegments = (count, rOuter, rInner, gapDeg = 2, insetDeg = 0) =>
    Array.from({ length: count }, (_, i) => {
      const segAngle = 360 / count;
      const s = i * segAngle + gapDeg;
      const e = (i + 1) * segAngle - gapDeg;
      const o1x = cx + rOuter * Math.cos(toRad(s));
      const o1y = cy + rOuter * Math.sin(toRad(s));
      const o2x = cx + rOuter * Math.cos(toRad(e));
      const o2y = cy + rOuter * Math.sin(toRad(e));
      const i1x = cx + rInner * Math.cos(toRad(s + insetDeg));
      const i1y = cy + rInner * Math.sin(toRad(s + insetDeg));
      const i2x = cx + rInner * Math.cos(toRad(e - insetDeg));
      const i2y = cy + rInner * Math.sin(toRad(e - insetDeg));
      return `M ${o1x} ${o1y} A ${rOuter} ${rOuter} 0 0 1 ${o2x} ${o2y} L ${i2x} ${i2y} A ${rInner} ${rInner} 0 0 0 ${i1x} ${i1y} Z`;
    });

  // ── Helper: generate tick marks ──
  const makeTicks = (count, rInner, rOuter) =>
    Array.from({ length: count }, (_, i) => {
      const deg = (360 / count) * i;
      return {
        x1: cx + rInner * Math.cos(toRad(deg)),
        y1: cy + rInner * Math.sin(toRad(deg)),
        x2: cx + rOuter * Math.cos(toRad(deg)),
        y2: cy + rOuter * Math.sin(toRad(deg)),
      };
    });

  // ── Layers ──
  const outerSegments  = makeSegments(10, 130, 108, 2.5, 1.5);
  const midSegments    = makeSegments(20, 98, 86, 1.8, 0.8);
  const innerSegments  = makeSegments(30, 76, 66, 1.5, 0.5);
  const microSegments  = makeSegments(40, 56, 50, 1.2, 0.3);
  const nanoSegments   = makeSegments(60, 44, 40, 0.8, 0);

  const outerTicks     = makeTicks(60, 130, 135);
  const midTicks       = makeTicks(40, 98, 102);
  const innerTicks     = makeTicks(72, 66, 62);
  const microTicks     = makeTicks(90, 56, 58);

  // 8 crosshair struts
  const crosshairs = Array.from({ length: 8 }, (_, i) => {
    const deg = i * 45;
    return {
      x1: cx + 26 * Math.cos(toRad(deg)),
      y1: cy + 26 * Math.sin(toRad(deg)),
      x2: cx + 48 * Math.cos(toRad(deg)),
      y2: cy + 48 * Math.sin(toRad(deg)),
    };
  });

  // Dimension annotation arcs (partial arcs with end-ticks)
  const dimArcs = [108, 86, 66].map(r => {
    const s = toRad(-15);
    const e = toRad(15);
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
  });

  // White color constants
  const w = (a) => `rgba(255,255,255,${a})`;

  return (
    <>
      <style>{`
        .arc-reactor {
          width: ${size}px; height: ${size}px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }

        .arc-aura {
          position: absolute; inset: -50px;
          border-radius: 50%;
          background: radial-gradient(circle, ${w(0.10)} 0%, ${w(0.04)} 40%, transparent 70%);
          animation: arc-aura-pulse 4s ease-in-out infinite;
        }

        .arc-layer { position: absolute; inset: 0; }
        .arc-layer svg { width: 100%; height: 100%; }

        .arc-ring-1 { animation: arc-spin 30s linear infinite; }
        .arc-ring-2 { animation: arc-spin-rev 22s linear infinite; }
        .arc-ring-3 { animation: arc-spin 16s linear infinite; }
        .arc-ring-4 { animation: arc-spin-rev 12s linear infinite; }
        .arc-ring-5 { animation: arc-spin 9s linear infinite; }
        .arc-ring-ticks { animation: arc-spin-rev 40s linear infinite; }
        .arc-ring-dim { animation: arc-spin 50s linear infinite; }
        .arc-crosshairs { animation: arc-spin-rev 35s linear infinite; }

        .arc-glow-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid ${w(0.25)};
          box-shadow: 0 0 12px ${w(0.08)}, inset 0 0 8px ${w(0.05)};
        }
        .arc-glow-r1 { inset: 2px; border-width: 1.5px; border-color: ${w(0.20)}; }
        .arc-glow-r2 { inset: 22px; border-color: ${w(0.18)}; animation: arc-ring-pulse 3s ease-in-out infinite; }
        .arc-glow-r3 { inset: 35px; border-color: ${w(0.22)}; box-shadow: 0 0 16px ${w(0.12)}, inset 0 0 10px ${w(0.06)}; }
        .arc-glow-r4 { inset: 52px; border-color: ${w(0.15)}; }
        .arc-glow-r5 { inset: 62px; border-color: ${w(0.18)}; animation: arc-ring-pulse 2.5s ease-in-out infinite 0.5s; }
        .arc-glow-r6 { inset: 72px; border-color: ${w(0.12)}; }
        .arc-glow-r7 { inset: 82px; border-color: ${w(0.20)}; box-shadow: 0 0 10px ${w(0.10)}, inset 0 0 6px ${w(0.05)}; }
        .arc-glow-r8 { inset: 92px; border-color: ${w(0.10)}; }
        .arc-glow-r9 { inset: 100px; border-width: 1.5px; border-color: ${w(0.25)}; box-shadow: 0 0 14px ${w(0.12)}; animation: arc-ring-pulse 2s ease-in-out infinite 1s; }

        .arc-core-halo {
          position: absolute;
          width: 50px; height: 50px;
          border-radius: 50%;
          border: 1.5px solid ${w(0.3)};
          box-shadow: 0 0 18px ${w(0.15)}, inset 0 0 12px ${w(0.08)};
          z-index: 2;
        }

        .arc-core {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: radial-gradient(circle at 45% 45%,
            #ffffff 0%,
            ${w(0.95)} 30%,
            ${w(0.6)} 60%,
            ${w(0.2)} 100%);
          box-shadow:
            0 0 12px ${w(0.95)},
            0 0 30px ${w(0.6)},
            0 0 60px ${w(0.3)},
            0 0 100px ${w(0.12)},
            inset 0 0 10px ${w(0.5)};
          animation: arc-core-pulse 3s ease-in-out infinite;
          position: absolute;
          z-index: 3;
        }

        @keyframes arc-spin       { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
        @keyframes arc-spin-rev   { from { transform: rotate(0deg) }   to { transform: rotate(-360deg) } }
        @keyframes arc-core-pulse {
          0%, 100% {
            box-shadow: 0 0 12px ${w(0.95)}, 0 0 30px ${w(0.6)}, 0 0 60px ${w(0.3)}, 0 0 100px ${w(0.12)}, inset 0 0 10px ${w(0.5)};
          }
          50% {
            box-shadow: 0 0 18px ${w(1)}, 0 0 45px ${w(0.7)}, 0 0 80px ${w(0.35)}, 0 0 120px ${w(0.15)}, inset 0 0 15px ${w(0.6)};
          }
        }
        @keyframes arc-aura-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.06); }
        }
        @keyframes arc-ring-pulse {
          0%, 100% { box-shadow: 0 0 12px ${w(0.08)}, inset 0 0 8px ${w(0.05)}; }
          50% { box-shadow: 0 0 20px ${w(0.18)}, inset 0 0 14px ${w(0.10)}; }
        }
      `}</style>

      <div className="arc-reactor" suppressHydrationWarning>
        <div className="arc-aura" />

        {/* Concentric glow rings (static structural rings) */}
        <div className="arc-glow-ring arc-glow-r1" />
        <div className="arc-glow-ring arc-glow-r2" />
        <div className="arc-glow-ring arc-glow-r3" />
        <div className="arc-glow-ring arc-glow-r4" />
        <div className="arc-glow-ring arc-glow-r5" />
        <div className="arc-glow-ring arc-glow-r6" />
        <div className="arc-glow-ring arc-glow-r7" />
        <div className="arc-glow-ring arc-glow-r8" />
        <div className="arc-glow-ring arc-glow-r9" />

        {/* Outer tick marks — slowest counter-rotation */}
        <div className="arc-layer arc-ring-ticks">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {outerTicks.map((t, i) => (
              <line key={`ot-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={i % 5 === 0 ? w(0.35) : w(0.15)} strokeWidth={i % 5 === 0 ? "1.2" : "0.6"} />
            ))}
            {midTicks.map((t, i) => (
              <line key={`mt-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={w(0.12)} strokeWidth="0.5" />
            ))}
          </svg>
        </div>

        {/* Layer 1: Outer segments (10 large trapezoidal blocks) */}
        <div className="arc-layer arc-ring-1">
          <svg viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <filter id="segGlow"><feGaussianBlur stdDeviation="1.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {outerSegments.map((d, i) => (
              <g key={`os-${i}`}>
                <path d={d} fill={w(0.04)} stroke={w(0.30)} strokeWidth="0.8" filter="url(#segGlow)" />
                {/* Inner detail lines on each segment */}
                {[0.25, 0.5, 0.75].map((t, j) => {
                  const segAngle = 36;
                  const midDeg = i * segAngle + segAngle / 2;
                  const rLine = 108 + (130 - 108) * t;
                  const half = (segAngle - 5) * 0.35;
                  const sx = cx + rLine * Math.cos(toRad(midDeg - half));
                  const sy = cy + rLine * Math.sin(toRad(midDeg - half));
                  const ex = cx + rLine * Math.cos(toRad(midDeg + half));
                  const ey = cy + rLine * Math.sin(toRad(midDeg + half));
                  return <line key={j} x1={sx} y1={sy} x2={ex} y2={ey} stroke={w(0.12)} strokeWidth="0.6" />;
                })}
              </g>
            ))}
          </svg>
        </div>

        {/* Layer 2: Mid segments (20 pieces) — counter-rotate */}
        <div className="arc-layer arc-ring-2">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {midSegments.map((d, i) => (
              <path key={`ms-${i}`} d={d} fill={w(0.03)} stroke={w(0.22)} strokeWidth="0.6" />
            ))}
          </svg>
        </div>

        {/* Layer 3: Inner segments (30 pieces) */}
        <div className="arc-layer arc-ring-3">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {innerSegments.map((d, i) => (
              <path key={`is-${i}`} d={d} fill={w(0.025)} stroke={w(0.18)} strokeWidth="0.5" />
            ))}
            {innerTicks.map((t, i) => (
              <line key={`it-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={w(0.10)} strokeWidth="0.4" />
            ))}
          </svg>
        </div>

        {/* Layer 4: Micro segments (40 pieces) — counter-rotate */}
        <div className="arc-layer arc-ring-4">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {microSegments.map((d, i) => (
              <path key={`us-${i}`} d={d} fill={w(0.02)} stroke={w(0.15)} strokeWidth="0.4" />
            ))}
            {microTicks.map((t, i) => (
              <line key={`ut-${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={w(0.08)} strokeWidth="0.3" />
            ))}
          </svg>
        </div>

        {/* Layer 5: Nano segments (60 tiny pieces) — fastest */}
        <div className="arc-layer arc-ring-5">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {nanoSegments.map((d, i) => (
              <path key={`ns-${i}`} d={d} fill="none" stroke={w(0.12)} strokeWidth="0.35" />
            ))}
          </svg>
        </div>

        {/* Dimension annotation arcs */}
        <div className="arc-layer arc-ring-dim">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {dimArcs.map((d, i) => (
              <path key={`dim-${i}`} d={d} fill="none" stroke={w(0.08)} strokeWidth="0.4" strokeDasharray="2 2" />
            ))}
          </svg>
        </div>

        {/* Crosshair struts (8 lines from core outward) */}
        <div className="arc-layer arc-crosshairs">
          <svg viewBox={`0 0 ${size} ${size}`}>
            {crosshairs.map((s, i) => (
              <g key={`ch-${i}`}>
                <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                  stroke={i % 2 === 0 ? w(0.25) : w(0.12)} strokeWidth={i % 2 === 0 ? "1.2" : "0.6"} />
                {/* Small node at end of each strut */}
                <circle cx={s.x2} cy={s.y2} r="1.5" fill={w(0.3)} />
              </g>
            ))}
            {/* Center crosshair lines (full diameter) */}
            <line x1={cx} y1={cy - 22} x2={cx} y2={cy + 22} stroke={w(0.10)} strokeWidth="0.4" />
            <line x1={cx - 22} y1={cy} x2={cx + 22} y2={cy} stroke={w(0.10)} strokeWidth="0.4" />
          </svg>
        </div>

        {/* Core halo */}
        <div className="arc-core-halo" />

        {/* Central core */}
        <div className="arc-core" />
      </div>
    </>
  )
}

// ─── MODULE CARD ──────────────────────────────────────────────────────────────
function ModuleCardHub({ mod, refCallback, isHovered, onHover, onClick }) {
  const isReady = mod.status === "READY" || mod.status === "REFINED"
  return (
    <div
      ref={refCallback}
      onMouseEnter={() => onHover(mod.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${mod.pos.x}%`, top: `${mod.pos.y}%`,
        width: `${mod.width}px`,
        border: `1px solid ${isHovered && isReady ? "rgba(255,255,255,0.75)" : isReady ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)"}`,
        background: isHovered && isReady ? "rgba(20,60,160,0.82)" : "rgba(8,25,90,0.80)",
        padding: "13px 15px",
        cursor: isReady ? "pointer" : "default",
        opacity: isReady ? 1 : 0.52,
        transition: "all 0.18s ease",
        zIndex: 4,
        backdropFilter: "blur(6px)",
        boxShadow: isHovered && isReady ? "0 0 22px rgba(120,180,255,0.22)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
        <span style={{ fontSize: "9px", color: C.whiteLow, letterSpacing: "0.12em" }}>{mod.code}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%", display: "inline-block",
            background: isReady ? C.ready : "rgba(255,255,255,0.15)",
            boxShadow: isReady ? `0 0 6px ${C.ready}` : "none",
          }} />
          <span style={{ fontSize: "8px", color: C.whiteLow, letterSpacing: "0.06em" }}>{mod.status}</span>
        </div>
      </div>
      <p style={{ fontSize: "11px", color: C.white, letterSpacing: "0.05em", marginBottom: "6px", fontWeight: "600" }}>
        {mod.label}
      </p>
      <p style={{ fontSize: "10px", color: C.whiteMid, lineHeight: "1.55", margin: 0 }}>
        {mod.description}
      </p>
      {mod.detail && (
        <ul style={{ listStyle: "none", padding: 0, margin: "9px 0 0 0", display: "flex", flexDirection: "column", gap: "3px" }}>
          {mod.detail.map((item, i) => (
            <li key={i} style={{ fontSize: "9px", color: C.whiteLow, letterSpacing: "0.04em" }}>— {item}</li>
          ))}
        </ul>
      )}
      {isReady && isHovered && (
        <p style={{ fontSize: "9px", color: C.accent, marginTop: "8px", letterSpacing: "0.06em" }}>→ CLICK TO OPEN</p>
      )}
    </div>
  )
}

// ─── MODULE PANEL ─────────────────────────────────────────────────────────────
function ModulePanel({ module, idea, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "rgba(8,25,90,0.6)", border: "1px solid rgba(255,255,255,0.3)",
          color: C.whiteMid, padding: "7px 16px", fontFamily: "monospace",
          fontSize: "11px", cursor: "pointer", marginBottom: "28px",
          letterSpacing: "0.06em", transition: "all 0.15s ease",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.75)"; e.currentTarget.style.color = C.white }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = C.whiteMid }}
      >
        &larr; BACK TO MODULES
      </button>
      <p style={{ fontSize: "11px", color: C.whiteLow, marginBottom: "20px", letterSpacing: "0.08em" }}>
        // {module.code} — {module.label}
      </p>
      {module.id === "refinement" && idea && <IdeaRefinement rawIdea={idea} />}
      {module.id === "workflow" && <WorkflowMap productDetails={idea} />}
      {module.id === "techstack" && <TechStack productDetails={idea} />}
      {module.id === "architecture" && <SystemArchitecture productDetails={idea} />}
      {module.id === "roadmap" && <BuildRoadmap productDetails={idea} />}
      {module.id === "promptbuilder" && <PromptBuilder productDetails={idea} />}
    </div>
  )
}