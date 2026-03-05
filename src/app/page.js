"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function Home() {

  const router = useRouter()

  // The hidden <input> that actually captures all keyboard input.
  // It stays invisible but focused, so the browser handles typing
  // natively — backspace, arrow keys, Ctrl+A, click-to-position, all of it.
  const inputRef = useRef(null)

  // Refs on the two visual text halves so we can identify which
  // half the user clicked on and compute the absolute character position.
  const beforeRef = useRef(null)
  const afterRef = useRef(null)

  const bootLines = [
    "> INITIALIZING SYSTEMFORGE...",
    "> LOADING AI MODULES...",
    "> CONNECTING BLUEPRINT ENGINE...",
    "> SYSTEM READY",
  ]

  const [lines, setLines] = useState([])
  const [currentLine, setCurrentLine] = useState("")
  const [bootIndex, setBootIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [bootComplete, setBootComplete] = useState(false)

  // idea = what the user has typed so far
  const [idea, setIdea] = useState("")

  // cursorPos = the character index where the blinking block sits.
  // Synced from inputRef.current.selectionStart on every input/key event.
  const [cursorPos, setCursorPos] = useState(0)


  /* ---------------------------
     TERMINAL BOOT TYPING
     Typewriter effect for each boot line.
  --------------------------- */

  useEffect(() => {

    if (bootIndex >= bootLines.length) {
      setBootComplete(true)
      return
    }

    if (charIndex < bootLines[bootIndex].length) {

      // Type one character every 30ms
      const timeout = setTimeout(() => {
        setCurrentLine(prev => prev + bootLines[bootIndex][charIndex])
        setCharIndex(prev => prev + 1)
      }, 30)

      return () => clearTimeout(timeout)

    } else {

      // Line finished — pause 200ms, then move to the next line
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
     AUTO-FOCUS INPUT AFTER BOOT
     Once the boot sequence finishes, focus the hidden input.
     The user can then start typing immediately without clicking.
  --------------------------- */

  useEffect(() => {
    if (bootComplete && inputRef.current) {
      inputRef.current.focus()
    }
  }, [bootComplete])


  /* ---------------------------
     SYNC VALUE + CURSOR POSITION
     Called on every change to the hidden input.
     Reads both the text value and selectionStart (cursor index)
     so we can render the terminal visual accurately.
  --------------------------- */

  const syncFromInput = () => {
    const el = inputRef.current
    if (!el) return
    setIdea(el.value)
    // selectionStart is the caret position — 0 means before first char
    setCursorPos(el.selectionStart ?? el.value.length)
  }


  /* ---------------------------
     HANDLE ENTER KEY
     Navigate to /blueprint when user presses Enter.
     All other key handling is done natively by the browser.
  --------------------------- */

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = inputRef.current?.value?.trim()
      if (value) {
        localStorage.setItem("systemforge_idea", value)
        router.push("/blueprint")
      }
    }
    // Sync cursor position after arrow keys etc.
    // setTimeout(0) lets the browser update selectionStart first.
    setTimeout(syncFromInput, 0)
  }


  /* ---------------------------
     CLICK ON TERMINAL TEXT
     Converts a mouse click into a character index and moves
     the hidden input's cursor to that position via setSelectionRange.
  --------------------------- */

  const handleTextClick = (e) => {
    e.stopPropagation() // don't bubble up to the main onClick

    // caretRangeFromPoint (Chrome/Safari) / caretPositionFromPoint (Firefox)
    // asks the browser: "at screen pixel (x, y), what text node and offset?"
    let clickNode = null
    let clickOffset = 0

    if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY)
      if (range) { clickNode = range.startContainer; clickOffset = range.startOffset }
    } else if (document.caretPositionFromPoint) {
      const cp = document.caretPositionFromPoint(e.clientX, e.clientY)
      if (cp) { clickNode = cp.offsetNode; clickOffset = cp.offset }
    }

    let pos = idea.length // default: jump to end

    if (clickNode) {
      if (beforeRef.current?.contains(clickNode)) {
        // Clicked in the "before" half — offset is already absolute
        pos = clickOffset
      } else if (afterRef.current?.contains(clickNode)) {
        // Clicked in the "after" half — add cursorPos to get absolute index
        pos = cursorPos + clickOffset
      }
    }

    // Move the hidden input's cursor to that position, then sync visuals
    const el = inputRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(pos, pos)
      setTimeout(syncFromInput, 0)
    }
  }

  const handleTerminalClick = () => {
    // Clicking anywhere outside the text area just focuses + goes to end
    const el = inputRef.current
    if (el) {
      el.focus()
      // Move to end only if nothing specific was clicked
      setTimeout(syncFromInput, 0)
    }
  }


  /* ---------------------------
     RENDER
  --------------------------- */

  // Split `idea` at cursorPos so we can insert the blinking block in between.
  // before + [cursor] + after = what the user sees
  const before = idea.slice(0, cursorPos)
  const after = idea.slice(cursorPos)

  return (

    <main
      className="h-screen bg-black flex items-center justify-center font-mono text-green-400"
      onClick={handleTerminalClick}
    >

      {/* HIDDEN INPUT — invisible but always focused after boot.
          opacity:0, size:0, position:fixed keeps it out of layout.
          readOnly is NOT set so the browser processes all editing normally. */}
      <input
        ref={inputRef}
        value={idea}
        onChange={syncFromInput}
        onKeyDown={handleKeyDown}
        onKeyUp={syncFromInput}
        onClick={syncFromInput}
        onSelect={syncFromInput}
        style={{
          position: "fixed",
          opacity: 0,
          pointerEvents: "none",
          width: 0,
          height: 0,
          border: "none",
          outline: "none",
          padding: 0,
        }}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />

      <div className="terminal-window">

        {/* HEADER — traffic-light dots + title */}
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="btn red"></span>
            <span className="btn yellow"></span>
            <span className="btn green"></span>
          </div>
          <span className="terminal-title">bash — systemforge</span>
        </div>

        {/* BODY */}
        <div className="terminal-body">

          {/* Boot lines that have finished typing */}
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}

          {/* The line currently being typed by the boot animation */}
          {currentLine && <p>{currentLine}</p>}

          {/* After boot: instructions + input prompt */}
          {bootComplete && (
            <>
              <p className="mt-4 opacity-60 text-sm">
                Describe the system you want to build. Press <span className="text-green-400 opacity-100">Enter</span> to generate.
              </p>

              <div className="terminal-input-line">
                <span className="prompt" style={{ whiteSpace: "nowrap" }}>
                  user@systemforge:~$&nbsp;
                </span>

                {/* Visual text: before cursor + blinking block + after cursor.
                    onClick on this span triggers click-to-position. */}
                <span
                  className="terminal-text"
                  onClick={handleTextClick}
                  style={{ cursor: "text" }}
                >
                  <span ref={beforeRef}>{before}</span>
                  <span className="terminal-cursor"></span>
                  <span ref={afterRef}>{after}</span>
                </span>
              </div>
            </>
          )}

        </div>

      </div>

    </main>

  )

}