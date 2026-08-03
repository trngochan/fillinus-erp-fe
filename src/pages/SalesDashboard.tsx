import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Upload, Download, RefreshCw,
  Trash2, Edit2, ArrowRightCircle, Eye, Send,
  LogOut, User, Briefcase, Users, TrendingUp, FileText, X, Check, Loader2,
  Handshake, Trophy, History, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/api/axios'
import ConfirmDialog from '@/components/ConfirmDialog'
import Pagination from '@/components/Pagination'
import {
  getLeads, createLead, updateLead, deleteLead, convertLead,
  importLeadsExcel, downloadLeadTemplate, getSalesReps,
  getMyOpportunities, createOpportunity, updateOpportunity, deleteOpportunity,
  getMyQuotations, createQuotationFromOpportunity, updateQuotation, deleteQuotation, createDealNegotiation,
  getMyDealNegotiations, getDealNegotiation, updateDealNegotiation, addNegotiationHistory,
  createDealResult, getMyDealResults,
} from '@/api/sales'
import type {
  Lead, Opportunity, OpportunityStage, OpportunityDetailRequest,
  CreateLeadRequest, ConvertLeadRequest, CreateOpportunityRequest,
  Quotation, QuotationCurrency, QuotationStatus, QuotationDetailRequest,
  CreateQuotationFromOpportunityRequest, UpdateQuotationRequest,
  SalesRep, LeadSource,
  DealNegotiation, CreateDealNegotiationRequest, UpdateDealNegotiationRequest, AddNegotiationHistoryRequest,
  DealResult, DealResultType, CreateDealResultRequest,
} from '@/api/sales'
import { COMMUNICATION_CHANNELS } from '@/api/sales'

const LEAD_SOURCES: LeadSource[] = ['New Client', 'Existing Client', 'Referral', 'Digital Lead']
const PROJECT_TYPES = ['Agency', 'Label', 'Others'] as const
const OPPORTUNITY_STAGES: OpportunityStage[] =
  ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
const CURRENCIES: QuotationCurrency[] = ['VND', 'USD']
const LEAD_STATUSES: Lead['status'][] = ['NEW', 'IN_PROGRESS', 'QUALIFIED', 'REJECTED']
const QUOTATION_STATUSES: QuotationStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
const DEAL_RESULTS: DealResultType[] = ['WON', 'LOST']

/** "IN_PROGRESS" -> "In Progress" — shared label formatter for every status/result filter dropdown. */
const formatStatusLabel = (value: string) =>
  value.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')

// ─── Status badge colours ──────────────────────────────────────
const leadStatusColor: Record<string, string> = {
  NEW:         'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  QUALIFIED:   'bg-green-500/20 text-green-300 border-green-500/30',
  REJECTED:    'bg-red-500/20 text-red-300 border-red-500/30',
}
const stageColor: Record<string, string> = {
  PROSPECTING:  'bg-slate-500/20 text-slate-300 border-slate-500/30',
  QUALIFICATION:'bg-blue-500/20 text-blue-300 border-blue-500/30',
  PROPOSAL:     'bg-purple-500/20 text-purple-300 border-purple-500/30',
  NEGOTIATION:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  CLOSED_WON:   'bg-green-500/20 text-green-300 border-green-500/30',
  CLOSED_LOST:  'bg-red-500/20 text-red-300 border-red-500/30',
}
const lifecycleStatusColor: Record<string, string> = {
  OPEN:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  CONVERTED: 'bg-green-500/20 text-green-300 border-green-500/30',
  CLOSED:    'bg-slate-500/20 text-slate-400 border-slate-500/30',
}
const quotationStatusColor: Record<string, string> = {
  DRAFT:    'bg-slate-500/20 text-slate-300 border-slate-500/30',
  SENT:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ACCEPTED: 'bg-green-500/20 text-green-300 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
  EXPIRED:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
}
const negotiationStatusColor: Record<string, string> = {
  NEGOTIATING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  WON:         'bg-green-500/20 text-green-300 border-green-500/30',
  LOST:        'bg-red-500/20 text-red-300 border-red-500/30',
}
const dealResultColor: Record<string, string> = {
  WON:  'bg-green-500/20 text-green-300 border-green-500/30',
  LOST: 'bg-red-500/20 text-red-300 border-red-500/30',
}

// ─── Lead Form Modal ───────────────────────────────────────────
function LeadModal({
  initial, salesReps, onSave, onClose,
}: {
  initial?: Lead | null
  salesReps: SalesRep[]
  onSave: (data: CreateLeadRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateLeadRequest>({
    leadName:      initial?.leadName      ?? '',
    companyName:   initial?.companyName   ?? '',
    contactPerson: initial?.contactPerson ?? '',
    phone:         initial?.phone         ?? '',
    email:         initial?.email         ?? '',
    source:        initial?.source        ?? '',
    salesRepId:    initial?.salesRepId    ?? undefined,
    remark:        initial?.remark        ?? '',
    status:        (initial?.status as 'NEW' | 'IN_PROGRESS' | 'REJECTED' | undefined) ?? undefined,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.leadName.trim())    { setError('Lead Name is required'); return }
    if (!form.companyName?.trim()) { setError('Company is required'); return }
    if (!form.phone?.trim())      { setError('Phone is required'); return }
    if (!form.email?.trim())      { setError('Email is required'); return }
    if (!form.salesRepId)         { setError('Sales Rep is required'); return }
    setSaving(true)
    try { await onSave(form) } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Save failed'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{initial ? 'Edit Lead' : 'Create Lead'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          {[
            { label: 'Lead Name *', key: 'leadName',      type: 'text',  placeholder: 'Company contact name' },
            { label: 'Company *',   key: 'companyName',   type: 'text',  placeholder: 'Company name' },
            { label: 'Contact',     key: 'contactPerson', type: 'text',  placeholder: 'Contact person' },
            { label: 'Phone *',     key: 'phone',         type: 'tel',   placeholder: '+84 xxx xxx xxx' },
            { label: 'Email *',     key: 'email',         type: 'email', placeholder: 'contact@company.com' },
          ].map(f => (
            <div key={f.key}>
              <label className="form-label">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                className="input-field"
                value={(form as unknown as Record<string, string>)[f.key] ?? ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}

          <div>
            <label className="form-label">Source</label>
            <select
              className="input-field"
              value={form.source ?? ''}
              onChange={e => setForm(prev => ({ ...prev, source: e.target.value as LeadSource | '' }))}
            >
              <option value="">— Select source —</option>
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Sales Rep *</label>
            <select
              className="input-field"
              value={form.salesRepId ?? ''}
              onChange={e => setForm(prev => ({ ...prev, salesRepId: e.target.value ? Number(e.target.value) : undefined }))}
            >
              <option value="">— Select Sales Rep —</option>
              {salesReps.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
            </select>
          </div>

          {initial && (
            <div>
              <label className="form-label">Status</label>
              <select
                className="input-field"
                value={form.status ?? initial.status}
                disabled={initial.status === 'QUALIFIED'}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'NEW' | 'IN_PROGRESS' | 'REJECTED' }))}
              >
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REJECTED">Rejected</option>
                {initial.status === 'QUALIFIED' && <option value="QUALIFIED">Qualified</option>}
              </select>
              {initial.status === 'QUALIFIED' && (
                <p className="text-xs text-slate-500 mt-1">Qualified is set automatically by Convert — cannot be edited manually.</p>
              )}
            </div>
          )}

          <div>
            <label className="form-label">Remark</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Notes about this lead..."
              value={form.remark ?? ''}
              onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {initial ? 'Save Changes' : 'Create Lead'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Opportunity Create/Edit Modal (Header + Detail line items) ────
function OpportunityModal({
  initial, salesReps, onSave, onClose,
}: {
  initial?: Opportunity | null
  salesReps: SalesRep[]
  onSave: (data: CreateOpportunityRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    opportunityName: initial?.opportunityName ?? '',
    customer:        initial?.customer        ?? '',
    salesRepId:      initial?.salesRepId      ?? undefined as number | undefined,
    stage:           initial?.stage           ?? 'PROSPECTING' as OpportunityStage,
    expectedRevenue: initial?.expectedRevenue?.toString() ?? '0',
    description:     initial?.description     ?? '',
  })
  const [details, setDetails] = useState<OpportunityDetailRequest[]>(
    initial?.details?.length
      ? initial.details.map(d => ({ serviceProduct: d.serviceProduct, quantity: d.quantity, unit: d.unit ?? '', remark: d.remark ?? '' }))
      : [{ serviceProduct: '', quantity: 1, unit: '', remark: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  // Locked once converted to a Quotation (BR: Blocked once converted) — same read-only
  // pattern as QuotationModal/DealNegotiationModal, so "view a locked record" behaves
  // consistently across every Sales tab.
  const editable = !initial?.hasQuotation

  const addRow = () => setDetails(prev => [...prev, { serviceProduct: '', quantity: 1, unit: '', remark: '' }])
  const removeRow = (i: number) => setDetails(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)
  const updateRow = (i: number, patch: Partial<OpportunityDetailRequest>) =>
    setDetails(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.opportunityName.trim()) { setError('Opportunity Name is required'); return }
    if (!form.customer.trim())        { setError('Customer is required'); return }
    if (!form.salesRepId)             { setError('Sales Rep is required'); return }
    if (details.some(d => !d.serviceProduct.trim() || !d.quantity || d.quantity <= 0)) {
      setError('Every detail row needs a Service/Product and a Quantity greater than 0'); return
    }
    setSaving(true)
    try {
      await onSave({
        opportunityName: form.opportunityName,
        customer: form.customer,
        salesRepId: form.salesRepId!,
        stage: form.stage,
        expectedRevenue: Number(form.expectedRevenue) || 0,
        description: form.description,
        details,
      })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Save failed'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {initial ? `${editable ? 'Edit' : 'View'} Opportunity — ${initial.opportunityId}` : 'Create Opportunity'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <div className="alert-error">{error}</div>}
          {!editable && (
            <p className="text-xs text-slate-500">
              This Opportunity has already been converted to a Quotation — read-only.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Opportunity Name *</label>
              <input type="text" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" value={form.opportunityName}
                onChange={e => setForm(prev => ({ ...prev, opportunityName: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Customer *</label>
              <input type="text" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" placeholder="Customer / company name" value={form.customer}
                onChange={e => setForm(prev => ({ ...prev, customer: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Sales Rep *</label>
              <select disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" value={form.salesRepId ?? ''}
                onChange={e => setForm(prev => ({ ...prev, salesRepId: e.target.value ? Number(e.target.value) : undefined }))}>
                <option value="">— Select Sales Rep —</option>
                {salesReps.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Stage</label>
              <select disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" value={form.stage}
                onChange={e => setForm(prev => ({ ...prev, stage: e.target.value as OpportunityStage }))}>
                {OPPORTUNITY_STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Expected Revenue</label>
              <input type="number" min="0" step="0.01" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" value={form.expectedRevenue}
                onChange={e => setForm(prev => ({ ...prev, expectedRevenue: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Description</label>
              <textarea disabled={!editable} rows={2} className="input-field disabled:opacity-60 disabled:cursor-not-allowed" value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Detail — Service / Product *</label>
              {editable && <button type="button" onClick={addRow} className="btn-ghost text-xs">+ Add Row</button>}
            </div>
            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-white/5 rounded-xl p-2.5">
                  <input type="text" placeholder="Service/Product *" disabled={!editable} className="input-field col-span-4 py-2 text-sm disabled:opacity-60"
                    value={d.serviceProduct} onChange={e => updateRow(i, { serviceProduct: e.target.value })} />
                  <input type="number" min="0" step="0.01" placeholder="Qty" disabled={!editable} className="input-field col-span-2 py-2 text-sm disabled:opacity-60"
                    value={d.quantity} onChange={e => updateRow(i, { quantity: Number(e.target.value) })} />
                  <input type="text" placeholder="Unit" disabled={!editable} className="input-field col-span-2 py-2 text-sm disabled:opacity-60"
                    value={d.unit} onChange={e => updateRow(i, { unit: e.target.value })} />
                  <input type="text" placeholder="Remark" disabled={!editable} className="input-field col-span-3 py-2 text-sm disabled:opacity-60"
                    value={d.remark} onChange={e => updateRow(i, { remark: e.target.value })} />
                  {editable && (
                  <button type="button" onClick={() => removeRow(i)} disabled={details.length <= 1}
                    className="col-span-1 p-2 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Remove row">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{editable ? 'Cancel' : 'Close'}</button>
            {editable && (
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> {initial ? 'Save Changes' : 'Create Opportunity'}</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Convert Lead -> Opportunity Modal ──────────────────────────
function ConvertLeadModal({
  lead, salesReps, onConvert, onClose,
}: {
  lead: Lead
  salesReps: SalesRep[]
  onConvert: (data: ConvertLeadRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<Omit<ConvertLeadRequest, 'details'>>({
    opportunityName: lead.leadName,
    projectType: 'Agency',
    expectedDealValue: undefined,
    salesRepId: lead.salesRepId ?? undefined as unknown as number,
  })
  const [details, setDetails] = useState<OpportunityDetailRequest[]>(
    [{ serviceProduct: '', quantity: 1, unit: '', remark: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const addRow = () => setDetails(prev => [...prev, { serviceProduct: '', quantity: 1, unit: '', remark: '' }])
  const removeRow = (i: number) => setDetails(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)
  const updateRow = (i: number, patch: Partial<OpportunityDetailRequest>) =>
    setDetails(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.opportunityName.trim()) { setError('Opportunity Name is required'); return }
    if (!form.salesRepId)             { setError('Sales Rep is required'); return }
    if (details.some(d => !d.serviceProduct.trim() || !d.quantity || d.quantity <= 0)) {
      setError('Every detail row needs a Service/Product and a Quantity greater than 0'); return
    }
    setSaving(true)
    try { await onConvert({ ...form, details }) } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Conversion failed'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Convert "{lead.leadName}" to Opportunity</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div>
            <label className="form-label">Opportunity Name *</label>
            <input type="text" className="input-field" value={form.opportunityName}
              onChange={e => setForm(prev => ({ ...prev, opportunityName: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Project Type *</label>
            <select className="input-field" value={form.projectType}
              onChange={e => setForm(prev => ({ ...prev, projectType: e.target.value as ConvertLeadRequest['projectType'] }))}>
              {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Expected Deal Value</label>
            <input type="number" min="0" step="0.01" className="input-field" value={form.expectedDealValue ?? ''}
              onChange={e => setForm(prev => ({ ...prev, expectedDealValue: e.target.value ? Number(e.target.value) : undefined }))} />
          </div>
          <div>
            <label className="form-label">Sales Rep *</label>
            <select className="input-field" value={form.salesRepId ?? ''}
              onChange={e => setForm(prev => ({ ...prev, salesRepId: Number(e.target.value) }))}>
              <option value="">— Select Sales Rep —</option>
              {salesReps.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Detail — Service / Product *</label>
              <button type="button" onClick={addRow} className="btn-ghost text-xs">+ Add Row</button>
            </div>
            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-white/5 rounded-xl p-2.5">
                  <input type="text" placeholder="Service/Product *" className="input-field col-span-4 py-2 text-sm"
                    value={d.serviceProduct} onChange={e => updateRow(i, { serviceProduct: e.target.value })} />
                  <input type="number" min="0" step="0.01" placeholder="Qty" className="input-field col-span-2 py-2 text-sm"
                    value={d.quantity} onChange={e => updateRow(i, { quantity: Number(e.target.value) })} />
                  <input type="text" placeholder="Unit" className="input-field col-span-2 py-2 text-sm"
                    value={d.unit} onChange={e => updateRow(i, { unit: e.target.value })} />
                  <input type="text" placeholder="Remark" className="input-field col-span-3 py-2 text-sm"
                    value={d.remark} onChange={e => updateRow(i, { remark: e.target.value })} />
                  <button type="button" onClick={() => removeRow(i)} disabled={details.length <= 1}
                    className="col-span-1 p-2 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Remove row">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting...</> : <><ArrowRightCircle className="w-4 h-4" /> Convert</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Create Quotation Modal (from an Opportunity row) ───────────
function CreateQuotationModal({
  opportunity, onCreate, onClose,
}: {
  opportunity: Opportunity
  onCreate: (data: CreateQuotationFromOpportunityRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState({
    expiredDate: '', currency: 'VND' as QuotationCurrency, remark: '',
  })
  const [prices, setPrices] = useState<Record<number, { standardPrice: string; unitPrice: string }>>(
    Object.fromEntries(opportunity.details.map(d => [d.id, { standardPrice: '0', unitPrice: '0' }]))
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const setPrice = (detailId: number, patch: Partial<{ standardPrice: string; unitPrice: string }>) =>
    setPrices(prev => ({ ...prev, [detailId]: { ...prev[detailId], ...patch } }))

  const totalAmount = opportunity.details.reduce(
    (sum, d) => sum + d.quantity * (Number(prices[d.id]?.unitPrice) || 0), 0
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.expiredDate) { setError('Expired Date is required'); return }
    if (opportunity.details.some(d => prices[d.id]?.unitPrice === '' || Number(prices[d.id]?.unitPrice) < 0)) {
      setError('Enter a Unit Price (>= 0) for every detail line'); return
    }
    setSaving(true)
    try {
      await onCreate({
        ...form,
        detailPrices: opportunity.details.map(d => ({
          opportunityDetailId: d.id,
          standardPrice: Number(prices[d.id]?.standardPrice) || 0,
          unitPrice: Number(prices[d.id]?.unitPrice) || 0,
        })),
      })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create quotation'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Create Quotation — {opportunity.opportunityId}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <p className="text-sm text-slate-400">
            Customer, Sales Rep and Detail lines (Product/Qty/Unit) are inherited automatically from this Opportunity — enter the price below.
          </p>
          <div>
            <label className="form-label">Expired Date *</label>
            <input type="date" className="input-field" value={form.expiredDate}
              onChange={e => setForm(prev => ({ ...prev, expiredDate: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select className="input-field" value={form.currency}
              onChange={e => setForm(prev => ({ ...prev, currency: e.target.value as QuotationCurrency }))}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Detail — Product / Service</label>
            {opportunity.details.length === 0 && (
              <div className="alert-error text-sm">
                This Opportunity has no Service/Product line yet — edit it first (Add Row) before creating a Quotation.
              </div>
            )}
            <div className="space-y-2">
              {opportunity.details.map(d => (
                <div key={d.id} className="grid grid-cols-12 gap-2 items-center bg-white/5 rounded-xl p-2.5">
                  <div className="col-span-4 text-sm text-slate-200 truncate" title={d.serviceProduct}>{d.serviceProduct}</div>
                  <div className="col-span-2 text-sm text-slate-400 tabular-nums">{d.quantity} {d.unit ?? ''}</div>
                  <input type="number" min="0" step="0.01" placeholder="Std Price" className="input-field col-span-2 py-2 text-sm"
                    value={prices[d.id]?.standardPrice ?? ''} onChange={e => setPrice(d.id, { standardPrice: e.target.value })} />
                  <input type="number" min="0" step="0.01" placeholder="Unit Price *" className="input-field col-span-2 py-2 text-sm"
                    value={prices[d.id]?.unitPrice ?? ''} onChange={e => setPrice(d.id, { unitPrice: e.target.value })} />
                  <div className="col-span-2 text-sm text-slate-300 tabular-nums text-right pr-1">
                    {(d.quantity * (Number(prices[d.id]?.unitPrice) || 0)).toLocaleString('en-US')}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 text-sm">
              <span className="text-slate-400 mr-2">Total Amount:</span>
              <span className="text-white font-semibold tabular-nums">{totalAmount.toLocaleString('en-US')} {form.currency}</span>
            </div>
          </div>

          <div>
            <label className="form-label">Remark</label>
            <textarea className="input-field" rows={2} value={form.remark}
              onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || opportunity.details.length === 0} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><FileText className="w-4 h-4" /> Create Quotation</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Quotation View/Edit Modal ───────────────────────────────────
function QuotationModal({
  initial, onSave, onClose,
}: {
  initial: Quotation
  onSave: (data: UpdateQuotationRequest) => Promise<void>
  onClose: () => void
}) {
  const editable = initial.status === 'DRAFT'
  const [form, setForm] = useState({
    quotationDate: initial.quotationDate,
    expiredDate:   initial.expiredDate,
    currency:      initial.currency,
    remark:        initial.remark ?? '',
  })
  const [details, setDetails] = useState<QuotationDetailRequest[]>(
    initial.details.map(d => ({
      productService: d.productService, quantity: d.quantity, unit: d.unit ?? '',
      standardPrice: d.standardPrice, unitPrice: d.unitPrice, remark: d.remark ?? '',
    }))
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const totalAmount = details.reduce((sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0), 0)

  const addRow = () => setDetails(prev => [...prev, { productService: '', quantity: 1, unit: '', standardPrice: 0, unitPrice: 0, remark: '' }])
  const removeRow = (i: number) => setDetails(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)
  const updateRow = (i: number, patch: Partial<QuotationDetailRequest>) =>
    setDetails(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (details.some(d => !d.productService.trim() || !d.quantity || d.quantity <= 0)) {
      setError('Every detail row needs a Product/Service and a Quantity greater than 0'); return
    }
    setSaving(true)
    try {
      await onSave({ ...form, details })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Save failed'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {editable ? 'Edit' : 'View'} Quotation — {initial.quotationNo}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <div className="alert-error">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Opportunity</label>
              <input disabled value={initial.opportunityName ?? '—'} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div><label className="form-label">Customer</label>
              <input disabled value={initial.customer} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div><label className="form-label">Sales Rep</label>
              <input disabled value={initial.salesRepName ?? '—'} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div><label className="form-label">Status</label>
              <input disabled value={initial.status} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div>
              <label className="form-label">Quotation Date *</label>
              <input type="date" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.quotationDate} onChange={e => setForm(prev => ({ ...prev, quotationDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Expired Date *</label>
              <input type="date" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.expiredDate} onChange={e => setForm(prev => ({ ...prev, expiredDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Currency</label>
              <select disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value as QuotationCurrency }))}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Remark</label>
              <textarea disabled={!editable} rows={2} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.remark} onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Detail — Product / Service</label>
              {editable && <button type="button" onClick={addRow} className="btn-ghost text-xs">+ Add Row</button>}
            </div>
            <div className="space-y-2">
              {details.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start bg-white/5 rounded-xl p-2.5">
                  <input type="text" placeholder="Product/Service *" disabled={!editable} className="input-field col-span-3 py-2 text-sm disabled:opacity-60"
                    value={d.productService} onChange={e => updateRow(i, { productService: e.target.value })} />
                  <input type="number" min="0" step="0.01" placeholder="Qty" disabled={!editable} className="input-field col-span-1 py-2 text-sm disabled:opacity-60"
                    value={d.quantity} onChange={e => updateRow(i, { quantity: Number(e.target.value) })} />
                  <input type="text" placeholder="Unit" disabled={!editable} className="input-field col-span-1 py-2 text-sm disabled:opacity-60"
                    value={d.unit} onChange={e => updateRow(i, { unit: e.target.value })} />
                  <input type="number" min="0" step="0.01" placeholder="Std Price" disabled={!editable} className="input-field col-span-2 py-2 text-sm disabled:opacity-60"
                    value={d.standardPrice} onChange={e => updateRow(i, { standardPrice: Number(e.target.value) })} />
                  <input type="number" min="0" step="0.01" placeholder="Unit Price" disabled={!editable} className="input-field col-span-2 py-2 text-sm disabled:opacity-60"
                    value={d.unitPrice} onChange={e => updateRow(i, { unitPrice: Number(e.target.value) })} />
                  <div className="col-span-2 py-2 text-sm text-slate-300 tabular-nums text-right pr-2">
                    {((d.quantity || 0) * (d.unitPrice || 0)).toLocaleString('en-US')}
                  </div>
                  {editable && (
                    <button type="button" onClick={() => removeRow(i)} disabled={details.length <= 1}
                      className="col-span-1 p-2 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed" title="Remove row">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 text-sm">
              <span className="text-slate-400 mr-2">Total Amount:</span>
              <span className="text-white font-semibold tabular-nums">{totalAmount.toLocaleString('en-US')} {form.currency}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{editable ? 'Cancel' : 'Close'}</button>
            {editable && (
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Create Deal Negotiation Modal (from a Quotation row, SAL-004 BR-001) ───
function CreateDealNegotiationModal({
  quote, onCreate, onClose,
}: {
  quote: Quotation
  onCreate: (data: CreateDealNegotiationRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateDealNegotiationRequest>({
    meetingDate: new Date().toISOString().slice(0, 10),
    communicationChannel: COMMUNICATION_CHANNELS[0],
    contactPerson: '',
    internalNote: '',
    discussion: '',
    customerFeedback: '',
    nextAction: '',
    nextFollowUpDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.meetingDate)             { setError('Meeting Date is required'); return }
    if (!form.communicationChannel)    { setError('Communication Channel is required'); return }
    if (!form.discussion.trim())       { setError('Discussion is required'); return }
    if (form.nextFollowUpDate && form.nextFollowUpDate < form.meetingDate) {
      setError('Next Follow-up Date must be on or after Meeting Date'); return
    }
    setSaving(true)
    try {
      await onCreate({ ...form, nextFollowUpDate: form.nextFollowUpDate || undefined })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to create Deal Negotiation'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Create Deal Negotiation — {quote.quotationNo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <p className="text-sm text-slate-400">
            Customer, Opportunity and Sales Rep are inherited from this Quotation. The Quotation moves to Sent once created.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Meeting Date *</label>
              <input type="date" className="input-field" value={form.meetingDate}
                onChange={e => setForm(prev => ({ ...prev, meetingDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Communication Channel *</label>
              <select className="input-field" value={form.communicationChannel}
                onChange={e => setForm(prev => ({ ...prev, communicationChannel: e.target.value }))}>
                {COMMUNICATION_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="form-label">Contact Person</label>
              <input type="text" className="input-field" placeholder="Customer-side contact" value={form.contactPerson}
                onChange={e => setForm(prev => ({ ...prev, contactPerson: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="form-label">Internal Note</label>
              <textarea className="input-field" rows={2} value={form.internalNote}
                onChange={e => setForm(prev => ({ ...prev, internalNote: e.target.value }))} />
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4 space-y-3">
            <label className="form-label mb-0">Initial Negotiation History</label>
            <div>
              <label className="form-label">Discussion *</label>
              <textarea className="input-field" rows={2} placeholder="What was discussed with the customer?" value={form.discussion}
                onChange={e => setForm(prev => ({ ...prev, discussion: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Customer Feedback</label>
              <textarea className="input-field" rows={2} value={form.customerFeedback}
                onChange={e => setForm(prev => ({ ...prev, customerFeedback: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Next Action</label>
                <input type="text" className="input-field" value={form.nextAction}
                  onChange={e => setForm(prev => ({ ...prev, nextAction: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Next Follow-up Date</label>
                <input type="date" className="input-field" value={form.nextFollowUpDate}
                  onChange={e => setForm(prev => ({ ...prev, nextFollowUpDate: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Handshake className="w-4 h-4" /> Create Deal Negotiation</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Deal Negotiation View/Edit Modal (SAL-004) ─────────────────
function DealNegotiationModal({
  initial, onSaveHeader, onAddHistory, onComplete, onClose,
}: {
  initial: DealNegotiation
  onSaveHeader: (data: UpdateDealNegotiationRequest) => Promise<void>
  onAddHistory: (data: AddNegotiationHistoryRequest) => Promise<void>
  onComplete: () => void
  onClose: () => void
}) {
  const editable = initial.status === 'NEGOTIATING'
  const [form, setForm] = useState({
    meetingDate: initial.meetingDate,
    communicationChannel: initial.communicationChannel,
    contactPerson: initial.contactPerson ?? '',
    internalNote: initial.internalNote ?? '',
  })
  const [newHistory, setNewHistory] = useState({ discussion: '', customerFeedback: '', nextAction: '', nextFollowUpDate: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.meetingDate)          { setError('Meeting Date is required'); return }
    if (!form.communicationChannel) { setError('Communication Channel is required'); return }
    if (newHistory.nextFollowUpDate && newHistory.nextFollowUpDate < form.meetingDate) {
      setError('Next Follow-up Date must be on or after Meeting Date'); return
    }
    setSaving(true)
    try {
      await onSaveHeader(form)
      if (newHistory.discussion.trim()) {
        await onAddHistory({ ...newHistory, nextFollowUpDate: newHistory.nextFollowUpDate || undefined })
      }
      setNewHistory({ discussion: '', customerFeedback: '', nextAction: '', nextFollowUpDate: '' })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Save failed'))
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {editable ? 'Edit' : 'View'} Deal Negotiation — {initial.negotiationNo}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && <div className="alert-error">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Quotation</label>
              <input disabled value={initial.quotationNo ?? '—'} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div><label className="form-label">Opportunity</label>
              <input disabled value={initial.opportunityName ?? '—'} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div><label className="form-label">Customer</label>
              <input disabled value={initial.customer} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div><label className="form-label">Sales Rep</label>
              <input disabled value={initial.salesRepName ?? '—'} className="input-field opacity-60 cursor-not-allowed" /></div>
            <div>
              <label className="form-label">Meeting Date *</label>
              <input type="date" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.meetingDate} onChange={e => setForm(prev => ({ ...prev, meetingDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Communication Channel *</label>
              <select disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.communicationChannel} onChange={e => setForm(prev => ({ ...prev, communicationChannel: e.target.value }))}>
                {COMMUNICATION_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                {!COMMUNICATION_CHANNELS.includes(form.communicationChannel as typeof COMMUNICATION_CHANNELS[number]) &&
                  <option value={form.communicationChannel}>{form.communicationChannel}</option>}
              </select>
            </div>
            <div>
              <label className="form-label">Contact Person</label>
              <input type="text" disabled={!editable} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.contactPerson} onChange={e => setForm(prev => ({ ...prev, contactPerson: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <input disabled value={initial.status} className="input-field opacity-60 cursor-not-allowed" />
            </div>
            <div className="col-span-2">
              <label className="form-label">Internal Note</label>
              <textarea disabled={!editable} rows={2} className="input-field disabled:opacity-60 disabled:cursor-not-allowed"
                value={form.internalNote} onChange={e => setForm(prev => ({ ...prev, internalNote: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="form-label mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Negotiation Timeline</label>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {initial.history.length === 0 ? (
                <p className="text-sm text-slate-500">No negotiation history yet.</p>
              ) : initial.history.map(h => (
                <div key={h.id} className="bg-white/5 rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>{new Date(h.discussionDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{h.updatedByName ?? '—'}</span>
                  </div>
                  <p className="text-slate-200">{h.discussion}</p>
                  {h.customerFeedback && <p className="text-slate-400 mt-1">Feedback: {h.customerFeedback}</p>}
                  {h.nextAction && <p className="text-slate-400 mt-1">Next: {h.nextAction}{h.nextFollowUpDate ? ` (by ${h.nextFollowUpDate})` : ''}</p>}
                </div>
              ))}
            </div>
          </div>

          {editable && (
            <div className="border-t border-slate-700 pt-4 space-y-3">
              <label className="form-label mb-0">Add Negotiation History</label>
              <div>
                <label className="form-label">Discussion</label>
                <textarea className="input-field" rows={2} placeholder="Leave blank to skip adding a new history entry" value={newHistory.discussion}
                  onChange={e => setNewHistory(prev => ({ ...prev, discussion: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Customer Feedback</label>
                <textarea className="input-field" rows={2} value={newHistory.customerFeedback}
                  onChange={e => setNewHistory(prev => ({ ...prev, customerFeedback: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Next Action</label>
                  <input type="text" className="input-field" value={newHistory.nextAction}
                    onChange={e => setNewHistory(prev => ({ ...prev, nextAction: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Next Follow-up Date</label>
                  <input type="date" className="input-field" value={newHistory.nextFollowUpDate}
                    onChange={e => setNewHistory(prev => ({ ...prev, nextFollowUpDate: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{editable ? 'Cancel' : 'Close'}</button>
            {editable && (
              <>
                <button type="submit" disabled={saving} className="btn-secondary flex-1">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
                </button>
                <button type="button" onClick={onComplete} disabled={saving} className="btn-primary flex-1">
                  <Trophy className="w-4 h-4" /> Complete Negotiation
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Deal Won/Lost Modal (SAL-005, "Complete Negotiation") ──────
function DealResultModal({
  negotiation, onSave, onClose,
}: {
  negotiation: DealNegotiation
  onSave: (data: CreateDealResultRequest) => Promise<void>
  onClose: () => void
}) {
  const [result,  setResult]  = useState<DealResultType | ''>('')
  const [comment, setComment] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result) { setError('Select Won or Lost before saving'); return }
    setError('')
    setConfirming(true)
  }

  const confirmSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await onSave({ result, comment: comment || undefined })
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to record Deal Result'))
      setConfirming(false)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Deal Won / Lost — {negotiation.negotiationNo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {confirming ? (
          <div className="p-6 space-y-5">
            <p className="text-slate-200">
              Confirm marking deal <span className="font-semibold">{negotiation.negotiationNo}</span> as{' '}
              <span className={result === 'WON' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{result}</span>?
            </p>
            <p className="text-sm text-slate-400">
              {result === 'WON'
                ? 'This will set the Opportunity to Closed Won and the Quotation to Accepted.'
                : 'This will set the Opportunity to Closed Lost and the Quotation to Rejected.'} This cannot be changed afterwards.
            </p>
            {error && <div className="alert-error">{error}</div>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirming(false)} disabled={saving} className="btn-secondary flex-1">No, go back</button>
              <button type="button" onClick={confirmSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Yes, confirm</>}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-5">
            {error && <div className="alert-error">{error}</div>}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-500">Quotation</span><p className="text-slate-200">{negotiation.quotationNo}</p></div>
              <div><span className="text-slate-500">Opportunity</span><p className="text-slate-200">{negotiation.opportunityName}</p></div>
              <div><span className="text-slate-500">Customer</span><p className="text-slate-200">{negotiation.customer}</p></div>
              <div><span className="text-slate-500">Sales Rep</span><p className="text-slate-200">{negotiation.salesRepName}</p></div>
              <div className="col-span-2"><span className="text-slate-500">Deal Amount</span>
                <p className="text-white font-semibold tabular-nums">{(negotiation.dealAmount ?? 0).toLocaleString('en-US')}</p></div>
            </div>

            <div>
              <label className="form-label">Deal Result *</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setResult('WON')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${result === 'WON' ? 'bg-green-500/20 text-green-300 border-green-500/40' : 'bg-white/5 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                  <ThumbsUp className="w-4 h-4" /> Won
                </button>
                <button type="button" onClick={() => setResult('LOST')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                    ${result === 'LOST' ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-white/5 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                  <ThumbsDown className="w-4 h-4" /> Lost
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">Comment</label>
              <textarea className="input-field" rows={3} maxLength={1000} placeholder="Optional notes about the final decision..."
                value={comment} onChange={e => setComment(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1"><Check className="w-4 h-4" /> Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Deal Result View Modal (read-only, SAL-005 View Screen) ────
function DealResultViewModal({ result, onClose }: { result: DealResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">View Deal Result — {result.negotiationNo}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Quotation</span><p className="text-slate-200">{result.quotationNo}</p></div>
            <div><span className="text-slate-500">Opportunity</span><p className="text-slate-200">{result.opportunityName}</p></div>
            <div><span className="text-slate-500">Customer</span><p className="text-slate-200">{result.customer}</p></div>
            <div><span className="text-slate-500">Sales Rep</span><p className="text-slate-200">{result.salesRepName}</p></div>
            <div><span className="text-slate-500">Deal Amount</span><p className="text-white font-semibold tabular-nums">{result.dealAmount.toLocaleString('en-US')}</p></div>
            <div><span className="text-slate-500">Deal Result</span>
              <p><span className={`text-xs font-medium px-2 py-1 rounded-lg border ${dealResultColor[result.result]}`}>{result.result}</span></p></div>
          </div>
          {result.comment && (
            <div>
              <span className="text-slate-500 text-sm">Comment</span>
              <p className="text-slate-200 text-sm mt-1">{result.comment}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm border-t border-slate-700 pt-4">
            <div><span className="text-slate-500">Decision By</span><p className="text-slate-200">{result.decisionByName ?? '—'}</p></div>
            <div><span className="text-slate-500">Decision Date</span>
              <p className="text-slate-200">{new Date(result.decisionDate).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared toolbar Search box — placeholder auto-scrolls (marquee) until focused ───
function SearchInput({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  const showMarquee = !focused && !value

  return (
    <div className="relative w-96 shrink-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
      <input
        type="text"
        aria-label={placeholder}
        className="input-field pl-9 py-2.5"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {showMarquee && (
        <div className="absolute inset-0 pl-9 pr-3 flex items-center overflow-hidden pointer-events-none rounded-xl bg-white/5">
          <div className="flex whitespace-nowrap animate-marquee text-slate-400 text-sm">
            <span className="pr-16">{placeholder}</span>
            <span className="pr-16">{placeholder}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Sales Dashboard ──────────────────────────────────────
export default function SalesDashboard() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const fileInputRef     = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'leads' | 'opportunities' | 'quotations' | 'negotiations' | 'dealResults'>('leads')

  // Lead state
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [leadSalesRepFilter, setLeadSalesRepFilter] = useState('ALL')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editLead,    setEditLead]    = useState<Lead | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [leadPage,     setLeadPage]     = useState(0)
  const [leadPageSize, setLeadPageSize] = useState(10)
  const [leadTotal,    setLeadTotal]    = useState(0)
  const [salesReps,    setSalesReps]    = useState<SalesRep[]>([])

  // Opportunity state
  const [opps,      setOpps]      = useState<Opportunity[]>([])
  const [oppsLoading, setOppsLoading] = useState(false)
  const [oppSearch, setOppSearch] = useState('')
  const [oppModalOpen, setOppModalOpen] = useState(false)
  const [editOpp,   setEditOpp]   = useState<Opportunity | null>(null)
  const [oppPage,     setOppPage]     = useState(0)
  const [oppPageSize, setOppPageSize] = useState(10)
  const [oppTotal,    setOppTotal]    = useState(0)
  const [convertLeadTarget, setConvertLeadTarget] = useState<Lead | null>(null)
  const [createQuoteForOpp, setCreateQuoteForOpp] = useState<Opportunity | null>(null)

  // Quotation state
  const [quotes,       setQuotes]       = useState<Quotation[]>([])
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [quoteSearch,  setQuoteSearch]  = useState('')
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('ALL')
  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [editQuote,    setEditQuote]    = useState<Quotation | null>(null)
  const [quotePage,     setQuotePage]     = useState(0)
  const [quotePageSize, setQuotePageSize] = useState(10)
  const [quoteTotal,    setQuoteTotal]    = useState(0)
  const [negotiateForQuote, setNegotiateForQuote] = useState<Quotation | null>(null)

  // Deal Negotiation state (SAL-004)
  const [negotiations,       setNegotiations]       = useState<DealNegotiation[]>([])
  const [negotiationsLoading, setNegotiationsLoading] = useState(false)
  const [negSearch,  setNegSearch]  = useState('')
  const [negMeetingFrom, setNegMeetingFrom] = useState('')
  const [negMeetingTo,   setNegMeetingTo]   = useState('')
  const [negPage,     setNegPage]     = useState(0)
  const [negPageSize, setNegPageSize] = useState(10)
  const [negTotal,    setNegTotal]    = useState(0)
  const [viewNegotiation, setViewNegotiation] = useState<DealNegotiation | null>(null)
  const [completeNegotiationTarget, setCompleteNegotiationTarget] = useState<DealNegotiation | null>(null)

  // Deal Won/Lost state (SAL-005)
  const [dealResults,       setDealResults]       = useState<DealResult[]>([])
  const [dealResultsLoading, setDealResultsLoading] = useState(false)
  const [resultSearch, setResultSearch] = useState('')
  const [resultFilter, setResultFilter] = useState('ALL')
  const [resultPage,     setResultPage]     = useState(0)
  const [resultPageSize, setResultPageSize] = useState(10)
  const [resultTotal,    setResultTotal]    = useState(0)
  const [viewDealResult, setViewDealResult] = useState<DealResult | null>(null)

  // Confirmation dialog (shared) — Delete Lead / Delete Opportunity / Delete Quotation (all danger tone)
  const [confirmState, setConfirmState] = useState<
    | { type: 'deleteLead'; lead: Lead }
    | { type: 'deleteOpportunity'; opp: Opportunity }
    | { type: 'deleteQuotation'; quote: Quotation }
    | null
  >(null)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ─── Load Leads ──────────────────────────────────────────────
  const loadLeads = async () => {
    setLeadsLoading(true)
    try {
      const res = await getLeads(
        search || undefined,
        statusFilter === 'ALL' ? undefined : statusFilter,
        leadSalesRepFilter === 'ALL' ? undefined : Number(leadSalesRepFilter),
        leadPage, leadPageSize
      )
      setLeads(res.data.data?.content ?? [])
      setLeadTotal(res.data.data?.totalElements ?? 0)
    } catch { showToast('Failed to load leads', 'error') }
    finally  { setLeadsLoading(false) }
  }

  const loadOpps = async () => {
    setOppsLoading(true)
    try {
      const res = await getMyOpportunities(oppSearch || undefined, oppPage, oppPageSize)
      setOpps(res.data.data?.content ?? [])
      setOppTotal(res.data.data?.totalElements ?? 0)
    } catch { showToast('Failed to load opportunities', 'error') }
    finally  { setOppsLoading(false) }
  }

  const loadQuotes = async () => {
    setQuotesLoading(true)
    try {
      const res = await getMyQuotations(quoteSearch || undefined, quoteStatusFilter === 'ALL' ? undefined : quoteStatusFilter, quotePage, quotePageSize)
      setQuotes(res.data.data?.content ?? [])
      setQuoteTotal(res.data.data?.totalElements ?? 0)
    } catch { showToast('Failed to load quotations', 'error') }
    finally  { setQuotesLoading(false) }
  }

  const loadNegotiations = async () => {
    setNegotiationsLoading(true)
    try {
      const res = await getMyDealNegotiations(negSearch || undefined, negMeetingFrom || undefined, negMeetingTo || undefined, negPage, negPageSize)
      setNegotiations(res.data.data?.content ?? [])
      setNegTotal(res.data.data?.totalElements ?? 0)
    } catch { showToast('Failed to load deal negotiations', 'error') }
    finally  { setNegotiationsLoading(false) }
  }

  const loadDealResults = async () => {
    setDealResultsLoading(true)
    try {
      const res = await getMyDealResults(resultSearch || undefined, resultFilter === 'ALL' ? undefined : resultFilter, resultPage, resultPageSize)
      setDealResults(res.data.data?.content ?? [])
      setResultTotal(res.data.data?.totalElements ?? 0)
    } catch { showToast('Failed to load deal results', 'error') }
    finally  { setDealResultsLoading(false) }
  }

  // Reset to page 0 whenever the search/filter changes (new result set)
  useEffect(() => { setLeadPage(0) }, [search, statusFilter, leadSalesRepFilter])
  useEffect(() => { loadLeads() }, [search, statusFilter, leadSalesRepFilter, leadPage, leadPageSize])
  useEffect(() => { setOppPage(0) }, [oppSearch])
  useEffect(() => { if (activeTab === 'opportunities') loadOpps() }, [activeTab, oppSearch, oppPage, oppPageSize])
  useEffect(() => { setQuotePage(0) }, [quoteSearch, quoteStatusFilter])
  useEffect(() => { if (activeTab === 'quotations') loadQuotes() }, [activeTab, quoteSearch, quoteStatusFilter, quotePage, quotePageSize])
  useEffect(() => { setNegPage(0) }, [negSearch, negMeetingFrom, negMeetingTo])
  useEffect(() => { if (activeTab === 'negotiations') loadNegotiations() }, [activeTab, negSearch, negMeetingFrom, negMeetingTo, negPage, negPageSize])
  useEffect(() => { setResultPage(0) }, [resultSearch, resultFilter])
  useEffect(() => { if (activeTab === 'dealResults') loadDealResults() }, [activeTab, resultSearch, resultFilter, resultPage, resultPageSize])
  useEffect(() => {
    getSalesReps().then(res => setSalesReps(res.data.data ?? [])).catch(() => { /* dropdown just stays empty */ })
  }, [])

  // ─── CRUD handlers ───────────────────────────────────────────
  const handleSaveLead = async (data: CreateLeadRequest) => {
    if (editLead) {
      await updateLead(editLead.id, data)
      showToast('Lead updated successfully')
    } else {
      await createLead(data)
      showToast('Lead created successfully')
    }
    setModalOpen(false)
    setEditLead(null)
    loadLeads()
  }

  // Open confirmation — actual deletion happens in executeConfirmedAction below
  const handleDelete = (lead: Lead) => setConfirmState({ type: 'deleteLead', lead })
  const handleDeleteOpportunity = (opp: Opportunity) => setConfirmState({ type: 'deleteOpportunity', opp })
  const handleDeleteQuotation = (quote: Quotation) => setConfirmState({ type: 'deleteQuotation', quote })
  const handleConvert = (lead: Lead) => setConvertLeadTarget(lead)

  const [confirmActionLoading, setConfirmActionLoading] = useState(false)

  const executeConfirmedAction = async () => {
    if (!confirmState) return
    setConfirmActionLoading(true)
    try {
      if (confirmState.type === 'deleteLead') {
        await deleteLead(confirmState.lead.id)
        showToast('Lead deleted')
        loadLeads()
      } else if (confirmState.type === 'deleteOpportunity') {
        await deleteOpportunity(confirmState.opp.id)
        showToast('Opportunity deleted')
        loadOpps()
      } else {
        await deleteQuotation(confirmState.quote.id)
        showToast('Quotation deleted')
        loadQuotes()
      }
      setConfirmState(null)
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Delete failed'), 'error')
    } finally {
      setConfirmActionLoading(false)
    }
  }

  const handleConvertSubmit = async (data: ConvertLeadRequest) => {
    if (!convertLeadTarget) return
    await convertLead(convertLeadTarget.id, data)
    showToast(`"${convertLeadTarget.leadName}" converted to Opportunity! Check the Opportunities tab.`)
    setConvertLeadTarget(null)
    loadLeads()
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const res = await importLeadsExcel(file)
      showToast(`Imported ${res.data.data?.length ?? 0} leads successfully`)
      loadLeads()
    } catch { showToast('Import failed. Check the file format.', 'error') }
    finally {
      setImportLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadLeadTemplate()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a   = document.createElement('a')
      a.href     = url
      a.download = 'lead_import_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { showToast('Download failed', 'error') }
  }

  const handleSaveOpportunity = async (data: CreateOpportunityRequest) => {
    if (editOpp) {
      await updateOpportunity(editOpp.id, data)
      showToast('Opportunity updated successfully')
    } else {
      await createOpportunity(data)
      showToast('Opportunity created successfully')
    }
    setOppModalOpen(false)
    setEditOpp(null)
    loadOpps()
  }

  const handleCreateQuotationSubmit = async (data: CreateQuotationFromOpportunityRequest) => {
    if (!createQuoteForOpp) return
    await createQuotationFromOpportunity(createQuoteForOpp.id, data)
    showToast('Quotation created — check the Quotations tab')
    setCreateQuoteForOpp(null)
    loadOpps()
  }

  const handleSaveQuotation = async (data: UpdateQuotationRequest) => {
    if (!editQuote) return
    await updateQuotation(editQuote.id, data)
    showToast('Quotation updated successfully')
    setQuoteModalOpen(false)
    setEditQuote(null)
    loadQuotes()
  }

  const handleCreateDealNegotiation = async (data: CreateDealNegotiationRequest) => {
    if (!negotiateForQuote) return
    await createDealNegotiation(negotiateForQuote.id, data)
    showToast(`Deal Negotiation created for ${negotiateForQuote.quotationNo} — check the Negotiations tab.`)
    setNegotiateForQuote(null)
    loadQuotes()
  }

  const refreshViewedNegotiation = async (id: number) => {
    const res = await getDealNegotiation(id)
    setViewNegotiation(res.data.data ?? null)
  }

  const handleSaveNegotiationHeader = async (data: UpdateDealNegotiationRequest) => {
    if (!viewNegotiation) return
    await updateDealNegotiation(viewNegotiation.id, data)
    await refreshViewedNegotiation(viewNegotiation.id)
    showToast('Deal Negotiation updated')
    loadNegotiations()
  }

  const handleAddNegotiationHistory = async (data: AddNegotiationHistoryRequest) => {
    if (!viewNegotiation) return
    await addNegotiationHistory(viewNegotiation.id, data)
    await refreshViewedNegotiation(viewNegotiation.id)
  }

  const handleCompleteNegotiation = () => {
    if (!viewNegotiation) return
    setCompleteNegotiationTarget(viewNegotiation)
  }

  const handleSaveDealResult = async (data: CreateDealResultRequest) => {
    if (!completeNegotiationTarget) return
    await createDealResult(completeNegotiationTarget.id, data)
    showToast(`Deal ${completeNegotiationTarget.negotiationNo} marked as ${data.result}`)
    setCompleteNegotiationTarget(null)
    setViewNegotiation(null)
    loadNegotiations()
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-up
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">FILLINUS ERP</span>
            <span className="text-slate-500 text-sm hidden sm:block">/ Sales</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg">
              <User className="w-4 h-4 text-brand-400" />
              <span className="text-sm text-slate-300 font-medium">{user?.fullName}</span>
              <span className="text-xs text-brand-400 bg-brand-500/20 px-1.5 py-0.5 rounded">SALE</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-800">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'leads'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Users className="w-4 h-4" />
            Leads
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === 'leads' ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
              {leadTotal}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'opportunities'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Briefcase className="w-4 h-4" />
            Opportunities
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === 'opportunities' ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
              {oppTotal}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'quotations'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4" />
            Quotations
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === 'quotations' ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
              {quoteTotal}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('negotiations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'negotiations'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Handshake className="w-4 h-4" />
            Negotiations
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === 'negotiations' ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
              {negTotal}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('dealResults')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === 'dealResults'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Trophy className="w-4 h-4" />
            Deal Won/Lost
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === 'dealResults' ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
              {resultTotal}
            </span>
          </button>
        </div>
      </div>

      {/* ── LEAD TAB ─────────────────────────────────────────────── */}
      {activeTab === 'leads' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          {/* Toolbar */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                <SearchInput value={search} onChange={setSearch} placeholder="Search lead name, company, ID" />
                <button
                  onClick={() => { setEditLead(null); setModalOpen(true) }}
                  className="btn-primary gap-1.5 text-sm w-56 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Create Lead
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={handleDownloadTemplate} className="btn-secondary gap-1.5 text-sm w-auto">
                  <Download className="w-4 h-4" /> Template
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importLoading}
                  className="btn-secondary gap-1.5 text-sm w-auto"
                >
                  {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import Excel
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field py-2.5 pr-8 w-56 shrink-0"
              >
                <option value="ALL">All Status</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
              </select>
              <select
                value={leadSalesRepFilter}
                onChange={e => setLeadSalesRepFilter(e.target.value)}
                className="input-field py-2.5 pr-8 w-56 shrink-0"
              >
                <option value="ALL">All Sales Reps</option>
                {salesReps.map(r => <option key={r.id} value={r.id}>{r.fullName}</option>)}
              </select>
              <button onClick={loadLeads} className="btn-icon" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${leadsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Lead ID', 'Lead Name', 'Company', 'Contact', 'Phone', 'Sales Rep', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${h === 'Actions' ? 'sticky right-0 z-10 bg-slate-800/50' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leadsLoading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading leads...
                    </td></tr>
                  ) : leads.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No leads found. Create one or import from Excel.
                    </td></tr>
                  ) : leads.map(lead => (
                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{lead.leadId}</td>
                      <td className="px-4 py-3.5 font-medium text-white">{lead.leadName}</td>
                      <td className="px-4 py-3.5 text-slate-300">{lead.companyName || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300">{lead.contactPerson || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300">{lead.phone || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300">{lead.salesRepName || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${leadStatusColor[lead.status] ?? ''}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditLead(lead); setModalOpen(true) }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(lead)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleConvert(lead)}
                            disabled={lead.status === 'REJECTED'}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Convert to Opportunity"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                            Convert
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={leadPage} pageSize={leadPageSize} totalElements={leadTotal}
              onPageChange={setLeadPage}
              onPageSizeChange={size => { setLeadPageSize(size); setLeadPage(0) }}
            />
          </div>
        </div>
      )}

      {/* ── OPPORTUNITY TAB ──────────────────────────────────────── */}
      {activeTab === 'opportunities' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3 items-center">
              <SearchInput value={oppSearch} onChange={setOppSearch} placeholder="Search Opp No, name, customer" />
              <button
                onClick={() => { setEditOpp(null); setOppModalOpen(true) }}
                className="btn-primary gap-1.5 text-sm w-56 shrink-0"
              >
                <Plus className="w-4 h-4" /> Create Opportunity
              </button>
            </div>
            <button onClick={loadOpps} className="btn-icon self-start" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${oppsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Opp ID', 'Name', 'Customer', 'Sales Rep', 'Stage', 'Expected Revenue', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${h === 'Actions' ? 'sticky right-0 z-10 bg-slate-800/50' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {oppsLoading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading opportunities...
                    </td></tr>
                  ) : opps.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No opportunities yet. Create one or convert a Lead to get started!
                    </td></tr>
                  ) : opps.map(opp => (
                    <tr key={opp.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{opp.opportunityId}</td>
                      <td className="px-4 py-3.5 font-medium text-white">{opp.opportunityName}</td>
                      <td className="px-4 py-3.5 text-slate-300">{opp.customer}</td>
                      <td className="px-4 py-3.5 text-slate-300">{opp.salesRepName || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${stageColor[opp.stage] ?? ''}`}>
                          {opp.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 tabular-nums">
                        {opp.expectedRevenue.toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${lifecycleStatusColor[opp.lifecycleStatus] ?? ''}`}>
                          {opp.lifecycleStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditOpp(opp); setOppModalOpen(true) }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                            title={opp.hasQuotation ? 'Already converted to Quotation — View' : 'Edit'}>
                            {opp.hasQuotation ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDeleteOpportunity(opp)}
                            disabled={opp.hasQuotation}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={opp.hasQuotation ? 'Already converted to Quotation — locked' : 'Delete'}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setCreateQuoteForOpp(opp)}
                            disabled={opp.hasQuotation}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title={opp.hasQuotation ? 'Already has a Quotation' : 'Create Quotation'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Quote
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={oppPage} pageSize={oppPageSize} totalElements={oppTotal}
              onPageChange={setOppPage}
              onPageSizeChange={size => { setOppPageSize(size); setOppPage(0) }}
            />
          </div>
        </div>
      )}

      {/* ── QUOTATION TAB ────────────────────────────────────────── */}
      {activeTab === 'quotations' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <SearchInput value={quoteSearch} onChange={setQuoteSearch} placeholder="Search Quotation No, customer" />
              <p className="text-xs text-slate-500 max-w-xs text-right">
                Quotations can only be created from an Opportunity (see the "Quote" action in the Opportunities tab).
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={quoteStatusFilter}
                onChange={e => setQuoteStatusFilter(e.target.value)}
                className="input-field py-2.5 pr-8 w-56 shrink-0"
              >
                <option value="ALL">All Status</option>
                {QUOTATION_STATUSES.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
              </select>
              <button onClick={loadQuotes} className="btn-icon" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${quotesLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Quotation No', 'Opportunity', 'Customer', 'Quotation Date', 'Expired Date', 'Total Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${h === 'Actions' ? 'sticky right-0 z-10 bg-slate-800/50' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {quotesLoading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading quotations...
                    </td></tr>
                  ) : quotes.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No quotations yet. Create one from an Opportunity.
                    </td></tr>
                  ) : quotes.map(quote => (
                    <tr key={quote.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{quote.quotationNo}</td>
                      <td className="px-4 py-3.5 text-slate-300">{quote.opportunityName || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300">{quote.customer}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {new Date(quote.quotationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {new Date(quote.expiredDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-slate-300 tabular-nums">
                        {quote.totalAmount.toLocaleString('en-US')} {quote.currency}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${quotationStatusColor[quote.status] ?? ''}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditQuote(quote); setQuoteModalOpen(true) }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                            title={quote.status === 'DRAFT' ? 'Edit' : 'View'}>
                            {quote.status === 'DRAFT' ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDeleteQuotation(quote)}
                            disabled={quote.status !== 'DRAFT'}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={quote.status !== 'DRAFT' ? 'Only a Draft quotation can be deleted' : 'Delete'}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setNegotiateForQuote(quote)}
                            disabled={quote.status !== 'DRAFT'}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Create Deal Negotiation"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Negotiate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={quotePage} pageSize={quotePageSize} totalElements={quoteTotal}
              onPageChange={setQuotePage}
              onPageSizeChange={size => { setQuotePageSize(size); setQuotePage(0) }}
            />
          </div>
        </div>
      )}

      {/* ── DEAL NEGOTIATION TAB (SAL-004) ──────────────────────── */}
      {activeTab === 'negotiations' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <SearchInput value={negSearch} onChange={setNegSearch} placeholder="Search Negotiation No, Quotation No, customer" />
              <p className="text-xs text-slate-500 max-w-xs text-right">
                Deal Negotiations can only be created from a Draft Quotation (see the "Negotiate" action in the Quotations tab).
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Meeting</span>
                <input type="date" className="input-field py-2 text-sm w-56 shrink-0" value={negMeetingFrom}
                  onChange={e => setNegMeetingFrom(e.target.value)} />
                <span>to</span>
                <input type="date" className="input-field py-2 text-sm w-56 shrink-0" value={negMeetingTo}
                  onChange={e => setNegMeetingTo(e.target.value)} />
              </div>
              <button onClick={loadNegotiations} className="btn-icon" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${negotiationsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Negotiation No', 'Quotation No', 'Customer', 'Sales Rep', 'Meeting Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${h === 'Actions' ? 'sticky right-0 z-10 bg-slate-800/50' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {negotiationsLoading ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading deal negotiations...
                    </td></tr>
                  ) : negotiations.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <Handshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No deal negotiations yet. Start one from a Draft Quotation.
                    </td></tr>
                  ) : negotiations.map(neg => (
                    <tr key={neg.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{neg.negotiationNo}</td>
                      <td className="px-4 py-3.5 text-slate-300">{neg.quotationNo}</td>
                      <td className="px-4 py-3.5 text-slate-300">{neg.customer}</td>
                      <td className="px-4 py-3.5 text-slate-300">{neg.salesRepName || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {new Date(neg.meetingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${negotiationStatusColor[neg.status] ?? ''}`}>
                          {neg.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setViewNegotiation(neg)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                            title={neg.status === 'NEGOTIATING' ? 'Edit' : 'View'}>
                            {neg.status === 'NEGOTIATING' ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setCompleteNegotiationTarget(neg)}
                            disabled={neg.status !== 'NEGOTIATING'}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Complete Negotiation"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            Complete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={negPage} pageSize={negPageSize} totalElements={negTotal}
              onPageChange={setNegPage}
              onPageSizeChange={size => { setNegPageSize(size); setNegPage(0) }}
            />
          </div>
        </div>
      )}

      {/* ── DEAL WON/LOST TAB (SAL-005) ─────────────────────────── */}
      {activeTab === 'dealResults' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <SearchInput value={resultSearch} onChange={setResultSearch} placeholder="Search Negotiation No, Opportunity, customer" />
              <p className="text-xs text-slate-500 max-w-xs text-right">
                Deal Results are recorded via "Complete Negotiation" in the Negotiations tab and cannot be changed afterwards.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={resultFilter}
                onChange={e => setResultFilter(e.target.value)}
                className="input-field py-2.5 pr-8 w-56 shrink-0"
              >
                <option value="ALL">All Status</option>
                {DEAL_RESULTS.map(r => <option key={r} value={r}>{formatStatusLabel(r)}</option>)}
              </select>
              <button onClick={loadDealResults} className="btn-icon" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${dealResultsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Negotiation No', 'Opportunity', 'Customer', 'Sales Rep', 'Deal Amount', 'Result', 'Decision Date', 'Actions'].map(h => (
                      <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap
                        ${h === 'Actions' ? 'sticky right-0 z-10 bg-slate-800/50' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {dealResultsLoading ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading deal results...
                    </td></tr>
                  ) : dealResults.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      No completed deals yet. Complete a Negotiation to record a Won/Lost result.
                    </td></tr>
                  ) : dealResults.map(dr => (
                    <tr key={dr.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{dr.negotiationNo}</td>
                      <td className="px-4 py-3.5 text-slate-300">{dr.opportunityName}</td>
                      <td className="px-4 py-3.5 text-slate-300">{dr.customer}</td>
                      <td className="px-4 py-3.5 text-slate-300">{dr.salesRepName || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300 tabular-nums">{dr.dealAmount.toLocaleString('en-US')}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${dealResultColor[dr.result] ?? ''}`}>
                          {dr.result}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {new Date(dr.decisionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 sticky right-0 z-10 bg-slate-900 group-hover:bg-slate-800/40 transition-colors">
                        <button onClick={() => setViewDealResult(dr)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={resultPage} pageSize={resultPageSize} totalElements={resultTotal}
              onPageChange={setResultPage}
              onPageSizeChange={size => { setResultPageSize(size); setResultPage(0) }}
            />
          </div>
        </div>
      )}

      {/* Lead Create/Edit Modal */}
      {modalOpen && (
        <LeadModal
          initial={editLead}
          salesReps={salesReps}
          onSave={handleSaveLead}
          onClose={() => { setModalOpen(false); setEditLead(null) }}
        />
      )}

      {/* Opportunity Create/Edit Modal */}
      {oppModalOpen && (
        <OpportunityModal
          initial={editOpp}
          salesReps={salesReps}
          onSave={handleSaveOpportunity}
          onClose={() => { setOppModalOpen(false); setEditOpp(null) }}
        />
      )}

      {/* Convert Lead -> Opportunity Modal */}
      {convertLeadTarget && (
        <ConvertLeadModal
          lead={convertLeadTarget}
          salesReps={salesReps}
          onConvert={handleConvertSubmit}
          onClose={() => setConvertLeadTarget(null)}
        />
      )}

      {/* Create Quotation Modal (from an Opportunity row) */}
      {createQuoteForOpp && (
        <CreateQuotationModal
          opportunity={createQuoteForOpp}
          onCreate={handleCreateQuotationSubmit}
          onClose={() => setCreateQuoteForOpp(null)}
        />
      )}

      {/* Quotation View/Edit Modal */}
      {quoteModalOpen && editQuote && (
        <QuotationModal
          initial={editQuote}
          onSave={handleSaveQuotation}
          onClose={() => { setQuoteModalOpen(false); setEditQuote(null) }}
        />
      )}

      {/* Create Deal Negotiation Modal (from a Quotation row) */}
      {negotiateForQuote && (
        <CreateDealNegotiationModal
          quote={negotiateForQuote}
          onCreate={handleCreateDealNegotiation}
          onClose={() => setNegotiateForQuote(null)}
        />
      )}

      {/* Deal Negotiation View/Edit Modal */}
      {viewNegotiation && (
        <DealNegotiationModal
          initial={viewNegotiation}
          onSaveHeader={handleSaveNegotiationHeader}
          onAddHistory={handleAddNegotiationHistory}
          onComplete={handleCompleteNegotiation}
          onClose={() => { setViewNegotiation(null); loadNegotiations() }}
        />
      )}

      {/* Deal Won/Lost Modal ("Complete Negotiation") */}
      {completeNegotiationTarget && (
        <DealResultModal
          negotiation={completeNegotiationTarget}
          onSave={handleSaveDealResult}
          onClose={() => setCompleteNegotiationTarget(null)}
        />
      )}

      {/* Deal Result View Modal (read-only) */}
      {viewDealResult && (
        <DealResultViewModal
          result={viewDealResult}
          onClose={() => setViewDealResult(null)}
        />
      )}

      {/* Shared confirmation dialog — Delete Lead / Delete Opportunity / Delete Quotation (all danger) */}
      <ConfirmDialog
        open={!!confirmState}
        tone="danger"
        title={
          confirmState?.type === 'deleteLead' ? 'Delete Lead'
          : confirmState?.type === 'deleteOpportunity' ? 'Delete Opportunity'
          : 'Delete Quotation'
        }
        message={
          confirmState?.type === 'deleteLead'
            ? `Delete lead "${confirmState.lead.leadName}"? This action cannot be undone.`
            : confirmState?.type === 'deleteOpportunity'
              ? `Delete opportunity "${confirmState.opp.opportunityName}"? This action cannot be undone.`
              : confirmState?.type === 'deleteQuotation'
                ? `Delete quotation "${confirmState.quote.quotationNo}"? This action cannot be undone.`
                : ''
        }
        confirmLabel="Delete"
        loading={confirmActionLoading}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}
