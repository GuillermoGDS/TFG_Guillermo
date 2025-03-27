"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

// Definir la interfaz para los tipos de datos
interface Game {
  Game_ID: string
  GAME_DATE: string
  MATCHUP: string
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

export default function Home() {
  const [section, setSection] = useState("Team")
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [simpleStats, setSimpleStats] = useState<SimpleStat[]>([])
  const [advancedStats, setAdvancedStats] = useState<AdvancedStat[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdvancedStatsProvisional, setIsAdvancedStatsProvisional] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch games
        const gamesResponse = await fetch("/api/games")
        const gamesData = await gamesResponse.json()
        if (Array.isArray(gamesData)) {
          setGames(gamesData)
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
        const advancedStatsResponse = await fetch("/api/advanced-stats", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        })
        const advancedStatsData = await advancedStatsResponse.json()
        if (advancedStatsData.averages) {
          const formattedStats: AdvancedStat[] = [
            { name: "Player Efficiency Rating (PER)", value: advancedStatsData.averages.PER.toFixed(1), id: "per" },
            { name: "Plus-Minus (+/-)", value: advancedStatsData.averages.PLUS_MINUS.toFixed(1), id: "plus_minus" },
            {
              name: "Usage Rate (USG%)",
              value: `${advancedStatsData.averages.USG_PCT.toFixed(1)}%`,
              id: "usg_percentage",
            },
            {
              name: "True Shooting % (TS%)",
              value: `${advancedStatsData.averages.TS_PCT.toFixed(1)}%`,
              id: "ts_percentage",
            },
            {
              name: "Assist to Turnover Ratio (AST/TO)",
              value: advancedStatsData.averages.AST_TO_RATIO.toFixed(2),
              id: "ast_to_ratio",
            },
            { name: "Win Shares (WS)", value: advancedStatsData.averages.WIN_SHARES.toFixed(1), id: "win_shares" },
            { name: "Offensive Rating (OffRtg)", value: advancedStatsData.averages.OFF_RTG.toFixed(1), id: "off_rtg" },
            { name: "Defensive Rating (DefRtg)", value: advancedStatsData.averages.DEF_RTG.toFixed(1), id: "def_rtg" },
            { name: "Net Rating (NetRtg)", value: advancedStatsData.averages.NET_RTG.toFixed(1), id: "net_rtg" },
          ]
          setAdvancedStats(formattedStats)
          setIsAdvancedStatsProvisional(advancedStatsData.provisional || false)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Los jugadores ya vienen con sus imágenes desde la API
  const mergedPlayers = players.map((player) => ({
    id: player.player_id,
    name: player.player_name,
    image: player.image,
  }))

  const formatMatchup = (matchup: string) => {
    return matchup.replace("@", "vs")
  }

  const formatTeamNames = (matchup: string) => {
    let teams = matchup.split(" ")
    teams = teams.map((team) => teamNames[team] || team)
    return teams.join(" ")
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
            {["Team", "Games", "Plans"].map((item) => (
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
                <h2 className="text-3xl font-bold">Players</h2>
                <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mergedPlayers.map((player) => (
                  <Link href={`/players/${player.id}`} key={player.id} className="block">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl overflow-hidden shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl">
                      <div className="relative h-80">
                        <Image
                          src={player.image || "/placeholder.svg"}
                          alt={player.name || `Basketball player`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-xl font-bold truncate">{player.name}</h3>
                          <div className="mt-2 inline-block bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
                            View Profile
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Simple Stats Section */}
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold">Simple Stats</h2>
                <div className="ml-4 h-1 flex-grow bg-green-600 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {simpleStats.map((stat) => (
                  <Link href={`/simple-stats/${stat.id}`} key={stat.id} className="block">
                    <div className="bg-gray-800 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:bg-gray-700 h-full flex flex-col justify-center min-h-[180px]">
                      <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Advanced Stats Section */}
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold">Advanced Stats</h2>
                <div className="ml-4 h-1 flex-grow bg-purple-600 rounded-full"></div>
                {isAdvancedStatsProvisional && (
                  <div className="ml-4 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full">
                    Datos provisionales
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {advancedStats.length > 0 ? (
                  advancedStats.map((stat) => (
                    <Link href={`/advanced-stats/${stat.id}`} key={stat.id} className="block">
                      <div className="bg-gradient-to-br from-blue-800 to-purple-900 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 hover:opacity-90 h-full flex flex-col justify-center min-h-[180px]">
                        <p className="text-lg text-gray-300 mb-3">{stat.name}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 bg-gray-800 rounded-xl">
                    <p className="text-xl">No advanced stats available.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {section === "Games" && (
          <>
            <div className="mb-16">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold">Upcoming Games</h2>
                <div className="ml-4 h-1 flex-grow bg-yellow-600 rounded-full"></div>
              </div>

              <div className="grid gap-4">
                {games.length > 0 ? (
                  games.map((game) => (
                    <Link href={`/games/${game.Game_ID}`} key={game.Game_ID} className="block">
                      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg flex justify-between items-center cursor-pointer hover:shadow-xl transition-all transform hover:translate-x-1">
                        <div className="flex items-center">
                          <div className="bg-blue-600 rounded-full p-3 mr-4">
                            <Image
                              src="/lakers-logo.png"
                              alt="Los Angeles Lakers Team Logo"
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{formatTeamNames(formatMatchup(game.MATCHUP))}</h3>
                            <p className="text-blue-300">{game.GAME_DATE}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-4 bg-gray-900 px-3 py-1 rounded-full text-sm">
                            {game.Game_ID}
                          </span>
                          <div className="bg-blue-600 rounded-full p-2">
                            <ChevronRight className="text-white" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-10 bg-gray-800 rounded-xl">
                    <p className="text-xl">No upcoming games available.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {section === "Plans" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl p-10 shadow-lg max-w-md w-full text-center">
              <h2 className="text-3xl font-bold mb-4">Coming Soon</h2>
              <p className="text-lg mb-6">Esta sección estará lista dentro de poco</p>
              <div className="inline-block bg-white bg-opacity-20 px-6 py-3 rounded-lg">Stay tuned!</div>
            </div>
          </div>
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

