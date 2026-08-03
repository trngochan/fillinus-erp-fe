/**
 * Full application left-menu tree — sourced from
 * Document/FILLINUS-ERP/docs/Screen_Spec_FILLINUS_ER (Phase1 Index, 48 screens across
 * 8 modules) + SYS-004 Menu spec. Authentication screens are excluded — those are
 * pre-login pages / the user avatar dropdown, not sidebar items.
 *
 * `built: false` screens are shown (per business decision) but are not clickable —
 * only the 5 Sales screens that actually exist today are wired to a real route.
 */
export interface MenuScreenItem {
  id: string
  name: string
  built: boolean
  /** Route path — only set when built */
  path?: string
  /** Sales-only: which SalesDashboard tab this screen maps to (?tab=) */
  tab?: string
}

export interface MenuModuleItem {
  id: string
  name: string
  screens: MenuScreenItem[]
}

export const APP_MENU: MenuModuleItem[] = [
  {
    id: 'dashboard', name: 'Dashboard',
    screens: [
      { id: 'dashboard', name: 'Dashboard', built: false },
    ],
  },
  {
    id: 'ai', name: 'AI Assistant',
    screens: [
      { id: 'ai-assistant', name: 'AI Assistant', built: false },
    ],
  },
  {
    id: 'sales', name: 'Sales',
    screens: [
      { id: 'lead',             name: 'Lead',              built: true, path: '/sales', tab: 'leads' },
      { id: 'opportunity',      name: 'Opportunity',       built: true, path: '/sales', tab: 'opportunities' },
      { id: 'quotation',        name: 'Quotation',         built: true, path: '/sales', tab: 'quotations' },
      { id: 'deal-negotiation', name: 'Deal Negotiation',  built: true, path: '/sales', tab: 'negotiations' },
      { id: 'deal-won-lost',    name: 'Deal Won / Lost',   built: true, path: '/sales', tab: 'dealResults' },
      { id: 'new-client',       name: 'New Client',        built: false },
      { id: 'existing-client',  name: 'Existing Client',   built: false },
      { id: 'revenue',          name: 'Revenue',           built: false },
      { id: 'product-info',     name: 'Product Info',      built: false },
      { id: 'services-sow',     name: 'Services for SOW Reference', built: false },
    ],
  },
  {
    id: 'agency', name: 'Agency Entertainment',
    screens: [
      { id: 'supplys-demo',  name: "Supply's Demo", built: false },
      { id: 'artist',        name: 'Artist',         built: false },
      { id: 'demo-matching', name: 'Demo Matching',  built: false },
    ],
  },
  {
    id: 'ip', name: 'IP Management',
    screens: [
      { id: 'ip-management', name: 'IP Management', built: false },
      { id: 'demo-list',     name: 'Demo List',      built: false },
    ],
  },
  {
    id: 'label', name: 'Label',
    screens: [
      { id: 'sound-recording',         name: 'Sound Recording',           built: false },
      { id: 'demo-evaluation',         name: 'Demo Evaluation',           built: false },
      { id: 'lab-deal-negotiation',    name: 'Deal Negotiation',          built: false },
      { id: 'recording-agreement',     name: 'Recording Agreement',       built: false },
      { id: 'production',              name: 'Production',                built: false },
      { id: 'rights-metadata-setup',   name: 'Rights & Metadata Setup',   built: false },
      { id: 'distribution',            name: 'Distribution',              built: false },
      { id: 'marketing-campaign',      name: 'Marketing Campaign',        built: false },
      { id: 'monetization',            name: 'Monetization',              built: false },
      { id: 'royalty-reporting',       name: 'Royalty & Reporting',       built: false },
      { id: 'publishing-agreement',    name: 'Publishing Agreement',      built: false },
      { id: 'copyright-registration',  name: 'Copyright Registration',    built: false },
      { id: 'rights-collection',       name: 'Rights Collection',         built: false },
      { id: 'royalty-distribution',    name: 'Royalty Distribution',      built: false },
    ],
  },
  {
    id: 'pac', name: 'Project Accounting',
    screens: [
      { id: 'project-list',                        name: 'Project List',                        built: false },
      { id: 'project-detail',                       name: 'Project Detail',                      built: false },
      { id: 'project-accounting',                   name: 'Project Accounting',                  built: false },
      { id: 'production-sow-allocation',            name: 'Production SOW Allocation',           built: false },
      { id: 'profit-sharing',                       name: 'Profit Sharing',                      built: false },
      { id: 'offer-acceptance-payment-tracking',    name: 'Offer Acceptance Payment Tracking',   built: false },
    ],
  },
  {
    id: 'sys', name: 'Core System',
    screens: [
      { id: 'user',            name: 'User',              built: false },
      { id: 'role-permission', name: 'Role & Permission', built: false },
      { id: 'department',      name: 'Department',        built: false },
      { id: 'menu',            name: 'Menu',               built: false },
      { id: 'master-data',     name: 'Master Data',       built: false },
      { id: 'audit-log',       name: 'Audit Log',         built: false },
    ],
  },
]
