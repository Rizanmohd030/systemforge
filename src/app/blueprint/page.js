"use client"

import { useEffect, useState, useRef } from "react"
import IdeaRefinement from "@/components/IdeaRefinement"
import WorkflowMap from "@/components/WorkflowMap"
import TechStack from "@/components/TechStack"
import SystemArchitecture from "@/components/SystemArchitecture"
import BuildRoadmap from "@/components/BuildRoadmap"
import PromptBuilder from "@/components/PromptBuilder"
import { EVENTS, KEYS } from "@/lib/context"

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
const MODULES = [
  {
    id: "refinement", code: "01", label: "IDEA REFINEMENT",
    description: "Refines your raw idea into a structured product concept.",
    detail: null, status: "READY",
    pos: { x: 21, y: 22 }, width: 195,
  },
  {
    id: "workflow", code: "02", label: "WORKFLOW MAP",
    description: "Generates step-by-step user flows and interaction diagrams for your full product.",
    detail: ["User Onboarding", "Core Actions", "Edge Cases", "Exit Paths"],
    status: "READY",
    pos: { x: 57, y: 19 }, width: 248,
  },
  {
    id: "techstack", code: "03", label: "TECH STACK",
    description: "Recommends the ideal stack based on your requirements and constraints.",
    detail: ["Frontend", "Backend", "Database", "Infra & CI/CD"],
    status: "READY",
    pos: { x: 7, y: 46 }, width: 238,
  },
  {
    id: "architecture", code: "04", label: "SYSTEM ARCHITECTURE",
    description: "Generates your PRD and architectural system diagram.",
    detail: ["Problem Statement", "Core Features", "System Layers", "Data Flow"],
    status: "READY",
    pos: { x: 72, y: 42 }, width: 238,
  },
  {
    id: "roadmap", code: "05", label: "BUILD ROADMAP",
    description: "Generates an actionable, step-by-step development sprint roadmap.",
    detail: ["Milestones", "Tasks", "Terminal Commands", "AI Prompts"],
    status: "READY",
    pos: { x: 18, y: 75 }, width: 245,
  },
  {
    id: "promptbuilder", code: "06", label: "PROMPT BUILDER",
    description: "Synthesizes your blueprint into a master prompt for AI IDEs.",
    detail: ["Target IDEs", "Architecture Rules", "Context Injection", "Instruction Set"],
    status: "READY",
    pos: { x: 62, y: 67 }, width: 235,
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
      const refined = localStorage.getItem(KEYS.REFINED)
      setIsRefined(!!refined)
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem(KEYS.RAW)
    if (stored) setIdea(stored)

    checkRefinement()

    const onUpdate = () => checkRefinement()
    window.addEventListener(EVENTS.UPDATED, onUpdate)
    return () => window.removeEventListener(EVENTS.UPDATED, onUpdate)
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

// ─── HUB DIAGRAM ──────────────────────────────────────────────────────────────
function HubDiagram({ modules, onSelect }) {
  const [hovered, setHovered]   = useState(null)
  const cardRefs                = useRef({})
  const [lines, setLines]       = useState([])         // [{id, x1,y1,x2,y2}]
  const hubRef                  = useRef(null)
  const containerRef            = useRef(null)

  // Recompute line coords whenever layout settles
  const computeLines = () => {
    const container = containerRef.current
    const hubEl     = hubRef.current
    if (!container || !hubEl) return

    const cRect = container.getBoundingClientRect()
    const hRect = hubEl.getBoundingClientRect()

    // Hub center in % of container
    const hx = ((hRect.left + hRect.width  / 2 - cRect.left) / cRect.width)  * 100
    const hy = ((hRect.top  + hRect.height / 2 - cRect.top)  / cRect.height) * 100

    const computed = modules.map(mod => {
      const el = cardRefs.current[mod.id]
      if (!el) return null
      const r  = el.getBoundingClientRect()
      // Card center
      const cx = ((r.left + r.width  / 2 - cRect.left) / cRect.width)  * 100
      const cy = ((r.top  + r.height / 2 - cRect.top)  / cRect.height) * 100
      return { id: mod.id, x1: hx, y1: hy, x2: cx, y2: cy }
    }).filter(Boolean)

    setLines(computed)
  }

  useEffect(() => {
    // Give DOM a tick to paint, then measure
    const t = setTimeout(computeLines, 80)
    window.addEventListener("resize", computeLines)
    return () => { clearTimeout(t); window.removeEventListener("resize", computeLines) }
  }, [])

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0 }}>

      {/* SVG lines — drawn from measured positions */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
        <defs>
          <marker id="arrowDot" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="4" markerHeight="4">
            <circle cx="4" cy="4" r="3" fill="rgba(120,180,255,0.7)" />
          </marker>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {lines.map(({ id, x1, y1, x2, y2 }) => {
          const mod     = modules.find(m => m.id === id)
          const isHov   = hovered === id
          const isReady = mod?.status === "READY" || mod?.status === "REFINED"
          return (
            <line
              key={id}
              x1={`${x1}%`} y1={`${y1}%`}
              x2={`${x2}%`} y2={`${y2}%`}
              stroke={isHov && isReady ? C.accent : "rgba(255,255,255,0.18)"}
              strokeWidth={isHov ? "1.5" : "1"}
              strokeDasharray={isReady ? "none" : "5 5"}
              markerEnd="url(#arrowDot)"
              filter={isHov && isReady ? "url(#glow)" : "none"}
              style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
            />
          )
        })}
      </svg>

      {/* 2D Animated Hub */}
      <div
        ref={hubRef}
        style={{ position: "absolute", left: `${HUB.x}%`, top: `${HUB.y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}
      >
        <Hub2D />
      </div>

      {/* Module Cards */}
      {modules.map(mod => (
        <ModuleCardHub
          key={mod.id}
          mod={mod}
          refCallback={el => { cardRefs.current[mod.id] = el; computeLines() }}
          isHovered={hovered === mod.id}
          onHover={setHovered}
          onClick={() => onSelect(mod)}
        />
      ))}

      <p style={{
        position: "absolute", bottom: "18px", left: "30px",
        fontSize: "8px", color: C.whiteLow, letterSpacing: "0.15em", whiteSpace: "nowrap", zIndex: 3,
        opacity: 0.3
      }}>
        SYSTEMFORGE_WORKSPACE_v1.4 // VECTOR_CORE_ACTIVE
      </p>
    </div>
  )
}

// ─── ARC REACTOR HUB (Iron Man Style) ─────────────────────────────────────────
function Hub2D() {
  const size = 200;
  const cx = size / 2, cy = size / 2;
  const NUM_COILS = 10;
  const coilAngle = 360 / NUM_COILS;

  // Generate trapezoidal coil segment paths
  const coils = Array.from({ length: NUM_COILS }, (_, i) => {
    const startDeg = i * coilAngle + 3;
    const endDeg = (i + 1) * coilAngle - 3;
    const rOuter = 94;
    const rInner = 68;

    const toRad = d => (d - 90) * Math.PI / 180;

    const ox1 = cx + rOuter * Math.cos(toRad(startDeg));
    const oy1 = cy + rOuter * Math.sin(toRad(startDeg));
    const ox2 = cx + rOuter * Math.cos(toRad(endDeg));
    const oy2 = cy + rOuter * Math.sin(toRad(endDeg));
    const ix1 = cx + rInner * Math.cos(toRad(startDeg + 4));
    const iy1 = cy + rInner * Math.sin(toRad(startDeg + 4));
    const ix2 = cx + rInner * Math.cos(toRad(endDeg - 4));
    const iy2 = cy + rInner * Math.sin(toRad(endDeg - 4));

    return `M ${ox1} ${oy1} A ${rOuter} ${rOuter} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${rInner} ${rInner} 0 0 0 ${ix1} ${iy1} Z`;
  });

  return (
    <>
      <style>{`
        .arc-reactor {
          width: ${size}px; height: ${size}px;
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }

        /* Ambient aura glow */
        .arc-aura {
          position: absolute; inset: -30px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(80,180,255,0.12) 0%, rgba(60,140,255,0.05) 40%, transparent 70%);
          animation: arc-aura-pulse 3s ease-in-out infinite;
        }

        /* Outer coil ring — slow spin */
        .arc-coils {
          position: absolute; inset: 0;
          animation: arc-spin 20s linear infinite;
        }
        .arc-coils svg { width: 100%; height: 100%; }

        /* Ring between coils and inner section (glowing channel) */
        .arc-channel {
          position: absolute; inset: 32px;
          border-radius: 50%;
          border: 2px solid rgba(80,180,255,0.4);
          box-shadow: 0 0 12px rgba(80,180,255,0.3), inset 0 0 12px rgba(80,180,255,0.15);
          animation: arc-spin-rev 15s linear infinite;
        }
        .arc-channel::before, .arc-channel::after {
          content: ""; position: absolute;
          width: 7px; height: 7px; border-radius: 50%;
          background: rgba(100,220,255,0.95);
          box-shadow: 0 0 10px rgba(100,220,255,0.9);
        }
        .arc-channel::before { top: -3.5px; left: 50%; transform: translateX(-50%); }
        .arc-channel::after  { bottom: -3.5px; left: 50%; transform: translateX(-50%); }

        /* Middle ring — segmented dashes */
        .arc-mid-ring {
          position: absolute; inset: 46px;
          border-radius: 50%;
          border: 1.5px dashed rgba(100,200,255,0.25);
          animation: arc-spin 8s linear infinite;
        }

        /* Inner ring — solid, counter-spin */
        .arc-inner-ring {
          position: absolute; inset: 56px;
          border-radius: 50%;
          border: 1.5px solid rgba(80,180,255,0.35);
          animation: arc-spin-rev 10s linear infinite;
        }
        .arc-inner-ring::before, .arc-inner-ring::after {
          content: ""; position: absolute;
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(100,220,255,0.8);
          box-shadow: 0 0 6px rgba(100,220,255,0.7);
        }
        .arc-inner-ring::before { top: 50%; left: -2.5px; transform: translateY(-50%); }
        .arc-inner-ring::after  { top: 50%; right: -2.5px; transform: translateY(-50%); }

        /* Innermost ring */
        .arc-inner-ring-2 {
          position: absolute; inset: 66px;
          border-radius: 50%;
          border: 1px solid rgba(100,200,255,0.2);
          animation: arc-spin 6s linear infinite;
        }

        /* Central core — bright glowing heart */
        .arc-core {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: radial-gradient(circle at 45% 45%, #ffffff 0%, rgba(120,210,255,1) 35%, rgba(60,160,240,0.9) 60%, rgba(40,100,200,0.3) 100%);
          box-shadow:
            0 0 20px rgba(100,200,255,1),
            0 0 45px rgba(80,180,255,0.6),
            0 0 80px rgba(60,150,255,0.25),
            inset 0 0 12px rgba(255,255,255,0.4);
          animation: arc-core-pulse 2.5s ease-in-out infinite;
          position: absolute;
          z-index: 3;
        }
        .arc-core::before {
          content: "";
          position: absolute; inset: -10px;
          border-radius: 50%;
          border: 1px solid rgba(100,220,255,0.25);
        }

        @keyframes arc-spin       { from { transform: rotate(0deg) }   to { transform: rotate(360deg) } }
        @keyframes arc-spin-rev   { from { transform: rotate(0deg) }   to { transform: rotate(-360deg) } }
        @keyframes arc-core-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(100,200,255,1), 0 0 45px rgba(80,180,255,0.6), 0 0 80px rgba(60,150,255,0.25), inset 0 0 12px rgba(255,255,255,0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(100,200,255,1), 0 0 65px rgba(80,180,255,0.5), 0 0 110px rgba(60,150,255,0.2), inset 0 0 18px rgba(255,255,255,0.6);
          }
        }
        @keyframes arc-aura-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.06); }
        }
      `}</style>

      <div className="arc-reactor">
        <div className="arc-aura" />

        {/* Outer coil segments (the trapezoidal "petals") */}
        <div className="arc-coils">
          <svg viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <linearGradient id="coilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(40,80,140,0.9)" />
                <stop offset="50%" stopColor="rgba(30,60,120,0.7)" />
                <stop offset="100%" stopColor="rgba(20,45,100,0.5)" />
              </linearGradient>
              <filter id="coilGlow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {coils.map((d, i) => (
              <g key={i}>
                <path
                  d={d}
                  fill="url(#coilGrad)"
                  stroke="rgba(80,180,255,0.5)"
                  strokeWidth="1"
                  filter="url(#coilGlow)"
                />
                {/* Inner glow line on each coil */}
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(100,200,255,0.15)"
                  strokeWidth="0.5"
                />
              </g>
            ))}
            {/* Outer structural ring */}
            <circle cx={cx} cy={cy} r="95" fill="none" stroke="rgba(80,180,255,0.2)" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="67" fill="none" stroke="rgba(80,180,255,0.25)" strokeWidth="1" />
          </svg>
        </div>

        <div className="arc-channel" />
        <div className="arc-mid-ring" />
        <div className="arc-inner-ring" />
        <div className="arc-inner-ring-2" />
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