import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { playersData } from "@/app/players-data"

// Use a single Prisma instance to avoid memory leaks in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") globalForPrisma.prisma = prisma

// Define types for better type safety
type PlayerStats = {
  Game_ID: string // Cambiar de number a string
  MIN: number | null
  FGM: number | null
  FGA: number | null
  FG_PCT: number | null
  FG3M: number | null
  FG3A: number | null
  FG3_PCT: number | null
  FTM: number | null
  FTA: number | null
  FT_PCT: number | null
  OREB: number | null
  DREB: number | null
  REB: number | null
  AST: number | null
  STL: number | null
  BLK: number | null
  TOV: number | null
  PF: number | null
  PTS: number | null
  PLUS_MINUS: number | null
}

type PlayerAverages = {
  [key: string]: number
}

// ✅ Cambio principal: params ahora es Promise<{ id: string }>
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // ✅ Await params antes de acceder a sus propiedades
    const { id } = await params
    const playerId = Number.parseInt(id)

    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 })
    }

    // Get player name from database
    const playerInfo = await getPlayerName(playerId)

    // Get player stats
    const stats = await getPlayerStats(playerId)

    if (stats.length === 0) {
      return NextResponse.json({
        playerId,
        name: playerInfo.name,
        image: playerInfo.image,
        message: "No stats found for this player",
      })
    }

    // Calculate statistics
    const totalGames = stats.length
    const totalStats = calculateTotalStats(stats)
    const playerAverages = calculateAverages(totalStats, totalGames)

    // Add advanced statistics
    const advancedStats = calculateAdvancedStats(totalStats)
    const finalAverages = { ...playerAverages, ...advancedStats }

    return NextResponse.json({
      playerId,
      name: playerInfo.name,
      image: playerInfo.image,
      averages: finalAverages,
    })
  } catch (error) {
    console.error("Error fetching player stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Helper functions for better organization
async function getPlayerName(playerId: number) {
  // Try to get player name from database
  const playerInfo = await prisma.playersteams.findFirst({
    where: { player_id: playerId },
    select: { player_name: true },
  })

  const playerIdStr = playerId.toString()
  let name = playerInfo?.player_name || null

  // Fallback to playersData if not found in database
  if (!name) {
    name = playersData[playerIdStr]?.name || `Player #${playerId}`
  }

  // Get player image
  const image = playersData[playerIdStr]?.image || "/placeholder.svg?height=400&width=300"

  return { name, image }
}

async function getPlayerStats(playerId: number) {
  return prisma.stats.findMany({
    where: { Player_ID: playerId },
    select: {
      Game_ID: true,
      MIN: true,
      FGM: true,
      FGA: true,
      FG_PCT: true,
      FG3M: true,
      FG3A: true,
      FG3_PCT: true,
      FTM: true,
      FTA: true,
      FT_PCT: true,
      OREB: true,
      DREB: true,
      REB: true,
      AST: true,
      STL: true,
      BLK: true,
      TOV: true,
      PF: true,
      PTS: true,
      PLUS_MINUS: true,
    },
  })
}

function calculateTotalStats(stats: PlayerStats[]) {
  const totalStats: Record<string, number> = {}

  stats.forEach((game) => {
    Object.entries(game).forEach(([key, value]) => {
      if (typeof value === "number" && value !== null) {
        totalStats[key] = (totalStats[key] || 0) + value
      }
    })
  })

  return totalStats
}

function calculateAverages(totalStats: Record<string, number>, totalGames: number) {
  const averages: PlayerAverages = {}

  // Excluir los porcentajes de tiro, ya que los calcularemos correctamente en calculateAdvancedStats
  const percentageFields = ["FG_PCT", "FG3_PCT", "FT_PCT"]

  Object.entries(totalStats).forEach(([key, value]) => {
    // Solo calcular promedios para campos que no son porcentajes
    if (!percentageFields.includes(key)) {
      averages[key] = value / totalGames
    }
  })

  return averages
}

function calculateAdvancedStats(totalStats: Record<string, number>) {
  // Avoid division by zero
  const safeDiv = (a: number, b: number) => (b === 0 ? 0 : a / b)

  // Calculate possessions (an estimate)
  const possessions = totalStats.FGA + 0.44 * totalStats.FTA - totalStats.OREB + totalStats.TOV

  // Calculate correct shooting percentages
  const FG_PCT = safeDiv(totalStats.FGM, totalStats.FGA)
  const FG3_PCT = safeDiv(totalStats.FG3M, totalStats.FG3A)
  const FT_PCT = safeDiv(totalStats.FTM, totalStats.FTA)

  // Calculate points generated (points + potential points from assists)
  const ptsPerAssist = 2 * (1 - FG3_PCT) + 3 * FG3_PCT
  const ptsGenerated = totalStats.PTS + totalStats.AST * ptsPerAssist

  // Advanced statistics
  return {
    // Correct shooting percentages
    FG_PCT,
    FG3_PCT,
    FT_PCT,

    // Offensive Rating (points per 100 possessions)
    OffRtg: safeDiv(ptsGenerated * 100, possessions),

    // True Shooting Percentage
    TS: safeDiv(totalStats.PTS, 2 * (totalStats.FGA + 0.44 * totalStats.FTA)),

    // Effective Field Goal Percentage
    eFG: safeDiv(totalStats.FGM + 0.5 * totalStats.FG3M, totalStats.FGA),

    // Assist to Turnover Ratio
    ASTtoTO: safeDiv(totalStats.AST, totalStats.TOV),

    // Turnover Percentage
    TOVpercent: safeDiv(totalStats.TOV * 100, possessions),

    // Usage Rate
    USG: safeDiv((totalStats.FGA + 0.44 * totalStats.FTA + totalStats.TOV) * 100, totalStats.MIN * 100),
  }
}
