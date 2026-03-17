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
const MOCK_FLOW = {
  nodes: [
    { id: "1", position: { x: 300, y: 0 }, data: { label: "User Landing" } },
    { id: "2", position: { x: 300, y: 150 }, data: { label: "Input System Idea" } },
    { id: "3", position: { x: 300, y: 300 }, data: { label: "Generate Blueprint" } },
    { id: "4", position: { x: 100, y: 450 }, data: { label: "Review Roadmap" } },
    { id: "5", position: { x: 500, y: 450 }, data: { label: "Export Code" } },
  ],
  edges: [
    { id: "e1-2", source: "1", target: "2", animated: true },
    { id: "e2-3", source: "2", target: "3", animated: true },
    { id: "e3-4", source: "3", target: "4" },
    { id: "e3-5", source: "3", target: "5" },
  ],
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WorkflowMap({ productDetails }) {
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
            const res = await fetch("/api/langchain/workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productDetails: specToUse }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch workflow")
            
            const data = await res.json()
            localStorage.setItem(KEYS.CACHE_WORKFLOW, JSON.stringify(data))
            
            // Clean up nodes for React Flow
            const cleanNodes = (data.nodes || []).map(n => ({
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
            setEdges((data.edges || []).map(e => ({ ...e, animated: true, stroke: C.accentMid })))
        } catch (err) {
            console.error("Workflow layout failed:", err)
            setNodes(MOCK_FLOW.nodes.map(n => ({ ...n, style: { background: "rgba(8,25,90,0.85)", color: C.whiteHi, border: `1px solid ${C.cardBorder}`, fontFamily: "monospace", width: 150 } })))
            setEdges(MOCK_FLOW.edges)
            setIsMock(true)
            setError("Failed to generate workflow. Falling back to simulated journey.")
        } finally {
            setIsLoading(false)
        }
    }

    const checkCache = () => {
        const cached = localStorage.getItem(KEYS.CACHE_WORKFLOW)
        if (cached) {
            try {
                const data = JSON.parse(cached)
                // Clean up nodes for React Flow
                const cleanNodes = (data.nodes || []).map(n => ({
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
                setEdges((data.edges || []).map(e => ({ ...e, animated: true, stroke: C.accentMid })))
                return true
            } catch (e) {
                return false
            }
        }
        return false
    }

    useEffect(() => {
        // Initial run
        if (!hasRun.current) {
            hasRun.current = true
            const hasCache = checkCache()
            if (!hasCache) handleGenerate()
        }

        // Listen for context updates
        const onUpdate = () => {
            localStorage.removeItem(KEYS.CACHE_WORKFLOW)
            handleGenerate(true) // Force refresh when saved
        }
        window.addEventListener(EVENTS.UPDATED, onUpdate)
        return () => window.removeEventListener(EVENTS.UPDATED, onUpdate)
    }, [])

    return (
        <section style={{ height: "600px", border: `1px solid ${C.cardBorder}`, background: "rgba(8,25,90,0.4)", position: "relative" }}>
            
            {/* Overlay Info */}
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, pointerEvents: "none" }}>
                <p style={{ fontSize: "10px", color: C.whiteLow, margin: 0, letterSpacing: "0.1em" }}>// WORKFLOW ENGINE</p>
                <h3 style={{ fontSize: "14px", color: C.white, margin: "4px 0" }}>
                    USER JOURNEY MAP {currentSpec === "REFINED" && <span style={{ color: C.ready }}>[REFINED ✓]</span>}
                </h3>
                {isLoading && <p style={{ fontSize: "11px", color: C.accent }}>&gt; Generating flow nodes...</p>}
            </div>

            {isMock && (
                <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                    <p style={{ fontSize: "10px", color: C.warn }}>⚠ QUOTA EXCEEDED (USING SIMULATED FLOW)</p>
                </div>
            )}

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

            {error && (
                <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", color: C.error, fontSize: "12px", background: "rgba(0,0,0,0.7)", padding: "10px 20px" }}>
                    {error}
                </div>
            )}

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
                {isLoading ? "[ GENERATING... ]" : "[ RE-MAPPING ]"}
            </button>
        </section>
    )
}
