import { prisma } from '../../prisma/client'
import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

export type CategoryInput = z.infer<typeof categorySchema>

export async function list(orgId: string) {
  return prisma.category.findMany({
    where: { organizationId: orgId },
    orderBy: { name: 'asc' },
  })
}

export async function create(orgId: string, input: CategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { organizationId_name: { organizationId: orgId, name: input.name } },
  })
  if (existing) throw { status: 409, message: 'Categoria já existe' }

  return prisma.category.create({
    data: { ...input, organizationId: orgId },
  })
}

export async function update(orgId: string, id: string, input: Partial<CategoryInput>) {
  const cat = await prisma.category.findFirst({ where: { id, organizationId: orgId } })
  if (!cat) throw { status: 404, message: 'Categoria não encontrada' }

  return prisma.category.update({ where: { id }, data: input })
}

export async function remove(orgId: string, id: string) {
  const cat = await prisma.category.findFirst({ where: { id, organizationId: orgId } })
  if (!cat) throw { status: 404, message: 'Categoria não encontrada' }

  await prisma.category.delete({ where: { id } })
}
