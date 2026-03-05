"use client"

import { useEffect, useState } from "react"

export default function BlueprintPage() {

  const [idea, setIdea] = useState("")

  useEffect(() => {
    const storedIdea = localStorage.getItem("systemforge_idea")
    if (storedIdea) {
      setIdea(storedIdea)
    }
  }, [])

  return (
    <main className="blueprint-bg h-screen overflow-hidden relative font-mono text-white flex items-center justify-center">
      {/* TOP SCALE */}
      <div
        className="absolute top-6 left-0 right-0 text-xs opacity-60"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(13, 80px)",
          justifyContent: "center"
        }}
      >
        <span>0</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>50</span>
        <span>60</span>
        <span>70</span>
        <span>80</span>
        <span>90</span>
        <span>100</span>
        <span>110</span>
        <span>120</span>
      </div>


      {/* LEFT SCALE */}
      <div
        className="absolute left-6 top-0 bottom-0 text-xs opacity-60"
        style={{
          display: "grid",
          gridTemplateRows: "repeat(13, 80px)",
          alignContent: "center"
        }}
      >
        <span>0</span>
        <span>10</span>
        <span>20</span>
        <span>30</span>
        <span>40</span>
        <span>50</span>
        <span>60</span>
        <span>70</span>
        <span>80</span>
        <span>90</span>
        <span>100</span>
        <span>110</span>
        <span>120</span>
      </div>


      {/* WORKSPACE FRAME */}
      <div className="w-[1100px] border border-white/30 p-10">

        {/* HEADER */}
        <div className="mb-10">

          <h1 className="text-3xl mb-2">
            &gt; SYSTEMFORGE BLUEPRINT
          </h1>

          <p className="opacity-70">
            Idea: {idea}
          </p>

        </div>


        {/* MODULE GRID */}
        <div className="space-y-6">

          {/* TOP ROW */}
          <div className="grid grid-cols-2 gap-6">

            <ModuleCard
              title="[ IDEA ]"
              description="Refine the project concept"
            />

            <ModuleCard
              title="[ TECH STACK ]"
              description="Recommend frameworks and technologies"
            />

          </div>


          {/* ARCHITECTURE */}
          <ModuleCard
            title="[ ARCHITECTURE ]"
            description="Generate system architecture diagram"
          />


          {/* BOTTOM ROW */}
          <div className="grid grid-cols-3 gap-6">

            <ModuleCard
              title="[ BUILD PLAN ]"
              description="Create development roadmap"
            />

            <ModuleCard
              title="[ PRODUCT DOC ]"
              description="Generate product requirements"
            />

            <ModuleCard
              title="[ ANALYSIS ]"
              description="Evaluate system design"
            />

          </div>

        </div>

      </div>

    </main>
  )
}



function ModuleCard({ title, description }) {

  return (
    <div className="border border-white/25 bg-white/5 p-6">

      <h2 className="mb-3 text-lg">
        {title}
      </h2>

      <p className="text-sm opacity-70 mb-6">
        {description}
      </p>

      <p className="text-xs opacity-60">
        STATUS: READY
      </p>

    </div>
  )
}



/* SMALL HORIZONTAL TICK */
function Tick() {
  return (
    <div className="w-8 h-[1px] bg-white/50"></div>
  )
}


/* SMALL VERTICAL TICK */
function TickVertical() {
  return (
    <div className="h-8 w-[1px] bg-white/50"></div>
  )
}