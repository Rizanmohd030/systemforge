"use client"

// Color palette (matching blueprint theme)
const C = {
    whiteGhost: "rgba(255,255,255,0.10)",
    whiteLow: "rgba(255,255,255,0.35)",
    cardBg: "rgba(8,25,90,0.70)",
    cardBorder: "rgba(255,255,255,0.18)",
}

/**
 * Reusable skeleton loader component with blueprint-themed styling.
 * Displays pulsing lines that mimic expected content layout.
 * 
 * @param {number} lineCount - Number of skeleton lines to display (default: 4)
 * @param {array} widths - Array of width percentages for each line (default: fills widths)
 */
export default function BlueprintSkeleton({ lineCount = 4, widths = [] }) {
    const lines = Array.from({ length: lineCount }, (_, i) => {
        // Use provided widths array, or auto-fill widths with varying lengths
        let width = "100%"
        if (widths[i]) {
            width = typeof widths[i] === "number" ? `${widths[i]}%` : widths[i]
        } else if (widths.length === 0) {
            // Default pattern: last line is shorter
            width = i === lineCount - 1 ? "70%" : "100%"
        }
        return { width, height: "12px", marginBottom: "12px" }
    })

    return (
        <div style={{ padding: "20px" }}>
            {lines.map((lineStyle, i) => (
                <div
                    key={i}
                    style={{
                        width: lineStyle.width,
                        height: lineStyle.height,
                        background: C.whiteLow,
                        borderRadius: "2px",
                        marginBottom: i === lines.length - 1 ? 0 : lineStyle.marginBottom,
                        animation: "blueprint-pulse 1.5s ease-in-out infinite",
                        opacity: 0.6,
                    }}
                />
            ))}

            <style>{`
                @keyframes blueprint-pulse {
                    0%, 100% {
                        opacity: 0.4;
                        background: rgba(255,255,255,0.25);
                    }
                    50% {
                        opacity: 0.8;
                        background: rgba(120,180,255,0.35);
                    }
                }
            `}</style>
        </div>
    )
}
