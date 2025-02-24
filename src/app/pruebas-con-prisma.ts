import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getStatsForTeam(teamName: string) {
  try {
    // Obtener los player_id de los jugadores del equipo
    const playerIds = await prisma.players_teams.findMany({
      where: {
        team_name: teamName
      },
      select: {
        player_id: true // Seleccionar solo el player_id
      }
    });

    // Si no se encuentran jugadores para ese equipo, retornar un mensaje
    if (playerIds.length === 0) {
      console.log(`No se encontraron jugadores para el equipo ${teamName}`);
      return;
    }

    // Convertir player_id a números
    const playerIdsAsNumbers = playerIds.map(player => Number(player.player_id));

    // Obtener las estadísticas de los jugadores de ese equipo
    const stats = await prisma.player_game_stats_v2.findMany({
      where: {
        Player_ID: {
          in: playerIdsAsNumbers // Filtrar por los Player_ID obtenidos
        }
      }
    });

    console.log(`Estadísticas de los jugadores del equipo ${teamName}:`);
    console.log(stats);

    return stats;

  } catch (error) {
    console.error('Error al obtener las estadísticas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Llamar a la función para obtener las estadísticas de un equipo
getStatsForTeam('Lakers') // Reemplaza 'Lakers' por el nombre del equipo que te interese
  .then(stats => {
    if (stats) {
      console.log(stats);
    }
  })
  .catch(err => console.error(err));
