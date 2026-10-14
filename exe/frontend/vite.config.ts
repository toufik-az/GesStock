import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  if (mode === 'android') {
    const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
    for (const name of ['VITE_SUPABASE_URL', 'VITE_API_URL']) {
      const value = env[name] ?? ''
      if (!value.startsWith('https://') || /localhost|127\.0\.0\.1|your-project|your-backend/.test(value)) {
        throw new Error(`${name}: configure a public HTTPS endpoint in .env.android.local before building the APK`)
      }
    }
    const key = env.VITE_SUPABASE_ANON_KEY ?? ''
    if (!key || key === 'your_anon_key' || key.startsWith('sb_secret_')) throw new Error('Configure a public Supabase anon/publishable key for Android')
    if (key.split('.').length === 3) {
      const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString())
      if (claims.role !== 'anon') throw new Error('Only the public anon key may be bundled in the APK')
    }
  }
  return {
  plugins: [react()],
  base: './',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
  }
})
