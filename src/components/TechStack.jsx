"use client"

import { useState, useEffect, useRef } from "react"
import { analyzeTechStack } from "@/lib/gemini"
import { getCurrentContext } from "@/lib/context"

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

// ─── PARSER ───────────────────────────────────────────────────────────────────
function parseTechStackAnalysis(text) {
    const sections = ["FRONTEND", "BACKEND", "MOTIVE", "ALTERNATIVE", "TRADE_OFF"]
    const result = {}
    sections.forEach((s, i) => {
        const next = sections[i + 1]
        const regex = next 
            ? new RegExp(`${s}:\\s*([\\s\\S]*?)(?=${next}:)`, "i")
            : new RegExp(`${s}:\\s*([\\s\\S]*)`, "i")
        const match = text.match(regex)
        result[s] = match ? match[1].trim() : "TBD"
    })
    return result
}

// ─── MOCK ─────────────────────────────────────────────────────────────────────
const MOCK_RESULT = {
    FRONTEND: "Next.js (React Framework)",
    BACKEND: "Supabase (PostgreSQL + Auth)",
    MOTIVE: "Optimized for lightning-fast MVP development and seamless scalability.",
    ALTERNATIVE: "MERN Stack (Extra control)",
    TRADE_OFF: "Increased dependency on specialized BaaS providers."
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TechStack({ productDetails }) {
    const [analysis, setAnalysis] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [feedback, setFeedback] = useState("")
    const [mounted, setMounted] = useState(false)
    const hasRun = useRef(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleAnalyze = async (feedbackText = "", bust = false) => {
        setIsLoading(true)
        setError("")
        
        const ctx = getCurrentContext()
        const specToSearch = ctx.type === "refined" ? ctx.data : productDetails

        try {
            const rawResponse = await analyzeTechStack(specToSearch, feedbackText, bust)
            setAnalysis(parseTechStackAnalysis(rawResponse))
        } catch (err) {
            setAnalysis(MOCK_RESULT)
            setError(err?.message?.includes("quota") ? "" : "Falling back to safe defaults.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!mounted || hasRun.current) return
        hasRun.current = true
        handleAnalyze()
    }, [mounted])

    const handleFeedbackSubmit = () => {
        if (!feedback.trim() || isLoading) return
        handleAnalyze(feedback, true)
        setFeedback("")
    }

    if (!mounted) return null

    return (
        <section style={{ fontFamily: "monospace", color: C.whiteHi }}>

            {isLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: C.accentMid }}>
                    <p style={{ letterSpacing: "0.2em" }}>&gt; ARCHITECTING STACK...</p>
                    <div className="loading-pulse" style={{ width: "100%", height: "2px", background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, marginTop: "20px" }} />
                </div>
            ) : analysis ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {/* HERO STACK */}
                    <div style={{
                        background: "rgba(20,60,160,0.25)",
                        border: `1px solid ${C.ready}`,
                        padding: "30px",
                        position: "relative",
                        overflow: "hidden"
                    }}>
                        <div style={{ position: "relative", zIndex: 2 }}>
                            <p style={{ fontSize: "10px", color: C.ready, letterSpacing: "0.2em", marginBottom: "15px" }}>// RECOMMENDED BLUEPRINT</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "9px", color: C.whiteLow, marginBottom: "4px" }}>FRONTEND</p>
                                    <h2 style={{ fontSize: "24px", color: C.white, margin: 0, letterSpacing: "0.05em" }}>{analysis.FRONTEND || "Next.js"}</h2>
                                </div>
                                <div style={{ width: "1px", height: "40px", background: C.whiteGhost }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: "9px", color: C.whiteLow, marginBottom: "4px" }}>BACKEND</p>
                                    <h2 style={{ fontSize: "24px", color: C.white, margin: 0, letterSpacing: "0.05em" }}>{analysis.BACKEND || "Supabase"}</h2>
                                </div>
                            </div>
                            <p style={{ fontSize: "14px", color: C.whiteMid, lineHeight: "1.6", borderTop: `1px solid ${C.whiteGhost}`, paddingTop: "15px", margin: 0 }}>
                                <span style={{ color: C.accent }}>MOTIVE:</span> {analysis.MOTIVE}
                            </p>
                        </div>
                        {/* Decorative background circle */}
                        <div style={{
                            position: "absolute", right: "-50px", top: "-50px", width: "200px", height: "200px",
                            background: `radial-gradient(circle, ${C.ready}15 0%, transparent 70%)`,
                            zIndex: 1
                        }} />
                    </div>

                    {/* COMPARISON & TRADE-OFF */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                        <div style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, padding: "20px" }}>
                            <p style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.1em", marginBottom: "10px" }}>// ALTERNATIVE PATH</p>
                            <p style={{ fontSize: "16px", color: C.whiteHi, margin: "0 0 10px 0" }}>{analysis.ALTERNATIVE}</p>
                            <p style={{ fontSize: "11px", color: C.whiteLow, margin: 0 }}>Consider if you need full infrastructure control.</p>
                        </div>
                        <div style={{ border: `1px solid ${C.warn}`, background: "rgba(255,200,80,0.05)", padding: "20px" }}>
                            <p style={{ fontSize: "10px", color: C.warn, letterSpacing: "0.1em", marginBottom: "10px" }}>// PRIMARY TRADE-OFF</p>
                            <p style={{ fontSize: "12px", color: C.whiteHi, lineHeight: "1.5", margin: 0 }}>{analysis.TRADE_OFF}</p>
                        </div>
                    </div>

                    {/* FEEDBACK */}
                    <div style={{ borderTop: `1px solid ${C.whiteGhost}`, paddingTop: "20px" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleFeedbackSubmit()}
                                placeholder="Change constraints... (e.g. 'Use Python')"
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: `1px solid ${C.whiteLow}`,
                                    color: C.white,
                                    padding: "10px 15px",
                                    fontSize: "12px",
                                    fontFamily: "monospace",
                                    outline: "none"
                                }}
                            />
                            <button
                                onClick={handleFeedbackSubmit}
                                style={{
                                    background: C.whiteHi,
                                    color: "black",
                                    border: "none",
                                    padding: "0 25px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    fontFamily: "monospace"
                                }}
                            >
                                RE-ANALYZE
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <style>{`
                .loading-pulse {
                    animation: lpulse 2s ease-in-out infinite;
                }
                @keyframes lpulse {
                    0% { transform: scaleX(0); opacity: 0; }
                    50% { transform: scaleX(1); opacity: 1; }
                    100% { transform: scaleX(0); opacity: 0; }
                }
            `}</style>
        </section>
    )
}
