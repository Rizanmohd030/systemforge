"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectStore } from "@/store/projectStore"

// ─── COLORS (blueprint palette) ───────────────────────────────────────────────
const C = {
    white: "rgba(255,255,255,1)",
    whiteHi: "rgba(255,255,255,0.92)",
    whiteMid: "rgba(255,255,255,0.60)",
    whiteLow: "rgba(255,255,255,0.35)",
    whiteGhost: "rgba(255,255,255,0.10)",
    accent: "rgba(120,180,255,1)",
    accentMid: "rgba(120,180,255,0.55)",
    accentLow: "rgba(120,180,255,0.20)",
    ready: "rgba(100,220,255,1)",
    warn: "rgba(255,200,80,0.9)",
    error: "rgba(255,100,100,0.9)",
    cardBg: "rgba(8,25,90,0.70)",
    cardBorder: "rgba(255,255,255,0.18)",
}

// ─── MOCK ─────────────────────────────────────────────────────────────────────
const MOCK_RESULT = (idea) => ({
    productName: idea.split(" ").slice(0, 3).join("") + "App",
    description: `A platform that helps users with: ${idea}. Built for speed and simplicity.`,
    targetUsers: ["Developers", "Power Users", "Small Teams"],
    coreFeatures: ["User Auth", "Dashboard", "API Integration", "Analytics", "Export", "Notifications"],
    architectAdvice: [
        { path: "Speed to Market", impact: "Focues on pre-built templates and BaaS like Supabase.", branchType: "SPEED" },
        { path: "High Scale", impact: "Requires custom microservices and horizontal scaling strategy.", branchType: "SCALE" }
    ]
})

// ─── MODULE INFO ──────────────────────────────────────────────────────────────
const MODULE_INFO = {
    description: "Takes your raw idea and uses AI to produce a clean, structured product concept — ready to build from.",
    features: [
        { label: "Product Name", detail: "A sharp, memorable name for your system" },
        { label: "Description", detail: "1–2 sentence summary of what it does and why" },
        { label: "Target Users", detail: "Who actually uses this — roles and personas" },
        { label: "Core Features", detail: "4–6 key features that define the MVP" },
    ],
    howTo: "Submit your idea on the home screen. Use the feedback box below to guide the AI and regenerate as many times as needed.",
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function IdeaRefinement({ rawIdea: propRawIdea }) {
    const { idea: globalIdea, refinement: globalRefinement, setRefinement, setProcessing } = useProjectStore()
    const rawIdea = propRawIdea || globalIdea || "A custom software project"

    const [refined, setRefinedLocal] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [feedback, setFeedback] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [iteration, setIteration] = useState(0)
    const [isSaved, setIsSaved] = useState(false)
    const [history, setHistory] = useState([]) // Conversation memory
    const hasRun = useRef(false)

    useEffect(() => {
        if (globalRefinement) {
            setIsSaved(true)
            setRefinedLocal(globalRefinement)
        }
        if (hasRun.current) return
        hasRun.current = true
        if (rawIdea && !globalRefinement) handleRefine()
    }, [])

    const handleRefine = async (feedbackText = "") => {
        setIsLoading(true)
        setError("")
        setIsMock(false)
        
        try {
            const input = feedbackText ? feedbackText : rawIdea
            const res = await fetch("/api/langchain/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawIdea: input, history }),
            })
            
            if (!res.ok) throw new Error("Refinement failed")
            
            const data = await res.json()
            setRefinedLocal(data)
            
            // Update history for memory
            setHistory(prev => [
                ...prev,
                { role: "user", content: input },
                { role: "assistant", content: JSON.stringify(data) }
            ])
            
            setIteration(prev => prev + 1)
        } catch (err) {
            console.error("Refine error:", err)
            setError("Communication failure with Architect Brain.")
            setRefinedLocal(MOCK_RESULT(rawIdea))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = () => {
        if (!refined) return
        setRefinement(refined)
        setIsSaved(true)
    }

    const handleFeedbackSubmit = () => {
        if (!feedback.trim() || isLoading) return
        handleRefine(feedback, true)
        setFeedback("")
    }

    return (
        <section style={{ fontFamily: "monospace", color: C.whiteHi }}>

            {/* ── MODULE INFO ──────────────────────────────────────────────────── */}
            <div style={{
                border: `1px solid ${C.cardBorder}`,
                background: C.cardBg,
                padding: "20px 24px",
                marginBottom: "28px",
                backdropFilter: "blur(6px)",
            }}>
                <p style={{ fontSize: "10px", color: C.whiteLow, marginBottom: "10px", letterSpacing: "0.1em" }}>
          // ABOUT THIS MODULE
                </p>
                <p style={{ fontSize: "13px", color: C.whiteMid, lineHeight: "1.7", marginBottom: "18px" }}>
                    {MODULE_INFO.description}
                </p>

                {/* Feature grid */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: "10px",
                    marginBottom: "18px",
                }}>
                    {MODULE_INFO.features.map((f, i) => (
                        <div key={i} style={{ borderLeft: `2px solid ${C.accentMid}`, paddingLeft: "10px" }}>
                            <p style={{ fontSize: "11px", color: C.whiteHi, marginBottom: "2px" }}>{f.label}</p>
                            <p style={{ fontSize: "10px", color: C.whiteLow, lineHeight: "1.4" }}>{f.detail}</p>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: "11px", color: C.whiteLow, lineHeight: "1.6", borderTop: `1px solid ${C.whiteGhost}`, paddingTop: "12px" }}>
                    ↳ {MODULE_INFO.howTo}
                </p>
            </div>

            {/* ── LOADING ──────────────────────────────────────────────────────── */}
            {isLoading && (
                <div style={{ color: C.accentMid }}>
                    <p>&gt; {iteration > 0 ? "Regenerating with feedback..." : "Analyzing idea..."}</p>
                    <p>&gt; Generating refined concept...</p>
                    <span style={{
                        display: "inline-block", width: 8, height: 14,
                        background: C.accent, marginTop: 8,
                        animation: "bp-dot 1s steps(2,start) infinite",
                    }} />
                </div>
            )}

            {/* ── ERROR ────────────────────────────────────────────────────────── */}
            {error && <p style={{ color: C.error }}>{error}</p>}

            {/* ── QUOTA WARNING ────────────────────────────────────────────────── */}
            {isMock && (
                <p style={{ color: C.warn, fontSize: "11px", marginBottom: "12px" }}>
                    ⚠ QUOTA EXCEEDED — showing mock result. Try again later or upgrade your plan.
                </p>
            )}

            {/* ── RESULTS ──────────────────────────────────────────────────────── */}
            {refined && !isLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4px" }}>
                        <div>
                            {iteration > 1 && (
                                <p style={{ fontSize: "10px", color: C.whiteLow, letterSpacing: "0.06em", marginBottom: "4px" }}>
                                    // ITERATION {iteration} — REFINED WITH FEEDBACK
                                </p>
                            )}
                            <p style={{ fontSize: "10px", color: isSaved ? C.ready : C.accent, letterSpacing: "0.1em", fontWeight: "bold", margin: 0 }}>
                                {isSaved ? "✓ CONCEPT SAVED TO BLUEPRINT" : "// CONCEPT READY FOR BLUEPRINT"}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaved || isLoading}
                            style={{
                                background: isSaved ? "rgba(100,220,255,0.1)" : "rgba(100,220,255,0.25)",
                                border: `1px solid ${isSaved ? C.ready : "rgba(255,255,255,0.4)"}`,
                                color: isSaved ? C.ready : C.white,
                                padding: "6px 14px",
                                fontSize: "11px",
                                cursor: isSaved ? "default" : "pointer",
                                fontFamily: "monospace",
                                letterSpacing: "0.05em",
                                transition: "all 0.15s",
                            }}
                        >
                            {isSaved ? "[ SAVED ]" : "[ SAVE CONCEPT ]"}
                        </button>
                    </div>

                    <ResultCard label="PRODUCT NAME" value={refined.productName} />
                    <ResultCard label="DESCRIPTION" value={refined.description} />
                    <ResultCard label="TARGET USERS" value={refined.targetUsers} isList />
                    <ResultCard label="CORE FEATURES" value={refined.coreFeatures} isList />

                    {/* ── ARCHITECT BRANCHES ───────────────────────────────────── */}
                    {refined.architectAdvice && (
                        <div style={{ marginTop: "10px" }}>
                            <p style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.15em", marginBottom: "12px" }}>
                                // ARCHITECT'S ADVICE: CHOOSE YOUR PATH
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                {refined.architectAdvice.map((advice, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setFeedback(`I choose the ${advice.path} direction. ${advice.impact}`)}
                                        style={{
                                            border: `1px solid ${C.accentLow}`,
                                            background: "rgba(120,180,255,0.05)",
                                            padding: "12px",
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,255,0.15)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(120,180,255,0.05)"}
                                    >
                                        <p style={{ fontSize: "11px", color: C.ready, marginBottom: "4px", fontWeight: "bold" }}>↳ {advice.path}</p>
                                        <p style={{ fontSize: "10px", color: C.whiteMid, lineHeight: "1.4", margin: 0 }}>{advice.impact}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── FEEDBACK + REGENERATE ─────────────────────────────────── */}
                    <div style={{
                        marginTop: "8px",
                        border: `1px solid ${C.cardBorder}`,
                        padding: "16px",
                        background: C.cardBg,
                        backdropFilter: "blur(6px)",
                    }}>
                        <p style={{ fontSize: "10px", color: C.whiteLow, marginBottom: "10px", letterSpacing: "0.08em" }}>
              // FEEDBACK & REGENERATE
                        </p>
                        <p style={{ fontSize: "12px", color: C.whiteMid, marginBottom: "10px" }}>
                            Not quite right? Tell the AI what to change:
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <input
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleFeedbackSubmit()}
                                placeholder="e.g. Focus only on B2B, remove consumer features"
                                style={{
                                    flex: 1,
                                    minWidth: "200px",
                                    background: "rgba(8,25,90,0.5)",
                                    border: `1px solid ${feedback.trim() ? "rgba(255,255,255,0.45)" : C.cardBorder}`,
                                    color: C.whiteHi,
                                    padding: "9px 12px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    outline: "none",
                                    transition: "border 0.15s",
                                }}
                            />
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={isLoading || !feedback.trim()}
                                style={{
                                    border: `1px solid ${feedback.trim() ? "rgba(255,255,255,0.6)" : C.cardBorder}`,
                                    background: feedback.trim() ? "rgba(20,60,160,0.6)" : "transparent",
                                    color: feedback.trim() ? C.white : C.whiteLow,
                                    padding: "9px 18px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    cursor: feedback.trim() ? "pointer" : "default",
                                    transition: "all 0.15s",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                [ REGENERATE ]
                            </button>
                        </div>
                        <p style={{ fontSize: "10px", color: C.whiteLow, marginTop: "8px" }}>
                            ↳ Press Enter or click REGENERATE. Each run calls the AI fresh.
                        </p>
                    </div>

                </div>
            )}
        </section>
    )
}

// ─── RESULT CARD ──────────────────────────────────────────────────────────────
function ResultCard({ label, value, isList = false }) {
    return (
        <div style={{
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "14px 16px",
            background: "rgba(8,25,90,0.55)",
            backdropFilter: "blur(4px)",
        }}>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                {label}
            </p>
            {isList ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    {value.map((item, i) => (
                        <li key={i} style={{ fontSize: "13px", color: "rgba(255,255,255,0.88)" }}>• {item}</li>
                    ))}
                </ul>
            ) : (
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.88)", lineHeight: "1.5" }}>{value}</p>
            )}
        </div>
    )
}
