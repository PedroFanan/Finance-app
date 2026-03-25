import { z } from 'zod'

export const createTransactionSchema = z.object({
  type: z.enum(['PAYABLE', 'RECEIVABLE']),
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()),
  categoryId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.coerce.number().int().min(2).max(360).optional(),
})

export const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  dueDate: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  categoryId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']).optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
