import { z } from 'zod'

export const createOrgSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['PERSONAL', 'COMPANY']),
  cnpj: z.string().optional(),
})

export const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  logoUrl: z.string().url().optional().nullable(),
  cnpj: z.string().optional().nullable(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
})

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
})

export type CreateOrgInput = z.infer<typeof createOrgSchema>
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
