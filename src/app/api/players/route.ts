// /app/api/games/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const players = await prisma.players_teams.findMany({
      where: {
        team_name: { contains: "Golden State Warriors" }, // Busca "Los Angeles Lakers"
      },
      select: {
        player_name: true,
        player_id: true,
        
      },
      distinct: ['player_id'], // Eliminar duplicados basados en player_id
      orderBy: {
        player_id: 'asc', // player_id
      },
    });

    return NextResponse.json(players); // Devolver los jugadores encontrados
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
