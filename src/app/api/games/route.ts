import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getTeamMatchupPattern } from "@/app/team-config"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const teamPattern = getTeamMatchupPattern()

    const games = await prisma.stats.findMany({
      where: {
        MATCHUP: { contains: teamPattern }, // Busca el patrón del equipo en MATCHUP
      },
      select: {
        Game_ID: true,
        GAME_DATE: true,
        MATCHUP: true,
      },
      distinct: ["Game_ID"], // Eliminar duplicados basados en Game_ID
      orderBy: {
        GAME_DATE: "asc", // Ordenar por fecha de juego
      },
    })

    return NextResponse.json(games) // Devolver los partidos encontrados
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
