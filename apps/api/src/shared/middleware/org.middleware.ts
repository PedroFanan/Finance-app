import { Response, NextFunction } from 'express'
import { prisma } from '../../prisma/client'
import { AuthRequest } from './auth.middleware'
import { forbidden, notFound } from '../utils/response'
import type { MemberRole, OrganizationMember, Organization } from '@prisma/client'

type MemberWithOrg = OrganizationMember & { organization: Organization }

export interface OrgRequest extends AuthRequest {
  org?: { id: string; slug: string; name: string }
  memberRole?: MemberRole
}

export function orgMiddleware(req: OrgRequest, res: Response, next: NextFunction) {
  return async () => {
    const slugParam = req.params.orgSlug
    const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam

    if (!slug) return notFound(res, 'Organização não encontrada')

    const member = await prisma.organizationMember.findFirst({
      where: {
        userId: req.user!.sub,
        organization: { slug },
      },
      include: { organization: true },
    })

    if (!member) return forbidden(res, 'Você não é membro desta organização')

    const m = member as MemberWithOrg

    req.org = {
      id: m.organization.id,
      slug: m.organization.slug,
      name: m.organization.name,
    }
    req.memberRole = member.role

    return next()
  }
}

export function requireRole(...roles: MemberRole[]) {
  return (req: OrgRequest, res: Response, next: NextFunction) => {
    if (!req.memberRole || !roles.includes(req.memberRole)) {
      return forbidden(res, 'Permissão insuficiente')
    }
    return next()
  }
}

// Wraps async middleware to handle promise rejection
export function asyncOrg(req: OrgRequest, res: Response, next: NextFunction) {
  orgMiddleware(req, res, next)().catch(next)
}
