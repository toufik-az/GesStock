import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import healthRouter from './routes/health'
import authRouter from './routes/auth'
import staffRouter from './routes/staff'

const app = express()

app.set('trust proxy', 1)

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }))
app.use(express.json())

// Tighter limit on the public registration endpoint
app.use('/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }))
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }))

app.use('/health', healthRouter)
app.use('/auth',   authRouter)
app.use('/staff',  staffRouter)

app.listen(env.PORT, () => {
  console.log(`GesStock backend listening on port ${env.PORT} [${env.NODE_ENV}]`)
})
