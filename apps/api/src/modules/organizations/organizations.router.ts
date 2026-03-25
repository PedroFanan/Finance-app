import { Router, Response } from 'express'
import * as service from './organizations.service'
import { createOrgSchema, updateOrgSchema, inviteMemberSchema, updateMemberRoleSchema } from './organizations.schema'
import { authMiddleware, AuthRequest } from '../../shared/middleware/auth.middleware'
import { asyncOrg, requireRole, OrgRequest } from '../../shared/middleware/org.middleware'
import { ok, created, noContent, badRequest, serverError } from '../../shared/utils/response'

const router = Router()

// All routes require auth
router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const orgs = await service.listUserOrgs(req.user!.sub)
    return ok(res, orgs)
  } catch {
    return serverError(res)
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createOrgSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const org = await service.createOrg(req.user!.sub, parsed.data)
    return created(res, org)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ORG_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.get('/:orgSlug', asyncOrg, async (req: OrgRequest, res: Response) => {
  try {
    const org = await service.getOrg(req.org!.slug)
    return ok(res, { ...org, role: req.memberRole })
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ORG_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:orgSlug', asyncOrg, requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = updateOrgSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const org = await service.updateOrg(req.org!.id, parsed.data)
    return ok(res, org)
  } catch {
    return serverError(res)
  }
})

router.delete('/:orgSlug', asyncOrg, requireRole('OWNER'), async (req: OrgRequest, res: Response) => {
  try {
    await service.deleteOrg(req.org!.id)
    return noContent(res)
  } catch {
    return serverError(res)
  }
})

router.get('/:orgSlug/members', asyncOrg, async (req: OrgRequest, res: Response) => {
  try {
    const members = await service.listMembers(req.org!.id)
    return ok(res, members)
  } catch {
    return serverError(res)
  }
})

router.post('/:orgSlug/members/invite', asyncOrg, requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = inviteMemberSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const member = await service.inviteMember(req.org!.id, parsed.data)
    return created(res, member)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ORG_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:orgSlug/members/:userId/role', asyncOrg, requireRole('OWNER'), async (req: OrgRequest, res: Response) => {
  const parsed = updateMemberRoleSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const member = await service.updateMemberRole(req.org!.id, req.params.userId as string, req.user!.sub, parsed.data)
    return ok(res, member)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ORG_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.delete('/:orgSlug/members/:userId', asyncOrg, requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  try {
    await service.removeMember(req.org!.id, req.params.userId as string, req.user!.sub)
    return noContent(res)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'ORG_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

export default router
