"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, BarChart3, Loader2, TrendingUp, ArrowUpDown, Info } from "lucide-react"

interface PlayerAverages {
  PTS: number
  FGM: number
  FGA: number
  FG_PCT: number
  FG3M: number
  FG3A: number
  FG3_PCT: number
  FTM: number
  FTA: number
  FT_PCT: number
  REB: number
  OREB: number
  DREB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
  MIN: number
  GAMES_PLAYED: number
  [key: string]: number
}

interface AdvancedStats {
  OffRtg: number
  DefRtg: number
  NetRtg: number
  TS: number
  eFG: number
  ASTtoTO: number
  TOVpercent: number
  USG: number
  [key: string]: number
}

interface PlayerData {
  playerId: number
  name: string
  image: string
  wins: {
    averages: PlayerAverages
    advancedStats: AdvancedStats
  }
  losses: {
    averages: PlayerAverages
    advancedStats: AdvancedStats
  }
}

interface StatInfo {
  key: string
  label: string
}

interface ApiResponse {
  team: string
  season: string
  players: PlayerData[]
  simpleStats: StatInfo[]
  advancedStats: StatInfo[]
}

export default function WinLossComparison() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple")
  const [selectedStat, setSelectedStat] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "wins" | "losses" | "difference">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/win-loss-comparison")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        // Set default selected stat
        if (result.simpleStats && result.simpleStats.length > 0) {
          setSelectedStat(result.simpleStats[0].key)
        }
      } catch (error) {
        console.error("Error fetching win-loss comparison:", error)
        setError("Failed to load player statistics. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleTabChange = (tab: "simple" | "advanced") => {
    setActiveTab(tab)

    // Set default stat for the selected tab
    if (data) {
      if (tab === "simple" && data.simpleStats.length > 0) {
        setSelectedStat(data.simpleStats[0].key)
      } else if (tab === "advanced" && data.advancedStats.length > 0) {
        setSelectedStat(data.advancedStats[0].key)
      }
    }
  }

  const handleStatChange = (stat: string) => {
    setSelectedStat(stat)
  }

  const handleSortChange = (sortType: "name" | "wins" | "losses" | "difference") => {
    if (sortBy === sortType) {
      // Toggle direction if clicking the same sort option
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(sortType)
      // Default to ascending for name, descending for stats
      setSortDirection(sortType === "name" ? "asc" : "desc")
    }
  }

  const sortPlayers = (players: PlayerData[]): PlayerData[] => {
    return [...players].sort((a, b) => {
      let comparison = 0

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else {
        const statGroup = activeTab === "simple" ? "averages" : "advancedStats"

        const aWinValue = a.wins[statGroup][selectedStat] || 0
        const aLossValue = a.losses[statGroup][selectedStat] || 0
        const bWinValue = b.wins[statGroup][selectedStat] || 0
        const bLossValue = b.losses[statGroup][selectedStat] || 0

        if (sortBy === "wins") {
          comparison = aWinValue - bWinValue
        } else if (sortBy === "losses") {
          comparison = aLossValue - bLossValue
        } else if (sortBy === "difference") {
          const aDiff = aWinValue - aLossValue
          const bDiff = bWinValue - bLossValue
          comparison = aDiff - bDiff
        }
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  const formatStatValue = (value: number, statKey: string): string => {
    if (["FG_PCT", "FG3_PCT", "FT_PCT", "TS", "eFG", "TOVpercent", "USG"].includes(statKey)) {
      return `${value.toFixed(1)}%`
    } else if (statKey === "ASTtoTO") {
      return value.toFixed(2)
    } else {
      return value.toFixed(1)
    }
  }

  const getStatDifference = (player: PlayerData, statKey: string): number => {
    const statGroup = activeTab === "simple" ? "averages" : "advancedStats"
    const winValue = player.wins[statGroup][statKey] || 0
    const lossValue = player.losses[statGroup][statKey] || 0
    return winValue - lossValue
  }

  const isDifferencePositive = (difference: number, statKey: string): boolean => {
    // For most stats, higher is better, but for some (like turnovers), lower is better
    if (["TOV", "TOVpercent", "PF", "DefRtg"].includes(statKey)) {
      return difference < 0
    }
    return difference > 0
  }

  // Custom bar chart component using div elements
  const CustomBarChart = ({
    winValue,
    lossValue,
    maxValue,
    statKey,
  }: {
    winValue: number
    lossValue: number
    maxValue: number
    statKey: string
  }) => {
    // For some stats like TOV, lower is better, so we need to invert the colors
    const invertColors = ["TOV", "TOVpercent", "PF", "DefRtg"].includes(statKey)

    const winWidth = `${(winValue / maxValue) * 100}%`
    const lossWidth = `${(lossValue / maxValue) * 100}%`

    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="w-16 text-sm font-medium">Wins</div>
          <div className="flex-1 h-10 bg-gray-700 rounded-md overflow-hidden">
            <div
              className={`h-full ${invertColors ? "bg-red-600" : "bg-green-600"} rounded-md`}
              style={{ width: winWidth }}
            ></div>
          </div>
          <div className="w-16 text-right text-sm font-medium ml-2">{formatStatValue(winValue, statKey)}</div>
        </div>
        <div className="flex items-center">
          <div className="w-16 text-sm font-medium">Losses</div>
          <div className="flex-1 h-10 bg-gray-700 rounded-md overflow-hidden">
            <div
              className={`h-full ${invertColors ? "bg-green-600" : "bg-red-600"} rounded-md`}
              style={{ width: lossWidth }}
            ></div>
          </div>
          <div className="w-16 text-right text-sm font-medium ml-2">{formatStatValue(lossValue, statKey)}</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-semibold">Loading statistics...</h1>
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
          <h1 className="text-2xl font-semibold mb-4">Error Loading Statistics</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!data || !data.players || data.players.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="bg-yellow-500/20 p-4 rounded-full mb-4">
            <BarChart3 className="w-16 h-16 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">No Data Available</h1>
          <p className="text-gray-400 mb-6">No player statistics data is currently available.</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const currentStats = activeTab === "simple" ? data.simpleStats : data.advancedStats
  const sortedPlayers = sortPlayers(data.players)

  // Find the maximum value for the selected stat across all players
  const maxStatValue =
    sortedPlayers.reduce((max, player) => {
      const statGroup = activeTab === "simple" ? "averages" : "advancedStats"
      const winValue = player.wins[statGroup][selectedStat] || 0
      const lossValue = player.losses[statGroup][selectedStat] || 0
      return Math.max(max, winValue, lossValue)
    }, 0) * 1.1 // Add 10% padding

  // Visual theme based on active tab
  const tabTheme = {
    simple: {
      gradient: "from-emerald-800 to-blue-900",
      icon: <BarChart3 className="h-6 w-6" />,
      accentColor: "bg-emerald-600",
      cardGradient: "from-emerald-900 to-blue-900",
      buttonGradient: "from-emerald-600 to-blue-700",
      statBg: "bg-emerald-600/10",
      statBorder: "border-emerald-600/30",
    },
    advanced: {
      gradient: "from-blue-800 to-purple-900",
      icon: <TrendingUp className="h-6 w-6" />,
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
                <h1 className="text-4xl md:text-5xl font-bold">Win vs Loss Analysis</h1>
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
            {currentStats.map((stat) => (
              <button
                key={stat.key}
                onClick={() => handleStatChange(stat.key)}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedStat === stat.key
                    ? `bg-gradient-to-r ${theme.buttonGradient} shadow-lg transform scale-105`
                    : `${theme.statBg} border ${theme.statBorder} hover:bg-opacity-20`
                }`}
              >
                <span className="text-sm font-medium">{stat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-4 bg-gray-800 p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-400">Sort by:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSortChange("name")}
                className={`px-3 py-1 text-sm rounded-md border border-gray-600 ${
                  sortBy === "name" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Name {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("wins")}
                className={`px-3 py-1 text-sm rounded-md border border-gray-600 ${
                  sortBy === "wins" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Wins {sortBy === "wins" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("losses")}
                className={`px-3 py-1 text-sm rounded-md border border-gray-600 ${
                  sortBy === "losses" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Losses {sortBy === "losses" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("difference")}
                className={`px-3 py-1 text-sm rounded-md border border-gray-600 ${
                  sortBy === "difference" ? "bg-gray-700" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                Difference {sortBy === "difference" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
            </div>
          </div>
        </div>

        {/* Player Stats Comparison */}
        <div className="space-y-8">
          {sortedPlayers.map((player) => {
            const statGroup = activeTab === "simple" ? "averages" : "advancedStats"
            const winValue = player.wins[statGroup][selectedStat] || 0
            const lossValue = player.losses[statGroup][selectedStat] || 0
            const difference = getStatDifference(player, selectedStat)
            const isPositive = isDifferencePositive(difference, selectedStat)
            const currentStatInfo = currentStats.find((s) => s.key === selectedStat)

            return (
              <div key={player.playerId} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 mr-4">
                      <Image
                        src={player.image || "/placeholder.svg"}
                        alt={player.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{player.name}</h3>
                      <p className="text-sm text-gray-400">
                        Wins: {player.wins.averages.GAMES_PLAYED} | Losses: {player.losses.averages.GAMES_PLAYED}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center">
                      <div
                        className={`px-3 py-1 rounded-full text-sm ${isPositive ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}
                      >
                        {isPositive ? "+" : ""}
                        {formatStatValue(difference, selectedStat)}
                      </div>
                      <div className="relative ml-2 group">
                        <button className="p-1 rounded-full hover:bg-gray-700">
                          <Info className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-gray-900 rounded-md shadow-lg text-xs hidden group-hover:block z-10">
                          <p>Difference between wins and losses</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <div className="font-medium">{currentStatInfo?.label || selectedStat}</div>
                    </div>
                    <CustomBarChart
                      winValue={winValue}
                      lossValue={lossValue}
                      maxValue={maxStatValue}
                      statKey={selectedStat}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Explanation Section */}
        <div className="mt-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">About This Analysis</h2>
            <div className={`ml-4 h-1 flex-grow ${theme.accentColor} rounded-full`}></div>
          </div>

          <div className={`${theme.statBg} border ${theme.statBorder} rounded-xl p-6 shadow-lg`}>
            <p className="text-gray-300 mb-4">
              This analysis compares how player statistics differ between wins and losses. By examining these
              differences, we can identify which statistical areas have the most impact on game outcomes.
            </p>
            <div className="flex items-start mb-4">
              <div className="bg-green-600 p-2 rounded-lg mr-3 mt-1">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Green bars</span> representan el rendimiento promedio del
                jugador en los partidos que el equipo ganó.
              </p>
            </div>
            <div className="flex items-start mb-4">
              <div className="bg-red-600 p-2 rounded-lg mr-3 mt-1">
                <BarChart3 className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Red bars</span> representan el rendimiento promedio del
                jugador en los partidos que el equipo perdió.
              </p>
            </div>
            <div className="flex items-start">
              <div className="bg-blue-600 p-2 rounded-lg mr-3 mt-1">
                <ArrowUpDown className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Difference value</span> muestra cuánto mejor (o peor) rinde
                un jugador en victorias comparado con derrotas. Una diferencia positiva generalmente indica mejor
                rendimiento en victorias, excepto para estadísticas negativas como pérdidas de balón.
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

