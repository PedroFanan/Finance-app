import { Router, Request, Response } from 'express'
import * as service from './auth.service'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.schema'
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware'
import { ok, created, noContent, badRequest, unauthorized, serverError } from '../../shared/utils/response'

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const result = await service.register(parsed.data)
    return created(res, result)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'AUTH_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Email ou senha inválidos')

  try {
    const result = await service.login(parsed.data)
    return ok(res, result)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'AUTH_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.post('/refresh', async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'refreshToken é obrigatório')

  try {
    const tokens = await service.refresh(parsed.data.refreshToken)
    return ok(res, tokens)
  } catch (err: any) {
    if (err.status) return unauthorized(res, err.message)
    return serverError(res)
  }
})

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'refreshToken é obrigatório')

  await service.logout(parsed.data.refreshToken)
  return noContent(res)
})

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await service.getMe(req.user!.sub)
    return ok(res, user)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const user = await service.updateProfile(req.user!.sub, parsed.data)
    return ok(res, user)
  } catch (err: any) {
    return serverError(res)
  }
})

router.patch('/me/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    await service.changePassword(req.user!.sub, parsed.data)
    return noContent(res)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

export default router
