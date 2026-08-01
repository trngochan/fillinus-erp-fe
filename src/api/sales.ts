import api from './axios'
import type { ApiResponse, LoginResponse } from '@/types/auth'
import type { PageResponse } from '@/types/common'

export interface RegisterRequest {
  username: string
  password: string
  fullName: string
  email: string
}

export type LeadSource = 'New Client' | 'Existing Client' | 'Referral' | 'Digital Lead'

export interface Lead {
  id: number
  leadId: string
  leadName: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  status: 'NEW' | 'IN_PROGRESS' | 'QUALIFIED' | 'REJECTED'
  source: LeadSource | null
  salesRepId: number | null
  salesRepName: string | null
  remark: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface SalesRep {
  id: number
  fullName: string
}

export type OpportunityStage =
  | 'PROSPECTING' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'

export interface OpportunityDetail {
  id: number
  serviceProduct: string
  quantity: number
  unit: string | null
  remark: string | null
}

export interface Opportunity {
  id: number
  opportunityId: string
  leadId: number | null
  opportunityName: string
  customer: string
  salesRepId: number
  salesRepName: string | null
  stage: OpportunityStage
  expectedRevenue: number
  description: string | null
  lifecycleStatus: 'OPEN' | 'CONVERTED' | 'CLOSED'
  details: OpportunityDetail[]
  hasQuotation: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateLeadRequest {
  leadName: string
  companyName?: string
  contactPerson?: string
  phone?: string
  email?: string
  source?: LeadSource | ''
  salesRepId?: number
  remark?: string
  /** Edit-only: New / In Progress / Rejected (Qualified is system-only, set by Convert) */
  status?: 'NEW' | 'IN_PROGRESS' | 'REJECTED'
}

export interface OpportunityDetailRequest {
  serviceProduct: string
  quantity: number
  unit?: string
  remark?: string
}

export interface ConvertLeadRequest {
  opportunityName: string
  projectType: 'Agency' | 'Label' | 'Others'
  expectedDealValue?: number
  salesRepId: number
  details: OpportunityDetailRequest[]
}

export interface CreateOpportunityRequest {
  opportunityName: string
  customer: string
  salesRepId: number
  stage?: OpportunityStage
  expectedRevenue?: number
  description?: string
  details: OpportunityDetailRequest[]
}

export type QuotationCurrency = 'VND' | 'USD'
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export interface QuotationDetail {
  id: number
  productService: string
  quantity: number
  unit: string | null
  standardPrice: number
  unitPrice: number
  amount: number
  remark: string | null
}

export interface Quotation {
  id: number
  quotationNo: string
  opportunityId: number
  opportunityName: string | null
  customer: string
  salesRepId: number
  salesRepName: string | null
  quotationDate: string
  expiredDate: string
  currency: QuotationCurrency
  status: QuotationStatus
  remark: string | null
  totalAmount: number
  details: QuotationDetail[]
  createdAt: string
  updatedAt: string
}

export interface QuotationDetailPriceInput {
  opportunityDetailId: number
  standardPrice?: number
  unitPrice: number
}

export interface CreateQuotationFromOpportunityRequest {
  expiredDate: string
  currency?: QuotationCurrency
  remark?: string
  detailPrices: QuotationDetailPriceInput[]
}

export interface QuotationDetailRequest {
  productService: string
  quantity: number
  unit?: string
  standardPrice?: number
  unitPrice: number
  remark?: string
}

export interface UpdateQuotationRequest {
  quotationDate: string
  expiredDate: string
  currency?: QuotationCurrency
  remark?: string
  details: QuotationDetailRequest[]
}

// ─── Register ─────────────────────────────────────────────────
export const register = (data: RegisterRequest) =>
  api.post<ApiResponse<LoginResponse>>('/auth/register', data)

// ─── Users (dropdown lookups) ───────────────────────────────────
export const getSalesReps = () =>
  api.get<ApiResponse<SalesRep[]>>('/users', { params: { role: 'SALE' } })

// ─── Leads ────────────────────────────────────────────────────
export const getLeads = (search?: string, status?: string, salesRepId?: number, page = 0, size = 10) =>
  api.get<ApiResponse<PageResponse<Lead>>>('/leads', { params: { search, status, salesRepId, page, size } })

export const getLead = (id: number) =>
  api.get<ApiResponse<Lead>>(`/leads/${id}`)

export const createLead = (data: CreateLeadRequest) =>
  api.post<ApiResponse<Lead>>('/leads', data)

export const updateLead = (id: number, data: CreateLeadRequest) =>
  api.put<ApiResponse<Lead>>(`/leads/${id}`, data)

export const deleteLead = (id: number) =>
  api.delete<ApiResponse<null>>(`/leads/${id}`)

export const convertLead = (id: number, data: ConvertLeadRequest) =>
  api.post<ApiResponse<Opportunity>>(`/leads/${id}/convert`, data)

export const importLeadsExcel = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<ApiResponse<Lead[]>>('/leads/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const downloadLeadTemplate = () =>
  api.get('/leads/import/template', { responseType: 'blob' })

// ─── Opportunities ────────────────────────────────────────────
export const getMyOpportunities = (search?: string, page = 0, size = 10) =>
  api.get<ApiResponse<PageResponse<Opportunity>>>('/opportunities', { params: { search, page, size } })

export const getOpportunity = (id: number) =>
  api.get<ApiResponse<Opportunity>>(`/opportunities/${id}`)

export const createOpportunity = (data: CreateOpportunityRequest) =>
  api.post<ApiResponse<Opportunity>>('/opportunities', data)

export const updateOpportunity = (id: number, data: CreateOpportunityRequest) =>
  api.put<ApiResponse<Opportunity>>(`/opportunities/${id}`, data)

export const deleteOpportunity = (id: number) =>
  api.delete<ApiResponse<null>>(`/opportunities/${id}`)

// ─── Quotations ───────────────────────────────────────────────
// BR-001: no standalone create — always created from an Opportunity.
export const createQuotationFromOpportunity = (opportunityId: number, data: CreateQuotationFromOpportunityRequest) =>
  api.post<ApiResponse<Quotation>>(`/opportunities/${opportunityId}/quotations`, data)

export const getMyQuotations = (search?: string, status?: string, page = 0, size = 10) =>
  api.get<ApiResponse<PageResponse<Quotation>>>('/quotations', { params: { search, status, page, size } })

export const getQuotation = (id: number) =>
  api.get<ApiResponse<Quotation>>(`/quotations/${id}`)

export const updateQuotation = (id: number, data: UpdateQuotationRequest) =>
  api.put<ApiResponse<Quotation>>(`/quotations/${id}`, data)

export const deleteQuotation = (id: number) =>
  api.delete<ApiResponse<null>>(`/quotations/${id}`)

export const createDealNegotiation = (id: number) =>
  api.post<ApiResponse<Quotation>>(`/quotations/${id}/deal-negotiation`)
