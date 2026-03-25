import { Router, Response } from 'express'
import * as service from './categories.service'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { asyncOrg, requireRole, OrgRequest } from '../../shared/middleware/org.middleware'
import { ok, created, noContent, badRequest, serverError } from '../../shared/utils/response'

const router = Router({ mergeParams: true })

router.use(authMiddleware, asyncOrg)

router.get('/', async (req: OrgRequest, res: Response) => {
  const cats = await service.list(req.org!.id)
  return ok(res, cats)
})

router.post('/', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = service.categorySchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const cat = await service.create(req.org!.id, parsed.data)
    return created(res, cat)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'CATEGORY_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:id', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = service.categorySchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const cat = await service.update(req.org!.id, req.params.id as string, parsed.data)
    return ok(res, cat)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'CATEGORY_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.delete('/:id', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  try {
    await service.remove(req.org!.id, req.params.id as string)
    return noContent(res)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'CATEGORY_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

export default router
