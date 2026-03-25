import { Router, Response } from 'express'
import * as service from './transactions.service'
import { createTransactionSchema, updateTransactionSchema } from './transactions.schema'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { asyncOrg, requireRole, OrgRequest } from '../../shared/middleware/org.middleware'
import { ok, created, noContent, badRequest, serverError, paginated } from '../../shared/utils/response'

const router = Router({ mergeParams: true })

router.use(authMiddleware, asyncOrg)

router.get('/', async (req: OrgRequest, res: Response) => {
  const { page, perPage, type, status, categoryId, from, to } = req.query
  try {
    const result = await service.list({
      orgId: req.org!.id,
      page: page ? parseInt(page as string) : 1,
      perPage: perPage ? parseInt(perPage as string) : 20,
      type: type as 'PAYABLE' | 'RECEIVABLE' | undefined,
      status: status as 'PENDING' | 'PAID' | 'CANCELLED' | undefined,
      categoryId: categoryId as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
    })
    return paginated(res, result.transactions, { total: result.total, page: result.page, perPage: result.perPage })
  } catch {
    return serverError(res)
  }
})

router.post('/', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = createTransactionSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const tx = await service.create(req.org!.id, parsed.data)
    return created(res, tx)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'TX_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.get('/:id', async (req: OrgRequest, res: Response) => {
  try {
    const tx = await service.getById(req.org!.id, req.params.id as string)
    return ok(res, tx)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'TX_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:id', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = updateTransactionSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const tx = await service.update(req.org!.id, req.params.id as string, parsed.data)
    return ok(res, tx)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'TX_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.delete('/:id', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  try {
    await service.remove(req.org!.id, req.params.id as string)
    return noContent(res)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'TX_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:id/pay', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  try {
    const tx = await service.pay(req.org!.id, req.params.id as string)
    return ok(res, tx)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'TX_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:id/installments/:installmentId/pay', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  try {
    const tx = await service.payInstallment(req.org!.id, req.params.id as string, req.params.installmentId as string)
    return ok(res, tx)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'TX_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

export default router
