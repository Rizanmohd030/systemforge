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
    darkBg: "rgba(4,12,45,1)",
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
        if (hasRun.current) {
            return
        }
        hasRun.current = true
        if (rawIdea && !globalRefinement) {
            handleRefine()
        }
    }, [])

    const handleRefine = async (feedbackText = "", retries = 0) => {
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
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || `Request failed (${res.status})`)
            }
            
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
            // Check for rate limit and retry
            const isRateLimit = err.message?.includes("429") || err.message?.includes("rate limit")
            if (isRateLimit && retries < 2) {
                setError("Rate limit hit. Retrying in 2 seconds...")
                setIsLoading(false)
                setTimeout(() => {
                    handleRefine(feedbackText, retries + 1)
                }, 2000)
                return
            }
            
            // Provide helpful error messages
            let errorMsg = "Unable to refine your idea. ";
            if (isRateLimit) {
                errorMsg += "Rate limit reached. Please wait and try again.";
            } else if (err.message?.includes("401")) {
                errorMsg += "Authentication failed. Please contact support.";
            } else if (err.message?.includes("504")) {
                errorMsg += "Request timed out. Try again in a moment.";
            } else {
                errorMsg += "Please try again.";
            }
            
            setError(errorMsg)
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
        handleRefine(feedback, 0)
        setFeedback("")
    }

    return (
        <section style={{
            fontFamily: "monospace",
            color: C.whiteHi,
            background: C.darkBg,
            minHeight: "100vh",
            padding: "40px 60px",
            display: "flex",
            flexDirection: "column",
            gap: "40px",
        }}>
            {/* ─── LOADING STATE ─────────────────────────────────────────────────── */}
            {isLoading && !refined ? (
                <div style={{ textAlign: "center", paddingTop: "100px" }}>
                    <p style={{ fontSize: "16px", color: C.accentMid, letterSpacing: "0.2em", marginBottom: "20px" }}>
                        {iteration > 0 ? "REGENERATING CONCEPT..." : "ANALYZING YOUR IDEA..."}
                    </p>
                    <div style={{
                        width: "300px",
                        height: "4px",
                        background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`,
                        margin: "0 auto",
                        animation: "pulse 1.5s infinite"
                    }} />
                </div>
            ) : refined ? (
                <>
                    {/* ────── HEADER ────────────────────────────────────────────────── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "40px" }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "12px", color: C.whiteLow, letterSpacing: "0.15em", marginBottom: "8px" }}>
                                REFINED CONCEPT
                            </p>
                            <h1 style={{ fontSize: "48px", color: C.white, margin: "0 0 20px 0", fontWeight: "700" }}>
                                {refined.productName}
                            </h1>
                            <p style={{ fontSize: "16px", color: C.whiteMid, lineHeight: "1.7", maxWidth: "600px" }}>
                                {refined.description}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
                            <button
                                onClick={() => handleRefine("", 0)}
                                disabled={isLoading}
                                style={{
                                    background: "rgba(120,180,255,0.2)",
                                    border: `1px solid ${C.accent}`,
                                    color: C.accent,
                                    padding: "12px 16px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    fontFamily: "monospace",
                                    letterSpacing: "0.05em",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(120,180,255,0.35)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(120,180,255,0.2)"}
                                title="Generate a new product name"
                            >
                                🔄 REFRESH NAME
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaved || isLoading}
                                style={{
                                    background: isSaved ? "rgba(100,220,255,0.15)" : "rgba(100,220,255,0.35)",
                                    border: `1px solid ${isSaved ? C.ready : C.accent}`,
                                    color: isSaved ? C.ready : C.white,
                                    padding: "12px 16px",
                                    fontSize: "12px",
                                    cursor: isSaved ? "default" : "pointer",
                                    fontFamily: "monospace",
                                    letterSpacing: "0.05em",
                                    transition: "all 0.2s",
                                }}
                            >
                                {isSaved ? "✓ SAVED" : "[ SAVE CONCEPT ]"}
                            </button>
                        </div>
                    </div>

                    {/* ────── TWO COLUMN LAYOUT ─────────────────────────────────────── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
                        
                        {/* LEFT: TARGET USERS & FEATURES */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                            
                            {/* TARGET USERS */}
                            <div>
                                <p style={{ fontSize: "11px", color: C.whiteLow, letterSpacing: "0.15em", marginBottom: "16px", textTransform: "uppercase" }}>
                                    Who uses this
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {refined.targetUsers?.map((user, i) => (
                                        <div key={i} style={{
                                            borderLeft: `3px solid ${C.accent}`,
                                            paddingLeft: "20px",
                                            paddingTop: "8px",
                                            paddingBottom: "8px",
                                        }}>
                                            <p style={{ fontSize: "16px", color: C.white, margin: 0, fontWeight: "500" }}>{user}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CORE FEATURES */}
                            <div>
                                <p style={{ fontSize: "11px", color: C.whiteLow, letterSpacing: "0.15em", marginBottom: "16px", textTransform: "uppercase" }}>
                                    Core features
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {refined.coreFeatures?.map((feature, i) => (
                                        <div key={i} style={{
                                            borderLeft: `3px solid ${C.ready}`,
                                            paddingLeft: "20px",
                                            paddingTop: "8px",
                                            paddingBottom: "8px",
                                        }}>
                                            <p style={{ fontSize: "16px", color: C.white, margin: 0, fontWeight: "500" }}>{feature}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: STRATEGIC PATHS */}
                        <div>
                            <p style={{ fontSize: "11px", color: C.whiteLow, letterSpacing: "0.15em", marginBottom: "24px", textTransform: "uppercase" }}>
                                Strategic approaches
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {refined.architectAdvice?.map((advice, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setFeedback(`Focus on ${advice.path}. ${advice.impact}`)}
                                        style={{
                                            background: "rgba(8,25,90,0.7)",
                                            border: `2px solid ${C.accentMid}`,
                                            padding: "24px",
                                            cursor: "pointer",
                                            transition: "all 0.3s",
                                            borderRadius: "4px",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = "rgba(20,60,160,0.5)"
                                            e.currentTarget.style.borderColor = C.ready
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = "rgba(8,25,90,0.7)"
                                            e.currentTarget.style.borderColor = C.accentMid
                                        }}
                                    >
                                        <p style={{ fontSize: "14px", color: C.ready, marginBottom: "12px", fontWeight: "bold", letterSpacing: "0.05em" }}>
                                            {advice.path}
                                        </p>
                                        <p style={{ fontSize: "13px", color: C.whiteMid, lineHeight: "1.6", margin: 0 }}>
                                            {advice.impact}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ────── FEEDBACK SECTION ──────────────────────────────────────── */}
                    <div style={{ marginTop: "20px" }}>
                        <p style={{ fontSize: "11px", color: C.whiteLow, letterSpacing: "0.15em", marginBottom: "20px", textTransform: "uppercase" }}>
                            Refine further
                        </p>
                        <div style={{ display: "flex", gap: "12px" }}>
                            <input
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleFeedbackSubmit()}
                                placeholder="e.g., Focus only on B2B, remove consumer features..."
                                style={{
                                    flex: 1,
                                    background: "rgba(255,255,255,0.04)",
                                    border: `1px solid ${feedback.trim() ? C.accent : C.cardBorder}`,
                                    color: C.white,
                                    padding: "14px 16px",
                                    fontFamily: "monospace",
                                    fontSize: "13px",
                                    outline: "none",
                                    transition: "all 0.2s",
                                }}
                            />
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={isLoading || !feedback.trim()}
                                style={{
                                    border: `1px solid ${feedback.trim() ? C.accent : C.cardBorder}`,
                                    background: feedback.trim() ? "rgba(120,180,255,0.25)" : "transparent",
                                    color: feedback.trim() ? C.white : C.whiteLow,
                                    padding: "14px 24px",
                                    fontFamily: "monospace",
                                    fontSize: "13px",
                                    cursor: feedback.trim() ? "pointer" : "default",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                [ REGENERATE ]
                            </button>
                        </div>
                    </div>

                    {/* ────── STATUS & ERROR ────────────────────────────────────────── */}
                    {isMock && (
                        <p style={{ color: C.warn, fontSize: "11px", marginTop: "20px", letterSpacing: "0.05em" }}>
                            ⚠ Using simulated data. Upgrade your plan or try again later.
                        </p>
                    )}
                    {error && (
                        <p style={{ color: C.error, fontSize: "11px", marginTop: "20px", letterSpacing: "0.05em" }}>
                            ✕ {error}
                        </p>
                    )}
                </>
            ) : null}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
            `}</style>
        </section>
    )
}
