"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams } from "next/navigation"
import {
  ChevronLeft,
  Loader2,
  BarChart3,
  TrendingUp,
  Calendar,
  Trophy,
  XCircle,
  ArrowLeftRight,
  Info,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Star,
  Sparkles,
  Gauge,
  Activity,
  BarChart4,
  PieChart,
  Dumbbell,
  Brain,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react"

// Mapa de abreviaturas de equipos a nombres completos
const teamNames: { [key: string]: string } = {
  LAL: "Las Rozas",
  BOS: "Boston Celtics",
  MIA: "Miami Heat",
  NYK: "New York Knicks",
  GSW: "Majadahonda", // Mapeo de GSW a Majadahonda
  CHI: "Chicago Bulls",
  PHI: "Philadelphia 76ers",
  DAL: "Dallas Mavericks",
  TOR: "Toronto Raptors",
  MIL: "Milwaukee Bucks",
  PHX: "Phoenix Suns",
  SAC: "Sacramento Kings",
  UTA: "Utah Jazz",
  DET: "Detroit Pistons",
  IND: "Indiana Pacers",
  HOU: "Houston Rockets",
  MEM: "Memphis Grizzlies",
  MIN: "Minnesota Timberwolves",
  ORL: "Orlando Magic",
  ATL: "Atlanta Hawks",
  CLE: "Cleveland Cavaliers",
  WAS: "Washington Wizards",
  CHA: "Charlotte Hornets",
  OKC: "Oklahoma City Thunder",
  LAC: "Los Angeles Clippers",
  BKN: "Brooklyn Nets",
  NOP: "New Orleans Pelicans",
  POR: "Portland Trail Blazers",
  SAS: "San Antonio Spurs",
  DEN: "Denver Nuggets",
} as const

// Colores para equipos
const teamColors: { [key: string]: string } = {
  LAL: "bg-purple-700",
  BOS: "bg-green-700",
  MIA: "bg-red-700",
  NYK: "bg-blue-700",
  GSW: "bg-yellow-600",
  CHI: "bg-red-600",
  PHI: "bg-blue-600",
  DAL: "bg-blue-500",
  BKN: "bg-gray-800",
  // Color por defecto para equipos sin color específico
  default: "bg-gray-600",
}

// Interfaces para los tipos de datos
interface TeamStats {
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
  OREB: number
  DREB: number
  REB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
}

interface AdvancedTeamStats {
  OffRtg: number
  DefRtg: number
  NetRtg: number
  TS: number
  eFG: number
  ASTtoTO: number
  TOVpercent: number
  pace: number
  possessions: number
  FTR: number
}

interface PlayerStats {
  player_id: number
  player_name: string
  player_image?: string
  MIN: number
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
  OREB: number
  DREB: number
  REB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
}

interface GameData {
  gameId: string
  gameDate: string
  matchup: string
  isAway: boolean
  result: string
  teamAbbr: string
  opponentAbbr: string
  teamName: string
  teamAbbreviation: string
  teamScore: number
  opponentScore: number
  teamSimpleStats: TeamStats
  opponentSimpleStats: TeamStats
  teamAdvancedStats: AdvancedTeamStats
  opponentAdvancedStats: AdvancedTeamStats
  playerStats: PlayerStats[]
}

// Función para obtener el nombre de visualización del equipo
const getDisplayTeamName = (abbr: string): string => {
  return teamNames[abbr as keyof typeof teamNames] || abbr
}



// Formatear fecha para mostrar
const formatGameDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function GameDetails() {
  const params = useParams()
  const id = params.id as string

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple")
  const [showPlayerStats, setShowPlayerStats] = useState(true)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGameData() {
      try {
        setLoading(true)
        const response = await fetch(`/api/game/${id}`)

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setGameData(data)
      } catch (error) {
        console.error("Error fetching game data:", error)
        setError("No se pudo cargar la información del partido. Por favor, inténtalo de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchGameData()
    }
  }, [id])

  // Función para mostrar/ocultar tooltip
  const toggleTooltip = (statId: string | null) => {
    setActiveTooltip(statId)
  }



  // Función para comparar estadísticas y determinar cuál equipo es mejor
  const compareStats = (
    teamValue: number,
    opponentValue: number,
    isLowerBetter = false,
  ): "team" | "opponent" | "tie" => {
    if (teamValue === opponentValue) return "tie"
    if (isLowerBetter) {
      return teamValue < opponentValue ? "team" : "opponent"
    }
    return teamValue > opponentValue ? "team" : "opponent"
  }

  // Componente para mostrar el indicador de comparación
  const ComparisonIndicator = ({ winner }: { winner: "team" | "opponent" | "tie" }) => {
    if (winner === "tie") {
      return <Minus className="h-3 w-3 text-gray-400" />
    }
    return winner === "team" ? (
      <ArrowUp className="h-3 w-3 text-green-400" />
    ) : (
      <ArrowDown className="h-3 w-3 text-red-400" />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-semibold">Cargando detalles del partido...</h1>
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center max-w-md text-center">
          <div className="bg-red-500/20 p-4 rounded-full mb-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold mb-4">Error</h1>
          <p className="text-gray-400 mb-6">{error || "No se encontraron datos para este partido."}</p>
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const {
    gameDate,
    result,
    teamAbbr,
    opponentAbbr,
    teamScore,
    opponentScore,
    teamSimpleStats,
    opponentSimpleStats,
    teamAdvancedStats,
    opponentAdvancedStats,
    playerStats,
  } = gameData

  const teamDisplayName = getDisplayTeamName(teamAbbr)
  const opponentDisplayName = getDisplayTeamName(opponentAbbr)
  const isWin = result === "W"
  const isTie = result === "T"

  // Definir estadísticas simples a mostrar
  const simpleStatsToShow = [
    { key: "FG_PCT", label: "% Tiros de campo", isPercentage: true },
    { key: "FG3_PCT", label: "% Triples", isPercentage: true },
    { key: "FT_PCT", label: "% Tiros libres", isPercentage: true },
    { key: "REB", label: "Rebotes totales" },
    { key: "OREB", label: "Rebotes ofensivos" },
    { key: "DREB", label: "Rebotes defensivos" },
    { key: "AST", label: "Asistencias" },
    { key: "STL", label: "Robos" },
    { key: "BLK", label: "Tapones" },
    { key: "TOV", label: "Pérdidas", isLowerBetter: true },
    { key: "PF", label: "Faltas personales", isLowerBetter: true },
    { key: "PLUS_MINUS", label: "Plus/Minus" },
  ]

  // Definir estadísticas avanzadas a mostrar
  const advancedStatsToShow = [
    {
      key: "OffRtg",
      label: "Rating Ofensivo",
      description: "Puntos anotados por cada 100 posesiones. Mide la eficiencia ofensiva del equipo.",
    },
    {
      key: "pace",
      label: "Ritmo",
      description: "Número de posesiones por 48 minutos. Indica la velocidad a la que juega el equipo.",
    },
    {
      key: "eFG",
      label: "% Tiro Efectivo",
      description:
        "Porcentaje de tiro que tiene en cuenta el valor adicional de los triples. Fórmula: (FGM + 0.5 * 3PM) / FGA",
    },
    {
      key: "TS",
      label: "% Tiro Real",
      description:
        "Medida de eficiencia de tiro que tiene en cuenta tiros de campo y tiros libres. Fórmula: Puntos / (2 * (FGA + 0.44 * FTA))",
    },
    {
      key: "TOVpercent",
      label: "% Pérdidas",
      description: "Porcentaje de posesiones que terminan en pérdida de balón.",
      isLowerBetter: true,
    },
    {
      key: "ASTtoTO",
      label: "Ratio Asistencias/Pérdidas",
      description: "Relación entre asistencias y pérdidas. Un valor mayor indica mejor cuidado del balón.",
    },
    {
      key: "FTR",
      label: "Ratio de Tiros Libres",
      description: "Relación entre intentos de tiros libres e intentos de tiros de campo. Fórmula: FTA / FGA",
    },
    {
      key: "possessions",
      label: "Posesiones por Partido",
      description: "Número estimado de posesiones en el partido.",
    },
  ]

  // Definir estadísticas de jugadores a mostrar
  const playerStatsToShow = [
    { key: "MIN", label: "MIN" },
    { key: "PTS", label: "PTS" },
    { key: "REB", label: "REB" },
    { key: "AST", label: "AST" },
    { key: "STL", label: "ROB" },
    { key: "BLK", label: "TAP" },
    { key: "TOV", label: "PÉR" },
    { key: "FG_PCT", label: "TC%", isPercentage: true },
    { key: "FG3_PCT", label: "T3%", isPercentage: true },
    { key: "FT_PCT", label: "TL%", isPercentage: true },
    { key: "PLUS_MINUS", label: "+/-" },
  ]

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
              <h1 className="text-4xl md:text-5xl font-bold">Detalles del Partido</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Game Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-xl mb-8">
          <div className="p-6 md:p-8">
            {/* Fecha y resultado */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <Calendar className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-gray-300">{formatGameDate(gameDate)}</span>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  isWin
                    ? "bg-green-900/50 text-green-400 border border-green-700/50"
                    : isTie
                      ? "bg-yellow-900/50 text-yellow-400 border border-yellow-700/50"
                      : "bg-red-900/50 text-red-400 border border-red-700/50"
                }`}
              >
                {isWin ? (
                  <>
                    <Trophy className="h-4 w-4 mr-1" />
                    Victoria
                  </>
                ) : isTie ? (
                  <>
                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                    Empate
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Derrota
                  </>
                )}
              </div>
            </div>

            {/* Equipos y puntuación */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Equipo local */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <h2 className="text-2xl font-bold">{teamDisplayName}</h2>
              </div>

              {/* Puntuación */}
              <div className="flex items-center">
                <div className="text-center">
                  <div className="text-5xl md:text-7xl font-bold">
                    <span className={isWin ? "text-green-400" : ""}>{teamScore}</span>
                    <span className="text-gray-500 mx-4">-</span>
                    <span className={!isWin && !isTie ? "text-green-400" : ""}>{opponentScore}</span>
                  </div>
                  <p className="text-gray-400 mt-2">Puntuación Final</p>
                </div>
              </div>

              {/* Equipo visitante */}
              <div className="flex flex-col items-center text-center md:items-end md:text-right">
                <h2 className="text-2xl font-bold mb-1">{opponentDisplayName}</h2>
                <p className="text-gray-400 text-sm">Oponente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("simple")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 flex items-center justify-center ${
                activeTab === "simple"
                  ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Estadísticas Básicas
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 flex items-center justify-center ${
                activeTab === "advanced"
                  ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Estadísticas Avanzadas
            </button>
          </div>
        </div>

        {/* Estadísticas de Equipo */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center">
              {activeTab === "simple" ? (
                <BarChart3 className="mr-3 h-8 w-8 text-green-500" />
              ) : (
                <TrendingUp className="mr-3 h-8 w-8 text-purple-500" />
              )}
              {activeTab === "simple" ? "Estadísticas Básicas" : "Estadísticas Avanzadas"}
            </h2>
            <div
              className={`ml-4 h-1 flex-grow ${activeTab === "simple" ? "bg-green-600" : "bg-purple-600"} rounded-full`}
            ></div>
          </div>

          <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Columna de estadísticas del equipo */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">{teamDisplayName}</h3>
                  <div className="space-y-4">
                    {activeTab === "simple"
                      ? // Estadísticas simples
                        simpleStatsToShow.map((stat) => {
                          const winner = compareStats(
                            teamSimpleStats[stat.key as keyof TeamStats],
                            opponentSimpleStats[stat.key as keyof TeamStats],
                            stat.isLowerBetter,
                          )
                          return (
                            <div
                              key={stat.key}
                              className="flex justify-between items-center border-b border-gray-700 pb-2"
                            >
                              <span className="text-gray-300 flex items-center">
                                {stat.label}
                                <span className="ml-2">
                                  <ComparisonIndicator winner={winner} />
                                </span>
                              </span>
                              <span className={`font-semibold ${winner === "team" ? "text-green-400" : ""}`}>
                                {stat.isPercentage
                                  ? `${(teamSimpleStats[stat.key as keyof TeamStats] * 100).toFixed(1)}%`
                                  : teamSimpleStats[stat.key as keyof TeamStats].toFixed(1)}
                              </span>
                            </div>
                          )
                        })
                      : // Estadísticas avanzadas
                        advancedStatsToShow.map((stat) => {
                          const winner = compareStats(
                            teamAdvancedStats[stat.key as keyof AdvancedTeamStats],
                            opponentAdvancedStats[stat.key as keyof AdvancedTeamStats],
                            stat.isLowerBetter,
                          )
                          return (
                            <div
                              key={stat.key}
                              className="flex justify-between items-center border-b border-gray-700 pb-2 group relative"
                            >
                              <span className="text-gray-300 flex items-center">
                                {stat.label}
                                <button
                                  className="ml-1 opacity-50 hover:opacity-100"
                                  onMouseEnter={() => toggleTooltip(stat.key)}
                                  onMouseLeave={() => toggleTooltip(null)}
                                >
                                  <Info className="h-3 w-3 text-blue-400" />
                                </button>
                                <span className="ml-2">
                                  <ComparisonIndicator winner={winner} />
                                </span>

                                {activeTooltip === stat.key && (
                                  <div className="absolute left-0 top-full mt-1 w-64 p-2 bg-gray-900 rounded-md shadow-lg z-10 text-xs">
                                    {stat.description}
                                  </div>
                                )}
                              </span>
                              <span className={`font-semibold ${winner === "team" ? "text-green-400" : ""}`}>
                                {teamAdvancedStats[stat.key as keyof AdvancedTeamStats].toFixed(1)}
                                {stat.key === "TS" || stat.key === "eFG" || stat.key === "TOVpercent" ? "%" : ""}
                              </span>
                            </div>
                          )
                        })}
                  </div>
                </div>

                {/* Columna de estadísticas del oponente */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">{opponentDisplayName}</h3>
                  <div className="space-y-4">
                    {activeTab === "simple"
                      ? // Estadísticas simples
                        simpleStatsToShow.map((stat) => {
                          const winner = compareStats(
                            teamSimpleStats[stat.key as keyof TeamStats],
                            opponentSimpleStats[stat.key as keyof TeamStats],
                            stat.isLowerBetter,
                          )
                          return (
                            <div
                              key={stat.key}
                              className="flex justify-between items-center border-b border-gray-700 pb-2"
                            >
                              <span className="text-gray-300">{stat.label}</span>
                              <span className={`font-semibold ${winner === "opponent" ? "text-green-400" : ""}`}>
                                {stat.isPercentage
                                  ? `${(opponentSimpleStats[stat.key as keyof TeamStats] * 100).toFixed(1)}%`
                                  : opponentSimpleStats[stat.key as keyof TeamStats].toFixed(1)}
                              </span>
                            </div>
                          )
                        })
                      : // Estadísticas avanzadas
                        advancedStatsToShow.map((stat) => {
                          const winner = compareStats(
                            teamAdvancedStats[stat.key as keyof AdvancedTeamStats],
                            opponentAdvancedStats[stat.key as keyof AdvancedTeamStats],
                            stat.isLowerBetter,
                          )
                          return (
                            <div
                              key={stat.key}
                              className="flex justify-between items-center border-b border-gray-700 pb-2"
                            >
                              <span className="text-gray-300">{stat.label}</span>
                              <span className={`font-semibold ${winner === "opponent" ? "text-green-400" : ""}`}>
                                {opponentAdvancedStats[stat.key as keyof AdvancedTeamStats].toFixed(1)}
                                {stat.key === "TS" || stat.key === "eFG" || stat.key === "TOVpercent" ? "%" : ""}
                              </span>
                            </div>
                          )
                        })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Jugadores */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="text-3xl font-bold flex items-center">
                <Users className="mr-3 h-8 w-8 text-blue-500" />
                Estadísticas de Jugadores
              </h2>
              <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
            </div>
            <button
              onClick={() => setShowPlayerStats(!showPlayerStats)}
              className="p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            >
              {showPlayerStats ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
            </button>
          </div>

          {showPlayerStats && (
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4">Jugador</th>
                        {playerStatsToShow.map((stat) => (
                          <th key={stat.key} className="text-center py-3 px-2">
                            {stat.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((player) => (
                        <tr key={player.player_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {player.player_image ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                                  <Image
                                    src={player.player_image || "/placeholder.svg"}
                                    alt={player.player_name}
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center mr-3">
                                  <span className="text-xs font-bold">
                                    {player.player_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </span>
                                </div>
                              )}
                              <span className="font-medium">{player.player_name}</span>
                            </div>
                          </td>
                          {playerStatsToShow.map((stat) => (
                            <td key={`${player.player_id}-${stat.key}`} className="text-center py-3 px-2">
                              {stat.isPercentage
                                ? player[stat.key as keyof PlayerStats] > 0
                                  ? `${(player[stat.key as keyof PlayerStats] * 100).toFixed(1)}%`
                                  : "-"
                                : player[stat.key as keyof PlayerStats]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección de análisis y visualización */}
        <div className="mt-12">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold flex items-center">
              <Sparkles className="mr-3 h-8 w-8 text-yellow-500" />
              Análisis del Partido
            </h2>
            <div className="ml-4 h-1 flex-grow bg-yellow-600 rounded-full"></div>
          </div>

          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Factores clave */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    Factores Clave
                  </h3>
                  <ul className="space-y-3">
                    {teamSimpleStats.FG_PCT > opponentSimpleStats.FG_PCT && (
                      <li className="flex items-start">
                        <div className="bg-green-900/50 p-1 rounded-full mr-3 mt-1">
                          <Gauge className="h-4 w-4 text-green-400" />
                        </div>
                        <span>
                          Mayor eficiencia en tiros de campo ({(teamSimpleStats.FG_PCT * 100).toFixed(1)}% vs{" "}
                          {(opponentSimpleStats.FG_PCT * 100).toFixed(1)}%)
                        </span>
                      </li>
                    )}
                    {teamSimpleStats.AST > opponentSimpleStats.AST && (
                      <li className="flex items-start">
                        <div className="bg-blue-900/50 p-1 rounded-full mr-3 mt-1">
                          <Activity className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>
                          Mayor número de asistencias ({teamSimpleStats.AST.toFixed(0)} vs{" "}
                          {opponentSimpleStats.AST.toFixed(0)})
                        </span>
                      </li>
                    )}
                    {teamSimpleStats.REB > opponentSimpleStats.REB && (
                      <li className="flex items-start">
                        <div className="bg-purple-900/50 p-1 rounded-full mr-3 mt-1">
                          <BarChart4 className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>
                          Dominio en el rebote ({teamSimpleStats.REB.toFixed(0)} vs {opponentSimpleStats.REB.toFixed(0)}
                          )
                        </span>
                      </li>
                    )}
                    {teamSimpleStats.TOV < opponentSimpleStats.TOV && (
                      <li className="flex items-start">
                        <div className="bg-indigo-900/50 p-1 rounded-full mr-3 mt-1">
                          <PieChart className="h-4 w-4 text-indigo-400" />
                        </div>
                        <span>
                          Menor número de pérdidas ({teamSimpleStats.TOV.toFixed(0)} vs{" "}
                          {opponentSimpleStats.TOV.toFixed(0)})
                        </span>
                      </li>
                    )}
                    {teamAdvancedStats.OffRtg > opponentAdvancedStats.OffRtg && (
                      <li className="flex items-start">
                        <div className="bg-red-900/50 p-1 rounded-full mr-3 mt-1">
                          <Dumbbell className="h-4 w-4 text-red-400" />
                        </div>
                        <span>
                          Mayor eficiencia ofensiva (Rating: {teamAdvancedStats.OffRtg.toFixed(1)} vs{" "}
                          {opponentAdvancedStats.OffRtg.toFixed(1)})
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Rendimiento destacado */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Brain className="h-5 w-5 text-blue-400 mr-2" />
                    Rendimiento Destacado
                  </h3>
                  {playerStats.length > 0 && (
                    <div>
                      <div className="flex items-center mb-3">
                        {playerStats[0].player_image ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                            <Image
                              src={playerStats[0].player_image || "/placeholder.svg"}
                              alt={playerStats[0].player_name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center mr-4">
                            <span className="font-bold">
                              {playerStats[0].player_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-lg">{playerStats[0].player_name}</h4>
                          <div className="flex items-center text-sm text-gray-300">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{playerStats[0].MIN} minutos</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-gray-800/70 rounded p-2 text-center">
                          <div className="text-2xl font-bold">{playerStats[0].PTS}</div>
                          <div className="text-xs text-gray-400">PTS</div>
                        </div>
                        <div className="bg-gray-800/70 rounded p-2 text-center">
                          <div className="text-2xl font-bold">{playerStats[0].REB}</div>
                          <div className="text-xs text-gray-400">REB</div>
                        </div>
                        <div className="bg-gray-800/70 rounded p-2 text-center">
                          <div className="text-2xl font-bold">{playerStats[0].AST}</div>
                          <div className="text-xs text-gray-400">AST</div>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>
                          {playerStats[0].player_name} lideró al equipo con {playerStats[0].PTS} puntos,
                          {playerStats[0].FG_PCT > 0
                            ? ` disparando con un ${(playerStats[0].FG_PCT * 100).toFixed(1)}% de acierto`
                            : ""}
                          {playerStats[0].FG3M > 0 ? ` y anotando ${playerStats[0].FG3M} triples` : ""}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
