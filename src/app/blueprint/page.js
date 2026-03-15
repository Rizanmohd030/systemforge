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
      <div className="absolute top-6 left-0 right-0 text-xs"
        style={{ display: "grid", gridTemplateColumns: "repeat(13, 80px)", justifyContent: "center", color: C.whiteLow }}>
        {[0,10,20,30,40,50,60,70,80,90,100,110,120].map(n => <span key={n}>{n}</span>)}
      </div>

      {/* LEFT SCALE */}
      <div className="absolute left-6 top-0 bottom-0 text-xs"
        style={{ display: "grid", gridTemplateRows: "repeat(13, 80px)", alignContent: "center", color: C.whiteLow }}>
        {[0,10,20,30,40,50,60,70,80,90,100,110,120].map(n => <span key={n}>{n}</span>)}
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
          const isReady = mod?.status === "READY"
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

      {/* Hint */}
      <p style={{
        position: "absolute", bottom: "18px", left: "50%", transform: "translateX(-50%)",
        fontSize: "9px", color: C.whiteLow, letterSpacing: "0.08em", whiteSpace: "nowrap", zIndex: 3,
      }}>
        // SELECT A MODULE — DASHED = COMING SOON
      </p>
    </div>
  )
}

// ─── 2D ANIMATED HUB ──────────────────────────────────────────────────────────
function Hub2D() {
  return (
    <>
      <style>{`
        .hub2d { width:160px; height:160px; position:relative; display:flex; align-items:center; justify-content:center; }

        /* outer rotating dashed ring */
        .hub-ring-outer {
          position:absolute; inset:0;
          border-radius:50%;
          border: 1.5px dashed rgba(120,180,255,0.35);
          animation: hub-spin 12s linear infinite;
        }
        /* dot nodes on the outer ring */
        .hub-ring-outer::before, .hub-ring-outer::after {
          content:""; position:absolute;
          width:7px; height:7px; border-radius:50%;
          background:rgba(120,180,255,0.85);
          box-shadow:0 0 8px rgba(120,180,255,0.85);
          top:50%; left:-3.5px; transform:translateY(-50%);
        }
        .hub-ring-outer::after { left:auto; right:-3.5px; }

        /* middle solid ring — pulse */
        .hub-ring-mid {
          position:absolute; inset:26px;
          border-radius:50%;
          border: 1px solid rgba(255,255,255,0.25);
          animation: hub-pulse 3s ease-in-out infinite;
        }

        /* inner solid ring — counter spin */
        .hub-ring-inner {
          position:absolute; inset:50px;
          border-radius:50%;
          border: 1.5px solid rgba(120,180,255,0.55);
          animation: hub-spin-rev 8s linear infinite;
        }
        /* tick marks on inner ring */
        .hub-ring-inner::before, .hub-ring-inner::after {
          content:""; position:absolute;
          width:6px; height:6px; border-radius:50%;
          background:rgba(100,220,255,0.9);
          box-shadow:0 0 7px rgba(100,220,255,0.9);
          top:-3px; left:50%; transform:translateX(-50%);
        }
        .hub-ring-inner::after { top:auto; bottom:-3px; }

        /* center glow */
        .hub-center {
          width:28px; height:28px;
          border-radius:50%;
          background: radial-gradient(circle at 35% 35%, #fff, rgba(80,160,255,0.9));
          box-shadow: 0 0 12px rgba(120,180,255,1), 0 0 28px rgba(120,180,255,0.4);
          animation: hub-center-pulse 2s ease-in-out infinite;
          position:absolute;
          z-index:2;
        }

        @keyframes hub-spin      { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
        @keyframes hub-spin-rev  { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes hub-pulse     { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.06)} }
        @keyframes hub-center-pulse { 0%,100%{box-shadow:0 0 12px rgba(120,180,255,1),0 0 28px rgba(120,180,255,0.4)} 50%{box-shadow:0 0 20px rgba(120,180,255,1),0 0 50px rgba(120,180,255,0.3)} }
      `}</style>

      <div className="hub2d">
        <div className="hub-ring-outer" />
        <div className="hub-ring-mid" />
        <div className="hub-ring-inner" />
        <div className="hub-center" />
      </div>
    </>
  )
}

// ─── MODULE CARD ──────────────────────────────────────────────────────────────
function ModuleCardHub({ mod, refCallback, isHovered, onHover, onClick }) {
  const isReady = mod.status === "READY"
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