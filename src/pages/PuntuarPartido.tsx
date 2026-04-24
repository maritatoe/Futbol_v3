import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { recalcularYActualizarRating } from '../lib/ratingLogic'
import { CheckCircle2, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function PuntuarPartido() {
  const { user } = useAuth()
  const { partidoId } = useParams()
  const navigate = useNavigate()
  const [jugadores, setJugadores] = useState<any[]>([])
  const [puntajes, setPuntajes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [golesEq1, setGolesEq1] = useState<number | string>(0)
  const [golesEq2, setGolesEq2] = useState<number | string>(0)
  const [nombre1, setNombre1] = useState('Equipo A')
  const [nombre2, setNombre2] = useState('Equipo B')

  useEffect(() => {
    fetchParticipantes()
  }, [])

  async function fetchParticipantes() {
    if (!partidoId) return
    const { data: partido, error } = await supabase
      .from('partidos')
      .select('fecha, formacion, equipo_1_nombre, equipo_2_nombre, equipos_partido(jugador_id, equipo, posicion_asignada, jugadores(nombre, rating))')
      .eq('id', partidoId)
      .single()

    if (!error && partido && partido.equipos_partido) {
      setJugadores(partido.equipos_partido)
      setNombre1(partido.equipo_1_nombre || 'Equipo A')
      setNombre2(partido.equipo_2_nombre || 'Equipo B')
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
        puntaje: puntajes[jid],
        user_id: user?.id
      }))

      // Guardar rendimientos
      const { error: errInsert } = await supabase.from('rendimiento').insert(inserts)
      if (errInsert) {
        // Podría fallar por UNIQUE constraint si ya se puntuaron
        if (errInsert.code === '23505') {
          toast.error('Este partido ya fue puntuado.')
          navigate('/ranking')
          return
        }
        throw errInsert
      }

      // Guardar marcador del partido
      await supabase.from('partidos').update({
        goles_barsa: Number(golesEq1) || 0,
        goles_juve: Number(golesEq2) || 0
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

      toast.success('Puntajes guardados y rating actualizado')
      navigate('/ranking')
    } catch (err: any) {
      toast.error('Error guardando puntajes: ' + err.message)
    }
    setSaving(false)
  }

  if (loading) return <div className="p-4 text-center">Cargando jugadores a puntuar...</div>
  if (!jugadores.length) return <div className="p-4 text-center">Partido no encontrado o sin jugadores</div>

  const equipoA = jugadores.filter(j => j.equipo === 'A')
  const equipoB = jugadores.filter(j => j.equipo === 'B')

  const RenderEquipo = ({ eq, color, title, swapLabel }: { eq: any[], color: string, title: string, swapLabel: string }) => (
    <div className={`mb-6 p-4 rounded-xl shadow-sm border-t-4 ${color} bg-white`}>
      <h3 className="font-bold text-lg mb-4">{title}</h3>
      {eq.map(j => (
        <div key={j.jugador_id} className="mb-4 pb-4 border-b last:border-0 last:pb-0 last:mb-0">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => swapJugador(j.jugador_id)}
                className="p-1.5 rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors active:scale-90"
                title={`Mover a ${swapLabel}`}
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
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider text-center mb-6">RESULTADO DEL PARTIDO</h3>
        <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-md mx-auto">

          {/* Equipo 1 Column */}
          <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-extrabold text-blue-800 tracking-wide uppercase truncate max-w-full">{nombre1}</span>
            <div className="flex items-center justify-center gap-1 sm:gap-3 w-full">
              <button
                onClick={() => setGolesEq1(prev => Math.max(0, (Number(prev) || 0) - 1))}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center text-lg sm:text-xl hover:bg-blue-200 active:scale-95 transition-all shadow-sm"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={golesEq1}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setGolesEq1(val === '' ? 0 : parseInt(val, 10));
                }}
                className="w-12 h-12 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-black border-2 border-blue-200 rounded-xl bg-blue-50/50 text-blue-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-inner"
              />
              <button
                onClick={() => setGolesEq1(prev => (Number(prev) || 0) + 1)}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-blue-100 text-blue-600 font-black flex items-center justify-center text-lg sm:text-xl hover:bg-blue-200 active:scale-95 transition-all shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Separator */}
          <div className="flex items-center justify-center shrink-0 mt-8">
            <div className="w-3 sm:w-4 h-[3px] rounded-full bg-gray-300"></div>
          </div>

          {/* Equipo 2 Column */}
          <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-extrabold text-orange-800 tracking-wide uppercase truncate max-w-full">{nombre2}</span>
            <div className="flex items-center justify-center gap-1 sm:gap-3 w-full">
              <button
                onClick={() => setGolesEq2(prev => Math.max(0, (Number(prev) || 0) - 1))}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-orange-100 text-orange-600 font-black flex items-center justify-center text-lg sm:text-xl hover:bg-orange-200 active:scale-95 transition-all shadow-sm"
              >
                -
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={golesEq2}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setGolesEq2(val === '' ? 0 : parseInt(val, 10));
                }}
                className="w-12 h-12 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-black border-2 border-orange-200 rounded-xl bg-orange-50/50 text-orange-800 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all shadow-inner"
              />
              <button
                onClick={() => setGolesEq2(prev => (Number(prev) || 0) + 1)}
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-orange-100 text-orange-600 font-black flex items-center justify-center text-lg sm:text-xl hover:bg-orange-200 active:scale-95 transition-all shadow-sm"
              >
                +
              </button>
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

      <RenderEquipo eq={equipoA} color="border-blue-500" title={nombre1} swapLabel={nombre2} />
      <RenderEquipo eq={equipoB} color="border-orange-500" title={nombre2} swapLabel={nombre1} />

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
