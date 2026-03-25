import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  costPrice: z.coerce.number().positive().optional().nullable(),
  weight: z.coerce.number().positive().optional().nullable(),
  stockQty: z.coerce.number().int().min(0).default(0),
  categoryId: z.string().optional().nullable(),
})

export const updateProductSchema = createProductSchema.partial()

export const adjustStockSchema = z.object({
  qty: z.number().int(),
  operation: z.enum(['add', 'subtract', 'set']),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type AdjustStockInput = z.infer<typeof adjustStockSchema>
