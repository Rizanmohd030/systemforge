"use client"

import { useState, useEffect, useRef } from "react"
import { useProjectStore } from "@/store/projectStore"

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C = {
  white:      "rgba(255,255,255,1)",
  whiteHi:    "rgba(255,255,255,0.92)",
  whiteMid:   "rgba(255,255,255,0.60)",
  whiteLow:   "rgba(255,255,255,0.35)",
  whiteGhost: "rgba(255,255,255,0.10)",
  accent:     "rgba(120,180,255,1)",
  accentMid:  "rgba(120,180,255,0.55)",
  accentLow:  "rgba(120,180,255,0.15)",
  ready:      "rgba(100,220,255,1)",
  warn:       "rgba(255,200,80,0.9)",
  error:      "rgba(255,100,100,0.9)",
  success:    "rgba(100,220,150,1)",
  successLow: "rgba(100,220,150,0.15)",
  cardBg:     "rgba(8,25,90,0.70)",
  cardBorder: "rgba(255,255,255,0.18)",
  // Domain-specific accent
  business:   "rgba(120,255,160,1)",
  creative:   "rgba(220,140,255,1)",
}

// ─── SEVERITY COLORS ──────────────────────────────────────────────────────────
const SEVERITY = {
  LOW:      { color: "rgba(100,220,150,1)",   bg: "rgba(100,220,150,0.10)" },
  MEDIUM:   { color: "rgba(255,200,80,1)",    bg: "rgba(255,200,80,0.10)"  },
  HIGH:     { color: "rgba(255,130,60,1)",    bg: "rgba(255,130,60,0.10)"  },
  CRITICAL: { color: "rgba(255,80,80,1)",     bg: "rgba(255,80,80,0.10)"   },
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ label, icon, children, accent = C.ready }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.015)",
      border: `1px solid ${C.cardBorder}`,
      borderRadius: "8px",
      padding: "28px 24px",
      backdropFilter: "blur(4px)",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}>
      <p style={{
        fontSize: "11px",
        color: accent,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        margin: 0,
        fontWeight: 600,
      }}>
        {icon} {label}
      </p>
      {children}
    </div>
  )
}

// ─── COMPETITOR CARD ──────────────────────────────────────────────────────────
function CompetitorCard({ comp, index, isCreative }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: expanded ? "rgba(20,60,160,0.25)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${expanded ? C.accent : C.cardBorder}`,
        borderRadius: "6px",
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        if (!expanded) e.currentTarget.style.borderColor = C.accentMid
        e.currentTarget.style.background = "rgba(20,60,160,0.18)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = expanded ? C.accent : C.cardBorder
        e.currentTarget.style.background = expanded ? "rgba(20,60,160,0.25)" : "rgba(255,255,255,0.02)"
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "9px", color: C.whiteLow, fontFamily: "monospace" }}>
              {`// COMPETITOR ${String(index + 1).padStart(2, "0")}`}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: C.white, fontWeight: 600, margin: 0, letterSpacing: "0.02em" }}>
            {comp.name}
          </p>
          <p style={{ fontSize: "11px", color: C.whiteMid, margin: "6px 0 0 0", lineHeight: "1.5" }}>
            {comp.description}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "16px" }}>
          <p style={{ fontSize: "10px", color: C.accent, fontWeight: 600, margin: 0, letterSpacing: "0.05em" }}>
            {comp.pricing}
          </p>
          <p style={{ fontSize: "9px", color: C.whiteLow, margin: "4px 0 0 0" }}>
            {expanded ? "▲ COLLAPSE" : "▼ EXPAND"}
          </p>
        </div>
      </div>

      {/* Expanded strengths / weaknesses */}
      {expanded && (
        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* Strengths */}
          <div>
            <p style={{ fontSize: "9px", color: C.success, letterSpacing: "0.12em", margin: "0 0 8px 0", fontWeight: 600 }}>
              ▲ STRENGTHS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {comp.strengths.map((s, i) => (
                <p key={i} style={{ fontSize: "10px", color: C.whiteMid, margin: 0, lineHeight: "1.4" }}>
                  + {s}
                </p>
              ))}
            </div>
          </div>
          {/* Weaknesses */}
          <div>
            <p style={{ fontSize: "9px", color: C.warn, letterSpacing: "0.12em", margin: "0 0 8px 0", fontWeight: 600 }}>
              ▼ WEAKNESSES
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {comp.weaknesses.map((w, i) => (
                <p key={i} style={{ fontSize: "10px", color: C.whiteMid, margin: 0, lineHeight: "1.4" }}>
                  − {w}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MARKET SIZE RING ─────────────────────────────────────────────────────────
function MarketSizeRow({ label, value, fill, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <div style={{ width: "36px", flexShrink: 0, textAlign: "right" }}>
        <span style={{ fontSize: "9px", color: C.whiteLow, letterSpacing: "0.08em", fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{
          width: `${fill}%`,
          height: "100%",
          background: color,
          borderRadius: "3px",
          boxShadow: `0 0 8px ${color}`,
          transition: "width 1s ease",
        }} />
      </div>
      <div style={{ width: "200px", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: C.whiteMid }}>{value}</span>
      </div>
    </div>
  )
}

// ─── GROUNDING SOURCES ────────────────────────────────────────────────────────
function GroundingSources({ sources, queries }) {
  const [showSources, setShowSources] = useState(false)
  if (!sources?.length && !queries?.length) return null

  return (
    <div style={{
      border: `1px solid rgba(120,180,255,0.15)`,
      borderRadius: "6px",
      padding: "12px 16px",
      background: "rgba(120,180,255,0.04)",
    }}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
        onClick={() => setShowSources(s => !s)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "9px", color: C.accent, letterSpacing: "0.12em", fontWeight: 600 }}>
            🌐 GROUNDED BY GOOGLE SEARCH
          </span>
          <span style={{
            fontSize: "8px",
            background: "rgba(120,180,255,0.15)",
            border: "1px solid rgba(120,180,255,0.25)",
            color: C.accent,
            padding: "1px 6px",
            borderRadius: "10px",
          }}>
            {sources.length} source{sources.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span style={{ fontSize: "9px", color: C.whiteLow }}>
          {showSources ? "▲ HIDE" : "▼ VIEW SOURCES"}
        </span>
      </div>

      {showSources && (
        <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {queries.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "9px", color: C.whiteLow, margin: "0 0 6px 0", letterSpacing: "0.08em" }}>
                SEARCH QUERIES USED:
              </p>
              {queries.map((q, i) => (
                <p key={i} style={{ fontSize: "10px", color: C.whiteMid, margin: "0 0 2px 0" }}>› {q}</p>
              ))}
            </div>
          )}
          {sources.map((s, i) => s?.uri ? (
            <a
              key={i}
              href={s.uri}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "10px",
                color: C.accent,
                textDecoration: "none",
                display: "block",
                padding: "4px 0",
                borderBottom: i < sources.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              ↗ {s.title || s.uri}
            </a>
          ) : null)}
        </div>
      )}
    </div>
  )
}

// ─── LOADING STATE ────────────────────────────────────────────────────────────
function LoadingState({ isCreative }) {
  const steps = isCreative
    ? ["SEARCHING WEB FOR AUDIENCE DATA...", "SCANNING CREATIVE MARKETS...", "ANALYZING COMPETITORS...", "BUILDING RESEARCH REPORT..."]
    : ["SEARCHING WEB FOR MARKET DATA...", "SCANNING COMPETITOR LANDSCAPE...", "ANALYZING PRICING BENCHMARKS...", "BUILDING INTELLIGENCE REPORT..."]

  const [stepIdx, setStepIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setStepIdx(i => (i + 1) % steps.length), 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ textAlign: "center", paddingTop: "80px", fontFamily: "monospace" }}>
      <div style={{ marginBottom: "30px" }}>
        {/* Search grounding indicator */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 20px",
          border: "1px solid rgba(120,180,255,0.3)",
          background: "rgba(120,180,255,0.06)",
          borderRadius: "20px",
          marginBottom: "24px",
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: C.accent,
            boxShadow: `0 0 12px ${C.accent}`,
            animation: "searchPulse 1s ease-in-out infinite",
            display: "inline-block",
          }} />
          <span style={{ fontSize: "10px", color: C.accent, letterSpacing: "0.15em" }}>
            GOOGLE SEARCH GROUNDING ACTIVE
          </span>
        </div>
      </div>

      <p style={{ fontSize: "14px", color: C.accentMid, letterSpacing: "0.18em", marginBottom: "16px" }}>
        {steps[stepIdx]}
      </p>
      <div style={{
        width: "280px",
        height: "2px",
        background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`,
        margin: "0 auto",
        animation: "scanLine 1.5s ease-in-out infinite",
      }} />
      <p style={{ fontSize: "10px", color: C.whiteLow, marginTop: "20px", letterSpacing: "0.08em" }}>
        This may take 15–30 seconds. Gemini is querying live web data.
      </p>

      <style>{`
        @keyframes searchPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes scanLine {
          0%   { opacity: 0.3; transform: scaleX(0.4); }
          50%  { opacity: 1;   transform: scaleX(1); }
          100% { opacity: 0.3; transform: scaleX(0.4); }
        }
      `}</style>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MarketResearch({ productDetails }) {
  const {
    idea: globalIdea,
    blueprintV1,
    moduleConfig,
    marketResearch: cachedResearch,
    setMarketResearch,
  } = useProjectStore()

  const rawIdea = typeof productDetails === "string" ? productDetails : globalIdea || ""
  const domain  = moduleConfig?.domain || "business"
  const isCreative = domain === "creative"

  const [research, setResearch] = useState(cachedResearch || null)
  const [grounding, setGrounding] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const hasRun = useRef(false)

  // Labels adapt to creative domain
  const LABELS = isCreative ? {
    moduleTitle:     "AUDIENCE RESEARCH",
    competitorLabel: "COMPARABLE WORKS",
    gtmLabel:        "DISTRIBUTION CHANNELS",
    riskLabel:       "EXECUTION RISKS",
    customerLabel:   "TARGET AUDIENCE",
    marketLabel:     "AUDIENCE MARKET SIZE",
    pricingLabel:    "PRICING MODELS",
    accent:          C.creative,
  } : {
    moduleTitle:     "MARKET RESEARCH",
    competitorLabel: "COMPETITOR LANDSCAPE",
    gtmLabel:        "GO-TO-MARKET CHANNELS",
    riskLabel:       "RISK FLAGS",
    customerLabel:   "TARGET CUSTOMER",
    marketLabel:     "MARKET SIZE",
    pricingLabel:    "PRICING BENCHMARK",
    accent:          C.business,
  }

  useEffect(() => {
    if (cachedResearch) {
      setResearch(cachedResearch)
      return
    }
    if (hasRun.current) return
    hasRun.current = true
    if (rawIdea) fetchResearch()
  }, [rawIdea, cachedResearch])

  const fetchResearch = async () => {
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/langchain/market-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: rawIdea,
          blueprintV1: blueprintV1 || null,
          domain,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Request failed (${res.status})`)
      }

      const payload = await res.json()
      if (!payload.success) throw new Error(payload.error || "Unknown error")

      setResearch(payload.data)
      setGrounding(payload.grounding)

      // Persist to Zustand (and localStorage via partialize)
      setMarketResearch(payload.data)

    } catch (err) {
      setError(err.message || "Failed to generate market research")
    } finally {
      setIsLoading(false)
    }
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (isLoading) return <LoadingState isCreative={isCreative} />

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (error && !research) {
    return (
      <section style={{ fontFamily: "monospace", color: C.whiteHi, padding: "60px 80px" }}>
        <div style={{
          border: `1px solid ${C.error}`,
          background: "rgba(255,100,100,0.06)",
          borderRadius: "8px",
          padding: "28px 24px",
        }}>
          <p style={{ fontSize: "11px", color: C.error, margin: "0 0 8px 0", letterSpacing: "0.12em" }}>
            ✕ MARKET RESEARCH FAILED
          </p>
          <p style={{ fontSize: "12px", color: C.whiteMid, margin: "0 0 20px 0" }}>{error}</p>
          <button
            onClick={() => { hasRun.current = false; fetchResearch() }}
            style={{
              background: "rgba(255,100,100,0.15)",
              border: `1px solid ${C.error}`,
              color: C.error,
              padding: "8px 20px",
              fontFamily: "monospace",
              fontSize: "10px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              borderRadius: "4px",
              transition: "all 0.2s",
            }}
          >
            [ RETRY ]
          </button>
        </div>
      </section>
    )
  }

  // ── EMPTY ──────────────────────────────────────────────────────────────────
  if (!research) return null

  const r = research

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <section style={{
      fontFamily: "monospace",
      color: C.whiteHi,
      padding: "60px 80px",
      display: "flex",
      flexDirection: "column",
      gap: "32px",
      position: "relative",
      zIndex: 5,
    }}>

      {/* ── MODULE HEADER ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "9px", color: C.whiteLow, margin: "0 0 6px 0", letterSpacing: "0.12em" }}>
            {`// MODULE — ${LABELS.moduleTitle}`}
          </p>
          <h2 style={{ fontSize: "22px", color: C.white, margin: 0, fontWeight: 600, letterSpacing: "0.04em" }}>
            {LABELS.moduleTitle}
          </h2>
        </div>
        <button
          onClick={() => { hasRun.current = false; setResearch(null); fetchResearch() }}
          disabled={isLoading}
          style={{
            background: "transparent",
            border: `1px solid ${C.cardBorder}`,
            color: C.whiteMid,
            padding: "7px 16px",
            fontFamily: "monospace",
            fontSize: "10px",
            cursor: "pointer",
            letterSpacing: "0.06em",
            borderRadius: "4px",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.whiteMid }}
        >
          🔄 REFRESH (LIVE DATA)
        </button>
      </div>

      {/* ── GROUNDING SOURCES BANNER ───────────────────────────────────────── */}
      {grounding && (
        <GroundingSources sources={grounding.sources} queries={grounding.searchQueries} />
      )}

      {/* ── ERROR INLINE (non-fatal) ───────────────────────────────────────── */}
      {error && (
        <p style={{ fontSize: "10px", color: C.warn, margin: 0 }}>⚠ {error}</p>
      )}

      {/* ── ROW 1: COMPETITORS ────────────────────────────────────────────── */}
      <SectionCard label={LABELS.competitorLabel} icon="⚔" accent={LABELS.accent}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {r.competitors.map((comp, i) => (
            <CompetitorCard key={i} comp={comp} index={i} isCreative={isCreative} />
          ))}
        </div>
      </SectionCard>

      {/* ── ROW 2: MARKET SIZE + TARGET CUSTOMER (2-col) ──────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* Market Size */}
        <SectionCard label={LABELS.marketLabel} icon="📊" accent={LABELS.accent}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <MarketSizeRow label="TAM" value={r.market_size.tam} fill={100} color="rgba(120,180,255,0.7)" />
            <MarketSizeRow label="SAM" value={r.market_size.sam} fill={62} color="rgba(120,220,255,0.8)" />
            <MarketSizeRow label="SOM" value={r.market_size.som} fill={28} color={C.ready} />
          </div>
          <div style={{
            marginTop: "4px",
            padding: "12px 14px",
            background: "rgba(120,180,255,0.06)",
            border: "1px solid rgba(120,180,255,0.12)",
            borderRadius: "5px",
          }}>
            <p style={{ fontSize: "11px", color: C.whiteMid, lineHeight: "1.6", margin: 0 }}>
              {r.market_size.summary}
            </p>
          </div>
        </SectionCard>

        {/* Target Customer */}
        <SectionCard label={LABELS.customerLabel} icon="🎯" accent={LABELS.accent}>
          {[
            { k: "Age Range",         v: r.target_customer.age_range },
            { k: "Income Level",      v: r.target_customer.income_level },
            { k: "Location",          v: r.target_customer.location },
            { k: "Pain Point",        v: r.target_customer.pain_point },
            { k: "Buying Behaviour",  v: r.target_customer.buying_behaviour },
          ].map(({ k, v }) => (
            <div key={k} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
              <p style={{ fontSize: "9px", color: C.whiteLow, margin: "0 0 3px 0", letterSpacing: "0.1em" }}>{k.toUpperCase()}</p>
              <p style={{ fontSize: "11px", color: C.whiteHi, margin: 0, lineHeight: "1.5" }}>{v}</p>
            </div>
          ))}
        </SectionCard>
      </div>

      {/* ── ROW 3: PRICING BENCHMARK ──────────────────────────────────────── */}
      <SectionCard label={LABELS.pricingLabel} icon="💲" accent={LABELS.accent}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { tier: "LOW",         value: r.pricing_benchmark.low,         color: C.success,    bg: C.successLow },
            { tier: "MID",         value: r.pricing_benchmark.mid,         color: C.accent,     bg: C.accentLow },
            { tier: "HIGH",        value: r.pricing_benchmark.high,        color: C.warn,       bg: "rgba(255,200,80,0.1)" },
            { tier: "RECOMMENDED", value: r.pricing_benchmark.recommended, color: C.ready,      bg: "rgba(100,220,255,0.08)" },
          ].map(({ tier, value, color, bg }) => (
            <div key={tier} style={{
              border: `1px solid ${color}40`,
              background: bg,
              borderRadius: "6px",
              padding: "14px 16px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "8px", color, margin: "0 0 8px 0", letterSpacing: "0.15em", fontWeight: 600 }}>
                {tier}
              </p>
              <p style={{ fontSize: tier === "RECOMMENDED" ? "11px" : "12px", color, fontWeight: 700, margin: 0, lineHeight: "1.4" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── ROW 4: GO-TO-MARKET + RISK FLAGS (2-col) ──────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

        {/* GTM Channels */}
        <SectionCard label={LABELS.gtmLabel} icon="🚀" accent={LABELS.accent}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {r.go_to_market.map((gtm, i) => (
              <div key={i} style={{
                borderLeft: `2px solid ${LABELS.accent}`,
                paddingLeft: "14px",
              }}>
                <p style={{ fontSize: "11px", color: C.white, fontWeight: 600, margin: "0 0 4px 0" }}>
                  {gtm.channel}
                </p>
                <p style={{ fontSize: "10px", color: C.whiteMid, margin: "0 0 4px 0", lineHeight: "1.4" }}>
                  {gtm.strategy}
                </p>
                <p style={{ fontSize: "9px", color: C.whiteLow, margin: 0, fontStyle: "italic" }}>
                  {gtm.why}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Risk Flags */}
        <SectionCard label={LABELS.riskLabel} icon="⚠" accent={C.warn}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {r.risk_flags.map((risk, i) => {
              const sev = SEVERITY[risk.severity] || SEVERITY.MEDIUM
              return (
                <div key={i} style={{
                  border: `1px solid ${sev.color}30`,
                  background: sev.bg,
                  borderRadius: "6px",
                  padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <p style={{ fontSize: "11px", color: C.white, fontWeight: 600, margin: 0, flex: 1 }}>
                      {risk.risk}
                    </p>
                    <span style={{
                      fontSize: "8px",
                      color: sev.color,
                      border: `1px solid ${sev.color}50`,
                      padding: "2px 7px",
                      borderRadius: "3px",
                      flexShrink: 0,
                      marginLeft: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                    }}>
                      {risk.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: "10px", color: C.whiteMid, margin: 0, lineHeight: "1.4" }}>
                    ↳ {risk.mitigation}
                  </p>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

    </section>
  )
}
