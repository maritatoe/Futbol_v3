import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Calendar, ClipboardCheck, Trash2, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Historial() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // States for delete functionality
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    fetchPartidos()
  }, [])

  async function fetchPartidos() {
    // Nested query: partido con todos sus equipos y datos del jugador
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        id, fecha, formacion, goles_barsa, goles_juve,
        equipos_partido (
          equipo, posicion_asignada,
          jugadores ( nombre, rating )
        ),
        rendimiento ( id )
      `)
      .order('fecha', { ascending: false })

    if (!error && data) {
      setPartidos(data)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!matchToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('partidos').delete().eq('id', matchToDelete)
      if (!error) {
        setPartidos(prev => prev.filter(p => p.id !== matchToDelete))
        setMatchToDelete(null)
        setNotification('Partido eliminado')
        setTimeout(() => setNotification(null), 3000)
      } else {
        console.error('Error deleting match:', error)
        alert('Hubo un error al eliminar el partido')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) return <div className="p-4 text-center">Cargando historial...</div>

  return (
    <div className="p-4 pb-24 relative">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Historial de Partidos</h2>
      
      <div className="space-y-4">
        {partidos.map((p) => {
          const isExpanded = expandedId === p.id
          const isPuntuado = p.rendimiento && p.rendimiento.length > 0
          
          const eqA = p.equipos_partido.filter((e:any) => e.equipo === 'A')
          const eqB = p.equipos_partido.filter((e:any) => e.equipo === 'B')

          return (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <button 
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                className="w-full text-left p-4 flex justify-between items-center bg-white hover:bg-gray-50 focus:outline-none"
              >
                <div className="flex gap-3 items-center">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 capitalize">
                      {p.fecha ? format(new Date(p.fecha), "EEEE d 'de' MMMM", { locale: es }) : 'Desconocida'}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 rounded font-medium inline-block">
                        Formación: {p.formacion}
                      </span>
                      {isPuntuado ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 rounded font-medium inline-block">✓ Puntuado</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 rounded font-medium inline-block">Pendiente</span>
                      )}
                    </div>
                    {isPuntuado && p.goles_barsa != null && p.goles_juve != null ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-sm font-black text-blue-700">Barsa {p.goles_barsa}</span>
                        <span className="text-xs text-gray-400 font-bold">-</span>
                        <span className="text-sm font-black text-orange-700">{p.goles_juve} Juve</span>
                      </div>
                    ) : (
                      <div className="mt-1.5">
                        <span className="text-sm font-semibold text-gray-400">Barsa vs Juve</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-gray-400 flex flex-col items-center gap-2">
                  {!isPuntuado && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation()
                        setMatchToDelete(p.id)
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors mb-1"
                      title="Cancelar Partido"
                    >
                      <Trash2 size={20} />
                    </div>
                  )}
                  {isExpanded ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                </div>
              </button>

              <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="p-4 border-t bg-gray-50 flex gap-4">
                  {/* EQ A */}
                  <div className="flex-1">
                    <h5 className="font-bold text-blue-800 text-sm mb-2 border-b-2 border-blue-200 pb-1">Barsa</h5>
                    <ul className="space-y-1">
                      {eqA.map((j:any, idx:number) => (
                        <li key={idx} className="text-xs flex justify-between">
                          <span className="font-semibold text-gray-500 w-8">{j.posicion_asignada}</span>
                          <span className="truncate flex-1 font-medium">{j.jugadores.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-[1px] bg-gray-200"></div>
                  {/* EQ B */}
                  <div className="flex-1">
                    <h5 className="font-bold text-orange-800 text-sm mb-2 border-b-2 border-orange-200 pb-1">Juve</h5>
                    <ul className="space-y-1">
                      {eqB.map((j:any, idx:number) => (
                        <li key={idx} className="text-xs flex justify-between">
                          <span className="font-semibold text-gray-500 w-8">{j.posicion_asignada}</span>
                          <span className="truncate flex-1 font-medium">{j.jugadores.nombre}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {!isPuntuado && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    <button
                      onClick={() => navigate('/puntuar/' + p.id)}
                      className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <ClipboardCheck size={20} /> Cargar Resultado y Puntuaciones
                    </button>
                    <button
                      onClick={() => setMatchToDelete(p.id)}
                      className="w-full bg-white hover:bg-red-50 text-red-600 font-semibold py-3 rounded-xl border-2 border-red-100 hover:border-red-200 flex items-center justify-center gap-2 transition-all"
                    >
                      <Trash2 size={20} /> Cancelar Partido
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {partidos.length === 0 && (
          <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-sm border border-dashed">
            Aún no hay partidos jugados.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {matchToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cancelar Partido</h3>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              ¿Querés eliminar este partido? Como aún no fue puntuado, esto no afectará el ranking de los jugadores.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchToDelete(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Trash2 size={16} className="text-red-400" />
          <span className="font-medium">{notification}</span>
        </div>
      )}
    </div>
  )
}
