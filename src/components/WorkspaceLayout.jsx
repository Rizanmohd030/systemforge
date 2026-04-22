"use client"

import { useRef } from "react"

const C = {
  white: "rgba(255,255,255,1)",
  whiteHi: "rgba(255,255,255,0.92)",
  whiteMid: "rgba(255,255,255,0.60)",
  whiteLow: "rgba(255,255,255,0.35)",
  whiteGhost: "rgba(255,255,255,0.10)",
  accent: "rgba(120,180,255,1)",
  accentMid: "rgba(120,180,255,0.55)",
  ready: "rgba(100,220,255,1)",
}

/**
 * WorkspaceLayout — Wraps module content with blueprint-style visual elements
 * @param {Object} props
 * @param {React.ReactNode} props.children - Module content to wrap
 * @param {string} props.moduleCode - e.g., "01", "02" (for header)
 * @param {string} props.moduleLabel - e.g., "IDEA REFINEMENT"
 * @param {string} props.description - Brief module description
 * @param {boolean} props.showGrid - Show interactive grid backdrop (default: true)
 */
export default function WorkspaceLayout({ 
  children, 
  moduleCode = "00", 
  moduleLabel = "MODULE",
  description = "System Design Module",
  showGrid = true
}) {
  const containerRef = useRef(null)

  return (
    <main 
      ref={containerRef}
      style={{ 
        position: "relative", 
        minHeight: "100vh", 
        background: "rgba(4,12,45,1)", 
        color: C.whiteHi,
        fontFamily: "monospace",
        overflow: "hidden"
      }}
    >
      {/* ─── INTERACTIVE GRID ─────────────────────────────────────────────────── */}
      {showGrid && (
        <>
          {/* Grid background */}
          <svg 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              pointerEvents: "none"
            }}
          >
            <defs>
              <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(120,180,255,0.05)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* TOP SCALE */}
          <div 
            style={{
              position: "fixed",
              top: "24px",
              left: 0,
              right: 0,
              display: "grid",
              gridTemplateColumns: "repeat(13, 80px)",
              justifyContent: "center",
              fontSize: "8px",
              color: "rgba(255,255,255,0.22)",
              opacity: 1,
              zIndex: 1,
              pointerEvents: "none"
            }}
          >
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(n => (
              <span key={n} style={{ fontFamily: "monospace", fontWeight: 500 }}>{n}</span>
            ))}
          </div>

          {/* LEFT SCALE */}
          <div 
            style={{
              position: "fixed",
              left: "24px",
              top: 0,
              bottom: 0,
              display: "grid",
              gridTemplateRows: "repeat(13, 80px)",
              alignContent: "center",
              fontSize: "8px",
              color: "rgba(255,255,255,0.22)",
              opacity: 1,
              zIndex: 1,
              pointerEvents: "none"
            }}
          >
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(n => (
              <span key={n} style={{ fontFamily: "monospace", fontWeight: 500 }}>{n}</span>
            ))}
          </div>

          {/* CORNER MARKERS */}
          <div style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            width: "12px",
            height: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRight: "none",
            borderBottom: "none",
            zIndex: 1,
            pointerEvents: "none"
          }} />
          <div style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            width: "12px",
            height: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderLeft: "none",
            borderBottom: "none",
            zIndex: 1,
            pointerEvents: "none"
          }} />
          <div style={{
            position: "fixed",
            bottom: "16px",
            left: "16px",
            width: "12px",
            height: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRight: "none",
            borderTop: "none",
            zIndex: 1,
            pointerEvents: "none"
          }} />
          <div style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            width: "12px",
            height: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderLeft: "none",
            borderTop: "none",
            zIndex: 1,
            pointerEvents: "none"
          }} />

          {/* L-SHAPED WORKSPACE INDICATOR (bottom-left) */}
          <div 
            style={{
              position: "fixed",
              bottom: "24px",
              left: "24px",
              zIndex: 5,
              pointerEvents: "none"
            }}
          >
            <div style={{
              width: "140px",
              height: "120px",
              position: "relative",
              borderLeft: "1.5px solid rgba(255,255,255,0.15)",
              borderBottom: "1.5px solid rgba(255,255,255,0.15)",
            }}>
              <div style={{
                position: "absolute",
                bottom: "-3px",
                left: "-3px",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "rgba(120,180,255,0.6)",
                boxShadow: "0 0 8px rgba(120,180,255,0.4)",
              }} />
              <div style={{
                position: "absolute",
                top: "0",
                left: "-6px",
                width: "11px",
                height: "1px",
                background: "rgba(255,255,255,0.2)",
              }} />
              <div style={{
                position: "absolute",
                bottom: "-5px",
                right: "0",
                width: "1px",
                height: "11px",
                background: "rgba(255,255,255,0.2)",
              }} />
              <div style={{
                position: "absolute",
                bottom: "10px",
                left: "12px",
                fontSize: "8px",
                color: "rgba(255,255,255,0.25)",
                letterSpacing: "0.12em",
                lineHeight: "1.8",
                textTransform: "uppercase",
                fontFamily: "monospace"
              }}>
                <div>Workspace_v1.4</div>
                <div>Module: {moduleCode}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── HEADER ───────────────────────────────────────────────────────────── */}
      <div 
        style={{
          position: "relative",
          top: "80px",
          textAlign: "center",
          zIndex: 20,
          pointerEvents: "none",
          marginBottom: "40px"
        }}
      >
        <div style={{ fontSize: "13px", letterSpacing: "0.15em", color: C.accent, textTransform: "uppercase", marginBottom: "8px" }}>
          [{moduleCode}]
        </div>
        <h1 style={{
          fontSize: "24px",
          letterSpacing: "0.18em",
          color: C.white,
          margin: 0,
          fontWeight: 500,
          textTransform: "uppercase"
        }}>
          {moduleLabel}
        </h1>
        <p style={{ fontSize: "12px", color: C.whiteMid, letterSpacing: "0.08em", marginTop: "12px" }}>
          {description}
        </p>
      </div>

      {/* ─── CONTENT ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {children}
      </div>

      {/* ─── FOOTER ───────────────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 10,
        textAlign: "center",
        whiteSpace: "nowrap"
      }}>
        <a
          href="https://rizanmi.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
            transition: "color 0.3s ease",
            fontSize: "11px",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            color: C.white,
            textTransform: "uppercase",
            fontWeight: 500
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
          onMouseLeave={e => e.currentTarget.style.color = C.white}
        >
          ARCHITECT: RIZAN
        </a>
      </div>
    </main>
  )
}
