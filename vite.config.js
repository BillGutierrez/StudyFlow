import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: replace 'studyflow' with the exact name of your GitHub
  // repository. GitHub Pages serves project sites from
  // https://<usuario>.github.io/<nombre-repo>/, so Vite needs to know
  // that sub-path to build correct asset links (and so the PWA manifest
  // and service worker resolve correctly).
  base: '/StudyFlow/',
})
