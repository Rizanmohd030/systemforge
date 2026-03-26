"use client"

import { useState, useEffect, useRef } from "react"
import { getCurrentContext, PROJECT_EVENT, generateHash, shouldFetch, getModule, updateModule } from "@/lib/project"

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
const MOCK_STEPS = [
    { id: "1", label: "User Landing" },
    { id: "2", label: "Input System Idea" },
    { id: "3", label: "Generate Blueprint" },
    { id: "4", label: "Review Roadmap" },
    { id: "5", label: "Export Code" },
]

// ─── STEP NODE ────────────────────────────────────────────────────────────────
function StepNode({ step, index, total, isHovered, onHover }) {
    const isFirst = index === 0
    const isLast = index === total - 1

    return (
        <div
            onMouseEnter={() => onHover(step.id)}
            onMouseLeave={() => onHover(null)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
        >
            {/* Connector line from previous node */}
            {!isFirst && (
                <div style={{
                    width: "1px", height: "28px",
                    background: `linear-gradient(to bottom, ${C.whiteLow}, ${C.whiteGhost})`,
                    marginBottom: "0px",
                }} />
            )}

            {/* Arrow head before the node (except first) */}
            {!isFirst && (
                <div style={{
                    width: 0, height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderTop: `6px solid ${C.whiteLow}`,
                    marginBottom: "4px",
                }} />
            )}

            {/* Step Card */}
            <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                position: "relative",
            }}>
                {/* Step number circle */}
                <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: `1.5px solid ${isHovered ? C.ready : C.whiteLow}`,
                    background: isHovered ? "rgba(100,220,255,0.08)" : "rgba(8,25,90,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontFamily: "monospace", color: isHovered ? C.ready : C.whiteMid,
                    fontWeight: "600", letterSpacing: "0.05em",
                    transition: "all 0.25s ease",
                    flexShrink: 0,
                }}>
                    {String(index + 1).padStart(2, "0")}
                </div>

                {/* Label card */}
                <div style={{
                    border: `1px solid ${isHovered ? "rgba(100,220,255,0.4)" : C.cardBorder}`,
                    background: isHovered ? "rgba(20,60,160,0.25)" : C.cardBg,
                    padding: "10px 20px",
                    minWidth: 180,
                    transition: "all 0.25s ease",
                    position: "relative",
                }}>
                    {/* Corner brackets */}
                    <span style={{ position: "absolute", top: -1, left: -1, color: isHovered ? C.ready : C.whiteLow, fontSize: "10px", lineHeight: 1 }}>┌</span>
                    <span style={{ position: "absolute", top: -1, right: -1, color: isHovered ? C.ready : C.whiteLow, fontSize: "10px", lineHeight: 1 }}>┐</span>
                    <span style={{ position: "absolute", bottom: -1, left: -1, color: isHovered ? C.ready : C.whiteLow, fontSize: "10px", lineHeight: 1 }}>└</span>
                    <span style={{ position: "absolute", bottom: -1, right: -1, color: isHovered ? C.ready : C.whiteLow, fontSize: "10px", lineHeight: 1 }}>┘</span>

                    <p style={{
                        margin: 0, fontSize: "12px", fontFamily: "monospace",
                        color: isHovered ? C.white : C.whiteHi,
                        letterSpacing: "0.04em", textTransform: "uppercase",
                        textAlign: "center",
                    }}>
                        {step.label}
                    </p>
                </div>
            </div>

            {/* Connector line to next node */}
            {!isLast && (
                <div style={{
                    width: "1px", height: "28px",
                    background: `linear-gradient(to bottom, ${C.whiteGhost}, ${C.whiteLow})`,
                    marginTop: "0px",
                }} />
            )}
        </div>
    )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WorkflowMap({ productDetails }) {
    const [steps, setSteps] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [currentSpec, setCurrentSpec] = useState(null)
    const [hovered, setHovered] = useState(null)
    const hasRun = useRef(false)

    // Convert API nodes format to flat steps list
    const parseSteps = (data) => {
        if (data.nodes) {
            // Sort by y-position to determine order
            const sorted = [...data.nodes].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0))
            return sorted.map(n => ({ id: n.id, label: n.data?.label || n.id }))
        }
        if (Array.isArray(data)) return data
        return []
    }

    const handleGenerate = async (bust = false) => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        const ctx = getCurrentContext()
        const specToUse = ctx.type === "refined" ? ctx.data : productDetails
        setCurrentSpec(ctx.type === "refined" ? "REFINED" : "RAW")
        const inputHash = generateHash(specToUse)

        // Check hash-based cache
        if (!bust && !shouldFetch("workflow", inputHash)) {
            const cached = getModule("workflow")
            if (cached?.data) {
                setSteps(parseSteps(cached.data))
                setIsLoading(false)
                return
            }
        }

        try {
            const res = await fetch("/api/langchain/workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productDetails: specToUse }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch workflow")
            
            const data = await res.json()
            updateModule("workflow", data, inputHash)
            setSteps(parseSteps(data))
        } catch (err) {
            console.error("Workflow generation failed:", err)
            setSteps(MOCK_STEPS)
            setIsMock(true)
            setError("Failed to generate workflow. Falling back to simulated journey.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true
            handleGenerate()
        }

        const onUpdate = () => handleGenerate(true)
        window.addEventListener(PROJECT_EVENT, onUpdate)
        return () => window.removeEventListener(PROJECT_EVENT, onUpdate)
    }, [])

    return (
        <section style={{
            border: `1px solid ${C.cardBorder}`,
            background: "rgba(8,25,90,0.4)",
            padding: "24px",
            fontFamily: "monospace",
            position: "relative",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <p style={{ fontSize: "10px", color: C.whiteLow, margin: 0, letterSpacing: "0.1em" }}>// WORKFLOW ENGINE</p>
                    <h3 style={{ fontSize: "14px", color: C.white, margin: "4px 0 0" }}>
                        USER JOURNEY MAP {currentSpec === "REFINED" && <span style={{ color: C.ready }}>[REFINED ✓]</span>}
                    </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {isMock && <p style={{ fontSize: "10px", color: C.warn, margin: 0 }}>⚠ SIMULATED</p>}
                    <button
                        onClick={() => handleGenerate(true)}
                        disabled={isLoading}
                        style={{
                            background: "rgba(20,60,160,0.6)", border: `1px solid ${C.whiteLow}`,
                            color: C.white, padding: "6px 12px", fontSize: "10px",
                            cursor: isLoading ? "not-allowed" : "pointer", letterSpacing: "0.05em",
                        }}
                    >
                        {isLoading ? "[ GENERATING... ]" : "[ RE-MAPPING ]"}
                    </button>
                </div>
            </div>

            {/* Flow Diagram */}
            {isLoading && steps.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: C.accentMid }}>
                    <p style={{ letterSpacing: "0.2em" }}>&gt; PLOTTING USER JOURNEY...</p>
                </div>
            ) : (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "20px 0",
                }}>
                    {steps.map((step, i) => (
                        <StepNode
                            key={step.id}
                            step={step}
                            index={i}
                            total={steps.length}
                            isHovered={hovered === step.id}
                            onHover={setHovered}
                        />
                    ))}
                </div>
            )}

            {/* Step count annotation */}
            {steps.length > 0 && (
                <p style={{
                    fontSize: "9px", color: C.whiteGhost, textAlign: "right",
                    margin: "8px 0 0", letterSpacing: "0.1em",
                }}>
                    {`TOTAL_STEPS: ${steps.length} // SEQUENTIAL_FLOW`}
                </p>
            )}

            {error && (
                <div style={{ color: C.error, fontSize: "12px", background: "rgba(255,100,100,0.1)", padding: "10px 20px", border: `1px solid ${C.error}`, marginTop: "12px" }}>
                    {error}
                </div>
            )}
        </section>
    )
}
