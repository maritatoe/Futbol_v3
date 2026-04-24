export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jugadores: {
        Row: {
          id: string
          nombre: string
          posiciones: string[]
          puntaje_base: number
          rating: number
          activo: boolean
          is_archived: boolean
          created_at: string
          user_id?: string
        }
        Insert: {
          id?: string
          nombre: string
          posiciones: string[]
          puntaje_base?: number
          rating?: number
          activo?: boolean
          is_archived?: boolean
          created_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          nombre?: string
          posiciones?: string[]
          puntaje_base?: number
          rating?: number
          activo?: boolean
          is_archived?: boolean
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partidos: {
        Row: {
          id: string
          fecha: string
          formacion: string
          goles_barsa: number | null
          goles_juve: number | null
          equipo_1_nombre: string
          equipo_2_nombre: string
          user_id?: string
        }
        Insert: {
          id?: string
          fecha?: string
          formacion?: string
          goles_barsa?: number | null
          goles_juve?: number | null
          equipo_1_nombre?: string
          equipo_2_nombre?: string
          user_id?: string
        }
        Update: {
          id?: string
          fecha?: string
          formacion?: string
          goles_barsa?: number | null
          goles_juve?: number | null
          equipo_1_nombre?: string
          equipo_2_nombre?: string
          user_id?: string
        }
        Relationships: []
      }
      equipos_partido: {
        Row: {
          id: string
          partido_id: string
          jugador_id: string
          equipo: 'A' | 'B'
          posicion_asignada: string
          user_id?: string
        }
        Insert: {
          id?: string
          partido_id: string
          jugador_id: string
          equipo: 'A' | 'B'
          posicion_asignada: string
          user_id?: string
        }
        Update: {
          id?: string
          partido_id?: string
          jugador_id?: string
          equipo?: 'A' | 'B'
          posicion_asignada?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_partido_partido_id_fkey"
            columns: ["partido_id"]
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_partido_jugador_id_fkey"
            columns: ["jugador_id"]
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          }
        ]
      }
      rendimiento: {
        Row: {
          id: string
          partido_id: string
          jugador_id: string
          puntaje: number
          user_id?: string
        }
        Insert: {
          id?: string
          partido_id: string
          jugador_id: string
          puntaje: number
          user_id?: string
        }
        Update: {
          id?: string
          partido_id?: string
          jugador_id?: string
          puntaje?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendimiento_partido_id_fkey"
            columns: ["partido_id"]
            referencedRelation: "partidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendimiento_jugador_id_fkey"
            columns: ["jugador_id"]
            referencedRelation: "jugadores"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

