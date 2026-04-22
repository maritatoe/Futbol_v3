import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { recalcularYActualizarRating } from '../lib/ratingLogic'
import { CheckCircle2, ArrowLeftRight } from 'lucide-react'

export default function PuntuarPartido() {
  const { partidoId } = useParams()
  const navigate = useNavigate()
  const [jugadores, setJugadores] = useState<any[]>([])
  const [puntajes, setPuntajes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [golesBarsa, setGolesBarsa] = useState<number | string>('')
  const [golesJuve, setGolesJuve] = useState<number | string>('')

  useEffect(() => {
    fetchParticipantes()
  }, [])

  async function fetchParticipantes() {
    if (!partidoId) return
    const { data: partido, error } = await supabase
      .from('partidos')
      .select('fecha, formacion, equipos_partido(jugador_id, equipo, posicion_asignada, jugadores(nombre, rating))')
      .eq('id', partidoId)
      .single()

    if (!error && partido && partido.equipos_partido) {
      setJugadores(partido.equipos_partido)
      // Initialize scores at each player's current rating rounded to nearest integer
      const initScores: any = {}
      partido.equipos_partido.forEach((ep: any) => {
        initScores[ep.jugador_id] = Math.round(ep.jugadores?.rating ?? 5)
      })
      setPuntajes(initScores)
    }
    setLoading(false)
  }

  function swapJugador(jugadorId: string) {
    setJugadores(prev => prev.map(j => {
      if (j.jugador_id === jugadorId) {
        return { ...j, equipo: j.equipo === 'A' ? 'B' : 'A' }
      }
      return j
    }))
  }

  async function guardarPuntajes() {
    setSaving(true)
    try {
      const inserts = Object.keys(puntajes).map(jid => ({
        partido_id: partidoId!,
        jugador_id: jid,
        puntaje: puntajes[jid]
      }))

      // Guardar rendimientos
      const { error: errInsert } = await supabase.from('rendimiento').insert(inserts)
      if (errInsert) {
        // Podría fallar por UNIQUE constraint si ya se puntuaron
        if (errInsert.code === '23505') {
          alert('Este partido ya fue puntuado.')
          navigate('/ranking')
          return
        }
        throw errInsert
      }

      // Guardar marcador del partido
      await supabase.from('partidos').update({
        goles_barsa: Number(golesBarsa) || 0,
        goles_juve: Number(golesJuve) || 0
      }).eq('id', partidoId!)

      // Actualizar composición de equipos (por si hubo swaps)
      await Promise.all(jugadores.map(j =>
        supabase.from('equipos_partido')
          .update({ equipo: j.equipo })
          .eq('partido_id', partidoId!)
          .eq('jugador_id', j.jugador_id)
      ))

      // Recalcular ratings de cada participante
      await Promise.all(Object.keys(puntajes).map(jid => recalcularYActualizarRating(jid)))

      alert('Puntajes guardados y rating actualizado')
      navigate('/ranking')
    } catch (err: any) {
      alert('Error guardando puntajes: ' + err.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-center">Cargando jugadores a puntuar...</div>
  if (!jugadores.length) return <div className="p-4 text-center">Partido no encontrado o sin jugadores</div>

  const equipoA = jugadores.filter(j => j.equipo === 'A')
  const equipoB = jugadores.filter(j => j.equipo === 'B')

  const RenderEquipo = ({ eq, color, title }: { eq: any[], color: string, title: string }) => (
    <div className={`mb-6 p-4 rounded-xl shadow-sm border-t-4 ${color} bg-white`}>
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      {eq.map(j => (
        <div key={j.jugador_id} className="mb-4 pb-4 border-b last:border-0 last:pb-0 last:mb-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => swapJugador(j.jugador_id)}
                className="p-1.5 rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors active:scale-90"
                title={`Mover a ${j.equipo === 'A' ? 'Juve' : 'Barsa'}`}
              >
                <ArrowLeftRight size={16} />
              </button>
              <div className="font-semibold text-gray-800">{j.jugadores.nombre}</div>
            </div>
            <div className="text-xl font-black text-blue-600">{Number(puntajes[j.jugador_id]).toFixed(1)}</div>
          </div>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
              const isSelected = puntajes[j.jugador_id] === num
              return (
                <button
                  key={num}
                  onClick={() => setPuntajes({ ...puntajes, [j.jugador_id]: num })}
                  className={`flex-1 py-3 text-sm sm:text-base font-bold border-r border-gray-200 last:border-r-0 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 active:bg-gray-200'}`}
                >
                  {num}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="p-4 pb-24">
      {/* Marcador */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider text-center mb-4">RESULTADO DEL PARTIDO</h3>
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold text-blue-800">BARSA</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGolesBarsa(prev => Math.max(0, (Number(prev) || 0) - 1))}
                className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center text-xl hover:bg-blue-200 active:scale-95 transition-all shadow-sm"
              >-</button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={golesBarsa}
                onChange={(e) => setGolesBarsa(e.target.value.replace(/\D/g, ''))}
                className="w-16 h-16 text-center text-3xl font-black border-2 border-blue-300 rounded-xl bg-blue-50 text-blue-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-inner"
              />
              <button
                onClick={() => setGolesBarsa(prev => (Number(prev) || 0) + 1)}
                className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center text-xl hover:bg-blue-200 active:scale-95 transition-all shadow-sm"
              >+</button>
            </div>
          </div>
          <span className="text-3xl font-black text-gray-300 mt-6">-</span>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold text-orange-800">JUVE</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGolesJuve(prev => Math.max(0, (Number(prev) || 0) - 1))}
                className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-black flex items-center justify-center text-xl hover:bg-orange-200 active:scale-95 transition-all shadow-sm"
              >-</button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={golesJuve}
                onChange={(e) => setGolesJuve(e.target.value.replace(/\D/g, ''))}
                className="w-16 h-16 text-center text-3xl font-black border-2 border-orange-300 rounded-xl bg-orange-50 text-orange-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-inner"
              />
              <button
                onClick={() => setGolesJuve(prev => (Number(prev) || 0) + 1)}
                className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-black flex items-center justify-center text-xl hover:bg-orange-200 active:scale-95 transition-all shadow-sm"
              >+</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-600 text-white rounded-xl p-4 mb-6 shadow-md">
        <h2 className="text-lg font-bold">CALIFICA A LOS JUGADORES</h2>
        <p className="text-sm text-blue-100 mt-1 mb-2">
          Calificá el rendimiento de cada jugador, tené en cuenta queafectará su rating general.
        </p>
        <p className="text-sm text-blue-100">
          Si algún jugador cambió de equipo podés moverlo con las flechitas <ArrowLeftRight size={14} className="inline -mt-0.5 mx-0.5 text-blue-200" /> al costado de su nombre.
        </p>
      </div>

      <RenderEquipo eq={equipoA} color="border-blue-500" title="Barsa" />
      <RenderEquipo eq={equipoB} color="border-orange-500" title="Juve" />

      <button
        onClick={guardarPuntajes}
        disabled={saving}
        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold p-4 rounded-xl shadow-lg border-b-4 border-green-700 active:translate-y-1 active:border-b-0 flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:active:border-b-4"
      >
        {saving ? 'Guardando/Procesando...' : <><CheckCircle2 size={24} /> Finalizar y Recalcular</>}
      </button>
    </div>
  )
}
