import { Response } from 'express'

export function ok<T>(res: Response, data: T) {
  return res.status(200).json({ data })
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ data })
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function badRequest(res: Response, message: string) {
  return res.status(400).json({ error: 'BAD_REQUEST', message, statusCode: 400 })
}

export function unauthorized(res: Response, message = 'Não autorizado') {
  return res.status(401).json({ error: 'UNAUTHORIZED', message, statusCode: 401 })
}

export function forbidden(res: Response, message = 'Acesso negado') {
  return res.status(403).json({ error: 'FORBIDDEN', message, statusCode: 403 })
}

export function notFound(res: Response, message = 'Recurso não encontrado') {
  return res.status(404).json({ error: 'NOT_FOUND', message, statusCode: 404 })
}

export function conflict(res: Response, message: string) {
  return res.status(409).json({ error: 'CONFLICT', message, statusCode: 409 })
}

export function serverError(res: Response, message = 'Erro interno do servidor') {
  return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message, statusCode: 500 })
}

export function paginated<T>(
  res: Response,
  data: T[],
  meta: { total: number; page: number; perPage: number }
) {
  return res.status(200).json({
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.perPage),
    },
  })
}
