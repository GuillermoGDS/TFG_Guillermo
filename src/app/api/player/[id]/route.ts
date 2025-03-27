import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// Función para verificar la existencia de la imagen en diferentes formatos
const getPlayerImage = (playerId: number): string | null => {
  const imageFormats = ["png", "webp", "avif", "jpg"]
  const publicDir = path.join(process.cwd(), "public", "images", "players")

  for (const format of imageFormats) {
    const imagePath = path.join(publicDir, `${playerId}.${format}`)
    if (fs.existsSync(imagePath)) {
      return `/images/players/${playerId}.${format}`
    }
  }

  // Si no existe ninguna imagen, retornar un placeholder
  return "/images/players/placeholder.png"
}

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

    // Calcular promedios
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

    // Obtener la imagen del jugador en función de los formatos disponibles
    const playerImage = getPlayerImage(playerId)

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
