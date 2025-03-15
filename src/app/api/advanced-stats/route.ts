import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Añade cabeceras para evitar el caché
export async function GET() {
  try {
    // Aquí eventualmente se implementará la lógica real para calcular estadísticas avanzadas
    // Por ahora, devolvemos datos hardcodeados

    // Datos hardcodeados para estadísticas avanzadas del equipo
    const hardcodedAdvancedStats = {
      PER: 11.5, // Player Efficiency Rating
      PLUS_MINUS: 5.8, // Plus-Minus
      USG_PCT: 28.4, // Usage Rate
      TS_PCT: 58.2, // True Shooting Percentage
      AST_TO_RATIO: 2.34, // Assist to Turnover Ratio
      WIN_SHARES: 8.6, // Win Shares
      OFF_RTG: 112.7, // Offensive Rating
      DEF_RTG: 104.3, // Defensive Rating
      NET_RTG: 8.4, // Net Rating
    }

    return NextResponse.json(
      {
        averages: hardcodedAdvancedStats,
        provisional: true, // Indicador de que los datos son provisionales
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching advanced stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}



