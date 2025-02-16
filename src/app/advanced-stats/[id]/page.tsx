import Link from "next/link"

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

export default function AdvancedStatPage({ params }: { params: { id: string } }) {
  const stat = advancedStats.find((s) => s.id === params.id)

  if (!stat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <h1 className="text-3xl font-bold mb-4">Advanced Stat not found</h1>
        <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Go back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
      <div className="w-full max-w-4xl mx-auto px-4">
        <Link
          href="/"
          className="inline-block mb-8 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          ← Back to home
        </Link>
        <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-4">{stat.name}</h1>
          <p className="text-6xl font-bold text-blue-400">{stat.value}</p>
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">About this advanced stat</h2>
            <p className="text-gray-300">
              This is where you would provide more detailed information about {stat.name.toLowerCase()}. You could
              include things like:
            </p>
            <ul className="list-disc list-inside mt-4 text-gray-300">
              <li>How it's calculated</li>
              <li>Why it's important for player evaluation</li>
              <li>League averages and what's considered good/great</li>
              <li>Historical context and records</li>
              <li>How it compares to other advanced metrics</li>
              <li>Top players in this category</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

