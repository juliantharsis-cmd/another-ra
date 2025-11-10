export interface Company {
  id: string
  isinCode: string
  companyName: string
  status: 'Active' | 'Closed'
  primarySector: string
  primaryActivity: string
  primaryIndustry: string
  notes?: string
  createdBy: string
  created: string
  lastModifiedBy: string
  lastModified: string
}

export const mockCompanies: Company[] = [
  {
    id: '1',
    isinCode: 'KR7004730002',
    companyName: 'SK Inc., SK Trichem',
    status: 'Active',
    primarySector: 'IT & software development, Chemicals',
    primaryActivity: 'IT services, Specialty chemicals',
    primaryIndustry: 'Services, Materials',
    notes: '',
    createdBy: 'Julian THARSIS',
    created: '2/16/2025 6:40pm',
    lastModifiedBy: 'Julian THARSIS',
    lastModified: '10/18/2025 10:38am',
  },
  {
    id: '2',
    isinCode: 'US1234567890',
    companyName: 'Silitech Technology Corporation',
    status: 'Active',
    primarySector: 'Electrical & electronic equipment',
    primaryActivity: 'Electronic components',
    primaryIndustry: 'Manufacturing',
    createdBy: 'Admin User',
    created: '1/15/2025 9:00am',
    lastModifiedBy: 'Admin User',
    lastModified: '11/20/2025 2:30pm',
  },
  {
    id: '3',
    isinCode: 'KR7001234567',
    companyName: 'Shinwon Corporation',
    status: 'Active',
    primarySector: 'Textiles & fabric goods',
    primaryActivity: 'Apparel design & manufacturing',
    primaryIndustry: 'Apparel',
    createdBy: 'System',
    created: '3/1/2025 8:15am',
    lastModifiedBy: 'System',
    lastModified: '9/12/2025 4:45pm',
  },
  {
    id: '4',
    isinCode: 'KR7007654321',
    companyName: 'Samsung Electronics',
    status: 'Active',
    primarySector: 'Electrical & electronic equipment',
    primaryActivity: 'Electronic components',
    primaryIndustry: 'Manufacturing',
    createdBy: 'Admin User',
    created: '1/10/2025 10:00am',
    lastModifiedBy: 'Admin User',
    lastModified: '12/1/2025 11:20am',
  },
  {
    id: '5',
    isinCode: 'US9876543210',
    companyName: 'Rayonier Inc.',
    status: 'Active',
    primarySector: 'Logging & rubber tapping',
    primaryActivity: 'Logging',
    primaryIndustry: 'Materials',
    createdBy: 'Julian THARSIS',
    created: '2/5/2025 3:30pm',
    lastModifiedBy: 'Julian THARSIS',
    lastModified: '10/25/2025 9:15am',
  },
  {
    id: '6',
    isinCode: 'KR7005555555',
    companyName: 'Metal Works Co.',
    status: 'Active',
    primarySector: 'Metal products manufacturing',
    primaryActivity: 'Fabricated metal components',
    primaryIndustry: 'Manufacturing',
    createdBy: 'Admin User',
    created: '4/12/2025 1:00pm',
    lastModifiedBy: 'Admin User',
    lastModified: '11/15/2025 3:00pm',
  },
  {
    id: '7',
    isinCode: 'US1112223334',
    companyName: 'Glass Products Ltd.',
    status: 'Active',
    primarySector: 'Other materials, Light manufacturing',
    primaryActivity: 'Glass products, Other containers & packaging',
    primaryIndustry: 'Materials',
    createdBy: 'System',
    created: '5/20/2025 10:30am',
    lastModifiedBy: 'System',
    lastModified: '11/28/2025 2:00pm',
  },
  {
    id: '8',
    isinCode: 'KR7008888888',
    companyName: 'Paper Solutions Inc.',
    status: 'Active',
    primarySector: 'Paper products & packaging',
    primaryActivity: 'Paper packaging, Plastic products',
    primaryIndustry: 'Materials',
    createdBy: 'Admin User',
    created: '6/8/2025 11:00am',
    lastModifiedBy: 'Admin User',
    lastModified: '12/5/2025 10:00am',
  },
]

export const statusOptions = ['Active', 'Closed']
export const primaryIndustryOptions = [
  'Services',
  'Materials',
  'Biotech, health care & pharma',
  'Hospitality',
  'Manufacturing',
  'Food, beverage & agriculture',
  'Transportation services',
  'Power generation',
  'Infrastructure',
  'Retail',
  'Apparel',
  'Fossil Fuels',
]

export const primaryActivityOptions = [
  'IT services',
  'Specialty chemicals',
  'Electronic components',
  'Apparel design & manufacturing',
  'Logging',
  'Fabricated metal components',
  'Glass products',
  'Paper packaging',
  'Plastic products',
  'Metal smelting, refining & forming',
  'Logistics - 3rd party',
  'Transportation equipment',
  'Nuclear generation',
]

// Color mapping for tags - Schneider Electric inspired palette
export const getTagColor = (text: string): string => {
  const colors = [
    'bg-green-100 text-green-700 border border-green-200',
    'bg-blue-100 text-blue-700 border border-blue-200',
    'bg-neutral-100 text-neutral-700 border border-neutral-200',
    'bg-cyan-100 text-cyan-700 border border-cyan-200',
    'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'bg-teal-100 text-teal-700 border border-teal-200',
    'bg-slate-100 text-slate-700 border border-slate-200',
    'bg-indigo-100 text-indigo-700 border border-indigo-200',
    'bg-violet-100 text-violet-700 border border-violet-200',
  ]
  const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

