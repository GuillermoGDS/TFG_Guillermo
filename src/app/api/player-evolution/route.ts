import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"
import { playersData } from "@/app/players-data"

// Use a single Prisma instance to avoid memory leaks in development
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

interface StatPoint {
  date: string
  value: number
}

interface PlayerEvolution {
  playerId: number
  playerName: string
  image: string
  stats: {
    [key: string]: StatPoint[]
  }
}

// Modificar la definición de ADVANCED_STATS para que coincida con las estadísticas de player-rankings
const BASIC_STATS = ["PTS", "AST", "REB", "STL", "BLK", "TOV", "FG_PCT", "FG3_PCT", "FT_PCT", "PLUS_MINUS", "MIN"]
const ADVANCED_STATS = ["OffRtg", "TS", "eFG", "ASTtoTO", "TOVpercent", "USG"]

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Get query parameters
    const url = new URL(req.url)
    const statType = url.searchParams.get("stat") || "PTS"
    const playerId = url.searchParams.get("playerId")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20", 10)

    // Base query to get players from the team
    const basePlayerQuery = {
      where: {
        player_team: TEAM_NAME,
      },
      select: {
        player_id: true,
        player_name: true,
      },
    }

    // If a specific player is requested, filter by player ID
    if (playerId) {
      basePlayerQuery.where = {
        ...basePlayerQuery.where,
        player_id: Number.parseInt(playerId, 10),
      }
    }

    // Get players
    const players = await prisma.playersteams.findMany(basePlayerQuery)

    if (players.length === 0) {
      return NextResponse.json({ error: "No players found for this team" }, { status: 404 })
    }

    // Get evolution data for each player
    const playerEvolutionData: PlayerEvolution[] = await Promise.all(
      players.map(async (player) => {
        // Get all games for this player in chronological order
        const playerGames = await prisma.stats.findMany({
          where: {
            Player_ID: player.player_id,
            SEASON_ID,
          },
          orderBy: {
            GAME_DATE: "asc",
          },
          select: {
            GAME_DATE: true,
            PTS: true,
            AST: true,
            REB: true,
            STL: true,
            BLK: true,
            TOV: true,
            FG_PCT: true,
            FG3_PCT: true,
            FT_PCT: true,
            PLUS_MINUS: true,
            MIN: true,
            FGA: true,
            FGM: true,
            FTA: true,
            FTM: true,
            FG3A: true,
            FG3M: true,
            OREB: true,
            DREB: true,
          },
        })

        // Initialize stats object with basic stats
        const stats: { [key: string]: StatPoint[] } = {}

        // Initialize all basic stats arrays
        BASIC_STATS.forEach((stat) => {
          stats[stat] = []
        })

        // Initialize all advanced stats arrays
        ADVANCED_STATS.forEach((stat) => {
          stats[stat] = []
        })

        // Process each game and add data points
        playerGames.forEach((game) => {
          const date = game.GAME_DATE ? game.GAME_DATE.toISOString().split("T")[0] : null
          if (!date) return

          // Add basic stats
          BASIC_STATS.forEach((key) => {
            if (game[key] !== null && game[key] !== undefined) {
              stats[key].push({
                date,
                value: game[key],
              })
            }
          })

          // Calculate and add advanced stats

          // Calcular posesiones para este juego
          const possessions = (game.FGA || 0) + 0.44 * (game.FTA || 0) + (game.TOV || 0)

          // 1. Offensive Rating (OffRtg)
          const ptsGenerated =
            (game.PTS || 0) + (game.AST || 0) * (2 * (1 - (game.FG3_PCT || 0)) + 3 * (game.FG3_PCT || 0))
          const offRtg = possessions > 0 ? (ptsGenerated / possessions) * 100 : 0
          stats["OffRtg"].push({
            date,
            value: isFinite(offRtg) ? offRtg : 0,
          })

          // 2. True Shooting (TS)
          const ts =
            (game.FGA || 0) + 0.44 * (game.FTA || 0) > 0
              ? (game.PTS || 0) / (2 * ((game.FGA || 0) + 0.44 * (game.FTA || 0)))
              : 0
          stats["TS"].push({
            date,
            value: isFinite(ts) && ts >= 0 ? Math.min(ts, 1) : 0,
          })

          // 3. Effective Field Goal Percentage (eFG)
          const efg = (game.FGA || 0) > 0 ? ((game.FGM || 0) + 0.5 * (game.FG3M || 0)) / (game.FGA || 0) : 0
          stats["eFG"].push({
            date,
            value: isFinite(efg) && efg >= 0 ? Math.min(efg, 1) : 0,
          })

          // 4. Assist to Turnover Ratio (ASTtoTO)
          const astToTo = (game.TOV || 0) > 0 ? (game.AST || 0) / (game.TOV || 0) : 0
          stats["ASTtoTO"].push({
            date,
            value: isFinite(astToTo) ? Math.min(astToTo, 10) : 0, // Cap at 10 for visualization
          })

          // 5. Turnover Percentage (TOVpercent)
          const tovPercent = possessions > 0 ? ((game.TOV || 0) / possessions) * 100 : 0
          stats["TOVpercent"].push({
            date,
            value: isFinite(tovPercent) && tovPercent >= 0 ? tovPercent : 0,
          })

          // 6. Usage Rate (USG)
          const usg =
            (game.MIN || 0) > 0
              ? (((game.FGA || 0) + 0.44 * (game.FTA || 0) + (game.TOV || 0)) * 100) / ((game.MIN || 0) * 100)
              : 0
          stats["USG"].push({
            date,
            value: isFinite(usg) && usg >= 0 ? Math.min(usg, 1) : 0,
          })
        })

        // Apply moving average to smooth the data
        Object.keys(stats).forEach((key) => {
          if (stats[key].length > 0) {
            stats[key] = calculateMovingAverage(stats[key], 3)
          }
        })

        // Limit the number of data points if needed
        Object.keys(stats).forEach((key) => {
          if (stats[key].length > limit) {
            stats[key] = stats[key].slice(-limit)
          }
        })

        // Get player image and name from playersData
        const playerIdStr = player.player_id.toString()
        const playerImage = playersData[playerIdStr]?.image || "/placeholder.svg?height=400&width=300"
        // Use name from playersData if available, otherwise use database name
        const playerName = playersData[playerIdStr]?.name || player.player_name || "Unknown Player"

        return {
          playerId: player.player_id,
          playerName: playerName,
          image: playerImage,
          stats,
        }
      }),
    )

    // Return the data
    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      statType,
      players: playerEvolutionData,
      basicStats: BASIC_STATS,
      advancedStats: ADVANCED_STATS,
    })
  } catch (error) {
    console.error("Error fetching player evolution data:", error)
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

// Helper function to calculate moving average
function calculateMovingAverage(data: StatPoint[], windowSize: number): StatPoint[] {
  if (data.length < windowSize) {
    return data
  }

  const result: StatPoint[] = []

  for (let i = 0; i < data.length; i++) {
    let sum = 0
    let count = 0

    // Calculate average of the window
    for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += data[j].value
      count++
    }

    result.push({
      date: data[i].date,
      value: sum / count,
    })
  }

  return result
}
