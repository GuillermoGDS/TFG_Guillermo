"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { playersData } from "@/app/players-data"

export default function Home() {
  const [section, setSection] = useState("Team")

  const players = Object.keys(playersData).map((id) => ({
    name: playersData[id].name,
    image: playersData[id].image,
    id: id,
    position: playersData[id].position,
  }))

  const simpleStats = [
    { name: "Points per game", value: "30.5", id: "ppg" },
    { name: "Field goal %", value: "48.2%", id: "fg_percentage" },
    { name: "3-point %", value: "37.8%", id: "three_point_percentage" },
    { name: "Free throw %", value: "85.3%", id: "ft_percentage" },
    { name: "Total rebounds", value: "8.7", id: "total_rebounds" },
    { name: "Offensive rebounds", value: "1.2", id: "offensive_rebounds" },
    { name: "Defensive rebounds", value: "7.5", id: "defensive_rebounds" },
    { name: "Assists per game", value: "7.2", id: "apg" },
    { name: "Steals per game", value: "1.5", id: "spg" },
    { name: "Blocks per game", value: "0.8", id: "bpg" },
    { name: "Turnovers", value: "3.1", id: "turnovers" },
    { name: "Fouls", value: "2.4", id: "fouls" },
  ]

  const advancedStats = [
    { name: "Player Efficiency Rating (PER)", value: "25.6", id: "per" },
    { name: "Plus-Minus (+/-)", value: "+7.2", id: "plus_minus" },
    { name: "Usage Rate (USG%)", value: "28.5%", id: "usg_percentage" },
    { name: "True Shooting % (TS%)", value: "62.3%", id: "ts_percentage" },
    { name: "Assist to Turnover Ratio (AST/TO)", value: "2.32", id: "ast_to_ratio" },
    { name: "Win Shares (WS)", value: "10.4", id: "win_shares" },
    { name: "Offensive Rating (OffRtg)", value: "114.5", id: "off_rtg" },
    { name: "Defensive Rating (DefRtg)", value: "106.2", id: "def_rtg" },
    { name: "Net Rating (NetRtg)", value: "+8.3", id: "net_rtg" },
    { name: "Possessions", value: "98.5", id: "possessions" },
    { name: "Points Per Possession (PPP)", value: "1.16", id: "ppp" },
  ]

  const games = [
    { opponent: "Golden State Warriors", date: "2023-11-15", id: "lakers-vs-warriors-20231115" },
    { opponent: "Boston Celtics", date: "2023-11-18", id: "lakers-vs-celtics-20231118" },
    { opponent: "Miami Heat", date: "2023-11-22", id: "lakers-vs-heat-20231122" },
    { opponent: "Phoenix Suns", date: "2023-11-26", id: "lakers-vs-suns-20231126" },
    { opponent: "Denver Nuggets", date: "2023-11-30", id: "lakers-vs-nuggets-20231130" },
    { opponent: "Dallas Mavericks", date: "2023-12-04", id: "lakers-vs-mavericks-20231204" },
    { opponent: "Milwaukee Bucks", date: "2023-12-08", id: "lakers-vs-bucks-20231208" },
    { opponent: "Brooklyn Nets", date: "2023-12-12", id: "lakers-vs-nets-20231212" },
  ]

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
      <nav className="w-full bg-gray-800 p-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <ul className="flex justify-between items-center bg-gray-700 rounded-lg p-1">
            {["Team", "Games", "Plans"].map((item) => (
              <li key={item} className="flex-1">
                <button
                  onClick={() => setSection(item)}
                  className={`w-full py-2 text-center rounded-md transition-all duration-300 ${section === item ? "bg-blue-600 text-white shadow-lg" : "text-gray-300 hover:bg-gray-600"}`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto px-4">
        {section === "Team" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="w-48 h-48 relative">
                <Image src="/lakers-logo.png" alt="Lakers Logo" width={192} height={192} className="drop-shadow-lg" />
              </div>
              <h2 className="text-3xl font-bold">Players</h2>
            </div>

            <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
              {players.map((player) => (
                <Link href={`/players/${player.id}`} key={player.id}>
                  <div className="w-64 flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-all hover:scale-105">
                    <div className="relative h-80">
                      <Image
                        src={player.image || "/placeholder.svg"}
                        alt={player.name}
                        layout="fill"
                        objectFit="cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                        <h3 className="text-xl font-bold truncate">{player.name}</h3>
                        <p className="text-sm">{player.position}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <h2 className="text-3xl font-bold my-8">Simple Stats</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
              {simpleStats.map((stat) => (
                <Link href={`/simple-stats/${stat.id}`} key={stat.id}>
                  <div className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 flex flex-col justify-center">
                    <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </Link>
              ))}
            </div>

            <h2 className="text-3xl font-bold my-8">Advanced Stats</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
              {advancedStats.map((stat) => (
                <Link href={`/advanced-stats/${stat.id}`} key={stat.id}>
                  <div className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 flex flex-col justify-center">
                    <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {section === "Games" && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Upcoming Games</h2>
              <Link
                href="/games"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View All Games
              </Link>
            </div>
            <div className="grid gap-4">
              {games.slice(0, 4).map((game) => (
                <Link href={`/games/${game.id}`} key={game.id}>
                  <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <div className="flex items-center">
                      <Image src="/lakers-logo.png" alt="Lakers Logo" width={64} height={64} className="mr-4" />
                      <div>
                        <h3 className="text-xl font-semibold">Los Angeles Lakers vs {game.opponent}</h3>
                        <p className="text-gray-400">
                          {new Date(game.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

