import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const playerId = Number.parseInt(params.id)

    if (isNaN(playerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 })
    }

    // Verificar si el jugador existe
    const playerExists = await prisma.players_teams.findFirst({
      where: { player_id: playerId.toString() },
    })

    if (!playerExists) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Aquí eventualmente se implementará la lógica real para calcular estadísticas avanzadas
    // Por ahora, devolvemos datos hardcodeados que varían ligeramente según el ID del jugador
    // para simular diferentes estadísticas para diferentes jugadores

    // Función para generar un valor aleatorio dentro de un rango basado en el ID del jugador
    const generateValue = (base: number, variance: number): number => {
      // Usar el ID del jugador como semilla para generar valores consistentes
      const seed = playerId % 100
      const offset = (seed / 100) * variance * 2 - variance
      return Number.parseFloat((base + offset).toFixed(1))
    }

    // Datos hardcodeados para estadísticas avanzadas del jugador
    const hardcodedAdvancedStats = {
      PER: generateValue(22.5, 5), // Player Efficiency Rating
      PLUS_MINUS: generateValue(5.8, 3), // Plus-Minus
      USG_PCT: generateValue(28.4, 4), // Usage Rate
      TS_PCT: generateValue(58.2, 6), // True Shooting Percentage
      AST_TO_RATIO: generateValue(2.34, 0.5), // Assist to Turnover Ratio
      WIN_SHARES: generateValue(8.6, 2), // Win Shares
      OFF_RTG: generateValue(112.7, 8), // Offensive Rating
      DEF_RTG: generateValue(104.3, 8), // Defensive Rating
      NET_RTG: generateValue(8.4, 4), // Net Rating
    }

    return NextResponse.json({
      playerId,
      averages: hardcodedAdvancedStats,
      provisional: true, // Indicador de que los datos son provisionales
    })
  } catch (error) {
    console.error("Error fetching player advanced stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

