"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectStore } from "@/store/projectStore"
import WorkspaceLayout from "@/components/WorkspaceLayout"

import ReactFlow, { Background, Controls, useNodesState, useEdgesState } from "reactflow"
import "reactflow/dist/style.css"

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
const MOCK_WORKFLOW = {
    nodes: [
        { id: "1", position: { x: 250, y: 0 }, data: { label: "User Landing" } },
        { id: "2", position: { x: 250, y: 100 }, data: { label: "Input System Idea" } },
        { id: "3", position: { x: 250, y: 200 }, data: { label: "Generate Blueprint" } },
        { id: "4", position: { x: 250, y: 300 }, data: { label: "Review Roadmap" } },
        { id: "5", position: { x: 250, y: 400 }, data: { label: "Export Code" } }
    ],
    edges: [
        { id: "e1-2", source: "1", target: "2" },
        { id: "e2-3", source: "2", target: "3" },
        { id: "e3-4", source: "3", target: "4" },
        { id: "e4-5", source: "4", target: "5" }
    ]
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WorkflowMap({ productDetails }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMock, setIsMock] = useState(false)
    const { getCurrentContext, setWorkflow, workflow } = useProjectStore()
    const ctx = getCurrentContext()
    const hasRun = useRef(false)

    const applyWorkflowData = (data) => {
        const cleanNodes = (data.nodes || []).map((n, i) => ({
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
            data: { label: `${String(i + 1).padStart(2, "0")} — ${n.data?.label || n.id}` }
        }))
        setNodes(cleanNodes)
        setEdges((data.edges || []).map(e => ({ ...e, animated: true, stroke: C.accentMid })))
    }

    const handleGenerate = async (bust = false) => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        if (!bust && workflow) {
            applyWorkflowData(workflow)
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/langchain/workflow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: ctx }),
            })
            
            if (!res.ok) throw new Error("Failed to fetch workflow")
            
            const data = await res.json()
            setWorkflow(data)
            applyWorkflowData(data)
        } catch (err) {
            console.error("Workflow generation failed:", err)
            applyWorkflowData(MOCK_WORKFLOW)
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
    }, [ctx])

    return (
        <section style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
            fontFamily: "monospace",
            color: C.whiteHi,
            padding: "40px 60px",
            margin: "0"
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <p style={{ fontSize: "10px", color: C.whiteLow, margin: 0, letterSpacing: "0.1em" }}>
                        {`// WORKFLOW ENGINE`}
                    </p>
                    <h3 style={{ fontSize: "14px", color: C.white, margin: "4px 0 0" }}>
                        USER JOURNEY MAP {ctx.type === "refined" && <span style={{ color: C.ready }}>[REFINED ✓]</span>}
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
            {isLoading && nodes.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: C.accentMid }}>
                    <p style={{ letterSpacing: "0.2em" }}>&gt; PLOTTING USER JOURNEY...</p>
                </div>
            ) : (
                <div style={{ height: "450px", border: `1px solid ${C.cardBorder}`, background: "rgba(8,25,90,0.4)", position: "relative" }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        fitView
                        style={{ background: "transparent" }}
                    >
                        <Background color="rgba(255,255,255,0.05)" gap={20} />
                        <Controls />
                    </ReactFlow>
                </div>
            )}

            {/* Step count annotation */}
            {nodes.length > 0 && (
                <p style={{
                    fontSize: "9px", color: C.whiteGhost, textAlign: "right",
                    margin: "8px 0 0", letterSpacing: "0.1em",
                }}>
                    {`TOTAL_STEPS: ${nodes.length} // USER_JOURNEY_NODES`}
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
