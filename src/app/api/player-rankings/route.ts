import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"
import { playersData } from "@/app/players-data"

// Usar una única instancia de Prisma para evitar memory leaks en desarrollo
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

interface PlayerStats {
  PTS: number
  FGM: number
  FGA: number
  FG3M: number
  FG3A: number
  FTM: number
  FTA: number
  REB: number
  OREB: number
  DREB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
  MIN: number
  [key: string]: number | Set<string>
  games: Set<string>
}

interface PlayerAverages {
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
  REB: number
  OREB: number
  DREB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
  MIN: number
  GAMES_PLAYED: number
  [key: string]: number
}

interface AdvancedStats {
  OffRtg: number
  TS: number
  eFG: number
  ASTtoTO: number
  TOVpercent: number
  USG: number
  [key: string]: number
}

interface PlayerData {
  playerId: number
  name: string
  image: string
  averages: PlayerAverages
  advancedStats: AdvancedStats
}

interface StatToRank {
  key: string
  label: string
}

interface RankedPlayer {
  rank: number
  playerId: number
  name: string
  image: string
  value: string
}

interface StatRanking {
  label: string
  players: RankedPlayer[]
}

interface Rankings {
  simple: {
    [key: string]: StatRanking
  }
  advanced: {
    [key: string]: StatRanking
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Get all games in the specified season
    const gamesInSeason = await prisma.stats.findMany({
      where: { SEASON_ID },
      select: { Game_ID: true },
      distinct: ["Game_ID"],
    })

    const gameIdsInSeason = gamesInSeason.map((g) => g.Game_ID)

    // Get players who played for the team in this season
    const playerIds = await prisma.stats
      .findMany({
        where: {
          SEASON_ID,
          Game_ID: { in: gameIdsInSeason },
        },
        select: { Player_ID: true },
        distinct: ["Player_ID"],
      })
      .then((results) => results.map((r) => r.Player_ID))

    const players = await prisma.playersteams.findMany({
      where: {
        player_team: TEAM_NAME,
        player_id: { in: playerIds },
      },
      select: {
        player_id: true,
        player_name: true,
      },
    })

    if (players.length === 0) {
      return NextResponse.json(
        {
          error: "No players found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Get all stats for these players in this season
    const playerStats: (PlayerData | null)[] = await Promise.all(
      players.map(async (player) => {
        const stats = await prisma.stats.findMany({
          where: {
            Player_ID: player.player_id,
            SEASON_ID: SEASON_ID,
          },
        })

        if (stats.length === 0) {
          return null
        }

        // Calculate totals across all games
        const totals: PlayerStats = {
          PTS: 0,
          FGM: 0,
          FGA: 0,
          FG3M: 0,
          FG3A: 0,
          FTM: 0,
          FTA: 0,
          REB: 0,
          OREB: 0,
          DREB: 0,
          AST: 0,
          STL: 0,
          BLK: 0,
          TOV: 0,
          PF: 0,
          PLUS_MINUS: 0,
          MIN: 0,
          games: new Set(), // Track unique games
        }

        stats.forEach((game) => {
          totals.PTS += game.PTS ?? 0
          totals.FGM += game.FGM ?? 0
          totals.FGA += game.FGA ?? 0
          totals.FG3M += game.FG3M ?? 0
          totals.FG3A += game.FG3A ?? 0
          totals.FTM += game.FTM ?? 0
          totals.FTA += game.FTA ?? 0
          totals.REB += game.REB ?? 0
          totals.OREB += game.OREB ?? 0
          totals.DREB += game.DREB ?? 0
          totals.AST += game.AST ?? 0
          totals.STL += game.STL ?? 0
          totals.BLK += game.BLK ?? 0
          totals.TOV += game.TOV ?? 0
          totals.PF += game.PF ?? 0
          totals.PLUS_MINUS += game.PLUS_MINUS ?? 0
          totals.MIN += game.MIN ?? 0

          totals.games.add(game.Game_ID)
        })

        const totalGames = totals.games.size
        if (totalGames === 0) {
          return null
        }

        // Calculate averages
        const playerAverages: PlayerAverages = {
          PTS: totals.PTS / totalGames,
          FGM: totals.FGM / totalGames,
          FGA: totals.FGA / totalGames,
          FG_PCT: totals.FGA > 0 ? totals.FGM / totals.FGA : 0,
          FG3M: totals.FG3M / totalGames,
          FG3A: totals.FG3A / totalGames,
          FG3_PCT: totals.FG3A > 0 ? totals.FG3M / totals.FG3A : 0,
          FTM: totals.FTM / totalGames,
          FTA: totals.FTA / totalGames,
          FT_PCT: totals.FTA > 0 ? totals.FTM / totals.FTA : 0,
          REB: totals.REB / totalGames,
          OREB: totals.OREB / totalGames,
          DREB: totals.DREB / totalGames,
          AST: totals.AST / totalGames,
          STL: totals.STL / totalGames,
          BLK: totals.BLK / totalGames,
          TOV: totals.TOV / totalGames,
          PF: totals.PF / totalGames,
          PLUS_MINUS: totals.PLUS_MINUS / totalGames,
          MIN: totals.MIN / totalGames,
          GAMES_PLAYED: totalGames,
        }

        // Calculate advanced stats
        const possessions = totals.FGA + 0.44 * totals.FTA + totals.TOV
        const ptsGenerated = totals.PTS + totals.AST * (2 * (1 - playerAverages.FG3_PCT) + 3 * playerAverages.FG3_PCT)
        const OffRtg = possessions > 0 ? (ptsGenerated / possessions) * 100 : 0
        const TS = totals.FGA + 0.44 * totals.FTA > 0 ? totals.PTS / (2 * (totals.FGA + 0.44 * totals.FTA)) : 0
        const eFG = totals.FGA > 0 ? (totals.FGM + 0.5 * totals.FG3M) / totals.FGA : 0
        const ASTtoTO = totals.TOV > 0 ? totals.AST / totals.TOV : 0
        const TOVpercent = possessions > 0 ? (totals.TOV / possessions) * 100 : 0
        const USG = totals.MIN > 0 ? ((totals.FGA + 0.44 * totals.FTA + totals.TOV) * 100) / (totals.MIN * 100) : 0

        // Get player image from players-data.ts
        const playerIdStr = player.player_id.toString()
        const playerData = playersData[playerIdStr]
        const playerImage = playerData?.image || "/placeholder.svg?height=400&width=300"
        // Usar el nombre del objeto playersData si está disponible, de lo contrario usar el nombre de la base de datos
        const playerName = playerData?.name || player.player_name

        return {
          playerId: player.player_id,
          name: playerName,
          image: playerImage,
          averages: playerAverages,
          advancedStats: {
            OffRtg,
            TS,
            eFG,
            ASTtoTO,
            TOVpercent,
            USG,
          },
        }
      }),
    )

    // Filter out null values (players with no stats)
    const validPlayerStats = playerStats.filter((player): player is PlayerData => player !== null)

    if (validPlayerStats.length === 0) {
      return NextResponse.json(
        {
          error: "No valid player stats found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Create rankings for each stat
    const rankings: Rankings = {
      simple: {},
      advanced: {},
    }

    // Simple stats rankings - TRADUCIDOS AL ESPAÑOL
    const simpleStatsToRank: StatToRank[] = [
      { key: "PTS", label: "Puntos por partido" },
      { key: "AST", label: "Asistencias por partido" },
      { key: "REB", label: "Rebotes por partido" },
      { key: "STL", label: "Robos por partido" },
      { key: "BLK", label: "Tapones por partido" },
      { key: "TOV", label: "Pérdidas por partido" },
      { key: "FG_PCT", label: "% Tiros de campo" },
      { key: "FG3_PCT", label: "% Triples" },
      { key: "FT_PCT", label: "% Tiros libres" },
      { key: "PLUS_MINUS", label: "Plus/Minus" },
      { key: "FGM", label: "Tiros de campo anotados" },
      { key: "FGA", label: "Tiros de campo intentados" },
      { key: "FTM", label: "Tiros libres anotados" },
      { key: "FTA", label: "Tiros libres intentados" },
      { key: "OREB", label: "Rebotes ofensivos" },
      { key: "DREB", label: "Rebotes defensivos" },
      { key: "GAMES_PLAYED", label: "Partidos jugados" },
    ]

    simpleStatsToRank.forEach((stat) => {
      // For most stats, higher is better
      const sortDirection = stat.key === "TOV" ? 1 : -1

      const rankedPlayers: RankedPlayer[] = [...validPlayerStats]
        .sort((a, b) => sortDirection * (a.averages[stat.key] - b.averages[stat.key]))
        .map((player, index) => ({
          rank: index + 1,
          playerId: player.playerId,
          name: player.name,
          image: player.image,
          value: stat.key.includes("PCT")
            ? `${(player.averages[stat.key] * 100).toFixed(1)}%`
            : player.averages[stat.key].toFixed(1),
        }))

      rankings.simple[stat.key] = {
        label: stat.label,
        players: rankedPlayers,
      }
    })

    // Advanced stats rankings - TRADUCIDOS AL ESPAÑOL
    const advancedStatsToRank: StatToRank[] = [
      { key: "OffRtg", label: "Rating Ofensivo" },
      { key: "TS", label: "% Tiro Efectivo" },
      { key: "eFG", label: "% Tiro Efectivo de Campo" },
      { key: "ASTtoTO", label: "Ratio Asistencias/Pérdidas" },
      { key: "TOVpercent", label: "% de Pérdidas" },
      { key: "USG", label: "% de Uso" },
    ]

    advancedStatsToRank.forEach((stat) => {
      // For most stats, higher is better except TOVpercent
      const sortDirection = stat.key === "TOVpercent" ? 1 : -1

      const rankedPlayers: RankedPlayer[] = [...validPlayerStats]
        .sort((a, b) => sortDirection * (a.advancedStats[stat.key] - b.advancedStats[stat.key]))
        .map((player, index) => ({
          rank: index + 1,
          playerId: player.playerId,
          name: player.name,
          image: player.image,
          value: ["TS", "eFG", "TOVpercent", "USG"].includes(stat.key)
            ? `${(player.advancedStats[stat.key]).toFixed(1)}%`
            : player.advancedStats[stat.key].toFixed(stat.key === "ASTtoTO" ? 2 : 1),
        }))

      rankings.advanced[stat.key] = {
        label: stat.label,
        players: rankedPlayers,
      }
    })

    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      rankings,
    })
  } catch (error) {
    console.error("Error fetching player rankings:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
