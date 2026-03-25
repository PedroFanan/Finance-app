import { prisma } from '../../prisma/client'
import { generateSlug } from '../../shared/utils/slug'
import type { CreateOrgInput, UpdateOrgInput, InviteMemberInput, UpdateMemberRoleInput } from './organizations.schema'

export async function listUserOrgs(userId: string) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { joinedAt: 'asc' },
  })
  return memberships.map((m) => ({ ...m.organization, role: m.role }))
}

export async function createOrg(userId: string, input: CreateOrgInput) {
  const baseSlug = generateSlug(input.name)
  let slug = baseSlug
  const existing = await prisma.organization.findUnique({ where: { slug } })
  if (existing) slug = `${baseSlug}-${Date.now()}`

  if (input.cnpj) {
    const cnpjExists = await prisma.organization.findUnique({ where: { cnpj: input.cnpj } })
    if (cnpjExists) throw { status: 409, message: 'CNPJ já cadastrado' }
  }

  const org = await prisma.organization.create({
    data: {
      name: input.name,
      slug,
      type: input.type,
      cnpj: input.cnpj,
      members: { create: { userId, role: 'OWNER' } },
    },
  })

  return org
}

export async function getOrg(slug: string) {
  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) throw { status: 404, message: 'Organização não encontrada' }
  return org
}

export async function updateOrg(orgId: string, input: UpdateOrgInput) {
  return prisma.organization.update({ where: { id: orgId }, data: input })
}

export async function deleteOrg(orgId: string) {
  await prisma.organization.delete({ where: { id: orgId } })
}

export async function listMembers(orgId: string) {
  return prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })
}

export async function inviteMember(orgId: string, input: InviteMemberInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw { status: 404, message: 'Usuário não encontrado com este email' }

  const existing = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
  })
  if (existing) throw { status: 409, message: 'Usuário já é membro desta organização' }

  return prisma.organizationMember.create({
    data: { userId: user.id, organizationId: orgId, role: input.role },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  })
}

export async function updateMemberRole(
  orgId: string,
  targetUserId: string,
  requestingUserId: string,
  input: UpdateMemberRoleInput
) {
  if (targetUserId === requestingUserId) throw { status: 400, message: 'Não é possível alterar sua própria role' }

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
  })
  if (!member) throw { status: 404, message: 'Membro não encontrado' }
  if (member.role === 'OWNER') throw { status: 403, message: 'Não é possível alterar a role do dono' }

  return prisma.organizationMember.update({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    data: { role: input.role },
  })
}

export async function removeMember(orgId: string, targetUserId: string, requestingUserId: string) {
  if (targetUserId === requestingUserId) throw { status: 400, message: 'Não é possível remover a si mesmo' }

  const member = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
  })
  if (!member) throw { status: 404, message: 'Membro não encontrado' }
  if (member.role === 'OWNER') throw { status: 403, message: 'Não é possível remover o dono' }

  await prisma.organizationMember.delete({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
  })
}
