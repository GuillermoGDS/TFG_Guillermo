"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  Loader2,
  TrendingUp,
  Search,
  Info,
  AlertTriangle,
  Activity,
  LineChart,
  BarChart,
  Zap,
  Award,
  TrendingDown,
} from "lucide-react"

// Actualizar las interfaces para incluir estadísticas avanzadas
interface PlayerGameStats {
  Game_ID: string
  GAME_DATE: string
  PTS: number
  AST: number
  REB: number
  FG_PCT: number
  FT_PCT: number
  FG3_PCT: number
  PLUS_MINUS: number
  // Estadísticas avanzadas
  OFF_RTG: number
  DEF_RTG: number
  NET_RTG: number
  TS_PCT: number
  EFG_PCT: number
  AST_TO_RATIO: number
  TOV_PCT: number
  USG_PCT: number
}

interface PlayerConsistencyData {
  playerId: number
  name: string
  image: string
  gamesPlayed: number
  averages: {
    PTS: number
    AST: number
    REB: number
    FG_PCT: number
    FT_PCT: number
    FG3_PCT: number
    PLUS_MINUS: number
    // Estadísticas avanzadas
    OFF_RTG: number
    DEF_RTG: number
    NET_RTG: number
    TS_PCT: number
    EFG_PCT: number
    AST_TO_RATIO: number
    TOV_PCT: number
    USG_PCT: number
  }
  standardDeviations: {
    PTS: number
    AST: number
    REB: number
    FG_PCT: number
    FT_PCT: number
    FG3_PCT: number
    PLUS_MINUS: number
    // Estadísticas avanzadas
    OFF_RTG: number
    DEF_RTG: number
    NET_RTG: number
    TS_PCT: number
    EFG_PCT: number
    AST_TO_RATIO: number
    TOV_PCT: number
    USG_PCT: number
  }
  coefficientOfVariation: {
    PTS: number
    AST: number
    REB: number
    FG_PCT: number
    FT_PCT: number
    FG3_PCT: number
    PLUS_MINUS: number
    // Estadísticas avanzadas
    OFF_RTG: number
    DEF_RTG: number
    NET_RTG: number
    TS_PCT: number
    EFG_PCT: number
    AST_TO_RATIO: number
    TOV_PCT: number
    USG_PCT: number
  }
  gameData: PlayerGameStats[]
}

interface ApiResponse {
  team: string
  season: string
  players: PlayerConsistencyData[]
  simpleStatsCategories: StatCategory[]
  advancedStatsCategories: StatCategory[]
}

// Definir la interfaz StatCategory
interface StatCategory {
  key: string
  label: string
}

// Añadir un nuevo estado para controlar la pestaña activa (simple o avanzada)
export default function PlayerConsistencyAnalysis() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerConsistencyData | null>(null)
  const [selectedStat, setSelectedStat] = useState<string>("PTS")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "consistency" | "average">("consistency")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const boxPlotCanvasRef = useRef<HTMLCanvasElement>(null)
  const scatterPlotCanvasRef = useRef<HTMLCanvasElement>(null)
  // Nuevo estado para controlar la pestaña activa
  const [activeStatTab, setActiveStatTab] = useState<"simple" | "advanced">("simple")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/player-consistency")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        // Set default selected player
        if (result.players && result.players.length > 0) {
          setSelectedPlayer(result.players[0])
        }

        // Set default selected stat based on active tab
        if (result.simpleStatsCategories && result.simpleStatsCategories.length > 0) {
          setSelectedStat(result.simpleStatsCategories[0].key)
        }
      } catch (error) {
        console.error("Error fetching player consistency data:", error)
        setError("Failed to load player statistics. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (selectedPlayer && boxPlotCanvasRef.current) {
      drawBoxPlot()
    }
  }, [selectedPlayer, selectedStat, boxPlotCanvasRef])

  useEffect(() => {
    if (selectedPlayer && scatterPlotCanvasRef.current) {
      drawScatterPlot()
    }
  }, [selectedPlayer, selectedStat, scatterPlotCanvasRef])

  const handlePlayerSelect = (player: PlayerConsistencyData) => {
    setSelectedPlayer(player)
  }

  const handleStatChange = (stat: string) => {
    setSelectedStat(stat)
  }

  const handleSortChange = (sortType: "name" | "consistency" | "average") => {
    if (sortBy === sortType) {
      // Toggle direction if clicking the same sort option
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(sortType)
      // Default to ascending for name, descending for stats
      setSortDirection(sortType === "name" ? "asc" : "desc")
    }
  }

  const sortPlayers = (players: PlayerConsistencyData[]): PlayerConsistencyData[] => {
    return [...players].sort((a, b) => {
      let comparison = 0

      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === "consistency") {
        // Lower coefficient of variation means more consistent
        comparison = a.coefficientOfVariation[selectedStat] - b.coefficientOfVariation[selectedStat]
      } else if (sortBy === "average") {
        comparison = a.averages[selectedStat] - b.averages[selectedStat]
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }

  // Modificar la función formatStatValue para manejar estadísticas avanzadas
  const formatStatValue = (value: number, statKey: string): string => {
    if (["FG_PCT", "FT_PCT", "FG3_PCT", "TS_PCT", "EFG_PCT", "TOV_PCT", "USG_PCT"].includes(statKey)) {
      return `${(value * 100).toFixed(1)}%`
    } else if (["OFF_RTG", "DEF_RTG", "NET_RTG"].includes(statKey)) {
      return value.toFixed(1)
    } else if (statKey === "AST_TO_RATIO") {
      return value.toFixed(2)
    } else {
      return value.toFixed(1)
    }
  }

  const getConsistencyRating = (cv: number): { label: string; color: string } => {
    // Lower CV means more consistent
    if (cv < 0.15) return { label: "Muy consistente", color: "text-green-400" }
    if (cv < 0.25) return { label: "Consistente", color: "text-blue-400" }
    if (cv < 0.35) return { label: "Moderado", color: "text-yellow-400" }
    if (cv < 0.45) return { label: "Variable", color: "text-orange-400" }
    return { label: "Muy variable", color: "text-red-400" }
  }

  const drawBoxPlot = () => {
    if (!selectedPlayer || !boxPlotCanvasRef.current) return

    const canvas = boxPlotCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 40, right: 30, bottom: 60, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Get data for selected stat
    const values = selectedPlayer.gameData.map((game) => game[selectedStat])
    values.sort((a, b) => a - b)

    // Calculate box plot values
    const min = values[0]
    const max = values[values.length - 1]
    const q1 = calculateQuantile(values, 0.25)
    const median = calculateQuantile(values, 0.5)
    const q3 = calculateQuantile(values, 0.75)
    const iqr = q3 - q1
    const lowerWhisker = Math.max(min, q1 - 1.5 * iqr)
    const upperWhisker = Math.min(max, q3 + 1.5 * iqr)

    // Calculate outliers
    const outliers = values.filter((v) => v < lowerWhisker || v > upperWhisker)

    // Scale values to chart dimensions
    const valueRange = Math.max(upperWhisker - lowerWhisker, 1) * 1.1 // Add 10% padding
    const valueMin = Math.max(0, lowerWhisker - valueRange * 0.05) // Ensure non-negative for most stats

    const scaleY = (value: number) => {
      return padding.top + chartHeight - ((value - valueMin) / valueRange) * chartHeight
    }

    // Draw axes
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, padding.top + chartHeight)
    ctx.stroke()

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top + chartHeight)
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.fillStyle = "#fff"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    const numTicks = 5
    for (let i = 0; i <= numTicks; i++) {
      const value = valueMin + (valueRange * i) / numTicks
      const y = scaleY(value)

      ctx.beginPath()
      ctx.moveTo(padding.left - 5, y)
      ctx.lineTo(padding.left, y)
      ctx.stroke()

      ctx.fillText(formatStatValue(value, selectedStat), padding.left - 10, y)
    }

    // Draw title
    ctx.fillStyle = "#fff"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    const statLabel =
      data?.simpleStatsCategories.find((cat) => cat.key === selectedStat)?.label ||
      data?.advancedStatsCategories.find((cat) => cat.key === selectedStat)?.label ||
      selectedStat
    ctx.fillText(`Distribución de ${statLabel} por Partido`, width / 2, 10)

    // Draw box plot
    const boxLeft = padding.left + chartWidth * 0.3
    const boxRight = padding.left + chartWidth * 0.7
    const boxWidth = boxRight - boxLeft

    // Draw box
    ctx.fillStyle = "rgba(79, 70, 229, 0.3)"
    ctx.strokeStyle = "rgb(79, 70, 229)"
    ctx.lineWidth = 2
    ctx.fillRect(boxLeft, scaleY(q3), boxWidth, scaleY(q1) - scaleY(q3))
    ctx.strokeRect(boxLeft, scaleY(q3), boxWidth, scaleY(q1) - scaleY(q3))

    // Draw median line
    ctx.beginPath()
    ctx.moveTo(boxLeft, scaleY(median))
    ctx.lineTo(boxRight, scaleY(median))
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw whiskers
    ctx.strokeStyle = "rgb(79, 70, 229)"
    ctx.lineWidth = 1

    // Upper whisker
    ctx.beginPath()
    ctx.moveTo(boxLeft + boxWidth / 2, scaleY(q3))
    ctx.lineTo(boxLeft + boxWidth / 2, scaleY(upperWhisker))
    ctx.stroke()

    // Upper whisker cap
    ctx.beginPath()
    ctx.moveTo(boxLeft + boxWidth / 4, scaleY(upperWhisker))
    ctx.lineTo(boxRight - boxWidth / 4, scaleY(upperWhisker))
    ctx.stroke()

    // Lower whisker
    ctx.beginPath()
    ctx.moveTo(boxLeft + boxWidth / 2, scaleY(q1))
    ctx.lineTo(boxLeft + boxWidth / 2, scaleY(lowerWhisker))
    ctx.stroke()

    // Lower whisker cap
    ctx.beginPath()
    ctx.moveTo(boxLeft + boxWidth / 4, scaleY(lowerWhisker))
    ctx.lineTo(boxRight - boxWidth / 4, scaleY(lowerWhisker))
    ctx.stroke()

    // Draw outliers
    ctx.fillStyle = "rgba(220, 38, 38, 0.7)"
    outliers.forEach((value) => {
      ctx.beginPath()
      ctx.arc(boxLeft + boxWidth / 2, scaleY(value), 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw legend
    const legendY = padding.top + chartHeight + 30

    // Box
    ctx.fillStyle = "rgba(79, 70, 229, 0.3)"
    ctx.strokeStyle = "rgb(79, 70, 229)"
    ctx.fillRect(padding.left, legendY, 15, 15)
    ctx.strokeRect(padding.left, legendY, 15, 15)
    ctx.fillStyle = "#fff"
    ctx.textAlign = "left"
    ctx.fillText("Rango intercuartil (25%-75%)", padding.left + 25, legendY + 7)

    // Median
    ctx.beginPath()
    ctx.moveTo(padding.left + chartWidth / 2, legendY)
    ctx.lineTo(padding.left + chartWidth / 2 + 15, legendY)
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillText("Mediana", padding.left + chartWidth / 2 + 25, legendY)

    // Outlier
    ctx.fillStyle = "rgba(220, 38, 38, 0.7)"
    ctx.beginPath()
    ctx.arc(padding.left + chartWidth / 2, legendY + 20, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = "#fff"
    ctx.fillText("Valores atípicos", padding.left + chartWidth / 2 + 25, legendY + 20)
  }

  const drawScatterPlot = () => {
    if (!selectedPlayer || !scatterPlotCanvasRef.current) return

    const canvas = scatterPlotCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 40, right: 30, bottom: 60, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Get data for selected stat
    const gameData = [...selectedPlayer.gameData].sort(
      (a, b) => new Date(a.GAME_DATE).getTime() - new Date(b.GAME_DATE).getTime(),
    )

    const values = gameData.map((game) => game[selectedStat])
    const dates = gameData.map((game) => new Date(game.GAME_DATE))

    // Calculate statistics
    const mean = selectedPlayer.averages[selectedStat]
    const stdDev = selectedPlayer.standardDeviations[selectedStat]

    // Scale values to chart dimensions
    const valueRange = Math.max(Math.max(...values) - Math.min(...values), stdDev * 4, 1)
    const valueMin = Math.max(0, mean - valueRange / 2) // Center around mean, ensure non-negative
    const valueMax = valueMin + valueRange

    const dateRange = dates[dates.length - 1].getTime() - dates[0].getTime()
    const dateMin = dates[0].getTime()

    const scaleY = (value: number) => {
      return padding.top + chartHeight - ((value - valueMin) / valueRange) * chartHeight
    }

    const scaleX = (date: Date) => {
      return padding.left + ((date.getTime() - dateMin) / dateRange) * chartWidth
    }

    // Draw axes
    ctx.strokeStyle = "#666"
    ctx.lineWidth = 1

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, padding.top + chartHeight)
    ctx.stroke()

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top + chartHeight)
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.stroke()

    // Draw Y-axis labels
    ctx.fillStyle = "#fff"
    ctx.font = "12px Arial"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    const numYTicks = 5
    for (let i = 0; i <= numYTicks; i++) {
      const value = valueMin + (valueRange * i) / numYTicks
      const y = scaleY(value)

      ctx.beginPath()
      ctx.moveTo(padding.left - 5, y)
      ctx.lineTo(padding.left, y)
      ctx.stroke()

      ctx.fillText(formatStatValue(value, selectedStat), padding.left - 10, y)
    }

    // Draw X-axis labels (dates)
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    const numXTicks = Math.min(5, dates.length)
    for (let i = 0; i <= numXTicks; i++) {
      const dateIndex = Math.floor((dates.length - 1) * (i / numXTicks))
      const date = dates[dateIndex]
      const x = scaleX(date)

      ctx.beginPath()
      ctx.moveTo(x, padding.top + chartHeight)
      ctx.lineTo(x, padding.top + chartHeight + 5)
      ctx.stroke()

      // Format date as MM/DD
      const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`
      ctx.fillText(formattedDate, x, padding.top + chartHeight + 10)
    }

    // Draw title
    ctx.fillStyle = "#fff"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    const statLabel =
      data?.simpleStatsCategories.find((cat) => cat.key === selectedStat)?.label ||
      data?.advancedStatsCategories.find((cat) => cat.key === selectedStat)?.label ||
      selectedStat
    ctx.fillText(`Evolución de ${statLabel} a lo largo de la temporada`, width / 2, 10)

    // Draw confidence bands (mean ± 1 stdDev, mean ± 2 stdDev)
    // 1 stdDev band
    ctx.fillStyle = "rgba(79, 70, 229, 0.2)"
    ctx.beginPath()
    ctx.moveTo(scaleX(dates[0]), scaleY(mean + stdDev))

    // Draw upper 1 stdDev band
    for (let i = 0; i < dates.length; i++) {
      ctx.lineTo(scaleX(dates[i]), scaleY(mean + stdDev))
    }

    // Draw lower 1 stdDev band
    for (let i = dates.length - 1; i >= 0; i--) {
      ctx.lineTo(scaleX(dates[i]), scaleY(mean - stdDev))
    }

    ctx.closePath()
    ctx.fill()

    // 2 stdDev band
    ctx.fillStyle = "rgba(79, 70, 229, 0.1)"
    ctx.beginPath()
    ctx.moveTo(scaleX(dates[0]), scaleY(mean + 2 * stdDev))

    // Draw upper 2 stdDev band
    for (let i = 0; i < dates.length; i++) {
      ctx.lineTo(scaleX(dates[i]), scaleY(mean + 2 * stdDev))
    }

    // Draw lower 2 stdDev band
    for (let i = dates.length - 1; i >= 0; i--) {
      ctx.lineTo(scaleX(dates[i]), scaleY(mean - 2 * stdDev))
    }

    ctx.closePath()
    ctx.fill()

    // Draw mean line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
    ctx.lineWidth = 1
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(padding.left, scaleY(mean))
    ctx.lineTo(padding.left + chartWidth, scaleY(mean))
    ctx.stroke()
    ctx.setLineDash([])

    // Draw data points and connect with line
    ctx.strokeStyle = "rgb(79, 70, 229)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(scaleX(dates[0]), scaleY(values[0]))

    for (let i = 1; i < dates.length; i++) {
      ctx.lineTo(scaleX(dates[i]), scaleY(values[i]))
    }

    ctx.stroke()

    // Draw points
    ctx.fillStyle = "#fff"
    for (let i = 0; i < dates.length; i++) {
      ctx.beginPath()
      ctx.arc(scaleX(dates[i]), scaleY(values[i]), 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }

    // Draw legend
    const legendY = padding.top + chartHeight + 30

    // Mean line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    ctx.moveTo(padding.left, legendY)
    ctx.lineTo(padding.left + 20, legendY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = "#fff"
    ctx.textAlign = "left"
    ctx.fillText("Media", padding.left + 25, legendY)

    // 1 StdDev band
    ctx.fillStyle = "rgba(79, 70, 229, 0.2)"
    ctx.fillRect(padding.left + chartWidth / 2 - 30, legendY - 7, 15, 15)
    ctx.fillStyle = "#fff"
    ctx.fillText("±1 Desv. Estándar", padding.left + chartWidth / 2 - 10, legendY)

    // Data point
    ctx.fillStyle = "#fff"
    ctx.strokeStyle = "rgb(79, 70, 229)"
    ctx.beginPath()
    ctx.arc(padding.left + chartWidth / 2 - 30, legendY + 20, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = "#fff"
    ctx.fillText("Valor por partido", padding.left + chartWidth / 2 - 10, legendY + 20)
  }

  const calculateQuantile = (sortedValues: number[], q: number) => {
    const pos = (sortedValues.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base

    if (sortedValues[base + 1] !== undefined) {
      return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base])
    } else {
      return sortedValues[base]
    }
  }

  const filteredPlayers =
    data?.players.filter((player) => player.name.toLowerCase().includes(searchTerm.toLowerCase())) || []

  const sortedPlayers = sortPlayers(filteredPlayers)

  // Añadir función para cambiar entre pestañas de estadísticas
  const handleTabChange = (tab: "simple" | "advanced") => {
    setActiveStatTab(tab)

    // Establecer una estadística predeterminada para la pestaña seleccionada
    if (data) {
      if (tab === "simple" && data.simpleStatsCategories.length > 0) {
        setSelectedStat(data.simpleStatsCategories[0].key)
      } else if (tab === "advanced" && data.advancedStatsCategories.length > 0) {
        setSelectedStat(data.advancedStatsCategories[0].key)
      }
    }
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
            <Activity className="w-16 h-16 text-yellow-500" />
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

  return (
    <div className="flex flex-col min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-green-800 to-blue-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ChevronLeft className="h-8 w-8 text-blue-200 hover:text-white transition-colors" />
            </Link>
            <div>
              <div className="flex items-center">
                <h1 className="text-4xl md:text-5xl font-bold">Análisis de Consistencia</h1>
                <div className="ml-4 flex items-center justify-center p-2 rounded-lg bg-white/10">
                  <BarChart className="h-6 w-6" />
                </div>
              </div>
              <p className="text-blue-100 mt-2">
                {data.team} • {data.season} Season
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Stat Tabs */}
        <div className="mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => handleTabChange("simple")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeStatTab === "simple"
                  ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <BarChart className="h-5 w-5 mr-2" />
                <span>Estadísticas Simples</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange("advanced")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeStatTab === "advanced"
                  ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>Estadísticas Avanzadas</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stat Selector */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Seleccionar Estadística</h2>
            <div
              className={`ml-4 h-1 flex-grow ${activeStatTab === "simple" ? "bg-green-600" : "bg-blue-600"} rounded-full`}
            ></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {data &&
              (activeStatTab === "simple" ? data.simpleStatsCategories : data.advancedStatsCategories).map((stat) => (
                <button
                  key={stat.key}
                  onClick={() => handleStatChange(stat.key)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedStat === stat.key
                      ? `bg-gradient-to-r ${
                          activeStatTab === "simple" ? "from-green-600 to-blue-700" : "from-blue-600 to-purple-700"
                        } shadow-lg transform scale-105`
                      : `${
                          activeStatTab === "simple"
                            ? "bg-green-600/10 border border-green-600/30"
                            : "bg-blue-600/10 border border-blue-600/30"
                        } hover:bg-opacity-20`
                  }`}
                >
                  <span className="text-sm font-medium">{stat.label}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Selection Panel */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Seleccionar Jugador</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar jugadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Sorting Controls */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 bg-gray-700 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-400">Ordenar por:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSortChange("name")}
                    className={`px-3 py-1 text-xs rounded-md border border-gray-600 ${
                      sortBy === "name" ? "bg-gray-600" : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Nombre {sortBy === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleSortChange("consistency")}
                    className={`px-3 py-1 text-xs rounded-md border border-gray-600 ${
                      sortBy === "consistency" ? "bg-gray-600" : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Consistencia {sortBy === "consistency" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                  <button
                    onClick={() => handleSortChange("average")}
                    className={`px-3 py-1 text-xs rounded-md border border-gray-600 ${
                      sortBy === "average" ? "bg-gray-600" : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    Promedio {sortBy === "average" && (sortDirection === "asc" ? "↑" : "↓")}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {sortedPlayers.map((player) => {
                const isSelected = selectedPlayer?.playerId === player.playerId
                const consistencyRating = getConsistencyRating(player.coefficientOfVariation[selectedStat])

                return (
                  <div
                    key={player.playerId}
                    onClick={() => handlePlayerSelect(player)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-green-900 border border-green-700"
                        : "bg-gray-700 hover:bg-gray-600 border border-gray-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600 mr-3">
                      <Image
                        src={player.image || "/placeholder.svg"}
                        alt={player.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left flex-grow">
                      <div className="font-medium">{player.name}</div>
                      <div className="flex items-center text-xs">
                        <span className="text-gray-400 mr-2">
                          {formatStatValue(player.averages[selectedStat], selectedStat)}
                        </span>
                        <span className={`${consistencyRating.color}`}>{consistencyRating.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Visualization Panel */}
          <div className="lg:col-span-2">
            {selectedPlayer ? (
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4">
                    <Image
                      src={selectedPlayer.image || "/placeholder.svg"}
                      alt={selectedPlayer.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
                    <p className="text-gray-400">
                      {selectedPlayer.gamesPlayed} partidos jugados • {data.season} Season
                    </p>
                  </div>
                </div>

                {/* Consistency Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Promedio</div>
                    <div className="text-2xl font-bold">
                      {formatStatValue(selectedPlayer.averages[selectedStat], selectedStat)}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Desviación Estándar</div>
                    <div className="text-2xl font-bold">
                      {formatStatValue(selectedPlayer.standardDeviations[selectedStat], selectedStat)}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Consistencia</div>
                    <div className="text-2xl font-bold">
                      <span className={getConsistencyRating(selectedPlayer.coefficientOfVariation[selectedStat]).color}>
                        {getConsistencyRating(selectedPlayer.coefficientOfVariation[selectedStat]).label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box Plot */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart className="mr-2 h-5 w-5 text-green-400" />
                    Distribución Estadística
                    <div className="relative ml-2 group">
                      <Info className="h-4 w-4 text-gray-400" />
                      <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 rounded-md shadow-lg text-xs hidden group-hover:block z-10">
                        <p>
                          El gráfico de cajas muestra la distribución de los valores, incluyendo mediana, cuartiles y
                          valores atípicos.
                        </p>
                      </div>
                    </div>
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <canvas ref={boxPlotCanvasRef} width={600} height={300} className="w-full h-auto"></canvas>
                  </div>
                </div>

                {/* Scatter Plot */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <LineChart className="mr-2 h-5 w-5 text-blue-400" />
                    Evolución Temporal
                    <div className="relative ml-2 group">
                      <Info className="h-4 w-4 text-gray-400" />
                      <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 rounded-md shadow-lg text-xs hidden group-hover:block z-10">
                        <p>
                          El gráfico muestra la evolución de los valores a lo largo de la temporada, con bandas de
                          confianza basadas en la desviación estándar.
                        </p>
                      </div>
                    </div>
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <canvas ref={scatterPlotCanvasRef} width={600} height={300} className="w-full h-auto"></canvas>
                  </div>
                </div>

                {/* Player Consistency Analysis */}
                <div className="mt-8 bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Zap className="mr-2 text-yellow-400" size={20} />
                    Análisis de Consistencia
                  </h3>

                  <div className="space-y-4">
                    {/* Strengths */}
                    <div>
                      <h4 className="text-md font-semibold mb-2 flex items-center text-green-400">
                        <Award className="mr-2" size={16} />
                        Estadísticas más consistentes
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(selectedPlayer.coefficientOfVariation)
                          .sort(([, a], [, b]) => a - b)
                          .slice(0, 2)
                          .map(([key, value]) => {
                            const statLabel =
                              data.simpleStatsCategories.find((cat) => cat.key === key)?.label ||
                              data.advancedStatsCategories.find((cat) => cat.key === key)?.label ||
                              key
                            return (
                              <div key={`consistent-${key}`} className="bg-gray-800 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{statLabel}</span>
                                  <span className="text-green-400">
                                    {formatStatValue(selectedPlayer.averages[key], key)} ±{" "}
                                    {formatStatValue(selectedPlayer.standardDeviations[key], key)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full"
                                    style={{ width: `${Math.max(100 - value * 200, 5)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">CV: {(value * 100).toFixed(1)}%</div>
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h4 className="text-md font-semibold mb-2 flex items-center text-red-400">
                        <TrendingDown className="mr-2" size={16} />
                        Estadísticas más variables
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(selectedPlayer.coefficientOfVariation)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 2)
                          .map(([key, value]) => {
                            const statLabel =
                              data.simpleStatsCategories.find((cat) => cat.key === key)?.label ||
                              data.advancedStatsCategories.find((cat) => cat.key === key)?.label ||
                              key
                            return (
                              <div key={`variable-${key}`} className="bg-gray-800 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{statLabel}</span>
                                  <span className="text-red-400">
                                    {formatStatValue(selectedPlayer.averages[key], key)} ±{" "}
                                    {formatStatValue(selectedPlayer.standardDeviations[key], key)}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2">
                                  <div
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(value * 200, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">CV: {(value * 100).toFixed(1)}%</div>
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="text-md font-semibold mb-2 flex items-center text-blue-400">
                        <AlertTriangle className="mr-2" size={16} />
                        Recomendaciones
                      </h4>
                      <ul className="space-y-2 bg-gray-800 rounded-lg p-4">
                        {selectedPlayer.coefficientOfVariation[selectedStat] > 0.3 ? (
                          <>
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              <span>
                                Trabajar en la consistencia de{" "}
                                {data.simpleStatsCategories
                                  .find((cat) => cat.key === selectedStat)
                                  ?.label.toLowerCase() ||
                                  data.advancedStatsCategories
                                    .find((cat) => cat.key === selectedStat)
                                    ?.label.toLowerCase() ||
                                  selectedStat}{" "}
                                a través de ejercicios específicos.
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              <span>
                                Analizar los factores que pueden estar causando la variabilidad (oponentes, fatiga,
                                etc.).
                              </span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              <span>
                                Mantener la consistencia actual en{" "}
                                {data.simpleStatsCategories
                                  .find((cat) => cat.key === selectedStat)
                                  ?.label.toLowerCase() ||
                                  data.advancedStatsCategories
                                    .find((cat) => cat.key === selectedStat)
                                    ?.label.toLowerCase() ||
                                  selectedStat}
                                .
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-400 mr-2">•</span>
                              <span>
                                Utilizar al jugador en situaciones donde se requiera estabilidad en esta estadística.
                              </span>
                            </li>
                          </>
                        )}
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          <span>
                            Revisar los partidos con valores atípicos para identificar patrones o causas específicas.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg">Selecciona un jugador para ver su análisis de consistencia</p>
              </div>
            )}
          </div>
        </div>

        {/* Explanation Section */}
        <div className="mt-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Acerca del Análisis de Consistencia</h2>
            <div className="ml-4 h-1 flex-grow bg-green-600 rounded-full"></div>
          </div>

          <div className="bg-green-900/20 border border-green-800/30 rounded-xl p-6 shadow-lg">
            <p className="text-gray-300 mb-4">
              El análisis de consistencia evalúa qué tan estable es el rendimiento de un jugador partido a partido,
              identificando si mantiene un nivel constante o si presenta grandes fluctuaciones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="bg-green-600 p-2 rounded-lg mr-3 mt-1">
                  <BarChart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Métricas clave</p>
                  <p className="text-gray-300">
                    Utilizamos la desviación estándar y el coeficiente de variación (CV) para medir la dispersión de los
                    datos. Un CV bajo indica mayor consistencia, mientras que un CV alto sugiere mayor variabilidad.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-blue-600 p-2 rounded-lg mr-3 mt-1">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Interpretación</p>
                  <p className="text-gray-300">
                    Los jugadores consistentes son más confiables en situaciones críticas, mientras que los jugadores
                    variables pueden tener partidos excepcionales pero también muy por debajo de su media.
                  </p>
                </div>
              </div>
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
