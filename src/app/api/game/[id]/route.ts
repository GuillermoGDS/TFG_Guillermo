import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, TEAM_ABBR, SEASON_ID } from "@/app/team-config"
import { playersData } from "@/app/players-data"

// PrismaClient singleton implementation
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

interface TeamStats {
  PTS: number
  FGM: number
  FGA: number
  FG_PCT: number
  FG3M: number
  FG3A: number
  FG3_PCT: number
  FTM: number
  FTA: number
  FT_PCT: number
  OREB: number
  DREB: number
  REB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
}

interface AdvancedTeamStats {
  OffRtg: number
  DefRtg: number
  NetRtg: number
  TS: number
  eFG: number
  ASTtoTO: number
  TOVpercent: number
  pace: number
  possessions: number
  FTR: number
}

interface PlayerStats {
  player_id: number
  player_name: string
  player_image?: string
  MIN: number
  PTS: number
  FGM: number
  FGA: number
  FG_PCT: number
  FG3M: number
  FG3A: number
  FG3_PCT: number
  FTM: number
  FTA: number
  FT_PCT: number
  OREB: number
  DREB: number
  REB: number
  AST: number
  STL: number
  BLK: number
  TOV: number
  PF: number
  PLUS_MINUS: number
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    // Verificar que el partido existe
    const gameExists = await prisma.stats.findFirst({
      where: {
        Game_ID: gameId,
        SEASON_ID,
      },
    })

    if (!gameExists) {
      return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 })
    }

    // Obtener información del partido (matchup, fecha)
    const gameInfo = await prisma.stats.findFirst({
      where: {
        Game_ID: gameId,
        SEASON_ID,
      },
      select: {
        MATCHUP: true,
        GAME_DATE: true,
        WL: true,
      },
    })

    // Extraer equipos del matchup
    const matchup = gameInfo?.MATCHUP || ""
    const parts = matchup.split(" ")
    const matchupTeamAbbr = parts[0]
    const opponentAbbr = parts[2]
    const isAway = matchup.includes("@")

    // Obtener jugadores del equipo seleccionado
    const teamPlayers = await prisma.playersteams.findMany({
      where: {
        player_team: TEAM_NAME,
      },
      select: {
        player_id: true,
        player_name: true,
      },
    })

    const teamPlayerIds = teamPlayers.map((player) => player.player_id)

    // Obtener estadísticas de los jugadores del equipo para este partido
    const teamPlayerStats = await prisma.stats.findMany({
      where: {
        Game_ID: gameId,
        SEASON_ID,
        Player_ID: {
          in: teamPlayerIds,
        },
      },
    })

    // Obtener estadísticas de todos los jugadores para este partido
    const allPlayerStats = await prisma.stats.findMany({
      where: {
        Game_ID: gameId,
        SEASON_ID,
      },
    })

    // Separar estadísticas por equipo
    const teamStats = allPlayerStats.filter((stat) => {
      return teamPlayerIds.includes(stat.Player_ID)
    })

    const opponentStats = allPlayerStats.filter((stat) => {
      return !teamPlayerIds.includes(stat.Player_ID)
    })

    // Calcular estadísticas simples del equipo
    const teamSimpleStats = calculateTeamSimpleStats(teamStats)
    const opponentSimpleStats = calculateTeamSimpleStats(opponentStats)

    // Calcular estadísticas avanzadas
    const teamAdvancedStats = calculateTeamAdvancedStats(teamStats, opponentStats)
    const opponentAdvancedStats = calculateTeamAdvancedStats(opponentStats, teamStats)

    // Formatear estadísticas de jugadores
    const formattedPlayerStats = formatPlayerStats(teamPlayerStats, teamPlayers)

    // Determinar el resultado del partido
    const teamScore = teamSimpleStats.PTS
    const opponentScore = opponentSimpleStats.PTS
    const result = teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "T"

    // Determinar el nombre del equipo oponente
    // Si el equipo en el matchup no es nuestro equipo, entonces ese es el oponente
    // Si el equipo en el matchup es nuestro equipo, entonces el oponente es el otro equipo
    const isOurTeamInMatchup = matchupTeamAbbr === TEAM_ABBR
    const actualOpponentAbbr = isOurTeamInMatchup ? opponentAbbr : matchupTeamAbbr

    return NextResponse.json({
      gameId,
      gameDate: gameInfo?.GAME_DATE,
      matchup,
      isAway,
      result,
      teamAbbr: TEAM_ABBR,
      opponentAbbr: actualOpponentAbbr,
      teamName: TEAM_NAME,
      teamAbbreviation: TEAM_ABBR,
      teamScore,
      opponentScore,
      teamSimpleStats,
      opponentSimpleStats,
      teamAdvancedStats,
      opponentAdvancedStats,
      playerStats: formattedPlayerStats,
    })
  } catch (error) {
    console.error("Error fetching game details:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// Función para calcular estadísticas simples del equipo
function calculateTeamSimpleStats(playerStats: any[]): TeamStats {
  const initialStats = {
    PTS: 0,
    FGM: 0,
    FGA: 0,
    FG_PCT: 0,
    FG3M: 0,
    FG3A: 0,
    FG3_PCT: 0,
    FTM: 0,
    FTA: 0,
    FT_PCT: 0,
    OREB: 0,
    DREB: 0,
    REB: 0,
    AST: 0,
    STL: 0,
    BLK: 0,
    TOV: 0,
    PF: 0,
    PLUS_MINUS: 0,
  }

  if (playerStats.length === 0) {
    return initialStats
  }

  // Sumar todas las estadísticas
  const totals = playerStats.reduce((acc, player) => {
    return {
      PTS: acc.PTS + (player.PTS || 0),
      FGM: acc.FGM + (player.FGM || 0),
      FGA: acc.FGA + (player.FGA || 0),
      FG3M: acc.FG3M + (player.FG3M || 0),
      FG3A: acc.FG3A + (player.FG3A || 0),
      FTM: acc.FTM + (player.FTM || 0),
      FTA: acc.FTA + (player.FTA || 0),
      OREB: acc.OREB + (player.OREB || 0),
      DREB: acc.DREB + (player.DREB || 0),
      REB: acc.REB + (player.REB || 0),
      AST: acc.AST + (player.AST || 0),
      STL: acc.STL + (player.STL || 0),
      BLK: acc.BLK + (player.BLK || 0),
      TOV: acc.TOV + (player.TOV || 0),
      PF: acc.PF + (player.PF || 0),
      PLUS_MINUS: acc.PLUS_MINUS + (player.PLUS_MINUS || 0),
    }
  }, initialStats)

  // Calcular porcentajes
  return {
    ...totals,
    FG_PCT: totals.FGA > 0 ? Number((totals.FGM / totals.FGA).toFixed(3)) : 0,
    FG3_PCT: totals.FG3A > 0 ? Number((totals.FG3M / totals.FG3A).toFixed(3)) : 0,
    FT_PCT: totals.FTA > 0 ? Number((totals.FTM / totals.FTA).toFixed(3)) : 0,
  }
}

function calculateTeamAdvancedStats(teamStats: any[], opponentStats: any[]): AdvancedTeamStats {
  // Calcular posesiones (estimación)
  const teamPossessions = teamStats.reduce((acc, player) => {
    return acc + (player.FGA || 0) + 0.44 * (player.FTA || 0) - (player.OREB || 0) + (player.TOV || 0)
  }, 0)

  const opponentPossessions = opponentStats.reduce((acc, player) => {
    return acc + (player.FGA || 0) + 0.44 * (player.FTA || 0) - (player.OREB || 0) + (player.TOV || 0)
  }, 0)

  // Promedio de posesiones
  const possessions = (teamPossessions + opponentPossessions) / 2

  // Calcular puntos totales
  const teamPoints = teamStats.reduce((acc, player) => acc + (player.PTS || 0), 0)
  const opponentPoints = opponentStats.reduce((acc, player) => acc + (player.PTS || 0), 0)

  // Calcular minutos totales (estimación: 240 minutos por equipo en un partido)
  const totalMinutes = 240

  // Offensive Rating: puntos por 100 posesiones
  const offRtg = possessions > 0 ? (teamPoints / possessions) * 100 : 0

  // Defensive Rating: puntos permitidos por 100 posesiones
  const defRtg = possessions > 0 ? (opponentPoints / possessions) * 100 : 0

  // Net Rating
  const netRtg = offRtg - defRtg

  // Calcular totales para estadísticas avanzadas
  const totals = teamStats.reduce(
    (acc, player) => {
      return {
        FGM: acc.FGM + (player.FGM || 0),
        FGA: acc.FGA + (player.FGA || 0),
        FG3M: acc.FG3M + (player.FG3M || 0),
        FTM: acc.FTM + (player.FTM || 0),
        FTA: acc.FTA + (player.FTA || 0),
        AST: acc.AST + (player.AST || 0),
        TOV: acc.TOV + (player.TOV || 0),
        PTS: acc.PTS + (player.PTS || 0),
      }
    },
    { FGM: 0, FGA: 0, FG3M: 0, FTM: 0, FTA: 0, AST: 0, TOV: 0, PTS: 0 },
  )

  // True Shooting Percentage
  const ts = totals.FGA > 0 || totals.FTA > 0 ? totals.PTS / (2 * (totals.FGA + 0.44 * totals.FTA)) : 0

  // Effective Field Goal Percentage
  const eFG = totals.FGA > 0 ? (totals.FGM + 0.5 * totals.FG3M) / totals.FGA : 0

  // Assist to Turnover Ratio
  const astToTO = totals.TOV > 0 ? totals.AST / totals.TOV : 0

  // Turnover Percentage
  const tovPercent = possessions > 0 ? (totals.TOV / possessions) * 100 : 0

  // Pace: posesiones por 48 minutos
  const pace = totalMinutes > 0 ? (possessions * 48) / totalMinutes : 0

  // Calcular Free Throw Rate (FTR)
  const ftr = totals.FGA > 0 ? totals.FTA / totals.FGA : 0

  return {
    OffRtg: Number(offRtg.toFixed(1)),
    DefRtg: Number(defRtg.toFixed(1)),
    NetRtg: Number(netRtg.toFixed(1)),
    TS: Number((ts * 100).toFixed(1)),
    eFG: Number((eFG * 100).toFixed(1)),
    ASTtoTO: Number(astToTO.toFixed(2)),
    TOVpercent: Number(tovPercent.toFixed(1)),
    pace: Number(pace.toFixed(1)),
    possessions: Number(possessions.toFixed(1)),
    FTR: Number(ftr.toFixed(3)),
  }
}

// Función para formatear estadísticas de jugadores
function formatPlayerStats(playerStats: any[], teamPlayers: any[]): PlayerStats[] {
  // Crear un mapa de ID de jugador a nombre
  const playerNameMap = teamPlayers.reduce(
    (map, player) => {
      map[player.player_id] = player.player_name
      return map
    },
    {} as Record<number, string>,
  )

  return playerStats
    .map((stat) => {
      const playerId = stat.Player_ID.toString()
      const playerInfo = playersData[playerId]

      return {
        player_id: stat.Player_ID,
        player_name: playerInfo?.name || playerNameMap[stat.Player_ID] || `Jugador ${stat.Player_ID}`,
        player_image: playerInfo?.image || undefined,
        MIN: stat.MIN || 0,
        PTS: stat.PTS || 0,
        FGM: stat.FGM || 0,
        FGA: stat.FGA || 0,
        FG_PCT: stat.FGA > 0 ? Number((stat.FGM / stat.FGA).toFixed(3)) : 0,
        FG3M: stat.FG3M || 0,
        FG3A: stat.FG3A || 0,
        FG3_PCT: stat.FG3A > 0 ? Number((stat.FG3M / stat.FG3A).toFixed(3)) : 0,
        FTM: stat.FTM || 0,
        FTA: stat.FTA || 0,
        FT_PCT: stat.FTA > 0 ? Number((stat.FTM / stat.FTA).toFixed(3)) : 0,
        OREB: stat.OREB || 0,
        DREB: stat.DREB || 0,
        REB: stat.REB || 0,
        AST: stat.AST || 0,
        STL: stat.STL || 0,
        BLK: stat.BLK || 0,
        TOV: stat.TOV || 0,
        PF: stat.PF || 0,
        PLUS_MINUS: stat.PLUS_MINUS || 0,
      }
    })
    .sort((a, b) => b.PTS - a.PTS) // Ordenar por puntos (mayor a menor)
}
