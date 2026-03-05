"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {

  const [idea, setIdea] = useState("")
  const router = useRouter()

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      localStorage.setItem("systemforge_idea", idea)
      router.push("/blueprint")
    }
  }

  return (
    <main className="h-screen flex items-center justify-center bg-black text-green-400 font-mono">

      <div className="w-[700px]">

        <h1 className="text-3xl mb-6">
          &gt; SYSTEMFORGE INITIALIZED
        </h1>

        <p className="mb-4">
          &gt; Describe the system you want to build
        </p>

        <div className="flex gap-2">

          <span>user@systemforge:</span>

          <input type="text"  value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none flex-1"
          />

        </div>

      </div>

    </main>
  )
}