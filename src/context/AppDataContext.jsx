import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadDb, saveDb } from '../lib/store.js'
import { dbReducer } from '../lib/reducer.js'
import { isSupabaseEnabled, loadDbFromSupabase, saveDbToSupabase } from '../lib/supabaseDb.js'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const [db, dispatch] = useReducer(dbReducer, null, () => null)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (isSupabaseEnabled()) {
        const supabaseDb = await loadDbFromSupabase()
        if (!cancelled && supabaseDb) {
          dispatch({ type: 'HYDRATE', payload: supabaseDb })
          return
        }
      }

      if (!cancelled) {
        dispatch({ type: 'HYDRATE', payload: loadDb() })
      }
    }

    hydrate()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!db) return

    if (isSupabaseEnabled()) {
      saveDbToSupabase(db)
      return
    }

    saveDb(db)
  }, [db])

  const value = useMemo(() => ({ db, dispatch }), [db])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData debe usarse dentro de AppDataProvider')
  return ctx
}
