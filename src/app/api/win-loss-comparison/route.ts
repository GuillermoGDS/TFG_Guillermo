import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"
import { playersData } from "@/app/players-data"

// Usar una única instancia de Prisma para evitar memory leaks en desarrollo
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

interface PlayerStatsGroup {
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
  games: Set<string>
  [key: string]: number | Set<string>
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
  DefRtg: number
  NetRtg: number
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
  wins: {
    averages: PlayerAverages
    advancedStats: AdvancedStats
  }
  losses: {
    averages: PlayerAverages
    advancedStats: AdvancedStats
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
    const playerStats: PlayerData[] = await Promise.all(
      players.map(async (player) => {
        const stats = await prisma.stats.findMany({
          where: {
            Player_ID: player.player_id,
            SEASON_ID: SEASON_ID,
          },
        })

        if (stats.length === 0) {
          // Return default structure with zeros for players with no stats
          return {
            playerId: player.player_id,
            name: player.player_name || "Unknown Player",
            image: playersData[player.player_id.toString()]?.image || "/placeholder.svg?height=400&width=300",
            wins: {
              averages: createEmptyAverages(),
              advancedStats: createEmptyAdvancedStats(),
            },
            losses: {
              averages: createEmptyAverages(),
              advancedStats: createEmptyAdvancedStats(),
            },
          }
        }

        // Separate stats by wins and losses
        const winStats: PlayerStatsGroup = createEmptyStatsGroup()
        const lossStats: PlayerStatsGroup = createEmptyStatsGroup()

        stats.forEach((game) => {
          const statsGroup = game.WL === "W" ? winStats : lossStats

          statsGroup.PTS += game.PTS ?? 0
          statsGroup.FGM += game.FGM ?? 0
          statsGroup.FGA += game.FGA ?? 0
          statsGroup.FG3M += game.FG3M ?? 0
          statsGroup.FG3A += game.FG3A ?? 0
          statsGroup.FTM += game.FTM ?? 0
          statsGroup.FTA += game.FTA ?? 0
          statsGroup.REB += game.REB ?? 0
          statsGroup.OREB += game.OREB ?? 0
          statsGroup.DREB += game.DREB ?? 0
          statsGroup.AST += game.AST ?? 0
          statsGroup.STL += game.STL ?? 0
          statsGroup.BLK += game.BLK ?? 0
          statsGroup.TOV += game.TOV ?? 0
          statsGroup.PF += game.PF ?? 0
          statsGroup.PLUS_MINUS += game.PLUS_MINUS ?? 0
          statsGroup.MIN += game.MIN ?? 0

          statsGroup.games.add(game.Game_ID)
        })

        // Calculate averages and advanced stats for wins and losses
        const winAverages = calculateAverages(winStats)
        const lossAverages = calculateAverages(lossStats)

        const winAdvancedStats = calculateAdvancedStats(winStats, winAverages)
        const lossAdvancedStats = calculateAdvancedStats(lossStats, lossAverages)

        // Get player image from players-data.ts
        const playerIdStr = player.player_id.toString()
        const playerImage = playersData[playerIdStr]?.image || "/placeholder.svg?height=400&width=300"

        return {
          playerId: player.player_id,
          name: player.player_name || "Unknown Player",
          image: playerImage,
          wins: {
            averages: winAverages,
            advancedStats: winAdvancedStats,
          },
          losses: {
            averages: lossAverages,
            advancedStats: lossAdvancedStats,
          },
        }
      }),
    )

    // Filter out players with no games played in either wins or losses
    const validPlayerStats = playerStats.filter(
      (player) => player.wins.averages.GAMES_PLAYED > 0 || player.losses.averages.GAMES_PLAYED > 0,
    )

    if (validPlayerStats.length === 0) {
      return NextResponse.json(
        {
          error: "No valid player stats found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Define the stats we want to include in the response
    const simpleStatsToInclude = [
      { key: "PTS", label: "Points" },
      { key: "AST", label: "Assists" },
      { key: "REB", label: "Rebounds" },
      { key: "STL", label: "Steals" },
      { key: "BLK", label: "Blocks" },
      { key: "TOV", label: "Turnovers" },
      { key: "FG_PCT", label: "FG%" },
      { key: "FG3_PCT", label: "3PT%" },
      { key: "FT_PCT", label: "FT%" },
      { key: "PLUS_MINUS", label: "Plus/Minus" },
    ]

    const advancedStatsToInclude = [
      { key: "OffRtg", label: "Offensive Rating" },
      { key: "DefRtg", label: "Defensive Rating" },
      { key: "NetRtg", label: "Net Rating" },
      { key: "TS", label: "True Shooting %" },
      { key: "eFG", label: "Effective FG%" },
      { key: "ASTtoTO", label: "AST/TO Ratio" },
      { key: "TOVpercent", label: "Turnover %" },
      { key: "USG", label: "Usage Rate" },
    ]

    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      players: validPlayerStats,
      simpleStats: simpleStatsToInclude,
      advancedStats: advancedStatsToInclude,
    })
  } catch (error) {
    console.error("Error fetching win-loss comparison:", error)
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

// Helper functions
function createEmptyStatsGroup(): PlayerStatsGroup {
  return {
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
    games: new Set(),
  }
}

function createEmptyAverages(): PlayerAverages {
  return {
    PTS: 0,
    FGM: 0,
    FGA: 0,
    FG_PCT: 0,
    FG3M: 0,
    FG3A: 0,
    FG3_PCT: 0,
    FTM: 0,
    FTA: 0,
    FT_PCT: 0,
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
    GAMES_PLAYED: 0,
  }
}

function createEmptyAdvancedStats(): AdvancedStats {
  return {
    OffRtg: 0,
    DefRtg: 0,
    NetRtg: 0,
    TS: 0,
    eFG: 0,
    ASTtoTO: 0,
    TOVpercent: 0,
    USG: 0,
  }
}

function calculateAverages(stats: PlayerStatsGroup): PlayerAverages {
  const totalGames = stats.games.size

  if (totalGames === 0) {
    return createEmptyAverages()
  }

  return {
    PTS: stats.PTS / totalGames,
    FGM: stats.FGM / totalGames,
    FGA: stats.FGA / totalGames,
    FG_PCT: stats.FGA > 0 ? stats.FGM / stats.FGA : 0,
    FG3M: stats.FG3M / totalGames,
    FG3A: stats.FG3A / totalGames,
    FG3_PCT: stats.FG3A > 0 ? stats.FG3M / stats.FG3A : 0,
    FTM: stats.FTM / totalGames,
    FTA: stats.FTA / totalGames,
    FT_PCT: stats.FTA > 0 ? stats.FTM / stats.FTA : 0,
    REB: stats.REB / totalGames,
    OREB: stats.OREB / totalGames,
    DREB: stats.DREB / totalGames,
    AST: stats.AST / totalGames,
    STL: stats.STL / totalGames,
    BLK: stats.BLK / totalGames,
    TOV: stats.TOV / totalGames,
    PF: stats.PF / totalGames,
    PLUS_MINUS: stats.PLUS_MINUS / totalGames,
    MIN: stats.MIN / totalGames,
    GAMES_PLAYED: totalGames,
  }
}

function calculateAdvancedStats(stats: PlayerStatsGroup, averages: PlayerAverages): AdvancedStats {
  if (stats.games.size === 0) {
    return createEmptyAdvancedStats()
  }

  const possessions = stats.FGA + 0.44 * stats.FTA + stats.TOV
  const ptsGenerated = stats.PTS + stats.AST * (2 * (1 - averages.FG3_PCT) + 3 * averages.FG3_PCT)

  // Offensive Rating: points generated per 100 possessions
  const offRtg = possessions > 0 ? (ptsGenerated / possessions) * 100 : 0

  // Defensive Rating (simplified): opponent points per 100 possessions
  // Using PLUS_MINUS to estimate defensive impact
  const defRtg = stats.MIN > 0 ? 100 - (stats.PLUS_MINUS / stats.MIN) * 50 : 0

  // Net Rating: difference between offensive and defensive ratings
  const netRtg = offRtg - defRtg

  // True Shooting Percentage
  const ts = stats.FGA + 0.44 * stats.FTA > 0 ? stats.PTS / (2 * (stats.FGA + 0.44 * stats.FTA)) : 0

  // Effective Field Goal Percentage
  const eFG = stats.FGA > 0 ? (stats.FGM + 0.5 * stats.FG3M) / stats.FGA : 0

  // Assist to Turnover Ratio
  const astToTO = stats.TOV > 0 ? stats.AST / stats.TOV : 0

  // Turnover Percentage
  const tovPercent = possessions > 0 ? (stats.TOV / possessions) * 100 : 0

  // Usage Rate
  const usg = stats.MIN > 0 ? ((stats.FGA + 0.44 * stats.FTA + stats.TOV) * 100) / (stats.MIN * 100) : 0

  return {
    OffRtg: offRtg,
    DefRtg: defRtg,
    NetRtg: netRtg,
    TS: ts * 100, // Convert to percentage
    eFG: eFG * 100, // Convert to percentage
    ASTtoTO: astToTO,
    TOVpercent: tovPercent,
    USG: usg,
  }
}

