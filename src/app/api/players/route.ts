import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { playersData } from "@/app/players-data"
import { TEAM_NAME } from "@/app/team-config"

// Usar una única instancia de Prisma para evitar memory leaks en desarrollo
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

export async function GET() {
  try {
    // Buscar jugadores en el equipo configurado
    const players = await prisma.playersteams.findMany({
      where: {
        player_team: { contains: TEAM_NAME },
      },
      select: {
        player_id: true,
        player_name: true, // Añadimos el nombre del jugador si está disponible
      },
      orderBy: {
        player_id: "asc",
      },
    })

    // Eliminar duplicados manualmente (MySQL no soporta distinct en Prisma)
    const uniquePlayers = Array.from(new Map(players.map((p) => [p.player_id, p])).values())

    // Combinar con las imágenes y nombres de players-data
    const playersWithImages = uniquePlayers.map((player) => {
      return {
        player_id: player.player_id,
        player_name: player.player_name || playersData[player.player_id]?.name || `Player: ${player.player_id}`,
        image: playersData[player.player_id]?.image || "/placeholder.svg?height=400&width=300",
      }
    })

    return NextResponse.json(playersWithImages)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
