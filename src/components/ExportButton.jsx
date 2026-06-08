"use client";

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { generateMarkdown } from '@/lib/blueprintExporter';

export default function ExportButton() {
  const store = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (formatName, fileName) => {
    setIsOpen(false);
    setIsExporting(true);

    try {
      const formatType = formatName === 'cursor' ? 'cursor' : 'markdown';
      const markdown = generateMarkdown(store, formatType);

      // Create and download Blob
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Log the export to the database asynchronously
      await fetch('/api/export/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: fileName,
          blueprintId: null // We don't have the exact DB blueprintId here, it logs the event
        })
      });
      
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!store.blueprintV1 && !store.refinement) {
    return null; // Don't show if no idea has been processed
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        style={{
          background: "rgba(8,25,90,0.6)",
          border: "1px solid rgba(100,200,255,0.4)",
          color: "#fff",
          padding: "8px 16px",
          fontFamily: "monospace",
          fontSize: "12px",
          cursor: isExporting ? "wait" : "pointer",
          letterSpacing: "0.06em",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(100,200,255,0.8)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(100,200,255,0.4)"; }}
      >
        <span>{isExporting ? "EXPORTING..." : "EXPORT TO IDE"}</span>
        <span style={{ fontSize: "10px" }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          marginTop: "4px",
          background: "rgba(8,15,40,0.95)",
          border: "1px solid rgba(100,200,255,0.3)",
          minWidth: "220px",
          zIndex: 100,
          backdropFilter: "blur(10px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
        }}>
          <button
            onClick={() => handleExport('markdown', 'AGENTS.md')}
            style={dropdownItemStyle}
          >
            AGENTS.md <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", display: "block" }}>Universal standard</span>
          </button>
          <button
            onClick={() => handleExport('markdown', 'CLAUDE.md')}
            style={dropdownItemStyle}
          >
            CLAUDE.md <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", display: "block" }}>Claude Code</span>
          </button>
          <button
            onClick={() => handleExport('cursor', 'systemforge.mdc')}
            style={dropdownItemStyle}
          >
            systemforge.mdc <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", display: "block" }}>Cursor specific</span>
          </button>
        </div>
      )}
    </div>
  );
}

const dropdownItemStyle = {
  width: "100%",
  textAlign: "left",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  color: "#fff",
  padding: "12px 16px",
  fontFamily: "monospace",
  fontSize: "12px",
  cursor: "pointer",
  transition: "background 0.1s ease",
};
