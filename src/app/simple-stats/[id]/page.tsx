import Link from "next/link"
import { ArrowLeft, BarChart3 } from "lucide-react"

// This would normally come from your API
const getStatDetails = (id: string) => {
  const statMap: Record<string, { name: string; description: string; formula?: string }> = {
    ppg: {
      name: "Points Per Game",
      description: "The average number of points scored by a player or team per game.",
      formula: "Total Points / Games Played",
    },
    fg_percentage: {
      name: "Field Goal Percentage",
      description: "The percentage of field goal attempts that are made.",
      formula: "(Field Goals Made / Field Goals Attempted) × 100",
    },
    three_point_percentage: {
      name: "3-Point Percentage",
      description: "The percentage of three-point field goal attempts that are made.",
      formula: "(3-Point Field Goals Made / 3-Point Field Goals Attempted) × 100",
    },
    ft_percentage: {
      name: "Free Throw Percentage",
      description: "The percentage of free throw attempts that are made.",
      formula: "(Free Throws Made / Free Throws Attempted) × 100",
    },
    total_rebounds: {
      name: "Total Rebounds",
      description: "The total number of rebounds (offensive + defensive) collected by a player or team per game.",
    },
    offensive_rebounds: {
      name: "Offensive Rebounds",
      description: "The number of rebounds collected on the offensive end of the court per game.",
    },
    defensive_rebounds: {
      name: "Defensive Rebounds",
      description: "The number of rebounds collected on the defensive end of the court per game.",
    },
    apg: {
      name: "Assists Per Game",
      description: "The average number of assists recorded by a player or team per game.",
    },
    spg: {
      name: "Steals Per Game",
      description: "The average number of steals recorded by a player or team per game.",
    },
    bpg: {
      name: "Blocks Per Game",
      description: "The average number of blocks recorded by a player or team per game.",
    },
    turnovers: {
      name: "Turnovers",
      description: "The average number of turnovers committed by a player or team per game.",
    },
    fouls: {
      name: "Fouls",
      description: "The average number of personal fouls committed by a player or team per game.",
    },
  }

  return statMap[id] || { name: "Unknown Stat", description: "No information available for this statistic." }
}

export default function SimpleStatPage({ params }: { params: { id: string } }) {
  const statId = params.id
  const statDetails = getStatDetails(statId)

  return (
    <div className="flex flex-col min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center">{statDetails.name}</h1>
          <p className="text-center mt-2 text-blue-100">Simple Stat Analysis</p>
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
        <div className="bg-gray-800 rounded-xl p-8 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="bg-green-600 p-4 rounded-full mr-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">{statDetails.name}</h2>
              <p className="text-gray-400">Simple Stat ID: {statId}</p>
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
                <div className="bg-gray-700 p-4 rounded-lg">
                  <code className="text-green-400">{statDetails.formula}</code>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-2">Team Performance</h3>
              <div className="bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-400 mb-2">Current Team Average</p>
                <p className="text-4xl font-bold text-white">
                  {statId === "fg_percentage" || statId === "three_point_percentage" || statId === "ft_percentage"
                    ? "45.2%"
                    : "18.7"}
                </p>
              </div>
            </div>

            {/* Placeholder for future chart */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Trend Analysis</h3>
              <div className="bg-gray-700 rounded-lg p-4 h-64 flex items-center justify-center">
                <p className="text-gray-400">Detailed charts and analysis coming soon</p>
              </div>
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

