import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { loadDb, saveDb } from '../lib/store'
import { dbReducer } from '../lib/reducer'

const AppDataContext = createContext(null)

export function AppDataProvider({ children }) {
  const [db, dispatch] = useReducer(dbReducer, undefined, loadDb)

  useEffect(() => {
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
