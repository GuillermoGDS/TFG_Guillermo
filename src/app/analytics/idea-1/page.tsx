"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Medal, TrendingUp, Loader2, BarChart, Activity } from "lucide-react"

interface Player {
  rank: number
  playerId: string
  name: string
  image: string
  value: string
}

interface StatRanking {
  label: string
  players: Player[]
}

interface Rankings {
  simple: {
    [key: string]: StatRanking
  }
  advanced: {
    [key: string]: StatRanking
  }
}

interface ApiResponse {
  team: string
  season: string
  rankings: Rankings
}

export default function PlayerRankings() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple")
  const [activeStat, setActiveStat] = useState<string>("")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/player-rankings")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        // Set default active stat
        if (result.rankings && result.rankings.simple) {
          const firstSimpleStat = Object.keys(result.rankings.simple)[0]
          setActiveStat(firstSimpleStat)
        }
      } catch (error) {
        console.error("Error fetching rankings:", error)
        setError("Failed to load player rankings. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleStatChange = (stat: string) => {
    setActiveStat(stat)
  }

  const handleTabChange = (tab: "simple" | "advanced") => {
    setActiveTab(tab)
    // Set default stat for the selected tab
    if (data?.rankings) {
      const firstStat = Object.keys(data.rankings[tab])[0]
      setActiveStat(firstStat)
    }
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"
      case 2:
        return "text-gray-400"
      case 3:
        return "text-amber-600"
      default:
        return "text-blue-400"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-semibold">Loading rankings...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="bg-red-500/20 p-4 rounded-full mb-4">
            <TrendingUp className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">Error Loading Rankings</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!data || !data.rankings) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="bg-yellow-500/20 p-4 rounded-full mb-4">
            <TrendingUp className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">No Data Available</h1>
          <p className="text-gray-400 mb-6">No player rankings data is currently available.</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const currentRankings = data.rankings[activeTab][activeStat]
  const statOptions = Object.entries(data.rankings[activeTab]).map(([key, value]) => ({
    key,
    label: value.label,
  }))

  // Visual theme based on active tab
  const tabTheme = {
    simple: {
      gradient: "from-emerald-800 to-blue-900",
      icon: <BarChart className="h-6 w-6" />,
      accentColor: "bg-emerald-600",
      cardGradient: "from-emerald-900 to-blue-900",
      buttonGradient: "from-emerald-600 to-blue-700",
      statBg: "bg-emerald-600/10",
      statBorder: "border-emerald-600/30",
    },
    advanced: {
      gradient: "from-blue-800 to-purple-900",
      icon: <Activity className="h-6 w-6" />,
      accentColor: "bg-blue-600",
      cardGradient: "from-blue-900 to-purple-900",
      buttonGradient: "from-blue-600 to-purple-700",
      statBg: "bg-blue-600/10",
      statBorder: "border-blue-600/30",
    },
  }

  const theme = tabTheme[activeTab]

  return (
    <div className="flex flex-col min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className={`w-full bg-gradient-to-r ${theme.gradient} py-8 mb-6 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ChevronLeft className="h-8 w-8 text-blue-200 hover:text-white transition-colors" />
            </Link>
            <div>
              <div className="flex items-center">
                <h1 className="text-4xl md:text-5xl font-bold">Player Rankings</h1>
                <div className="ml-4 flex items-center justify-center p-2 rounded-lg bg-white/10">{theme.icon}</div>
              </div>
              <p className="text-blue-100 mt-2">
                {data.team} • {data.season} Season
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => handleTabChange("simple")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "simple"
                  ? `bg-gradient-to-r ${tabTheme.simple.buttonGradient} text-white shadow-lg`
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Simple Stats
            </button>
            <button
              onClick={() => handleTabChange("advanced")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "advanced"
                  ? `bg-gradient-to-r ${tabTheme.advanced.buttonGradient} text-white shadow-lg`
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Advanced Stats
            </button>
          </div>
        </div>

        {/* Stat Selector */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Select Statistic</h2>
            <div className={`ml-4 h-1 flex-grow ${theme.accentColor} rounded-full`}></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {statOptions.map((stat) => (
              <button
                key={stat.key}
                onClick={() => handleStatChange(stat.key)}
                className={`p-3 rounded-lg text-center transition-all ${
                  activeStat === stat.key
                    ? `bg-gradient-to-r ${theme.buttonGradient} shadow-lg transform scale-105`
                    : `${theme.statBg} border ${theme.statBorder} hover:bg-opacity-20`
                }`}
              >
                <span className="text-sm font-medium">{stat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Stat Rankings */}
        {currentRankings && (
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <h2 className="text-3xl font-bold">{currentRankings.label} Rankings</h2>
              <div className={`ml-4 h-1 flex-grow ${theme.accentColor} rounded-full`}></div>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
              {/* Top 3 Players */}
              <div className={`bg-gradient-to-r ${theme.cardGradient} p-6 md:p-10`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {currentRankings.players.slice(0, 3).map((player) => (
                    <div
                      key={player.playerId}
                      className={`flex flex-col items-center ${
                        player.rank === 1
                          ? "order-2 md:transform md:scale-110"
                          : player.rank === 2
                            ? "order-1"
                            : "order-3"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-700 relative">
                          <Image
                            src={player.image || "/placeholder.svg"}
                            alt={`${player.name} - Ranked #${player.rank} in ${currentRankings.label}`}
                            fill
                            className="object-cover"
                            unoptimized={player.image.includes(".webp") || player.image.includes(".avif")}
                          />
                        </div>
                        <div
                          className={`absolute -bottom-2 -right-2 rounded-full p-2 ${
                            player.rank === 1 ? "bg-yellow-400" : player.rank === 2 ? "bg-gray-400" : "bg-amber-600"
                          }`}
                        >
                          <Medal className="h-6 w-6 text-gray-900" />
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <div
                          className={`text-2xl font-bold ${
                            player.rank === 1
                              ? "text-yellow-400"
                              : player.rank === 2
                                ? "text-gray-400"
                                : "text-amber-600"
                          }`}
                        >
                          #{player.rank}
                        </div>
                        <div className="font-semibold mt-1">{player.name}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {player.playerId}</div>
                        <div className="text-2xl font-bold mt-2">{player.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rest of Players */}
              <div className="p-6">
                <div className="grid gap-3">
                  {currentRankings.players.slice(3).map((player) => (
                    <Link
                      href={`/players/${player.playerId}`}
                      key={player.playerId}
                      className="flex items-center bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${getMedalColor(player.rank)} bg-gray-800 mr-4`}
                      >
                        {player.rank}
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 mr-4">
                        <Image
                          src={player.image || "/placeholder.svg"}
                          alt={`${player.name} - Ranked #${player.rank} in ${currentRankings.label}`}
                          width={40}
                          height={40}
                          className="object-cover"
                          unoptimized={player.image.includes(".webp") || player.image.includes(".avif")}
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="font-medium">{player.name}</div>
                        <div className="text-xs text-gray-400">ID: {player.playerId}</div>
                      </div>
                      <div className="text-xl font-bold">{player.value}</div>
                      <ChevronRight className="ml-2 h-5 w-5 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explanation Section */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">About These Rankings</h2>
            <div className={`ml-4 h-1 flex-grow ${theme.accentColor} rounded-full`}></div>
          </div>

          <div className={`${theme.statBg} border ${theme.statBorder} rounded-xl p-6 shadow-lg`}>
            <p className="text-gray-300 mb-4">
              These rankings show how players on the team compare in various statistical categories. The rankings are
              calculated based on per-game averages for the current season.
            </p>
            <div className="flex items-start mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg mr-3 mt-1">
                <BarChart className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Simple Stats</span> include traditional basketball metrics
                like points, rebounds, and shooting percentages.
              </p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-600 p-2 rounded-lg mr-3 mt-1">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Advanced Stats</span> provide deeper analytical insights
                using complex formulas that measure efficiency and impact beyond basic box score statistics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Basketball Analytics. TFG Guillermo</p>
        </div>
      </footer>
    </div>
  )
}

