import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// Función para verificar la existencia de la imagen del equipo
const getTeamImage = (teamName: string): string | null => {
  const imageFormats = ["png", "webp", "avif", "jpg"]
  const publicDir = path.join(process.cwd(), "public", "images", "teams")

  for (const format of imageFormats) {
    const imagePath = path.join(publicDir, `${teamName.toLowerCase().replace(/\s+/g, "-")}.${format}`)
    if (fs.existsSync(imagePath)) {
      return `/images/teams/${teamName.toLowerCase().replace(/\s+/g, "-")}.${format}`
    }
  }

  // Si no existe ninguna imagen, retornar un placeholder
  return "/placeholder.svg?height=80&width=80"
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    if (!gameId) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 })
    }

    // Obtener información básica del partido
    const gameStats = await prisma.stats.findMany({
      where: { Game_ID: gameId },
      select: {
        GAME_DATE: true,
        MATCHUP: true,
        WL: true,
        Player_ID: true,
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
    })

    if (gameStats.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Extraer la fecha del partido
    const gameDate = gameStats[0].GAME_DATE

    // Extraer información del partido desde el MATCHUP
    // Formato típico: "LAL vs. DET" o "LAL @ DET"
    const matchupInfo = gameStats[0].MATCHUP?.split(/\s+(@|vs\.)\s+/) || []
    const isHomeGame = gameStats[0].MATCHUP?.includes("vs.") || false

    const homeTeamAbbr = isHomeGame ? matchupInfo[0] : matchupInfo[1]
    const awayTeamAbbr = isHomeGame ? matchupInfo[1] : matchupInfo[0]

    // Mapeo de abreviaturas a nombres completos (esto podría venir de una base de datos)
    const teamNames: Record<string, string> = {
      LAL: "Equipo A",
      DET: "Detroit Pistons",
      GSW: "Golden State Warriors",
      BOS: "Boston Celtics",
      MIA: "Miami Heat",
      CHI: "Chicago Bulls",
      DAL: "Dallas Mavericks",
      PHX: "Phoenix Suns",
      BKN: "Brooklyn Nets",
      NYK: "New York Knicks",
      HOU: "Houston Rockets",
      LAC: "Los Angeles Clippers",
      MEM: "Memphis Grizzlies",
      TOR: "Toronto Raptors",
      PHI: "Philadelphia 76ers",
      CLE: "Cleveland Cavaliers",
      MIL: "Milwaukee Bucks",
      ATL: "Atlanta Hawks",
      DEN: "Denver Nuggets",
      UTA: "Utah Jazz",
      POR: "Portland Trail Blazers",
      SAS: "San Antonio Spurs",
      OKC: "Oklahoma City Thunder",
      NOP: "New Orleans Pelicans",
      MIN: "Minnesota Timberwolves",
      SAC: "Sacramento Kings",
      WAS: "Washington Wizards",
      ORL: "Orlando Magic",
      CHA: "Charlotte Hornets",
      IND: "Indiana Pacers",
      // Añadir más equipos según sea necesario
    }

    const homeTeamName = teamNames[homeTeamAbbr] || homeTeamAbbr
    const awayTeamName = teamNames[awayTeamAbbr] || awayTeamAbbr

    console.log(`Home team: ${homeTeamName}, Away team: ${awayTeamName}`)

    // Obtener jugadores y sus equipos
    const playerTeams = await prisma.playersteams.findMany({
      where: {
        player_id: {
          in: gameStats.map((stat) => stat.Player_ID).filter((id) => id !== null) as number[],
        },
      },
    })

    // Crear un mapa de ID de jugador a equipo
    const playerTeamMap = new Map()
    playerTeams.forEach((pt) => {
      if (pt.player_id !== null) {
        playerTeamMap.set(pt.player_id, {
          name: pt.player_name || `Player #${pt.player_id}`,
          team: pt.player_team || "Unknown Team",
        })
      }
    })

    // Mejorar la lógica para determinar a qué equipo pertenece cada jugador
    // Primero, intentamos asignar jugadores basados en la información de playersteams
    const homeTeamPlayerIds = new Set<number>()
    const awayTeamPlayerIds = new Set<number>()
    const unassignedPlayerIds = new Set<number>()

    // Primera pasada: asignar jugadores basados en la información de equipo
    gameStats.forEach((stat) => {
      if (stat.Player_ID === null) return

      const playerInfo = playerTeamMap.get(stat.Player_ID)
      if (!playerInfo) {
        unassignedPlayerIds.add(stat.Player_ID)
        return
      }

      // Verificar si el nombre del equipo coincide con alguno de los equipos del partido
      const playerTeamName = playerInfo.team

      // Comprobar si el nombre del equipo contiene el nombre completo o la abreviatura
      const isHomeTeam = playerTeamName.includes(homeTeamName) || playerTeamName.includes(homeTeamAbbr)

      const isAwayTeam = playerTeamName.includes(awayTeamName) || playerTeamName.includes(awayTeamAbbr)

      if (isHomeTeam && !isAwayTeam) {
        homeTeamPlayerIds.add(stat.Player_ID)
      } else if (isAwayTeam && !isHomeTeam) {
        awayTeamPlayerIds.add(stat.Player_ID)
      } else {
        // Si no podemos determinar el equipo, lo marcamos como no asignado
        unassignedPlayerIds.add(stat.Player_ID)
      }
    })

    console.log(
      `Initial assignment - Home: ${homeTeamPlayerIds.size}, Away: ${awayTeamPlayerIds.size}, Unassigned: ${unassignedPlayerIds.size}`,
    )

    // Segunda pasada: usar WL (Win/Loss) para asignar jugadores no asignados
    gameStats.forEach((stat) => {
      if (stat.Player_ID === null || homeTeamPlayerIds.has(stat.Player_ID) || awayTeamPlayerIds.has(stat.Player_ID)) {
        return
      }

      // Si el jugador no está asignado, intentamos usar WL
      if (unassignedPlayerIds.has(stat.Player_ID) && stat.WL) {
        // Si el equipo local ganó (W) y este jugador tiene WL="W", es del equipo local
        // O si el equipo local perdió (L) y este jugador tiene WL="L", es del equipo local
        const isHomeTeamPlayer = (isHomeGame && stat.WL === "W") || (!isHomeGame && stat.WL === "L")

        if (isHomeTeamPlayer) {
          homeTeamPlayerIds.add(stat.Player_ID)
          unassignedPlayerIds.delete(stat.Player_ID)
        } else {
          awayTeamPlayerIds.add(stat.Player_ID)
          unassignedPlayerIds.delete(stat.Player_ID)
        }
      }
    })

    console.log(
      `After WL assignment - Home: ${homeTeamPlayerIds.size}, Away: ${awayTeamPlayerIds.size}, Unassigned: ${unassignedPlayerIds.size}`,
    )

    // Tercera pasada: usar PLUS_MINUS para asignar jugadores restantes
    gameStats.forEach((stat) => {
      if (stat.Player_ID === null || homeTeamPlayerIds.has(stat.Player_ID) || awayTeamPlayerIds.has(stat.Player_ID)) {
        return
      }

      if (unassignedPlayerIds.has(stat.Player_ID) && stat.PLUS_MINUS !== null) {
        // Si el equipo local ganó, los jugadores con PLUS_MINUS positivo probablemente son del equipo local
        const homeTeamWon = gameStats.some((s) => homeTeamPlayerIds.has(s.Player_ID as number) && s.WL === "W")

        const isHomeTeamPlayer = (homeTeamWon && stat.PLUS_MINUS > 0) || (!homeTeamWon && stat.PLUS_MINUS < 0)

        if (isHomeTeamPlayer) {
          homeTeamPlayerIds.add(stat.Player_ID)
          unassignedPlayerIds.delete(stat.Player_ID)
        } else {
          awayTeamPlayerIds.add(stat.Player_ID)
          unassignedPlayerIds.delete(stat.Player_ID)
        }
      }
    })

    console.log(
      `After PLUS_MINUS assignment - Home: ${homeTeamPlayerIds.size}, Away: ${awayTeamPlayerIds.size}, Unassigned: ${unassignedPlayerIds.size}`,
    )

    // Cuarta pasada: asignar jugadores restantes basados en la mayoría
    // Si la mayoría de los jugadores ya asignados tienen PLUS_MINUS positivo, asumimos que ganaron
    if (unassignedPlayerIds.size > 0) {
      const homeTeamPlusMinus = Array.from(homeTeamPlayerIds).reduce((sum, id) => {
        const stat = gameStats.find((s) => s.Player_ID === id)
        return sum + (stat?.PLUS_MINUS || 0)
      }, 0)

      const homeTeamPositivePlusMinus = homeTeamPlusMinus > 0

      unassignedPlayerIds.forEach((id) => {
        const stat = gameStats.find((s) => s.Player_ID === id)
        if (!stat) return

        const playerPositivePlusMinus = (stat.PLUS_MINUS || 0) > 0

        // Si el equipo local tiene PLUS_MINUS positivo y este jugador también, probablemente es del equipo local
        const isHomeTeamPlayer = playerPositivePlusMinus === homeTeamPositivePlusMinus

        if (isHomeTeamPlayer) {
          homeTeamPlayerIds.add(id)
        } else {
          awayTeamPlayerIds.add(id)
        }
      })

      unassignedPlayerIds.clear()
    }

    console.log(
      `Final assignment - Home: ${homeTeamPlayerIds.size}, Away: ${awayTeamPlayerIds.size}, Unassigned: ${unassignedPlayerIds.size}`,
    )

    // Verificar que cada equipo tenga al menos 5 jugadores
    // Si no, podríamos tener un problema con la asignación
    if (homeTeamPlayerIds.size < 5 || awayTeamPlayerIds.size < 5) {
      console.warn(
        `Warning: Team has fewer than 5 players - Home: ${homeTeamPlayerIds.size}, Away: ${awayTeamPlayerIds.size}`,
      )

      // Si un equipo tiene muy pocos jugadores, intentamos una asignación más simple
      // basada en la mitad de los jugadores para cada equipo
      if (homeTeamPlayerIds.size < 3 || awayTeamPlayerIds.size < 3) {
        console.warn("Severe imbalance detected, reassigning players evenly")

        // Reiniciar asignaciones
        homeTeamPlayerIds.clear()
        awayTeamPlayerIds.clear()

        // Ordenar jugadores por minutos jugados (descendente)
        const sortedPlayers = gameStats
          .filter((stat) => stat.Player_ID !== null)
          .sort((a, b) => (b.MIN || 0) - (a.MIN || 0))

        // Asignar la primera mitad al equipo local y la segunda mitad al equipo visitante
        const halfIndex = Math.ceil(sortedPlayers.length / 2)

        sortedPlayers.forEach((stat, index) => {
          if (stat.Player_ID === null) return

          if (index < halfIndex) {
            homeTeamPlayerIds.add(stat.Player_ID)
          } else {
            awayTeamPlayerIds.add(stat.Player_ID)
          }
        })

        console.log(`After rebalancing - Home: ${homeTeamPlayerIds.size}, Away: ${awayTeamPlayerIds.size}`)
      }
    }

    // Ahora procesamos las estadísticas con las asignaciones de equipo correctas
    const homeTeamPlayers: any[] = []
    const awayTeamPlayers: any[] = []
    const homeTeamTotals: Record<string, number> = {}
    const awayTeamTotals: Record<string, number> = {}

    // Inicializar totales
    const statKeys = [
      "MIN",
      "FGM",
      "FGA",
      "FG_PCT",
      "FG3M",
      "FG3A",
      "FG3_PCT",
      "FTM",
      "FTA",
      "FT_PCT",
      "OREB",
      "DREB",
      "REB",
      "AST",
      "STL",
      "BLK",
      "TOV",
      "PF",
      "PTS",
      "PLUS_MINUS",
    ]

    statKeys.forEach((key) => {
      homeTeamTotals[key] = 0
      awayTeamTotals[key] = 0
    })

    // Procesar estadísticas de jugadores con las asignaciones correctas
    gameStats.forEach((stat) => {
      if (stat.Player_ID === null) return

      const playerInfo = playerTeamMap.get(stat.Player_ID) || {
        name: `Player #${stat.Player_ID}`,
        team: "Unknown Team",
      }

      const isHomeTeamPlayer = homeTeamPlayerIds.has(stat.Player_ID)

      const playerStat = {
        id: stat.Player_ID,
        name: playerInfo.name,
        team: isHomeTeamPlayer ? homeTeamName : awayTeamName,
        number: "", // No tenemos esta información en la base de datos
        position: "", // No tenemos esta información en la base de datos
        minutes: stat.MIN || 0,
        points: stat.PTS || 0,
        rebounds: stat.REB || 0,
        assists: stat.AST || 0,
        steals: stat.STL || 0,
        blocks: stat.BLK || 0,
        turnovers: stat.TOV || 0,
        fouls: stat.PF || 0,
        fgm: stat.FGM || 0,
        fga: stat.FGA || 0,
        fgp: stat.FG_PCT ? `${(stat.FG_PCT * 100).toFixed(1)}%` : "0.0%",
        tpm: stat.FG3M || 0,
        tpa: stat.FG3A || 0,
        tpp: stat.FG3_PCT ? `${(stat.FG3_PCT * 100).toFixed(1)}%` : "0.0%",
        ftm: stat.FTM || 0,
        fta: stat.FTA || 0,
        ftp: stat.FT_PCT ? `${(stat.FT_PCT * 100).toFixed(1)}%` : "0.0%",
        plusMinus: stat.PLUS_MINUS ? stat.PLUS_MINUS.toString() : "0",
      }

      // Agregar a la lista correspondiente
      if (isHomeTeamPlayer) {
        homeTeamPlayers.push(playerStat)
        // Sumar a los totales del equipo local
        statKeys.forEach((key) => {
          if (stat[key as keyof typeof stat] !== null && typeof stat[key as keyof typeof stat] === "number") {
            homeTeamTotals[key] += stat[key as keyof typeof stat] as number
          }
        })
      } else {
        awayTeamPlayers.push(playerStat)
        // Sumar a los totales del equipo visitante
        statKeys.forEach((key) => {
          if (stat[key as keyof typeof stat] !== null && typeof stat[key as keyof typeof stat] === "number") {
            awayTeamTotals[key] += stat[key as keyof typeof stat] as number
          }
        })
      }
    })

    // Verificar que los puntos totales sean razonables
    console.log(`Home team points: ${homeTeamTotals.PTS}, Away team points: ${awayTeamTotals.PTS}`)

    // Calcular porcentajes para los totales
    homeTeamTotals.FG_PCT = homeTeamTotals.FGA > 0 ? homeTeamTotals.FGM / homeTeamTotals.FGA : 0
    homeTeamTotals.FG3_PCT = homeTeamTotals.FG3A > 0 ? homeTeamTotals.FG3M / homeTeamTotals.FG3A : 0
    homeTeamTotals.FT_PCT = homeTeamTotals.FTA > 0 ? homeTeamTotals.FTM / homeTeamTotals.FTA : 0

    awayTeamTotals.FG_PCT = awayTeamTotals.FGA > 0 ? awayTeamTotals.FGM / awayTeamTotals.FGA : 0
    awayTeamTotals.FG3_PCT = awayTeamTotals.FG3A > 0 ? awayTeamTotals.FG3M / awayTeamTotals.FG3A : 0
    awayTeamTotals.FT_PCT = awayTeamTotals.FTA > 0 ? awayTeamTotals.FTM / awayTeamTotals.FTA : 0

    // Calcular estadísticas simples para mostrar
    const simpleStats = [
      {
        id: 1,
        name: "Field Goal %",
        home: `${(homeTeamTotals.FG_PCT * 100).toFixed(1)}%`,
        away: `${(awayTeamTotals.FG_PCT * 100).toFixed(1)}%`,
      },
      {
        id: 2,
        name: "3-Point %",
        home: `${(homeTeamTotals.FG3_PCT * 100).toFixed(1)}%`,
        away: `${(awayTeamTotals.FG3_PCT * 100).toFixed(1)}%`,
      },
      {
        id: 3,
        name: "Free Throw %",
        home: `${(homeTeamTotals.FT_PCT * 100).toFixed(1)}%`,
        away: `${(awayTeamTotals.FT_PCT * 100).toFixed(1)}%`,
      },
      {
        id: 4,
        name: "Rebounds",
        home: homeTeamTotals.REB.toString(),
        away: awayTeamTotals.REB.toString(),
      },
      {
        id: 5,
        name: "Assists",
        home: homeTeamTotals.AST.toString(),
        away: awayTeamTotals.AST.toString(),
      },
      {
        id: 6,
        name: "Steals",
        home: homeTeamTotals.STL.toString(),
        away: awayTeamTotals.STL.toString(),
      },
      {
        id: 7,
        name: "Blocks",
        home: homeTeamTotals.BLK.toString(),
        away: awayTeamTotals.BLK.toString(),
      },
      {
        id: 8,
        name: "Turnovers",
        home: homeTeamTotals.TOV.toString(),
        away: awayTeamTotals.TOV.toString(),
      },
    ]

    // Calcular estadísticas avanzadas usando las mismas fórmulas que en la API de promedios de equipo
    // Posesiones (estimación)
    const homePossessions = homeTeamTotals.FGA + 0.44 * homeTeamTotals.FTA + homeTeamTotals.TOV
    const awayPossessions = awayTeamTotals.FGA + 0.44 * awayTeamTotals.FTA + awayTeamTotals.TOV

    // Pace (estimación para un juego de 48 minutos)
    const homePace = (homePossessions * 48) / (homeTeamTotals.MIN || 240) // 240 minutos = 5 jugadores * 48 minutos
    const awayPace = (awayPossessions * 48) / (awayTeamTotals.MIN || 240)

    // Offensive Rating (puntos por 100 posesiones)
    const homeOffRtg = homePossessions > 0 ? (homeTeamTotals.PTS / homePossessions) * 100 : 0
    const awayOffRtg = awayPossessions > 0 ? (awayTeamTotals.PTS / awayPossessions) * 100 : 0

    // Defensive Rating
    const homeDefRtg =
      homePossessions > 0 ? ((awayTeamTotals.PTS - homeTeamTotals.PLUS_MINUS) / homePossessions) * 100 : 0
    const awayDefRtg =
      awayPossessions > 0 ? ((homeTeamTotals.PTS + awayTeamTotals.PLUS_MINUS) / awayPossessions) * 100 : 0

    // Net Rating
    const homeNetRtg = homeOffRtg - homeDefRtg
    const awayNetRtg = awayOffRtg - awayDefRtg

    // Effective Field Goal Percentage
    const homeEFG = homeTeamTotals.FGA > 0 ? (homeTeamTotals.FGM + 0.5 * homeTeamTotals.FG3M) / homeTeamTotals.FGA : 0
    const awayEFG = awayTeamTotals.FGA > 0 ? (awayTeamTotals.FGM + 0.5 * awayTeamTotals.FG3M) / awayTeamTotals.FGA : 0

    // True Shooting Percentage
    const homeTS =
      homeTeamTotals.FGA > 0 ? homeTeamTotals.PTS / (2 * (homeTeamTotals.FGA + 0.44 * homeTeamTotals.FTA)) : 0
    const awayTS =
      awayTeamTotals.FGA > 0 ? awayTeamTotals.PTS / (2 * (awayTeamTotals.FGA + 0.44 * awayTeamTotals.FTA)) : 0

    // Turnover Percentage
    const homeTOVpercent = homePossessions > 0 ? (homeTeamTotals.TOV / homePossessions) * 100 : 0
    const awayTOVpercent = awayPossessions > 0 ? (awayTeamTotals.TOV / awayPossessions) * 100 : 0

    // Assist-to-Turnover Ratio
    const homeAstToTOV = homeTeamTotals.TOV > 0 ? homeTeamTotals.AST / homeTeamTotals.TOV : 0
    const awayAstToTOV = awayTeamTotals.TOV > 0 ? awayTeamTotals.AST / awayTeamTotals.TOV : 0

    // Free Throw Rate
    const homeFTRate = homeTeamTotals.FGA > 0 ? (homeTeamTotals.FTA / homeTeamTotals.FGA) * 100 : 0
    const awayFTRate = awayTeamTotals.FGA > 0 ? (awayTeamTotals.FTA / awayTeamTotals.FGA) * 100 : 0

    // Effective Field Goal Attempt Rate
    const homeEFGA = homeTeamTotals.FGA + 0.44 * homeTeamTotals.FTA
    const awayEFGA = awayTeamTotals.FGA + 0.44 * awayTeamTotals.FTA

    const advancedStats = [
      {
        id: 1,
        name: "Offensive Rating",
        home: homeOffRtg.toFixed(1),
        away: awayOffRtg.toFixed(1),
      },
      {
        id: 2,
        name: "Defensive Rating",
        home: homeDefRtg.toFixed(1),
        away: awayDefRtg.toFixed(1),
      },
      {
        id: 3,
        name: "Net Rating",
        home: homeNetRtg > 0 ? `+${homeNetRtg.toFixed(1)}` : homeNetRtg.toFixed(1),
        away: awayNetRtg > 0 ? `+${awayNetRtg.toFixed(1)}` : awayNetRtg.toFixed(1),
      },
      {
        id: 4,
        name: "Pace",
        home: homePace.toFixed(1),
        away: awayPace.toFixed(1),
      },
      {
        id: 5,
        name: "True Shooting %",
        home: `${(homeTS * 100).toFixed(1)}%`,
        away: `${(awayTS * 100).toFixed(1)}%`,
      },
      {
        id: 6,
        name: "Effective FG%",
        home: `${(homeEFG * 100).toFixed(1)}%`,
        away: `${(awayEFG * 100).toFixed(1)}%`,
      },
      {
        id: 7,
        name: "Turnover %",
        home: `${homeTOVpercent.toFixed(1)}%`,
        away: `${awayTOVpercent.toFixed(1)}%`,
      },
      {
        id: 8,
        name: "Assist/TO Ratio",
        home: homeAstToTOV.toFixed(2),
        away: awayAstToTOV.toFixed(2),
      },
      {
        id: 9,
        name: "Free Throw Rate",
        home: `${homeFTRate.toFixed(1)}%`,
        away: `${awayFTRate.toFixed(1)}%`,
      },
      {
        id: 10,
        name: "EFGA",
        home: homeEFGA.toFixed(1),
        away: awayEFGA.toFixed(1),
      },
    ]

    // Obtener imágenes de los equipos
    const homeTeamLogo = getTeamImage(homeTeamName)
    const awayTeamLogo = getTeamImage(awayTeamName)

    // Formatear la fecha
    const formattedDate = gameDate
      ? new Date(gameDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Unknown Date"

    // Construir el objeto de respuesta
    const gameInfo = {
      id: gameId,
      date: formattedDate,
      homeTeam: {
        name: homeTeamName,
        logo: homeTeamLogo,
        score: homeTeamTotals.PTS,
      },
      awayTeam: {
        name: awayTeamName,
        logo: awayTeamLogo,
        score: awayTeamTotals.PTS,
      },
      venue: "Venue information not available", // No tenemos esta información en la base de datos
      attendance: "Attendance information not available", // No tenemos esta información en la base de datos
      referees: "Referees information not available", // No tenemos esta información en la base de datos
    }

    return NextResponse.json({
      gameInfo,
      simpleStats,
      advancedStats,
      playerStats: [...homeTeamPlayers, ...awayTeamPlayers],
    })
  } catch (error) {
    console.error("Error fetching game stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

