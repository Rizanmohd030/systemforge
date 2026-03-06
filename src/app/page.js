"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const BOOT_LINES = [
  "> INITIALIZING SYSTEMFORGE...",
  "> LOADING AI MODULES...",
  "> PREPARING BLUEPRINT ENGINE...",
  "> SYSTEM READY.",
]

const EXAMPLES = [
  "AI Resume Analyzer for students",
  "SaaS Project Management Platform",
  "AI Customer Support Chatbot",
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()

  // ── Boot sequence state ───────────────────────────────────────────────────
  const [bootLines, setBootLines] = useState([])
  const [currentLine, setCurrentLine] = useState("")
  const [bootIndex, setBootIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [bootComplete, setBootComplete] = useState(false)

  // ── Input state ───────────────────────────────────────────────────────────
  const [idea, setIdea] = useState("")
  const [cursorPos, setCursorPos] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const inputRef = useRef(null)
  const beforeRef = useRef(null)
  const afterRef = useRef(null)


  // ── BOOT ANIMATION ────────────────────────────────────────────────────────
  useEffect(() => {
    if (bootIndex >= BOOT_LINES.length) {
      setBootComplete(true)
      return
    }
    const line = BOOT_LINES[bootIndex]
    if (charIndex < line.length) {
      const t = setTimeout(() => {
        setCurrentLine(prev => prev + line[charIndex])
        setCharIndex(prev => prev + 1)
      }, 28)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setBootLines(prev => [...prev, currentLine])
        setCurrentLine("")
        setCharIndex(0)
        setBootIndex(prev => prev + 1)
      }, 180)
      return () => clearTimeout(t)
    }
  }, [charIndex, bootIndex])


  // ── AUTO-FOCUS after boot ─────────────────────────────────────────────────
  useEffect(() => {
    if (bootComplete && inputRef.current) {
      inputRef.current.focus()
    }
  }, [bootComplete])


  // ── SYNC VALUE + CURSOR ───────────────────────────────────────────────────
  const syncFromInput = () => {
    const el = inputRef.current
    if (!el) return
    setIdea(el.value)
    setCursorPos(el.selectionStart ?? el.value.length)
  }


  // ── ENTER KEY ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = inputRef.current?.value?.trim()
      if (!value || isSubmitting) return
      localStorage.setItem("systemforge_idea", value)
      setIsSubmitting(true)
      setTimeout(() => router.push("/blueprint"), 1200)
      return
    }
    setTimeout(syncFromInput, 0)
  }


  // ── CLICK-TO-POSITION ─────────────────────────────────────────────────────
  const handleTextClick = (e) => {
    e.stopPropagation()
    let clickNode = null, clickOffset = 0
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (r) { clickNode = r.startContainer; clickOffset = r.startOffset }
    } else if (document.caretPositionFromPoint) {
      const cp = document.caretPositionFromPoint(e.clientX, e.clientY)
      if (cp) { clickNode = cp.offsetNode; clickOffset = cp.offset }
    }
    let pos = idea.length
    if (clickNode) {
      if (beforeRef.current?.contains(clickNode)) pos = clickOffset
      else if (afterRef.current?.contains(clickNode)) pos = cursorPos + clickOffset
    }
    const el = inputRef.current
    if (el) { el.focus(); el.setSelectionRange(pos, pos); setTimeout(syncFromInput, 0) }
  }

  const handleTerminalClick = () => {
    inputRef.current?.focus()
    setTimeout(syncFromInput, 0)
  }

  // ── EXAMPLE FILL ─────────────────────────────────────────────────────────
  const fillExample = (text) => {
    const el = inputRef.current
    if (!el) return
    el.value = text
    el.focus()
    el.setSelectionRange(text.length, text.length)
    syncFromInput()
  }

  const before = idea.slice(0, cursorPos)
  const after = idea.slice(cursorPos)


  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <main
      className="h-screen bg-black flex items-center justify-center font-mono text-green-400"
      onClick={handleTerminalClick}
    >

      {/* ── HIDDEN NATIVE INPUT ─────────────────────────────────────────────── */}
      <input
        ref={inputRef}
        value={idea}
        onChange={syncFromInput}
        onKeyDown={handleKeyDown}
        onKeyUp={syncFromInput}
        onClick={syncFromInput}
        onSelect={syncFromInput}
        disabled={isSubmitting}
        style={{ position: "fixed", opacity: 0, pointerEvents: "none", width: 0, height: 0, border: "none", outline: "none", padding: 0 }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />

      {/* ── OUTER WRAPPER: terminal left + guide panel right ─────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", width: "min(1100px, 96vw)" }}>

        {/* ══ TERMINAL WINDOW ════════════════════════════════════════════════ */}
        <div className="terminal-window" style={{ flex: "1" }}>

          {/* Traffic-light header */}
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="btn red" />
              <span className="btn yellow" />
              <span className="btn green" />
            </div>
            <span className="terminal-title">bash — systemforge</span>
          </div>

          <div className="terminal-body">

            {/* Boot lines */}
            {bootLines.map((line, i) => <p key={i}>{line}</p>)}
            {currentLine && <p>{currentLine}</p>}

            {/* Input prompt — shown after boot */}
            {bootComplete && !isSubmitting && (
              <>
                <p className="mt-4 opacity-90 text-sm">
                  Describe the system you want to build. Press{" "}
                  <span className="text-green-400 opacity-100">Enter</span> to generate.
                </p>

                <div className="terminal-input-line">
                  <span className="prompt" style={{ whiteSpace: "nowrap" }}>
                    user@systemforge:~&nbsp;
                  </span>
                  <span className="terminal-text" onClick={handleTextClick} style={{ cursor: "text" }}>
                    <span ref={beforeRef}>{before}</span>
                    <span className="terminal-cursor" />
                    <span ref={afterRef}>{after}</span>
                  </span>
                </div>
              </>
            )}

            {/* Submission transition */}
            {isSubmitting && (
              <>
                <p className="mt-4 text-green-300">&gt; ANALYZING IDEA...</p>
                <p className="text-green-300">&gt; LOADING BLUEPRINT WORKSPACE...</p>
                <span className="terminal-cursor" style={{ marginTop: 8, display: "inline-block" }} />
              </>
            )}

          </div>
        </div>

        {/* ══ GUIDANCE PANEL (outside the terminal) ══════════════════════════ */}
        {bootComplete && !isSubmitting && (
          <GuidancePanel onSelect={fillExample} />
        )}

      </div>
    </main>
  )
}


// ─── GUIDANCE PANEL ───────────────────────────────────────────────────────────
// Separate box outside the terminal — shows product description,
// prompt tips, and quick-fill example buttons.

function GuidancePanel({ onSelect }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        width: "260px",
        flexShrink: 0,
        border: "1px solid rgba(34,197,94,0.2)",
        background: "rgba(0,255,80,0.03)",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "rgba(34,197,94,0.95)",
      }}
    >
      {/* Product description */}
      <div>
        <p style={{ opacity: 0.7, fontSize: "10px", marginBottom: "6px", letterSpacing: "0.08em" }}>
          // ABOUT
        </p>
        <p style={{ lineHeight: "1.6", opacity: 0.9 }}>
          SystemForge converts your idea into a complete system blueprint — architecture, tech stack, and a build guide.
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(34,197,94,0.15)" }} />

      {/* Prompt guidance */}
      <div>
        <p style={{ opacity: 0.75, fontSize: "10px", marginBottom: "8px", letterSpacing: "0.08em" }}>
          // DESCRIBE YOUR SYSTEM CLEARLY
        </p>
        <p style={{ opacity: 0.85, marginBottom: "6px" }}>Good prompts include:</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px", opacity: 0.8 }}>
          <li>• What the system does</li>
          <li>• Who the users are</li>
          <li>• Key features</li>
        </ul>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(34,197,94,0.15)" }} />

      {/* Example buttons */}
      <div>
        <p style={{ opacity: 0.75, fontSize: "10px", marginBottom: "8px", letterSpacing: "0.08em" }}>
          // QUICK EXAMPLES
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => onSelect(ex)}
              style={{
                background: "transparent",
                border: "1px solid rgba(34,197,94,0.5)",
                color: "rgba(34,197,94,0.85)",
                padding: "6px 10px",
                fontSize: "11px",
                fontFamily: "monospace",
                cursor: "pointer",
                textAlign: "left",
                lineHeight: "1.4",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(34,197,94,1)"
                e.currentTarget.style.color = "rgba(34,197,94,1)"
                e.currentTarget.style.background = "rgba(34,197,94,0.08)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(34,197,94,0.5)"
                e.currentTarget.style.color = "rgba(34,197,94,0.85)"
                e.currentTarget.style.background = "transparent"
              }}
            >
              [ {ex} ]
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}