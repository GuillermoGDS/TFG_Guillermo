import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { playersData } from "@/app/players-data"

export default function PlayerPage({ params }: { params: { id: string } }) {
  const playerId = params.id
  const player = playersData[playerId]

  if (!player) {
    notFound()
  }

  const simpleStats = [
    { name: "Points per game", value: player.stats.ppg.toString(), id: "ppg" },
    { name: "Field goal %", value: player.stats.fg_percentage, id: "fg_percentage" },
    { name: "3-point %", value: player.stats.three_point_percentage, id: "three_point_percentage" },
    { name: "Free throw %", value: player.stats.ft_percentage, id: "ft_percentage" },
    { name: "Total rebounds", value: player.stats.total_rebounds.toString(), id: "total_rebounds" },
    { name: "Offensive rebounds", value: player.stats.offensive_rebounds.toString(), id: "offensive_rebounds" },
    { name: "Defensive rebounds", value: player.stats.defensive_rebounds.toString(), id: "defensive_rebounds" },
    { name: "Assists per game", value: player.stats.apg.toString(), id: "apg" },
    { name: "Steals per game", value: player.stats.spg.toString(), id: "spg" },
    { name: "Blocks per game", value: player.stats.bpg.toString(), id: "bpg" },
    { name: "Turnovers", value: player.stats.turnovers.toString(), id: "turnovers" },
    { name: "Fouls", value: player.stats.fouls.toString(), id: "fouls" },
  ]

  const advancedStats = [
    { name: "Player Efficiency Rating (PER)", value: player.advancedStats.per.toString(), id: "per" },
    { name: "Plus-Minus (+/-)", value: player.advancedStats.plus_minus, id: "plus_minus" },
    { name: "Usage Rate (USG%)", value: player.advancedStats.usg_percentage, id: "usg_percentage" },
    { name: "True Shooting % (TS%)", value: player.advancedStats.ts_percentage, id: "ts_percentage" },
    {
      name: "Assist to Turnover Ratio (AST/TO)",
      value: player.advancedStats.ast_to_ratio.toString(),
      id: "ast_to_ratio",
    },
    { name: "Win Shares (WS)", value: player.advancedStats.win_shares.toString(), id: "win_shares" },
    { name: "Offensive Rating (OffRtg)", value: player.advancedStats.off_rtg.toString(), id: "off_rtg" },
    { name: "Defensive Rating (DefRtg)", value: player.advancedStats.def_rtg.toString(), id: "def_rtg" },
    { name: "Net Rating (NetRtg)", value: player.advancedStats.net_rtg, id: "net_rtg" },
    { name: "Possessions", value: player.advancedStats.possessions.toString(), id: "possessions" },
    { name: "Points Per Possession (PPP)", value: player.advancedStats.ppp.toString(), id: "ppp" },
  ]

  return (
    <div className="min-h-screen text-white bg-[#0a0a2a]">
      {/* Banner de la imagen del jugador */}
      <div className="fixed top-0 left-0 w-full z-10 bg-gradient-to-r from-blue-600 to-purple-700 py-4 flex justify-center items-center">
        <div className="relative w-96 h-40">
          <Image
            src={player.image || "/placeholder.svg"}
            alt={player.name}
            layout="fill"
            objectFit="cover"
            className="rounded-lg opacity-200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a2a] to-transparent"></div>
        </div>
      </div>

      {/* Nombre del jugador debajo del banner */}
      <div className="pt-48 max-w-7xl mx-auto px-4 py-4 text-center">
        <h1 className="text-4xl font-bold">{player.name}</h1>
        <p className="text-xl">{player.position}</p>
      </div>

      {/* Contenido de las estadísticas */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-block mb-8 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          ← Back to Home
        </Link>

        <h2 className="text-3xl font-bold my-8">Simple Stats</h2>
        <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
          {simpleStats.map((stat) => (
            <div
              key={stat.id}
              className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl p-6 text-center shadow-lg flex flex-col justify-center"
            >
              <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold my-8">Advanced Stats</h2>
        <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
          {advancedStats.map((stat) => (
            <div
              key={stat.id}
              className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl p-6 text-center shadow-lg flex flex-col justify-center"
            >
              <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="my-8">
          <h2 className="text-2xl font-bold mb-4">Heatmap</h2>
          <Image
            src={player.heatmap || "/placeholder.svg"}
            alt={`${player.name} Heatmap`}
            width={500}
            height={300}
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  )
}

