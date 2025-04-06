"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronLeft,
  Activity,
  Loader2,
  TrendingUp,
  Search,
  Info,
  X,
  Plus,
  Award,
  TrendingDown,
  Zap,
  AlertTriangle,
} from "lucide-react"

interface NormalizedStat {
  stat: string
  label: string
  value: number
  normalizedValue: number
  originalValue: number
}

interface Player {
  playerId: number
  name: string
  image: string
  gamesPlayed: number
  stats: NormalizedStat[]
}

interface StatCategory {
  key: string
  label: string
}

interface ApiResponse {
  team: string
  season: string
  players: Player[]
  statsCategories: StatCategory[]
}

interface PlayerStrengthWeakness {
  strengths: {
    stat: NormalizedStat
    percentile: number
  }[]
  weaknesses: {
    stat: NormalizedStat
    percentile: number
  }[]
  recommendations: string[]
}

// Colores para los diferentes jugadores en la comparación
const PLAYER_COLORS = [
  { color: "rgb(79, 70, 229)", light: "rgba(79, 70, 229, 0.3)" }, // Indigo
  { color: "rgb(220, 38, 38)", light: "rgba(220, 38, 38, 0.3)" }, // Red
  { color: "rgb(16, 185, 129)", light: "rgba(16, 185, 129, 0.3)" }, // Green
  { color: "rgb(245, 158, 11)", light: "rgba(245, 158, 11, 0.3)" }, // Amber
  { color: "rgb(14, 165, 233)", light: "rgba(14, 165, 233, 0.3)" }, // Sky
]

export default function SpiderChartAnalysis() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showTooltip, setShowTooltip] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"individual" | "comparison">("individual")
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState<Record<number, PlayerStrengthWeakness>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/player-spider-stats")

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        // Set default selected player
        if (result.players && result.players.length > 0) {
          setSelectedPlayers([result.players[0]])

          // Calcular fortalezas y debilidades para el jugador seleccionado
          const playerAnalysis = analyzePlayerStrengthsWeaknesses(result.players[0])
          setStrengthsWeaknesses({
            [result.players[0].playerId]: playerAnalysis,
          })
        }
      } catch (error) {
        console.error("Error fetching spider stats:", error)
        setError("Failed to load player statistics. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Función para analizar fortalezas y debilidades del jugador
  const analyzePlayerStrengthsWeaknesses = (player: Player): PlayerStrengthWeakness => {
    // Ordenar las estadísticas por valor normalizado (de mayor a menor)
    const sortedStats = [...player.stats].sort((a, b) => b.normalizedValue - a.normalizedValue)

    // Obtener las 3 mejores estadísticas (fortalezas)
    const strengths = sortedStats.slice(0, 3).map((stat) => {
      // Calcular el percentil aproximado (0-100)
      const percentile = Math.round((stat.normalizedValue / 10) * 100)
      return { stat, percentile }
    })

    // Obtener las 3 peores estadísticas (debilidades)
    const weaknesses = sortedStats
      .slice(-3)
      .reverse()
      .map((stat) => {
        const percentile = Math.round((stat.normalizedValue / 10) * 100)
        return { stat, percentile }
      })

    // Generar recomendaciones basadas en el perfil
    const recommendations: string[] = []

    // Recomendación basada en la mayor fortaleza
    if (strengths[0]) {
      const topStrength = strengths[0].stat.stat
      if (topStrength === "PTS") {
        recommendations.push("Aprovechar su capacidad anotadora en situaciones de presión ofensiva.")
      } else if (topStrength === "AST") {
        recommendations.push("Utilizar como creador principal en jugadas organizadas.")
      } else if (topStrength === "REB") {
        recommendations.push("Posicionar estratégicamente para maximizar su impacto en el rebote.")
      } else if (topStrength === "STL" || topStrength === "BLK") {
        recommendations.push("Asignar a defender jugadores clave del equipo contrario.")
      } else if (topStrength === "FG_PCT" || topStrength === "FG3_PCT") {
        recommendations.push("Diseñar jugadas específicas para generar tiros de alta probabilidad.")
      }
    }

    // Recomendación basada en la mayor debilidad
    if (weaknesses[0]) {
      const topWeakness = weaknesses[0].stat.stat
      if (topWeakness === "PTS" || topWeakness === "FG_PCT" || topWeakness === "FG3_PCT") {
        recommendations.push("Trabajar en la mecánica de tiro y selección de tiros.")
      } else if (topWeakness === "AST") {
        recommendations.push("Mejorar la visión de juego y toma de decisiones con balón.")
      } else if (topWeakness === "REB") {
        recommendations.push("Enfocarse en técnicas de posicionamiento para el rebote.")
      } else if (topWeakness === "STL" || topWeakness === "BLK") {
        recommendations.push("Mejorar el posicionamiento defensivo y anticipación.")
      } else if (topWeakness === "TOV") {
        recommendations.push("Practicar el manejo de balón bajo presión.")
      }
    }

    // Recomendación general basada en el perfil completo
    const avgValue = player.stats.reduce((sum, stat) => sum + stat.normalizedValue, 0) / player.stats.length
    if (avgValue > 7) {
      recommendations.push("Jugador equilibrado y completo. Considerar como pieza central del equipo.")
    } else if (sortedStats[0].normalizedValue > 8 && sortedStats[sortedStats.length - 1].normalizedValue < 4) {
      recommendations.push("Jugador especialista. Utilizar en situaciones específicas que maximicen sus fortalezas.")
    } else {
      recommendations.push("Jugador en desarrollo. Establecer plan de mejora integral.")
    }

    return { strengths, weaknesses, recommendations }
  }

  const handlePlayerSelect = (player: Player) => {
    if (activeTab === "individual") {
      setSelectedPlayers([player])

      // Calcular fortalezas y debilidades para el jugador seleccionado
      const playerAnalysis = analyzePlayerStrengthsWeaknesses(player)
      setStrengthsWeaknesses({
        ...strengthsWeaknesses,
        [player.playerId]: playerAnalysis,
      })
    } else {
      // En modo comparación, añadir o quitar jugadores
      const isAlreadySelected = selectedPlayers.some((p) => p.playerId === player.playerId)

      if (isAlreadySelected) {
        // Si ya está seleccionado, lo quitamos
        setSelectedPlayers(selectedPlayers.filter((p) => p.playerId !== player.playerId))
      } else {
        // Si no está seleccionado y hay menos de 4 jugadores, lo añadimos
        if (selectedPlayers.length < 4) {
          const newSelectedPlayers = [...selectedPlayers, player]
          setSelectedPlayers(newSelectedPlayers)

          // Calcular fortalezas y debilidades si no existen
          if (!strengthsWeaknesses[player.playerId]) {
            const playerAnalysis = analyzePlayerStrengthsWeaknesses(player)
            setStrengthsWeaknesses({
              ...strengthsWeaknesses,
              [player.playerId]: playerAnalysis,
            })
          }
        }
      }
    }
  }

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayers(selectedPlayers.filter((p) => p.playerId !== playerId))
  }

  const handleTabChange = (tab: "individual" | "comparison") => {
    setActiveTab(tab)

    // Si cambiamos de comparación a individual y hay múltiples jugadores seleccionados,
    // nos quedamos solo con el primero
    if (tab === "individual" && selectedPlayers.length > 1) {
      setSelectedPlayers([selectedPlayers[0]])
    }
  }

  const filteredPlayers =
    data?.players.filter((player) => player.name.toLowerCase().includes(searchTerm.toLowerCase())) || []

  // Custom Spider/Radar Chart component using SVG
  const SpiderChart = ({ players, showLegend = false }: { players: Player[]; showLegend?: boolean }) => {
    const size = 380 // Aumentar aún más el tamaño para dar más espacio horizontal
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.32 // Reducir aún más el radio para dejar más espacio para las etiquetas
    const levels = 5 // Number of concentric circles

    // Si no hay jugadores, no renderizamos nada
    if (players.length === 0) return null

    // Obtenemos las estadísticas del primer jugador para usar como referencia
    const stats = players[0].stats

    // Calculate points on the radar for each stat
    const angleStep = (Math.PI * 2) / stats.length

    const getCoordinates = (value: number, index: number) => {
      const angle = index * angleStep - Math.PI / 2 // Start from top (subtract 90 degrees)
      const distance = (value / 10) * radius // Normalize to radius
      return {
        x: centerX + distance * Math.cos(angle),
        y: centerY + distance * Math.sin(angle),
      }
    }

    return (
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
          {/* Background circles */}
          {Array.from({ length: levels }).map((_, i) => {
            const levelRadius = radius * ((i + 1) / levels)
            return (
              <circle
                key={`level-${i}`}
                cx={centerX}
                cy={centerY}
                r={levelRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
              />
            )
          })}

          {/* Axis lines */}
          {stats.map((stat, i) => {
            const angle = i * angleStep - Math.PI / 2
            const endX = centerX + radius * Math.cos(angle)
            const endY = centerY + radius * Math.sin(angle)
            return (
              <line
                key={`axis-${i}`}
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
            )
          })}

          {/* Data shapes for each player */}
          {players.map((player, playerIndex) => {
            const playerColor = PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]

            // Generate points for the stat values
            const points = player.stats.map((stat, i) => getCoordinates(stat.normalizedValue, i))

            // Generate SVG path for the radar shape
            const pathData = points.map((point, i) => (i === 0 ? "M" : "L") + point.x + "," + point.y).join(" ") + "Z" // Close the path

            return (
              <g key={`player-${player.playerId}`}>
                {/* Data shape */}
                <path d={pathData} fill={playerColor.light} stroke={playerColor.color} strokeWidth="2" />

                {/* Data points */}
                {points.map((point, i) => (
                  <circle
                    key={`point-${player.playerId}-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="white"
                    stroke={playerColor.color}
                    strokeWidth="2"
                    className="cursor-pointer"
                    onMouseEnter={() => setShowTooltip(`${player.playerId}-${player.stats[i].stat}`)}
                    onMouseLeave={() => setShowTooltip(null)}
                  />
                ))}

                {/* Tooltips */}
                {player.stats.map((stat, i) => {
                  if (showTooltip === `${player.playerId}-${stat.stat}`) {
                    const point = points[i]
                    return (
                      <g key={`tooltip-${player.playerId}-${i}`}>
                        <rect
                          x={point.x + 10}
                          y={point.y - 30}
                          width="120"
                          height="25"
                          rx="4"
                          fill="rgba(0, 0, 0, 0.8)"
                        />
                        <text x={point.x + 70} y={point.y - 17} textAnchor="middle" fill="white" fontSize="12">
                          {player.name}: {stat.originalValue.toFixed(stat.stat.includes("PCT") ? 3 : 1)}
                        </text>
                      </g>
                    )
                  }
                  return null
                })}
              </g>
            )
          })}

          {/* Stat labels */}
          {stats.map((stat, i) => {
            const angle = i * angleStep - Math.PI / 2

            // Ajustar la distancia de las etiquetas según su posición
            // Las etiquetas horizontales (izquierda/derecha) necesitan más espacio
            let labelDistance = radius * 1.3 // Distancia base aumentada

            // Ajustar específicamente para las etiquetas horizontales
            if (Math.abs(Math.cos(angle)) > 0.7) {
              // Etiquetas más horizontales
              labelDistance = radius * 1.5 // Dar más espacio a las etiquetas horizontales
            }

            const x = centerX + labelDistance * Math.cos(angle)
            const y = centerY + labelDistance * Math.sin(angle)

            // Adjust text-anchor based on position
            let textAnchor = "middle"
            if (angle > -Math.PI / 4 && angle < Math.PI / 4) textAnchor = "start"
            else if (angle > (3 * Math.PI) / 4 || angle < (-3 * Math.PI) / 4) textAnchor = "end"

            // Ajustar posición para evitar cortes en los bordes
            const paddingX = 20 // Aumentar el padding horizontal
            const adjustedX = Math.min(Math.max(x, paddingX), size - paddingX)

            // Determinar si esta es una etiqueta horizontal (izquierda o derecha)
            const isHorizontalLabel = Math.abs(Math.cos(angle)) > 0.7

            return (
              <text
                key={`label-${i}`}
                x={adjustedX}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="white"
                fontSize={isHorizontalLabel ? "10" : "11"} // Reducir aún más el tamaño para etiquetas horizontales
                fontWeight="500"
              >
                {stat.label}
              </text>
            )
          })}
        </svg>

        {/* Legend for comparison mode */}
        {showLegend && players.length > 1 && (
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {players.map((player, index) => {
              const playerColor = PLAYER_COLORS[index % PLAYER_COLORS.length]
              return (
                <div key={`legend-${player.playerId}`} className="flex items-center">
                  <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: playerColor.color }}></div>
                  <span className="text-sm">{player.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Componente para mostrar fortalezas y debilidades
  const StrengthsWeaknessesPanel = ({ player }: { player: Player }) => {
    const analysis = strengthsWeaknesses[player.playerId]

    if (!analysis) return null

    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg mt-6">
        <h3 className="text-xl font-bold mb-4 flex items-center">
          <Zap className="mr-2 text-yellow-400" size={20} />
          Análisis de Perfil
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fortalezas */}
          <div>
            <h4 className="text-lg font-semibold mb-3 flex items-center text-green-400">
              <Award className="mr-2" size={18} />
              Fortalezas
            </h4>
            <div className="space-y-3">
              {analysis.strengths.map((item, index) => (
                <div key={`strength-${index}`} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{item.stat.label}</span>
                    <span className="text-green-400">
                      {item.stat.originalValue.toFixed(item.stat.stat.includes("PCT") ? 3 : 1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.percentile}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentil {item.percentile}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Debilidades */}
          <div>
            <h4 className="text-lg font-semibold mb-3 flex items-center text-red-400">
              <TrendingDown className="mr-2" size={18} />
              Áreas de Mejora
            </h4>
            <div className="space-y-3">
              {analysis.weaknesses.map((item, index) => (
                <div key={`weakness-${index}`} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{item.stat.label}</span>
                    <span className="text-red-400">
                      {item.stat.originalValue.toFixed(item.stat.stat.includes("PCT") ? 3 : 1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${item.percentile}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Percentil {item.percentile}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recomendaciones */}
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3 flex items-center text-blue-400">
            <AlertTriangle className="mr-2" size={18} />
            Recomendaciones Tácticas
          </h4>
          <ul className="space-y-2 bg-gray-700 rounded-lg p-4">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={`rec-${index}`} className="flex items-start">
                <span className="text-blue-400 mr-2">•</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
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
      <div className="w-full bg-gradient-to-r from-indigo-800 to-purple-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ChevronLeft className="h-8 w-8 text-blue-200 hover:text-white transition-colors" />
            </Link>
            <div>
              <div className="flex items-center">
                <h1 className="text-4xl md:text-5xl font-bold">Player Radar Analysis</h1>
                <div className="ml-4 flex items-center justify-center p-2 rounded-lg bg-white/10">
                  <Activity className="h-6 w-6" />
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
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => handleTabChange("individual")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "individual"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Análisis Individual
            </button>
            <button
              onClick={() => handleTabChange("comparison")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "comparison"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Comparación
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Selection Panel */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">
                {activeTab === "individual" ? "Seleccionar Jugador" : "Comparar Jugadores"}
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar jugadores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {activeTab === "comparison" && (
                <div className="mt-4 text-sm text-gray-400">
                  {selectedPlayers.length === 0
                    ? "Selecciona hasta 4 jugadores para comparar"
                    : `${selectedPlayers.length} jugador(es) seleccionado(s) (máx. 4)`}
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.some((p) => p.playerId === player.playerId)
                const playerIndex = selectedPlayers.findIndex((p) => p.playerId === player.playerId)
                const playerColor =
                  playerIndex >= 0 ? PLAYER_COLORS[playerIndex % PLAYER_COLORS.length].color : undefined

                return (
                  <div
                    key={player.playerId}
                    onClick={() => handlePlayerSelect(player)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-indigo-900 border border-indigo-700"
                        : "bg-gray-700 hover:bg-gray-600 border border-gray-700"
                    }`}
                    style={playerColor ? { borderColor: playerColor } : undefined}
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
                      <div className="text-xs text-gray-400">{player.gamesPlayed} games played</div>
                    </div>
                    {isSelected && activeTab === "comparison" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemovePlayer(player.playerId)
                        }}
                        className="p-1 rounded-full hover:bg-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Spider Chart Display */}
          <div className="lg:col-span-2">
            {selectedPlayers.length > 0 ? (
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                {activeTab === "individual" ? (
                  <>
                    <div className="flex items-center mb-6">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4">
                        <Image
                          src={selectedPlayers[0].image || "/placeholder.svg"}
                          alt={selectedPlayers[0].name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedPlayers[0].name}</h2>
                        <p className="text-gray-400">
                          {selectedPlayers[0].gamesPlayed} games played • {data.season} Season
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center my-8">
                      <SpiderChart players={[selectedPlayers[0]]} />
                    </div>

                    {/* Stats Table */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        Detailed Statistics
                        <div className="relative ml-2 group">
                          <Info className="h-4 w-4 text-gray-400" />
                          <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-gray-900 rounded-md shadow-lg text-xs hidden group-hover:block z-10">
                            <p>Valores originales de las estadísticas del jugador.</p>
                          </div>
                        </div>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {selectedPlayers[0].stats.map((stat) => (
                          <div key={stat.stat} className="bg-gray-700 rounded-lg p-3 text-center">
                            <div className="text-sm text-gray-400">{stat.label}</div>
                            <div className="text-xl font-bold mt-1">
                              {stat.originalValue.toFixed(stat.stat.includes("PCT") ? 3 : 1)}
                              {stat.stat.includes("PCT") ? "" : ""}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths and Weaknesses Panel */}
                    <StrengthsWeaknessesPanel player={selectedPlayers[0]} />
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold mb-2">Comparación de Jugadores</h2>
                      <p className="text-gray-400">
                        {selectedPlayers.length === 0
                          ? "Selecciona jugadores para comparar sus estadísticas"
                          : `Comparando ${selectedPlayers.length} jugador(es)`}
                      </p>
                    </div>

                    {selectedPlayers.length > 0 ? (
                      <>
                        <div className="flex justify-center my-8">
                          <SpiderChart players={selectedPlayers} showLegend={true} />
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedPlayers.map((player, index) => {
                            const playerColor = PLAYER_COLORS[index % PLAYER_COLORS.length]
                            return (
                              <div
                                key={`player-card-${player.playerId}`}
                                className="bg-gray-700 rounded-lg p-4 border-t-4"
                                style={{ borderColor: playerColor.color }}
                              >
                                <div className="flex items-center mb-3">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 mr-3">
                                    <Image
                                      src={player.image || "/placeholder.svg"}
                                      alt={player.name}
                                      width={48}
                                      height={48}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-bold">{player.name}</h3>
                                    <p className="text-xs text-gray-400">{player.gamesPlayed} games played</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {player.stats.slice(0, 6).map((stat) => (
                                    <div key={`stat-${player.playerId}-${stat.stat}`} className="flex justify-between">
                                      <span className="text-gray-400">{stat.label}:</span>
                                      <span>{stat.originalValue.toFixed(stat.stat.includes("PCT") ? 3 : 1)}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-600">
                                  <h4 className="text-sm font-semibold mb-1">Principales fortalezas:</h4>
                                  <div className="text-xs text-gray-300">
                                    {strengthsWeaknesses[player.playerId]?.strengths.slice(0, 2).map((item, i) => (
                                      <span key={`strength-${player.playerId}-${i}`}>
                                        {item.stat.label}
                                        {i < 1 ? ", " : ""}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Plus size={48} className="mb-4 opacity-50" />
                        <p>Selecciona jugadores de la lista para compararlos</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-6 shadow-lg flex items-center justify-center h-full">
                <p className="text-gray-400 text-lg">Selecciona un jugador para ver su gráfico de radar</p>
              </div>
            )}
          </div>
        </div>

        {/* Explanation Section */}
        <div className="mt-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">About Radar Analysis</h2>
            <div className="ml-4 h-1 flex-grow bg-indigo-600 rounded-full"></div>
          </div>

          <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-xl p-6 shadow-lg">
            <p className="text-gray-300 mb-4">
              Los gráficos de radar (o spider charts) proporcionan una visualización intuitiva del rendimiento general
              de un jugador en múltiples categorías estadísticas simultáneamente.
            </p>
            <div className="flex items-start mb-4">
              <div className="bg-indigo-600 p-2 rounded-lg mr-3 mt-1">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Interpretación:</span> Cuanto mayor sea el área cubierta por
                el gráfico, más completo es el jugador en todas las categorías. Un gráfico desequilibrado indica
                fortalezas y debilidades específicas.
              </p>
            </div>
            <div className="flex items-start">
              <div className="bg-purple-600 p-2 rounded-lg mr-3 mt-1">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-gray-300">
                <span className="font-semibold text-white">Normalización:</span> Los valores se han normalizado en una
                escala de 0 a 10 para permitir una comparación justa entre diferentes estadísticas. El valor máximo (10)
                representa el mejor rendimiento entre todos los jugadores del equipo.
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

