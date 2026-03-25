import { Router, Response } from 'express'
import path from 'path'
import multer from 'multer'
import * as service from './products.service'
import { createProductSchema, updateProductSchema, adjustStockSchema } from './products.schema'
import { authMiddleware } from '../../shared/middleware/auth.middleware'
import { asyncOrg, requireRole, OrgRequest } from '../../shared/middleware/org.middleware'
import { ok, created, noContent, badRequest, serverError, paginated } from '../../shared/utils/response'

const uploadDir = process.env.UPLOAD_LOCAL_PATH || './uploads'
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `product-${Date.now()}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.UPLOAD_MAX_SIZE_MB || '5')) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Apenas imagens são permitidas'))
  },
})

const router = Router({ mergeParams: true })

router.use(authMiddleware, asyncOrg)

router.get('/', async (req: OrgRequest, res: Response) => {
  const { page, perPage, search, categoryId, active } = req.query
  try {
    const result = await service.list({
      orgId: req.org!.id,
      page: page ? parseInt(page as string) : 1,
      perPage: perPage ? parseInt(perPage as string) : 20,
      search: search as string | undefined,
      categoryId: categoryId as string | undefined,
      active: active !== undefined ? active === 'true' : undefined,
    })
    return paginated(res, result.products, { total: result.total, page: result.page, perPage: result.perPage })
  } catch {
    return serverError(res)
  }
})

router.post('/', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const product = await service.create(req.org!.id, parsed.data)
    return created(res, product)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'PRODUCT_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.get('/:id', async (req: OrgRequest, res: Response) => {
  try {
    const product = await service.getById(req.org!.id, req.params.id as string)
    return ok(res, product)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'PRODUCT_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:id', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = updateProductSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const product = await service.update(req.org!.id, req.params.id as string, parsed.data)
    return ok(res, product)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'PRODUCT_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.delete('/:id', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  try {
    await service.remove(req.org!.id, req.params.id as string)
    return noContent(res)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'PRODUCT_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.post('/:id/photo', requireRole('OWNER', 'ADMIN'), upload.single('photo'), async (req: OrgRequest, res: Response) => {
  if (!req.file) return badRequest(res, 'Nenhum arquivo enviado')

  const photoUrl = `/uploads/${req.file.filename}`
  try {
    const product = await service.updatePhoto(req.org!.id, req.params.id as string, photoUrl)
    return ok(res, product)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'PRODUCT_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

router.patch('/:id/stock', requireRole('OWNER', 'ADMIN'), async (req: OrgRequest, res: Response) => {
  const parsed = adjustStockSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.errors[0].message)

  try {
    const product = await service.adjustStock(req.org!.id, req.params.id as string, parsed.data)
    return ok(res, product)
  } catch (err: any) {
    if (err.status) return res.status(err.status).json({ error: 'PRODUCT_ERROR', message: err.message, statusCode: err.status })
    return serverError(res)
  }
})

export default router
