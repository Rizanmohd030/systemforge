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
    ready: "rgba(100,220,255,1)",
    warn: "rgba(255,200,80,0.9)",
    error: "rgba(255,100,100,0.9)",
    cardBg: "rgba(8,25,90,0.70)",
    cardBorder: "rgba(255,255,255,0.18)",
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ROADMAP = [
    {
        stage: "Project Initialization",
        description: "Set up the foundational workspace and repository.",
        tasks: ["Initialize Git repository", "Scaffold Next.js framework", "Configure Tailwind CSS", "Set up ESLint and Prettier"],
        commands: ["npx create-next-app@latest .", "git init", "npm run dev"],
        aiPrompt: "Generate a boilerplate Next.js application structure with Tailwind pre-configured for a highly styled dashboard."
    },
    {
        stage: "Core Database & Auth",
        description: "Configure backend services for data storage and user sessions.",
        tasks: ["Create Supabase project", "Define Auth policies", "Run initial migrations"],
        commands: ["npm i @supabase/supabase-js", "npx supabase init"],
        aiPrompt: "Write the Supabase SQL schema to create a 'users' table and a 'projects' table with Row Level Security."
    },
    {
        stage: "Frontend UI Development",
        description: "Build out the interactive application screens.",
        tasks: ["Implement layout wrapper", "Create dashboard components", "Wire up state management"],
        commands: ["npm i framer-motion lucide-react"],
        aiPrompt: "Create a modern, responsive React layout component using Tailwind CSS with a sidebar navigation."
    }
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BuildRoadmap({ productDetails }) {
    const [roadmap, setRoadmap] = useState([])
    const [expandedStage, setExpandedStage] = useState(0)
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [copiedContent, setCopiedContent] = useState(null)
    const { getCurrentContext, setRoadmap: setGlobalRoadmap, roadmap: globalRoadmap } = useProjectStore()
    const ctx = getCurrentContext()
    
    const hasRun = useRef(false)

    const handleGenerate = async (bust = false) => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        if (!bust && globalRoadmap && globalRoadmap.length > 0) {
            setRoadmap(globalRoadmap)
            setExpandedStage(0)
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/langchain/roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: ctx, feedback: "" }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch roadmap")
            
            const data = await res.json()
            setRoadmap(data)
            setGlobalRoadmap(data)
            setExpandedStage(0)
        } catch (err) {
            console.error("Roadmap error:", err)
            setRoadmap(MOCK_ROADMAP)
            setIsMock(true)
            setError("Failed to generate roadmap. Falling back to simulated data.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true
            handleGenerate()
        }
    }, [ctx])

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
        <section style={{ display: "flex", flexDirection: "column", gap: "30px", fontFamily: "monospace", color: C.whiteHi, padding: "40px 60px", margin: "0" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <p style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.1em", margin: 0 }}>{"// EXECUTION PLAN"}</p>
                    <h3 style={{ fontSize: "16px", color: C.white, margin: "4px 0 0 0" }}>DEVELOPMENT ROADMAP</h3>
                </div>
                {isMock && <p style={{ fontSize: "10px", color: C.warn, margin: 0 }}>⚠ SIMULATED DATA</p>}
                
                <button 
                    onClick={() => handleGenerate(true)}
                    disabled={isLoading}
                    style={{
                        background: "rgba(20,60,160,0.6)", border: `1px solid ${C.whiteLow}`,
                        color: C.white, padding: "6px 12px", fontSize: "10px",
                        cursor: "pointer", letterSpacing: "0.05em"
                    }}
                >
                    {isLoading ? "[ GENERATING... ]" : "[ RE-GENERATE ]"}
                </button>
            </div>

            {error && (
                <div style={{ color: C.error, fontSize: "12px", background: "rgba(255,100,100,0.1)", padding: "10px 20px", border: `1px solid ${C.error}` }}>
                    {error}
                </div>
            )}

            {isLoading && roadmap.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: C.accentMid, border: `1px solid ${C.cardBorder}`, background: C.cardBg }}>
                    <p style={{ letterSpacing: "0.2em" }}>&gt; PLOTTING COURSE...</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* HORIZONTAL STEPS VIEW */}
                    <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0px", 
                        justifyContent: "flex-start",
                        padding: "40px 20px",
                        background: "rgba(8,25,90,0.3)",
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: "4px",
                        minHeight: "200px",
                        position: "relative",
                        overflowX: "auto",
                        overflowY: "hidden"
                    }}>
                        {roadmap.map((stage, index) => {
                            const isSelected = expandedStage === index;
                            return (
                                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: isSelected ? 10 : 1, flexShrink: 0, minWidth: "160px" }}>
                                    {/* Arrow connector before step */}
                                    {index > 0 && (
                                        <div style={{
                                            position: "absolute",
                                            right: "100%",
                                            top: "50%",
                                            width: "40px",
                                            height: "2px",
                                            background: isSelected || expandedStage === index - 1 ? C.ready : C.cardBorder,
                                            transition: "all 0.3s ease",
                                            marginRight: "0px"
                                        }}>
                                            <div style={{
                                                position: "absolute",
                                                left: "-8px",
                                                top: "-5px",
                                                width: "0",
                                                height: "0",
                                                borderRight: `8px solid ${isSelected || expandedStage === index - 1 ? C.ready : C.cardBorder}`,
                                                borderTop: "5px solid transparent",
                                                borderBottom: "5px solid transparent"
                                            }} />
                                        </div>
                                    )}

                                    {/* Step Card */}
                                    <div
                                        onClick={() => setExpandedStage(isSelected ? null : index)}
                                        style={{
                                            background: isSelected ? "rgba(20,60,160,0.4)" : "rgba(255,255,255,0.015)",
                                            border: `2px solid ${isSelected ? C.ready : C.cardBorder}`,
                                            padding: "16px 20px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            textAlign: "center",
                                            minWidth: "140px",
                                            transition: "all 0.3s ease",
                                            filter: expandedStage !== null && !isSelected ? "blur(2px)" : "none",
                                            opacity: expandedStage !== null && !isSelected ? 0.4 : 1,
                                            backdropFilter: "blur(4px)",
                                            transform: isSelected ? "scale(1.05)" : "scale(1)"
                                        }}
                                    >
                                        <p style={{ fontSize: "9px", color: isSelected ? C.ready : C.whiteLow, margin: "0 0 4px 0", letterSpacing: "0.1em", fontWeight: "600" }}>
                                            STEP {String(index + 1).padStart(2, "0")}
                                        </p>
                                        <h4 style={{ fontSize: "12px", color: C.white, margin: "0", fontWeight: "700" }}>
                                            {stage.stage}
                                        </h4>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* EXPANDED DETAILS */}
                    {expandedStage !== null && roadmap[expandedStage] && (
                        <div style={{
                            border: `1px solid ${C.ready}`,
                            background: "rgba(20,60,160,0.2)",
                            padding: "28px",
                            borderRadius: "4px",
                            backdropFilter: "blur(4px)",
                            animation: "fadeIn 0.3s ease"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                <div>
                                    <p style={{ fontSize: "10px", color: C.ready, margin: "0 0 4px 0", letterSpacing: "0.1em", fontWeight: "600" }}>
                                        STEP {String(expandedStage + 1).padStart(2, "0")}
                                    </p>
                                    <h3 style={{ fontSize: "16px", color: C.white, margin: "0", fontWeight: "700" }}>
                                        {roadmap[expandedStage].stage}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setExpandedStage(null)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: C.whiteLow,
                                        fontSize: "18px",
                                        cursor: "pointer",
                                        padding: "0"
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <p style={{ fontSize: "13px", color: C.whiteMid, margin: "0 0 20px 0", lineHeight: "1.6" }}>
                                {roadmap[expandedStage].description}
                            </p>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                {/* Tasks */}
                                <div>
                                    <h5 style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.1em", marginBottom: "12px", fontWeight: "600" }}>
                                        // TASKS
                                    </h5>
                                    <ul style={{ padding: "0", margin: "0", listStyle: "none" }}>
                                        {(roadmap[expandedStage].tasks || []).map((t, i) => (
                                            <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", fontSize: "11px", color: C.whiteHi }}>
                                                <span style={{ color: C.ready, marginTop: "2px" }}>✓</span>
                                                <span>{t}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Commands & AI */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {roadmap[expandedStage].commands && roadmap[expandedStage].commands.length > 0 && (
                                        <div>
                                            <h5 style={{ fontSize: "10px", color: C.ready, letterSpacing: "0.1em", marginBottom: "8px", fontWeight: "600" }}>
                                                &gt; TERMINAL COMMANDS
                                            </h5>
                                            <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${C.whiteGhost}`, padding: "12px", borderRadius: "4px" }}>
                                                {(roadmap[expandedStage].commands || []).map((c, i) => (
                                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < roadmap[expandedStage].commands.length - 1 ? "8px" : "0" }}>
                                                        <code style={{ fontSize: "10px", color: C.ready, wordBreak: "break-all" }}>{c}</code>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(c, `cmd-${expandedStage}-${i}`); }}
                                                            style={{ background: "none", border: "none", color: C.whiteLow, cursor: "pointer", fontSize: "9px", padding: "4px 8px" }}
                                                        >
                                                            {copiedContent === `cmd-${expandedStage}-${i}` ? "✓" : "COPY"}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {roadmap[expandedStage].aiPrompt && (
                                        <div>
                                            <h5 style={{ fontSize: "10px", color: "#b684ff", letterSpacing: "0.1em", marginBottom: "8px", fontWeight: "600" }}>
                                                ✨ AI PROMPT
                                            </h5>
                                            <div style={{ background: "rgba(182,132,255,0.1)", border: "1px solid rgba(182,132,255,0.3)", padding: "12px", borderRadius: "4px" }}>
                                                <p style={{ fontSize: "11px", color: C.whiteMid, margin: "0 0 8px 0", fontStyle: "italic" }}>
                                                    &quot;{roadmap[expandedStage].aiPrompt}&quot;
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(roadmap[expandedStage].aiPrompt, `prompt-${expandedStage}`); }}
                                                    style={{ background: "rgba(182,132,255,0.2)", border: "1px solid rgba(182,132,255,0.5)", color: "#b684ff", cursor: "pointer", fontSize: "9px", padding: "4px 8px", width: "100%", fontFamily: "monospace" }}
                                                >
                                                    {copiedContent === `prompt-${expandedStage}` ? "✓ COPIED" : "COPY PROMPT"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </section>
    )
}
