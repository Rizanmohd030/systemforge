"use client"

import { useState, useEffect, useRef } from "react"
import { refineIdea } from "@/lib/gemini"

// ─── PARSER ───────────────────────────────────────────────────────────────────

function parseRefinedIdea(text) {
    const get = (key) => {
        const match = text.match(new RegExp(`${key}:\\s*(.+)`))
        return match ? match[1].trim() : ""
    }
    return {
        productName: get("PRODUCT_NAME"),
        description: get("DESCRIPTION"),
        targetUsers: get("TARGET_USERS").split(",").map(s => s.trim()).filter(Boolean),
        coreFeatures: get("CORE_FEATURES").split(",").map(s => s.trim()).filter(Boolean),
    }
}

// ─── MOCK FALLBACK ────────────────────────────────────────────────────────────

const MOCK_RESULT = (idea) => ({
    productName: idea.split(" ").slice(0, 3).join("") + "App",
    description: `A platform that helps users with: ${idea}. Built for speed and simplicity.`,
    targetUsers: ["Developers", "Power Users", "Small Teams"],
    coreFeatures: ["User Auth", "Dashboard", "API Integration", "Analytics", "Export", "Notifications"],
})

// ─── WHAT THIS MODULE DOES ────────────────────────────────────────────────────

const MODULE_INFO = {
    title: "IDEA REFINEMENT",
    description:
        "Takes your raw idea and uses AI to produce a clean, structured product concept. No vague descriptions — just clear output you can build from.",
    features: [
        { label: "Product Name", detail: "A sharp, memorable name for your system" },
        { label: "Description", detail: "1–2 sentence summary of what it does and why" },
        { label: "Target Users", detail: "Who actually uses this — roles and personas" },
        { label: "Core Features", detail: "4–6 key features that define the MVP" },
    ],
    howTo: "Submit your idea on the home screen. The AI refines it instantly. Use the feedback box below the result to guide the AI and regenerate as many times as needed.",
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function IdeaRefinement({ rawIdea }) {

    const [refined, setRefined] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [feedback, setFeedback] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [iteration, setIteration] = useState(0) // tracks how many times regenerated

    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true
        if (rawIdea) handleRefine()
    }, [])


    const handleRefine = async (feedbackText = "", bust = false) => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        try {
            // `bust` = true forces a fresh API call even if cached (used on feedback regenerate)
            const rawResponse = await refineIdea(rawIdea, feedbackText, bust)
            const parsed = parseRefinedIdea(rawResponse)
            setRefined(parsed)
            setIteration(prev => prev + 1)
        } catch (err) {
            const isQuota = err?.message?.includes("429") || err?.message?.includes("quota")
            if (isQuota) {
                console.warn("[SystemForge] Quota exceeded — using mock result.")
                setRefined(MOCK_RESULT(rawIdea))
                setIsMock(true)
            } else {
                setError("Failed to reach Gemini. Check your API key.")
                console.error(err)
            }
        } finally {
            setIsLoading(false)
        }
    }


    const handleFeedbackSubmit = () => {
        if (!feedback.trim() || isLoading) return
        handleRefine(feedback, true) // bust cache so feedback always calls API fresh
        setFeedback("")
    }


    return (
        <section style={{ fontFamily: "monospace", color: "#22c55e" }}>

            {/* ── MODULE INFO BLOCK ──────────────────────────────────────────── */}
            <div style={{
                border: "1px solid rgba(34,197,94,0.15)",
                background: "rgba(34,197,94,0.03)",
                padding: "20px 24px",
                marginBottom: "28px",
            }}>
                <p style={{ opacity: 0.45, fontSize: "10px", marginBottom: "10px", letterSpacing: "0.1em" }}>
                    // ABOUT THIS MODULE
                </p>
                <p style={{ fontSize: "13px", lineHeight: "1.7", opacity: 0.9, marginBottom: "18px" }}>
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
                        <div key={i} style={{
                            borderLeft: "2px solid rgba(34,197,94,0.4)",
                            paddingLeft: "10px",
                        }}>
                            <p style={{ fontSize: "11px", marginBottom: "2px", opacity: 0.95 }}>
                                {f.label}
                            </p>
                            <p style={{ fontSize: "10px", opacity: 0.5, lineHeight: "1.4" }}>
                                {f.detail}
                            </p>
                        </div>
                    ))}
                </div>

                <p style={{ fontSize: "11px", opacity: 0.55, lineHeight: "1.6", borderTop: "1px solid rgba(34,197,94,0.1)", paddingTop: "12px" }}>
                    ↳ {MODULE_INFO.howTo}
                </p>
            </div>

            {/* ── LOADING ────────────────────────────────────────────────────── */}
            {isLoading && (
                <div style={{ opacity: 0.7 }}>
                    <p>&gt; {iteration > 0 ? "Regenerating with feedback..." : "Analyzing idea..."}</p>
                    <p>&gt; Generating refined concept...</p>
                    <span className="terminal-cursor" style={{ display: "inline-block", marginTop: "8px" }} />
                </div>
            )}

            {/* ── ERROR ─────────────────────────────────────────────────────── */}
            {error && (
                <p style={{ color: "#ef4444" }}>{error}</p>
            )}

            {/* ── QUOTA WARNING ─────────────────────────────────────────────── */}
            {isMock && (
                <p style={{ color: "#f59e0b", fontSize: "11px", marginBottom: "12px", opacity: 0.85 }}>
                    ⚠ QUOTA EXCEEDED — showing mock result. Try again later or upgrade your API plan.
                </p>
            )}

            {/* ── RESULTS ───────────────────────────────────────────────────── */}
            {refined && !isLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {iteration > 1 && (
                        <p style={{ fontSize: "10px", opacity: 0.45, letterSpacing: "0.06em" }}>
                            // ITERATION {iteration} — REFINED WITH FEEDBACK
                        </p>
                    )}

                    <ResultCard label="PRODUCT NAME" value={refined.productName} />
                    <ResultCard label="DESCRIPTION" value={refined.description} />
                    <ResultCard label="TARGET USERS" value={refined.targetUsers} isList />
                    <ResultCard label="CORE FEATURES" value={refined.coreFeatures} isList />

                    {/* ── FEEDBACK + REGENERATE ─────────────────────────────── */}
                    <div style={{
                        marginTop: "8px",
                        border: "1px solid rgba(34,197,94,0.15)",
                        padding: "16px",
                        background: "rgba(34,197,94,0.02)",
                    }}>
                        <p style={{ opacity: 0.5, fontSize: "10px", marginBottom: "10px", letterSpacing: "0.08em" }}>
                            // FEEDBACK & REGENERATE
                        </p>
                        <p style={{ opacity: 0.7, fontSize: "12px", marginBottom: "10px" }}>
                            Not quite right? Tell the AI what to change and regenerate:
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
                                    background: "transparent",
                                    border: "1px solid rgba(34,197,94,0.35)",
                                    color: "#22c55e",
                                    padding: "9px 12px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    outline: "none",
                                }}
                            />
                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={isLoading || !feedback.trim()}
                                style={{
                                    border: `1px solid ${feedback.trim() ? "rgba(34,197,94,0.8)" : "rgba(34,197,94,0.2)"}`,
                                    background: feedback.trim() ? "rgba(34,197,94,0.08)" : "transparent",
                                    color: feedback.trim() ? "#22c55e" : "rgba(34,197,94,0.3)",
                                    padding: "9px 18px",
                                    fontFamily: "monospace",
                                    fontSize: "12px",
                                    cursor: feedback.trim() ? "pointer" : "default",
                                    transition: "all 0.15s ease",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                [ REGENERATE ]
                            </button>
                        </div>
                        <p style={{ fontSize: "10px", opacity: 0.35, marginTop: "8px" }}>
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
            border: "1px solid rgba(34,197,94,0.2)",
            padding: "14px 16px",
            background: "rgba(34,197,94,0.03)",
        }}>
            <p style={{ opacity: 0.45, fontSize: "10px", marginBottom: "8px", letterSpacing: "0.1em" }}>
                {label}
            </p>
            {isList ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    {value.map((item, i) => (
                        <li key={i} style={{ fontSize: "13px" }}>• {item}</li>
                    ))}
                </ul>
            ) : (
                <p style={{ fontSize: "13px", lineHeight: "1.5" }}>{value}</p>
            )}
        </div>
    )
}
