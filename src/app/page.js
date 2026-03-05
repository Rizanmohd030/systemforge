"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {

  const router = useRouter()

  const bootLines = [
    "> INITIALIZING SYSTEMFORGE...",
    "> LOADING AI MODULES...",
    "> CONNECTING BLUEPRINT ENGINE...",
    "> SYSTEM READY"
  ]

  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState("")
  const [bootIndex, setBootIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)

  const [bootComplete, setBootComplete] = useState(false)
  const [idea, setIdea] = useState("")



  /* ---------------------------
     TERMINAL BOOT TYPING
  --------------------------- */

  useEffect(() => {

    if (bootIndex >= bootLines.length) {
      setBootComplete(true)
      return
    }

    if (charIndex < bootLines[bootIndex].length) {

      const timeout = setTimeout(() => {

        setCurrentLine(prev =>
          prev + bootLines[bootIndex][charIndex]
        )

        setCharIndex(prev => prev + 1)

      }, 30)

      return () => clearTimeout(timeout)

    } else {

      const timeout = setTimeout(() => {

        setLines(prev => [...prev, currentLine])
        setCurrentLine("")
        setCharIndex(0)
        setBootIndex(prev => prev + 1)

      }, 200)

      return () => clearTimeout(timeout)

    }

  }, [charIndex, bootIndex])



  /* ---------------------------
     TERMINAL INPUT
  --------------------------- */

  useEffect(() => {

    const handleKey = (e) => {

      if (!bootComplete) return

      if (e.key === "Enter") {

        if (idea.trim() !== "") {

          localStorage.setItem("systemforge_idea", idea)

          router.push("/blueprint")

        }

      }

      else if (e.key === "Backspace") {

        setIdea(prev => prev.slice(0, -1))

      }

      else if (e.key.length === 1) {

        setIdea(prev => prev + e.key)

      }

    }

    window.addEventListener("keydown", handleKey)

    return () => window.removeEventListener("keydown", handleKey)

  }, [idea, bootComplete])



  return (

    <main className="h-screen bg-black flex items-center justify-center font-mono text-green-400">

      <div className="terminal-window">

        {/* HEADER */}
        <div className="terminal-header">

          <div className="terminal-buttons">
            <span className="btn red"></span>
            <span className="btn yellow"></span>
            <span className="btn green"></span>
          </div>

          <span className="terminal-title">bash</span>

        </div>



        {/* BODY */}
        <div className="terminal-body">

          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}

          {currentLine && <p>{currentLine}</p>}



          {bootComplete && (

            <div className="terminal-input-line">

              <span className="prompt">
                user@systemforge:
              </span>

              <span className="terminal-text">
                {idea}
              </span>

              <span className="terminal-cursor"></span>

            </div>

          )}

        </div>

      </div>

    </main>

  )

}