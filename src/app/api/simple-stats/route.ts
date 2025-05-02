import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"

// PrismaClient singleton implementation
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Types
interface TeamStats {
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
  games: Set<string | number>
}

export async function GET(req: NextRequest) {
  try {
    // Get all games in the specified season
    const gamesInSeason = await prisma.stats.findMany({
      where: { SEASON_ID },
      select: { Game_ID: true },
      distinct: ["Game_ID"],
    })

    const gameIdsInSeason = gamesInSeason.map((g) => g.Game_ID)

    // Get players who played for the team in this season
    const playersQuery = await prisma.stats.findMany({
      where: {
        SEASON_ID,
        Game_ID: { in: gameIdsInSeason },
      },
      select: { Player_ID: true },
      distinct: ["Player_ID"],
    })

    const playerIdsFromStats = playersQuery.map((r) => r.Player_ID)

    const players = await prisma.playersteams.findMany({
      where: {
        player_team: TEAM_NAME,
        player_id: { in: playerIdsFromStats },
      },
      select: { player_id: true },
    })

    const playerIds = players.map((p) => p.player_id)
    if (playerIds.length === 0) {
      return NextResponse.json(
        {
          error: "No players found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Get all stats for these players in this season
    const stats = await prisma.stats.findMany({
      where: {
        Player_ID: { in: playerIds },
        SEASON_ID: SEASON_ID,
      },
    })

    if (stats.length === 0) {
      return NextResponse.json(
        {
          error: "No stats found for this team in the given season",
        },
        { status: 404 },
      )
    }

    // Calculate totals across all games
    const totals = calculateTotals(stats)
    const totalGames = totals.games.size

    if (totalGames === 0) {
      return NextResponse.json(
        {
          error: "No games found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Calculate averages and advanced stats
    const teamAverages = calculateAverages(totals, totalGames)
    const advancedStats = calculateAdvancedStats(totals, totalGames)

    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      averages: teamAverages,
      advancedStats,
    })
  } catch (error) {
    console.error("Error fetching team averages:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Helper functions to make the code more maintainable
function calculateTotals(stats: any[]): TeamStats {
  const totals = {
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
    games: new Set<string | number>(), // Track unique games
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

    totals.games.add(game.Game_ID)
  })

  return totals
}

function calculateAverages(totals: TeamStats, totalGames: number) {
  return {
    PTS: totals.PTS / totalGames,
    FG_PCT: totals.FGA > 0 ? Number.parseFloat(((totals.FGM / totals.FGA) * 100).toFixed(1)) : 0,
    FG3_PCT: totals.FG3A > 0 ? Number.parseFloat(((totals.FG3M / totals.FG3A) * 100).toFixed(1)) : 0,
    FT_PCT: totals.FTA > 0 ? Number.parseFloat(((totals.FTM / totals.FTA) * 100).toFixed(1)) : 0,
    REB: totals.REB / totalGames,
    OREB: totals.OREB / totalGames,
    DREB: totals.DREB / totalGames,
    AST: totals.AST / totalGames,
    STL: totals.STL / totalGames,
    BLK: totals.BLK / totalGames,
    TOV: totals.TOV / totalGames,
    PF: totals.PF / totalGames,
    PLUS_MINUS: totals.PLUS_MINUS / totalGames,
    totalGames: totalGames,
  }
}

function calculateAdvancedStats(totals: TeamStats, totalGames: number) {
  // Calcular posesiones por juego (no totales)
  const possessionsPerGame = (totals.FGA + 0.44 * totals.FTA + totals.TOV) / totalGames

  // Calcular el total de posesiones para la temporada
  const totalPossessions = possessionsPerGame * totalGames

  // Pace: posesiones por 48 minutos (un juego completo)
  const pace = (possessionsPerGame * 48) / 40 // Asumiendo que un juego promedio tiene 40 minutos efectivos

  // Offensive Rating: puntos por 100 posesiones
  const OfRtg = (totals.PTS / totalPossessions) * 100

  // Effective Field Goal Percentage
  const eFG = totals.FGA > 0 ? (totals.FGM + 0.5 * totals.FG3M) / totals.FGA : 0

  // True Shooting Percentage
  const TS = totals.PTS > 0 ? totals.PTS / (2 * (totals.FGA + 0.44 * totals.FTA)) : 0

  // Turnover Percentage: porcentaje de posesiones que terminan en pérdida
  const TOVpercent = totalPossessions > 0 ? (totals.TOV / totalPossessions) * 100 : 0

  // Assist to Turnover Ratio
  const assistToTOV = totals.TOV > 0 ? totals.AST / totals.TOV : 0

  // Free Throw Rate: proporción de tiros libres intentados por tiro de campo intentado
  const freeThrowRate = totals.FGA > 0 ? (totals.FTA / totals.FGA) * 100 : 0

  // Effective Field Goal Attempts
  const EFGA = totals.FGA + 0.44 * totals.FTA

  // Mantener compatibilidad con el frontend existente
  return {
    possessions: totalPossessions, // Para mantener compatibilidad
    possessionsPerGame, // Nuevo valor
    pace, // Ritmo corregido
    OfRtg, // Offensive Rating
    DfRtg: 0, // Valor ficticio para mantener compatibilidad
    netRtg: OfRtg, // Valor ficticio para mantener compatibilidad
    eFG, // Effective Field Goal Percentage
    TS, // True Shooting Percentage
    TOVpercent, // Turnover Percentage
    assistToTOV, // Assist to Turnover Ratio
    freeThrowRate, // Free Throw Rate
    EFGA: EFGA / totalGames, // Effective Field Goal Attempts por juego
  }
}
