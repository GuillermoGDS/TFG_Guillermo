"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { playersData } from "@/app/players-data";

// Definir la interfaz para los tipos de datos
interface Game {
  Game_ID: string;
  GAME_DATE: string;
  MATCHUP: string;
}

interface Player {
  player_id: string;
  player_name: string;
}

const simpleStats = [
  { name: "Points per game", value: "30.5", id: "ppg" },
  { name: "Field goal %", value: "48.2%", id: "fg_percentage" },
  { name: "3-point %", value: "37.8%", id: "three_point_percentage" },
  { name: "Free throw %", value: "85.3%", id: "ft_percentage" },
  { name: "Total rebounds", value: "8.7", id: "total_rebounds" },
  { name: "Offensive rebounds", value: "1.2", id: "offensive_rebounds" },
  { name: "Defensive rebounds", value: "7.5", id: "defensive_rebounds" },
  { name: "Assists per game", value: "7.2", id: "apg" },
  { name: "Steals per game", value: "1.5", id: "spg" },
  { name: "Blocks per game", value: "0.8", id: "bpg" },
  { name: "Turnovers", value: "3.1", id: "turnovers" },
  { name: "Fouls", value: "2.4", id: "fouls" },
]

const advancedStats = [
  { name: "Player Efficiency Rating (PER)", value: "25.6", id: "per" },
  { name: "Plus-Minus (+/-)", value: "+7.2", id: "plus_minus" },
  { name: "Usage Rate (USG%)", value: "28.5%", id: "usg_percentage" },
  { name: "True Shooting % (TS%)", value: "62.3%", id: "ts_percentage" },
  { name: "Assist to Turnover Ratio (AST/TO)", value: "2.32", id: "ast_to_ratio" },
  { name: "Win Shares (WS)", value: "10.4", id: "win_shares" },
  { name: "Offensive Rating (OffRtg)", value: "114.5", id: "off_rtg" },
  { name: "Defensive Rating (DefRtg)", value: "106.2", id: "def_rtg" },
  { name: "Net Rating (NetRtg)", value: "+8.3", id: "net_rtg" },
  { name: "Possessions", value: "98.5", id: "possessions" },
  { name: "Points Per Possession (PPP)", value: "1.16", id: "ppp" },
]

// Mapa de abreviaturas de equipos a nombres completos
const teamNames: { [key: string]: string } = {
  LAL: "Los Angeles Lakers",
  BOS: "Boston Celtics",
  MIA: "Miami Heat",
  NYK: "New York Knicks",
  GSW: "Golden State Warriors",
  CHI: "Chicago Bulls",
  PHI: "Philadelphia 76ers",
  DAL: "Dallas Mavericks",
  TOR: "Toronto Raptors",
  MIL: "Milwaukee Bucks",
  PHX: "Phoenix Suns",
  SAC: "Sacramento Kings",
  UTA: "Utah Jazz",
  DET: "Detroit Pistons",
  IND: "Indiana Pacers",
  HOU: "Houston Rockets",
  MEM: "Memphis Grizzlies",
  MIN: "Minnesota Timberwolves",
  ORL: "Orlando Magic",
  ATL: "Atlanta Hawks",
  CLE: "Cleveland Cavaliers",
  WAS: "Washington Wizards",
  CHA: "Charlotte Hornets",
  OKC: "Oklahoma City Thunder",
  LAC: "Los Angeles Clippers",
  BKN: "Brooklyn Nets",
  NOP: "New Orleans Pelicans",
  POR: "Portland Trail Blazers",
  SAS: "San Antonio Spurs",
  DEN: "Denver Nuggets",
} as const;

export default function Home() {
  const [section, setSection] = useState("Team");
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await fetch("/api/games");
        const data = await response.json();
        console.log("API Games:", data);

        if (Array.isArray(data)) {
          setGames(data);
        } else {
          console.error("API response is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    }
    fetchGames();
  }, []);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/players");
        const data = await response.json();
        console.log("API Players:", data);

        if (Array.isArray(data)) {
          setPlayers(data);
        } else {
          console.error("API response is not an array:", data);
        }
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    }
    fetchPlayers();
  }, []);

  // Combinar datos de API con la imagen de playersData
  const mergedPlayers = players.map((player) => ({
    id: player.player_id,
    name: player.player_name,
    image: playersData[player.player_id]?.image || "/placeholder.svg",
  }));

  const formatMatchup = (matchup: string) => {
    return matchup.replace("@", "vs");
  };

  const formatTeamNames = (matchup: string) => {
    let teams = matchup.split(" ");
    teams = teams.map((team) => teamNames[team] || team);
    return teams.join(" ");
  };

  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a]">
      <nav className="w-full bg-gray-800 p-4 mb-8">
        <div className="max-w-7xl mx-auto">
          <ul className="flex justify-between items-center bg-gray-700 rounded-lg p-1">
            {["Team", "Games", "Plans"].map((item) => (
              <li key={item} className="flex-1">
                <button
                  onClick={() => setSection(item)}
                  className={`w-full py-2 text-center rounded-md transition-all duration-300 ${
                    section === item
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="w-full max-w-7xl mx-auto px-4">
        {section === "Team" && (
          <>
            <h2 className="text-3xl font-bold my-8">Players</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
              {mergedPlayers.map((player) => (
                <Link href={`/players/${player.id}`} key={player.id}>
                  <div className="w-64 flex-shrink-0 bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-all hover:scale-105">
                    <div className="relative h-80">
                      <Image
                        src={player.image}
                        alt={player.name}
                        layout="fill"
                        objectFit="cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
                        <h3 className="text-xl font-bold truncate">{player.name}</h3>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <h2 className="text-3xl font-bold my-8">Simple Stats</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
              {simpleStats.map((stat) => (
                <Link href={`/simple-stats/${stat.id}`} key={stat.id}>
                  <div className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 flex flex-col justify-center">
                    <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </Link>
              ))}
            </div>

            <h2 className="text-3xl font-bold my-8">Advanced Stats</h2>
            <div className="flex overflow-x-auto gap-6 pb-8 scrollbar-hide">
              {advancedStats.map((stat) => (
                <Link href={`/advanced-stats/${stat.id}`} key={stat.id}>
                  <div className="w-48 h-48 flex-shrink-0 bg-gray-800 rounded-xl p-6 text-center shadow-lg cursor-pointer transform transition-all hover:scale-105 flex flex-col justify-center">
                    <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {section === "Games" && (
          <>
            <h2 className="text-3xl font-bold my-8">Upcoming Games</h2>
            <div className="grid gap-4">
              {games.map((game) => (
                <Link href={`/games/${game.Game_ID}`} key={game.Game_ID}>
                  <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex justify-between items-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <div className="flex items-center">
                      <Image
                        src="/lakers-logo.png"
                        alt="Lakers Logo"
                        width={64}
                        height={64}
                        className="mr-4"
                      />
                      <div>
                        <h3 className="text-xl font-semibold">
                          {formatTeamNames(formatMatchup(game.MATCHUP))}
                        </h3>
                        <p className="text-gray-400">{game.GAME_DATE}</p>
                      </div>
                    </div>
                    <span className="text-gray-400">{game.Game_ID}</span>
                    <ChevronRight className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
