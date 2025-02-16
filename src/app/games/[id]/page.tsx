import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

const games = [
  { opponent: "Golden State Warriors", date: "2023-11-15", id: "lakers-vs-warriors-20231115" },
  { opponent: "Boston Celtics", date: "2023-11-18", id: "lakers-vs-celtics-20231118" },
  { opponent: "Miami Heat", date: "2023-11-22", id: "lakers-vs-heat-20231122" },
  { opponent: "Phoenix Suns", date: "2023-11-26", id: "lakers-vs-suns-20231126" },
  { opponent: "Denver Nuggets", date: "2023-11-30", id: "lakers-vs-nuggets-20231130" },
  { opponent: "Dallas Mavericks", date: "2023-12-04", id: "lakers-vs-mavericks-20231204" },
  { opponent: "Milwaukee Bucks", date: "2023-12-08", id: "lakers-vs-bucks-20231208" },
  { opponent: "Brooklyn Nets", date: "2023-12-12", id: "lakers-vs-nets-20231212" },
]

async function getGameById(id: string) {
  // Simulate an async operation
  await new Promise((resolve) => setTimeout(resolve, 100))
  return games.find((g) => g.id === id)
}

export default async function GamePage({ params }: { params: { id: string } }) {
  const game = await getGameById(params.id)

  if (!game) {
    notFound()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-white bg-[#0a0a2a]">
      <Link
        href="/"
        className="absolute top-4 left-4 bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
      >
        ← Back to Home
      </Link>
      <div className="bg-gray-800 rounded-lg p-8 shadow-lg max-w-2xl w-full">
        <div className="flex items-center justify-center mb-6">
          <Image src="/lakers-logo.png" alt="Lakers Logo" width={80} height={80} className="mr-4" />
          <h1 className="text-3xl font-bold text-center">Los Angeles Lakers vs {game.opponent}</h1>
        </div>
        <p className="text-xl text-center mb-6">
          {new Date(game.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Los Angeles Lakers</h2>
            <p>Home Team</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-2">{game.opponent}</h2>
            <p>Away Team</p>
          </div>
        </div>
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Game Details</h3>
          <p>Venue: Staples Center, Los Angeles</p>
          <p>Time: 7:30 PM PST</p>
          <p>TV Broadcast: ESPN</p>
        </div>
      </div>
    </div>
  )
}


