-- Añadir columna user_id y foreign key a auth.users para todas las tablas
ALTER TABLE jugadores ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE partidos ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE equipos_partido ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE rendimiento ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Habilitar Row Level Security (RLS)
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos_partido ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendimiento ENABLE ROW LEVEL SECURITY;

-- Crear políticas para JUGADORES
CREATE POLICY "Permitir select a usuarios dueños" ON jugadores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir insert a usuarios dueños" ON jugadores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir update a usuarios dueños" ON jugadores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Permitir delete a usuarios dueños" ON jugadores FOR DELETE USING (auth.uid() = user_id);

-- Crear políticas para PARTIDOS
CREATE POLICY "Permitir select a usuarios dueños" ON partidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir insert a usuarios dueños" ON partidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir update a usuarios dueños" ON partidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Permitir delete a usuarios dueños" ON partidos FOR DELETE USING (auth.uid() = user_id);

-- Crear políticas para EQUIPOS_PARTIDO
CREATE POLICY "Permitir select a usuarios dueños" ON equipos_partido FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir insert a usuarios dueños" ON equipos_partido FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir update a usuarios dueños" ON equipos_partido FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Permitir delete a usuarios dueños" ON equipos_partido FOR DELETE USING (auth.uid() = user_id);

-- Crear políticas para RENDIMIENTO
CREATE POLICY "Permitir select a usuarios dueños" ON rendimiento FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir insert a usuarios dueños" ON rendimiento FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Permitir update a usuarios dueños" ON rendimiento FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Permitir delete a usuarios dueños" ON rendimiento FOR DELETE USING (auth.uid() = user_id);
