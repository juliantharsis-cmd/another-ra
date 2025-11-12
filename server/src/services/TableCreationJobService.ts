/**
 * Table Creation Job Service
 * 
 * Manages background jobs for table creation
 */

import { randomUUID } from 'crypto'

export interface TableCreationJob {
  id: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  progress: number
  currentStep?: string
  error?: string
  result?: {
    tableName: string
    tablePath: string
    filesCreated?: {
      service: boolean
      api: boolean
      route: boolean
      config: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface CreateTableRequest {
  source: 'airtable'
  baseId: string
  tableId: string
  tableName?: string // Optional: table name from frontend
  targetSection?: string
}

export class TableCreationJobService {
  private static instance: TableCreationJobService | null = null
  private jobs: Map<string, TableCreationJob> = new Map()

  /**
   * Get singleton instance to ensure jobs persist across service recreations
   */
  static getInstance(): TableCreationJobService {
    if (!TableCreationJobService.instance) {
      TableCreationJobService.instance = new TableCreationJobService()
    }
    return TableCreationJobService.instance
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Private constructor
  }

  /**
   * Create a new job
   */
  async createJob(request: CreateTableRequest): Promise<TableCreationJob> {
    const job: TableCreationJob = {
      id: randomUUID(),
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.jobs.set(job.id, job)

    // Clean up old jobs (older than 24 hours)
    this.cleanupOldJobs()

    return job
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<TableCreationJob | null> {
    return this.jobs.get(jobId) || null
  }

  /**
   * Update job
   */
  updateJob(jobId: string, updates: Partial<TableCreationJob>): void {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    const updatedJob: TableCreationJob = {
      ...job,
      ...updates,
      updatedAt: new Date(),
    }

    this.jobs.set(jobId, updatedJob)
  }

  /**
   * Clean up old jobs (older than 24 hours)
   */
  private cleanupOldJobs(): void {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.updatedAt < twentyFourHoursAgo && (job.status === 'completed' || job.status === 'failed')) {
        this.jobs.delete(jobId)
      }
    }
  }

  /**
   * Get all jobs (for debugging/admin)
   */
  getAllJobs(): TableCreationJob[] {
    return Array.from(this.jobs.values())
  }
}

