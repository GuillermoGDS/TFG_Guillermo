import Link from "next/link"
import { ArrowLeft, TrendingUp } from "lucide-react"

// This would normally come from your API
const getStatDetails = (id: string) => {
  const statMap: Record<string, { name: string; description: string; formula?: string }> = {
    ofrtg: {
      name: "Offensive Rating",
      description: "Points produced by a player or team per 100 possessions.",
      formula: "(Points × 100) / Possessions",
    },
    dfrtg: {
      name: "Defensive Rating",
      description: "Points allowed by a player or team per 100 possessions.",
      formula: "(Points Allowed × 100) / Possessions",
    },
    netrtg: {
      name: "Net Rating",
      description: "The difference between a team's offensive and defensive ratings.",
      formula: "Offensive Rating - Defensive Rating",
    },
    pace: {
      name: "Pace",
      description: "An estimate of the number of possessions per 48 minutes by a team.",
      formula: "48 × ((Possessions) / (Minutes Played))",
    },
    efg: {
      name: "Effective Field Goal Percentage",
      description:
        "A statistic that adjusts field goal percentage to account for the fact that three-point field goals count for more than two-point field goals.",
      formula: "(FGM + 0.5 × 3PM) / FGA",
    },
    ts: {
      name: "True Shooting Percentage",
      description:
        "A measure of shooting efficiency that takes into account field goals, 3-point field goals, and free throws.",
      formula: "Points / (2 × (FGA + 0.44 × FTA))",
    },
    tovpct: {
      name: "Turnover Percentage",
      description: "An estimate of turnovers per 100 plays.",
      formula: "100 × Turnovers / (FGA + 0.44 × FTA + Turnovers)",
    },
    ast_to_ratio: {
      name: "Assist to Turnover Ratio",
      description: "The ratio of assists to turnovers.",
      formula: "Assists / Turnovers",
    },
    ft_rate: {
      name: "Free Throw Rate",
      description: "The rate at which a player or team goes to the free throw line relative to field goal attempts.",
      formula: "FTA / FGA",
    },
    possessions: {
      name: "Possessions",
      description: "An estimate of the number of possessions a team has during a game.",
      formula:
        "0.5 × ((Team FGA + 0.4 × Team FTA - 1.07 × (Team ORB / (Team ORB + Opp DRB)) × (Team FGA - Team FGM) + Team TOV) + (Opp FGA + 0.4 × Opp FTA - 1.07 × (Opp ORB / (Opp ORB + Team DRB)) × (Opp FGA - Opp FGM) + Opp TOV))",
    },
    efga: {
      name: "Effective Field Goal Attempts",
      description: "A measure that adjusts field goal attempts to account for the value of three-point shots.",
      formula: "FGA + (0.5 × 3PA)",
    },
  }

  return statMap[id] || { name: "Unknown Stat", description: "No information available for this statistic." }
}

export default function AdvancedStatPage({ params }: { params: { id: string } }) {
  const statId = params.id
  const statDetails = getStatDetails(statId)

  return (
    <div className="flex flex-col min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-700 to-purple-800 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center">{statDetails.name}</h1>
          <p className="text-center mt-2 text-blue-100">Advanced Stat Analysis</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-grow w-full max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-8 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-purple-600 p-4 rounded-full mr-4">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{statDetails.name}</h2>
              <p className="text-gray-300">Advanced Stat ID: {statId}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-gray-300">{statDetails.description}</p>
            </div>

            {statDetails.formula && (
              <div>
                <h3 className="text-xl font-semibold mb-2">Formula</h3>
                <div className="bg-gray-800 bg-opacity-50 p-4 rounded-lg">
                  <code className="text-purple-300">{statDetails.formula}</code>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-2">Team Performance</h3>
              <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg text-center">
                <p className="text-gray-300 mb-2">Current Team Value</p>
                <p className="text-4xl font-bold text-white">
                  {statId === "efg" || statId === "ts"
                    ? "54.8%"
                    : statId === "ast_to_ratio"
                      ? "2.15"
                      : statId === "possessions"
                        ? "98"
                        : "112.4"}
                </p>
              </div>
            </div>

            {/* Placeholder for future chart */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">League Comparison</h3>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 h-64 flex items-center justify-center">
                <p className="text-gray-300">League comparison charts coming soon</p>
              </div>
            </div>

            <div className="p-4 bg-blue-900 bg-opacity-50 rounded-lg mt-6">
              <h3 className="text-xl font-semibold mb-2">Analyst's Note</h3>
              <p className="text-gray-300">
                Advanced statistics like {statDetails.name} provide deeper insights into team and player performance
                beyond traditional box score stats. They help coaches and analysts understand efficiency and
                effectiveness in different aspects of the game.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Basketball Analytics. TFG Guillermo</p>
        </div>
      </footer>
    </div>
  )
}

