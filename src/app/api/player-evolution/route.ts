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

// Define basic and advanced stats
const BASIC_STATS = ["PTS", "AST", "REB", "STL", "BLK", "TOV", "FG_PCT", "FG3_PCT", "FT_PCT", "PLUS_MINUS", "MIN"]
const ADVANCED_STATS = ["PER", "TS_PCT", "EFG_PCT", "USG_PCT", "PIE", "NETRTG", "AST_TO", "REB_PG", "STL_BLK"]

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

          // 1. Player Efficiency Rating (PER) - simplified calculation
          const per =
            (((game.PTS || 0) +
              (game.REB || 0) * 1.2 +
              (game.AST || 0) * 1.5 +
              (game.STL || 0) * 2 +
              (game.BLK || 0) * 2 -
              (game.TOV || 0) * 1.5 -
              ((game.FGA || 0) - (game.FGM || 0)) * 0.5 -
              ((game.FTA || 0) - (game.FTM || 0)) * 0.5) /
              Math.max(game.MIN || 1, 1)) *
            10

          stats["PER"].push({
            date,
            value: isFinite(per) ? per : 0,
          })

          // 2. True Shooting Percentage (TS%)
          const tsPct = (game.PTS || 0) / (2 * ((game.FGA || 0) + 0.44 * (game.FTA || 0)))
          stats["TS_PCT"].push({
            date,
            value: isFinite(tsPct) && tsPct >= 0 ? Math.min(tsPct, 1) : 0,
          })

          // 3. Effective Field Goal Percentage (eFG%)
          const efgPct = ((game.FGM || 0) + 0.5 * (game.FG3M || 0)) / Math.max(game.FGA || 0, 1)
          stats["EFG_PCT"].push({
            date,
            value: isFinite(efgPct) && efgPct >= 0 ? Math.min(efgPct, 1) : 0,
          })

          // 4. Usage Rate (USG%) - simplified
          const usgPct = ((game.FGA || 0) + 0.44 * (game.FTA || 0) + (game.TOV || 0)) / Math.max(game.MIN || 1, 1) / 5
          stats["USG_PCT"].push({
            date,
            value: isFinite(usgPct) && usgPct >= 0 ? Math.min(usgPct, 1) : 0,
          })

          // 5. Player Impact Estimate (PIE) - simplified
          const pie =
            ((game.PTS || 0) +
              (game.REB || 0) +
              (game.AST || 0) +
              (game.STL || 0) +
              (game.BLK || 0) -
              ((game.FGA || 0) - (game.FGM || 0)) -
              ((game.FTA || 0) - (game.FTM || 0)) -
              (game.TOV || 0)) /
            100

          stats["PIE"].push({
            date,
            value: isFinite(pie) ? Math.min(Math.max(pie, 0), 1) : 0,
          })

          // 6. Net Rating (using PLUS_MINUS as a proxy)
          stats["NETRTG"].push({
            date,
            value: game.PLUS_MINUS || 0,
          })

          // 7. Assist to Turnover Ratio
          const astTo = (game.AST || 0) / Math.max(game.TOV || 1, 1)
          stats["AST_TO"].push({
            date,
            value: isFinite(astTo) ? Math.min(astTo, 10) : 0, // Cap at 10 for visualization
          })

          // 8. Rebounds per Game (normalized by minutes)
          const rebPerGame = ((game.REB || 0) / Math.max(game.MIN || 1, 1)) * 36 // Normalize to 36 minutes
          stats["REB_PG"].push({
            date,
            value: isFinite(rebPerGame) ? rebPerGame : 0,
          })

          // 9. Steals + Blocks (defensive activity)
          const stlBlk = (game.STL || 0) + (game.BLK || 0)
          stats["STL_BLK"].push({
            date,
            value: stlBlk,
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
