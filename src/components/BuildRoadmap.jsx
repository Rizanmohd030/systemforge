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
            const res = await fetch("/api/langchain/roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productDetails: specToUse, feedback: "" }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch roadmap")
            
            const data = await res.json()
            setRoadmap(data)
            localStorage.setItem(KEYS.CACHE_ROADMAP, JSON.stringify(data))
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

    const checkCache = () => {
        const cached = localStorage.getItem(KEYS.CACHE_ROADMAP)
        if (cached) {
            try {
                const data = JSON.parse(cached)
                setRoadmap(data)
                return true
            } catch (e) {
                return false
            }
        }
        return false
    }

    useEffect(() => {
        if (!hasRun.current) {
            hasRun.current = true
            const hasCache = checkCache()
            if (!hasCache) handleGenerate()
        }

        const onUpdate = () => {
            localStorage.removeItem(KEYS.CACHE_ROADMAP)
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
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                    {/* Vertical line connecting nodes */}
                    <div style={{ position: "absolute", left: "20px", top: "20px", bottom: "20px", width: "1px", background: C.whiteGhost, zIndex: 0 }} />
                    
                    {roadmap.map((stage, index) => {
                        const isExpanded = expandedStage === index;
                        return (
                            <div key={index} style={{ position: "relative", zIndex: 1, paddingLeft: "50px" }}>
                                {/* Node dot */}
                                <div style={{
                                    position: "absolute", left: "16px", top: "16px", width: "9px", height: "9px", borderRadius: "50%",
                                    background: isExpanded ? C.ready : C.cardBg, border: `2px solid ${isExpanded ? C.ready : C.whiteLow}`,
                                    boxShadow: isExpanded ? `0 0 10px ${C.ready}80` : "none", transition: "all 0.2s ease", cursor: "pointer"
                                }} onClick={() => setExpandedStage(isExpanded ? null : index)} />

                                {/* Card */}
                                <div style={{
                                    border: `1px solid ${isExpanded ? C.ready : C.cardBorder}`,
                                    background: isExpanded ? "rgba(20,60,160,0.25)" : C.cardBg,
                                    transition: "all 0.2s ease"
                                }}>
                                    {/* Header (always visible) */}
                                    <div 
                                        onClick={() => setExpandedStage(isExpanded ? null : index)}
                                        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                    >
                                        <div>
                                            <p style={{ fontSize: "10px", color: isExpanded ? C.ready : C.whiteLow, margin: "0 0 4px 0", letterSpacing: "0.1em" }}>STEP 0{index + 1}</p>
                                            <h4 style={{ fontSize: "15px", color: C.white, margin: 0 }}>{stage.stage}</h4>
                                        </div>
                                        <div style={{ color: C.whiteLow, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                                            ▼
                                        </div>
                                    </div>

                                    {/* Content (collapsible) */}
                                    {isExpanded && (
                                        <div style={{ padding: "0 20px 20px 20px", borderTop: `1px solid ${C.whiteGhost}` }}>
                                            <p style={{ fontSize: "12px", color: C.whiteMid, margin: "16px 0", lineHeight: "1.5" }}>{stage.description}</p>
                                            
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                                {/* Left Column: Tasks */}
                                                <div>
                                                    <h5 style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.1em", marginBottom: "12px" }}>{"// TASKS"}</h5>
                                                    <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                                        {(stage.tasks || []).map((t, i) => (
                                                            <li key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", fontSize: "11px", color: C.whiteHi }}>
                                                                <span style={{ color: C.whiteLow }}>[ ]</span>
                                                                <span>{t}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Right Column: Terminal & AI */}
                                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                                    {stage.commands && stage.commands.length > 0 && (
                                                        <div>
                                                            <h5 style={{ fontSize: "10px", color: C.ready, letterSpacing: "0.1em", marginBottom: "8px" }}>&gt; TERMINAL COMMANDS</h5>
                                                            <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${C.whiteGhost}`, padding: "12px", borderRadius: "4px" }}>
                                                                {(stage.commands || []).map((c, i) => (
                                                                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < stage.commands.length - 1 ? "8px" : "0" }}>
                                                                        <code style={{ fontSize: "11px", color: C.ready, wordBreak: "break-all" }}>{c}</code>
                                                                        <button 
                                                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(c, `cmd-${index}-${i}`); }}
                                                                            style={{ background: "none", border: "none", color: C.whiteLow, cursor: "pointer", fontSize: "10px", padding: "4px" }}
                                                                        >
                                                                            {copiedContent === `cmd-${index}-${i}` ? "COPIED!" : "COPY"}
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {stage.aiPrompt && (
                                                        <div>
                                                            <h5 style={{ fontSize: "10px", color: "#b684ff", letterSpacing: "0.1em", marginBottom: "8px" }}>✨ AI PROMPT</h5>
                                                            <div style={{ background: "rgba(182,132,255,0.1)", border: "1px solid rgba(182,132,255,0.3)", padding: "12px", borderRadius: "4px" }}>
                                                                <p style={{ fontSize: "11px", color: C.whiteMid, margin: "0 0 10px 0", fontStyle: "italic" }}>&quot;{stage.aiPrompt}&quot;</p>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(stage.aiPrompt, `prompt-${index}`); }}
                                                                    style={{ background: "rgba(182,132,255,0.2)", border: "1px solid rgba(182,132,255,0.5)", color: "#b684ff", cursor: "pointer", fontSize: "10px", padding: "4px 8px", width: "100%" }}
                                                                >
                                                                    {copiedContent === `prompt-${index}` ? "PROMPT COPIED!" : "COPY PROMPT FOR IDE"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
