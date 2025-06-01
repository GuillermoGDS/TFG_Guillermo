import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"

// Usar una única instancia de Prisma para evitar memory leaks en desarrollo
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

// Importar el módulo de imágenes de jugadores de manera dinámica para evitar problemas de inicialización
async function getPlayerImage(playerId: number): Promise<{ image: string; name?: string }> {
  try {
    // Intentamos importar el módulo de manera dinámica
    const playersDataModule = await import("@/app/players-data")
    const playersData = playersDataModule.playersData

    // Si existe el jugador en el módulo, devolvemos su imagen
    if (playersData && playersData[playerId.toString()]) {
      return {
        image: playersData[playerId.toString()].image,
        name: playersData[playerId.toString()].name,
      }
    }
  } catch (error) {
    console.error("Error loading player image:", error)
  }

  // Si hay algún error o no se encuentra la imagen, devolvemos un placeholder
  return { image: `/placeholder.svg?height=400&width=300` }
}

interface PlayerStats {
  PTS: number
  FGM: number
  FGA: number
  FG3M: number
  FG3A: number
  FTM: number
  FTA: number
  REB: number
  OREB: number
  DREB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
  MIN: number
  [key: string]: number | Set<string>
  games: Set<string>
}

interface PlayerAverages {
  PTS: number
  FG_PCT: number
  FG3_PCT: number
  FT_PCT: number
  REB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  [key: string]: number
}

interface NormalizedStats {
  stat: string
  label: string
  value: number
  normalizedValue: number
  originalValue: number
}

interface PlayerData {
  playerId: number
  name: string
  image: string
  gamesPlayed: number
  stats: NormalizedStats[]
}

// Definir las estadísticas que queremos incluir en el gráfico de radar
const statsToInclude = [
  { key: "PTS", label: "Puntos" },
  { key: "REB", label: "Rebotes" },
  { key: "AST", label: "Asistencias" },
  { key: "STL", label: "Robos" },
  { key: "BLK", label: "Tapones" },
  { key: "FG_PCT", label: "% Tiros de campo" },
  { key: "FG3_PCT", label: "% Triples" },
  { key: "FT_PCT", label: "% Tiros libres" },
]

export async function GET(): Promise<NextResponse> {
  try {
    // Get all games in the specified season
    const gamesInSeason = await prisma.stats.findMany({
      where: { SEASON_ID },
      select: { Game_ID: true },
      distinct: ["Game_ID"],
    })

    const gameIdsInSeason = gamesInSeason.map((g) => g.Game_ID)

    // Get players who played for the team in this season
    const playerIds = await prisma.stats
      .findMany({
        where: {
          SEASON_ID,
          Game_ID: { in: gameIdsInSeason },
        },
        select: { Player_ID: true },
        distinct: ["Player_ID"],
      })
      .then((results) => results.map((r) => r.Player_ID))

    const players = await prisma.playersteams.findMany({
      where: {
        player_team: TEAM_NAME,
        player_id: { in: playerIds },
      },
      select: {
        player_id: true,
        player_name: true,
      },
    })

    if (players.length === 0) {
      return NextResponse.json(
        {
          error: "No players found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Get all stats for these players in this season
    const playersData: PlayerData[] = await Promise.all(
      players.map(async (player) => {
        const stats = await prisma.stats.findMany({
          where: {
            Player_ID: player.player_id,
            SEASON_ID: SEASON_ID,
          },
        })

        // Obtener la imagen y nombre del jugador usando la función auxiliar
        const playerImageData = await getPlayerImage(player.player_id)

        // Usar el nombre de playersData si está disponible, de lo contrario usar el de la base de datos
        const playerName = playerImageData.name || player.player_name || "Unknown Player"

        if (stats.length === 0) {
          // Return default structure with zeros for players with no stats
          return {
            playerId: player.player_id,
            name: playerName,
            image: playerImageData.image,
            gamesPlayed: 0,
            stats: statsToInclude.map((stat) => ({
              stat: stat.key,
              label: stat.label,
              value: 0,
              normalizedValue: 0,
              originalValue: 0,
            })),
          }
        }

        // Calculate totals across all games
        const totals: PlayerStats = {
          PTS: 0,
          FGM: 0,
          FGA: 0,
          FG3M: 0,
          FG3A: 0,
          FTM: 0,
          FTA: 0,
          REB: 0,
          OREB: 0,
          DREB: 0,
          AST: 0,
          STL: 0,
          BLK: 0,
          TOV: 0,
          PF: 0,
          PLUS_MINUS: 0,
          MIN: 0,
          games: new Set(), // Track unique games
        }

        stats.forEach((game) => {
          totals.PTS += game.PTS ?? 0
          totals.FGM += game.FGM ?? 0
          totals.FGA += game.FGA ?? 0
          totals.FG3M += game.FG3M ?? 0
          totals.FG3A += game.FG3A ?? 0
          totals.FTM += game.FTM ?? 0
          totals.FTA += game.FTA ?? 0
          totals.REB += game.REB ?? 0
          totals.OREB += game.OREB ?? 0
          totals.DREB += game.DREB ?? 0
          totals.AST += game.AST ?? 0
          totals.STL += game.STL ?? 0
          totals.BLK += game.BLK ?? 0
          totals.TOV += game.TOV ?? 0
          totals.PF += game.PF ?? 0
          totals.PLUS_MINUS += game.PLUS_MINUS ?? 0
          totals.MIN += game.MIN ?? 0

          totals.games.add(game.Game_ID)
        })

        const totalGames = totals.games.size
        if (totalGames === 0) {
          return {
            playerId: player.player_id,
            name: playerName,
            image: playerImageData.image,
            gamesPlayed: 0,
            stats: statsToInclude.map((stat) => ({
              stat: stat.key,
              label: stat.label,
              value: 0,
              normalizedValue: 0,
              originalValue: 0,
            })),
          }
        }

        // Calculate averages
        const playerAverages: PlayerAverages = {
          PTS: totals.PTS / totalGames,
          FG_PCT: totals.FGA > 0 ? totals.FGM / totals.FGA : 0,
          FG3_PCT: totals.FG3A > 0 ? totals.FG3M / totals.FG3A : 0,
          FT_PCT: totals.FTA > 0 ? totals.FTM / totals.FTA : 0,
          REB: totals.REB / totalGames,
          AST: totals.AST / totalGames,
          STL: totals.STL / totalGames,
          BLK: totals.BLK / totalGames,
          TOV: totals.TOV / totalGames,
        }

        // Create stats array for the radar chart
        const playerStats = statsToInclude.map((stat) => ({
          stat: stat.key,
          label: stat.label,
          value: playerAverages[stat.key],
          normalizedValue: 0, // Will be calculated after collecting all players' data
          originalValue: playerAverages[stat.key],
        }))

        return {
          playerId: player.player_id,
          name: playerName,
          image: playerImageData.image,
          gamesPlayed: totalGames,
          stats: playerStats,
        }
      }),
    )

    // Filter out players with no games played
    const validPlayersData = playersData.filter((player) => player.gamesPlayed > 0)

    if (validPlayersData.length === 0) {
      return NextResponse.json(
        {
          error: "No valid player stats found for this team in the specified season",
        },
        { status: 404 },
      )
    }

    // Normalize the stats values for better visualization in the radar chart
    // Find the maximum value for each stat across all players
    const maxValues: Record<string, number> = {}

    statsToInclude.forEach((stat) => {
      maxValues[stat.key] = Math.max(
        ...validPlayersData.map((player) => {
          const statObj = player.stats.find((s) => s.stat === stat.key)
          return statObj ? statObj.value : 0
        }),
      )
    })

    // Normalize the values (0-10 scale)
    validPlayersData.forEach((player) => {
      player.stats.forEach((stat) => {
        if (maxValues[stat.stat] > 0) {
          // Scale to 0-10 for better visualization
          stat.normalizedValue = (stat.value / maxValues[stat.stat]) * 10
        } else {
          stat.normalizedValue = 0
        }
      })
    })

    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      players: validPlayersData,
      statsCategories: statsToInclude,
    })
  } catch (error) {
    console.error("Error fetching player spider stats:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}
