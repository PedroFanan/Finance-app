import { Router, Response } from 'express'
import * as service from './dashboard.service'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { asyncOrg, OrgRequest } from '../../shared/middleware/org.middleware'
import { ok, serverError } from '../../shared/utils/response'

const router = Router({ mergeParams: true })

router.use(authMiddleware, asyncOrg)

router.get('/summary', async (req: OrgRequest, res: Response) => {
  try {
    const data = await service.getSummary(req.org!.id)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
})

router.get('/monthly', async (req: OrgRequest, res: Response) => {
  try {
    const data = await service.getMonthly(req.org!.id)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
})

router.get('/upcoming', async (req: OrgRequest, res: Response) => {
  try {
    const data = await service.getUpcoming(req.org!.id)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
})

router.get('/overdue', async (req: OrgRequest, res: Response) => {
  try {
    const data = await service.getOverdue(req.org!.id)
    return ok(res, data)
  } catch {
    return serverError(res)
  }
})

export default router
