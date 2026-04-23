import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'
import { armarEquiposInteligente, EquipoArmado } from '../lib/teamBuilderLogic'
import { Users, Shuffle, Save, AlertTriangle, Zap, X } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

type Jugador = Database['public']['Tables']['jugadores']['Row']

export default function ArmarPartido() {
  const [activos, setActivos] = useState<Jugador[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [restricciones, setRestricciones] = useState<Array<[string, string]>>([])
  const [modoRestriccion, setModoRestriccion] = useState(false)
  const [restriccionParcial, setRestriccionParcial] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [resultado, setResultado] = useState<{ equipoA: EquipoArmado, equipoB: EquipoArmado, diferencia: number } | null>(null)
  const [buildError, setBuildError] = useState<string | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    fetchActivos()
  }, [])

  async function fetchActivos() {
    const { data } = await supabase.from('jugadores').select('*').eq('activo', true).eq('is_archived', false).order('rating', { ascending: false })
    if (data) {
      setActivos(data)
    } else {
      setActivos([])
    }
    setLoading(false)
  }

  function toggleSeleccion(id: string) {
    if (modoRestriccion) {
      if (!seleccionados.has(id)) return // Only pair already selected players
      if (restriccionParcial === id) {
        setRestriccionParcial(null) // unselect
      } else if (!restriccionParcial) {
        setRestriccionParcial(id)
      } else {
        // Form a pair
        setRestricciones([...restricciones, [restriccionParcial, id]])
        setRestriccionParcial(null)
      }
      return
    }

    const newSet = new Set(seleccionados)
    if (newSet.has(id)) {
      newSet.delete(id)
      // Remove any restrictions involving this player
      setRestricciones(restricciones.filter(r => r[0] !== id && r[1] !== id))
    } else {
      newSet.add(id)
    }
    setSeleccionados(newSet)
    setResultado(null)
  }

  function armar(variacion = false) {
    setBuildError(null)
    const justPlayers = activos.filter(j => seleccionados.has(j.id))
    try {
      const res = armarEquiposInteligente(justPlayers, variacion, restricciones)
      setResultado(res)
    } catch (err: any) {
      setBuildError(err.message)
    }
  }

  async function guardarPartido() {
    if (!resultado) return
    const formacion = `${seleccionados.size / 2}v${seleccionados.size / 2}`
    const { data: partido, error: pErr } = await supabase.from('partidos').insert({
      formacion
    }).select().single()

    if (pErr || !partido) return alert('Error al crear partido')

    const insertA = resultado.equipoA.jugadores.map(j => ({
      partido_id: partido.id,
      jugador_id: j.id,
      equipo: 'A' as const,
      posicion_asignada: j.posicion_asignada
    }))

    const insertB = resultado.equipoB.jugadores.map(j => ({
      partido_id: partido.id,
      jugador_id: j.id,
      equipo: 'B' as const,
      posicion_asignada: j.posicion_asignada
    }))

    const { error: eqErr } = await supabase.from('equipos_partido').insert([...insertA, ...insertB])

    if (eqErr) alert('Error guardando jugadores: ' + eqErr.message)
    else {
      // Limpiar estado para evitar duplicados si el usuario vuelve atrás
      setSeleccionados(new Set())
      setResultado(null)
      setBuildError(null)
      alert('¡Partido guardado con éxito!')
      navigate('/historial')
    }
  }

  if (loading) return <div className="p-4 text-center">Cargando...</div>

  return (
    <div className="p-4 pb-24">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">ARMAR PARTIDO</h2>

        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-gray-700 text-sm">Seleccioná los Jugadores</span>
          <div className={clsx("font-bold text-sm px-3 py-1 rounded-xl text-center", seleccionados.size > 0 && seleccionados.size % 2 === 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
            <div>Seleccionados: {seleccionados.size}</div>
            <div className="text-xs opacity-80">{seleccionados.size > 0 && seleccionados.size % 2 === 0 ? `(${seleccionados.size / 2}v${seleccionados.size / 2})` : '(Debe ser par)'}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto p-1">
          {activos.map(j => {
            const isRestricted = restricciones.some(r => r.includes(j.id))
            return (
              <div
                key={j.id}
                onClick={() => toggleSeleccion(j.id)}
                className={clsx(
                  "p-2 rounded-xl text-center border-2 transition-all cursor-pointer font-medium text-xs sm:text-sm relative overflow-hidden",
                  seleccionados.has(j.id) ? "border-blue-500 bg-blue-50 text-blue-800" : "border-gray-200 bg-white hover:border-blue-300",
                  modoRestriccion && !seleccionados.has(j.id) && "opacity-40 grayscale cursor-not-allowed",
                  modoRestriccion && seleccionados.has(j.id) && restriccionParcial === j.id && "ring-4 ring-yellow-400 bg-yellow-100 border-yellow-500",
                  isRestricted && "border-yellow-400 border-dashed"
                )}
              >
                {isRestricted && <div className="absolute top-0 right-0 bg-yellow-400 text-white p-0.5 rounded-bl-lg shadow-sm"><Zap size={10} /></div>}
                <div className="line-clamp-1">{j.nombre}</div>
                <div className="text-[10px] text-gray-500">{j.posiciones[0]} | ★{j.rating.toFixed(1)}</div>
              </div>
            )
          })}
        </div>

        {buildError && (
          <div className="p-3 bg-red-50 text-red-700 border-l-4 border-red-500 rounded flex gap-2 items-center text-sm mb-4">
            <AlertTriangle size={18} /> {buildError}
          </div>
        )}

        <div className="my-4">
          <button
            onClick={() => {
              setModoRestriccion(!modoRestriccion);
              setRestriccionParcial(null);
            }}
            className={clsx("flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold border transition-colors shadow-sm", modoRestriccion ? "bg-yellow-100 text-yellow-800 border-yellow-400" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50")}
          >
            <Zap size={18} /> {modoRestriccion ? "Finalizar Separaciones" : "Definir Separaciones (No juegan juntos)"}
          </button>

          {restricciones.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {restricciones.map((r, idx) => {
                const p1 = activos.find(a => a.id === r[0])?.nombre || '?'
                const p2 = activos.find(a => a.id === r[1])?.nombre || '?'
                return (
                  <div key={idx} className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-800 px-2 py-1 rounded-lg text-xs font-semibold shadow-sm">
                    <span>{p1}</span> <Zap size={12} className="text-yellow-500" /> <span>{p2}</span>
                    <button onClick={() => setRestricciones(restricciones.filter((_, i) => i !== idx))} className="ml-1 p-0.5 hover:bg-yellow-200 rounded-full text-yellow-600 transition-colors"><X size={12} /></button>
                  </div>
                )
              })}
              <button onClick={() => setRestricciones([])} className="text-xs text-gray-500 underline ml-2 font-medium">Limpiar Todas</button>
            </div>
          )}
          {modoRestriccion && (
            <div className="text-sm text-yellow-700 mt-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100 italic">
              {restriccionParcial ? "Tocá al segundo jugador para mandarlo a la Juve..." : "Tocá a dos jugadores para evitar que jueguen juntos, el primero que toques va al Barsa y el segundo a la Juve."}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => armar()}
            className="flex-1 bg-blue-600 active:bg-blue-700 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            disabled={modoRestriccion}
          >
            <Users size={20} /> Generar Equipos
          </button>
          <button
            onClick={() => armar(true)}
            className="bg-purple-600 active:bg-purple-700 text-white p-3 rounded-xl px-4 shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            title="Añadir variación en los ratings para cambiar equipos"
            disabled={modoRestriccion}
          >
            <Shuffle size={20} />
          </button>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">

          <div className={clsx("p-3 rounded-xl text-center font-bold border flex items-center justify-center gap-2",
            resultado.diferencia <= 2 ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
          )}>
            {resultado.diferencia <= 2 ? "¡Equipos Muy Parejos!" : "Equipos algo desbalanceados"}
            <span className="text-sm font-normal">(Dif: {resultado.diferencia.toFixed(2)})</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Equipo A */}
            <div className="bg-white rounded-2xl p-4 shadow-md border-t-8 border-t-blue-500 relative">
              <h3 className="font-black text-xl text-blue-900 absolute -top-4 bg-white px-3 rounded-full border border-blue-200 shadow-sm left-1/2 -translate-x-1/2">Barsa</h3>
              <div className="text-center text-xs font-bold text-gray-500 mt-2 mb-3 bg-gray-50 rounded-lg py-1">Overall: ★{resultado.equipoA.totalRating}</div>

              <div className="space-y-2">
                {resultado.equipoA.jugadores.map((j) => (
                  <div key={j.id} className="flex justify-between items-center text-sm border-b pb-1">
                    <span className="font-bold text-gray-700">{j.posicion_asignada}</span>
                    <span className="truncate ml-2 flex-1 text-gray-900">{j.nombre}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipo B */}
            <div className="bg-white rounded-2xl p-4 shadow-md border-t-8 border-t-orange-500 relative">
              <h3 className="font-black text-xl text-orange-900 absolute -top-4 bg-white px-3 rounded-full border border-orange-200 shadow-sm left-1/2 -translate-x-1/2">Juve</h3>
              <div className="text-center text-xs font-bold text-gray-500 mt-2 mb-3 bg-gray-50 rounded-lg py-1">Overall: ★{resultado.equipoB.totalRating}</div>

              <div className="space-y-2">
                {resultado.equipoB.jugadores.map((j) => (
                  <div key={j.id} className="flex justify-between items-center text-sm border-b pb-1">
                    <span className="font-bold text-gray-700">{j.posicion_asignada}</span>
                    <span className="truncate ml-2 flex-1 text-gray-900">{j.nombre}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button onClick={guardarPartido} className="w-full mt-4 bg-green-500 text-white font-bold p-4 rounded-xl shadow-lg border-b-4 border-green-700 active:translate-y-1 active:border-b-0 flex justify-center items-center gap-2">
            <Save size={20} /> Confirmar y Guardar Partido
          </button>
        </div>
      )}

    </div>
  )
}
