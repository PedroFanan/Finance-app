import { prisma } from '../../prisma/client'
import type { CreateProductInput, UpdateProductInput, AdjustStockInput } from './products.schema'

interface ListParams {
  orgId: string
  page?: number
  perPage?: number
  search?: string
  categoryId?: string
  active?: boolean
}

export async function list({ orgId, page = 1, perPage = 20, search, categoryId, active }: ListParams) {
  const where = {
    organizationId: orgId,
    ...(active !== undefined && { active }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { sku: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return { products, total, page, perPage }
}

export async function getById(orgId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, organizationId: orgId },
    include: { category: true },
  })
  if (!product) throw { status: 404, message: 'Produto não encontrado' }
  return product
}

export async function create(orgId: string, input: CreateProductInput) {
  if (input.sku) {
    const existing = await prisma.product.findUnique({
      where: { organizationId_sku: { organizationId: orgId, sku: input.sku } },
    })
    if (existing) throw { status: 409, message: 'SKU já cadastrado' }
  }

  return prisma.product.create({
    data: { ...input, organizationId: orgId },
    include: { category: true },
  })
}

export async function update(orgId: string, id: string, input: UpdateProductInput) {
  await getById(orgId, id)

  if (input.sku) {
    const existing = await prisma.product.findFirst({
      where: { organizationId: orgId, sku: input.sku, NOT: { id } },
    })
    if (existing) throw { status: 409, message: 'SKU já cadastrado' }
  }

  return prisma.product.update({
    where: { id },
    data: input,
    include: { category: true },
  })
}

export async function remove(orgId: string, id: string) {
  await getById(orgId, id)
  return prisma.product.update({ where: { id }, data: { active: false } })
}

export async function updatePhoto(orgId: string, id: string, photoUrl: string) {
  await getById(orgId, id)
  return prisma.product.update({ where: { id }, data: { photoUrl } })
}

export async function adjustStock(orgId: string, id: string, input: AdjustStockInput) {
  const product = await getById(orgId, id)

  let newQty: number
  if (input.operation === 'set') {
    newQty = input.qty
  } else if (input.operation === 'add') {
    newQty = product.stockQty + input.qty
  } else {
    newQty = Math.max(0, product.stockQty - input.qty)
  }

  return prisma.product.update({ where: { id }, data: { stockQty: newQty } })
}
