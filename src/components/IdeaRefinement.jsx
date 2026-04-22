"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectStore } from "@/store/projectStore"
import WorkspaceLayout from "@/components/WorkspaceLayout"

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
                padding: "60px 80px",
                display: "flex",
                flexDirection: "column",
                gap: "60px",
                position: "relative",
                zIndex: 5,
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
                    {/* ────── TOP ROW: 2 CARDS ────────────────────────────────────────── */}
                    <div style={{
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "center",
                        gap: "40px",
                        width: "100%",
                    }}>

                        {/* CARD 1: PRODUCT NAME WITH REFRESH ICON */}
                        <div style={{
                            flex: "0 0 550px",
                            background: "rgba(255,255,255,0.015)",
                            border: `1px solid ${C.cardBorder}`,
                            padding: "32px 28px",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            position: "relative",
                            zIndex: 10,
                            backdropFilter: "blur(4px)",
                            height: "200px",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px" }}>
                                <p style={{ fontSize: "11px", color: C.ready, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, fontWeight: "600" }}>
                                    📌 PRODUCT NAME
                                </p>
                                <button
                                    onClick={() => handleRefine("", 0)}
                                    disabled={isLoading}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: C.accent,
                                        padding: "4px 8px",
                                        fontSize: "16px",
                                        cursor: isLoading ? "wait" : "pointer",
                                        transition: "all 0.3s",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = "rotate(180deg)"}
                                    onMouseLeave={e => e.currentTarget.style.transform = "rotate(0deg)"}
                                    title="Refresh concept"
                                >
                                    🔄
                                </button>
                            </div>
                            <div>
                                <h2 style={{ fontSize: "24px", color: C.white, margin: "0 0 12px 0", fontWeight: "700", letterSpacing: "0.02em" }}>
                                    {refined.productName}
                                </h2>
                                <p style={{ fontSize: "13px", color: C.whiteMid, lineHeight: "1.6", margin: 0 }}>
                                    {refined.description}
                                </p>
                            </div>
                        </div>

                        {/* CARD 2: STRATEGIC APPROACHES + SAVE */}
                        <div style={{
                            flex: "0 0 320px",
                            background: "rgba(255,255,255,0.015)",
                            border: `1px solid ${C.cardBorder}`,
                            padding: "32px 28px",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            position: "relative",
                            zIndex: 10,
                            backdropFilter: "blur(4px)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                                <p style={{ fontSize: "11px", color: C.ready, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, fontWeight: "600" }}>
                                    🎯 APPROACHES
                                </p>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaved || isLoading}
                                    style={{
                                        background: isSaved ? "rgba(100,220,255,0.15)" : "rgba(100,220,255,0.35)",
                                        border: `1px solid ${isSaved ? C.ready : C.accent}`,
                                        color: isSaved ? C.ready : C.white,
                                        padding: "6px 12px",
                                        fontSize: "9px",
                                        cursor: isSaved ? "default" : "pointer",
                                        fontFamily: "monospace",
                                        letterSpacing: "0.05em",
                                        transition: "all 0.2s",
                                        borderRadius: "4px",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {isSaved ? "✓ SAVED" : "[ SAVE ]"}
                                </button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {refined.architectAdvice?.slice(0, 2).map((advice, i) => (
                                    <div key={i} onClick={() => setFeedback(`Focus on ${advice.path}. ${advice.impact}`)} style={{
                                        background: "rgba(255,255,255,0.015)",
                                        border: `1px solid ${C.accentMid}`,
                                        padding: "12px",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        borderRadius: "4px",
                                        backdropFilter: "blur(4px)",
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = C.ready
                                        e.currentTarget.style.background = "rgba(20,60,160,0.3)"
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = C.accentMid
                                        e.currentTarget.style.background = "transparent"
                                    }}
                                    >
                                        <p style={{ fontSize: "10px", color: C.ready, margin: "0 0 4px 0", fontWeight: "bold", letterSpacing: "0.05em" }}>
                                            {advice.path}
                                        </p>
                                        <p style={{ fontSize: "10px", color: C.whiteMid, margin: 0, lineHeight: "1.4" }}>
                                            {advice.impact.substring(0, 60)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ────── MIDDLE ROW: FEATURES & USERS ────────────────────────────── */}
                    <div style={{
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "center",
                        gap: "40px",
                        width: "100%",
                    }}>
                        {/* CARD 3: CORE FEATURES */}
                        <div style={{
                            flex: "0 0 380px",
                            background: "rgba(255,255,255,0.015)",
                            border: `1px solid ${C.cardBorder}`,
                            padding: "28px 24px",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            position: "relative",
                            zIndex: 10,
                            backdropFilter: "blur(4px)",
                        }}>
                            <p style={{ fontSize: "11px", color: C.ready, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, fontWeight: "600" }}>
                                ⚙️ CORE FEATURES
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {refined.coreFeatures?.map((feature, i) => (
                                    <div key={i} style={{
                                        borderLeft: `2px solid ${C.ready}`,
                                        paddingLeft: "14px",
                                        fontSize: "12px",
                                        color: C.whiteMid,
                                    }}>
                                        • {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CARD 4: TARGET USERS */}
                        <div style={{
                            flex: "0 0 380px",
                            background: "rgba(255,255,255,0.015)",
                            border: `1px solid ${C.cardBorder}`,
                            padding: "28px 24px",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                            position: "relative",
                            zIndex: 10,
                            backdropFilter: "blur(4px)",
                        }}>
                            <p style={{ fontSize: "11px", color: C.ready, letterSpacing: "0.15em", textTransform: "uppercase", margin: 0, fontWeight: "600" }}>
                                👥 TARGET USERS
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {refined.targetUsers?.map((user, i) => (
                                    <div key={i} style={{
                                        borderLeft: `2px solid ${C.accent}`,
                                        paddingLeft: "14px",
                                        fontSize: "12px",
                                        color: C.whiteMid,
                                    }}>
                                        → {user}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ────── BOTTOM: REFINEMENT CARD ────────────────────────────────── */}
                    <div style={{
                        background: "rgba(255,255,255,0.015)",
                        border: `1px solid ${C.cardBorder}`,
                        padding: "32px 28px",
                        borderRadius: "8px",
                        width: "100%",
                        position: "relative",
                        zIndex: 10,
                        backdropFilter: "blur(4px)",
                    }}>
                        <p style={{ fontSize: "11px", color: C.ready, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 18px 0", fontWeight: "600" }}>
                            ✏️ REGENERATE
                        </p>
                        <div style={{ display: "flex", gap: "14px" }}>
                            <input
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleFeedbackSubmit()}
                                placeholder="Focus on B2B, remove features, etc..."
                                style={{
                                    flex: 1,
                                    background: "rgba(255,255,255,0.04)",
                                    border: `1px solid ${feedback.trim() ? C.accent : C.cardBorder}`,
                                    color: C.white,
                                    padding: "12px 16px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    outline: "none",
                                    transition: "all 0.2s",
                                    borderRadius: "4px",
                                }}
                            />
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={isLoading || !feedback.trim()}
                                style={{
                                    border: `1px solid ${feedback.trim() ? C.accent : C.cardBorder}`,
                                    background: feedback.trim() ? "rgba(120,180,255,0.25)" : "transparent",
                                    color: feedback.trim() ? C.white : C.whiteLow,
                                    padding: "12px 24px",
                                    fontFamily: "monospace",
                                    fontSize: "11px",
                                    cursor: feedback.trim() ? "pointer" : "default",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap",
                                    letterSpacing: "0.05em",
                                    borderRadius: "4px",
                                }}
                            >
                                [ REGENERATE ]
                            </button>
                        </div>
                    </div>

                    {/* STATUS */}
                    {isMock && <p style={{ color: C.warn, fontSize: "10px", letterSpacing: "0.05em", marginTop: "0px" }}>⚠ SIMULATED DATA</p>}
                    {error && <p style={{ color: C.error, fontSize: "10px", letterSpacing: "0.05em", marginTop: "0px" }}>✕ {error}</p>}
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
