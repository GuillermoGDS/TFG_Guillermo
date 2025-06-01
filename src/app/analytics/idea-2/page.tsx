"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  BarChart3,
  Loader2,
  TrendingUp,
  ArrowUpDown,
  Info,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

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

interface StatCorrelation {
  key: string
  label: string
  correlationScore: number
  type: "simple" | "advanced"
}

export default function WinLossComparison() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple")
  const [selectedStat, setSelectedStat] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "wins" | "losses" | "difference">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [showCorrelationSection, setShowCorrelationSection] = useState(true)
  const [correlationTab, setCorrelationTab] = useState<"simple" | "advanced">("simple")

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
    const lossValue = player.losses[statGroup][selectedStat] || 0
    return winValue - lossValue
  }

  const isDifferencePositive = (difference: number, statKey: string): boolean => {
    // For most stats, higher is better, but for some (like turnovers), lower is better
    if (["TOV", "TOVpercent", "PF", "DefRtg"].includes(statKey)) {
      return difference < 0
    }
    return difference > 0
  }

  // Calculate stat correlations with winning
  const calculateStatCorrelations = useMemo(() => {
    if (!data || !data.players || data.players.length === 0) {
      return { simpleCorrelations: [], advancedCorrelations: [] }
    }

    const calculateCorrelationForStat = (statKey: string, type: "simple" | "advanced"): StatCorrelation => {
      const statGroup = type === "simple" ? "averages" : "advancedStats"
      const label =
        type === "simple"
          ? data.simpleStats.find((s) => s.key === statKey)?.label || statKey
          : data.advancedStats.find((s) => s.key === statKey)?.label || statKey

      // Calculate average difference between wins and losses for this stat
      let totalDifference = 0
      let validPlayerCount = 0
      let absAvgDifference = 0

      data.players.forEach((player) => {
        const winValue = player.wins[statGroup][statKey] || 0
        const lossValue = player.losses[statGroup][statKey] || 0

        // Only include players who have played in both wins and losses
        if (player.wins.averages.GAMES_PLAYED > 0 && player.losses.averages.GAMES_PLAYED > 0) {
          let difference = winValue - lossValue

          // For stats where lower is better, invert the difference
          if (["TOV", "TOVpercent", "PF", "DefRtg"].includes(statKey)) {
            difference = -difference
          }

          totalDifference += difference
          absAvgDifference += Math.abs(difference)
          validPlayerCount++
        }
      })

      // Calculate average difference and normalize it
      const avgDifference = validPlayerCount > 0 ? totalDifference / validPlayerCount : 0
      const avgAbsDifference = validPlayerCount > 0 ? absAvgDifference / validPlayerCount : 0

      // Normalize to a score between -1 and 1
      // The sign indicates if higher values correlate with wins (positive) or losses (negative)
      // The magnitude indicates the strength of the correlation
      const correlationScore = avgAbsDifference > 0 ? avgDifference / avgAbsDifference : 0

      return {
        key: statKey,
        label,
        correlationScore,
        type,
      }
    }

    // Calculate correlations for simple stats
    const simpleCorrelations: StatCorrelation[] = data.simpleStats
      .map((stat) => calculateCorrelationForStat(stat.key, "simple"))
      .sort((a, b) => Math.abs(b.correlationScore) - Math.abs(a.correlationScore))

    // Calculate correlations for advanced stats
    const advancedCorrelations: StatCorrelation[] = data.advancedStats
      .map((stat) => calculateCorrelationForStat(stat.key, "advanced"))
      .sort((a, b) => Math.abs(b.correlationScore) - Math.abs(a.correlationScore))

    return { simpleCorrelations, advancedCorrelations }
  }, [data])

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
    // Special handling for plus/minus which can have negative values
    if (statKey === "PLUS_MINUS" || statKey === "NetRtg") {
      // Find the absolute maximum value (positive or negative)
      const absMax = Math.max(Math.abs(winValue), Math.abs(lossValue), 1) // Ensure at least 1 to avoid division by zero

      // Calculate width percentages based on the absolute maximum
      const winWidthPercent = (Math.abs(winValue) / absMax) * 50 // 50% of the bar area
      const lossWidthPercent = (Math.abs(lossValue) / absMax) * 50 // 50% of the bar area

      return (
        <div className="space-y-6">
          {/* Win bar */}
          <div className="flex items-center">
            <div className="w-24 text-sm font-medium flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              Victorias
            </div>
            <div className="flex-1 relative h-10">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-500 transform -translate-x-1/2"></div>

              {/* Negative area (left side) */}
              <div className="absolute right-1/2 top-0 h-full w-1/2 bg-gray-700/50 rounded-l-lg overflow-hidden">
                {winValue < 0 && (
                  <div
                    className="absolute right-0 top-0 h-full bg-red-600 rounded-l-lg"
                    style={{ width: `${winWidthPercent}%` }}
                  ></div>
                )}
              </div>

              {/* Positive area (right side) */}
              <div className="absolute left-1/2 top-0 h-full w-1/2 bg-gray-700/50 rounded-r-lg overflow-hidden">
                {winValue > 0 && (
                  <div
                    className="absolute left-0 top-0 h-full bg-green-600 rounded-r-lg"
                    style={{ width: `${winWidthPercent}%` }}
                  ></div>
                )}
              </div>
            </div>
            <div className="w-16 text-right text-sm font-medium ml-2">{formatStatValue(winValue, statKey)}</div>
          </div>

          {/* Loss bar */}
          <div className="flex items-center">
            <div className="w-24 text-sm font-medium flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              Derrotas
            </div>
            <div className="flex-1 relative h-10">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-500 transform -translate-x-1/2"></div>

              {/* Negative area (left side) */}
              <div className="absolute right-1/2 top-0 h-full w-1/2 bg-gray-700/50 rounded-l-lg overflow-hidden">
                {lossValue < 0 && (
                  <div
                    className="absolute right-0 top-0 h-full bg-red-600 rounded-l-lg"
                    style={{ width: `${lossWidthPercent}%` }}
                  ></div>
                )}
              </div>

              {/* Positive area (right side) */}
              <div className="absolute left-1/2 top-0 h-full w-1/2 bg-gray-700/50 rounded-r-lg overflow-hidden">
                {lossValue > 0 && (
                  <div
                    className="absolute left-0 top-0 h-full bg-green-600 rounded-r-lg"
                    style={{ width: `${lossWidthPercent}%` }}
                  ></div>
                )}
              </div>
            </div>
            <div className="w-16 text-right text-sm font-medium ml-2">{formatStatValue(lossValue, statKey)}</div>
          </div>
        </div>
      )
    }

    // For some stats like TOV, lower is better, so we need to invert the colors
    const invertColors = ["TOV", "TOVpercent", "PF", "DefRtg"].includes(statKey)

    const winWidth = `${(winValue / maxValue) * 100}%`
    const lossWidth = `${(lossValue / maxValue) * 100}%`

    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <div className="w-24 text-sm font-medium flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            Victorias
          </div>
          <div className="flex-1 h-10 bg-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
            <div
              className={`h-full ${invertColors ? "bg-red-600" : "bg-green-600"} rounded-lg transition-all duration-500 ease-out`}
              style={{ width: winWidth }}
            ></div>
          </div>
          <div className="w-16 text-right text-sm font-medium ml-2">{formatStatValue(winValue, statKey)}</div>
        </div>
        <div className="flex items-center">
          <div className="w-24 text-sm font-medium flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            Derrotas
          </div>
          <div className="flex-1 h-10 bg-gray-700/50 rounded-lg overflow-hidden backdrop-blur-sm">
            <div
              className={`h-full ${invertColors ? "bg-green-600" : "bg-red-600"} rounded-lg transition-all duration-500 ease-out`}
              style={{ width: lossWidth }}
            ></div>
          </div>
          <div className="w-16 text-right text-sm font-medium ml-2">{formatStatValue(lossValue, statKey)}</div>
        </div>
      </div>
    )
  }

  // Correlation bar component
  const CorrelationBar = ({ score }: { score: number }) => {
    const absScore = Math.abs(score)
    const width = `${absScore * 100}%`
    const isPositive = score > 0

    return (
      <div className="flex-1 relative h-8">
        <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-500 transform -translate-x-1/2"></div>

        {isPositive ? (
          <div className="absolute left-1/2 top-0 h-full w-1/2 bg-gray-700/50 rounded-r-lg overflow-hidden">
            <div className="absolute left-0 top-0 h-full bg-green-600 rounded-r-lg" style={{ width }}></div>
          </div>
        ) : (
          <div className="absolute right-1/2 top-0 h-full w-1/2 bg-gray-700/50 rounded-l-lg overflow-hidden">
            <div className="absolute right-0 top-0 h-full bg-red-600 rounded-l-lg" style={{ width }}></div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-semibold">Cargando estadísticas...</h1>
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
          <h1 className="text-2xl font-semibold mb-4">Error al cargar estadísticas</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Volver al inicio
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
          <h1 className="text-2xl font-semibold mb-4">No hay datos disponibles</h1>
          <p className="text-gray-400 mb-6">No hay datos de estadísticas de jugadores disponibles actualmente.</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Volver al inicio
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
      gradient: "from-green-800 to-blue-900",
      icon: <BarChart3 className="h-5 w-5" />,
      accentColor: "bg-green-600",
      cardGradient: "from-gray-800 to-gray-700",
      buttonGradient: "from-green-600 to-blue-700",
      statBg: "bg-gray-800",
      statBorder: "border-gray-700",
    },
    advanced: {
      gradient: "from-blue-800 to-purple-900",
      icon: <TrendingUp className="h-5 w-5" />,
      accentColor: "bg-blue-600",
      cardGradient: "from-gray-800 to-gray-700",
      buttonGradient: "from-blue-600 to-purple-700",
      statBg: "bg-gray-800",
      statBorder: "border-gray-700",
    },
  }

  const theme = tabTheme[activeTab]
  

  // Get the appropriate correlations based on the selected tab
  const { simpleCorrelations, advancedCorrelations } = calculateStatCorrelations
  const currentCorrelations = correlationTab === "simple" ? simpleCorrelations : advancedCorrelations

  return (
    <div className="flex flex-col min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <Link
              href="/"
              className="mr-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Análisis de Victorias vs Derrotas</h1>
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
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 flex items-center justify-center ${
                activeTab === "simple"
                  ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Estadísticas Simples
            </button>
            <button
              onClick={() => handleTabChange("advanced")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 flex items-center justify-center ${
                activeTab === "advanced"
                  ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Métricas Avanzadas
            </button>
          </div>
        </div>

        {/* Stat Selector */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Seleccionar Estadística</h2>
            <div className={`ml-4 h-1 flex-grow ${theme.accentColor} rounded-full`}></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {currentStats.map((stat) => (
              <button
                key={stat.key}
                onClick={() => handleStatChange(stat.key)}
                className={`p-3 rounded-lg text-center transition-all ${
                  selectedStat === stat.key
                    ? theme.accentColor
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
          <div className="flex flex-wrap items-center gap-4 bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="text-sm font-medium text-gray-400">Ordenar por:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSortChange("name")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === "name" ? "bg-blue-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                }`}
              >
                Nombre {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("wins")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === "wins" ? "bg-green-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                }`}
              >
                Victorias {sortBy === "wins" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("losses")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === "losses" ? "bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                }`}
              >
                Derrotas {sortBy === "losses" && (sortDirection === "asc" ? "↑" : "↓")}
              </button>
              <button
                onClick={() => handleSortChange("difference")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortBy === "difference" ? "bg-purple-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                }`}
              >
                Diferencia {sortBy === "difference" && (sortDirection === "asc" ? "↑" : "↓")}
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
              <div
                key={player.playerId}
                className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 mr-4 ring-2 ring-gray-600">
                      <Image
                        src={player.image || "/placeholder.svg?height=48&width=48&query=basketball player"}
                        alt={player.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{player.name}</h3>
                      <p className="text-sm text-gray-400">
                        <span className="inline-flex items-center bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full text-xs mr-2">
                          V: {player.wins.averages.GAMES_PLAYED}
                        </span>
                        <span className="inline-flex items-center bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full text-xs">
                          D: {player.losses.averages.GAMES_PLAYED}
                        </span>
                      </p>
                    </div>
                    <div className="ml-auto flex items-center">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isPositive
                            ? "bg-green-900/50 text-green-400 border border-green-700/50"
                            : "bg-red-900/50 text-red-400 border border-red-700/50"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {formatStatValue(difference, selectedStat)}
                      </div>
                      <div className="relative ml-2 group">
                        <button className="p-1 rounded-full hover:bg-gray-700">
                          <Info className="h-4 w-4 text-blue-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-gray-900 rounded-md shadow-lg text-xs hidden group-hover:block z-10 border border-gray-700">
                          <p>Diferencia entre rendimiento en victorias vs derrotas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <div className="flex justify-between mb-3">
                      <div className="font-medium text-lg">{currentStatInfo?.label || selectedStat}</div>
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

        {/* Correlation Analysis Section */}
        <div className="mt-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Estadísticas que Impactan en Victorias</h2>
            <div className={`ml-4 h-1 flex-grow bg-yellow-500 rounded-full`}></div>
            <button
              onClick={() => setShowCorrelationSection(!showCorrelationSection)}
              className="ml-4 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            >
              {showCorrelationSection ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
          </div>

          {showCorrelationSection && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold flex items-center">
                      <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                      Ranking de Impacto en Victorias
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Estadísticas ordenadas por su correlación con ganar partidos
                    </p>
                  </div>

                  <div className="flex bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setCorrelationTab("simple")}
                      className={`py-2 px-4 text-center rounded-md transition-all duration-300 text-sm ${
                        correlationTab === "simple"
                          ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                          : "text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Estadísticas Simples
                    </button>
                    <button
                      onClick={() => setCorrelationTab("advanced")}
                      className={`py-2 px-4 text-center rounded-md transition-all duration-300 text-sm ${
                        correlationTab === "advanced"
                          ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                          : "text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Métricas Avanzadas
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4 text-sm text-gray-400 px-2">
                    <div className="w-1/3">Estadística</div>
                    <div className="flex-1 text-center">Correlación con Victoria</div>
                    <div className="w-16 text-right">Impacto</div>
                  </div>

                  <div className="space-y-4">
                    {currentCorrelations.slice(0, 10).map((stat, index) => {
                      const absScore = Math.abs(stat.correlationScore)
                      const impactLevel = absScore > 0.7 ? "Alto" : absScore > 0.4 ? "Medio" : "Bajo"

                      const impactColor =
                        absScore > 0.7 ? "text-green-400" : absScore > 0.4 ? "text-yellow-400" : "text-gray-400"

                      return (
                        <div
                          key={stat.key}
                          className="flex items-center bg-gray-700/30 rounded-lg p-3 hover:bg-gray-700/50 transition-all"
                        >
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-full mr-3 text-sm font-bold">
                            {index + 1}
                          </div>
                          <div className="w-1/3">
                            <div className="font-medium">{stat.label}</div>
                            <div className="text-xs text-gray-400">{stat.key}</div>
                          </div>
                          <div className="flex-1 px-4">
                            <CorrelationBar score={stat.correlationScore} />
                          </div>
                          <div className={`w-16 text-right font-medium ${impactColor}`}>{impactLevel}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4 mt-6">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Info className="h-4 w-4 text-blue-400 mr-2" />
                    Cómo interpretar este análisis
                  </h4>
                  <p className="text-sm text-gray-300">
                    Este ranking muestra qué estadísticas tienen mayor correlación con ganar partidos. Una barra verde
                    hacia la derecha indica que valores más altos de esa estadística están asociados con victorias. Una
                    barra roja hacia la izquierda indica que valores más bajos están asociados con victorias.
                  </p>
                  <p className="text-sm text-gray-300 mt-2">
                    El nivel de impacto (Alto, Medio, Bajo) indica la fuerza de la correlación entre la estadística y el
                    resultado del partido.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Explanation Section */}
        <div className="mt-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Acerca de este Análisis</h2>
            <div className={`ml-4 h-1 flex-grow ${theme.accentColor} rounded-full`}></div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
            <p className="text-gray-300 mb-6">
              Este análisis compara cómo las estadísticas de los jugadores difieren entre victorias y derrotas. Al
              examinar estas diferencias, podemos identificar qué áreas estadísticas tienen mayor impacto en los
              resultados de los partidos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <div className="flex items-center mb-3">
                  <div className="bg-green-600/20 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-white">Victorias</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Las barras verdes representan el rendimiento promedio del jugador en los partidos que el equipo ganó.
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <div className="flex items-center mb-3">
                  <div className="bg-red-600/20 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-red-500" />
                  </div>
                  <h3 className="font-semibold text-white">Derrotas</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Las barras rojas representan el rendimiento promedio del jugador en los partidos que el equipo perdió.
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50">
                <div className="flex items-center mb-3">
                  <div className="bg-blue-600/20 p-2 rounded-lg mr-3">
                    <ArrowUpDown className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-semibold text-white">Diferencia</h3>
                </div>
                <p className="text-gray-300 text-sm">
                  Muestra cuánto mejor (o peor) rinde un jugador en victorias comparado con derrotas. Una diferencia
                  positiva generalmente indica mejor rendimiento en victorias.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Análisis de Baloncesto. TFG Guillermo</p>
        </div>
      </footer>
    </div>
  )
}
