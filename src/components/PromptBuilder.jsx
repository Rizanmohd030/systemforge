"use client"

import { useState, useEffect, useRef } from "react"
import { getCurrentContext, EVENTS, KEYS } from "@/lib/context"

// ─── COLORS (blueprint palette) ───────────────────────────────────────────────
const C = {
    white: "rgba(255,255,255,1)",
    whiteHi: "rgba(255,255,255,0.92)",
    whiteMid: "rgba(255,255,255,0.60)",
    whiteLow: "rgba(255,255,255,0.35)",
    whiteGhost: "rgba(255,255,255,0.10)",
    accent: "rgba(120,180,255,1)",
    accentMid: "rgba(120,180,255,0.55)",
    ready: "rgba(100,220,255,1)",
    warn: "rgba(255,200,80,0.9)",
    error: "rgba(255,100,100,0.9)",
    cardBg: "rgba(8,25,90,0.70)",
    cardBorder: "rgba(255,255,255,0.18)",
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PROMPTS = [
    {
        phaseName: "Phase 1: Project & Database Scaffold",
        targetAi: "Cursor Composer",
        pasteInstructions: "Open a new Composer chat (Cmd+I) and paste this to build the foundation.",
        promptText: "You are a Senior Next.js Developer.\n\n@Context: Setup the base repository for a visual app planner called SystemForge.\n@Tech_Stack: Next.js (App Router), Supabase, Tailwind CSS.\n@Initial_Instructions: Scaffold the initial folder structure, setup Tailwind, and write the initial Supabase SQL schema for a generic 'users' and 'projects' table."
    },
    {
        phaseName: "Phase 2: Core Workflows",
        targetAi: "Claude 3.5 Sonnet / ChatGPT 4o",
        pasteInstructions: "Use a reasoning model for complex logical planning before diving into code.",
        promptText: "You are a Technical Product Manager.\n\n@Context: We need to define the exact sequence of events for taking a raw user text idea and turning it into a generated UI blueprint.\n@Architecture_Rules: The process must happen strictly asynchronously via Next.js API Routes.\n@Initial_Instructions: Outline the exact 5-step API chain needed for this functionality."
    },
    {
        phaseName: "Phase 3: Frontend UI Implementation",
        targetAi: "Cursor Composer",
        pasteInstructions: "Paste this into Composer to generate the visual React components.",
        promptText: "You are an Expert Frontend Engineer.\n\n@Context: Build the main Dashboard for SystemForge.\n@Tech_Stack: ReactFlow for node diagrams, Tailwind for styling.\n@Initial_Instructions: Create a highly stylized dark-mode Dashboard layout with a sidebar and a central node editor canvas."
    }
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function PromptBuilder({ productDetails }) {
    const [prompts, setPrompts] = useState([])
    const [expandedPhase, setExpandedPhase] = useState(0)
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [currentSpec, setCurrentSpec] = useState(null)
    const [copiedContent, setCopiedContent] = useState(null)
    
    const hasRun = useRef(false)

    const handleGenerate = async (bust = false) => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        const ctx = getCurrentContext()
        const specToUse = ctx.type === "refined" ? ctx.data : productDetails
        setCurrentSpec(ctx.type === "refined" ? "REFINED" : "RAW")

        try {
            const res = await fetch("/api/langchain/prompt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productDetails: specToUse }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch prompts")
            
            const data = await res.json()
            
            setPrompts(data)
            localStorage.setItem(KEYS.CACHE_PROMPT, JSON.stringify(data))
            setExpandedPhase(0)
        } catch (err) {
            console.error("Prompt generation failed:", err)
            setPrompts(MOCK_PROMPTS)
            setIsMock(true)
            setError("Failed to generate master prompts. Falling back to simulated phases.")
        } finally {
            setIsLoading(false)
        }
    }

    const checkCache = () => {
        const cached = localStorage.getItem(KEYS.CACHE_PROMPT)
        if (cached) {
            try {
                const data = JSON.parse(cached)
                setPrompts(data)
                return true
            } catch (e) {
                return false
            }
        }
        return false
    }

    // Run on initial load and when product spec changes via events
    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true
            const hasCache = checkCache()
            if (!hasCache) handleGenerate()
        }

        const onUpdate = () => {
            localStorage.removeItem(KEYS.CACHE_PROMPT)
            handleGenerate(true)
        }
        window.addEventListener(EVENTS.UPDATED, onUpdate)
        return () => window.removeEventListener(EVENTS.UPDATED, onUpdate)
    }, [])

    const copyToClipboard = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedContent(id)
            setTimeout(() => setCopiedContent(null), 2000)
        } catch (err) {
            console.error("Failed to copy", err)
        }
    }

    return (
        <section style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "monospace", color: C.whiteHi }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <p style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.1em", margin: 0 }}>{"// SYNTHESIS ENGINE"}</p>
                    <h3 style={{ fontSize: "16px", color: C.white, margin: "4px 0 0 0" }}>SEGREGATED PROMPTS</h3>
                </div>
                
                <button 
                    onClick={() => handleGenerate(true)}
                    disabled={isLoading}
                    style={{
                        background: "rgba(20,60,160,0.6)", border: `1px solid ${C.whiteLow}`,
                        color: C.white, padding: "6px 12px", fontSize: "10px",
                        cursor: isLoading ? "not-allowed" : "pointer", letterSpacing: "0.05em"
                    }}
                >
                    {isLoading ? "[ GENERATING... ]" : "[ RE-GENERATE ]"}
                </button>
            </div>

            {isMock && <p style={{ fontSize: "10px", color: C.warn, margin: "-10px 0 0 0", textAlign: "right" }}>⚠ SIMULATED DATA DUE TO AI UNAVAILABILITY</p>}

            {error && (
                <div style={{ color: C.error, fontSize: "12px", background: "rgba(255,100,100,0.1)", padding: "10px 20px", border: `1px solid ${C.error}` }}>
                    {error}
                </div>
            )}

            {isLoading && prompts.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: C.accentMid, border: `1px solid ${C.cardBorder}`, background: C.cardBg }}>
                    <p style={{ letterSpacing: "0.2em", animation: "pulse 1.5s infinite" }}>&gt; SYNTHESIZING ARCHITECTURAL PHASES...</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {prompts.map((phase, index) => {
                        const isExpanded = expandedPhase === index;
                        return (
                            <div key={index} style={{
                                border: `1px solid ${isExpanded ? C.ready : C.cardBorder}`,
                                background: isExpanded ? "rgba(20,60,160,0.15)" : C.cardBg,
                                transition: "all 0.2s ease"
                            }}>
                                {/* Header Toggle */}
                                <div 
                                    onClick={() => setExpandedPhase(isExpanded ? null : index)}
                                    style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                >
                                    <div>
                                        <p style={{ fontSize: "10px", color: isExpanded ? C.ready : C.whiteLow, margin: "0 0 4px 0", letterSpacing: "0.1em" }}>PHASE 0{index + 1}</p>
                                        <h4 style={{ fontSize: "15px", color: C.white, margin: 0 }}>{phase.title}</h4>
                                    </div>
                                    <div style={{ color: C.whiteLow, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                                        ▼
                                    </div>
                                </div>

                                {/* Body */}
                                {isExpanded && (
                                    <div style={{ padding: "0 20px 20px 20px", borderTop: `1px solid ${C.whiteGhost}` }}>
                                        
                                        {/* Guide Text */}
                                        <div style={{ display: "flex", gap: "16px", marginTop: "16px", marginBottom: "16px" }}>
                                            <div style={{ flex: 1, background: "rgba(0,0,0,0.4)", padding: "12px", border: `1px dotted ${C.whiteGhost}` }}>
                                                <p style={{ fontSize: "9px", color: C.accentMid, margin: "0 0 4px 0", letterSpacing: "0.1em" }}>TARGET IDE / AI</p>
                                                <p style={{ fontSize: "12px", color: C.whiteHi, margin: 0 }}>{phase.aiTarget}</p>
                                            </div>
                                            <div style={{ flex: 2, background: "rgba(0,0,0,0.4)", padding: "12px", border: `1px dotted ${C.whiteGhost}` }}>
                                                <p style={{ fontSize: "9px", color: C.accentMid, margin: "0 0 4px 0", letterSpacing: "0.1em" }}>INSTRUCTIONS</p>
                                                <p style={{ fontSize: "12px", color: C.whiteHi, margin: 0 }}>{phase.instructions}</p>
                                            </div>
                                        </div>

                                        {/* Code Viewport */}
                                        <div style={{ position: "relative" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,0.6)", border: `1px solid ${C.whiteGhost}`, borderBottom: "none" }}>
                                                <p style={{ margin: 0, fontSize: "10px", color: C.whiteLow, letterSpacing: "0.1em" }}>
                                                    prompt_segment.md
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(phase.prompt, `phase-${index}`); }}
                                                    style={{
                                                        background: copiedContent === `phase-${index}` ? "rgba(100,220,255,0.15)" : "rgba(255,255,255,0.05)",
                                                        border: `1px solid ${copiedContent === `phase-${index}` ? C.ready : C.whiteLow}`,
                                                        color: copiedContent === `phase-${index}` ? C.ready : C.white,
                                                        padding: "4px 12px", fontSize: "10px", cursor: "pointer",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                >
                                                    {copiedContent === `phase-${index}` ? "COPIED TO CLIPBOARD!" : "COPY PROMPT"}
                                                </button>
                                            </div>
                                            <textarea
                                                value={phase.prompt}
                                                readOnly
                                                style={{
                                                    width: "100%", height: "250px", resize: "vertical",
                                                    background: "black", color: C.whiteHi, border: `1px solid ${C.whiteGhost}`, outline: "none",
                                                    padding: "16px", fontSize: "12px", lineHeight: "1.6", fontFamily: "monospace",
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
            `}</style>
        </section>
    )
}
