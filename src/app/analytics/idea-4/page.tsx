"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  TrendingUp,
  Loader2,
  BarChart3,
  Calendar,
  Search,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  User,
  LineChart,
} from "lucide-react"

interface StatPoint {
  date: string
  value: number
}

interface PlayerEvolution {
  playerId: number
  playerName: string
  image: string
  stats: {
    [key: string]: StatPoint[]
  }
  trend?: {
    value: number
    percentage: number
    isPositive: boolean
  }
}

interface ApiResponse {
  team: string
  season: string
  statType: string
  players: PlayerEvolution[]
  basicStats: string[]
  advancedStats: string[]
}

// Tooltip interface
interface TooltipData {
  visible: boolean
  x: number
  y: number
  date: string
  value: number
  playerName?: string
  color?: string
}

// Stat options with labels and colors
const statOptions = [
  // Simple Stats
  { key: "PTS", label: "Puntos", color: "#4f46e5", category: "simple" },
  { key: "AST", label: "Asistencias", color: "#0ea5e9", category: "simple" },
  { key: "REB", label: "Rebotes", color: "#10b981", category: "simple" },
  { key: "STL", label: "Robos", color: "#f59e0b", category: "simple" },
  { key: "BLK", label: "Tapones", color: "#8b5cf6", category: "simple" },
  { key: "TOV", label: "Pérdidas", color: "#ef4444", category: "simple" },
  { key: "FG_PCT", label: "% Tiros", color: "#ec4899", category: "simple" },
  { key: "FG3_PCT", label: "% Triples", color: "#3b82f6", category: "simple" },
  { key: "FT_PCT", label: "% Tiros Libres", color: "#eab308", category: "simple" },
  { key: "PLUS_MINUS", label: "+/-", color: "#6366f1", category: "simple" },
  { key: "MIN", label: "Minutos", color: "#94a3b8", category: "simple" },

  // Advanced Stats
  {
    key: "OffRtg",
    label: "Rating Ofensivo",
    color: "#0891b2",
    category: "advanced",
    description: "Puntos por 100 posesiones",
  },
  {
    key: "TS",
    label: "% Tiro Efectivo",
    color: "#7c3aed",
    category: "advanced",
    description: "Eficiencia de tiro considerando FG, 3PT y TL",
  },
  {
    key: "eFG",
    label: "% Tiro Efectivo de Campo",
    color: "#4338ca",
    category: "advanced",
    description: "Eficiencia de tiro considerando el valor de los triples",
  },
  {
    key: "ASTtoTO",
    label: "Ratio AST/TO",
    color: "#db2777",
    category: "advanced",
    description: "Ratio de Asistencias a Pérdidas",
  },
  {
    key: "TOVpercent",
    label: "% Pérdidas",
    color: "#ea580c",
    category: "advanced",
    description: "Porcentaje de posesiones que terminan en pérdida",
  },
  {
    key: "USG",
    label: "% de Uso",
    color: "#059669",
    category: "advanced",
    description: "Porcentaje de jugadas del equipo usadas por el jugador",
  },
]

// Time range options
const timeRangeOptions = [
  { key: "10", label: "Últimos 10 Partidos" },
  { key: "20", label: "Últimos 20 Partidos" },
  { key: "30", label: "Últimos 30 Partidos" },
]

export default function PlayerEvolution() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<string>("PTS")
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])
  const [timeRange, setTimeRange] = useState<string>("20")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeView, setActiveView] = useState<"individual" | "team" | "trends">("individual")
  const chartRef = useRef<HTMLCanvasElement>(null)
  const teamChartRef = useRef<HTMLCanvasElement>(null)
  const [statCategory, setStatCategory] = useState<"simple" | "advanced">("simple")

  // Tooltip state
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    date: "",
    value: 0,
  })

  // Team chart tooltip state
  const [teamTooltip, setTeamTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    date: "",
    value: 0,
    playerName: "",
    color: "",
  })

  // Store chart data for tooltip calculations
  const chartDataRef = useRef<{
    points: { x: number; y: number; date: string; value: number }[]
    padding: { top: number; right: number; bottom: number; left: number }
    chartWidth: number
    chartHeight: number
    minValue: number
    maxValue: number
  } | null>(null)

  // Store team chart data for tooltip calculations
  const teamChartDataRef = useRef<{
    players: {
      name: string
      color: string
      points: { x: number; y: number; date: string; value: number }[]
    }[]
    padding: { top: number; right: number; bottom: number; left: number }
    chartWidth: number
    chartHeight: number
    minValue: number
    maxValue: number
  } | null>(null)

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/player-evolution?stat=${selectedStat}&limit=${timeRange}`)

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        // Select first player by default if none selected
        if (selectedPlayers.length === 0 && result.players.length > 0) {
          setSelectedPlayers([result.players[0].playerId])
        }

        // If the selected stat doesn't match the category, switch to a default stat
        const selectedStatInfo = statOptions.find((s) => s.key === selectedStat)
        if (selectedStatInfo && selectedStatInfo.category !== statCategory) {
          if (statCategory === "simple") {
            setSelectedStat("PTS")
          } else {
            setSelectedStat("PER")
          }
        }
      } catch (error) {
        console.error("Error fetching player evolution data:", error)
        setError("No se pudieron cargar las estadísticas de jugadores. Por favor, inténtalo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedStat, timeRange, selectedPlayers.length, statCategory])

  // Handle mouse move on individual chart
  const handleChartMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!chartDataRef.current) return

    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const { points, padding, chartWidth, chartHeight } = chartDataRef.current

    // Check if mouse is within chart area
    if (x >= padding.left && x <= padding.left + chartWidth && y >= padding.top && y <= padding.top + chartHeight) {
      // Find closest point
      let closestPoint = null
      let minDistance = Number.MAX_VALUE

      for (const point of points) {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
        if (distance < minDistance) {
          minDistance = distance
          closestPoint = point
        }
      }

      // If we found a close point and it's reasonably close (within 30px)
      if (closestPoint && minDistance < 30) {
        setTooltip({
          visible: true,
          x: closestPoint.x,
          y: closestPoint.y,
          date: closestPoint.date,
          value: closestPoint.value,
        })
      } else {
        setTooltip((prev) => ({ ...prev, visible: false }))
      }
    } else {
      setTooltip((prev) => ({ ...prev, visible: false }))
    }
  }

  // Handle mouse leave on individual chart
  const handleChartMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }

  // Handle mouse move on team chart
  const handleTeamChartMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!teamChartDataRef.current) return

    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const { players, padding, chartWidth, chartHeight } = teamChartDataRef.current

    // Check if mouse is within chart area
    if (x >= padding.left && x <= padding.left + chartWidth && y >= padding.top && y <= padding.top + chartHeight) {
      // Find closest point across all players
      let closestPoint = null
      let minDistance = Number.MAX_VALUE
      let closestPlayerName = ""
      let closestPlayerColor = ""

      for (const player of players) {
        for (const point of player.points) {
          const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
          if (distance < minDistance) {
            minDistance = distance
            closestPoint = point
            closestPlayerName = player.name
            closestPlayerColor = player.color
          }
        }
      }

      // If we found a close point and it's reasonably close (within 30px)
      if (closestPoint && minDistance < 30) {
        setTeamTooltip({
          visible: true,
          x: closestPoint.x,
          y: closestPoint.y,
          date: closestPoint.date,
          value: closestPoint.value,
          playerName: closestPlayerName,
          color: closestPlayerColor,
        })
      } else {
        setTeamTooltip((prev) => ({ ...prev, visible: false }))
      }
    } else {
      setTeamTooltip((prev) => ({ ...prev, visible: false }))
    }
  }

  // Handle mouse leave on team chart
  const handleTeamChartMouseLeave = () => {
    setTeamTooltip((prev) => ({ ...prev, visible: false }))
  }

  // Draw individual player chart
  useEffect(() => {
    if (!chartRef.current || !data || selectedPlayers.length === 0) return

    const player = data.players.find((p) => p.playerId === selectedPlayers[0])
    if (!player || !player.stats[selectedStat] || player.stats[selectedStat].length === 0) return

    const canvas = chartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    // Chart dimensions
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const padding = { top: 30, right: 30, bottom: 90, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Get data points
    const statPoints = player.stats[selectedStat]

    // Find min and max values for y-axis
    let minValue = Math.min(...statPoints.map((p) => p.value))
    let maxValue = Math.max(...statPoints.map((p) => p.value))

    // Add some padding to min/max
    const valueRange = maxValue - minValue
    // Para estadísticas que pueden ser negativas como +/-, permitimos valores negativos
    if (selectedStat === "PLUS_MINUS") {
      minValue = minValue - valueRange * 0.25
    } else {
      // Para otras estadísticas mantenemos el mínimo en 0
      minValue = Math.max(0, minValue - valueRange * 0.25)
    }
    maxValue = maxValue + valueRange * 0.1

    // If all values are the same, create some range
    if (minValue === maxValue) {
      minValue = minValue * 0.9
      maxValue = maxValue * 1.1
    }

    // Draw background
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight)

    // Draw grid lines
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartHeight * i) / ySteps
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()

      // Y-axis labels
      const value = maxValue - (i / ySteps) * (maxValue - minValue)
      ctx.fillStyle = "#9ca3af"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"

      let formattedValue = value.toFixed(1)
      if (["FG_PCT", "FG3_PCT", "FT_PCT", "TS_PCT", "EFG_PCT", "USG_PCT", "PIE"].includes(selectedStat)) {
        formattedValue = `${(value * 100).toFixed(1)}%`
      }

      ctx.fillText(formattedValue, padding.left - 10, y)
    }

    // Vertical grid lines and x-axis labels
    const xSteps = Math.min(statPoints.length, 8)
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (chartWidth * i) / xSteps
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + chartHeight)
      ctx.stroke()

      // X-axis labels (dates)
      if (i < xSteps) {
        const dataIndex = Math.floor((i / xSteps) * (statPoints.length - 1))
        const date = new Date(statPoints[dataIndex].date)
        const formattedDate = date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })

        ctx.fillStyle = "#9ca3af"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(formattedDate, x, padding.top + chartHeight + 20)
      }
    }

    // Draw axis labels
    ctx.fillStyle = "#d1d5db"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Fecha", width / 2, height - 25)

    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText(statOptions.find((s) => s.key === selectedStat)?.label || selectedStat, 0, 0)
    ctx.restore()

    // Draw line
    const statColor = statOptions.find((s) => s.key === selectedStat)?.color || "#4f46e5"

    ctx.strokeStyle = statColor
    ctx.lineWidth = 3
    ctx.beginPath()

    // Store points for tooltip calculations
    const points: { x: number; y: number; date: string; value: number }[] = []

    statPoints.forEach((point, i) => {
      const x = padding.left + (i / (statPoints.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      // Store point data for tooltip
      points.push({
        x,
        y,
        date: point.date,
        value: point.value,
      })
    })

    ctx.stroke()

    // Draw area under the line
    ctx.beginPath()
    statPoints.forEach((point, i) => {
      const x = padding.left + (i / (statPoints.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    // Complete the area path
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
    ctx.lineTo(padding.left, padding.top + chartHeight)
    ctx.closePath()

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
    gradient.addColorStop(0, `${statColor}33`) // 20% opacity
    gradient.addColorStop(1, `${statColor}05`) // 2% opacity
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw points
    ctx.fillStyle = statColor
    statPoints.forEach((point, i) => {
      const x = padding.left + (i / (statPoints.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw tooltip if visible
    if (tooltip.visible) {
      const tooltipWidth = 120
      const tooltipHeight = 60
      const tooltipX = tooltip.x + 10 // Offset to not cover the point
      const tooltipY = tooltip.y - tooltipHeight - 10 // Position above the point

      // Background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.beginPath()
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4)
      ctx.fill()

      // Border
      ctx.strokeStyle = statColor
      ctx.lineWidth = 2
      ctx.stroke()

      // Text
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"

      // Format date
      const date = new Date(tooltip.date)
      const formattedDate = date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

      // Format value
      let formattedValue = tooltip.value.toFixed(1)
      if (["FG_PCT", "FG3_PCT", "FT_PCT", "TS_PCT", "EFG_PCT", "USG_PCT", "PIE"].includes(selectedStat)) {
        formattedValue = `${(tooltip.value * 100).toFixed(1)}%`
      }

      ctx.fillText(formattedDate, tooltipX + 10, tooltipY + 10)
      ctx.fillText(
        `${statOptions.find((s) => s.key === selectedStat)?.label}: ${formattedValue}`,
        tooltipX + 10,
        tooltipY + 30,
      )
    }

    // Store chart data for tooltip calculations
    chartDataRef.current = {
      points,
      padding,
      chartWidth,
      chartHeight,
      minValue,
      maxValue,
    }
  }, [data, selectedPlayers, selectedStat, tooltip])

  // Draw team comparison chart
  useEffect(() => {
    if (!teamChartRef.current || !data || !data.players || data.players.length === 0) return

    const canvas = teamChartRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    // Chart dimensions
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const padding = { top: 30, right: 30, bottom: 90, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Get all players with data for the selected stat
    const playersWithData = data.players
      .filter((player) => player.stats[selectedStat] && player.stats[selectedStat].length > 0)
      .sort((a, b) => {
        const aValue = a.stats[selectedStat][a.stats[selectedStat].length - 1].value
        const bValue = b.stats[selectedStat][b.stats[selectedStat].length - 1].value
        return bValue - aValue
      })
      .slice(0, 5) // Limit to top 5 players for clarity

    if (playersWithData.length === 0) return

    // Find min and max values for y-axis across all players
    let minValue = Number.MAX_VALUE
    let maxValue = Number.MIN_VALUE

    playersWithData.forEach((player) => {
      player.stats[selectedStat].forEach((point) => {
        minValue = Math.min(minValue, point.value)
        maxValue = Math.max(maxValue, point.value)
      })
    })

    // Add some padding to min/max
    const valueRange = maxValue - minValue
    // Para estadísticas que pueden ser negativas como +/-, permitimos valores negativos
    if (selectedStat === "PLUS_MINUS") {
      minValue = minValue - valueRange * 0.25
    } else {
      // Para otras estadísticas mantenemos el mínimo en 0
      minValue = Math.max(0, minValue - valueRange * 0.25)
    }
    maxValue = maxValue + valueRange * 0.1

    // If all values are the same, create some range
    if (minValue === maxValue) {
      minValue = minValue * 0.9
      maxValue = maxValue * 1.1
    }

    // Draw background
    ctx.fillStyle = "#1f2937"
    ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight)

    // Draw grid lines
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 1

    // Horizontal grid lines
    const ySteps = 5
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartHeight * i) / ySteps
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(padding.left + chartWidth, y)
      ctx.stroke()

      // Y-axis labels
      const value = maxValue - (i / ySteps) * (maxValue - minValue)
      ctx.fillStyle = "#9ca3af"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"

      let formattedValue = value.toFixed(1)
      if (["FG_PCT", "FG3_PCT", "FT_PCT", "TS_PCT", "EFG_PCT", "USG_PCT", "PIE"].includes(selectedStat)) {
        formattedValue = `${(value * 100).toFixed(1)}%`
      }

      ctx.fillText(formattedValue, padding.left - 10, y)
    }

    // Find common date range - use last 10 games for simplicity
    const lastNGames = 10

    // Vertical grid lines and x-axis labels
    const xSteps = Math.min(lastNGames, 5)
    for (let i = 0; i <= xSteps; i++) {
      const x = padding.left + (chartWidth * i) / xSteps
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, padding.top + chartHeight)
      ctx.stroke()

      // X-axis labels (game numbers)
      if (i < xSteps) {
        const gameNumber = Math.floor((i / xSteps) * (lastNGames - 1))

        ctx.fillStyle = "#9ca3af"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "top"
        ctx.fillText(`Partido ${lastNGames - gameNumber}`, x, padding.top + chartHeight + 20)
      }
    }

    // Draw axis labels
    ctx.fillStyle = "#d1d5db"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Partidos Recientes", width / 2, height - 25)

    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText(statOptions.find((s) => s.key === selectedStat)?.label || selectedStat, 0, 0)
    ctx.restore()

    // Store player points for tooltip calculations
    const playerPointsData: {
      name: string
      color: string
      points: { x: number; y: number; date: string; value: number }[]
    }[] = []

    // Draw lines for each player
    playersWithData.forEach((player, playerIndex) => {
      // Get last N games
      const statPoints = player.stats[selectedStat].slice(-lastNGames)
      if (statPoints.length < 2) return

      const playerColor = statOptions[playerIndex % statOptions.length].color

      // Initialize player points array
      const playerPoints: { x: number; y: number; date: string; value: number }[] = []

      // Draw line
      ctx.strokeStyle = playerColor
      ctx.lineWidth = 3
      ctx.beginPath()

      statPoints.forEach((point, i) => {
        const x = padding.left + (i / (statPoints.length - 1)) * chartWidth
        const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Store point data for tooltip
        playerPoints.push({
          x,
          y,
          date: point.date,
          value: point.value,
        })
      })

      ctx.stroke()

      // Draw points
      ctx.fillStyle = playerColor
      statPoints.forEach((point, i) => {
        const x = padding.left + (i / (statPoints.length - 1)) * chartWidth
        const y = padding.top + chartHeight - ((point.value - minValue) / (maxValue - minValue)) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Add player points to the data array
      playerPointsData.push({
        name: player.playerName,
        color: playerColor,
        points: playerPoints,
      })
    })

    // Draw legend
    const legendX = padding.left
    const legendY = padding.top - 15
    const legendItemWidth = width / playersWithData.length

    playersWithData.forEach((player, index) => {
      const x = legendX + index * legendItemWidth
      const playerColor = statOptions[index % statOptions.length].color

      // Draw color line
      ctx.strokeStyle = playerColor
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, legendY)
      ctx.lineTo(x + 15, legendY)
      ctx.stroke()

      // Draw player name
      ctx.fillStyle = "#d1d5db"
      ctx.font = "11px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "middle"
      ctx.fillText(player.playerName.substring(0, 10), x + 20, legendY)
    })

    // Draw tooltip if visible
    if (teamTooltip.visible) {
      const tooltipWidth = 160
      const tooltipHeight = 70
      const tooltipX = teamTooltip.x + 10 // Offset to not cover the point
      const tooltipY = teamTooltip.y - tooltipHeight - 10 // Position above the point

      // Background
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
      ctx.beginPath()
      ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4)
      ctx.fill()

      // Border
      ctx.strokeStyle = teamTooltip.color || "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Text
      ctx.fillStyle = "#ffffff"
      ctx.font = "12px sans-serif"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"

      // Format date
      const date = new Date(teamTooltip.date)
      const formattedDate = date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

      // Format value
      let formattedValue = teamTooltip.value.toFixed(1)
      if (["FG_PCT", "FG3_PCT", "FT_PCT", "TS_PCT", "EFG_PCT", "USG_PCT", "PIE"].includes(selectedStat)) {
        formattedValue = `${(teamTooltip.value * 100).toFixed(1)}%`
      }

      ctx.fillText(`Jugador: ${teamTooltip.playerName}`, tooltipX + 10, tooltipY + 10)
      ctx.fillText(formattedDate, tooltipX + 10, tooltipY + 30)
      ctx.fillText(
        `${statOptions.find((s) => s.key === selectedStat)?.label}: ${formattedValue}`,
        tooltipX + 10,
        tooltipY + 50,
      )
    }

    // Store chart data for tooltip calculations
    teamChartDataRef.current = {
      players: playerPointsData,
      padding,
      chartWidth,
      chartHeight,
      minValue,
      maxValue,
    }
  }, [data, selectedStat, teamTooltip])

  // Toggle player selection
  const handlePlayerSelect = (playerId: number) => {
    setSelectedPlayers([playerId])
  }

  // Format value for display
  const formatStatValue = (value: number) => {
    if (["FG_PCT", "FG3_PCT", "FT_PCT", "TS", "eFG", "USG"].includes(selectedStat)) {
      return `${(value * 100).toFixed(1)}%`
    } else if (selectedStat === "ASTtoTO") {
      return value.toFixed(2)
    } else if (selectedStat === "TOVpercent") {
      return `${value.toFixed(1)}%`
    }
    return value.toFixed(1)
  }

  // Get current stat info
  const currentStat = statOptions.find((stat) => stat.key === selectedStat) || statOptions[0]

  // Filter players based on search term
  const filteredPlayers =
    data?.players.filter((player) => player.playerName.toLowerCase().includes(searchTerm.toLowerCase())) || []

  // Add this function to filter stats by category
  const getStatsByCategory = (category: "simple" | "advanced") => {
    return statOptions.filter((stat) => stat.category === category)
  }

  // Handle stat category change
  const handleStatCategoryChange = (category: "simple" | "advanced") => {
    setStatCategory(category)
    // Set default stat for the category
    if (category === "simple") {
      setSelectedStat("PTS")
    } else {
      setSelectedStat("OffRtg")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
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
          <h1 className="text-2xl font-semibold mb-4">Error al Cargar Estadísticas</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Volver al Inicio
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
          <h1 className="text-2xl font-semibold mb-4">No Hay Datos Disponibles</h1>
          <p className="text-gray-400 mb-6">No hay datos de estadísticas de jugadores disponibles actualmente.</p>
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </div>
    )
  }

  // Get selected player
  const selectedPlayer = data.players.find((p) => p.playerId === selectedPlayers[0])

  // ✅ Función calculateTrend mejorada con verificación de tipos
  const calculateTrend = (player: PlayerEvolution, statKey: string = selectedStat) => {
    const statValues = player.stats[statKey]
    if (!statValues || statValues.length < 4) {
      return {
        value: 0,
        percentage: 0,
        isPositive: false,
        player: player,
        trend: {
          value: 0,
          percentage: 0,
          isPositive: false,
        },
      }
    }

    // Usar los últimos 3 partidos para el valor actual
    const recentGames = statValues.slice(-3)
    const currentAvg = recentGames.reduce((sum, point) => sum + point.value, 0) / recentGames.length

    // Usar los 3 partidos anteriores para la comparación
    const previousGames = statValues.slice(-6, -3)
    // Si no hay suficientes partidos anteriores, usar los primeros disponibles
    const previousAvg =
      previousGames.length > 0
        ? previousGames.reduce((sum, point) => sum + point.value, 0) / previousGames.length
        : statValues.slice(0, 3).reduce((sum, point) => sum + point.value, 0) /
          Math.min(3, statValues.slice(0, 3).length)

    // Calcular la diferencia y el porcentaje
    const trend = currentAvg - previousAvg

    // Evitar divisiones por números muy pequeños
    let trendPercentage = 0
    if (Math.abs(previousAvg) > 0.01) {
      trendPercentage = (trend / previousAvg) * 100
      // Limitar el porcentaje a un rango razonable
      trendPercentage = Math.max(Math.min(trendPercentage, 200), -200)
    } else if (trend > 0) {
      trendPercentage = 100 // Valor positivo cuando antes era cercano a cero
    } else if (trend < 0) {
      trendPercentage = -100 // Valor negativo cuando antes era cercano a cero
    }

    return {
      value: trend,
      percentage: trendPercentage,
      isPositive: trend > 0,
      player: player,
      trend: {
        value: trend,
        percentage: trendPercentage,
        isPositive: trend > 0,
      },
    }
  }

  return (
    <div
      className={`flex flex-col min-h-screen text-white ${
        statCategory === "advanced" ? "bg-gradient-to-b from-[#0a0a2a] to-[#1a0a2a]" : "bg-[#0a0a2a]"
      }`}
    >
      {/* Header Banner */}
      <div
        className={`w-full py-8 mb-6 ${
          statCategory === "advanced"
            ? "bg-gradient-to-r from-purple-900 to-indigo-900"
            : "bg-gradient-to-r from-indigo-800 to-purple-900"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ChevronLeft className="h-8 w-8 text-blue-200 hover:text-white transition-colors" />
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold">Evolución del Jugador</h1>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 pb-16">
        {/* View Toggle - Estilo de pestañas */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900/50 rounded-t-xl p-1 inline-flex border-b-2 border-indigo-800">
            <button
              onClick={() => setActiveView("individual")}
              className={`px-6 py-3 rounded-t-lg transition-all ${
                activeView === "individual"
                  ? "bg-indigo-900/70 text-white border-t-2 border-l-2 border-r-2 border-indigo-700"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                <span className="font-medium">Vista Jugador</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView("team")}
              className={`px-6 py-3 rounded-t-lg transition-all ${
                activeView === "team"
                  ? "bg-indigo-900/70 text-white border-t-2 border-l-2 border-r-2 border-indigo-700"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-medium">Comparación Equipo</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView("trends")}
              className={`px-6 py-3 rounded-t-lg transition-all ${
                activeView === "trends"
                  ? "bg-indigo-900/70 text-white border-t-2 border-l-2 border-r-2 border-indigo-700"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span className="font-medium">Tendencias del Equipo</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Category Toggle */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-gray-900 rounded-xl overflow-hidden w-full max-w-xl">
            <button
              onClick={() => handleStatCategoryChange("simple")}
              className={`flex-1 py-2 px-8 flex items-center justify-center transition-all duration-300 ${
                statCategory === "simple" ? "bg-gradient-to-r from-green-600 to-blue-600" : "hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              <span className="text-base">Estadísticas Básicas</span>
            </button>
            <button
              onClick={() => handleStatCategoryChange("advanced")}
              className={`flex-1 py-2 px-8 flex items-center justify-center transition-all duration-300 ${
                statCategory === "advanced" ? "bg-gradient-to-r from-blue-600 to-purple-600" : "hover:bg-gray-800"
              }`}
            >
              <LineChart className="mr-3 h-5 w-5" />
              <span className="text-base">Estadísticas Avanzadas</span>
            </button>
          </div>
        </div>

        {activeView === "individual" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-700">
                  <h2 className="text-xl font-bold">Seleccionar Jugador</h2>
                </div>

                <div className="p-4">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar jugadores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {filteredPlayers.map((player) => {
                      const isSelected = selectedPlayers.includes(player.playerId)
                      return (
                        <div
                          key={player.playerId}
                          onClick={() => handlePlayerSelect(player.playerId)}
                          className={`w-full flex items-center p-3 rounded-lg transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-indigo-900 border border-indigo-700"
                              : "bg-gray-700 hover:bg-gray-600 border border-gray-700"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-600 mr-3">
                            <Image
                              src={player.image || "/placeholder.svg?height=40&width=40"}
                              alt={player.playerName}
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{player.playerName}</div>
                            <div className="text-xs text-gray-400">
                              {player.stats[selectedStat]?.length || 0} partidos
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold mb-3">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getStatsByCategory(statCategory)
                      .slice(0, 6)
                      .map((stat) => (
                        <button
                          key={stat.key}
                          onClick={() => setSelectedStat(stat.key)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            selectedStat === stat.key
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {stat.label}
                        </button>
                      ))}
                  </div>

                  <div className="mt-3">
                    <select
                      value={selectedStat}
                      onChange={(e) => setSelectedStat(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {getStatsByCategory(statCategory).map((stat) => (
                        <option key={stat.key} value={stat.key}>
                          {stat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-3">Rango de Tiempo</h3>
                    <div className="flex gap-2">
                      {timeRangeOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => setTimeRange(option.key)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            timeRange === option.key
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8">
              {selectedPlayer ? (
                <>
                  {/* Player Header */}
                  <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
                    <div className="flex items-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 mr-6">
                        <Image
                          src={selectedPlayer.image || "/placeholder.svg?height=80&width=80"}
                          alt={selectedPlayer.playerName}
                          width={80}
                          height={80}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedPlayer.playerName}</h2>
                        <p className="text-gray-400">
                          {selectedPlayer.stats[selectedStat]?.length || 0} partidos analizados
                        </p>
                      </div>

                      {/* Trend indicator */}
                      {selectedPlayer.stats[selectedStat]?.length > 1 && (
                        <div className="ml-auto">
                          {(() => {
                            const trend = calculateTrend(selectedPlayer)
                            return (
                              <div
                                className={`px-4 py-2 rounded-lg flex items-center ${
                                  trend.isPositive
                                    ? "bg-green-900/30 text-green-400"
                                    : trend.value < 0
                                      ? "bg-red-900/30 text-red-400"
                                      : "bg-gray-700 text-gray-400"
                                }`}
                              >
                                {trend.isPositive ? (
                                  <ArrowUpRight className="w-5 h-5 mr-2" />
                                ) : trend.value < 0 ? (
                                  <ArrowDownRight className="w-5 h-5 mr-2" />
                                ) : (
                                  <Minus className="w-5 h-5 mr-2" />
                                )}
                                <div>
                                  <span className="font-bold">
                                    {trend.value > 0 ? "+" : ""}
                                    {formatStatValue(trend.value)}
                                  </span>
                                  <span className="text-sm ml-1">
                                    ({trend.percentage > 0 ? "+" : ""}
                                    {Math.round(trend.percentage)}%)
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chart */}
                  <div
                    className={`rounded-xl overflow-hidden shadow-lg mb-6 ${
                      statCategory === "advanced"
                        ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-900/30"
                        : "bg-gray-800"
                    }`}
                  >
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                      <h2 className="text-xl font-bold flex items-center">
                        <TrendingUp
                          className={`mr-2 h-5 w-5 ${
                            statCategory === "advanced" ? "text-purple-500" : "text-indigo-500"
                          }`}
                        />
                        Evolución de {currentStat.label}
                      </h2>
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="mr-1 h-4 w-4" />
                        {timeRangeOptions.find((option) => option.key === timeRange)?.label || "Rango Personalizado"}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="h-[500px] relative">
                        <canvas
                          ref={chartRef}
                          className="w-full h-full cursor-pointer"
                          onMouseMove={handleChartMouseMove}
                          onMouseLeave={handleChartMouseLeave}
                        />
                        <div className="text-xs text-gray-400 mt-2 text-center">
                          Pasa el cursor sobre el gráfico para ver valores detallados
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold mb-4">
                      {statCategory === "simple" ? "Estadísticas Básicas" : "Métricas Avanzadas"}
                    </h3>

                    {statCategory === "simple" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(selectedPlayer.stats)
                          .filter(([key]) => getStatsByCategory("simple").some((s) => s.key === key))
                          .slice(0, 8)
                          .map(([key, values]) => {
                            if (values.length === 0) return null
                            const stat = statOptions.find((s) => s.key === key)
                            if (!stat) return null

                            const latestValue = values[values.length - 1].value
                            const avgValue = values.reduce((sum, p) => sum + p.value, 0) / values.length

                            return (
                              <div key={key} className="bg-gray-700 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-1">{stat.label}</div>
                                <div className="text-2xl font-bold" style={{ color: stat.color }}>
                                  {formatStatValue(latestValue)}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Prom: {formatStatValue(avgValue)}</div>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                          {/* Rating Ofensivo Card */}
                          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 rounded-xl p-4 border border-cyan-800/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm text-gray-400">Rating Ofensivo</h4>
                                <p className="text-3xl font-bold text-cyan-400">
                                  {selectedPlayer.stats["OffRtg"]?.[
                                    selectedPlayer.stats["OffRtg"].length - 1
                                  ]?.value.toFixed(1) || "N/A"}
                                </p>
                              </div>
                              <div className="bg-cyan-900/50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-cyan-400" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">Puntos por 100 posesiones</p>
                          </div>

                          {/* TS Card */}
                          <div className="bg-gradient-to-br from-violet-900/40 to-violet-800/20 rounded-xl p-4 border border-violet-800/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm text-gray-400">% Tiro Efectivo</h4>
                                <p className="text-3xl font-bold text-violet-400">
                                  {selectedPlayer.stats["TS"]?.[selectedPlayer.stats["TS"].length - 1]?.value
                                    ? `${(selectedPlayer.stats["TS"][selectedPlayer.stats["TS"].length - 1].value * 100).toFixed(1)}%`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-violet-900/50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-violet-400" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">Eficiencia de tiro considerando FG, 3PT y TL</p>
                          </div>

                          {/* USG Card */}
                          <div className="bg-gradient-to-br from-pink-900/40 to-pink-800/20 rounded-xl p-4 border border-pink-800/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm text-gray-400">% de Uso</h4>
                                <p className="text-3xl font-bold text-pink-400">
                                  {selectedPlayer.stats["USG"]?.[selectedPlayer.stats["USG"].length - 1]?.value
                                    ? `${(selectedPlayer.stats["USG"][selectedPlayer.stats["USG"].length - 1].value * 100).toFixed(1)}%`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-pink-900/50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-pink-400" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">
                              Porcentaje de jugadas del equipo usadas por el jugador
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* eFG Card */}
                          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 border border-blue-800/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm text-gray-400">% Tiro Efectivo de Campo</h4>
                                <p className="text-2xl font-bold text-blue-400">
                                  {selectedPlayer.stats["eFG"]?.[selectedPlayer.stats["eFG"].length - 1]?.value
                                    ? `${(selectedPlayer.stats["eFG"][selectedPlayer.stats["eFG"].length - 1].value * 100).toFixed(1)}%`
                                    : "N/A"}
                                </p>
                              </div>
                              <div className="bg-blue-900/50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-blue-400" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">
                              Eficiencia de tiro considerando el valor de los triples
                            </p>
                          </div>

                          {/* ASTtoTO Card */}
                          <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-xl p-4 border border-green-800/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm text-gray-400">Ratio AST/TO</h4>
                                <p className="text-2xl font-bold text-green-400">
                                  {selectedPlayer.stats["ASTtoTO"]?.[
                                    selectedPlayer.stats["ASTtoTO"].length - 1
                                  ]?.value.toFixed(2) || "N/A"}
                                </p>
                              </div>
                              <div className="bg-green-900/50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-400" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">Ratio de Asistencias a Pérdidas</p>
                          </div>

                          {/* TOVpercent Card */}
                          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 rounded-xl p-4 border border-amber-800/30">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm text-gray-400">% Pérdidas</h4>
                                <p className="text-2xl font-bold text-amber-400">
                                  {selectedPlayer.stats["TOVpercent"]?.[
                                    selectedPlayer.stats["TOVpercent"].length - 1
                                  ]?.value.toFixed(1) || "N/A"}
                                  %
                                </p>
                              </div>
                              <div className="bg-amber-900/50 p-2 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-amber-400" />
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">Porcentaje de posesiones que terminan en pérdida</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex items-center justify-center h-[500px]">
                  <p className="text-gray-400 text-lg">Selecciona un jugador para ver sus estadísticas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === "team" && (
          <div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Comparación de Equipo</h2>
                  <p className="text-gray-400">Compara la evolución de {currentStat.label} de los mejores jugadores</p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-4">
                  <select
                    value={selectedStat}
                    onChange={(e) => setSelectedStat(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {getStatsByCategory(statCategory).map((stat) => (
                      <option key={stat.key} value={stat.key}>
                        {stat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-[600px] relative">
                <canvas
                  ref={teamChartRef}
                  className="w-full h-full cursor-pointer"
                  onMouseMove={handleTeamChartMouseMove}
                  onMouseLeave={handleTeamChartMouseLeave}
                />
                <div className="text-xs text-gray-400 mt-2 text-center">
                  Pasa el cursor sobre el gráfico para ver valores detallados
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Mejores Jugadores - {currentStat.label}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.players
                  .filter((player) => player.stats[selectedStat] && player.stats[selectedStat].length > 0)
                  .sort((a, b) => {
                    const aValue = a.stats[selectedStat][a.stats[selectedStat].length - 1].value
                    const bValue = b.stats[selectedStat][b.stats[selectedStat].length - 1].value
                    return bValue - aValue
                  })
                  .slice(0, 6)
                  .map((player, index) => {
                    const statValues = player.stats[selectedStat]
                    const latestValue = statValues[statValues.length - 1].value
                    const trend = calculateTrend(player)

                    return (
                      <div
                        key={player.playerId}
                        className="bg-gray-700 rounded-lg p-4 flex items-center"
                        onClick={() => {
                          setSelectedPlayers([player.playerId])
                          setActiveView("individual")
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 mr-3 flex-shrink-0">
                          <Image
                            src={player.image || "/placeholder.svg?height=48&width=48"}
                            alt={player.playerName}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">{player.playerName}</div>
                          <div className="text-xs text-gray-400">Puesto #{index + 1}</div>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-xl font-bold"
                            style={{ color: statOptions[index % statOptions.length].color }}
                          >
                            {formatStatValue(latestValue)}
                          </div>
                          <div
                            className={`text-xs ${
                              trend.isPositive ? "text-green-400" : trend.value < 0 ? "text-red-400" : "text-gray-400"
                            }`}
                          >
                            {trend.value > 0 ? "+" : ""}
                            {formatStatValue(trend.value)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}

        {activeView === "trends" && (
          <div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Tendencias del Equipo</h2>
                  <p className="text-gray-400">
                    Jugadores ordenados por mejora en {currentStat.label} (últimos 6 partidos)
                  </p>
                </div>

                <div className="mt-4 md:mt-0 flex gap-4">
                  <select
                    value={selectedStat}
                    onChange={(e) => setSelectedStat(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg py-2 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {getStatsByCategory(statCategory).map((stat) => (
                      <option key={stat.key} value={stat.key}>
                        {stat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tendencias de Mejora */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-green-400 flex items-center">
                  <ArrowUpRight className="mr-2 h-5 w-5" />
                  Jugadores en Mejora
                </h3>
                <div className="space-y-4">
                  {data.players
                    .filter((player) => player.stats[selectedStat] && player.stats[selectedStat].length >= 4)
                    .map((player) => calculateTrend(player))
                    .filter((result) => result.player && result.trend && result.trend.isPositive)
                    .sort((a, b) => {
                      // ✅ Verificación de seguridad antes de acceder a trend.percentage
                      if (!a.trend || !b.trend) return 0
                      return b.trend.percentage - a.trend.percentage
                    })
                    .slice(0, 5)
                    .map((result) => (
                      <div
                        key={result.player.playerId}
                        className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPlayers([result.player.playerId])
                          setActiveView("individual")
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 mr-4">
                            <Image
                              src={result.player.image || "/placeholder.svg?height=48&width=48"}
                              alt={result.player.playerName}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="font-medium text-lg">{result.player.playerName}</div>
                            <div className="text-sm text-gray-400">
                              {result.player.stats[selectedStat].length} partidos analizados
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-400">
                              +{formatStatValue(result.trend?.value || 0)}
                            </div>
                            <div className="text-sm text-green-300">+{Math.round(result.trend?.percentage || 0)}%</div>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-3 bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-300 h-full"
                            style={{ width: `${Math.min(100, result.trend?.percentage || 0)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  {data.players
                    .filter((player) => player.stats[selectedStat] && player.stats[selectedStat].length >= 4)
                    .map((player) => calculateTrend(player))
                    .filter((result) => result.player && result.trend && result.trend.isPositive).length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      No hay jugadores con tendencia positiva en esta estadística
                    </div>
                  )}
                </div>
              </div>

              {/* Tendencias de Declive */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-red-400 flex items-center">
                  <ArrowDownRight className="mr-2 h-5 w-5" />
                  Jugadores en Declive
                </h3>
                <div className="space-y-4">
                  {data.players
                    .filter((player) => player.stats[selectedStat] && player.stats[selectedStat].length >= 4)
                    .map((player) => calculateTrend(player))
                    .filter(
                      (result) => result.player && result.trend && !result.trend.isPositive && result.trend.value !== 0,
                    )
                    .sort((a, b) => {
                      // ✅ Verificación de seguridad antes de acceder a trend.percentage
                      if (!a.trend || !b.trend) return 0
                      return a.trend.percentage - b.trend.percentage
                    })
                    .slice(0, 5)
                    .map((result) => (
                      <div
                        key={result.player.playerId}
                        className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPlayers([result.player.playerId])
                          setActiveView("individual")
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 mr-4">
                            <Image
                              src={result.player.image || "/placeholder.svg?height=48&width=48"}
                              alt={result.player.playerName}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="font-medium text-lg">{result.player.playerName}</div>
                            <div className="text-sm text-gray-400">
                              {result.player.stats[selectedStat].length} partidos analizados
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-red-400">
                              {formatStatValue(result.trend?.value || 0)}
                            </div>
                            <div className="text-sm text-red-300">{Math.round(result.trend?.percentage || 0)}%</div>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-3 bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-300 h-full"
                            style={{ width: `${Math.min(100, Math.abs(result.trend?.percentage || 0))}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  {data.players
                    .filter((player) => player.stats[selectedStat] && player.stats[selectedStat].length >= 4)
                    .map((player) => calculateTrend(player))
                    .filter(
                      (result) => result.player && result.trend && !result.trend.isPositive && result.trend.value !== 0,
                    ).length === 0 && (
                    <div className="text-center py-6 text-gray-400">
                      No hay jugadores con tendencia negativa en esta estadística
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen de Tendencias */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Resumen de Tendencias</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4">
                  <h4 className="text-lg font-semibold mb-3 text-blue-400">Estadísticas con Mayor Mejora</h4>
                  <div className="space-y-3">
                    {statOptions
                      .filter((stat) => {
                        // Contar cuántos jugadores tienen tendencia positiva en esta estadística
                        const playersWithPositiveTrend = data.players
                          .filter((player) => player.stats[stat.key] && player.stats[stat.key].length >= 4)
                          .map((player) => {
                            const statValues = player.stats[stat.key]
                            if (!statValues || statValues.length < 4) return { isPositive: false, percentage: 0 }

                            const recentGames = statValues.slice(-3)
                            const currentAvg =
                              recentGames.reduce((sum, point) => sum + point.value, 0) / recentGames.length

                            const previousGames = statValues.slice(-6, -3)
                            const previousAvg =
                              previousGames.length > 0
                                ? previousGames.reduce((sum, point) => sum + point.value, 0) / previousGames.length
                                : statValues.slice(0, 3).reduce((sum, point) => sum + point.value, 0) /
                                  Math.min(3, statValues.slice(0, 3).length)

                            const trend = currentAvg - previousAvg
                            return {
                              isPositive: trend > 0,
                              percentage: previousAvg !== 0 ? (trend / previousAvg) * 100 : 0,
                            }
                          })
                          .filter((trend) => trend.isPositive)

                        return playersWithPositiveTrend.length > 0
                      })
                      .sort((a, b) => {
                        // Calcular el promedio de mejora para cada estadística
                        const avgImprovementA = data.players
                          .filter((player) => player.stats[a.key] && player.stats[a.key].length >= 4)
                          .map((player) => {
                            const trend = calculateTrend(player, a.key)
                            return trend.trend && trend.trend.isPositive ? trend.trend.percentage : 0
                          })
                          .reduce((sum, percentage, _, arr) => sum + percentage / arr.length, 0)

                        const avgImprovementB = data.players
                          .filter((player) => player.stats[b.key] && player.stats[b.key].length >= 4)
                          .map((player) => {
                            const trend = calculateTrend(player, b.key)
                            return trend.trend && trend.trend.isPositive ? trend.trend.percentage : 0
                          })
                          .reduce((sum, percentage, _, arr) => sum + percentage / arr.length, 0)

                        return avgImprovementB - avgImprovementA
                      })
                      .slice(0, 4)
                      .map((stat) => {
                        const avgImprovement = data.players
                          .filter((player) => player.stats[stat.key] && player.stats[stat.key].length >= 4)
                          .map((player) => {
                            const trend = calculateTrend(player, stat.key)
                            return trend.trend && trend.trend.isPositive ? trend.trend.percentage : 0
                          })
                          .reduce((sum, percentage, _, arr) => sum + percentage / arr.length, 0)

                        return (
                          <div key={stat.key} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: stat.color }}></div>
                              <span>{stat.label}</span>
                            </div>
                            <div className="font-semibold text-blue-300">+{Math.round(avgImprovement)}%</div>
                          </div>
                        )
                      })}
                    {statOptions.filter((stat) => {
                      const playersWithPositiveTrend = data.players
                        .filter((player) => player.stats[stat.key] && player.stats[stat.key].length >= 4)
                        .map((player) => {
                          const trend = calculateTrend(player, stat.key)
                          return trend.trend && trend.trend.isPositive
                        })
                        .filter(Boolean)

                      return playersWithPositiveTrend.length > 0
                    }).length === 0 && (
                      <div className="text-center py-3 text-gray-400">
                        No hay suficientes datos para mostrar tendencias
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4">
                  <h4 className="text-lg font-semibold mb-3 text-purple-400">Jugadores Más Consistentes</h4>
                  <div className="space-y-3">
                    {data.players
                      .filter((player) => {
                        // Verificar si el jugador tiene suficientes datos para todas las estadísticas principales
                        const mainStats = ["PTS", "AST", "REB"]
                        return mainStats.every((stat) => player.stats[stat] && player.stats[stat].length >= 4)
                      })
                      .map((player) => {
                        // Calcular la consistencia basada en la desviación estándar de las estadísticas principales
                        const consistencyScore =
                          ["PTS", "AST", "REB"]
                            .map((stat) => {
                              const values = player.stats[stat].slice(-6).map((p) => p.value)
                              const mean = values.reduce((sum, val) => sum + val, 0) / values.length
                              const variance =
                                values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
                              const stdDev = Math.sqrt(variance)
                              // Menor desviación estándar = mayor consistencia
                              return stdDev / mean // Coeficiente de variación
                            })
                            .reduce((sum, cv) => sum + cv, 0) / 3 // Promedio de coeficientes de variación

                        return {
                          player,
                          consistencyScore: 1 - Math.min(consistencyScore, 1), // Invertir para que mayor valor = más consistente
                        }
                      })
                      .sort((a, b) => b.consistencyScore - a.consistencyScore)
                      .slice(0, 5)
                      .map(({ player, consistencyScore }) => (
                        <div
                          key={player.playerId}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-600/30 p-2 rounded-lg"
                          onClick={() => {
                            setSelectedPlayers([player.playerId])
                            setActiveView("individual")
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 mr-2">
                              <Image
                                src={player.image || "/placeholder.svg?height=32&width=32"}
                                alt={player.playerName}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            </div>
                            <span>{player.playerName}</span>
                          </div>
                          <div className="font-semibold text-purple-300">{Math.round(consistencyScore * 100)}%</div>
                        </div>
                      ))}
                    {data.players.filter((player) => {
                      const mainStats = ["PTS", "AST", "REB"]
                      return mainStats.every((stat) => player.stats[stat] && player.stats[stat].length >= 4)
                    }).length === 0 && (
                      <div className="text-center py-3 text-gray-400">
                        No hay suficientes datos para mostrar consistencia
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Explanation Section */}
        <div className="mt-12 bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <Info className="h-5 w-5 text-indigo-400 mr-2" />
            <h2 className="text-xl font-bold">Acerca de Este Análisis</h2>
          </div>

          <p className="text-gray-300 mb-4">
            Este análisis hace un seguimiento de la evolución de las estadísticas de los jugadores a lo largo del
            tiempo, permitiéndote visualizar las tendencias de rendimiento durante la temporada. El gráfico muestra cómo
            cambian las estadísticas seleccionadas de partido a partido.
          </p>

          <div className="text-sm text-gray-400">
            <p>• Las tendencias ascendentes indican mejora en el rendimiento</p>
            <p>• Las tendencias descendentes pueden señalar fatiga u otros problemas</p>
            <p>• Compara jugadores para identificar a los más consistentes</p>
            <p>
              • Las estadísticas avanzadas proporcionan información más profunda sobre la eficiencia e impacto del
              jugador
            </p>
            <p>• Pasa el cursor sobre los gráficos para ver valores detallados en puntos específicos</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-900 py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Análisis de Baloncesto. TFG Guillermo</p>
        </div>
      </footer>
    </div>
  )
}
