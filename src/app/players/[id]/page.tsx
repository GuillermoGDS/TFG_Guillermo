import { notFound } from "next/navigation"
import Image from "next/image"

const players = [
  { name: "LeBron James", image: "/lebron-james.png", id: "lebron-james" },
  { name: "Stephen Curry", image: "/stephen-curry.png", id: "stephen-curry" },
  { name: "Kevin Durant", image: "/kevin-durant.png", id: "kevin-durant" },
  { name: "Luka Doncic", image: "/luka-doncic.png", id: "luka-doncic" },
  { name: "Giannis Antetokounmpo", image: "/giannis-antetokounmpo.webp", id: "giannis-antetokounmpo" },
  { name: "Nikola Jokic", image: "/nikola-jokic.jpg", id: "nikola-jokic" },
]

export default function PlayerPage({ params }: { params: { id: string } }) {
  const player = players.find((p) => p.id === params.id)

  if (!player) {
    notFound()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-white bg-[#0a0a2a]">
      <h1 className="text-3xl font-bold mb-4">{player.name}</h1>
      <Image
        src={player.image || "/placeholder.svg"}
        alt={player.name}
        width={300}
        height={400}
        className="rounded-md"
      />
      {/* Add more player details here */}
    </div>
  )
}

