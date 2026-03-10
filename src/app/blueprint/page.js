"use client"

import { useEffect, useState } from "react"
import IdeaRefinement from "@/components/IdeaRefinement"

// ─── MODULE DEFINITIONS ───────────────────────────────────────────────────────

const MODULES = [
  {
    id: "refinement",
    code: "01",
    label: "IDEA REFINEMENT",
    description: "Breaks your raw idea into a structured product concept — name, description, users, and core features.",
    status: "READY",
  },
  {
    id: "workflow",
    code: "02",
    label: "WORKFLOW MAP",
    description: "Generates a step-by-step user workflow and interaction flow for your product.",
    status: "COMING SOON",
  },
  {
    id: "techstack",
    code: "03",
    label: "TECH STACK",
    description: "Recommends the ideal technology stack based on your product requirements.",
    status: "COMING SOON",
  },
  {
    id: "architecture",
    code: "04",
    label: "SYSTEM ARCHITECTURE",
    description: "Designs the high-level architecture — services, APIs, databases, and how they connect.",
    status: "COMING SOON",
  },
  {
    id: "roadmap",
    code: "05",
    label: "BUILD ROADMAP",
    description: "Breaks the build into sprints with milestones and deliverables.",
    status: "COMING SOON",
  },
  {
    id: "schema",
    code: "06",
    label: "DATA SCHEMA",
    description: "Drafts the core database schema with tables, fields, and relationships.",
    status: "COMING SOON",
  },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function BlueprintPage() {
  const [idea, setIdea] = useState("")
  const [activeModule, setActiveModule] = useState(null)

  useEffect(() => {
    const storedIdea = localStorage.getItem("systemforge_idea")
    if (storedIdea) setIdea(storedIdea)
  }, [])

  const handleModuleClick = (mod) => {
    if (mod.status !== "READY") return
    setActiveModule(mod.id)
  }

  return (
    <main className="blueprint-bg min-h-screen relative font-mono text-white">

      {/* TOP SCALE */}
      <div
        className="absolute top-6 left-0 right-0 text-xs opacity-60"
        style={{ display: "grid", gridTemplateColumns: "repeat(13, 80px)", justifyContent: "center" }}
      >
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(n => <span key={n}>{n}</span>)}
      </div>

      {/* LEFT SCALE */}
      <div
        className="absolute left-6 top-0 bottom-0 text-xs opacity-60"
        style={{ display: "grid", gridTemplateRows: "repeat(13, 80px)", alignContent: "center" }}
      >
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(n => <span key={n}>{n}</span>)}
      </div>

      {/* WORKSPACE */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 60px 80px 80px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "22px", marginBottom: "6px" }}>
            &gt; SYSTEMFORGE BLUEPRINT
          </h1>
          <p style={{ opacity: 0.5, fontSize: "13px" }}>
            RAW IDEA: {idea}
          </p>
        </div>

        {/* MODULE VIEW: if none selected, show grid */}
        {!activeModule ? (
          <ModuleGrid modules={MODULES} onSelect={handleModuleClick} />
        ) : (
          <ModulePanel
            module={MODULES.find(m => m.id === activeModule)}
            idea={idea}
            onBack={() => setActiveModule(null)}
          />
        )}

      </div>
    </main>
  )
}


// ─── MODULE GRID ──────────────────────────────────────────────────────────────

function ModuleGrid({ modules, onSelect }) {
  return (
    <div>
      <p style={{ opacity: 0.5, fontSize: "11px", marginBottom: "20px", letterSpacing: "0.08em" }}>
        // SELECT A MODULE TO LOAD
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "16px",
      }}>
        {modules.map(mod => (
          <ModuleCard key={mod.id} mod={mod} onClick={() => onSelect(mod)} />
        ))}
      </div>
    </div>
  )
}


// ─── MODULE CARD ──────────────────────────────────────────────────────────────

function ModuleCard({ mod, onClick }) {
  const isReady = mod.status === "READY"
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered && isReady ? "rgba(34,197,94,0.8)" : "rgba(34,197,94,0.2)"}`,
        background: hovered && isReady ? "rgba(34,197,94,0.06)" : "rgba(34,197,94,0.02)",
        padding: "20px",
        cursor: isReady ? "pointer" : "default",
        transition: "all 0.18s ease",
        opacity: isReady ? 1 : 0.45,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Code + Label */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <span style={{ fontSize: "10px", opacity: 0.5, letterSpacing: "0.1em" }}>{mod.code}</span>
        <span style={{ fontSize: "13px", letterSpacing: "0.06em", color: "rgba(34,197,94,0.95)" }}>
          {mod.label}
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: "11px", opacity: 0.7, lineHeight: "1.6", margin: 0 }}>
        {mod.description}
      </p>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: isReady ? "#22c55e" : "rgba(34,197,94,0.3)",
          display: "inline-block",
          boxShadow: isReady ? "0 0 6px #22c55e" : "none",
        }} />
        <span style={{ fontSize: "10px", opacity: 0.6, letterSpacing: "0.08em" }}>
          {mod.status}
        </span>
      </div>
    </div>
  )
}


// ─── MODULE PANEL ─────────────────────────────────────────────────────────────

function ModulePanel({ module, idea, onBack }) {
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "rgba(34,197,94,0.8)",
          padding: "6px 14px",
          fontFamily: "monospace",
          fontSize: "11px",
          cursor: "pointer",
          marginBottom: "28px",
          letterSpacing: "0.06em",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = "rgba(34,197,94,0.8)"
          e.currentTarget.style.color = "#22c55e"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"
          e.currentTarget.style.color = "rgba(34,197,94,0.8)"
        }}
      >
        &larr; BACK TO MODULES
      </button>

      {/* Module header */}
      <p style={{ opacity: 0.5, fontSize: "11px", marginBottom: "20px", letterSpacing: "0.08em" }}>
        // {module.code} — {module.label}
      </p>

      {/* Render active module content */}
      {module.id === "refinement" && idea && <IdeaRefinement rawIdea={idea} />}
    </div>
  )
}