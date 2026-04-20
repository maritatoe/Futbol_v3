import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronUp, Calendar, ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Historial() {
  const [partidos, setPartidos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchPartidos()
  }, [])

  async function fetchPartidos() {
    // Nested query: partido con todos sus equipos y datos del jugador
    const { data, error } = await supabase
      .from('partidos')
      .select(`
        id, fecha, formacion,
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

  if (loading) return <div className="p-4 text-center">Cargando historial...</div>

  return (
    <div className="p-4 pb-24">
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
                  </div>
                </div>
                <div className="text-gray-400">
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
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => navigate('/puntuar/' + p.id)}
                      className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <ClipboardCheck size={20} /> Cargar Puntuaciones
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
    </div>
  )
}
