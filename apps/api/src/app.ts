import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import rateLimit from 'express-rate-limit'

import { errorMiddleware } from './shared/middleware/error.middleware'
import authRouter from './modules/auth/auth.router'
import orgsRouter from './modules/organizations/organizations.router'
import categoriesRouter from './modules/categories/categories.router'
import productsRouter from './modules/products/products.router'
import transactionsRouter from './modules/transactions/transactions.router'
import dashboardRouter from './modules/dashboard/dashboard.router'

const app = express()

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
app.use(limiter)

// ─── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Static uploads ────────────────────────────────────────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_LOCAL_PATH || './uploads')
app.use('/uploads', express.static(uploadDir))

// ─── Routes ────────────────────────────────────────────────────────────────────
const v1 = express.Router()

v1.use('/auth', authRouter)
v1.use('/organizations', orgsRouter)
v1.use('/organizations/:orgSlug/categories', categoriesRouter)
v1.use('/organizations/:orgSlug/products', productsRouter)
v1.use('/organizations/:orgSlug/transactions', transactionsRouter)
v1.use('/organizations/:orgSlug/dashboard', dashboardRouter)

app.use('/api/v1', v1)

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use(errorMiddleware)

export default app
