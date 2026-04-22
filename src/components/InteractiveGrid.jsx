"use client"

import { useEffect, useRef } from "react"

/**
 * InteractiveGrid — CSS-mask-based grid spotlight.
 *
 * Renders a brighter copy of the blueprint grid lines, masked behind a
 * radial-gradient spotlight that follows the cursor. The existing faint
 * CSS grid shows through everywhere else. On hover the brighter lines
 * are revealed — exactly like blankverse.co.in's hero grid.
 */
export default function InteractiveGrid({ radius = 250 }) {
  const layerRef = useRef(null)

  useEffect(() => {
    const el = layerRef.current
    if (!el) return

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty("--mx", `${x}px`)
      el.style.setProperty("--my", `${y}px`)
      el.style.opacity = "1"
    }

    const handleLeave = () => {
      el.style.opacity = "0"
    }

    // Listen on parent so we catch moves over the whole page
    const parent = el.parentElement
    parent.addEventListener("mousemove", handleMove)
    parent.addEventListener("mouseleave", handleLeave)

    return () => {
      parent.removeEventListener("mousemove", handleMove)
      parent.removeEventListener("mouseleave", handleLeave)
    }
  }, [])

  return (
    <div
      ref={layerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0,
        transition: "opacity 0.3s ease",

        /* Brighter version of the same grid lines */
        backgroundImage: [
          "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
          "linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)",
        ].join(","),

        backgroundSize: "80px 80px, 80px 80px, 20px 20px, 20px 20px",

        /* Radial mask — only reveals lines near the cursor */
        WebkitMaskImage: `radial-gradient(circle ${radius}px at var(--mx, -9999px) var(--my, -9999px), black 0%, transparent 100%)`,
        maskImage: `radial-gradient(circle ${radius}px at var(--mx, -9999px) var(--my, -9999px), black 0%, transparent 100%)`,
      }}
    />
  )
}
