'use client'

import { useParams } from 'next/navigation'
import TransactionsPage from '@/components/transactions/transactions-page'

export default function ReceivablePage() {
  const params = useParams()
  return <TransactionsPage org={params.org as string} type="RECEIVABLE" />
}
