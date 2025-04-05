import Link from "next/link"
import { ChevronLeft, Home } from "lucide-react"

export default function Idea5Page() {
  return (
    <div className="flex flex-col items-center min-h-screen text-white bg-[#0a0a2a] py-16 px-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-700 px-5 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            <Home className="mr-2 h-5 w-5" />
            Volver a Inicio
          </Link>
        </div>
        <div className="bg-gradient-to-br from-blue-700 to-purple-800 rounded-xl p-10 shadow-xl">
          <h1 className="text-4xl font-bold mb-6 text-center">Idea 5</h1>
          <div className="h-1 w-32 bg-blue-400 mx-auto mb-10 rounded-full"></div>
          <p className="text-xl text-center">Próximamente podremos ver aquí la idea 5.</p>
          <div className="mt-12 flex justify-center">
            <div className="inline-block bg-white bg-opacity-20 px-6 py-3 rounded-lg text-lg">En desarrollo</div>
          </div>
        </div>
      </div>
    </div>
  )
}
