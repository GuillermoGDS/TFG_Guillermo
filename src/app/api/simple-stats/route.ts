import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"

const prisma = new PrismaClient()

export async function GET(req) {
  try {
    // Get all games in the specified season
    const gamesInSeason = await prisma.stats.findMany({
      where: { SEASON_ID },
      select: { Game_ID: true },
      distinct: ["Game_ID"],
    })

    const gameIdsInSeason = gamesInSeason.map((g) => g.Game_ID)

    // Get players who played for the team in this season
    const players = await prisma.playersteams.findMany({
      where: {
        player_team: TEAM_NAME,
        player_id: {
          in: await prisma.stats
            .findMany({
              where: {
                SEASON_ID,
                Game_ID: { in: gameIdsInSeason },
              },
              select: { Player_ID: true },
              distinct: ["Player_ID"],
            })
            .then((results) => results.map((r) => r.Player_ID)),
        },
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

      totals.games.add(game.Game_ID)
    })

    const totalGames = totals.games.size
    if (totalGames === 0) {
      return NextResponse.json(
        {
          error: "No games found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Calculate averages
    const teamAverages = {
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

    // Cálculos avanzados
    const possessions = totals.FGA + 0.44 * totals.FTA + totals.TOV // Posesiones del equipo
    const pace = (possessions / totalGames) * 48 // Pace (suposición de que los juegos duran 48 minutos)
    const OfRtg = (totals.PTS / possessions) * 100 // Offensive Rating
    const DfRtg = ((totals.PTS - totals.PLUS_MINUS) / possessions) * 100 // Defensive Rating
    const eFG = totals.FGA > 0 ? (totals.FGM + 0.5 * totals.FG3M) / totals.FGA : 0 // Effective Field Goal Percentage
    const TS = totals.FGA > 0 ? totals.PTS / (2 * (totals.FGA + 0.44 * totals.FTA)) : 0 // True Shooting Percentage
    const netRtg = OfRtg - DfRtg // Net Rating
    const TOVpercent = (totals.TOV / possessions) * 100 // TOV%
    const assistToTOV = totals.TOV > 0 ? totals.AST / totals.TOV : 0 // Assist-to-TOV Ratio
    const freeThrowRate = (totals.FTA / totals.FGA) * 100 // Free Throw Rate
    const EFGA = totals.FGA + 0.44 * totals.FTA // Effective Field Goal Attempt Rate

    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      averages: teamAverages,
      advancedStats: {
        possessions: possessions,
        pace: pace,
        OfRtg: OfRtg,
        DfRtg: DfRtg,
        eFG: eFG,
        TS: TS,
        netRtg: netRtg,
        TOVpercent: TOVpercent,
        assistToTOV: assistToTOV,
        freeThrowRate: freeThrowRate,
        EFGA: EFGA,
      },
    })
  } catch (error) {
    console.error("Error fetching team averages:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
