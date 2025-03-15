"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function PlayerPage() {
  const router = useRouter()
  const { id } = useParams()
  const [playerData, setPlayerData] = useState<{ name: string; image: string } | null>(null)
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [advancedStats, setAdvancedStats] = useState<{ name: string; value: string }[]>([])
  const [isAdvancedStatsProvisional, setIsAdvancedStatsProvisional] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    // Obtener la información del jugador desde la base de datos
    const fetchPlayerData = async () => {
      try {
        setLoading(true)

        // Fetch basic player data
        const res = await fetch(`/api/player/${id}`)
        if (!res.ok) throw new Error("Failed to fetch player data")

        const data = await res.json()
        setPlayerData({ name: data.name, image: data.image })
        setStats(data.averages)

        // Fetch advanced stats
        const advancedRes = await fetch(`/api/player/${id}/advanced-stats`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        if (advancedRes.ok) {
          const advancedData = await advancedRes.json()

          // Format advanced stats for display
          const formattedAdvancedStats = [
            { name: "Player Efficiency Rating (PER)", value: advancedData.averages.PER.toFixed(1) },
            {
              name: "Plus-Minus (+/-)",
              value:
                advancedData.averages.PLUS_MINUS > 0
                  ? `+${advancedData.averages.PLUS_MINUS.toFixed(1)}`
                  : advancedData.averages.PLUS_MINUS.toFixed(1),
            },
            { name: "Usage Rate (USG%)", value: `${advancedData.averages.USG_PCT.toFixed(1)}%` },
            { name: "True Shooting % (TS%)", value: `${advancedData.averages.TS_PCT.toFixed(1)}%` },
            { name: "Assist to Turnover Ratio (AST/TO)", value: advancedData.averages.AST_TO_RATIO.toFixed(2) },
            { name: "Win Shares (WS)", value: advancedData.averages.WIN_SHARES.toFixed(1) },
            { name: "Offensive Rating (OffRtg)", value: advancedData.averages.OFF_RTG.toFixed(1) },
            { name: "Defensive Rating (DefRtg)", value: advancedData.averages.DEF_RTG.toFixed(1) },
            {
              name: "Net Rating (NetRtg)",
              value:
                advancedData.averages.NET_RTG > 0
                  ? `+${advancedData.averages.NET_RTG.toFixed(1)}`
                  : advancedData.averages.NET_RTG.toFixed(1),
            },
          ]

          setAdvancedStats(formattedAdvancedStats)
          setIsAdvancedStatsProvisional(advancedData.provisional || false)
        }
      } catch (error) {
        console.error("Error fetching player stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h1 className="text-2xl font-semibold">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!stats || !playerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="bg-gray-800 rounded-xl p-10 shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-6">Player not found</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center w-full"
          >
            <ChevronLeft className="mr-2" size={20} />
            Go back to home
          </button>
        </div>
      </div>
    )
  }

  // Combine all simple stats into one array
  const allSimpleStats = [
    { name: "Points per game", value: stats.PTS?.toFixed(1) || "0.0" },
    { name: "Assists per game", value: stats.AST?.toFixed(1) || "0.0" },
    { name: "Rebounds per game", value: stats.REB?.toFixed(1) || "0.0" },
    { name: "Steals per game", value: stats.STL?.toFixed(1) || "0.0" },
    { name: "Blocks per game", value: stats.BLK?.toFixed(1) || "0.0" },
    { name: "Turnovers per game", value: stats.TOV?.toFixed(1) || "0.0" },
    { name: "FG%", value: `${stats.FG_PCT?.toFixed(1) || "0.0"}%` },
    { name: "3P%", value: `${stats.FG3_PCT?.toFixed(1) || "0.0"}%` },
    { name: "FT%", value: `${stats.FT_PCT?.toFixed(1) || "0.0"}%` },
    { name: "Plus/Minus", value: stats.PLUS_MINUS?.toFixed(1) || "0.0" },
    { name: "Field Goals Made", value: stats.FGM?.toFixed(1) || "0.0" },
    { name: "Field Goals Attempted", value: stats.FGA?.toFixed(1) || "0.0" },
    { name: "Free Throws Made", value: stats.FTM?.toFixed(1) || "0.0" },
    { name: "Free Throws Attempted", value: stats.FTA?.toFixed(1) || "0.0" },
    { name: "Offensive Rebounds", value: stats.OREB?.toFixed(1) || "0.0" },
    { name: "Defensive Rebounds", value: stats.DREB?.toFixed(1) || "0.0" },
    { name: "Games Played", value: Object.keys(stats).length.toString() },
  ]

  return (
    <div className="min-h-screen text-white bg-[#0a0a2a]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center mb-8 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back to home
        </Link>

        {/* Player header with gradient background */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-8 shadow-lg mb-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative w-48 h-48 md:w-64 md:h-64 mb-6 md:mb-0 md:mr-10">
              <Image
                src={playerData.image || "/default-player.jpg"}
                alt={playerData.name || "Player Image"}
                fill
                className="rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{playerData.name}</h1>
              <div className="inline-block bg-black bg-opacity-30 px-4 py-2 rounded-lg">
                <span className="text-xl">Player Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Name Banner */}
        <div className="bg-gray-800 rounded-xl p-6 mb-10 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-center">{playerData.name}'s Statistics</h2>
        </div>

        {/* Simple Stats Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Simple Stats</h2>
            <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allSimpleStats.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:bg-gray-700 flex flex-col justify-center min-h-[180px]"
              >
                <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Stats Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Advanced Stats</h2>
            <div className="ml-4 h-1 flex-grow bg-purple-600 rounded-full"></div>
            {isAdvancedStatsProvisional && (
              <div className="ml-4 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full">Datos provisionales</div>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-8">
              {advancedStats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-800 to-purple-900 rounded-lg p-4 hover:opacity-90 transition-opacity"
                >
                  <p className="text-gray-300 mb-2">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Performance Chart</h2>
            <div className="ml-4 h-1 flex-grow bg-yellow-600 rounded-full"></div>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 shadow-lg flex justify-center items-center h-64">
            <p className="text-gray-400 text-lg">Performance visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}

