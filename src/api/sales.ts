import api from './axios'
import type { ApiResponse, LoginResponse } from '@/types/auth'

export interface RegisterRequest {
  username: string
  password: string
  fullName: string
  email: string
}

export interface Lead {
  id: number
  leadId: string
  leadName: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  status: 'NEW' | 'IN_PROGRESS' | 'CONVERTED' | 'CLOSED'
  createdBy: number
  createdAt: string
  updatedAt: string
}

export interface Opportunity {
  id: number
  opportunityId: string
  leadId: number
  leadName: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  assignedTo: number
  status: 'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST'
  createdAt: string
  updatedAt: string
}

export interface CreateLeadRequest {
  leadName: string
  companyName?: string
  contactPerson?: string
  phone?: string
  email?: string
}

export interface UpdateOpportunityDetailsRequest {
  companyName?: string
  contactPerson?: string
  phone?: string
  email?: string
}

// ─── Register ─────────────────────────────────────────────────
export const register = (data: RegisterRequest) =>
  api.post<ApiResponse<LoginResponse>>('/auth/register', data)

// ─── Leads ────────────────────────────────────────────────────
export const getLeads = (search?: string, status?: string) =>
  api.get<ApiResponse<Lead[]>>('/leads', { params: { search, status } })

export const getLead = (id: number) =>
  api.get<ApiResponse<Lead>>(`/leads/${id}`)

export const createLead = (data: CreateLeadRequest) =>
  api.post<ApiResponse<Lead>>('/leads', data)

export const updateLead = (id: number, data: CreateLeadRequest) =>
  api.put<ApiResponse<Lead>>(`/leads/${id}`, data)

export const deleteLead = (id: number) =>
  api.delete<ApiResponse<null>>(`/leads/${id}`)

export const convertLead = (id: number) =>
  api.post<ApiResponse<Opportunity>>(`/leads/${id}/convert`)

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
export const getMyOpportunities = () =>
  api.get<ApiResponse<Opportunity[]>>('/opportunities')

export const getOpportunity = (id: number) =>
  api.get<ApiResponse<Opportunity>>(`/opportunities/${id}`)

export const updateOpportunity = (id: number, data: UpdateOpportunityDetailsRequest) =>
  api.put<ApiResponse<Opportunity>>(`/opportunities/${id}`, data)

export const updateOpportunityStatus = (id: number, status: string) =>
  api.put<ApiResponse<Opportunity>>(`/opportunities/${id}/status`, { status })
