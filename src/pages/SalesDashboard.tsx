import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Plus, Upload, Download, RefreshCw,
  Trash2, Edit2, ArrowRightCircle, ChevronDown,
  LogOut, User, Briefcase, Users, TrendingUp, X, Check, Loader2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  getLeads, createLead, updateLead, deleteLead, convertLead,
  importLeadsExcel, downloadLeadTemplate,
  getMyOpportunities, updateOpportunityStatus, updateOpportunity,
} from '@/api/sales'
import type { Lead, Opportunity, CreateLeadRequest, UpdateOpportunityDetailsRequest } from '@/api/sales'

// ─── Status badge colours ──────────────────────────────────────
const leadStatusColor: Record<string, string> = {
  NEW:         'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  CONVERTED:   'bg-green-500/20 text-green-300 border-green-500/30',
  CLOSED:      'bg-slate-500/20 text-slate-400 border-slate-500/30',
}
const oppStatusColor: Record<string, string> = {
  NEW:         'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_PROGRESS: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  WON:         'bg-green-500/20 text-green-300 border-green-500/30',
  LOST:        'bg-red-500/20 text-red-300 border-red-500/30',
}

// ─── Lead Form Modal ───────────────────────────────────────────
function LeadModal({
  initial, onSave, onClose,
}: {
  initial?: Lead | null
  onSave: (data: CreateLeadRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<CreateLeadRequest>({
    leadName:      initial?.leadName      ?? '',
    companyName:   initial?.companyName   ?? '',
    contactPerson: initial?.contactPerson ?? '',
    phone:         initial?.phone         ?? '',
    email:         initial?.email         ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.leadName.trim()) { setError('Lead Name is required'); return }
    setSaving(true)
    try { await onSave(form) } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{initial ? 'Edit Lead' : 'Create New Lead'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          {[
            { label: 'Lead Name *', key: 'leadName',      type: 'text',  placeholder: 'Company contact name' },
            { label: 'Company',     key: 'companyName',   type: 'text',  placeholder: 'Company name' },
            { label: 'Contact',     key: 'contactPerson', type: 'text',  placeholder: 'Contact person' },
            { label: 'Phone',       key: 'phone',         type: 'tel',   placeholder: '+84 xxx xxx xxx' },
            { label: 'Email',       key: 'email',         type: 'email', placeholder: 'contact@company.com' },
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

// ─── Opportunity Edit Modal ─────────────────────────────────────
function OpportunityModal({
  initial, onSave, onClose,
}: {
  initial: Opportunity
  onSave: (data: UpdateOpportunityDetailsRequest) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<UpdateOpportunityDetailsRequest>({
    companyName:   initial.companyName   ?? '',
    contactPerson: initial.contactPerson ?? '',
    phone:         initial.phone         ?? '',
    email:         initial.email         ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try { await onSave(form) } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Edit Opportunity — {initial.opportunityId}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div>
            <label className="form-label">Lead Name</label>
            <input type="text" disabled value={initial.leadName} className="input-field opacity-60 cursor-not-allowed" />
          </div>
          {[
            { label: 'Company',     key: 'companyName',   type: 'text',  placeholder: 'Company name' },
            { label: 'Contact',     key: 'contactPerson', type: 'text',  placeholder: 'Contact person' },
            { label: 'Phone',       key: 'phone',         type: 'tel',   placeholder: '+84 xxx xxx xxx' },
            { label: 'Email',       key: 'email',         type: 'email', placeholder: 'contact@company.com' },
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
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Sales Dashboard ──────────────────────────────────────
export default function SalesDashboard() {
  const { user, logout } = useAuthStore()
  const navigate         = useNavigate()
  const fileInputRef     = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'leads' | 'opportunities'>('leads')

  // Lead state
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editLead,    setEditLead]    = useState<Lead | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [converting,  setConverting]  = useState<number | null>(null)

  // Opportunity state
  const [opps,      setOpps]      = useState<Opportunity[]>([])
  const [oppsLoading, setOppsLoading] = useState(false)
  const [updatingOpp, setUpdatingOpp] = useState<number | null>(null)
  const [oppModalOpen, setOppModalOpen] = useState(false)
  const [editOpp,   setEditOpp]   = useState<Opportunity | null>(null)

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ─── Load Leads ──────────────────────────────────────────────
  const loadLeads = async () => {
    setLeadsLoading(true)
    try {
      const res = await getLeads(search || undefined, statusFilter === 'ALL' ? undefined : statusFilter)
      setLeads(res.data.data ?? [])
    } catch { showToast('Failed to load leads', 'error') }
    finally  { setLeadsLoading(false) }
  }

  const loadOpps = async () => {
    setOppsLoading(true)
    try {
      const res = await getMyOpportunities()
      setOpps(res.data.data ?? [])
    } catch { showToast('Failed to load opportunities', 'error') }
    finally  { setOppsLoading(false) }
  }

  useEffect(() => { loadLeads() }, [search, statusFilter])
  useEffect(() => { if (activeTab === 'opportunities') loadOpps() }, [activeTab])

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

  const handleDelete = async (lead: Lead) => {
    if (!confirm(`Delete lead "${lead.leadName}"? This action cannot be undone.`)) return
    try {
      await deleteLead(lead.id)
      showToast('Lead deleted')
      loadLeads()
    } catch { showToast('Failed to delete lead', 'error') }
  }

  const handleConvert = async (lead: Lead) => {
    if (!confirm(`Convert "${lead.leadName}" to an Opportunity? This lead will no longer appear in the Leads list.`)) return
    setConverting(lead.id)
    try {
      await convertLead(lead.id)
      showToast(`"${lead.leadName}" converted to Opportunity! Check the Opportunities tab.`)
      loadLeads()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      showToast(msg ?? 'Conversion failed', 'error')
    } finally { setConverting(null) }
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

  const handleSaveOpportunity = async (data: UpdateOpportunityDetailsRequest) => {
    if (!editOpp) return
    const res = await updateOpportunity(editOpp.id, data)
    setOpps(prev => prev.map(o => o.id === editOpp.id ? res.data.data! : o))
    showToast('Opportunity updated successfully')
    setOppModalOpen(false)
    setEditOpp(null)
  }

  const handleOppStatus = async (opp: Opportunity, status: string) => {
    setUpdatingOpp(opp.id)
    try {
      const res = await updateOpportunityStatus(opp.id, status)
      setOpps(prev => prev.map(o => o.id === opp.id ? res.data.data! : o))
      showToast('Status updated')
    } catch { showToast('Failed to update status', 'error') }
    finally { setUpdatingOpp(null) }
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const oppStatuses = ['NEW', 'IN_PROGRESS', 'WON', 'LOST']

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
              {leads.length}
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
              {opps.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── LEAD TAB ─────────────────────────────────────────────── */}
      {activeTab === 'leads' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            {/* Search + Filter */}
            <div className="flex flex-wrap gap-3 flex-1">
              <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lead name, company, ID..."
                  className="input-field pl-9 py-2.5"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input-field py-2.5 pr-8 min-w-[140px]"
              >
                <option value="ALL">All Status</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
              <button onClick={loadLeads} className="btn-icon" title="Refresh">
                <RefreshCw className={`w-4 h-4 ${leadsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={handleDownloadTemplate} className="btn-secondary gap-1.5 text-xs">
                <Download className="w-4 h-4" /> Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
                className="btn-secondary gap-1.5 text-xs"
              >
                {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import Excel
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
              <button
                onClick={() => { setEditLead(null); setModalOpen(true) }}
                className="btn-primary gap-1.5 text-sm"
              >
                <Plus className="w-4 h-4" /> Create Lead
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Lead ID', 'Lead Name', 'Company', 'Contact', 'Phone', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leadsLoading ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading leads...
                    </td></tr>
                  ) : leads.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">
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
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg border ${leadStatusColor[lead.status] ?? ''}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            disabled={converting === lead.id || lead.status === 'CONVERTED'}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Convert to Opportunity"
                          >
                            {converting === lead.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <ArrowRightCircle className="w-3.5 h-3.5" />
                            }
                            Convert
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leads.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
                {leads.length} lead{leads.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── OPPORTUNITY TAB ──────────────────────────────────────── */}
      {activeTab === 'opportunities' && (
        <div className="max-w-7xl mx-auto px-6 pb-10 mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">My Opportunities</h2>
              <p className="text-sm text-slate-400 mt-0.5">Leads you have converted — assigned to you</p>
            </div>
            <button onClick={loadOpps} className="btn-icon" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${oppsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    {['Opp ID', 'Lead Name', 'Company', 'Contact', 'Phone', 'Status', 'Converted On', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
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
                      No opportunities yet. Convert a lead to get started!
                    </td></tr>
                  ) : opps.map(opp => (
                    <tr key={opp.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-400">{opp.opportunityId}</td>
                      <td className="px-4 py-3.5 font-medium text-white">{opp.leadName}</td>
                      <td className="px-4 py-3.5 text-slate-300">{opp.companyName || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300">{opp.contactPerson || '—'}</td>
                      <td className="px-4 py-3.5 text-slate-300">{opp.phone || '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="relative group/status">
                          <button className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all
                            ${oppStatusColor[opp.status] ?? ''} hover:brightness-125`}>
                            {updatingOpp === opp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {opp.status.replace('_', ' ')}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          {/* Dropdown */}
                          <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10
                            opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all py-1 min-w-[130px]">
                            {oppStatuses.map(s => (
                              <button
                                key={s}
                                onClick={() => handleOppStatus(opp, s)}
                                disabled={s === opp.status || updatingOpp === opp.id}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors
                                  ${s === opp.status ? 'text-brand-400 font-semibold' : 'text-slate-300'}`}
                              >
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs">
                        {new Date(opp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditOpp(opp); setOppModalOpen(true) }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {opps.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
                {opps.length} opportunit{opps.length !== 1 ? 'ies' : 'y'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead Create/Edit Modal */}
      {modalOpen && (
        <LeadModal
          initial={editLead}
          onSave={handleSaveLead}
          onClose={() => { setModalOpen(false); setEditLead(null) }}
        />
      )}

      {/* Opportunity Edit Modal */}
      {oppModalOpen && editOpp && (
        <OpportunityModal
          initial={editOpp}
          onSave={handleSaveOpportunity}
          onClose={() => { setOppModalOpen(false); setEditOpp(null) }}
        />
      )}
    </div>
  )
}
