import { supabase } from '../supabaseClient'
import { loadDb, saveDb } from './store'

export function isSupabaseEnabled() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  return Boolean(url && key && url !== 'https://your-project.supabase.co')
}

export async function loadDbFromSupabase() {
  if (!isSupabaseEnabled() || !supabase) return null

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('payload')
      .eq('id', 'main')
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null
      console.warn('No se pudo cargar el estado desde Supabase:', error)
      return null
    }

    if (!data?.payload) return null
    return typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload
  } catch (error) {
    console.warn('Error al cargar la base de datos de Supabase:', error)
    return null
  }
}

export async function saveDbToSupabase(db) {
  if (!isSupabaseEnabled() || !supabase) return

  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({ id: 'main', payload: db }, { onConflict: 'id' })

    if (error) {
      console.warn('No se pudo guardar el estado en Supabase:', error)
    }
  } catch (error) {
    console.warn('Error al guardar la base de datos en Supabase:', error)
  }
}

export function loadLocalDb() {
  return loadDb()
}

export function saveLocalDb(db) {
  saveDb(db)
}
