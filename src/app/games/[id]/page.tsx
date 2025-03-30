"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft } from "lucide-react"

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

export default function GameDetails({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Unwrap params using React.use() if it's a Promise
  const unwrappedParams = params instanceof Promise ? React.use(params) : params
  const gameId = unwrappedParams.id

  const [gameData, setGameData] = useState<GameData | null>(null)
  const [activeTeam, setActiveTeam] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center">Game Details</h1>
          <p className="text-center mt-2 text-blue-100">{gameInfo.date}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="w-full bg-gray-800 p-4 mb-8 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <ul className="flex justify-between items-center bg-gray-700 rounded-lg p-1">
            {["Team", "Games", "Plans"].map((item) => (
              <li key={item} className="flex-1">
                <Link
                  href={item === "Games" ? "/games" : item === "Team" ? "/" : "#"}
                  className={`block w-full py-3 text-center rounded-md transition-all duration-300 ${
                    item === "Games"
                      ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto px-4 pb-16">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mb-8"
        >
          <ChevronLeft className="mr-2" size={20} />
          Back to Games
        </Link>

        {/* Game header */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-8 mb-10 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="text-center mr-8">
                <div className="bg-blue-600 rounded-full p-3 mb-2 relative h-24 w-24 flex items-center justify-center">
                  <Image
                    src={gameInfo.homeTeam.logo || "/placeholder.svg"}
                    alt={gameInfo.homeTeam.name}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium">{gameInfo.homeTeam.name}</p>
              </div>

              <div className="text-center mx-4">
                <div className="text-5xl font-bold mb-2">
                  {gameInfo.homeTeam.score} - {gameInfo.awayTeam.score}
                </div>
                <div className="inline-block bg-black bg-opacity-30 px-4 py-1 rounded-full">
                  <p className="text-sm text-blue-300">Final</p>
                </div>
              </div>

              <div className="text-center ml-8">
                <div className="bg-purple-600 rounded-full p-3 mb-2 relative h-24 w-24 flex items-center justify-center">
                  <Image
                    src={gameInfo.awayTeam.logo || "/placeholder.svg"}
                    alt={gameInfo.awayTeam.name}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium">{gameInfo.awayTeam.name}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold">{gameInfo.date}</p>
              <p className="text-sm text-gray-300">{gameInfo.venue}</p>
              <p className="text-xs text-gray-400 mt-1">Attendance: {gameInfo.attendance}</p>
            </div>
          </div>
        </div>

        {/* Simple Stats */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Simple Stats</h2>
            <div className="ml-4 h-1 flex-grow bg-green-600 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {simpleStats.map((stat) => (
              <div
                key={stat.id}
                className="bg-gray-800 rounded-xl p-6 shadow-lg transform transition-all hover:scale-105 hover:bg-gray-700"
              >
                <p className="text-lg text-gray-400 mb-4 text-center">{stat.name}</p>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="text-sm text-blue-300 mb-1">{gameInfo.homeTeam.name}</p>
                    <p className="text-2xl font-bold">{stat.home}</p>
                  </div>
                  <div className="text-xs text-gray-500 mx-2">vs</div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-purple-300 mb-1">{gameInfo.awayTeam.name}</p>
                    <p className="text-2xl font-bold">{stat.away}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Stats */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Advanced Stats</h2>
            <div className="ml-4 h-1 flex-grow bg-purple-600 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {advancedStats.map((stat) => (
              <div
                key={stat.id}
                className="bg-gradient-to-br from-blue-800 to-purple-900 rounded-xl p-6 shadow-lg transform transition-all hover:scale-105 hover:opacity-90"
              >
                <p className="text-lg text-gray-300 mb-4 text-center">{stat.name}</p>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="text-sm text-blue-300 mb-1">{gameInfo.homeTeam.name}</p>
                    <p className="text-2xl font-bold">{stat.home}</p>
                  </div>
                  <div className="text-xs text-gray-400 mx-2">vs</div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-purple-300 mb-1">{gameInfo.awayTeam.name}</p>
                    <p className="text-2xl font-bold">{stat.away}</p>
                  </div>
                </div>
              </div>
            ))}
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
              className={`px-6 py-3 rounded-l-lg ${
                activeTeam === gameInfo.homeTeam.name
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {gameInfo.homeTeam.name}
            </button>
            <button
              onClick={() => setActiveTeam(gameInfo.awayTeam.name)}
              className={`px-6 py-3 rounded-r-lg ${
                activeTeam === gameInfo.awayTeam.name
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {gameInfo.awayTeam.name}
            </button>
          </div>

          {/* Player stats table */}
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-700 to-gray-600">
                    <th className="sticky left-0 bg-gray-700 px-4 py-3 text-left">Player</th>
                    <th className="px-4 py-3 text-center">MIN</th>
                    <th className="px-4 py-3 text-center">PTS</th>
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
                    .map((player) => (
                      <tr key={player.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                        <td className="sticky left-0 bg-gray-800 px-4 py-3 font-medium">
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
                        <td
                          className={`px-4 py-3 text-center ${
                            Number.parseFloat(player.plusMinus) > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
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
          <p>© {new Date().getFullYear()} Basketball Analytics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

