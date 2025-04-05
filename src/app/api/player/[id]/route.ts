import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { playersData } from "@/app/players-data"

// Usar una única instancia de Prisma para evitar memory leaks en desarrollo
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const playerId = Number.parseInt(params.id)

    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 })
    }

    // Buscar el nombre del jugador en la tabla playersteams
    let playerName = null
    const playerInfo = await prisma.playersteams.findFirst({
      where: { player_id: playerId },
      select: { player_name: true },
    })

    if (playerInfo) {
      playerName = playerInfo.player_name
    }

    // Si aún no tenemos nombre, usar un valor por defecto
    if (!playerName) {
      playerName = `Player #${playerId}`
    }

    // Buscar estadísticas del jugador
    const stats = await prisma.stats.findMany({
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

    if (stats.length === 0) {
      return NextResponse.json({ message: "No stats found for this player" })
    }

    // Calcular totales
    const totalGames = stats.length
    const totalStats: Record<string, number> = {}
    stats.forEach((game) => {
      ;(Object.keys(game) as Array<keyof typeof game>).forEach((key) => {
        if (typeof game[key] === "number") {
          totalStats[key] = (totalStats[key] || 0) + (game[key] as number)
        }
      })
    })

    // Calcular promedios
    const playerAverages: Record<string, number> = {}
    Object.keys(totalStats).forEach((key) => {
      playerAverages[key] = totalStats[key] / totalGames
    })

    // Calcular estadísticas avanzadas
    const possessions = totalStats.FGA + 0.44 * totalStats.FTA + totalStats.TOV
    const ptsGenerated = totalStats.PTS + totalStats.AST * (2 * (1 - totalStats.FG3_PCT) + 3 * totalStats.FG3_PCT)
    const OffRtg = (possessions / ptsGenerated) * 100 || 0
    const TS = totalStats.PTS / (2 * (totalStats.FGA + 0.44 * totalStats.FTA)) || 0
    const eFG = (totalStats.FGM + 0.5 * totalStats.FG3M) / totalStats.FGA || 0
    const ASTtoTO = totalStats.AST / totalStats.TOV || 0
    const TOVpercent = (totalStats.TOV / possessions) * 100 || 0
    const USG = ((totalStats.FGA + 0.44 * totalStats.FTA + totalStats.TOV) * 100) / (totalStats.MIN * 100) || 0

    playerAverages.OffRtg = OffRtg
    playerAverages.TS = TS
    playerAverages.eFG = eFG
    playerAverages.ASTtoTO = ASTtoTO
    playerAverages.TOVpercent = TOVpercent
    playerAverages.USG = USG

    // Obtener la imagen del jugador desde el archivo players-data.ts
    const playerIdStr = playerId.toString()
    const playerImage = playersData[playerIdStr]?.image || "/placeholder.svg?height=400&width=300"

    return NextResponse.json({
      playerId,
      name: playerName,
      image: playerImage,
      averages: playerAverages,
    })
  } catch (error) {
    console.error("Error fetching player stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

