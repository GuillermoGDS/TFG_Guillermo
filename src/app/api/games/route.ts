// Update the API to include scores and win/loss information
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getTeamMatchupPattern } from "@/app/team-config"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const teamPattern = getTeamMatchupPattern()

    // Get games with the team pattern
    const games = await prisma.stats.findMany({
      where: {
        MATCHUP: { contains: teamPattern },
      },
      select: {
        Game_ID: true,
        GAME_DATE: true,
        MATCHUP: true,
        WL: true,
      },
      distinct: ["Game_ID"],
      orderBy: {
        GAME_DATE: "asc",
      },
    })

    // For each game, calculate the total team scores
    const gamesWithScores = await Promise.all(
      games.map(async (game) => {
        // Get all player stats for this game
        const allPlayerStats = await prisma.stats.findMany({
          where: {
            Game_ID: game.Game_ID,
          },
          select: {
            MATCHUP: true,
            PTS: true,
          },
        })

        // Group player stats by MATCHUP and sum points
        const teamScores = new Map()

        allPlayerStats.forEach((stat) => {
          if (stat.MATCHUP && stat.PTS) {
            if (!teamScores.has(stat.MATCHUP)) {
              teamScores.set(stat.MATCHUP, 0)
            }
            teamScores.set(stat.MATCHUP, teamScores.get(stat.MATCHUP) + stat.PTS)
          }
        })

        // Get our team's score
        const ourTeamScore = teamScores.get(game.MATCHUP) || 0

        // Get opponent's score (first matchup that's not ours)
        let opponentMatchup = ""
        let opponentScore = 0

        for (const [matchup, score] of teamScores.entries()) {
          if (matchup !== game.MATCHUP) {
            opponentMatchup = matchup
            opponentScore = score
            break
          }
        }

        // Calculate correct WL based on team total scores
        let calculatedWL = "T" // Default to tie
        if (ourTeamScore > opponentScore) {
          calculatedWL = "W"
        } else if (ourTeamScore < opponentScore) {
          calculatedWL = "L"
        }

        // Extract team names from matchups for better display
        const ourMatchupParts = game.MATCHUP?.split(" ") || []
        const opponentMatchupParts = opponentMatchup?.split(" ") || []

        return {
          ...game,
          PTS: ourTeamScore,
          PTS_OPP: opponentScore,
          WL: calculatedWL,
          teamMatchup: game.MATCHUP,
          opponentMatchup: opponentMatchup,
        }
      }),
    )

    return NextResponse.json(gamesWithScores)
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
