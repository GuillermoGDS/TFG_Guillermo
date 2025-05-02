"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, BarChart3, TrendingUp, Award, Star, Activity, Shield, Info, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PlayerPage() {
  const router = useRouter()
  const { id } = useParams()
  const [playerData, setPlayerData] = useState<{ name: string; image: string } | null>(null)
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [advancedStats, setAdvancedStats] = useState<{ name: string; value: string }[]>([])
  const [isAdvancedStatsProvisional, setIsAdvancedStatsProvisional] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"simple" | "advanced">("simple")

  useEffect(() => {
    if (!id) return

    // Obtener la información del jugador desde la base de datos
    const fetchPlayerData = async () => {
      try {
        setLoading(true)

        // Fetch player data
        const res = await fetch(`/api/player/${id}`)
        if (!res.ok) throw new Error("Failed to fetch player data")

        const data = await res.json()
        setPlayerData({ name: data.name, image: data.image })
        setStats(data.averages)

        // Format advanced stats from the main API response
        const formattedAdvancedStats = [
          { name: "Rating Ofensivo (OffRtg)", value: data.averages.OffRtg.toFixed(1) },
          { name: "Porcentaje de Tiro Real (TS%)", value: `${(data.averages.TS * 100).toFixed(1)}%` },
          { name: "Porcentaje Efectivo de Tiro (eFG%)", value: `${(data.averages.eFG * 100).toFixed(1)}%` },
          { name: "Ratio Asistencias/Pérdidas (AST/TO)", value: data.averages.ASTtoTO.toFixed(2) },
          { name: "Porcentaje de Pérdidas (TOV%)", value: `${data.averages.TOVpercent.toFixed(1)}%` },
          { name: "Porcentaje de Uso (USG%)", value: `${data.averages.USG.toFixed(1)}%` },
          {
            name: "Plus-Minus (+/-)",
            value:
              data.averages.PLUS_MINUS > 0
                ? `+${data.averages.PLUS_MINUS.toFixed(1)}`
                : data.averages.PLUS_MINUS.toFixed(1),
          },
        ]

        setAdvancedStats(formattedAdvancedStats)
        setIsAdvancedStatsProvisional(false) // Since these are calculated directly, they're not provisional
      } catch (error) {
        console.error("Error fetching player stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerData()
  }, [id])

  // Función para determinar si un valor estadístico es destacable
  const isHighlightedStat = (name: string, value: string | number) => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value

    if (name.includes("Puntos") && numValue > 15) return true
    if (name.includes("Asistencias") && numValue > 5) return true
    if (name.includes("Rebotes") && numValue > 7) return true
    if (name.includes("Robos") && numValue > 1.5) return true
    if (name.includes("Tapones") && numValue > 1) return true
    if (name.includes("FG%") && numValue > 45) return true
    if (name.includes("3P%") && numValue > 35) return true
    if (name.includes("FT%") && numValue > 80) return true
    if (name.includes("Rating") && numValue > 110) return true
    if (name.includes("Tiro") && numValue > 55) return true

    return false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h1 className="text-2xl font-semibold">Cargando perfil del jugador...</h1>
        </div>
      </div>
    )
  }

  if (!stats || !playerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-[#0a0a2a]">
        <div className="bg-gray-800 rounded-xl p-10 shadow-lg max-w-md w-full text-center">
          <h1 className="text-3xl font-bold mb-6">Jugador no encontrado</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center w-full"
          >
            <ChevronLeft className="mr-2" size={20} />
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  // Combine all simple stats into one array with corrected percentage values
  const allSimpleStats = [
    { name: "Puntos por partido", value: stats.PTS?.toFixed(1) || "0.0" },
    { name: "Asistencias por partido", value: stats.AST?.toFixed(1) || "0.0" },
    { name: "Rebotes por partido", value: stats.REB?.toFixed(1) || "0.0" },
    { name: "Robos por partido", value: stats.STL?.toFixed(1) || "0.0" },
    { name: "Tapones por partido", value: stats.BLK?.toFixed(1) || "0.0" },
    { name: "Pérdidas por partido", value: stats.TOV?.toFixed(1) || "0.0" },
    // Multiplicamos por 100 los valores de porcentaje para mostrarlos correctamente
    { name: "FG%", value: `${(stats.FG_PCT * 100)?.toFixed(1) || "0.0"}%` },
    { name: "3P%", value: `${(stats.FG3_PCT * 100)?.toFixed(1) || "0.0"}%` },
    { name: "FT%", value: `${(stats.FT_PCT * 100)?.toFixed(1) || "0.0"}%` },
    { name: "Plus/Minus", value: stats.PLUS_MINUS?.toFixed(1) || "0.0" },
    { name: "Tiros de campo anotados", value: stats.FGM?.toFixed(1) || "0.0" },
    { name: "Tiros de campo intentados", value: stats.FGA?.toFixed(1) || "0.0" },
    { name: "Tiros libres anotados", value: stats.FTM?.toFixed(1) || "0.0" },
    { name: "Tiros libres intentados", value: stats.FTA?.toFixed(1) || "0.0" },
    { name: "Rebotes ofensivos", value: stats.OREB?.toFixed(1) || "0.0" },
    { name: "Rebotes defensivos", value: stats.DREB?.toFixed(1) || "0.0" },
    { name: "Partidos jugados", value: Object.keys(stats).length.toString() },
  ]

  // Agrupar estadísticas simples por categorías
  const keyStats = allSimpleStats.slice(0, 6) // Primeras 6 estadísticas (puntos, asistencias, rebotes, etc.)
  const shootingStats = allSimpleStats.slice(6, 9) // Porcentajes de tiro
  const detailedStats = allSimpleStats.slice(9) // Resto de estadísticas

  // Determinar las estadísticas destacadas para el jugador
  const getTopStats = () => {
    const sortedStats = [...allSimpleStats].sort((a, b) => {
      const aValue = typeof a.value === "string" ? Number.parseFloat(a.value) : a.value
      const bValue = typeof b.value === "string" ? Number.parseFloat(b.value) : b.value

      // Normalizar los valores para comparación
      const getNormalizedValue = (stat: { name: string; value: string }) => {
        const val = Number.parseFloat(stat.value)
        if (stat.name.includes("Puntos")) return val / 30
        if (stat.name.includes("Asistencias")) return val / 10
        if (stat.name.includes("Rebotes")) return val / 15
        if (stat.name.includes("Robos")) return val / 3
        if (stat.name.includes("Tapones")) return val / 3
        if (stat.name.includes("FG%")) return val / 100
        if (stat.name.includes("3P%")) return val / 100
        if (stat.name.includes("FT%")) return val / 100
        return val
      }

      return getNormalizedValue(b) - getNormalizedValue(a)
    })

    return sortedStats.slice(0, 3)
  }

  const topStats = getTopStats()

  return (
    <div className="min-h-screen text-white bg-[#0a0a2a]">
      {/* Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-800 to-purple-900 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center">
            <Link href="/" className="mr-4">
              <ChevronLeft className="h-8 w-8 text-blue-200 hover:text-white transition-colors" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Perfil del Jugador</h1>
              <p className="text-blue-100 mt-2">Estadísticas detalladas y análisis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Player Profile Card */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl overflow-hidden shadow-xl mb-10">
          <div className="md:flex">
            <div className="md:w-1/3 relative">
              <div className="h-80 md:h-full relative">
                <Image
                  src={playerData.image || "/placeholder.svg?height=400&width=300"}
                  alt={`${playerData.name} - Perfil del Jugador`}
                  fill
                  className="object-cover"
                  unoptimized={playerData.image?.includes(".webp") || playerData.image?.includes(".avif")}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent md:bg-gradient-to-r"></div>
              </div>
            </div>
            <div className="md:w-2/3 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <div className="bg-blue-600/30 px-3 py-1 rounded-full text-sm text-blue-300 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Perfil del Jugador
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">{playerData.name}</h1>

                {/* Top Stats Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {topStats.map((stat, index) => (
                    <div key={index} className="bg-blue-900/50 px-4 py-2 rounded-lg flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 mr-2" />
                      <div>
                        <p className="text-sm text-blue-300">{stat.name}</p>
                        <p className="text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Stats Summary */}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-400" />
                  Métricas Clave de Rendimiento
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Puntos</p>
                    <p className="text-2xl font-bold">{stats.PTS?.toFixed(1) || "0.0"}</p>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Rebotes</p>
                    <p className="text-2xl font-bold">{stats.REB?.toFixed(1) || "0.0"}</p>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Asistencias</p>
                    <p className="text-2xl font-bold">{stats.AST?.toFixed(1) || "0.0"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Tabs */}
        <div className="mb-8">
          <div className="flex bg-gray-800 rounded-lg p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab("simple")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "simple"
                  ? "bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                <span>Estadísticas Básicas</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`flex-1 py-3 text-center rounded-md transition-all duration-300 ${
                activeTab === "advanced"
                  ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <div className="flex items-center justify-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                <span>Estadísticas Avanzadas</span>
              </div>
            </button>
          </div>
        </div>

        {activeTab === "simple" ? (
          <>
            {/* Key Stats Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center">
                  <Award className="mr-3 h-8 w-8 text-yellow-500" />
                  Estadísticas Clave
                </h2>
                <div className="ml-4 h-1 flex-grow bg-yellow-600 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {keyStats.map((stat, index) => {
                  const isHighlighted = isHighlightedStat(stat.name, stat.value)
                  return (
                    <div
                      key={index}
                      className={`${
                        isHighlighted ? "bg-gradient-to-br from-yellow-800 to-yellow-900" : "bg-gray-800"
                      } rounded-xl p-6 shadow-lg transition-all hover:shadow-xl relative overflow-hidden`}
                    >
                      {isHighlighted && (
                        <div className="absolute top-2 right-2">
                          <Star className="h-5 w-5 text-yellow-400" />
                        </div>
                      )}
                      <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                      <p className="text-4xl font-bold">{stat.value}</p>

                      {/* Barra de progreso visual para algunas estadísticas */}
                      {(stat.name.includes("Puntos") ||
                        stat.name.includes("Rebotes") ||
                        stat.name.includes("Asistencias")) && (
                        <div className="w-full bg-gray-700 h-2 rounded-full mt-4 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-yellow-500"
                            style={{
                              width: `${Math.min(
                                stat.name.includes("Puntos")
                                  ? Number.parseFloat(stat.value) * 3
                                  : stat.name.includes("Rebotes")
                                    ? Number.parseFloat(stat.value) * 5
                                    : Number.parseFloat(stat.value) * 8,
                                100,
                              )}%`,
                            }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Shooting Stats Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center">
                  <BarChart3 className="mr-3 h-8 w-8 text-green-500" />
                  Eficiencia de Tiro
                </h2>
                <div className="ml-4 h-1 flex-grow bg-green-600 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shootingStats.map((stat, index) => {
                  // Extraer el valor numérico sin el símbolo %
                  const percentage = Number.parseFloat(stat.value)
                  const isHighlighted = isHighlightedStat(stat.name, percentage)

                  return (
                    <div
                      key={index}
                      className={`${
                        isHighlighted ? "bg-gradient-to-br from-green-800 to-blue-900" : "bg-gray-800"
                      } rounded-xl p-6 shadow-lg transition-all hover:shadow-xl relative`}
                    >
                      {isHighlighted && (
                        <div className="absolute top-2 right-2">
                          <Star className="h-5 w-5 text-green-400" />
                        </div>
                      )}
                      <p className="text-lg text-gray-400 mb-3">{stat.name}</p>
                      <p className="text-4xl font-bold">{stat.value}</p>

                      {/* Circular progress for percentages */}
                      <div className="mt-4 relative h-4 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.min(Number.parseFloat(stat.value), 100)}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-right text-gray-400">
                        Promedio de la liga: {stat.name === "FG%" ? "45.0%" : stat.name === "3P%" ? "35.0%" : "75.0%"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detailed Stats Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold">Estadísticas Detalladas</h2>
                <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {detailedStats.map((stat, index) => (
                  <div key={index} className="bg-gray-800 rounded-xl p-5 shadow-lg transition-all hover:bg-gray-700">
                    <p className="text-sm text-gray-400 mb-2">{stat.name}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Advanced Stats Section */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold flex items-center">
                  <TrendingUp className="mr-3 h-8 w-8 text-purple-500" />
                  Análisis Avanzado
                </h2>
                <div className="ml-4 h-1 flex-grow bg-purple-600 rounded-full"></div>
                {isAdvancedStatsProvisional && (
                  <div className="ml-4 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full">
                    Datos provisionales
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {advancedStats.map((stat, index) => {
                  const isHighlighted = isHighlightedStat(stat.name, stat.value)
                  return (
                    <div
                      key={index}
                      className={`${
                        isHighlighted
                          ? "bg-gradient-to-br from-purple-800 to-indigo-900"
                          : "bg-gradient-to-br from-gray-800 to-gray-700"
                      } rounded-xl p-6 shadow-lg transition-all hover:opacity-90 relative`}
                    >
                      {isHighlighted && (
                        <div className="absolute top-2 right-2">
                          <Star className="h-5 w-5 text-purple-400" />
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <p className="text-lg text-gray-300 mb-3">{stat.name}</p>
                        <div className="relative group">
                          <Info className="h-4 w-4 text-gray-400 cursor-help" />
                          <div className="absolute right-0 w-48 p-2 bg-gray-900 rounded-md shadow-lg text-xs hidden group-hover:block z-10">
                            {stat.name.includes("Rating Ofensivo") && "Puntos producidos por 100 posesiones"}
                            {stat.name.includes("Porcentaje de Tiro Real") &&
                              "Porcentaje de tiro que tiene en cuenta tiros de campo, triples y tiros libres"}
                            {stat.name.includes("Porcentaje Efectivo") &&
                              "Porcentaje de tiro de campo ajustado para triples"}
                            {stat.name.includes("Ratio Asistencias") && "Proporción de asistencias a pérdidas"}
                            {stat.name.includes("Porcentaje de Pérdidas") && "Pérdidas por cada 100 jugadas"}
                            {stat.name.includes("Porcentaje de Uso") &&
                              "Porcentaje de jugadas del equipo utilizadas por el jugador"}
                            {stat.name.includes("Plus-Minus") &&
                              "Diferencial de puntos del equipo cuando el jugador está en pista"}
                          </div>
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{stat.value}</p>

                      {/* Progress bar for percentage stats */}
                      {stat.name.includes("%") && (
                        <div className="w-full bg-gray-700 h-2 rounded-full mt-4 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500"
                            style={{ width: `${Math.min(Number.parseFloat(stat.value), 100)}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Advanced Analysis Insights */}
            <div className="mb-10">
              <div className="flex items-center mb-6">
                <h2 className="text-3xl font-bold">Análisis de Rendimiento</h2>
                <div className="ml-4 h-1 flex-grow bg-blue-600 rounded-full"></div>
              </div>

              <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold mb-4">Análisis del Jugador</h3>
                <p className="text-gray-300 mb-4">
                  Basado en las métricas avanzadas, {playerData.name} muestra las siguientes características de
                  rendimiento:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-2 flex items-center">
                      <Award className="h-5 w-5 mr-2 text-yellow-500" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-2 text-gray-300">
                      {Number.parseFloat(stats.PTS?.toFixed(1) || "0") > 15 && (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Gran capacidad anotadora con {stats.PTS?.toFixed(1)} puntos por partido
                        </li>
                      )}
                      {Number.parseFloat(stats.AST?.toFixed(1) || "0") > 5 && (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Excelente creación de juego con {stats.AST?.toFixed(1)} asistencias por partido
                        </li>
                      )}
                      {Number.parseFloat(stats.REB?.toFixed(1) || "0") > 7 && (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Fuerte presencia en el rebote con {stats.REB?.toFixed(1)} rebotes por partido
                        </li>
                      )}
                      {Number.parseFloat((stats.FG_PCT * 100)?.toFixed(1) || "0") > 45 && (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Tirador eficiente con {(stats.FG_PCT * 100)?.toFixed(1)}% en tiros de campo
                        </li>
                      )}
                      {/* Fallback if no specific strengths are identified */}
                      {!(
                        Number.parseFloat(stats.PTS?.toFixed(1) || "0") > 15 ||
                        Number.parseFloat(stats.AST?.toFixed(1) || "0") > 5 ||
                        Number.parseFloat(stats.REB?.toFixed(1) || "0") > 7 ||
                        Number.parseFloat((stats.FG_PCT * 100)?.toFixed(1) || "0") > 45
                      ) && (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Contribución equilibrada en múltiples categorías estadísticas
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-2 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                      Áreas de Desarrollo
                    </h4>
                    <ul className="space-y-2 text-gray-300">
                      {Number.parseFloat(stats.TOV?.toFixed(1) || "0") > 3 && (
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          La seguridad del balón podría mejorar ({stats.TOV?.toFixed(1)} pérdidas por partido)
                        </li>
                      )}
                      {Number.parseFloat((stats.FG3_PCT * 100)?.toFixed(1) || "0") < 33 && (
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Eficiencia en tiros de tres puntos ({(stats.FG3_PCT * 100)?.toFixed(1)}%)
                        </li>
                      )}
                      {Number.parseFloat((stats.FT_PCT * 100)?.toFixed(1) || "0") < 75 && (
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Consistencia en tiros libres ({(stats.FT_PCT * 100)?.toFixed(1)}%)
                        </li>
                      )}
                      {/* Fallback if no specific development areas are identified */}
                      {!(
                        Number.parseFloat(stats.TOV?.toFixed(1) || "0") > 3 ||
                        Number.parseFloat((stats.FG3_PCT * 100)?.toFixed(1) || "0") < 33 ||
                        Number.parseFloat((stats.FT_PCT * 100)?.toFixed(1) || "0") < 75
                      ) && (
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Continuar el desarrollo como jugador completo
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Performance Chart Section */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <h2 className="text-3xl font-bold">Visualización de Rendimiento</h2>
            <div className="ml-4 h-1 flex-grow bg-yellow-600 rounded-full"></div>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Radar Analysis Card */}
              <div className="bg-gray-900/50 rounded-xl p-6 relative overflow-hidden">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-600 rounded-full p-2 mr-3">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Análisis Radar del Jugador</h3>
                </div>

                <p className="text-gray-300 mb-6">
                  Visualiza el rendimiento de {playerData?.name} en múltiples categorías estadísticas en un gráfico
                  radar interactivo.
                </p>

                {/* Visual elements suggesting a radar chart */}
                <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
                  <div className="absolute top-1/4 right-1/4 h-3 w-3 rounded-full bg-blue-500"></div>
                  <div className="absolute top-1/2 right-1/3 h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="absolute bottom-1/3 right-1/4 h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="absolute bottom-1/4 right-1/2 h-3 w-3 rounded-full bg-purple-500"></div>
                  <div className="absolute top-1/3 right-1/2 h-3 w-3 rounded-full bg-red-500"></div>
                </div>

                <Link
                  href="/analytics/idea-3"
                  className="inline-flex items-center bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Ver Análisis Radar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>

              {/* Performance Metrics Card */}
              <div className="bg-gray-900/50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-600 rounded-full p-2 mr-3">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Métricas de Rendimiento</h3>
                </div>

                <div className="space-y-6 mb-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Impacto Ofensivo</span>
                      <span className="text-green-400 font-medium">
                        {Number.parseFloat(stats?.PTS?.toFixed(1) || "0") > 20
                          ? "Élite"
                          : Number.parseFloat(stats?.PTS?.toFixed(1) || "0") > 15
                            ? "Fuerte"
                            : "Promedio"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                        style={{
                          width: `${Math.min(Number.parseFloat(stats?.PTS?.toFixed(1) || "0") * 3, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Creación de Juego</span>
                      <span className="text-blue-400 font-medium">
                        {Number.parseFloat(stats?.AST?.toFixed(1) || "0") > 7
                          ? "Élite"
                          : Number.parseFloat(stats?.AST?.toFixed(1) || "0") > 4
                            ? "Fuerte"
                            : "Promedio"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{
                          width: `${Math.min(Number.parseFloat(stats?.AST?.toFixed(1) || "0") * 8, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Eficiencia de Tiro</span>
                      <span className="text-yellow-400 font-medium">
                        {Number.parseFloat((stats?.FG_PCT * 100)?.toFixed(1) || "0") > 50
                          ? "Élite"
                          : Number.parseFloat((stats?.FG_PCT * 100)?.toFixed(1) || "0") > 45
                            ? "Fuerte"
                            : "Promedio"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                        style={{
                          width: `${Math.min(Number.parseFloat((stats?.FG_PCT * 100)?.toFixed(1) || "0"), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-gray-900 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Análisis de Baloncesto. TFG Guillermo</p>
        </div>
      </footer>
    </div>
  )
}
