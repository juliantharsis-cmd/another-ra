# Data Access Layer (DAL) + Tiered Ownership Model
## Implementation Guide for Sust-AI Platform

**Document Version:** 1.0  
**Created:** 2024  
**Audience:** Engineering Leads, Product Teams, Data Governance  
**Status:** Proposal

---

## Executive Summary

This document maps the **Data Access Layer (DAL) + Tiered Ownership Model** to the Sust-AI platform's specific codebase structure. It provides concrete implementation guidance for organizing code, features, and teams to enable parallel development, de-risk backend migration, and maintain data consistency.

**Key Outcomes:**
- ✅ Teams work in parallel without data conflicts
- ✅ Backend migration happens gradually with zero downtime
- ✅ Prototyping speed preserved while ensuring production quality
- ✅ 60%+ code reuse through shared adapters
- ✅ Clear ownership and governance model

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Proposed Architecture](#proposed-architecture)
3. [Code Organization](#code-organization)
4. [Team Structure & Responsibilities](#team-structure--responsibilities)
5. [Feature Development Workflow](#feature-development-workflow)
6. [Contract Definition & Management](#contract-definition--management)
7. [Adapter Implementation Pattern](#adapter-implementation-pattern)
8. [Integration with Table Creation System](#integration-with-table-creation-system)
9. [Migration Strategy](#migration-strategy)
10. [Success Metrics](#success-metrics)

---

## 1. Current Architecture Analysis

### 1.1 Existing Patterns

**Current Structure:**
```
server/src/
├── services/
│   ├── *AirtableService.ts          # Direct Airtable access
│   ├── RelationshipResolver.ts      # Relationship handling
│   └── TableCreationService.ts      # Auto-generation
├── database/
│   ├── adapters/
│   │   ├── AirtableAdapter.ts       # ✅ Adapter pattern exists
│   │   ├── PostgreSQLAdapter.ts     # 🚧 Placeholder
│   │   └── MockAdapter.ts           # ✅ Testing
│   └── interfaces/
│       └── IDatabase.ts              # ✅ Contract interface
├── adapters/
│   └── preferences/                  # ✅ Adapter pattern (preferences)
│       ├── AirtablePreferencesAdapter.ts
│       ├── PostgresPreferencesAdapter.ts
│       └── PreferencesAdapterFactory.ts
└── routes/
    └── *.ts                          # Express routes

src/lib/api/
└── *.ts                              # Frontend API clients

src/app/spaces/
└── {product-line}/                   # Feature pages
    └── {feature}/
        ├── page.tsx
        └── layout.tsx
```

**Strengths:**
- ✅ Adapter pattern already exists for `Company` and `Preferences`
- ✅ Interface-based contracts (`IDatabase`, `IPreferencesAdapter`)
- ✅ Factory pattern for adapter selection
- ✅ Two-phase table creation system in place

**Gaps:**
- ❌ Most services (`*AirtableService.ts`) bypass adapters
- ❌ No centralized contract registry
- ❌ No tiered ownership model
- ❌ No contract validation before adapter creation
- ❌ Teams can modify services directly (no governance)

### 1.2 Current Data Access Patterns

**Pattern A: Direct Service Access (Most Common)**
```typescript
// Current: Direct Airtable access
export class ScopeAirtableService {
  private base: Airtable.Base
  constructor() {
    this.base = Airtable.base(baseId)
  }
  async getAll(): Promise<Scope[]> {
    return this.base('Scope').select().all()
  }
}
```

**Pattern B: Adapter Pattern (Exists but Limited)**
```typescript
// Current: Adapter exists for Company
const db = DatabaseFactory.getDatabase()
const companies = await db.findAllCompanies()
```

**Pattern C: Preferences Adapter (Good Example)**
```typescript
// Current: Factory-based adapter
const adapter = getPreferencesAdapter()
const prefs = await adapter.getUserPreferences(userId)
```

---

## 2. Proposed Architecture

### 2.1 Three-Tier Model Applied to Codebase

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Data Governance                                    │
│ Location: server/src/contracts/                            │
│ Owners: 1 Data Lead + 1 Data Engineer                      │
│ Responsibilities:                                           │
│  - Define contracts (TypeScript interfaces)                │
│  - Review adapter implementations                           │
│  - Manage contract versioning                               │
│  - Approve schema changes                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Tier 2: Product Data Leads                                 │
│ Location: server/src/adapters/{product-line}/              │
│ Owners: 1 per product line (4 total)                       │
│ Responsibilities:                                           │
│  - Implement adapters from contracts                       │
│  - Optimize queries                                         │
│  - Support product teams                                    │
│  - Maintain adapter tests                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Tier 3: Product Teams                                      │
│ Location: src/app/spaces/{product-line}/{feature}/         │
│ Owners: 16-20 engineers across 4 product lines             │
│ Responsibilities:                                           │
│  - Build features using adapters (not direct Airtable)     │
│  - Frontend API clients (src/lib/api/)                      │
│  - UI components                                            │
│  - Feature tests                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 New Directory Structure

```
server/src/
├── contracts/                          # 🆕 Tier 1: Data Contracts
│   ├── index.ts                       # Contract registry
│   ├── emission-management/
│   │   ├── ScopeContract.ts
│   │   ├── EmissionFactorContract.ts
│   │   └── NormalizedActivityContract.ts
│   ├── reference-data/
│   │   ├── UnitContract.ts
│   │   └── UnitConversionContract.ts
│   └── system-config/
│       ├── CompanyContract.ts
│       └── GeographyContract.ts
│
├── adapters/                          # 🔄 Tier 2: Adapters (reorganized)
│   ├── factories/                     # 🆕 Adapter factories
│   │   ├── AdapterFactory.ts          # Central factory
│   │   └── {product-line}Factory.ts   # Per-product factories
│   │
│   ├── emission-management/            # 🆕 Product-line adapters
│   │   ├── ScopeAdapter.ts
│   │   │   ├── AirtableScopeAdapter.ts
│   │   │   └── PostgresScopeAdapter.ts
│   │   └── EmissionFactorAdapter.ts
│   │
│   ├── reference-data/
│   │   └── UnitAdapter.ts
│   │
│   └── system-config/
│       └── CompanyAdapter.ts          # Migrate from database/adapters/
│
├── services/                          # 🔄 Refactored: Use adapters
│   ├── ScopeService.ts                # Uses ScopeAdapter (not direct Airtable)
│   ├── EmissionFactorService.ts
│   └── ...
│
└── routes/                            # ✅ Unchanged
    └── *.ts

src/lib/api/                           # ✅ Unchanged: Frontend clients
    └── *.ts

src/app/spaces/                        # ✅ Unchanged: Feature pages
    └── {product-line}/
        └── {feature}/
```

---

## 3. Code Organization

### 3.1 Contract Definition (Tier 1)

**Location:** `server/src/contracts/{domain}/{Entity}Contract.ts`

**Example: Scope Contract**
```typescript
// server/src/contracts/emission-management/ScopeContract.ts

/**
 * Scope Data Contract
 * 
 * Tier 1: Data Governance
 * Owner: Data Lead + Data Engineer
 * 
 * This contract defines the canonical schema for Scope data.
 * All adapters (Airtable, PostgreSQL) must implement this contract.
 * Product teams build features against this contract, not raw Airtable.
 * 
 * Version: 1.0.0
 * Last Updated: 2024-01-15
 * Breaking Changes: None
 */

export interface ScopeContract {
  // Core fields
  id: string
  name: string
  code: string
  description?: string
  
  // Relationships (resolved)
  parentScopeId?: string
  parentScopeName?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
  
  // Status
  status: 'active' | 'inactive' | 'archived'
}

export interface ScopeQueryOptions {
  limit?: number
  offset?: number
  sortBy?: 'name' | 'code' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  filters?: {
    status?: ScopeContract['status'][]
    parentScopeId?: string
    search?: string
  }
}

export interface ScopeAdapter {
  /**
   * Get all scopes matching query options
   */
  findAll(options?: ScopeQueryOptions): Promise<ScopeContract[]>
  
  /**
   * Get paginated scopes
   */
  findPaginated(options?: ScopeQueryOptions): Promise<PaginatedResult<ScopeContract>>
  
  /**
   * Get scope by ID
   */
  findById(id: string): Promise<ScopeContract | null>
  
  /**
   * Create new scope
   */
  create(dto: CreateScopeDto, userId?: string): Promise<ScopeContract>
  
  /**
   * Update existing scope
   */
  update(id: string, dto: UpdateScopeDto, userId?: string): Promise<ScopeContract>
  
  /**
   * Delete scope
   */
  delete(id: string): Promise<boolean>
  
  /**
   * Count scopes matching filters
   */
  count(filters?: ScopeQueryOptions['filters']): Promise<number>
}

export interface CreateScopeDto {
  name: string
  code: string
  description?: string
  parentScopeId?: string
  status?: ScopeContract['status']
}

export interface UpdateScopeDto extends Partial<CreateScopeDto> {}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}
```

**Contract Registry**
```typescript
// server/src/contracts/index.ts

/**
 * Contract Registry
 * 
 * Central registry of all data contracts.
 * Used by adapter factories and validation.
 */

import { ScopeContract, ScopeAdapter } from './emission-management/ScopeContract'
import { UnitContract, UnitAdapter } from './reference-data/UnitContract'
// ... other contracts

export const Contracts = {
  'emission-management': {
    scope: {
      contract: ScopeContract,
      adapter: ScopeAdapter,
      version: '1.0.0',
    },
    // ... other emission management contracts
  },
  'reference-data': {
    unit: {
      contract: UnitContract,
      adapter: UnitAdapter,
      version: '1.0.0',
    },
    // ... other reference data contracts
  },
} as const

export type ContractName = keyof typeof Contracts
export type DomainName = keyof typeof Contracts[ContractName]
```

### 3.2 Adapter Implementation (Tier 2)

**Location:** `server/src/adapters/{product-line}/{Entity}Adapter.ts`

**Example: Airtable Scope Adapter**
```typescript
// server/src/adapters/emission-management/AirtableScopeAdapter.ts

import { ScopeAdapter, ScopeContract, ScopeQueryOptions, CreateScopeDto, UpdateScopeDto } from '../../contracts/emission-management/ScopeContract'
import Airtable from 'airtable'
import { RelationshipResolver } from '../../services/RelationshipResolver'

/**
 * Airtable Scope Adapter
 * 
 * Tier 2: Product Data Lead (Emission Management)
 * Owner: Emission Management Data Lead
 * 
 * Implements ScopeContract using Airtable as data source.
 * This adapter can be swapped for PostgresScopeAdapter without
 * changing any product team code.
 */
export class AirtableScopeAdapter implements ScopeAdapter {
  private base: Airtable.Base
  private tableName: string = 'Scope'
  private relationshipResolver: RelationshipResolver

  constructor() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN
    if (!apiKey) {
      throw new Error('AIRTABLE_PERSONAL_ACCESS_TOKEN required')
    }
    
    const baseId = process.env.AIRTABLE_SYSTEM_CONFIG_BASE_ID
    Airtable.configure({ apiKey })
    this.base = Airtable.base(baseId!)
    this.relationshipResolver = new RelationshipResolver(baseId!, apiKey)
  }

  async findAll(options?: ScopeQueryOptions): Promise<ScopeContract[]> {
    let query = this.base(this.tableName).select()
    
    // Apply filters
    if (options?.filters?.status) {
      query = query.filterByFormula(`{Status} = '${options.filters.status[0]}'`)
    }
    
    // Apply sorting
    if (options?.sortBy) {
      const direction = options.sortOrder === 'desc' ? 'desc' : 'asc'
      query = query.sort([{ field: this.mapFieldName(options.sortBy), direction }])
    }
    
    const records = await query.all()
    
    // Map to contract
    return Promise.all(records.map(record => this.mapToContract(record)))
  }

  async findById(id: string): Promise<ScopeContract | null> {
    try {
      const record = await this.base(this.tableName).find(id)
      return this.mapToContract(record)
    } catch (error) {
      return null
    }
  }

  async create(dto: CreateScopeDto, userId?: string): Promise<ScopeContract> {
    const fields: any = {
      'Name': dto.name,
      'Code': dto.code,
      'Description': dto.description || '',
      'Status': dto.status || 'active',
    }
    
    if (dto.parentScopeId) {
      fields['Parent Scope'] = [dto.parentScopeId]
    }
    
    const record = await this.base(this.tableName).create(fields)
    return this.mapToContract(record)
  }

  async update(id: string, dto: UpdateScopeDto, userId?: string): Promise<ScopeContract> {
    const fields: any = {}
    
    if (dto.name) fields['Name'] = dto.name
    if (dto.code) fields['Code'] = dto.code
    if (dto.description !== undefined) fields['Description'] = dto.description
    if (dto.status) fields['Status'] = dto.status
    if (dto.parentScopeId) fields['Parent Scope'] = [dto.parentScopeId]
    
    const record = await this.base(this.tableName).update(id, fields)
    return this.mapToContract(record)
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.base(this.tableName).destroy(id)
      return true
    } catch (error) {
      return false
    }
  }

  async count(filters?: ScopeQueryOptions['filters']): Promise<number> {
    let query = this.base(this.tableName).select()
    
    if (filters?.status) {
      query = query.filterByFormula(`{Status} = '${filters.status[0]}'`)
    }
    
    const records = await query.all()
    return records.length
  }

  async findPaginated(options?: ScopeQueryOptions): Promise<PaginatedResult<ScopeContract>> {
    const limit = options?.limit || 10
    const offset = options?.offset || 0
    
    let query = this.base(this.tableName).select()
    
    // Apply filters, sorting (same as findAll)
    // ...
    
    const records = await query.all()
    const total = await this.count(options?.filters)
    
    return {
      data: await Promise.all(records.map(r => this.mapToContract(r))),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Map Airtable record to contract
   * This is where field name mapping happens
   */
  private async mapToContract(record: Airtable.Record<any>): Promise<ScopeContract> {
    // Resolve relationships
    const parentScopeId = record.fields['Parent Scope']?.[0]
    const parentScopeName = parentScopeId 
      ? await this.relationshipResolver.resolveRecordName('Scope', parentScopeId)
      : undefined
    
    return {
      id: record.id,
      name: record.fields['Name'] || '',
      code: record.fields['Code'] || '',
      description: record.fields['Description'],
      parentScopeId,
      parentScopeName,
      createdAt: new Date(record.fields['Created'] || record._rawJson.createdTime),
      updatedAt: new Date(record._rawJson.lastModifiedTime),
      status: (record.fields['Status'] || 'active') as ScopeContract['status'],
    }
  }

  private mapFieldName(contractField: string): string {
    // Map contract field names to Airtable field names
    const mapping: Record<string, string> = {
      'name': 'Name',
      'code': 'Code',
      'createdAt': 'Created',
    }
    return mapping[contractField] || contractField
  }
}
```

**PostgreSQL Adapter (Future)**
```typescript
// server/src/adapters/emission-management/PostgresScopeAdapter.ts

import { ScopeAdapter, ScopeContract, ScopeQueryOptions } from '../../contracts/emission-management/ScopeContract'
import { Pool } from 'pg'

/**
 * PostgreSQL Scope Adapter
 * 
 * Implements same contract as AirtableScopeAdapter.
 * Product teams use ScopeService, which switches adapters transparently.
 */
export class PostgresScopeAdapter implements ScopeAdapter {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })
  }

  async findAll(options?: ScopeQueryOptions): Promise<ScopeContract[]> {
    const query = `
      SELECT 
        id, name, code, description, 
        parent_scope_id, status,
        created_at, updated_at
      FROM scopes
      ${this.buildWhereClause(options?.filters)}
      ${this.buildOrderClause(options)}
      ${this.buildLimitClause(options)}
    `
    
    const result = await this.pool.query(query)
    return result.rows.map(row => this.mapRowToContract(row))
  }

  // ... implement other methods

  private mapRowToContract(row: any): ScopeContract {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      parentScopeId: row.parent_scope_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      status: row.status,
    }
  }
}
```

### 3.3 Adapter Factory (Tier 2)

**Location:** `server/src/adapters/factories/{product-line}Factory.ts`

```typescript
// server/src/adapters/factories/EmissionManagementFactory.ts

import { ScopeAdapter } from '../../contracts/emission-management/ScopeContract'
import { AirtableScopeAdapter } from '../emission-management/AirtableScopeAdapter'
import { PostgresScopeAdapter } from '../emission-management/PostgresScopeAdapter'

/**
 * Emission Management Adapter Factory
 * 
 * Tier 2: Product Data Lead
 * 
 * Creates adapters based on environment configuration.
 * Allows gradual migration: 0% → 10% → 25% → 50% → 100% backend traffic.
 */
export class EmissionManagementFactory {
  private static scopeAdapter: ScopeAdapter | null = null

  static getScopeAdapter(): ScopeAdapter {
    if (this.scopeAdapter) {
      return this.scopeAdapter
    }

    const adapterType = process.env.SCOPE_ADAPTER || 'airtable'
    const backendTrafficPercent = parseInt(process.env.BACKEND_TRAFFIC_PERCENT || '0')

    // Gradual migration: route % of traffic to backend
    if (adapterType === 'postgres' || backendTrafficPercent > 0) {
      // Use adapter router for gradual migration
      this.scopeAdapter = new ScopeAdapterRouter(
        new AirtableScopeAdapter(),
        new PostgresScopeAdapter(),
        backendTrafficPercent
      )
    } else {
      this.scopeAdapter = new AirtableScopeAdapter()
    }

    return this.scopeAdapter
  }

  static reset(): void {
    this.scopeAdapter = null
  }
}

/**
 * Adapter Router for Gradual Migration
 * Routes X% of requests to backend adapter, (100-X)% to Airtable
 */
class ScopeAdapterRouter implements ScopeAdapter {
  constructor(
    private airtableAdapter: ScopeAdapter,
    private postgresAdapter: ScopeAdapter,
    private backendPercent: number
  ) {}

  async findAll(options?: ScopeQueryOptions): Promise<ScopeContract[]> {
    // Route based on percentage
    const useBackend = Math.random() * 100 < this.backendPercent
    
    if (useBackend) {
      try {
        return await this.postgresAdapter.findAll(options)
      } catch (error) {
        // Fallback to Airtable on error
        console.warn('Backend adapter failed, falling back to Airtable:', error)
        return await this.airtableAdapter.findAll(options)
      }
    }
    
    return await this.airtableAdapter.findAll(options)
  }

  // ... implement other methods with same routing logic
}
```

### 3.4 Service Layer (Refactored)

**Location:** `server/src/services/{Entity}Service.ts`

```typescript
// server/src/services/ScopeService.ts

import { ScopeAdapter, ScopeContract, ScopeQueryOptions } from '../contracts/emission-management/ScopeContract'
import { EmissionManagementFactory } from '../adapters/factories/EmissionManagementFactory'

/**
 * Scope Service
 * 
 * Tier 3: Product Teams use this service
 * 
 * This service uses adapters, not direct Airtable access.
 * Product teams never import Airtable directly.
 */
export class ScopeService {
  private adapter: ScopeAdapter

  constructor() {
    // Get adapter from factory (Airtable or PostgreSQL)
    this.adapter = EmissionManagementFactory.getScopeAdapter()
  }

  async getAll(options?: ScopeQueryOptions): Promise<ScopeContract[]> {
    return this.adapter.findAll(options)
  }

  async getById(id: string): Promise<ScopeContract | null> {
    return this.adapter.findById(id)
  }

  async create(dto: CreateScopeDto, userId?: string): Promise<ScopeContract> {
    return this.adapter.create(dto, userId)
  }

  async update(id: string, dto: UpdateScopeDto, userId?: string): Promise<ScopeContract> {
    return this.adapter.update(id, dto, userId)
  }

  async delete(id: string): Promise<boolean> {
    return this.adapter.delete(id)
  }
}
```

**Migration from Current Pattern:**
```typescript
// ❌ OLD: Direct Airtable access
export class ScopeAirtableService {
  private base: Airtable.Base
  async getAll() {
    return this.base('Scope').select().all()
  }
}

// ✅ NEW: Adapter-based
export class ScopeService {
  private adapter: ScopeAdapter
  async getAll() {
    return this.adapter.findAll()
  }
}
```

---

## 4. Team Structure & Responsibilities

### 4.1 Tier 1: Data Governance

**Team Composition:**
- 1 Data Lead (PM or Senior Engineer)
- 1 Data Engineer

**Location:** `server/src/contracts/`

**Responsibilities:**
1. **Contract Design**
   - Define TypeScript interfaces for all data entities
   - Version contracts (semantic versioning)
   - Document breaking changes
   - Maintain contract registry

2. **Schema Review**
   - Review Airtable schema changes
   - Approve adapter implementations
   - Validate contract compliance

3. **Migration Planning**
   - Plan backend migration timeline
   - Coordinate adapter switching
   - Monitor migration metrics

**Workflow:**
```
Week 1: Contract Design Sprint
├── Day 1-2: Review existing Airtable schemas
├── Day 3-4: Design contracts (TypeScript interfaces)
└── Day 5: Publish contracts to registry
```

### 4.2 Tier 2: Product Data Leads

**Team Composition:**
- 1 Data Lead per product line (4 total)
  - Emission Management Data Lead
  - Reference Data Data Lead
  - System Config Data Lead
  - ECM Management Data Lead

**Location:** `server/src/adapters/{product-line}/`

**Responsibilities:**
1. **Adapter Implementation**
   - Build adapters from contracts
   - Implement Airtable → Contract mapping
   - Optimize queries
   - Handle relationship resolution

2. **Adapter Testing**
   - Unit tests for adapters
   - Contract compliance tests
   - Performance tests

3. **Product Team Support**
   - Answer questions about contracts
   - Help debug adapter issues
   - Review product team code (ensure they use adapters)

**Workflow:**
```
Week 2: Adapter Build Sprint
├── Day 1-2: Implement Airtable adapters
├── Day 3: Write tests
├── Day 4: Code review (Tier 1)
└── Day 5: Deploy adapters
```

### 4.3 Tier 3: Product Teams

**Team Composition:**
- 16-20 engineers across 4 product lines
- Each team: 4-5 engineers + 1 PM

**Location:** `src/app/spaces/{product-line}/{feature}/`

**Responsibilities:**
1. **Feature Development**
   - Build UI components
   - Use services (not adapters directly)
   - Write feature tests
   - Frontend API clients (`src/lib/api/`)

2. **Code Quality**
   - Follow DAL pattern (no direct Airtable)
   - Use contracts for TypeScript types
   - Write tests

**Workflow:**
```
Weeks 3-6: Feature Development Sprint
├── Week 3: Feature design + API integration
├── Week 4: UI implementation
├── Week 5: Testing + bug fixes
└── Week 6: Deployment
```

---

## 5. Feature Development Workflow

### 5.1 Three-Tier Prototyping

**Tier A: Raw Exploration (PM Alone)**
```typescript
// ✅ ALLOWED: Direct Airtable for prototyping
// Location: prototypes/{feature-name}/exploration.ts
import Airtable from 'airtable'

const base = Airtable.base('appXXX')
const records = await base('Scope').select().all()
// Build rough prototype, show stakeholders
```

**Tier B: Validated Prototype (PM + Data Lead)**
```typescript
// ✅ REQUIRED: Use adapters
// Location: prototypes/{feature-name}/validated.ts
import { ScopeService } from '@/services/ScopeService'

const scopeService = new ScopeService()
const scopes = await scopeService.getAll()
// Rebuild prototype with adapter, validate contract
```

**Tier C: Production (Product Team)**
```typescript
// ✅ REQUIRED: Use services (not adapters directly)
// Location: src/app/spaces/emission-management/scope/page.tsx
import { ScopeService } from '@/services/ScopeService'

const scopeService = new ScopeService()
const scopes = await scopeService.getAll()
// Full feature implementation
```

### 5.2 Feature Development Example

**Scenario:** Build "Scope Management Dashboard" feature

**Week 1 (Tier 1): Contract Design**
```typescript
// Tier 1 creates contract
// server/src/contracts/emission-management/ScopeContract.ts
export interface ScopeContract {
  id: string
  name: string
  code: string
  // ... defined by Tier 1
}
```

**Week 2 (Tier 2): Adapter Build**
```typescript
// Tier 2 builds adapter
// server/src/adapters/emission-management/AirtableScopeAdapter.ts
export class AirtableScopeAdapter implements ScopeAdapter {
  // ... implements contract
}
```

**Weeks 3-6 (Tier 3): Feature Build**
```typescript
// Tier 3 builds feature
// server/src/services/ScopeService.ts
export class ScopeService {
  private adapter = EmissionManagementFactory.getScopeAdapter()
  async getAll() { return this.adapter.findAll() }
}

// src/lib/api/scope.ts
export const scopeApi = {
  getAll: () => fetch('/api/scope').then(r => r.json())
}

// src/app/spaces/emission-management/scope/page.tsx
export default function ScopePage() {
  const scopes = await scopeApi.getAll()
  // Render UI
}
```

---

## 6. Contract Definition & Management

### 6.1 Contract Structure

**File Naming:** `{Entity}Contract.ts`

**Required Sections:**
1. **Interface Definition** (TypeScript interface)
2. **Query Options** (filtering, sorting, pagination)
3. **Adapter Interface** (methods adapters must implement)
4. **DTOs** (Create/Update data transfer objects)
5. **Version Info** (semantic versioning)

**Example Contract Template:**
```typescript
/**
 * {Entity} Data Contract
 * 
 * Tier 1: Data Governance
 * Version: {major}.{minor}.{patch}
 * Last Updated: {date}
 * Breaking Changes: {list or "None"}
 */

export interface {Entity}Contract {
  // Core fields
  id: string
  name: string
  
  // Relationships (resolved)
  // ...
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  
  // Status
  status: 'active' | 'inactive'
}

export interface {Entity}QueryOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: {
    status?: string[]
    search?: string
  }
}

export interface {Entity}Adapter {
  findAll(options?: {Entity}QueryOptions): Promise<{Entity}Contract[]>
  findById(id: string): Promise<{Entity}Contract | null>
  create(dto: Create{Entity}Dto): Promise<{Entity}Contract>
  update(id: string, dto: Update{Entity}Dto): Promise<{Entity}Contract>
  delete(id: string): Promise<boolean>
  count(filters?: {Entity}QueryOptions['filters']): Promise<number>
}

export interface Create{Entity}Dto {
  name: string
  // ... required fields
}

export interface Update{Entity}Dto extends Partial<Create{Entity}Dto> {}
```

### 6.2 Contract Versioning

**Semantic Versioning:**
- **Major** (1.0.0 → 2.0.0): Breaking changes (field removed, type changed)
- **Minor** (1.0.0 → 1.1.0): New fields added (backward compatible)
- **Patch** (1.0.0 → 1.0.1): Bug fixes, documentation updates

**Migration Strategy:**
```typescript
// Contract v1.0.0
export interface ScopeContract {
  id: string
  name: string
}

// Contract v1.1.0 (minor: new field)
export interface ScopeContract {
  id: string
  name: string
  code: string  // 🆕 New field
}

// Contract v2.0.0 (major: breaking change)
export interface ScopeContract {
  id: string
  displayName: string  // ❌ BREAKING: 'name' renamed to 'displayName'
}
```

**Adapter Compatibility:**
- Adapters must support all contract versions they claim to support
- Factory routes requests to correct adapter version

---

## 7. Adapter Implementation Pattern

### 7.1 Adapter Checklist

**Required Methods:**
- ✅ `findAll(options?)` - Get all records
- ✅ `findPaginated(options?)` - Paginated results
- ✅ `findById(id)` - Get single record
- ✅ `create(dto)` - Create record
- ✅ `update(id, dto)` - Update record
- ✅ `delete(id)` - Delete record
- ✅ `count(filters?)` - Count records

**Required Features:**
- ✅ Field name mapping (Airtable → Contract)
- ✅ Relationship resolution
- ✅ Error handling
- ✅ Type safety (TypeScript)
- ✅ Unit tests
- ✅ Contract compliance tests

### 7.2 Adapter Testing

**Test Structure:**
```typescript
// server/src/adapters/emission-management/__tests__/AirtableScopeAdapter.test.ts

import { AirtableScopeAdapter } from '../AirtableScopeAdapter'
import { ScopeContract } from '../../../contracts/emission-management/ScopeContract'

describe('AirtableScopeAdapter', () => {
  let adapter: AirtableScopeAdapter

  beforeEach(() => {
    adapter = new AirtableScopeAdapter()
  })

  describe('Contract Compliance', () => {
    it('should return ScopeContract[] from findAll', async () => {
      const scopes = await adapter.findAll()
      
      // Verify contract compliance
      scopes.forEach(scope => {
        expect(scope).toHaveProperty('id')
        expect(scope).toHaveProperty('name')
        expect(scope).toHaveProperty('code')
        expect(scope.status).toBeOneOf(['active', 'inactive', 'archived'])
      })
    })

    it('should handle pagination correctly', async () => {
      const result = await adapter.findPaginated({ limit: 10, offset: 0 })
      
      expect(result.data).toHaveLength(10)
      expect(result.total).toBeGreaterThan(0)
      expect(result.hasMore).toBeDefined()
    })
  })

  describe('Field Mapping', () => {
    it('should map Airtable fields to contract fields', async () => {
      const scope = await adapter.findById('test-id')
      
      // Verify mapping
      expect(scope?.name).toBeDefined()  // Airtable 'Name' → contract 'name'
      expect(scope?.code).toBeDefined()  // Airtable 'Code' → contract 'code'
    })
  })

  describe('Relationship Resolution', () => {
    it('should resolve parent scope relationship', async () => {
      const scope = await adapter.findById('child-scope-id')
      
      expect(scope?.parentScopeId).toBeDefined()
      expect(scope?.parentScopeName).toBeDefined()  // Resolved name
    })
  })
})
```

---

## 8. Integration with Table Creation System

### 8.1 Enhanced Table Creation Workflow

**Current System:** `TableCreationService` generates `*AirtableService.ts` files

**Enhanced System:** Generate contracts + adapters + services

**Phase 1: Contract Generation (Tier 1)**
```typescript
// TableCreationService.generateContract()
// Generates: server/src/contracts/{domain}/{Entity}Contract.ts
```

**Phase 2: Adapter Generation (Tier 2)**
```typescript
// TableCreationService.generateAdapter()
// Generates: server/src/adapters/{domain}/Airtable{Entity}Adapter.ts
```

**Phase 3: Service Generation (Tier 3)**
```typescript
// TableCreationService.generateService()
// Generates: server/src/services/{Entity}Service.ts
// Uses adapter factory, not direct Airtable
```

### 8.2 Two-Phase Table Creation Integration

**Current Flow:**
1. Generate files (service, routes, API client, config)
2. Register route
3. Await confirmation
4. Finalize (optional sidebar)

**Enhanced Flow:**
1. **Contract Generation** (Tier 1 approval)
   - Generate contract from Airtable schema
   - Tier 1 reviews and approves
2. **Adapter Generation** (Tier 2 builds)
   - Generate Airtable adapter from contract
   - Generate PostgreSQL adapter stub
   - Write tests
3. **Service Generation** (Tier 3 uses)
   - Generate service using adapter factory
   - Generate routes
   - Generate frontend API client
4. **Finalization**
   - Register route
   - Optional sidebar entry

**Code Generation Template:**
```typescript
// TableCreationService enhanced to generate contracts

async generateContract(options: TableCreationOptions, schema: TableSchema): Promise<void> {
  const contractContent = `
export interface ${options.tableName}Contract {
  id: string
  ${schema.fields.map(f => `${f.name}: ${this.mapFieldType(f.type)}`).join('\n  ')}
  createdAt: Date
  updatedAt: Date
}

export interface ${options.tableName}Adapter {
  findAll(options?: ${options.tableName}QueryOptions): Promise<${options.tableName}Contract[]>
  // ... other methods
}
  `
  
  // Write to server/src/contracts/{domain}/${options.tableName}Contract.ts
}
```

---

## 9. Migration Strategy

### 9.1 Current State → DAL Model

**Phase 1: Setup (Week 1)**
1. Create `server/src/contracts/` directory
2. Create `server/src/adapters/factories/` directory
3. Migrate existing `IDatabase` interface to contract pattern
4. Set up contract registry

**Phase 2: Pilot (Weeks 2-3)**
1. Select 2-3 tables for pilot (e.g., Scope, Unit)
2. Tier 1: Design contracts
3. Tier 2: Build adapters
4. Tier 3: Refactor services to use adapters
5. Measure time savings

**Phase 3: Scale (Weeks 4-6)**
1. Migrate all tables to contract pattern
2. Update TableCreationService to generate contracts
3. Train teams on DAL pattern
4. Enforce via code review

**Phase 4: Backend Migration (Month 2-3)**
1. Build PostgreSQL adapters in parallel
2. Gradual traffic routing (0% → 100%)
3. Monitor and verify
4. Decommission Airtable (or keep as backup)

### 9.2 Gradual Backend Migration

**Traffic Routing Configuration:**
```typescript
// .env
BACKEND_TRAFFIC_PERCENT=0  # Start at 0% (Airtable only)

// Week 5: Monday
BACKEND_TRAFFIC_PERCENT=10  # 10% to backend, 90% to Airtable

// Week 5: Tuesday
BACKEND_TRAFFIC_PERCENT=25  # 25% to backend

// Week 5: Wednesday
BACKEND_TRAFFIC_PERCENT=50  # 50% to backend

// Week 5: Thursday
BACKEND_TRAFFIC_PERCENT=75  # 75% to backend

// Week 5: Friday
BACKEND_TRAFFIC_PERCENT=100  # 100% to backend
```

**Rollback Strategy:**
```typescript
// If issues detected, instantly rollback
BACKEND_TRAFFIC_PERCENT=0  # Back to Airtable
// Zero code changes needed in product teams
```

---

## 10. Success Metrics

### 10.1 Development Velocity

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Features shipped per sprint | 3-4 | 5-6 | Sprint velocity |
| Time from prototype to ship | 4-5 weeks | 3-4 weeks | Sprint metrics |
| Adapter code reuse | 0% | 60%+ | Shared adapters / total adapters |
| Data consistency issues | 5-10/month | 0-1/month | Bug reports |

### 10.2 Migration Success

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Backend migration progress | 0% | 100% | Traffic split % |
| Migration downtime | N/A | 0 hours | Uptime monitoring |
| Rollback incidents | N/A | 0 | Incident reports |
| Product code changes for migration | 100% | 0% | Files modified |

### 10.3 Code Quality

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Direct Airtable imports | High | 0 | Linting rules |
| Contract compliance | N/A | 100% | Automated tests |
| Adapter test coverage | 0% | 80%+ | Test coverage reports |
| Type safety violations | Medium | Low | TypeScript errors |

---

## 11. Implementation Checklist

### Week 1: Governance Setup
- [ ] Assign Tier 1 Data Lead + Engineer
- [ ] Create `server/src/contracts/` directory structure
- [ ] Set up contract registry (`contracts/index.ts`)
- [ ] Define contract design process
- [ ] Create contract template
- [ ] Publish first 2-3 contracts (pilot)

### Week 2: Adapter Build
- [ ] Assign 4 Product Data Leads (1 per product line)
- [ ] Create `server/src/adapters/{product-line}/` directories
- [ ] Build adapter factories
- [ ] Implement 2-3 pilot adapters
- [ ] Write adapter tests
- [ ] Code review (Tier 1)

### Weeks 3-6: Feature Development
- [ ] Refactor services to use adapters
- [ ] Update TableCreationService to generate contracts
- [ ] Train product teams on DAL pattern
- [ ] Enforce DAL via code review
- [ ] Measure time savings

### Month 2-3: Backend Migration
- [ ] Build PostgreSQL adapters
- [ ] Set up traffic routing
- [ ] Gradual migration (0% → 100%)
- [ ] Monitor and verify
- [ ] Decommission Airtable (or keep backup)

---

## 12. Risk Mitigation

### Risk: Teams Bypass DAL Pattern

**Mitigation:**
- Linting rules: Block direct Airtable imports
- Code review: Enforce adapter usage
- Cursor AI: Enforce patterns via `.cursorrules`
- Monitoring: Alert on direct Airtable usage

### Risk: Contracts Are Wrong

**Mitigation:**
- Prototype-driven contracts (validate before building)
- Version contracts (support multiple versions)
- Breaking change process (require approval)

### Risk: Backend Not Ready

**Mitigation:**
- Adapters still work with Airtable (non-blocking)
- Parallel build (backend team works independently)
- Gradual migration (no rush)

### Risk: Performance Issues

**Mitigation:**
- Tier 1 owns optimization (not product teams)
- Adapter performance tests
- Caching strategies in adapters

---

## 13. Cursor AI Integration

### 13.1 Contract Generation

**Prompt Template:**
```
Generate a data contract for {Entity} based on this Airtable schema:
{schema}

Follow the contract template in server/src/contracts/_template.ts
```

**Time Savings:** 6 hours/sprint

### 13.2 Adapter Generation

**Prompt Template:**
```
Generate an Airtable adapter for {Entity}Contract.
Implement all methods from the contract interface.
Use RelationshipResolver for relationship resolution.
```

**Time Savings:** 9 hours/sprint

### 13.3 Service Refactoring

**Prompt Template:**
```
Refactor {Entity}Service to use {Entity}Adapter instead of direct Airtable access.
Use {ProductLine}Factory.get{Entity}Adapter() to get the adapter.
```

**Time Savings:** 8 hours/sprint

### 13.4 Test Generation

**Prompt Template:**
```
Generate contract compliance tests for {Entity}Adapter.
Test all methods, field mapping, and relationship resolution.
```

**Time Savings:** 7 hours/sprint

**Total Time Savings:** 30 hours/sprint = 0.75 FTE

---

## 14. Next Steps

### This Week
1. Leadership review + decision
2. Appoint Tier 1 Data Lead
3. Publish this plan to product team

### Next Week
1. Tier 1 + Tier 2 Data Leads alignment meeting
2. Contract design workshop
3. Cursor setup + `.cursorrules` configuration

### Week 3
1. Build first pilot adapters
2. Validate prototype → contract → adapter flow
3. Present results to leadership

### Month 2
1. Scale to all 4 product lines
2. Begin backend parallel build
3. Monitor metrics

### Month 3
1. Begin gradual backend migration
2. Full team adoption of DAL model
3. Measure success vs. targets

---

## Appendix A: File Structure Reference

```
server/src/
├── contracts/                          # Tier 1: Data Contracts
│   ├── index.ts                        # Contract registry
│   ├── _template.ts                    # Contract template
│   ├── emission-management/
│   │   ├── ScopeContract.ts
│   │   └── EmissionFactorContract.ts
│   └── reference-data/
│       └── UnitContract.ts
│
├── adapters/                           # Tier 2: Adapters
│   ├── factories/
│   │   ├── AdapterFactory.ts           # Central factory
│   │   ├── EmissionManagementFactory.ts
│   │   └── ReferenceDataFactory.ts
│   ├── emission-management/
│   │   ├── AirtableScopeAdapter.ts
│   │   ├── PostgresScopeAdapter.ts
│   │   └── __tests__/
│   └── reference-data/
│       └── UnitAdapter.ts
│
├── services/                           # Tier 3: Services (refactored)
│   ├── ScopeService.ts                 # Uses adapter
│   └── UnitService.ts                  # Uses adapter
│
└── routes/                             # Unchanged
    └── *.ts

src/lib/api/                            # Frontend API clients (unchanged)
    └── *.ts

src/app/spaces/                         # Feature pages (unchanged)
    └── {product-line}/
        └── {feature}/
```

---

## Appendix B: Contract Template

See `server/src/contracts/_template.ts` for the full contract template.

---

## Appendix C: Adapter Template

See `server/src/adapters/_template.ts` for the full adapter template.

---

**Document Status:** ✅ Ready for Review  
**Next Review:** After 6-week pilot  
**Questions?** Contact: [Tier 1 Data Lead]

