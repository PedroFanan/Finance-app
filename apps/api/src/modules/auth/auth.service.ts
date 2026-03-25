import bcrypt from 'bcryptjs'
import { prisma } from '../../prisma/client'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt'
import { generateSlug } from '../../shared/utils/slug'
import type { RegisterInput, LoginInput, ChangePasswordInput, UpdateProfileInput } from './auth.schema'

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw { status: 409, message: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(input.password, 10)

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
  })

  // Auto-create personal organization
  const baseSlug = generateSlug(input.name)
  let slug = `${baseSlug}-pessoal`
  const existing_slug = await prisma.organization.findUnique({ where: { slug } })
  if (existing_slug) slug = `${slug}-${Date.now()}`

  const org = await prisma.organization.create({
    data: {
      name: `${input.name} - Pessoal`,
      slug,
      type: 'PERSONAL',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })

  // Default categories
  const defaultCategories = [
    { name: 'Alimentação', color: '#f97316', icon: 'utensils' },
    { name: 'Transporte', color: '#3b82f6', icon: 'car' },
    { name: 'Moradia', color: '#8b5cf6', icon: 'home' },
    { name: 'Saúde', color: '#ef4444', icon: 'heart' },
    { name: 'Lazer', color: '#10b981', icon: 'gamepad-2' },
    { name: 'Salário', color: '#22c55e', icon: 'banknote' },
    { name: 'Outros', color: '#6b7280', icon: 'circle' },
  ]

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({ ...c, organizationId: org.id })),
  })

  const tokens = await issueTokens(user.id, user.email)

  return {
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
    tokens,
    defaultOrg: { slug: org.slug },
  }
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) throw { status: 401, message: 'Email ou senha inválidos' }

  const valid = await bcrypt.compare(input.password, user.passwordHash)
  if (!valid) throw { status: 401, message: 'Email ou senha inválidos' }

  const tokens = await issueTokens(user.id, user.email)

  return {
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
    tokens,
  }
}

export async function refresh(token: string) {
  let payload: { sub: string; email: string }
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw { status: 401, message: 'Refresh token inválido ou expirado' }
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw { status: 401, message: 'Refresh token inválido' }
  }

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } })

  const tokens = await issueTokens(payload.sub, payload.email)
  return tokens
}

export async function logout(token: string) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  })
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
  })
  if (!user) throw { status: 404, message: 'Usuário não encontrado' }
  return user
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
  })
  return user
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw { status: 404, message: 'Usuário não encontrado' }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash)
  if (!valid) throw { status: 400, message: 'Senha atual incorreta' }

  const passwordHash = await bcrypt.hash(input.newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}

async function issueTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email })
  const refreshToken = signRefreshToken({ sub: userId, email })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt },
  })

  return { accessToken, refreshToken }
}
