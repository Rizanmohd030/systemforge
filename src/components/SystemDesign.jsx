"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectStore } from "@/store/projectStore"

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

// ─── METHOD COLORS ────────────────────────────────────────────────────────────
const METHOD_COLORS = {
    GET:    { bg: "rgba(100,220,255,0.15)", border: "rgba(100,220,255,0.5)", text: "rgba(100,220,255,1)" },
    POST:   { bg: "rgba(100,255,150,0.15)", border: "rgba(100,255,150,0.5)", text: "rgba(100,255,150,1)" },
    PUT:    { bg: "rgba(255,200,80,0.15)",  border: "rgba(255,200,80,0.5)",  text: "rgba(255,200,80,1)" },
    PATCH:  { bg: "rgba(200,160,255,0.15)", border: "rgba(200,160,255,0.5)", text: "rgba(200,160,255,1)" },
    DELETE: { bg: "rgba(255,100,100,0.15)", border: "rgba(255,100,100,0.5)", text: "rgba(255,100,100,1)" },
}

// ─── CONSTRAINT COLORS ────────────────────────────────────────────────────────
const getConstraintStyle = (constraint) => {
    const c = constraint.toUpperCase()
    if (c.includes("PRIMARY"))  return { bg: "rgba(120,180,255,0.15)", text: "rgba(120,180,255,0.9)" }
    if (c.includes("FOREIGN"))  return { bg: "rgba(200,160,255,0.15)", text: "rgba(200,160,255,0.9)" }
    if (c.includes("UNIQUE"))   return { bg: "rgba(100,220,255,0.15)", text: "rgba(100,220,255,0.9)" }
    if (c.includes("NOT NULL")) return { bg: "rgba(255,255,255,0.06)", text: "rgba(255,255,255,0.4)" }
    return { bg: "rgba(255,255,255,0.04)", text: "rgba(255,255,255,0.35)" }
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_DATA = {
    databaseSchema: [
        {
            tableName: "users",
            description: "Core user accounts and authentication data",
            columns: [
                { name: "id", type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" },
                { name: "email", type: "VARCHAR(255)", constraints: "UNIQUE NOT NULL" },
                { name: "password_hash", type: "TEXT", constraints: "NOT NULL" },
                { name: "display_name", type: "VARCHAR(100)", constraints: "NOT NULL" },
                { name: "role", type: "VARCHAR(20)", constraints: "DEFAULT 'user'" },
                { name: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW()" },
                { name: "updated_at", type: "TIMESTAMP", constraints: "DEFAULT NOW()" },
            ],
            relationships: []
        },
        {
            tableName: "projects",
            description: "User-created projects and their metadata",
            columns: [
                { name: "id", type: "UUID", constraints: "PRIMARY KEY DEFAULT gen_random_uuid()" },
                { name: "user_id", type: "UUID", constraints: "FOREIGN KEY → users.id NOT NULL" },
                { name: "title", type: "VARCHAR(200)", constraints: "NOT NULL" },
                { name: "description", type: "TEXT", constraints: "" },
                { name: "status", type: "VARCHAR(20)", constraints: "DEFAULT 'draft'" },
                { name: "created_at", type: "TIMESTAMP", constraints: "DEFAULT NOW()" },
                { name: "updated_at", type: "TIMESTAMP", constraints: "DEFAULT NOW()" },
            ],
            relationships: ["users.id"]
        },
    ],
    apiEndpoints: [
        {
            resource: "Auth",
            endpoints: [
                { method: "POST", path: "/api/auth/register", description: "Create a new user account", authRequired: false },
                { method: "POST", path: "/api/auth/login", description: "Authenticate and receive JWT", authRequired: false },
                { method: "POST", path: "/api/auth/logout", description: "Invalidate session token", authRequired: true },
            ]
        },
        {
            resource: "Projects",
            endpoints: [
                { method: "GET", path: "/api/projects", description: "List all projects for authenticated user", authRequired: true },
                { method: "POST", path: "/api/projects", description: "Create a new project", authRequired: true },
                { method: "GET", path: "/api/projects/:id", description: "Get project details", authRequired: true },
                { method: "PUT", path: "/api/projects/:id", description: "Update project details", authRequired: true },
                { method: "DELETE", path: "/api/projects/:id", description: "Delete a project", authRequired: true },
            ]
        },
    ],
    services: [
        {
            name: "Auth Service",
            responsibility: "User authentication, authorization, and session management",
            ownsAPIs: ["Auth"],
            ownsTables: ["users"],
            dependsOn: []
        },
        {
            name: "Project Service",
            responsibility: "CRUD operations and business logic for projects",
            ownsAPIs: ["Projects"],
            ownsTables: ["projects"],
            dependsOn: ["Auth Service"]
        },
    ]
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SystemDesign({ productDetails }) {
    const [design, setDesign] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isMock, setIsMock] = useState(false)
    const [feedback, setFeedback] = useState("")
    const [activeTab, setActiveTab] = useState("schema")
    const { getCurrentContext, setSystemDesign, systemDesign } = useProjectStore()
    const ctx = getCurrentContext()
    const hasRun = useRef(false)

    const handleGenerate = async (bust = false, feedbackText = "") => {
        setIsLoading(true)
        setError("")
        setIsMock(false)

        if (!bust && systemDesign && !feedbackText) {
            setDesign(systemDesign)
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/langchain/systemdesign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ context: ctx, feedback: feedbackText }),
            })

            if (!res.ok) throw new Error("Failed to fetch system design")

            const data = await res.json()
            setSystemDesign(data)
            setDesign(data)
        } catch (err) {
            console.error("System Design generation failed:", err)
            setDesign(MOCK_DATA)
            setIsMock(true)
            setError("Failed to generate system design. Falling back to simulated data.")
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

    const handleFeedbackSubmit = () => {
        if (!feedback.trim() || isLoading) return
        handleGenerate(true, feedback)
        setFeedback("")
    }

    const TABS = [
        { id: "schema", label: "DB SCHEMA", count: design?.databaseSchema?.length },
        { id: "api", label: "API ENDPOINTS", count: design?.apiEndpoints?.reduce((a, g) => a + g.endpoints.length, 0) },
        { id: "services", label: "SERVICES", count: design?.services?.length },
    ]

    return (
        <section style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            fontFamily: "monospace",
            color: C.whiteHi,
            padding: "40px 60px",
            margin: "0"
        }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <p style={{ fontSize: "10px", color: C.whiteLow, margin: 0, letterSpacing: "0.1em" }}>
                        {`// SYSTEM DESIGN ENGINE`}
                    </p>
                    <h3 style={{ fontSize: "14px", color: C.white, margin: "4px 0 0" }}>
                        INTERNAL ARCHITECTURE {ctx.type === "refined" && <span style={{ color: C.ready }}>[REFINED ✓]</span>}
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
                            fontFamily: "monospace",
                        }}
                    >
                        {isLoading ? "[ DESIGNING... ]" : "[ RE-DESIGN ]"}
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && !design ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: C.accentMid }}>
                    <p style={{ letterSpacing: "0.2em" }}>&gt; ENGINEERING SYSTEM INTERNALS...</p>
                    <div className="loading-pulse" style={{ width: "100%", height: "2px", background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, marginTop: "20px" }} />
                </div>
            ) : design ? (
                <>
                    {/* Tab Navigation */}
                    <div style={{
                        display: "flex", gap: "0",
                        borderBottom: `1px solid ${C.cardBorder}`,
                    }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: activeTab === tab.id ? "rgba(255,255,255,0.06)" : "transparent",
                                    border: "none",
                                    borderBottom: activeTab === tab.id ? `2px solid ${C.accent}` : "2px solid transparent",
                                    color: activeTab === tab.id ? C.white : C.whiteLow,
                                    padding: "10px 20px",
                                    fontSize: "10px",
                                    letterSpacing: "0.1em",
                                    fontFamily: "monospace",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex", alignItems: "center", gap: "8px",
                                }}
                            >
                                {tab.label}
                                {tab.count != null && (
                                    <span style={{
                                        fontSize: "9px",
                                        background: activeTab === tab.id ? C.accentLow : C.whiteGhost,
                                        color: activeTab === tab.id ? C.accent : C.whiteLow,
                                        padding: "2px 6px",
                                        borderRadius: "2px",
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ minHeight: "400px" }}>
                        {activeTab === "schema" && <DatabaseSchemaView tables={design.databaseSchema} />}
                        {activeTab === "api" && <APIEndpointsView groups={design.apiEndpoints} />}
                        {activeTab === "services" && <ServicesView services={design.services} />}
                    </div>

                    {/* Feedback Section */}
                    <div style={{ border: `1px solid ${C.cardBorder}`, background: C.cardBg, padding: "20px" }}>
                        <p style={{ fontSize: "10px", color: C.whiteLow, marginBottom: "12px", letterSpacing: "0.1em", margin: "0 0 12px 0" }}>
                            {"// DESIGN FEEDBACK"}
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                type="text"
                                value={feedback}
                                onChange={e => setFeedback(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleFeedbackSubmit()}
                                placeholder="Refine the design... (e.g. 'Add a notifications table', 'Use GraphQL')"
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
                                disabled={isLoading || !feedback.trim()}
                                style={{
                                    background: feedback.trim() ? C.whiteHi : "rgba(255,255,255,0.1)",
                                    color: feedback.trim() ? "black" : C.whiteLow,
                                    border: "none",
                                    padding: "0 25px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                    cursor: feedback.trim() && !isLoading ? "pointer" : "not-allowed",
                                    fontFamily: "monospace",
                                    opacity: feedback.trim() ? 1 : 0.5,
                                }}
                            >
                                RE-DESIGN
                            </button>
                        </div>
                    </div>
                </>
            ) : null}

            {/* Error */}
            {error && (
                <div style={{ color: C.error, fontSize: "12px", background: "rgba(255,100,100,0.1)", padding: "10px 20px", border: `1px solid ${C.error}` }}>
                    {error}
                </div>
            )}

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


// ─── DATABASE SCHEMA VIEW ─────────────────────────────────────────────────────
function DatabaseSchemaView({ tables }) {
    if (!tables?.length) return <EmptyState text="No tables generated." />

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {tables.map((table, idx) => (
                <div key={idx} style={{
                    border: `1px solid ${C.cardBorder}`,
                    background: C.cardBg,
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                }}>
                    {/* Table Header */}
                    <div style={{
                        padding: "14px 18px",
                        borderBottom: `1px solid ${C.whiteGhost}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "rgba(120,180,255,0.06)",
                    }}>
                        <div>
                            <p style={{ fontSize: "14px", color: C.white, margin: 0, fontWeight: 600 }}>
                                {table.tableName}
                            </p>
                            <p style={{ fontSize: "10px", color: C.whiteMid, margin: "2px 0 0", lineHeight: "1.4" }}>
                                {table.description}
                            </p>
                        </div>
                        <span style={{
                            fontSize: "9px", color: C.whiteLow,
                            background: C.whiteGhost,
                            padding: "3px 8px",
                            letterSpacing: "0.05em",
                        }}>
                            {table.columns.length} COL
                        </span>
                    </div>

                    {/* Columns */}
                    <div style={{ padding: "0" }}>
                        {table.columns.map((col, ci) => (
                            <div key={ci} style={{
                                display: "flex", alignItems: "center", gap: "10px",
                                padding: "8px 18px",
                                borderBottom: ci < table.columns.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                                fontSize: "11px",
                            }}>
                                {/* Column Name */}
                                <span style={{
                                    color: col.constraints.toUpperCase().includes("PRIMARY") ? C.accent : C.whiteHi,
                                    fontWeight: col.constraints.toUpperCase().includes("PRIMARY") ? 600 : 400,
                                    minWidth: "120px",
                                }}>
                                    {col.name}
                                </span>

                                {/* Type */}
                                <span style={{
                                    color: C.whiteMid,
                                    fontSize: "10px",
                                    minWidth: "100px",
                                    opacity: 0.8,
                                }}>
                                    {col.type}
                                </span>

                                {/* Constraints as tiny badges */}
                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
                                    {col.constraints && col.constraints.split(/(?=PRIMARY|FOREIGN|UNIQUE|NOT NULL|DEFAULT)/i)
                                        .map(c => c.trim()).filter(Boolean)
                                        .slice(0, 3) // max 3 badges
                                        .map((c, ki) => {
                                            const style = getConstraintStyle(c)
                                            return (
                                                <span key={ki} style={{
                                                    fontSize: "7px",
                                                    padding: "2px 5px",
                                                    background: style.bg,
                                                    color: style.text,
                                                    letterSpacing: "0.04em",
                                                    whiteSpace: "nowrap",
                                                }}>
                                                    {c.length > 14 ? c.slice(0, 14) + "…" : c}
                                                </span>
                                            )
                                        })
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Relationships */}
                    {table.relationships?.length > 0 && (
                        <div style={{
                            padding: "8px 18px",
                            borderTop: `1px solid ${C.whiteGhost}`,
                            background: "rgba(200,160,255,0.04)",
                        }}>
                            <span style={{ fontSize: "8px", color: "rgba(200,160,255,0.7)", letterSpacing: "0.08em" }}>
                                FK → {table.relationships.join(", ")}
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}


// ─── API ENDPOINTS VIEW ───────────────────────────────────────────────────────
function APIEndpointsView({ groups }) {
    if (!groups?.length) return <EmptyState text="No endpoints generated." />

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {groups.map((group, gi) => (
                <div key={gi} style={{
                    border: `1px solid ${C.cardBorder}`,
                    background: C.cardBg,
                    overflow: "hidden",
                }}>
                    {/* Resource Header */}
                    <div style={{
                        padding: "12px 18px",
                        borderBottom: `1px solid ${C.whiteGhost}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "rgba(120,180,255,0.04)",
                    }}>
                        <p style={{ fontSize: "12px", color: C.white, margin: 0, fontWeight: 600, letterSpacing: "0.06em" }}>
                            {group.resource}
                        </p>
                        <span style={{ fontSize: "9px", color: C.whiteLow, letterSpacing: "0.1em" }}>
                            {group.endpoints.length} ENDPOINT{group.endpoints.length !== 1 ? "S" : ""}
                        </span>
                    </div>

                    {/* Endpoints */}
                    {group.endpoints.map((ep, ei) => {
                        const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET
                        return (
                            <div key={ei} style={{
                                display: "flex", alignItems: "center", gap: "14px",
                                padding: "10px 18px",
                                borderBottom: ei < group.endpoints.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                            }}>
                                {/* Method Badge */}
                                <span style={{
                                    fontSize: "9px", fontWeight: 700,
                                    padding: "3px 8px",
                                    background: mc.bg,
                                    border: `1px solid ${mc.border}`,
                                    color: mc.text,
                                    letterSpacing: "0.06em",
                                    minWidth: "52px", textAlign: "center",
                                }}>
                                    {ep.method}
                                </span>

                                {/* Path */}
                                <span style={{
                                    fontSize: "12px", color: C.whiteHi,
                                    fontWeight: 500, minWidth: "200px",
                                }}>
                                    {ep.path}
                                </span>

                                {/* Description */}
                                <span style={{
                                    fontSize: "10px", color: C.whiteMid,
                                    flex: 1,
                                }}>
                                    {ep.description}
                                </span>

                                {/* Auth Badge */}
                                <span style={{
                                    fontSize: "7px",
                                    padding: "2px 6px",
                                    background: ep.authRequired ? "rgba(255,200,80,0.1)" : "rgba(100,255,150,0.08)",
                                    color: ep.authRequired ? "rgba(255,200,80,0.8)" : "rgba(100,255,150,0.6)",
                                    border: `1px solid ${ep.authRequired ? "rgba(255,200,80,0.3)" : "rgba(100,255,150,0.2)"}`,
                                    letterSpacing: "0.06em",
                                    whiteSpace: "nowrap",
                                }}>
                                    {ep.authRequired ? "🔒 AUTH" : "PUBLIC"}
                                </span>
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}


// ─── SERVICES VIEW ────────────────────────────────────────────────────────────
function ServicesView({ services }) {
    if (!services?.length) return <EmptyState text="No services generated." />

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {services.map((svc, si) => (
                <div key={si} style={{
                    border: `1px solid ${C.cardBorder}`,
                    background: C.cardBg,
                    padding: "20px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Service index */}
                    <span style={{
                        position: "absolute", top: "8px", right: "12px",
                        fontSize: "32px", fontWeight: 700,
                        color: "rgba(255,255,255,0.04)",
                        lineHeight: 1,
                    }}>
                        {String(si + 1).padStart(2, "0")}
                    </span>

                    {/* Name */}
                    <p style={{
                        fontSize: "14px", color: C.white, margin: "0 0 6px",
                        fontWeight: 600, letterSpacing: "0.04em",
                    }}>
                        {svc.name}
                    </p>

                    {/* Responsibility */}
                    <p style={{
                        fontSize: "11px", color: C.whiteMid, margin: "0 0 16px",
                        lineHeight: "1.5",
                    }}>
                        {svc.responsibility}
                    </p>

                    {/* Ownership */}
                    <div style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
                        <div>
                            <p style={{ fontSize: "8px", color: C.whiteLow, margin: "0 0 4px", letterSpacing: "0.1em" }}>OWNS APIs</p>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {svc.ownsAPIs.map((api, i) => (
                                    <span key={i} style={{
                                        fontSize: "9px", padding: "2px 8px",
                                        background: C.accentLow, color: C.accent,
                                    }}>
                                        {api}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: "8px", color: C.whiteLow, margin: "0 0 4px", letterSpacing: "0.1em" }}>OWNS TABLES</p>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {svc.ownsTables.map((t, i) => (
                                    <span key={i} style={{
                                        fontSize: "9px", padding: "2px 8px",
                                        background: "rgba(200,160,255,0.12)", color: "rgba(200,160,255,0.85)",
                                    }}>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dependencies */}
                    {svc.dependsOn?.length > 0 && (
                        <div style={{
                            paddingTop: "10px",
                            borderTop: `1px solid ${C.whiteGhost}`,
                        }}>
                            <p style={{ fontSize: "8px", color: C.whiteLow, margin: "0 0 4px", letterSpacing: "0.1em" }}>DEPENDS ON</p>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {svc.dependsOn.map((dep, i) => (
                                    <span key={i} style={{
                                        fontSize: "9px", padding: "2px 8px",
                                        background: "rgba(255,200,80,0.1)", color: "rgba(255,200,80,0.75)",
                                        border: "1px solid rgba(255,200,80,0.2)",
                                    }}>
                                        ← {dep}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}


// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState({ text }) {
    return (
        <div style={{
            padding: "60px 0", textAlign: "center",
            color: C.whiteLow, fontSize: "12px", letterSpacing: "0.1em",
        }}>
            {text}
        </div>
    )
}
