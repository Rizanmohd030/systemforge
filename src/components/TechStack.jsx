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
}

// No longer need manual regex parsing!
const MOCK_RESULT = {
    recommendations: [
        {
            stackName: "Modern T3-Lite Stack",
            frontend: "Next.js (App Router)",
            backend: "Next.js (Server Actions)",
            database: "Supabase (PostgreSQL)",
            whyPreferred: "Extreme development speed with a unified codebase and built-in auth.",
            isPrimary: true
        },
        {
            stackName: "Modern MERN Stack",
            frontend: "React + Vite",
            backend: "Node.js (Express)",
            database: "MongoDB Atlas",
            whyPreferred: "Ideal for unstructured data and high-concurrency document processing.",
            isPrimary: false
        },
        {
            stackName: "FastAPI Powerhouse",
            frontend: "React + Tailwind",
            backend: "Python (FastAPI)",
            database: "PostgreSQL",
            whyPreferred: "Best for heavy computational logic or AI-integrated features.",
            isPrimary: false
        }
    ],
    summaryMotive: "Balancing scalability requirements with developer productivity for an early-stage MVP."
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function TechStack({ productDetails }) {
    const [analysis, setAnalysis] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [feedback, setFeedback] = useState("")
    const { getCurrentContext, setStack, stack } = useProjectStore()
    const ctx = getCurrentContext()
    const hasRun = useRef(false)

    const handleAnalyze = async (feedbackText = "", bust = false) => {
        setIsLoading(true)
        setError("")
        
        if (!bust && !feedbackText && stack) {
            setAnalysis(stack)
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/langchain/stack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: ctx, feedback: feedbackText }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch tech stack")
            
            const data = await res.json()
            setAnalysis(data)
            setStack(data)
        } catch (err) {
            console.error("TechStack error:", err)
            setAnalysis(MOCK_RESULT)
            setError("Falling back to safe defaults.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true
            handleAnalyze()
        }
    }, [ctx])

    const handleFeedbackSubmit = () => {
        if (!feedback.trim() || isLoading) return
        handleAnalyze(feedback, true)
        setFeedback("")
    }

    return (
        <WorkspaceLayout 
            moduleCode="03" 
            moduleLabel="TECH STACK"
            description="Recommends the ideal stack based on your requirements"
        >
        <section style={{ fontFamily: "monospace", color: C.whiteHi, padding: "60px 80px", maxWidth: "1200px", margin: "0 auto" }}>

            {isLoading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: C.accentMid }}>
                    <p style={{ letterSpacing: "0.2em" }}>&gt; ARCHITECTING STACK...</p>
                    <div className="loading-pulse" style={{ width: "100%", height: "2px", background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, marginTop: "20px" }} />
                </div>
            ) : analysis ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* SUMMARY MOTIVE */}
                    <p style={{ fontSize: "11px", color: C.accent, fontStyle: "italic", margin: "0 0 10px 0" }}>
                        &gt; {analysis.summaryMotive}
                    </p>

                    {/* STACK CARDS */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
                        {analysis.recommendations?.map((rec, idx) => (
                            <div key={idx} style={{
                                background: rec.isPrimary ? "rgba(20,60,160,0.25)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${rec.isPrimary ? C.ready : C.cardBorder}`,
                                padding: "20px",
                                position: "relative",
                                overflow: "hidden",
                                transition: "transform 0.2s ease"
                            }}>
                                <div style={{ position: "relative", zIndex: 2 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                        <div>
                                            <p style={{ fontSize: "9px", color: rec.isPrimary ? C.ready : C.whiteLow, letterSpacing: "0.15em", marginBottom: "4px" }}>
                                                {rec.isPrimary ? "★ PREFERRED STACK" : "ALTERNATIVE OPTION"}
                                            </p>
                                            <h2 style={{ fontSize: "20px", color: C.white, margin: 0 }}>{rec.stackName}</h2>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "20px", marginBottom: "16px", borderBottom: `1px solid ${C.whiteGhost}`, pb: "12px", paddingBottom: "12px" }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: "8px", color: C.whiteLow, marginBottom: "2px", letterSpacing: "0.05em" }}>FRONTEND</p>
                                            <p style={{ fontSize: "12px", color: C.whiteHi, margin: 0, fontWeight: "500" }}>{rec.frontend}</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: "8px", color: C.whiteLow, marginBottom: "2px", letterSpacing: "0.05em" }}>BACKEND</p>
                                            <p style={{ fontSize: "12px", color: C.whiteHi, margin: 0, fontWeight: "500" }}>{rec.backend}</p>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: "8px", color: C.whiteLow, marginBottom: "2px", letterSpacing: "0.05em" }}>DATABASE</p>
                                            <p style={{ fontSize: "12px", color: C.whiteHi, margin: 0, fontWeight: "500" }}>{rec.database}</p>
                                        </div>
                                    </div>

                                    <p style={{ fontSize: "12px", color: C.whiteMid, margin: 0 }}>
                                        <span style={{ color: rec.isPrimary ? C.ready : C.accentLow }}>WHY:</span> {rec.whyPreferred}
                                    </p>
                                </div>
                                {rec.isPrimary && (
                                    <div style={{
                                        position: "absolute", right: "-30px", top: "-30px", width: "120px", height: "120px",
                                        background: `radial-gradient(circle, ${C.ready}10 0%, transparent 70%)`,
                                        zIndex: 1
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* FEEDBACK */}
                    <div style={{ marginTop: "10px" }}>
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
        </WorkspaceLayout>
    )
}
