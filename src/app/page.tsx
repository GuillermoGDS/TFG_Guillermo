"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ChevronRight,
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  Calendar,
  Filter,
  Search,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Shield,
  Users,
  Star,
  ArrowRight,
  Award,
  LineChart,
  Layers,
  Target,
  BarChart4,
  PieChart,
  Clipboard,
  UserCircle,
  Lightbulb,
  Gauge,
  Dumbbell,
  Brain,
  Sparkles,
} from "lucide-react"

// Definir la interfaz para los tipos de datos
interface Game {
  Game_ID: string
  GAME_DATE: string
  MATCHUP: string
  WL?: string // Win/Loss
  PTS?: number // Team points
  PTS_OPP?: number // Opponent points
}

interface Player {
  player_id: string
  player_name: string
  image: string
}

interface SimpleStat {
  name: string
  value: string
  id: string
}

interface AdvancedStat {
  name: string
  value: string
  id: string
}

// Mapa de abreviaturas de equipos a nombres completos
const teamNames: { [key: string]: string } = {
  LAL: "Los Angeles Lakers",
  BOS: "Boston Celtics",
  MIA: "Miami Heat",
  NYK: "New York Knicks",
  GSW: "Golden State Warriors",
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

// Colores para equipos (simplificado, solo algunos equipos)
const teamColors: { [key: string]: string } = {
  LAL: "bg-purple-700",
  BOS: "bg-green-700",
  MIA: "bg-red-700",
  NYK: "bg-blue-700",
  GSW: "bg-yellow-600",
  CHI: "bg-red-600",
  PHI: "bg-blue-600",
  DAL: "bg-blue-500",
  // Color por defecto para equipos sin color específico
  default: "bg-gray-600",
}

// Función para agrupar partidos por mes
const groupGamesByMonth = (games: Game[]) => {
  const grouped: { [key: string]: Game[] } = {}

  games.forEach((game) => {
    // Convertir la fecha a un formato de mes (ej: "January 2023")
    const date = new Date(game.GAME_DATE)
    const monthYear = date.toLocaleString("default", { month: "long", year: "numeric" })

    if (!grouped[monthYear]) {
      grouped[monthYear] = []
    }

    grouped[monthYear].push(game)
  })

  return grouped
}

export default function Home() {
  const [section, setSection] = useState("Team")
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [gameSearchTerm, setGameSearchTerm] = useState("")
  const [gameFilter, setGameFilter] = useState<"all" | "wins" | "losses">("all")
  const [gameView, setGameView] = useState<"list" | "calendar">("list")
  const [players, setPlayers] = useState<Player[]>([])
  const [simpleStats, setSimpleStats] = useState<SimpleStat[]>([])
  const [advancedStats, setAdvancedStats] = useState<AdvancedStat[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdvancedStatsProvisional, setIsAdvancedStatsProvisional] = useState(false)

  // Estados adicionales para la sección de equipo mejorada
  const [playerSearchTerm, setPlayerSearchTerm] = useState("")
  const [filterPosition, setFilterPosition] = useState("all")
  const [activeStatTab, setActiveStatTab] = useState<"simple" | "advanced">("simple")

  // Nuevo estado para la sección de Analytics
  const [analyticsView, setAnalyticsView] = useState<"all" | "player" | "team" | "game">("all")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch games
        const gamesResponse = await fetch("/api/games")
        const gamesData = await gamesResponse.json()
        if (Array.isArray(gamesData)) {
          setGames(gamesData)
          setFilteredGames(gamesData)
        }

        // Fetch players
        const playersResponse = await fetch("/api/players")
        const playersData = await playersResponse.json()
        if (Array.isArray(playersData)) {
          setPlayers(playersData)
        }

        // Fetch simple stats
        const simpleStatsResponse = await fetch("/api/simple-stats")
        const simpleStatsData = await simpleStatsResponse.json()
        if (simpleStatsData.averages) {
          const formattedStats: SimpleStat[] = [
            { name: "Points per game", value: simpleStatsData.averages.PTS.toFixed(1), id: "ppg" },
            { name: "Field goal %", value: `${(simpleStatsData.averages.FG_PCT).toFixed(1)}%`, id: "fg_percentage" },
            {
              name: "3-point %",
              value: `${(simpleStatsData.averages.FG3_PCT).toFixed(1)}%`,
              id: "three_point_percentage",
            },
            { name: "Free throw %", value: `${(simpleStatsData.averages.FT_PCT).toFixed(1)}%`, id: "ft_percentage" },
            { name: "Total rebounds", value: simpleStatsData.averages.REB.toFixed(1), id: "total_rebounds" },
            { name: "Offensive rebounds", value: simpleStatsData.averages.OREB.toFixed(1), id: "offensive_rebounds" },
            { name: "Defensive rebounds", value: simpleStatsData.averages.DREB.toFixed(1), id: "defensive_rebounds" },
            { name: "Assists per game", value: simpleStatsData.averages.AST.toFixed(1), id: "apg" },
            { name: "Steals per game", value: simpleStatsData.averages.STL.toFixed(1), id: "spg" },
            { name: "Blocks per game", value: simpleStatsData.averages.BLK.toFixed(1), id: "bpg" },
            { name: "Turnovers", value: simpleStatsData.averages.TOV.toFixed(1), id: "turnovers" },
            { name: "Fouls", value: simpleStatsData.averages.PF.toFixed(1), id: "fouls" },
          ]
          setSimpleStats(formattedStats)
        }

        // Fetch advanced stats
        const advancedStatsResponse = await fetch("/api/simple-stats")
        const advancedStatsData = await advancedStatsResponse.json()
        if (advancedStatsData.advancedStats) {
          const formattedAdvancedStats: AdvancedStat[] = [
            { name: "Offensive Rating", value: advancedStatsData.advancedStats.OfRtg.toFixed(1), id: "ofrtg" },
            { name: "Defensive Rating", value: advancedStatsData.advancedStats.DfRtg.toFixed(1), id: "dfrtg" },
            { name: "Net Rating", value: advancedStatsData.advancedStats.netRtg.toFixed(1), id: "netrtg" },
            { name: "Pace", value: advancedStatsData.advancedStats.pace.toFixed(1), id: "pace" },
            { name: "Effective FG%", value: `${(advancedStatsData.advancedStats.eFG * 100).toFixed(1)}%`, id: "efg" },
            { name: "True Shooting%", value: `${(advancedStatsData.advancedStats.TS * 100).toFixed(1)}%`, id: "ts" },
            { name: "Turnover%", value: `${advancedStatsData.advancedStats.TOVpercent.toFixed(1)}%`, id: "tovpct" },
            {
              name: "Assist/TO Ratio",
              value: advancedStatsData.advancedStats.assistToTOV.toFixed(2),
              id: "ast_to_ratio",
            },
            { name: "Free Throw Rate", value: advancedStatsData.advancedStats.freeThrowRate.toFixed(1), id: "ft_rate" },
            {
              name: "Possessions",
              value: Math.round(advancedStatsData.advancedStats.possessions).toString(),
              id: "possessions",
            },
            { name: "Effective FGA", value: advancedStatsData.advancedStats.EFGA.toFixed(1), id: "efga" },
          ]
          setAdvancedStats(formattedAdvancedStats)
          setIsAdvancedStatsProvisional(false)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtrar juegos basado en búsqueda y filtros
  useEffect(() => {
    let result = [...games]

    // Aplicar filtro de búsqueda
    if (gameSearchTerm) {
      result = result.filter(
        (game) =>
          game.MATCHUP.toLowerCase().includes(gameSearchTerm.toLowerCase()) ||
          game.Game_ID.toLowerCase().includes(gameSearchTerm.toLowerCase()),
      )
    }

    // Aplicar filtro de victoria/derrota
    if (gameFilter !== "all") {
      result = result.filter((game) => game.WL === (gameFilter === "wins" ? "W" : "L"))
    }

    setFilteredGames(result)
  }, [games, gameSearchTerm, gameFilter])

  // Los jugadores ya vienen con sus imágenes desde la API
  const mergedPlayers = players.map((player) => ({
    id: player.player_id,
    name: player.player_name,
    image: player.image,
  }))

  // Filtrar jugadores basado en búsqueda
  const filteredPlayers = mergedPlayers.filter((player) =>
    player.name.toLowerCase().includes(playerSearchTerm.toLowerCase()),
  )

  // Función para determinar si un valor estadístico es destacable
  const isHighlightedStat = (stat: SimpleStat | AdvancedStat) => {
    // Ejemplos de criterios para destacar estadísticas
    if (stat.name.includes("Points") && Number.parseFloat(stat.value) > 100) return true
    if (stat.name.includes("Field goal") && Number.parseFloat(stat.value) > 45) return true
    if (stat.name.includes("3-point") && Number.parseFloat(stat.value) > 35) return true
    if (stat.name.includes("Rating") && Number.parseFloat(stat.value) > 110) return true
    return false
  }

  const formatMatchup = (matchup: string) => {
    return matchup.replace("@", "vs")
  }

  const formatTeamNames = (matchup: string) => {
    let teams = matchup.split(" ")
    teams = teams.map((team) => teamNames[team] || team)
    return teams.join(" ")
  }

  // Extraer equipos del matchup
  const getTeamsFromMatchup = (matchup: string) => {
    const teams = matchup.split(" ")
    const isAway = matchup.includes("@")

    return {
      team: teams[0],
      opponent: teams[2],
      isAway,
    }
  }

  // Obtener color de equipo
  const getTeamColor = (teamCode: string) => {
    return teamColors[teamCode] || teamColors.default
  }

  // Formatear fecha para mostrar
  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
  }

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

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center">Basketball Analytics</h1>
          <p className="text-center mt-2 text-blue-100">TFG Guillermo Gómez de Segura</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="w-full bg-gray-800 p-4 mb-8 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <ul className="flex justify-between items-center bg-gray-700 rounded-lg p-1">
            {["Team", "Games", "Analytics"].map((item) => (
              <li key={item} className="flex-1">
                <button
                  onClick={() => setSection(item)}
                  className={`w-full py-3 text-center rounded-md transition-all duration-300 ${
                    section === item
                      ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {section === "Team" && (
          <>
            {/* Players Section */}
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center">
                  <Users className="mr-3 h-8 w-8 text-blue-500" />
                  Players
                </h2>
                <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
              </div>

              {/* Filtros y búsqueda */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={playerSearchTerm}
                    onChange={(e) => setPlayerSearchTerm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="bg-gray-800 rounded-lg p-2 flex items-center">
                    <Filter className="text-gray-400 mr-2" size={18} />
                    <select
                      value={filterPosition}
                      onChange={(e) => setFilterPosition(e.target.value)}
                      className="bg-transparent text-white border-none focus:outline-none focus:ring-0"
                    >
                      <option value="all" className="bg-gray-800">
                        All Positions
                      </option>
                      <option value="G" className="bg-gray-800">
                        Guards
                      </option>
                      <option value="F" className="bg-gray-800">
                        Forwards
                      </option>
                      <option value="C" className="bg-gray-800">
                        Centers
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Featured Player (opcional) */}
              {filteredPlayers.length > 0 && (
                <div className="mb-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl overflow-hidden shadow-xl">
                  <div className="md:flex">
                    <div className="md:w-2/3 p-8">
                      <div className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm mb-4">
                        <Star className="h-4 w-4 mr-1 text-yellow-400" />
                        Featured Player
                      </div>
                      <h3 className="text-3xl font-bold mb-3">{filteredPlayers[0].name}</h3>
                      <p className="text-blue-200 mb-6">Team leader and key player for the current season.</p>
                      <Link
                        href={`/players/${filteredPlayers[0].id}`}
                        className="inline-flex items-center bg-white/10 hover:bg-white/20 px-5 py-3 rounded-lg transition-colors"
                      >
                        View Player Profile
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </div>
                    <div className="md:w-1/3 relative h-64 md:h-auto">
                      <Image
                        src={filteredPlayers[0].image || "/placeholder.svg?height=400&width=300"}
                        alt={filteredPlayers[0].name}
                        fill
                        className="object-cover object-top"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent md:bg-gradient-to-l"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Player Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player) => (
                  <Link href={`/players/${player.id}`} key={player.id} className="block">
                    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl group">
                      <div className="relative h-80">
                        <Image
                          src={player.image || "/placeholder.svg?height=400&width=300"}
                          alt={player.name || `Basketball player`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-xl font-bold truncate">{player.name}</h3>
                          <div className="mt-2 inline-flex items-center bg-blue-600 px-3 py-1 rounded-full text-sm transition-all group-hover:bg-blue-500">
                            <ChevronRight size={16} className="mr-1 group-hover:translate-x-1 transition-transform" />
                            View Profile
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Stats Tabs */}
            <div className="mb-8">
              <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
                <button
                  onClick={() => setActiveStatTab("simple")}
                  className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                    activeStatTab === "simple"
                      ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    <span>Simple Stats</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveStatTab("advanced")}
                  className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                    activeStatTab === "advanced"
                      ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    <span>Advanced Stats</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center">
                  {activeStatTab === "simple" ? (
                    <BarChart3 className="mr-3 h-8 w-8 text-green-500" />
                  ) : (
                    <TrendingUp className="mr-3 h-8 w-8 text-purple-500" />
                  )}
                  {activeStatTab === "simple" ? "Simple Stats" : "Advanced Stats"}
                </h2>
                <div
                  className={`ml-4 h-1 flex-grow ${activeStatTab === "simple" ? "bg-green-600" : "bg-purple-600"} rounded-full`}
                ></div>
                {activeStatTab === "advanced" && isAdvancedStatsProvisional && (
                  <div className="ml-4 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full">Provisional data</div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(activeStatTab === "simple" ? simpleStats : advancedStats).map((stat) => {
                  const isHighlighted = isHighlightedStat(stat)
                  return (
                    <Link
                      href={`/${activeStatTab === "simple" ? "simple" : "advanced"}-stats/${stat.id}`}
                      key={stat.id}
                      className="block"
                    >
                      <div
                        className={`${
                          activeStatTab === "simple"
                            ? isHighlighted
                              ? "bg-gradient-to-br from-green-800 to-blue-900"
                              : "bg-gray-800"
                            : isHighlighted
                              ? "bg-gradient-to-br from-blue-800 to-purple-900"
                              : "bg-gradient-to-br from-gray-800 to-gray-700"
                        } rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 ${
                          activeStatTab === "simple" ? "hover:bg-gray-700" : "hover:opacity-90"
                        } h-full flex flex-col justify-center min-h-[180px] relative overflow-hidden`}
                      >
                        {isHighlighted && (
                          <div className="absolute top-2 right-2">
                            <Award
                              className={`h-5 w-5 ${activeStatTab === "simple" ? "text-green-400" : "text-purple-400"}`}
                            />
                          </div>
                        )}
                        <p className={`text-lg ${activeStatTab === "simple" ? "text-gray-400" : "text-gray-300"} mb-3`}>
                          {stat.name}
                        </p>
                        <p className="text-3xl font-bold">{stat.value}</p>

                        {/* Barra de progreso visual (opcional) */}
                        {stat.name.includes("%") && (
                          <div className="w-full bg-gray-700 h-2 rounded-full mt-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${activeStatTab === "simple" ? "bg-green-500" : "bg-purple-500"}`}
                              style={{ width: `${Math.min(Number.parseFloat(stat.value.replace("%", "")), 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {section === "Games" && (
          <>
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold">Played Games</h2>
                <div className="ml-4 h-1 flex-grow bg-yellow-600 rounded-full"></div>
              </div>

              {/* Controles de filtrado y visualización */}
              <div className="bg-gray-800 rounded-xl p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Búsqueda */}
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar por equipo o ID..."
                      value={gameSearchTerm}
                      onChange={(e) => setGameSearchTerm(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  {/* Filtros */}
                  <div className="flex gap-2">
                    <div className="bg-gray-700 rounded-lg p-2 flex items-center">
                      <Filter className="text-gray-400 mr-2" size={18} />
                      <select
                        value={gameFilter}
                        onChange={(e) => setGameFilter(e.target.value as "all" | "wins" | "losses")}
                        className="bg-transparent text-white border-none focus:outline-none focus:ring-0"
                      >
                        <option value="all" className="bg-gray-700">
                          Todos
                        </option>
                        <option value="wins" className="bg-gray-700">
                          Victorias
                        </option>
                        <option value="losses" className="bg-gray-700">
                          Derrotas
                        </option>
                      </select>
                    </div>

                    {/* Selector de vista */}
                    <div className="flex rounded-lg overflow-hidden">
                      <button
                        onClick={() => setGameView("list")}
                        className={`px-3 py-2 ${gameView === "list" ? "bg-yellow-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      >
                        <ArrowUpDown size={18} />
                      </button>
                      <button
                        onClick={() => setGameView("calendar")}
                        className={`px-3 py-2 ${gameView === "calendar" ? "bg-yellow-600" : "bg-gray-700 hover:bg-gray-600"}`}
                      >
                        <Calendar size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {filteredGames.length > 0 ? (
                gameView === "list" ? (
                  // Vista de lista agrupada por mes
                  <div className="space-y-8">
                    {Object.entries(groupGamesByMonth(filteredGames)).map(([month, monthGames]) => (
                      <div key={month}>
                        <h3 className="text-xl font-semibold mb-4 pl-2 border-l-4 border-yellow-500">{month}</h3>
                        <div className="grid gap-4">
                          {monthGames.map((game) => {
                            const { team, opponent, isAway } = getTeamsFromMatchup(game.MATCHUP)
                            // Verificar si WL está disponible, si no, mostrar un estado neutral
                            const hasResult = game.WL !== undefined
                            const isWin = hasResult && game.WL === "W"

                            return (
                              <Link href={`/games/${game.Game_ID}`} key={game.Game_ID} className="block">
                                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:translate-x-1">
                                  {/* Barra superior con resultado o neutral si no hay resultado */}
                                  <div
                                    className={`h-1 w-full ${hasResult ? (isWin ? "bg-green-500" : "bg-red-500") : "bg-blue-500"}`}
                                  ></div>

                                  <div className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row md:items-center">
                                      {/* Fecha y estado */}
                                      <div className="mb-4 md:mb-0 md:mr-6 md:w-1/4">
                                        <p className="text-gray-400 text-sm">{formatGameDate(game.GAME_DATE)}</p>
                                        {hasResult ? (
                                          <div
                                            className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs ${isWin ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}
                                          >
                                            {isWin ? (
                                              <>
                                                <CheckCircle2 size={12} className="mr-1" /> Victoria
                                              </>
                                            ) : (
                                              <>
                                                <XCircle size={12} className="mr-1" /> Derrota
                                              </>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs bg-blue-900/50 text-blue-400">
                                            <Shield size={12} className="mr-1" /> Partido jugado
                                          </div>
                                        )}
                                      </div>

                                      {/* Equipos y resultado */}
                                      <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                          {/* Equipo local */}
                                          <div className="flex items-center">
                                            <div
                                              className={`${getTeamColor(team)} w-10 h-10 rounded-full flex items-center justify-center mr-3`}
                                            >
                                              <span className="font-bold text-white">{team}</span>
                                            </div>
                                            <div>
                                              <p className="font-semibold">{teamNames[team] || team}</p>
                                              {game.PTS ? (
                                                <p className="text-2xl font-bold">{game.PTS}</p>
                                              ) : (
                                                <p className="text-sm text-gray-400">Puntuación no disponible</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* VS */}
                                          <div className="mx-4 text-gray-500">VS</div>

                                          {/* Equipo visitante */}
                                          <div className="flex items-center">
                                            <div>
                                              <p className="font-semibold text-right">
                                                {teamNames[opponent] || opponent}
                                              </p>
                                              {game.PTS_OPP ? (
                                                <p className="text-2xl font-bold text-right">{game.PTS_OPP}</p>
                                              ) : (
                                                <p className="text-sm text-gray-400 text-right">
                                                  Puntuación no disponible
                                                </p>
                                              )}
                                            </div>
                                            <div
                                              className={`${getTeamColor(opponent)} w-10 h-10 rounded-full flex items-center justify-center ml-3`}
                                            >
                                              <span className="font-bold text-white">{opponent}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Botón de detalles */}
                                      <div className="mt-4 md:mt-0 md:ml-4 flex justify-end">
                                        <div className="flex items-center">
                                          <span className="text-gray-400 mr-2 bg-gray-900 px-3 py-1 rounded-full text-xs">
                                            {game.Game_ID}
                                          </span>
                                          <div className="bg-yellow-600 rounded-full p-2">
                                            <ChevronRight className="text-white" size={16} />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Vista de calendario (simplificada para este ejemplo)
                  <div className="bg-gray-800 rounded-xl p-6">
                    <p className="text-center text-gray-400">Vista de calendario no implementada en este ejemplo</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10 bg-gray-800 rounded-xl">
                  <p className="text-xl">No se encontraron partidos con los filtros actuales.</p>
                </div>
              )}
            </div>
          </>
        )}

        {section === "Analytics" && (
          <>
            <div className="mb-16">
              {/* Header mejorado con enfoque en entrenadores y jugadores */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-2xl overflow-hidden shadow-xl mb-10">
                <div className="relative">
                  {/* Fondo con patrón de cancha de baloncesto */}
                  <div className="absolute inset-0 opacity-10 bg-[url('/hardwood-court-lines.png')] bg-cover"></div>

                  <div className="relative p-8 md:p-10">
                    <div className="md:flex items-center justify-between">
                      <div className="md:w-3/5">
                        <div className="inline-flex items-center bg-white/10 px-3 py-1 rounded-full text-sm mb-4">
                          <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
                          Herramienta de Análisis Avanzado
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Optimiza el rendimiento del equipo</h2>
                        <p className="text-lg text-blue-100 mb-6 max-w-2xl">
                          Análisis detallados diseñados para ayudar a entrenadores y jugadores a tomar decisiones
                          basadas en datos y mejorar el rendimiento individual y colectivo.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-6">
                          <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-lg">
                            <UserCircle className="h-5 w-5 mr-2 text-blue-400" />
                            <span>Para jugadores</span>
                          </div>
                          <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-lg">
                            <Clipboard className="h-5 w-5 mr-2 text-green-400" />
                            <span>Para entrenadores</span>
                          </div>
                          <div className="inline-flex items-center bg-white/10 px-4 py-2 rounded-lg">
                            <Brain className="h-5 w-5 mr-2 text-purple-400" />
                            <span>Basado en datos</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:w-2/5 flex justify-center mt-6 md:mt-0">
                        <div className="relative w-64 h-64">
                          {/* Gráfico circular decorativo */}
                          <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-pulse"></div>
                          <div className="absolute inset-4 rounded-full border-4 border-indigo-500/40"></div>
                          <div className="absolute inset-8 rounded-full border-4 border-purple-500/50"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/10 p-6 rounded-full">
                              <BarChart4 className="h-16 w-16 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtros de análisis */}
                    <div className="mt-8 bg-white/5 rounded-xl p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setAnalyticsView("all")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            analyticsView === "all"
                              ? "bg-blue-600 text-white"
                              : "bg-white/10 hover:bg-white/20 text-white/80"
                          }`}
                        >
                          Todos los análisis
                        </button>
                        <button
                          onClick={() => setAnalyticsView("player")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            analyticsView === "player"
                              ? "bg-blue-600 text-white"
                              : "bg-white/10 hover:bg-white/20 text-white/80"
                          }`}
                        >
                          Análisis de jugadores
                        </button>
                        <button
                          onClick={() => setAnalyticsView("team")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            analyticsView === "team"
                              ? "bg-blue-600 text-white"
                              : "bg-white/10 hover:bg-white/20 text-white/80"
                          }`}
                        >
                          Análisis de equipo
                        </button>
                        <button
                          onClick={() => setAnalyticsView("game")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            analyticsView === "game"
                              ? "bg-blue-600 text-white"
                              : "bg-white/10 hover:bg-white/20 text-white/80"
                          }`}
                        >
                          Análisis de partidos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de herramientas de análisis */}
              <div className="mb-10">
                <div className="flex items-center mb-6">
                  <h3 className="text-2xl font-bold flex items-center">
                    <Layers className="mr-3 h-7 w-7 text-blue-500" />
                    Herramientas de Análisis
                  </h3>
                  <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Player Rankings */}
                  {(analyticsView === "all" || analyticsView === "player") && (
                    <Link href="/analytics/idea-1" className="group">
                      <div className="bg-white/5 backdrop-blur-sm border border-blue-900/30 rounded-xl p-6 shadow-lg h-full transition-all duration-300 hover:bg-blue-900/20 hover:border-blue-700/50 hover:shadow-blue-900/20 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="bg-gradient-to-br from-blue-600 to-blue-800 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-inner">
                            <BarChart3 className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Player Rankings</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                          Clasificación de jugadores según sus estadísticas clave y métricas de rendimiento.
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-blue-400 group-hover:text-blue-300">
                              <span>Explorar</span>
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                              Para entrenadores
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Win vs Loss Analysis */}
                  {(analyticsView === "all" || analyticsView === "team" || analyticsView === "game") && (
                    <Link href="/analytics/idea-2" className="group">
                      <div className="bg-white/5 backdrop-blur-sm border border-indigo-900/30 rounded-xl p-6 shadow-lg h-full transition-all duration-300 hover:bg-indigo-900/20 hover:border-indigo-700/50 hover:shadow-indigo-900/20 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-inner">
                            <ArrowUpDown className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Win vs Loss Analysis</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                          Comparativa de estadísticas y rendimiento de jugadores en victorias frente a derrotas.
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-indigo-400 group-hover:text-indigo-300">
                              <span>Explorar</span>
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                              Para entrenadores
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Player Radar Analysis */}
                  {(analyticsView === "all" || analyticsView === "player") && (
                    <Link href="/analytics/idea-3" className="group">
                      <div className="bg-white/5 backdrop-blur-sm border border-purple-900/30 rounded-xl p-6 shadow-lg h-full transition-all duration-300 hover:bg-purple-900/20 hover:border-purple-700/50 hover:shadow-purple-900/20 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="bg-gradient-to-br from-purple-600 to-purple-800 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-inner">
                            <Activity className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Player Radar Analysis</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                          Visualización multidimensional del impacto de los jugadores mediante gráficos de radar.
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-purple-400 group-hover:text-purple-300">
                              <span>Explorar</span>
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                              Para jugadores
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Player Evolution */}
                  {(analyticsView === "all" || analyticsView === "player") && (
                    <Link href="/analytics/idea-4" className="group">
                      <div className="bg-white/5 backdrop-blur-sm border border-fuchsia-900/30 rounded-xl p-6 shadow-lg h-full transition-all duration-300 hover:bg-fuchsia-900/20 hover:border-fuchsia-700/50 hover:shadow-fuchsia-900/20 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="bg-gradient-to-br from-fuchsia-600 to-fuchsia-800 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-inner">
                            <TrendingUp className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Player Evolution</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                          Análisis de la evolución del rendimiento de los jugadores a lo largo del tiempo.
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-fuchsia-400 group-hover:text-fuchsia-300">
                              <span>Explorar</span>
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                              Para jugadores
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Player Consistency */}
                  {(analyticsView === "all" || analyticsView === "player") && (
                    <Link href="/analytics/idea-5" className="group">
                      <div className="bg-white/5 backdrop-blur-sm border border-green-900/30 rounded-xl p-6 shadow-lg h-full transition-all duration-300 hover:bg-green-900/20 hover:border-green-700/50 hover:shadow-green-900/20 hover:shadow-lg">
                        <div className="flex items-center mb-4">
                          <div className="bg-gradient-to-br from-green-600 to-green-800 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-inner">
                            <LineChart className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="text-xl font-bold">Player Consistency</h3>
                        </div>
                        <p className="text-gray-300 mb-4">
                          Evaluación de la consistencia del rendimiento de los jugadores partido a partido.
                        </p>
                        <div className="mt-auto">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center text-sm text-green-400 group-hover:text-green-300">
                              <span>Explorar</span>
                              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                              Para ambos
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* Coming Soon */}
                  <div className="bg-white/5 backdrop-blur-sm border border-gray-800 rounded-xl p-6 shadow-lg h-full opacity-80">
                    <div className="flex items-center mb-4">
                      <div className="bg-gradient-to-br from-gray-600 to-gray-800 w-12 h-12 rounded-lg flex items-center justify-center mr-4 shadow-inner">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">Próximamente</h3>
                    </div>
                    <p className="text-gray-400 mb-4">
                      Nuevos análisis y visualizaciones en desarrollo. ¡Mantente atento a las actualizaciones!
                    </p>
                    <div className="inline-flex items-center bg-gray-800/50 px-3 py-1 rounded-full text-xs text-gray-400">
                      En desarrollo
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de beneficios para entrenadores y jugadores */}
              <div className="mb-10">
                <div className="flex items-center mb-6">
                  <h3 className="text-2xl font-bold flex items-center">
                    <Target className="mr-3 h-7 w-7 text-green-500" />
                    Beneficios para el Equipo
                  </h3>
                  <div className="ml-4 h-1 flex-grow bg-green-600 rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Para Entrenadores */}
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-6 shadow-lg border border-blue-800/30">
                    <div className="flex items-center mb-4">
                      <div className="bg-blue-700/30 p-3 rounded-lg mr-4">
                        <Clipboard className="h-6 w-6 text-blue-400" />
                      </div>
                      <h4 className="text-xl font-semibold text-blue-300">Para Entrenadores</h4>
                    </div>

                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <div className="bg-blue-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Identifica fortalezas y debilidades de cada jugador</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Optimiza las rotaciones basándote en datos de rendimiento</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Analiza patrones de éxito en victorias vs derrotas</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-blue-400" />
                        </div>
                        <span>Desarrolla estrategias basadas en el rendimiento histórico</span>
                      </li>
                    </ul>
                  </div>

                  {/* Para Jugadores */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-6 shadow-lg border border-purple-800/30">
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-700/30 p-3 rounded-lg mr-4">
                        <UserCircle className="h-6 w-6 text-purple-400" />
                      </div>
                      <h4 className="text-xl font-semibold text-purple-300">Para Jugadores</h4>
                    </div>

                    <ul className="space-y-3 text-gray-300">
                      <li className="flex items-start">
                        <div className="bg-purple-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>Visualiza tu evolución a lo largo de la temporada</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-purple-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>Identifica áreas específicas para mejorar</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-purple-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>Compara tu rendimiento con el de otros jugadores</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-purple-900/50 p-1 rounded-full mr-3 mt-1">
                          <CheckCircle2 className="h-4 w-4 text-purple-400" />
                        </div>
                        <span>Trabaja en la consistencia de tu rendimiento</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sección de consejos de uso */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="p-6 md:p-8">
                  <div className="flex items-center mb-6">
                    <Lightbulb className="h-6 w-6 text-yellow-400 mr-3" />
                    <h3 className="text-xl font-semibold">Cómo sacar el máximo provecho</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-blue-300 flex items-center">
                        <Gauge className="h-5 w-5 mr-2" />
                        Análisis pre-partido
                      </h4>
                      <p className="text-sm text-gray-300">
                        Utiliza Player Rankings y Radar Analysis para identificar fortalezas y debilidades de los
                        jugadores antes de un partido. Esto te ayudará a planificar estrategias específicas.
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-green-300 flex items-center">
                        <Dumbbell className="h-5 w-5 mr-2" />
                        Desarrollo de jugadores
                      </h4>
                      <p className="text-sm text-gray-300">
                        Combina Player Evolution y Consistency Analysis para crear planes de entrenamiento
                        personalizados que ayuden a los jugadores a mejorar en áreas específicas y mantener un
                        rendimiento constante.
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-purple-300 flex items-center">
                        <PieChart className="h-5 w-5 mr-2" />
                        Análisis post-partido
                      </h4>
                      <p className="text-sm text-gray-300">
                        Utiliza Win vs Loss Analysis después de cada partido para identificar patrones y factores clave
                        que influyeron en el resultado, permitiéndote ajustar estrategias para futuros encuentros.
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-yellow-300 flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        Toma de decisiones
                      </h4>
                      <p className="text-sm text-gray-300">
                        Integra los datos de todas las herramientas para tomar decisiones informadas sobre rotaciones,
                        estrategias de juego y áreas de enfoque en los entrenamientos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
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
