/**
 * Adapter Interfaces
 * 
 * Defines interfaces for source providers and target appliers
 */

import { LogicalSchema, ChangePlan } from './types';

/**
 * SourceSchemaProvider reads schema from a data source
 */
export interface SourceSchemaProvider {
  /**
   * Get the logical schema from the source
   */
  getSchema(tableName?: string): Promise<LogicalSchema>;

  /**
   * Get the kind/type of this provider (e.g., 'airtable', 'postgres', 'json')
   */
  getKind(): string;
}

/**
 * TargetSchemaApplier applies schema changes to a target
 */
export interface TargetSchemaApplier {
  /**
   * Get the current schema from the target
   */
  getCurrentSchema(tableName?: string): Promise<LogicalSchema>;

  /**
   * Apply a change plan to the target
   */
  applyPlan(plan: ChangePlan, options: {
    dryRun?: boolean;
    allowBreaking?: boolean;
  }): Promise<{
    applied: boolean;
    changes: string[];
    errors: string[];
  }>;

  /**
   * Get the kind/type of this applier (e.g., 'airtable', 'postgres', 'plan-only')
   */
  getKind(): string;
}

