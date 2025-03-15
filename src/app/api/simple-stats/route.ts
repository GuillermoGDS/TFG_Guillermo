// /app/api/team-stats/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const teamName = "Boston Celtics"; // Aquí pones el nombre del equipo que quieras

    // Obtener los IDs de los jugadores del equipo
    const players = await prisma.players_teams.findMany({
      where: { team_name: teamName },
      select: { player_id: true },
    });

    const playerIds = players.map(player => parseInt(player.player_id));

    // Obtener estadísticas de todos los jugadores del equipo
    const stats = await prisma.player_game_stats_v2.findMany({
      where: { Player_ID: { in: playerIds } },
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
    });

    if (stats.length === 0) {
      return NextResponse.json({ message: "No stats found for the team" });
    }

    // Sumar las estadísticas del equipo
    const teamTotals: Record<string, number> = {};
    const gameIds: Set<string> = new Set(); // Para llevar la cuenta de cuántos partidos ha jugado el equipo

    // Sumar las estadísticas de todos los jugadores para cada partido
    stats.forEach(game => {
      gameIds.add(game.Game_ID); // Añadir el ID de cada partido para contar cuántos partidos jugó el equipo

      (Object.keys(game) as Array<keyof typeof game>).forEach(key => {
        if (typeof game[key] === "number") {
          teamTotals[key] = (teamTotals[key] || 0) + (game[key] as number);
        }
      });
    });

    // Número total de partidos jugados por el equipo
    const totalGames = gameIds.size;

    // Calcular los promedios para el equipo
    const teamAverages: Record<string, number> = {};

    // Para los porcentajes, primero sumamos los intentos y luego calculamos el porcentaje final
    // Para FG%
    const totalFGM = teamTotals.FGM || 0;
    const totalFGA = teamTotals.FGA || 0;
    if (totalFGA > 0) {
      teamAverages.FG_PCT = (totalFGM / totalFGA) * 100;
    } else {
      teamAverages.FG_PCT = 0; // Si no hay intentos, el porcentaje es 0
    }

    // Para 3P%
    const totalFG3M = teamTotals.FG3M || 0;
    const totalFG3A = teamTotals.FG3A || 0;
    if (totalFG3A > 0) {
      teamAverages.FG3_PCT = (totalFG3M / totalFG3A) * 100;
    } else {
      teamAverages.FG3_PCT = 0;
    }

    // Para FT%
    const totalFTM = teamTotals.FTM || 0;
    const totalFTA = teamTotals.FTA || 0;
    if (totalFTA > 0) {
      teamAverages.FT_PCT = (totalFTM / totalFTA) * 100;
    } else {
      teamAverages.FT_PCT = 0;
    }

    // Para las demás estadísticas, simplemente calculamos el promedio de todos los valores
    Object.keys(teamTotals).forEach(key => {
      if (!key.includes("PCT")) {
        teamAverages[key] = teamTotals[key] / totalGames;
      }
    });

    // Devolver las estadísticas promedio del equipo
    return NextResponse.json({ team: teamName, averages: teamAverages });
  } catch (error) {
    console.error("Error fetching team stats:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
