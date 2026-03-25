import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, TokenPayload } from '../utils/jwt'
import { unauthorized } from '../utils/response'

export interface AuthRequest extends Request {
  user?: TokenPayload
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res)
  }

  const token = authHeader.slice(7)

  try {
    req.user = verifyAccessToken(token)
    return next()
  } catch {
    return unauthorized(res, 'Token inválido ou expirado')
  }
}
