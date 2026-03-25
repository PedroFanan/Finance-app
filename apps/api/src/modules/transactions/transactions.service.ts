import { prisma } from '../../prisma/client'
import type { CreateTransactionInput, UpdateTransactionInput } from './transactions.schema'

interface ListParams {
  orgId: string
  page?: number
  perPage?: number
  type?: 'PAYABLE' | 'RECEIVABLE'
  status?: 'PENDING' | 'PAID' | 'CANCELLED'
  categoryId?: string
  from?: string
  to?: string
}

export async function list({ orgId, page = 1, perPage = 20, type, status, categoryId, from, to }: ListParams) {
  const where = {
    organizationId: orgId,
    ...(type && { type }),
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(from || to
      ? {
          dueDate: {
            ...(from && { gte: new Date(from) }),
            ...(to && { lte: new Date(to) }),
          },
        }
      : {}),
  }

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: { category: true, installments: { orderBy: { number: 'asc' } } },
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ])

  return { transactions, total, page, perPage }
}

export async function getById(orgId: string, id: string) {
  const tx = await prisma.transaction.findFirst({
    where: { id, organizationId: orgId },
    include: { category: true, installments: { orderBy: { number: 'asc' } } },
  })
  if (!tx) throw { status: 404, message: 'Lançamento não encontrado' }
  return tx
}

export async function create(orgId: string, input: CreateTransactionInput) {
  const dueDate = new Date(input.dueDate)

  const tx = await prisma.transaction.create({
    data: {
      organizationId: orgId,
      type: input.type,
      description: input.description,
      amount: input.amount,
      dueDate,
      categoryId: input.categoryId,
      notes: input.notes,
      isInstallment: input.isInstallment,
      totalInstallments: input.isInstallment ? input.totalInstallments : null,
    },
  })

  // Generate installments if parcelado
  if (input.isInstallment && input.totalInstallments) {
    const installmentAmount = parseFloat((input.amount / input.totalInstallments).toFixed(2))
    const installments = Array.from({ length: input.totalInstallments }, (_, i) => {
      const date = new Date(dueDate)
      date.setMonth(date.getMonth() + i)
      return {
        transactionId: tx.id,
        number: i + 1,
        amount: i === input.totalInstallments! - 1
          ? parseFloat((input.amount - installmentAmount * (input.totalInstallments! - 1)).toFixed(2))
          : installmentAmount,
        dueDate: date,
      }
    })

    await prisma.installment.createMany({ data: installments })
  }

  return getById(orgId, tx.id)
}

export async function update(orgId: string, id: string, input: UpdateTransactionInput) {
  await getById(orgId, id)

  return prisma.transaction.update({
    where: { id },
    data: {
      ...input,
      ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
    },
    include: { category: true, installments: { orderBy: { number: 'asc' } } },
  })
}

export async function remove(orgId: string, id: string) {
  await getById(orgId, id)
  await prisma.transaction.update({ where: { id }, data: { status: 'CANCELLED' } })
}

export async function pay(orgId: string, id: string) {
  const tx = await getById(orgId, id)
  if (tx.status === 'PAID') throw { status: 400, message: 'Lançamento já está pago' }
  if (tx.status === 'CANCELLED') throw { status: 400, message: 'Lançamento cancelado' }

  const now = new Date()

  // If installment-based, pay all remaining installments
  if (tx.isInstallment) {
    await prisma.installment.updateMany({
      where: { transactionId: id, status: 'PENDING' },
      data: { status: 'PAID', paidAt: now },
    })
  }

  return prisma.transaction.update({
    where: { id },
    data: { status: 'PAID', paidAt: now },
    include: { category: true, installments: { orderBy: { number: 'asc' } } },
  })
}

export async function payInstallment(orgId: string, txId: string, installmentId: string) {
  const tx = await getById(orgId, txId)

  const installment = await prisma.installment.findFirst({
    where: { id: installmentId, transactionId: txId },
  })
  if (!installment) throw { status: 404, message: 'Parcela não encontrada' }
  if (installment.status === 'PAID') throw { status: 400, message: 'Parcela já paga' }

  const now = new Date()
  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: 'PAID', paidAt: now },
  })

  // Check if all installments are paid → mark transaction as paid
  const pending = await prisma.installment.count({
    where: { transactionId: txId, status: 'PENDING' },
  })

  if (pending === 0) {
    await prisma.transaction.update({
      where: { id: txId },
      data: { status: 'PAID', paidAt: now },
    })
  }

  return getById(orgId, txId)
}
