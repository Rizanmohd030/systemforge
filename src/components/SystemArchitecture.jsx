"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import ReactFlow, { 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState,
  addEdge 
} from "reactflow"
import "reactflow/dist/style.css"
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
const MOCK_DATA = {
    prd: {
        problemStatement: "Users need a structured way to plan their software projects visually.",
        targetUsers: ["Developers", "Indie Hackers", "Product Managers"],
        coreFeatures: ["Idea Refinement", "Workflow Mapping", "Architecture Generation"],
        successMetrics: ["50% reduction in planning time", "1000+ generated blueprints"]
    },
    architecture: {
        nodes: [
            { id: "frontend", position: { x: 250, y: 0 }, data: { label: "Next.js (React) UI" } },
            { id: "api", position: { x: 250, y: 150 }, data: { label: "Next.js API Routes" } },
            { id: "db", position: { x: 250, y: 300 }, data: { label: "PostgreSQL (Supabase)" } },
            { id: "llm", position: { x: 500, y: 150 }, data: { label: "Gemini AI Engine" } }
        ],
        edges: [
            { id: "e1", source: "frontend", target: "api", animated: true },
            { id: "e2", source: "api", target: "db", animated: true },
            { id: "e3", source: "api", target: "llm", animated: true, strokeDasharray: "5 5" }
        ]
    }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SystemArchitecture({ productDetails }) {
    const [prd, setPrd] = useState(null)
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [currentSpec, setCurrentSpec] = useState(null)
    const hasRun = useRef(false)

    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

    const handleGenerate = async (bust = false) => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        // Resolve context
        const ctx = getCurrentContext()
        const specToUse = ctx.type === "refined" ? ctx.data : productDetails
        setCurrentSpec(ctx.type === "refined" ? "REFINED" : "RAW")

        try {
            const res = await fetch("/api/langchain/architecture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productDetails: specToUse }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch architecture")
            
            const data = await res.json()
            
            setPrd(data.prd)
            localStorage.setItem(KEYS.CACHE_ARCH, JSON.stringify(data))

            // Clean up nodes for React Flow
            const cleanNodes = (data.architecture?.nodes || []).map(n => ({
                ...n,
                style: {
                    background: "rgba(8,25,90,0.85)",
                    color: C.whiteHi,
                    border: `1px solid ${C.cardBorder}`,
                    fontFamily: "monospace",
                    fontSize: "12px",
                    width: 180,
                    textAlign: "center",
                    padding: "8px 12px",
                    backdropFilter: "blur(6px)",
                    borderRadius: "2px",
                },
            }))

            setNodes(cleanNodes)
            setEdges((data.architecture?.edges || []).map(e => ({ ...e, animated: true, stroke: C.accentMid })))
        } catch (err) {
            console.error("Architecture generator error:", err)
            setPrd(MOCK_DATA.prd)
            setNodes(MOCK_DATA.architecture.nodes.map(n => ({ ...n, style: { background: "rgba(8,25,90,0.85)", color: C.whiteHi, border: `1px solid ${C.cardBorder}`, fontFamily: "monospace", width: 150 } })))
            setEdges(MOCK_DATA.architecture.edges)
            setIsMock(true)
            setError("Failed to generate blueprint. Falling back to simulated architecture.")
        } finally {
            setIsLoading(false)
        }
    }

    const checkCache = () => {
        const cached = localStorage.getItem(KEYS.CACHE_ARCH)
        if (cached) {
            try {
                const data = JSON.parse(cached)
                setPrd(data.prd)
                
                const cleanNodes = (data.architecture?.nodes || []).map(n => ({
                    ...n,
                    style: {
                        background: "rgba(8,25,90,0.85)",
                        color: C.whiteHi,
                        border: `1px solid ${C.cardBorder}`,
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: 180,
                        textAlign: "center",
                        padding: "8px 12px",
                        backdropFilter: "blur(6px)",
                        borderRadius: "2px",
                    },
                }))
                setNodes(cleanNodes)
                setEdges((data.architecture?.edges || []).map(e => ({ ...e, animated: true, stroke: C.accentMid })))
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
            localStorage.removeItem(KEYS.CACHE_ARCH)
            handleGenerate(true)
        }
        window.addEventListener(EVENTS.UPDATED, onUpdate)
        return () => window.removeEventListener(EVENTS.UPDATED, onUpdate)
    }, [])

    return (
        <section style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "monospace", color: C.whiteHi }}>
            
            {/* PRD SECTION */}
            <div style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <div>
                        <p style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.1em", margin: 0 }}>{"// PRODUCT REQUIREMENT DOCUMENT"}</p>
                        <h3 style={{ fontSize: "16px", color: C.white, margin: "4px 0 0 0" }}>CORE SPECIFICATION</h3>
                    </div>
                    {isMock && <p style={{ fontSize: "10px", color: C.warn, margin: 0 }}>⚠ SIMULATED DATA</p>}
                </div>

                {isLoading && !prd ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: C.accentMid }}>
                        <p style={{ letterSpacing: "0.2em" }}>&gt; DRAFTING REQUIREMENTS...</p>
                    </div>
                ) : prd ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                        <div>
                            <h4 style={{ fontSize: "11px", color: C.whiteLow, marginBottom: "8px" }}>PROBLEM STATEMENT</h4>
                            <p style={{ fontSize: "14px", lineHeight: "1.5", margin: 0, color: C.whiteHi }}>{prd.problemStatement}</p>
                        </div>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                            <div>
                                <h4 style={{ fontSize: "11px", color: C.whiteLow, marginBottom: "8px" }}>TARGET USERS</h4>
                                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                    {(prd.targetUsers || []).map((u, i) => (
                                        <li key={i} style={{ fontSize: "12px", marginBottom: "4px" }}>&bull; {u}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ fontSize: "11px", color: C.whiteLow, marginBottom: "8px" }}>CORE FEATURES</h4>
                                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                    {(prd.coreFeatures || []).map((f, i) => (
                                        <li key={i} style={{ fontSize: "12px", marginBottom: "4px" }}>&bull; {f}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ fontSize: "11px", color: C.whiteLow, marginBottom: "8px" }}>SUCCESS METRICS</h4>
                                <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                                    {(prd.successMetrics || []).map((m, i) => (
                                        <li key={i} style={{ fontSize: "12px", marginBottom: "4px" }}>&bull; {m}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* ARCHITECTURE DIAGRAM SECTION */}
            <div style={{ height: "450px", border: `1px solid ${C.cardBorder}`, background: "rgba(8,25,90,0.4)", position: "relative" }}>
                <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, pointerEvents: "none" }}>
                    <p style={{ fontSize: "10px", color: C.whiteLow, margin: 0, letterSpacing: "0.1em" }}>{"// SYSTEMS ARCHITECTURE"}</p>
                    {isLoading && <p style={{ fontSize: "11px", color: C.accent, marginTop: "4px" }}>&gt; Generating architecture graph...</p>}
                </div>

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    style={{ background: "transparent" }}
                >
                    <Background color="rgba(255,255,255,0.05)" gap={20} />
                    <Controls />
                </ReactFlow>

                <button 
                    onClick={() => handleGenerate(true)}
                    disabled={isLoading}
                    style={{
                        position: "absolute", bottom: 12, right: 12, zIndex: 10,
                        background: "rgba(20,60,160,0.6)", border: `1px solid ${C.whiteLow}`,
                        color: C.white, padding: "6px 12px", fontSize: "10px",
                        cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.05em"
                    }}
                >
                    {isLoading ? "[ GENERATING... ]" : "[ RE-ARCHITECT ]"}
                </button>
                
                {error && (
                    <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: C.error, fontSize: "12px", background: "rgba(0,0,0,0.7)", padding: "10px 20px", zIndex: 10 }}>
                        {error}
                    </div>
                )}
            </div>

        </section>
    )
}
