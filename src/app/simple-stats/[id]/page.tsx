
"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"

const simpleStats = [
  { name: "Points per game", value: "31.5", id: "ppg" },
  { name: "Field goal %", value: "48.2%", id: "fg_percentage" },
  { name: "3-point %", value: "37.8%", id: "three_point_percentage" },
  { name: "Free throw %", value: "85.3%", id: "ft_percentage" },
  { name: "Total rebounds", value: "8.7", id: "total_rebounds" },
  { name: "Offensive rebounds", value: "1.2", id: "offensive_rebounds" },
  { name: "Defensive rebounds", value: "7.5", id: "defensive_rebounds" },
  { name: "Assists per game", value: "7.2", id: "apg" },
  { name: "Steals per game", value: "1.5", id: "spg" },
  { name: "Blocks per game", value: "0.8", id: "bpg" },
  { name: "Turnovers", value: "3.1", id: "turnovers" },
  { name: "Fouls", value: "2.4", id: "fouls" },
]

export default function StatPage() {
  const router = useRouter()
  const params = useParams()
  const [stat, setStat] = useState<{ name: string; value: string; id: string } | null>(null)

  useEffect(() => {
    const foundStat = simpleStats.find((s) => s.id === params.id)
    setStat(foundStat || null)
  }, [params.id])

  if (!stat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <h1 className="text-3xl font-bold mb-4">Stat not found</h1>
        <button
          onClick={() => router.push("/")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go back to home
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
      <div className="w-full max-w-4xl mx-auto px-4">
        <button
          onClick={() => router.push("/")}
          className="mb-8 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          ← Back to home
        </button>
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-4">{stat.name}</h1>
          <p className="text-6xl font-bold text-blue-400">{stat.value}</p>
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">About this stat</h2>
            <p className="text-gray-300">
              This is where you would provide more detailed information about {stat.name.toLowerCase()}. You could
              include things like:
            </p>
            <ul className="list-disc list-inside mt-4 text-gray-300">
              <li>How it's calculated</li>
              <li>Why it's important</li>
              <li>League averages</li>
              <li>Historical context</li>
              <li>Top players in this category</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

