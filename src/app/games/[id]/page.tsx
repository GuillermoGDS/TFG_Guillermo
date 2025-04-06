"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, BarChart3, TrendingUp, Clock, Award, Shield } from "lucide-react"

// Tipos para los datos del juego
interface GameInfo {
  id: string
  date: string
  homeTeam: {
    name: string
    logo: string
    score: number
  }
  awayTeam: {
    name: string
    logo: string
    score: number
  }
  venue: string
  attendance: string
  referees: string
}

interface StatItem {
  id: number
  name: string
  home: string
  away: string
}

interface PlayerStat {
  id: number
  name: string
  team: string
  number: string
  position: string
  minutes: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fouls: number
  fgm: number
  fga: number
  fgp: string
  tpm: number
  tpa: number
  tpp: string
  ftm: number
  fta: number
  ftp: string
  plusMinus: string
}

interface GameData {
  gameInfo: GameInfo
  simpleStats: StatItem[]
  advancedStats: StatItem[]
  playerStats: PlayerStat[]
}

// Añadir esta función de utilidad después de las interfaces y antes del componente principal
// Función para obtener la abreviatura de 3 letras de un equipo
const getTeamAbbreviation = (teamName: string): string => {
  // Verificar si el nombre ya es una abreviatura (3 letras o menos)
  if (teamName.length <= 3) return teamName.toUpperCase()

  // Mapeo de nombres comunes a abreviaturas estándar
  const teamAbbreviations: Record<string, string> = {
    "Los Angeles Lakers": "LAL",
    "Boston Celtics": "BOS",
    "Miami Heat": "MIA",
    "New York Knicks": "NYK",
    "Golden State Warriors": "GSW",
    "Chicago Bulls": "CHI",
    "Philadelphia 76ers": "PHI",
    "Dallas Mavericks": "DAL",
    "Toronto Raptors": "TOR",
    "Milwaukee Bucks": "MIL",
    "Phoenix Suns": "PHX",
    "Sacramento Kings": "SAC",
    "Utah Jazz": "UTA",
    "Detroit Pistons": "DET",
    "Indiana Pacers": "IND",
    "Houston Rockets": "HOU",
    "Memphis Grizzlies": "MEM",
    "Minnesota Timberwolves": "MIN",
    "Orlando Magic": "ORL",
    "Atlanta Hawks": "ATL",
    "Cleveland Cavaliers": "CLE",
    "Washington Wizards": "WAS",
    "Charlotte Hornets": "CHA",
    "Oklahoma City Thunder": "OKC",
    "Los Angeles Clippers": "LAC",
    "Brooklyn Nets": "BKN",
    "New Orleans Pelicans": "NOP",
    "Portland Trail Blazers": "POR",
    "San Antonio Spurs": "SAS",
    "Denver Nuggets": "DEN",
  }

  // Verificar si tenemos una abreviatura predefinida
  if (teamAbbreviations[teamName]) return teamAbbreviations[teamName]

  // Si no hay abreviatura predefinida, usar las primeras letras de cada palabra
  const words = teamName.split(" ")
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase()
  } else if (words.length === 2) {
    return (words[0][0] + words[1][0] + words[1][1]).toUpperCase()
  } else {
    // Si es una sola palabra, usar las 3 primeras letras
    return teamName.substring(0, 3).toUpperCase()
  }
}

export default function GameDetails({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Unwrap params using React.use() if it's a Promise
  const unwrappedParams = params instanceof Promise ? React.use(params) : params
  const gameId = unwrappedParams.id

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [activeTeam, setActiveTeam] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple")

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/game/${gameId}`)

        if (!res.ok) {
          throw new Error(`Failed to fetch game data: ${res.status}`)
        }

        const data = await res.json()
        setGameData(data)

        // Establecer el equipo local como activo por defecto
        if (data.gameInfo && data.gameInfo.homeTeam) {
          setActiveTeam(data.gameInfo.homeTeam.name)
        }

        setError(null)
      } catch (err) {
        console.error("Error fetching game data:", err)
        setError("Failed to load game data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (gameId) {
      fetchGameData()
    }
  }, [gameId])

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center">Game Details</h1>
            <p className="text-center mt-2 text-blue-100">Loading...</p>
          </div>
        </div>
        <div className="flex items-center justify-center flex-grow">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-center">Game Details</h1>
            <p className="text-center mt-2 text-blue-100">Error</p>
          </div>
        </div>
        <div className="flex items-center justify-center flex-grow">
          <div className="bg-gray-800 rounded-xl p-10 shadow-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">{error || "Game not found or data unavailable"}</h2>
            <Link
              href="/"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              <ChevronLeft className="mr-2" size={20} />
              Back to Games
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { gameInfo, simpleStats, advancedStats, playerStats } = gameData
  // Dentro del componente GameDetails, después de extraer gameInfo, simpleStats, etc.
  // Añadir estas líneas para obtener las abreviaturas
  const homeTeamAbbr = getTeamAbbreviation(gameInfo.homeTeam.name)
  const awayTeamAbbr = getTeamAbbreviation(gameInfo.awayTeam.name)
  const isHomeWinner = gameInfo.homeTeam.score > gameInfo.awayTeam.score
  const winnerName = isHomeWinner ? gameInfo.homeTeam.name : gameInfo.awayTeam.name
  const winnerScore = isHomeWinner ? gameInfo.homeTeam.score : gameInfo.awayTeam.score
  const loserName = isHomeWinner ? gameInfo.awayTeam.name : gameInfo.homeTeam.name
  const loserScore = isHomeWinner ? gameInfo.awayTeam.score : gameInfo.homeTeam.score
  const scoreDifference = winnerScore - loserScore

  // Función para determinar el color de fondo basado en el valor de +/-
  const getPlusMinusColor = (value: string) => {
    const numValue = Number.parseFloat(value)
    if (numValue > 15) return "text-green-400"
    if (numValue > 0) return "text-green-500"
    if (numValue < -15) return "text-red-400"
    if (numValue < 0) return "text-red-500"
    return "text-gray-400"
  }

  // Función para obtener las estadísticas destacadas de un jugador
  const getPlayerHighlights = (player: PlayerStat) => {
    const highlights = []

    if (player.points >= 20) highlights.push(`${player.points} PTS`)
    if (player.rebounds >= 10) highlights.push(`${player.rebounds} REB`)
    if (player.assists >= 8) highlights.push(`${player.assists} AST`)
    if (player.steals >= 3) highlights.push(`${player.steals} STL`)
    if (player.blocks >= 3) highlights.push(`${player.blocks} BLK`)

    return highlights.join(" | ")
  }

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ChevronLeft className="h-8 w-8 text-blue-200 hover:text-white transition-colors" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Game Details</h1>
              <p className="text-blue-100 mt-2">{gameInfo.date}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Game header with scoreboard */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-lg mb-10">
          {/* Winner indicator bar */}
          <div className={`h-1 w-full ${isHomeWinner ? "bg-blue-500" : "bg-purple-500"}`}></div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              {/* Teams and score */}
              <div className="flex flex-col md:flex-row items-center mb-6 md:mb-0">
                {/* Home team */}
                <div className="text-center md:text-left md:mr-8 mb-4 md:mb-0">
                  <div className={`rounded-xl p-4 mb-2 ${isHomeWinner ? "bg-blue-600/20" : "bg-gray-700"}`}>
                    <div className="bg-blue-600 rounded-full p-3 mb-2 relative h-24 w-24 mx-auto md:mx-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-50"></div>
                      <div className="text-center">
                        <span className="text-3xl font-bold">{homeTeamAbbr}</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold mt-2">{gameInfo.homeTeam.score}</p>
                    <p className="text-xs text-gray-300 mt-1">{gameInfo.homeTeam.name}</p>
                    {isHomeWinner && (
                      <div className="mt-2 inline-flex items-center bg-blue-600/30 px-3 py-1 rounded-full">
                        <Award className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Winner</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score display */}
                <div className="text-center mx-4 mb-4 md:mb-0">
                  <div className="text-5xl font-bold mb-2">
                    {gameInfo.homeTeam.score} - {gameInfo.awayTeam.score}
                  </div>
                  <div className="inline-block bg-black bg-opacity-30 px-4 py-1 rounded-full">
                    <p className="text-sm text-blue-300">
                      Final • {scoreDifference > 0 ? `+${scoreDifference}` : scoreDifference}
                    </p>
                  </div>
                </div>

                {/* Away team */}
                <div className="text-center md:text-right md:ml-8">
                  <div className={`rounded-xl p-4 mb-2 ${!isHomeWinner ? "bg-purple-600/20" : "bg-gray-700"}`}>
                    <div className="bg-purple-600 rounded-full p-3 mb-2 relative h-24 w-24 mx-auto md:mx-0 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-50"></div>
                      <div className="text-center">
                        <span className="text-3xl font-bold">{awayTeamAbbr}</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold mt-2">{gameInfo.awayTeam.score}</p>
                    <p className="text-xs text-gray-300 mt-1">{gameInfo.awayTeam.name}</p>
                    {!isHomeWinner && (
                      <div className="mt-2 inline-flex items-center bg-purple-600/30 px-3 py-1 rounded-full">
                        <Award className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Winner</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Game info */}
              <div className="text-right bg-gray-800/50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  <p className="text-lg font-semibold">{gameInfo.date}</p>
                </div>
                <p className="text-sm text-gray-300 mb-1">{gameInfo.venue}</p>
                <p className="text-xs text-gray-400">Attendance: {gameInfo.attendance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Tabs */}
        <div className="mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("simple")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "simple"
                  ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Simple Stats
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "advanced"
                  ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Advanced Stats
            </button>
          </div>
        </div>

        {/* Stats Display */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">{activeTab === "simple" ? "Team Stats" : "Advanced Analytics"}</h2>
            <div
              className={`ml-4 h-1 flex-grow ${activeTab === "simple" ? "bg-green-600" : "bg-purple-600"} rounded-full`}
            ></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(activeTab === "simple" ? simpleStats : advancedStats).map((stat) => {
              // Determinar qué equipo tiene mejor valor para esta estadística
              const isHomeHigher =
                Number.parseFloat(stat.home.replace("%", "")) > Number.parseFloat(stat.away.replace("%", ""))
              const isLowerBetter = stat.name.includes("Turnover") || stat.name.includes("Defensive Rating")
              const homeHasAdvantage = isLowerBetter ? !isHomeHigher : isHomeHigher
              const awayHasAdvantage = isLowerBetter ? isHomeHigher : !isHomeHigher

              return (
                <div
                  key={stat.id}
                  className={`rounded-xl p-6 shadow-lg transform transition-all hover:scale-105 ${
                    activeTab === "simple"
                      ? "bg-gray-800 hover:bg-gray-700"
                      : "bg-gradient-to-br from-blue-800 to-purple-900 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center justify-center mb-4">
                    {activeTab === "simple" ? (
                      <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
                    )}
                    <p className={`text-lg ${activeTab === "simple" ? "text-gray-400" : "text-gray-300"}`}>
                      {stat.name}
                    </p>
                  </div>

                  {/* Modificar las tarjetas de estadísticas para usar abreviaturas */}
                  <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                      <p className="text-sm text-blue-300 mb-1">{homeTeamAbbr}</p>
                      <p className={`text-2xl font-bold ${homeHasAdvantage ? "text-green-400" : ""}`}>{stat.home}</p>
                    </div>
                    <div className="text-xs text-gray-500 mx-2">vs</div>
                    <div className="text-center flex-1">
                      <p className="text-sm text-purple-300 mb-1">{awayTeamAbbr}</p>
                      <p className={`text-2xl font-bold ${awayHasAdvantage ? "text-green-400" : ""}`}>{stat.away}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Player Stats */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Player Stats</h2>
            <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
          </div>

          {/* Team selector */}
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTeam(gameInfo.homeTeam.name)}
              className={`flex-1 px-6 py-4 rounded-l-lg transition-all ${
                activeTeam === gameInfo.homeTeam.name
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 mr-2" />
                <span className="font-bold mr-2">{homeTeamAbbr}</span>
                <span className="text-sm hidden md:inline">{gameInfo.homeTeam.name}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTeam(gameInfo.awayTeam.name)}
              className={`flex-1 px-6 py-4 rounded-r-lg transition-all ${
                activeTeam === gameInfo.awayTeam.name
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <div className="flex items-center justify-center">
                <Shield className="h-5 w-5 mr-2" />
                <span className="font-bold mr-2">{awayTeamAbbr}</span>
                <span className="text-sm hidden md:inline">{gameInfo.awayTeam.name}</span>
              </div>
            </button>
          </div>

          {/* Top performers */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-500" />
              Top Performers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {playerStats
                .filter((player) => player.team === activeTeam)
                .sort((a, b) => b.points - a.points || b.rebounds - a.rebounds || b.assists - a.assists)
                .slice(0, 3)
                .map((player) => {
                  const highlights = getPlayerHighlights(player)
                  return (
                    <div key={`top-${player.id}`} className="bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                      <Link
                        href={`/players/${player.id}`}
                        className="font-bold text-lg hover:text-blue-400 transition-colors"
                      >
                        {player.name}
                      </Link>
                      <div className="mt-2 text-2xl font-bold">
                        {player.points} <span className="text-sm text-gray-400">PTS</span> {player.rebounds}{" "}
                        <span className="text-sm text-gray-400">REB</span> {player.assists}{" "}
                        <span className="text-sm text-gray-400">AST</span>
                      </div>
                      {highlights && <div className="mt-2 text-sm text-gray-300">{highlights}</div>}
                      <div className={`mt-2 text-sm ${getPlusMinusColor(player.plusMinus)}`}>
                        {player.plusMinus.startsWith("-") ? "" : "+"}
                        {player.plusMinus} plus/minus
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Player stats table with responsive design */}
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                    <th className="sticky left-0 bg-gray-700 px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-center">MIN</th>
                    <th className="px-4 py-3 text-center font-bold">PTS</th>
                    <th className="px-4 py-3 text-center">REB</th>
                    <th className="px-4 py-3 text-center">AST</th>
                    <th className="px-4 py-3 text-center">STL</th>
                    <th className="px-4 py-3 text-center">BLK</th>
                    <th className="px-4 py-3 text-center">TO</th>
                    <th className="px-4 py-3 text-center">PF</th>
                    <th className="px-4 py-3 text-center">FGM</th>
                    <th className="px-4 py-3 text-center">FGA</th>
                    <th className="px-4 py-3 text-center">FG%</th>
                    <th className="px-4 py-3 text-center">3PM</th>
                    <th className="px-4 py-3 text-center">3PA</th>
                    <th className="px-4 py-3 text-center">3P%</th>
                    <th className="px-4 py-3 text-center">FTM</th>
                    <th className="px-4 py-3 text-center">FTA</th>
                    <th className="px-4 py-3 text-center">FT%</th>
                    <th className="px-4 py-3 text-center">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats
                    .filter((player) => player.team === activeTeam)
                    .sort((a, b) => b.minutes - a.minutes) // Ordenar por minutos jugados
                    .map((player, index) => (
                      <tr
                        key={player.id}
                        className={`border-t border-gray-700 hover:bg-gray-700/50 ${
                          index % 2 === 0 ? "bg-gray-800/50" : "bg-gray-800"
                        }`}
                      >
                        <td className="sticky left-0 bg-inherit px-4 py-3 font-medium">
                          <div className="flex items-center">
                            <span className="mr-2">{player.number || ""}</span>
                            <Link href={`/players/${player.id}`} className="hover:text-blue-400 transition-colors">
                              {player.name}
                            </Link>
                            <span className="ml-2 text-xs text-gray-400">{player.position || ""}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">{player.minutes}</td>
                        <td className="px-4 py-3 text-center font-semibold">{player.points}</td>
                        <td className="px-4 py-3 text-center">{player.rebounds}</td>
                        <td className="px-4 py-3 text-center">{player.assists}</td>
                        <td className="px-4 py-3 text-center">{player.steals}</td>
                        <td className="px-4 py-3 text-center">{player.blocks}</td>
                        <td className="px-4 py-3 text-center">{player.turnovers}</td>
                        <td className="px-4 py-3 text-center">{player.fouls}</td>
                        <td className="px-4 py-3 text-center">{player.fgm}</td>
                        <td className="px-4 py-3 text-center">{player.fga}</td>
                        <td className="px-4 py-3 text-center">{player.fgp}</td>
                        <td className="px-4 py-3 text-center">{player.tpm}</td>
                        <td className="px-4 py-3 text-center">{player.tpa}</td>
                        <td className="px-4 py-3 text-center">{player.tpp}</td>
                        <td className="px-4 py-3 text-center">{player.ftm}</td>
                        <td className="px-4 py-3 text-center">{player.fta}</td>
                        <td className="px-4 py-3 text-center">{player.ftp}</td>
                        <td className={`px-4 py-3 text-center ${getPlusMinusColor(player.plusMinus)}`}>
                          {player.plusMinus.startsWith("-") ? "" : "+"}
                          {player.plusMinus}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
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

