import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    // Fetch game information
    const gameInfo = await prisma.stats.findFirst({
      where: { Game_ID: gameId },
      select: {
        GAME_DATE: true,
        MATCHUP: true,
      },
    })

    if (!gameInfo) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Parse matchup to get team names
    const matchup = gameInfo.MATCHUP || ""
    const isHomeGame = !matchup.includes("@")
    const teams = matchup.replace("@", "").split(" ")
    const homeTeam = isHomeGame ? teams[0] : teams[1]
    const awayTeam = isHomeGame ? teams[1] : teams[0]

    // Fetch player stats for this game
    const playerStats = await prisma.stats.findMany({
      where: { Game_ID: gameId },
      select: {
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

    // Get player names from the database
    const playerIds = playerStats.map((stat) => stat.Player_ID)
    const players = await prisma.players_teams.findMany({
      where: {
        player_id: {
          in: playerIds.map((id) => id.toString()),
        },
      },
      select: {
        player_id: true,
        player_name: true,
        team_name: true,
      },
    })

    // Create a map of player IDs to names
    const playerMap = new Map()
    players.forEach((player) => {
      playerMap.set(Number.parseInt(player.player_id), {
        name: player.player_name,
        team: player.team_name,
      })
    })

    // Combine player stats with names
    const formattedPlayerStats = playerStats.map((stat) => {
      const playerInfo = playerMap.get(stat.Player_ID) || { name: `Player ${stat.Player_ID}`, team: "Unknown" }

      return {
        id: stat.Player_ID,
        name: playerInfo.name,
        team: playerInfo.team,
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
        fgp: stat.FG_PCT ? (stat.FG_PCT * 100).toFixed(1) : "0.0",
        tpm: stat.FG3M || 0,
        tpa: stat.FG3A || 0,
        tpp: stat.FG3_PCT ? (stat.FG3_PCT * 100).toFixed(1) : "0.0",
        ftm: stat.FTM || 0,
        fta: stat.FTA || 0,
        ftp: stat.FT_PCT ? (stat.FT_PCT * 100).toFixed(1) : "0.0",
        plusMinus: stat.PLUS_MINUS ? stat.PLUS_MINUS.toString() : "0",
        offensiveRebounds: stat.OREB || 0,
        defensiveRebounds: stat.DREB || 0,
      }
    })

    // Calculate team stats
    const homeTeamStats = formattedPlayerStats.filter((player) => player.team === homeTeam)
    const awayTeamStats = formattedPlayerStats.filter((player) => player.team === awayTeam)

    // Calculate simple stats for each team
    const calculateTeamStats = (teamStats: any[]) => {
      const totalStats = teamStats.reduce((acc, player) => {
        Object.keys(player).forEach((key) => {
          if (typeof player[key] === "number") {
            acc[key] = (acc[key] || 0) + player[key]
          }
        })
        return acc
      }, {})

      // Calculate percentages
      const fgp = totalStats.fga > 0 ? ((totalStats.fgm / totalStats.fga) * 100).toFixed(1) : "0.0"
      const tpp = totalStats.tpa > 0 ? ((totalStats.tpm / totalStats.tpa) * 100).toFixed(1) : "0.0"
      const ftp = totalStats.fta > 0 ? ((totalStats.ftm / totalStats.fta) * 100).toFixed(1) : "0.0"

      return {
        points: totalStats.points || 0,
        rebounds: totalStats.rebounds || 0,
        assists: totalStats.assists || 0,
        steals: totalStats.steals || 0,
        blocks: totalStats.blocks || 0,
        turnovers: totalStats.turnovers || 0,
        fgp,
        tpp,
        ftp,
        offensiveRebounds: totalStats.offensiveRebounds || 0,
        defensiveRebounds: totalStats.defensiveRebounds || 0,
      }
    }

    const homeStats = calculateTeamStats(homeTeamStats)
    const awayStats = calculateTeamStats(awayTeamStats)

    // Format simple stats for display
    const simpleStats = [
      { id: 1, name: "FG%", home: `${homeStats.fgp}%`, away: `${awayStats.fgp}%` },
      { id: 2, name: "3P%", home: `${homeStats.tpp}%`, away: `${awayStats.tpp}%` },
      { id: 3, name: "FT%", home: `${homeStats.ftp}%`, away: `${awayStats.ftp}%` },
      { id: 4, name: "Rebounds", home: homeStats.rebounds.toString(), away: awayStats.rebounds.toString() },
      { id: 5, name: "Assists", home: homeStats.assists.toString(), away: awayStats.assists.toString() },
      { id: 6, name: "Steals", home: homeStats.steals.toString(), away: awayStats.steals.toString() },
      { id: 7, name: "Blocks", home: homeStats.blocks.toString(), away: awayStats.blocks.toString() },
      { id: 8, name: "Turnovers", home: homeStats.turnovers.toString(), away: awayStats.turnovers.toString() },
      {
        id: 9,
        name: "Offensive Rebounds",
        home: homeStats.offensiveRebounds.toString(),
        away: awayStats.offensiveRebounds.toString(),
      },
      {
        id: 10,
        name: "Defensive Rebounds",
        home: homeStats.defensiveRebounds.toString(),
        away: awayStats.defensiveRebounds.toString(),
      },
    ]

    // Hardcoded advanced stats (datos provisionales)
    const advancedStats = [
      { id: 1, name: "Offensive Rating", home: "115.2", away: "108.4", provisional: true },
      { id: 2, name: "Defensive Rating", home: "108.4", away: "115.2", provisional: true },
      { id: 3, name: "Net Rating", home: "+6.8", away: "-6.8", provisional: true },
      { id: 4, name: "Pace", home: "98.6", away: "98.6", provisional: true },
      { id: 5, name: "True Shooting %", home: "58.7%", away: "53.2%", provisional: true },
      { id: 6, name: "Assist Ratio", home: "18.5", away: "15.3", provisional: true },
      { id: 7, name: "Turnover Ratio", home: "12.4", away: "14.8", provisional: true },
      { id: 8, name: "Offensive Rebound %", home: "28.3%", away: "24.1%", provisional: true },
      { id: 9, name: "Defensive Rebound %", home: "76.5%", away: "71.2%", provisional: true },
    ]

    // Format game info
    const formattedGameInfo = {
      id: gameId,
      date: gameInfo.GAME_DATE
        ? new Date(gameInfo.GAME_DATE).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "Unknown Date",
      homeTeam: {
        name: homeTeam,
        logo: `/images/teams/${homeTeam.toLowerCase().replace(/\s+/g, "-")}.png`,
        score: homeStats.points,
      },
      awayTeam: {
        name: awayTeam,
        logo: `/images/teams/${awayTeam.toLowerCase().replace(/\s+/g, "-")}.png`,
        score: awayStats.points,
      },
      venue: "Venue information not available", // This would need to come from another table
      attendance: "Attendance information not available", // This would need to come from another table
      referees: "Referee information not available", // This would need to come from another table
    }

    return NextResponse.json({
      gameInfo: formattedGameInfo,
      simpleStats,
      advancedStats,
      playerStats: formattedPlayerStats,
      advancedStatsProvisional: true, // Indicador de que las estadísticas avanzadas son provisionales
    })
  } catch (error) {
    console.error("Error fetching game details:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
