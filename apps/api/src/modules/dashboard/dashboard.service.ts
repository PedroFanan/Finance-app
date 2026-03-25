import { prisma } from '../../prisma/client'

export async function getSummary(orgId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      status: { not: 'CANCELLED' },
      dueDate: { gte: startOfMonth, lte: endOfMonth },
    },
    select: { type: true, status: true, amount: true },
  })

  const summary = {
    totalReceivable: 0,
    totalPayable: 0,
    paidReceivable: 0,
    paidPayable: 0,
    pendingReceivable: 0,
    pendingPayable: 0,
    balance: 0,
  }

  for (const tx of transactions) {
    const amount = parseFloat(tx.amount.toString())
    if (tx.type === 'RECEIVABLE') {
      summary.totalReceivable += amount
      if (tx.status === 'PAID') summary.paidReceivable += amount
      else summary.pendingReceivable += amount
    } else {
      summary.totalPayable += amount
      if (tx.status === 'PAID') summary.paidPayable += amount
      else summary.pendingPayable += amount
    }
  }

  summary.balance = summary.totalReceivable - summary.totalPayable
  return summary
}

export async function getMonthly(orgId: string) {
  const now = new Date()
  const months: { month: string; receivable: number; payable: number; balance: number }[] = []

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        status: { not: 'CANCELLED' },
        dueDate: { gte: start, lte: end },
      },
      select: { type: true, amount: true },
    })

    let receivable = 0
    let payable = 0
    for (const tx of transactions) {
      const amount = parseFloat(tx.amount.toString())
      if (tx.type === 'RECEIVABLE') receivable += amount
      else payable += amount
    }

    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    months.push({ month, receivable, payable, balance: receivable - payable })
  }

  return months
}

export async function getUpcoming(orgId: string) {
  const now = new Date()
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)

  return prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      status: 'PENDING',
      dueDate: { gte: now, lte: in7Days },
    },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
  })
}

export async function getOverdue(orgId: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  return prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      status: 'PENDING',
      dueDate: { lt: now },
    },
    include: { category: true },
    orderBy: { dueDate: 'asc' },
  })
}
