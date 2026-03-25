// ─── Enums ────────────────────────────────────────────────────────────────────

export type OrganizationType = 'PERSONAL' | 'COMPANY'
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type TransactionStatus = 'PENDING' | 'PAID' | 'CANCELLED'
export type TransactionType = 'PAYABLE' | 'RECEIVABLE'
export type InstallmentStatus = 'PENDING' | 'PAID' | 'CANCELLED'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
  id: string
  name: string
  slug: string
  type: OrganizationType
  logoUrl: string | null
  cnpj: string | null
  createdAt: string
}

export interface OrganizationMember {
  id: string
  userId: string
  organizationId: string
  role: MemberRole
  joinedAt: string
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>
}

export interface CreateOrganizationPayload {
  name: string
  type: OrganizationType
  cnpj?: string
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  organizationId: string
  name: string
  color: string | null
  icon: string | null
  createdAt: string
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  organizationId: string
  categoryId: string | null
  name: string
  sku: string | null
  description: string | null
  photoUrl: string | null
  price: string
  costPrice: string | null
  weight: string | null
  stockQty: number
  active: boolean
  createdAt: string
  updatedAt: string
  category?: Category
}

export interface CreateProductPayload {
  name: string
  sku?: string
  description?: string
  price: number
  costPrice?: number
  weight?: number
  stockQty?: number
  categoryId?: string
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface Installment {
  id: string
  transactionId: string
  number: number
  amount: string
  dueDate: string
  paidAt: string | null
  status: InstallmentStatus
}

export interface Transaction {
  id: string
  organizationId: string
  categoryId: string | null
  type: TransactionType
  description: string
  amount: string
  dueDate: string
  paidAt: string | null
  status: TransactionStatus
  notes: string | null
  isInstallment: boolean
  totalInstallments: number | null
  createdAt: string
  updatedAt: string
  category?: Category
  installments?: Installment[]
}

export interface CreateTransactionPayload {
  type: TransactionType
  description: string
  amount: number
  dueDate: string
  categoryId?: string
  notes?: string
  isInstallment?: boolean
  totalInstallments?: number
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalReceivable: number
  totalPayable: number
  balance: number
  pendingReceivable: number
  pendingPayable: number
  paidReceivable: number
  paidPayable: number
}

export interface MonthlyData {
  month: string  // "2025-01"
  receivable: number
  payable: number
  balance: number
}

// ─── API Response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    perPage: number
    totalPages: number
  }
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}
