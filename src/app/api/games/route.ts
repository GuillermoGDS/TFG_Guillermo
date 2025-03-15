// /app/api/games/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const games = await prisma.player_game_stats_v2.findMany({
      where: {
        MATCHUP: { contains: "LAL" }, // Busca "" en MATCHUP para cubrir "@LAL" y "LAL"
      },
      select: {
        Game_ID: true,
        GAME_DATE: true,
        MATCHUP: true,
      },
      distinct: ['Game_ID'], // Eliminar duplicados basados en Game_ID
      orderBy: {
        GAME_DATE: 'asc', // Ordenar por fecha de juego
      },
    });

    return NextResponse.json(games); // Devolver los partidos encontrados
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
