export type SubmissionStatus = 'PENDING' | 'CONTACTED' | 'APPROVED' | 'REJECTED'

export interface PaginatedSubmissions {
  count: number
  next: string | null
  previous: string | null
  results: Submission[]
}

export interface Submission {
  id: string
  category: string
  listing_type: string
  region: string
  zone: string | null
  woreda: string | null
  address: string | null
  details: Record<string, unknown>
  photos: string[]
  owner_phone: string
  owner_whatsapp: string | null
  owner_name: string | null
  status: SubmissionStatus
  owner_message: string | null
  listing: string | null
  created_at: string
  updated_at: string
}
