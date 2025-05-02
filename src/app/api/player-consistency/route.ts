import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { TEAM_NAME, SEASON_ID } from "@/app/team-config"
import { playersData } from "@/app/players-data"

// Use a single Prisma instance to avoid memory leaks in development
const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV === "development") global.prisma = prisma

// Actualizar la interfaz PlayerGameStats para incluir estadísticas avanzadas
interface PlayerGameStats {
  Game_ID: string
  GAME_DATE: string
  PTS: number
  AST: number
  REB: number
  FG_PCT: number
  FT_PCT: number
  FG3_PCT: number
  PLUS_MINUS: number
  // Estadísticas avanzadas
  OffRtg: number
  TS: number
  eFG: number
  ASTtoTO: number
  TOVpercent: number
  USG: number
}

// Actualizar la interfaz PlayerConsistencyData para incluir estadísticas avanzadas
interface PlayerConsistencyData {
  playerId: number
  name: string
  image: string
  gamesPlayed: number
  averages: {
    PTS: number
    AST: number
    REB: number
    FG_PCT: number
    FT_PCT: number
    FG3_PCT: number
    PLUS_MINUS: number
    // Estadísticas avanzadas
    OffRtg: number
    TS: number
    eFG: number
    ASTtoTO: number
    TOVpercent: number
    USG: number
  }
  standardDeviations: {
    PTS: number
    AST: number
    REB: number
    FG_PCT: number
    FT_PCT: number
    FG3_PCT: number
    PLUS_MINUS: number
    // Estadísticas avanzadas
    OffRtg: number
    TS: number
    eFG: number
    ASTtoTO: number
    TOVpercent: number
    USG: number
  }
  coefficientOfVariation: {
    PTS: number
    AST: number
    REB: number
    FG_PCT: number
    FT_PCT: number
    FG3_PCT: number
    PLUS_MINUS: number
    // Estadísticas avanzadas
    OffRtg: number
    TS: number
    eFG: number
    ASTtoTO: number
    TOVpercent: number
    USG: number
  }
  gameData: PlayerGameStats[]
}

// Modificar la función GET para calcular estadísticas avanzadas
export async function GET(req: Request): Promise<NextResponse> {
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

    // Calculate consistency metrics for each player
    const playersConsistencyData: PlayerConsistencyData[] = await Promise.all(
      players.map(async (player) => {
        const stats = await prisma.stats.findMany({
          where: {
            Player_ID: player.player_id,
            SEASON_ID: SEASON_ID,
          },
          orderBy: {
            GAME_DATE: "asc",
          },
        })

        // Get player image and name from playersData
        const playerIdStr = player.player_id.toString()
        const playerImage = playersData[playerIdStr]?.image || "/placeholder.svg?height=400&width=300"
        // Use name from playersData if available, otherwise use database name
        const playerName = playersData[playerIdStr]?.name || player.player_name || "Unknown Player"

        if (stats.length === 0) {
          // Return default structure with zeros for players with no stats
          return createEmptyPlayerData(player.player_id, playerName, playerImage)
        }

        // Process game stats
        const gameStats: PlayerGameStats[] = stats.map((game) => {
          // Calcular estadísticas avanzadas
          const fga = game.FGA || 0
          const fgm = game.FGM || 0
          const fg3a = game.FG3A || 0
          const fg3m = game.FG3M || 0
          const fta = game.FTA || 0
          const ftm = game.FTM || 0
          const pts = game.PTS || 0
          const ast = game.AST || 0
          const tov = game.TOV || 0
          const min = game.MIN || 0

          // Effective Field Goal Percentage
          const efgPct = fga > 0 ? (fgm + 0.5 * fg3m) / fga : 0

          // True Shooting Percentage
          const tsPct = fga + 0.44 * fta > 0 ? pts / (2 * (fga + 0.44 * fta)) : 0

          // Assist to Turnover Ratio
          const astToRatio = tov > 0 ? ast / tov : ast

          // Estimación simplificada de posesiones
          const possessions = fga + 0.44 * fta + tov - (game.OREB || 0)

          // Turnover Percentage
          const tovPct = possessions > 0 ? tov / possessions : 0

          // Usage Rate (simplificado)
          const usgPct = min > 0 ? ((fga + 0.44 * fta + tov) * 100) / (min * 5) : 0

          // Offensive Rating (simplificado)
          const offRtg = possessions > 0 ? (pts / possessions) * 100 : 0

          // Defensive Rating (muy simplificado, usando PLUS_MINUS como aproximación)
          const plusMinus = game.PLUS_MINUS || 0
          const defRtg = 100 - (plusMinus / (min || 1)) * 10

          // Net Rating
          const netRtg = offRtg - defRtg

          return {
            Game_ID: game.Game_ID,
            GAME_DATE: game.GAME_DATE,
            PTS: game.PTS || 0,
            AST: game.AST || 0,
            REB: game.REB || 0,
            FG_PCT: game.FGA > 0 ? game.FGM / game.FGA : 0,
            FT_PCT: game.FTA > 0 ? game.FTM / game.FTA : 0,
            FG3_PCT: game.FG3A > 0 ? game.FG3M / game.FG3A : 0,
            PLUS_MINUS: game.PLUS_MINUS || 0,
            // Estadísticas avanzadas
            OffRtg: offRtg,
            TS: tsPct,
            eFG: efgPct,
            ASTtoTO: astToRatio,
            TOVpercent: tovPct * 100, // Convertir a porcentaje
            USG: usgPct,
          }
        })

        // Ahora, para calcular los promedios correctamente, necesitamos sumar todos los tiros y dividir al final
        // para los porcentajes de tiro
        const totalFGM = stats.reduce((sum, game) => sum + (game.FGM || 0), 0)
        const totalFGA = stats.reduce((sum, game) => sum + (game.FGA || 0), 0)
        const totalFG3M = stats.reduce((sum, game) => sum + (game.FG3M || 0), 0)
        const totalFG3A = stats.reduce((sum, game) => sum + (game.FG3A || 0), 0)
        const totalFTM = stats.reduce((sum, game) => sum + (game.FTM || 0), 0)
        const totalFTA = stats.reduce((sum, game) => sum + (game.FTA || 0), 0)

        // Calculate averages
        const averages = {
          PTS: calculateAverage(gameStats.map((g) => g.PTS)),
          AST: calculateAverage(gameStats.map((g) => g.AST)),
          REB: calculateAverage(gameStats.map((g) => g.REB)),
          // Calcular porcentajes correctamente usando totales
          FG_PCT: totalFGA > 0 ? totalFGM / totalFGA : 0,
          FT_PCT: totalFTA > 0 ? totalFTM / totalFTA : 0,
          FG3_PCT: totalFG3A > 0 ? totalFG3M / totalFG3A : 0,
          PLUS_MINUS: calculateAverage(gameStats.map((g) => g.PLUS_MINUS)),
          // Estadísticas avanzadas
          OffRtg: calculateAverage(gameStats.map((g) => g.OffRtg)),
          TS: calculateAverage(gameStats.map((g) => g.TS)),
          eFG: calculateAverage(gameStats.map((g) => g.eFG)),
          ASTtoTO: calculateAverage(gameStats.map((g) => g.ASTtoTO)),
          TOVpercent: calculateAverage(gameStats.map((g) => g.TOVpercent)),
          USG: calculateAverage(gameStats.map((g) => g.USG)),
        }

        // Calculate standard deviations
        const standardDeviations = {
          PTS: calculateStandardDeviation(
            gameStats.map((g) => g.PTS),
            averages.PTS,
          ),
          AST: calculateStandardDeviation(
            gameStats.map((g) => g.AST),
            averages.AST,
          ),
          REB: calculateStandardDeviation(
            gameStats.map((g) => g.REB),
            averages.REB,
          ),
          FG_PCT: calculateStandardDeviation(
            gameStats.map((g) => g.FG_PCT),
            averages.FG_PCT,
          ),
          FT_PCT: calculateStandardDeviation(
            gameStats.map((g) => g.FT_PCT),
            averages.FT_PCT,
          ),
          FG3_PCT: calculateStandardDeviation(
            gameStats.map((g) => g.FG3_PCT),
            averages.FG3_PCT,
          ),
          PLUS_MINUS: calculateStandardDeviation(
            gameStats.map((g) => g.PLUS_MINUS),
            averages.PLUS_MINUS,
          ),
          // Estadísticas avanzadas
          OffRtg: calculateStandardDeviation(
            gameStats.map((g) => g.OffRtg),
            averages.OffRtg,
          ),
          TS: calculateStandardDeviation(
            gameStats.map((g) => g.TS),
            averages.TS,
          ),
          eFG: calculateStandardDeviation(
            gameStats.map((g) => g.eFG),
            averages.eFG,
          ),
          ASTtoTO: calculateStandardDeviation(
            gameStats.map((g) => g.ASTtoTO),
            averages.ASTtoTO,
          ),
          TOVpercent: calculateStandardDeviation(
            gameStats.map((g) => g.TOVpercent),
            averages.TOVpercent,
          ),
          USG: calculateStandardDeviation(
            gameStats.map((g) => g.USG),
            averages.USG,
          ),
        }

        // Calculate coefficient of variation (CV = standard deviation / mean)
        const coefficientOfVariation = {
          PTS: averages.PTS > 0 ? standardDeviations.PTS / averages.PTS : 0,
          AST: averages.AST > 0 ? standardDeviations.AST / averages.AST : 0,
          REB: averages.REB > 0 ? standardDeviations.REB / averages.REB : 0,
          FG_PCT: averages.FG_PCT > 0 ? standardDeviations.FG_PCT / averages.FG_PCT : 0,
          FT_PCT: averages.FT_PCT > 0 ? standardDeviations.FT_PCT / averages.FT_PCT : 0,
          FG3_PCT: averages.FG3_PCT > 0 ? standardDeviations.FG3_PCT / averages.FG3_PCT : 0,
          PLUS_MINUS:
            Math.abs(averages.PLUS_MINUS) > 1
              ? standardDeviations.PLUS_MINUS / Math.abs(averages.PLUS_MINUS)
              : standardDeviations.PLUS_MINUS,
          // Estadísticas avanzadas
          OffRtg: averages.OffRtg > 0 ? standardDeviations.OffRtg / averages.OffRtg : 0,
          TS: averages.TS > 0 ? standardDeviations.TS / averages.TS : 0,
          eFG: averages.eFG > 0 ? standardDeviations.eFG / averages.eFG : 0,
          ASTtoTO: averages.ASTtoTO > 0 ? standardDeviations.ASTtoTO / averages.ASTtoTO : 0,
          TOVpercent: averages.TOVpercent > 0 ? standardDeviations.TOVpercent / averages.TOVpercent : 0,
          USG: averages.USG > 0 ? standardDeviations.USG / averages.USG : 0,
        }

        return {
          playerId: player.player_id,
          name: playerName,
          image: playerImage,
          gamesPlayed: gameStats.length,
          averages,
          standardDeviations,
          coefficientOfVariation,
          gameData: gameStats,
        }
      }),
    )

    // Filter out players with too few games (need at least 5 games for meaningful consistency analysis)
    const validPlayersData = playersConsistencyData.filter((player) => player.gamesPlayed >= 5)

    if (validPlayersData.length === 0) {
      return NextResponse.json(
        {
          error: "No players with sufficient games found for consistency analysis",
        },
        { status: 404 },
      )
    }

    // Define the stats categories we want to include in the response
    const simpleStatsCategories = [
      { key: "PTS", label: "Puntos" },
      { key: "AST", label: "Asistencias" },
      { key: "REB", label: "Rebotes" },
      { key: "FG_PCT", label: "% Tiros de campo" },
      { key: "FT_PCT", label: "% Tiros libres" },
      { key: "FG3_PCT", label: "% Triples" },
      { key: "PLUS_MINUS", label: "+/-" },
    ]

    // Añadir categorías de estadísticas avanzadas
    const advancedStatsCategories = [
      { key: "OffRtg", label: "Rating Ofensivo" },
      { key: "TS", label: "% Tiro Efectivo" },
      { key: "eFG", label: "% Tiro Efectivo de Campo" },
      { key: "ASTtoTO", label: "Ratio Asistencias/Pérdidas" },
      { key: "TOVpercent", label: "% de Pérdidas" },
      { key: "USG", label: "% de Uso" },
    ]

    return NextResponse.json({
      team: TEAM_NAME,
      season: SEASON_ID,
      players: validPlayersData,
      simpleStatsCategories,
      advancedStatsCategories,
    })
  } catch (error) {
    console.error("Error fetching player consistency data:", error)
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

// Actualizar la función createEmptyPlayerData para incluir estadísticas avanzadas
function createEmptyPlayerData(playerId: number, name: string, image: string): PlayerConsistencyData {
  const emptyStats = {
    PTS: 0,
    AST: 0,
    REB: 0,
    FG_PCT: 0,
    FT_PCT: 0,
    FG3_PCT: 0,
    PLUS_MINUS: 0,
    // Estadísticas avanzadas
    OffRtg: 0,
    TS: 0,
    eFG: 0,
    ASTtoTO: 0,
    TOVpercent: 0,
    USG: 0,
  }

  return {
    playerId,
    name,
    image,
    gamesPlayed: 0,
    averages: { ...emptyStats },
    standardDeviations: { ...emptyStats },
    coefficientOfVariation: { ...emptyStats },
    gameData: [],
  }
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length <= 1) return 0

  const squaredDifferences = values.map((value) => Math.pow(value - mean, 2))
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / (values.length - 1) // Using n-1 for sample standard deviation

  return Math.sqrt(variance)
}
