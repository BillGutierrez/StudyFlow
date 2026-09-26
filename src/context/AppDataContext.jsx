import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadDb, saveDb } from '../lib/store'
import { dbReducer } from '../lib/reducer'
import { isSupabaseEnabled, loadDbFromSupabase, saveDbToSupabase } from '../lib/supabaseDb'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const [db, dispatch] = useReducer(dbReducer, null, () => null)

  useEffect(() => {
    let active = true

    async function hydrate() {
      const remoteDb = await loadDbFromSupabase()
      if (!active) return

      const nextDb = remoteDb || loadDb()
      dispatch({ type: 'HYDRATE', payload: nextDb })
    }

    hydrate()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!db) return

    if (isSupabaseEnabled()) {
      saveDbToSupabase(db)
    } else {
      saveDb(db)
    }
  }, [db])

  const value = useMemo(() => ({ db, dispatch }), [db])

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData debe usarse dentro de AppDataProvider')
  return ctx
}
