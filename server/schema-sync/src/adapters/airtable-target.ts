/**
 * Airtable Target Adapter
 * 
 * Applies schema changes to Airtable
 */

import { TargetSchemaApplier } from '../core/adapters';
import { LogicalSchema, LogicalField, ChangePlan, ChangeOperation } from '../core/types';
import fetch from 'node-fetch';

export interface AirtableTargetConfig {
  apiKey: string;
  baseId: string;
  table?: string;
}

export class AirtableTarget implements TargetSchemaApplier {
  private config: AirtableTargetConfig;

  constructor(config: AirtableTargetConfig) {
    this.config = config;
  }

  getKind(): string {
    return 'airtable';
  }

  async getCurrentSchema(tableName?: string): Promise<LogicalSchema> {
    // Reuse AirtableSource to read current schema
    const { AirtableSource } = await import('./airtable-source');
    const source = new AirtableSource({
      apiKey: this.config.apiKey,
      baseId: this.config.baseId,
      table: tableName || this.config.table
    });
    return source.getSchema(tableName || this.config.table);
  }

  async applyPlan(
    plan: ChangePlan,
    options: { dryRun?: boolean; allowBreaking?: boolean } = {}
  ): Promise<{ applied: boolean; changes: string[]; errors: string[] }> {
    const { dryRun = true, allowBreaking = false } = options;
    const changes: string[] = [];
    const errors: string[] = [];

    if (dryRun) {
      // Just report what would be done
      for (const op of plan.operations) {
        if (op.type === 'add') {
          changes.push(`Would add field: ${op.field.name} (${op.field.logicalType.kind})`);
        } else if (op.type === 'modify') {
          changes.push(`Would modify field: ${op.field.name}`);
        } else if (op.type === 'remove') {
          changes.push(`Would remove field: ${op.fieldName} (requires --allow-breaking)`);
        }
      }
      return { applied: false, changes, errors };
    }

    // Apply changes via Airtable Metadata API
    const tableName = plan.tableName;
    const metadataUrl = `https://api.airtable.com/v0/meta/bases/${this.config.baseId}/tables`;

    try {
      // Get current table schema
      const response = await fetch(metadataUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch table schema: ${response.statusText}`);
      }

      const data = await response.json() as { tables: Array<{ id: string; name: string; fields: any[] }> };
      const table = data.tables.find((t: any) => t.name === tableName);

      if (!table) {
        throw new Error(`Table '${tableName}' not found`);
      }

      // Apply operations
      for (const op of plan.operations) {
        try {
          if (op.type === 'add') {
            await this.addField(table.id, op.field);
            changes.push(`Added field: ${op.field.name}`);
          } else if (op.type === 'modify') {
            await this.modifyField(table.id, op.field, op.previous);
            changes.push(`Modified field: ${op.field.name}`);
          } else if (op.type === 'remove') {
            if (!allowBreaking) {
              errors.push(`Cannot remove field ${op.fieldName} without --allow-breaking`);
              continue;
            }
            await this.removeField(table.id, op.fieldName, op.previous);
            changes.push(`Removed field: ${op.fieldName}`);
          }
        } catch (error: any) {
          errors.push(`Failed to ${op.type} field ${op.type === 'remove' ? op.fieldName : op.field.name}: ${error.message}`);
        }
      }

      return { applied: true, changes, errors };
    } catch (error: any) {
      errors.push(`Failed to apply plan: ${error.message}`);
      return { applied: false, changes, errors };
    }
  }

  /**
   * Add a field to an Airtable table
   */
  private async addField(tableId: string, field: LogicalField): Promise<void> {
    const airtableField = this.mapLogicalToAirtableField(field);
    
    const url = `https://api.airtable.com/v0/meta/bases/${this.config.baseId}/tables/${tableId}/fields`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableField)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add field: ${error}`);
    }
  }

  /**
   * Modify a field in an Airtable table
   */
  private async modifyField(
    tableId: string,
    field: LogicalField,
    previous: LogicalField
  ): Promise<void> {
    // Get field ID from previous metadata
    const fieldId = previous.metadata?.airtableId;
    if (!fieldId) {
      throw new Error(`Cannot modify field: missing Airtable field ID`);
    }

    const airtableField = this.mapLogicalToAirtableField(field);
    
    const url = `https://api.airtable.com/v0/meta/bases/${this.config.baseId}/tables/${tableId}/fields/${fieldId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(airtableField)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to modify field: ${error}`);
    }
  }

  /**
   * Remove a field from an Airtable table
   */
  private async removeField(
    tableId: string,
    fieldName: string,
    previous: LogicalField
  ): Promise<void> {
    const fieldId = previous.metadata?.airtableId;
    if (!fieldId) {
      throw new Error(`Cannot remove field: missing Airtable field ID`);
    }

    const url = `https://api.airtable.com/v0/meta/bases/${this.config.baseId}/tables/${tableId}/fields/${fieldId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to remove field: ${error}`);
    }
  }

  /**
   * Map logical field to Airtable field definition
   */
  private mapLogicalToAirtableField(field: LogicalField): any {
    const baseField: any = {
      name: field.name,
      description: field.description || undefined
    };

    const type = field.logicalType;

    switch (type.kind) {
      case 'string':
        if (type.format === 'email') {
          baseField.type = 'email';
        } else if (type.format === 'url') {
          baseField.type = 'url';
        } else if (type.format === 'phone') {
          baseField.type = 'phoneNumber';
        } else if (type.format === 'richtext') {
          baseField.type = 'richText';
        } else {
          baseField.type = 'singleLineText';
          if (type.maxLength) {
            baseField.options = { maxLength: type.maxLength };
          }
        }
        break;

      case 'number':
        baseField.type = 'number';
        baseField.options = {
          precision: type.precision || 10,
          // Airtable precision includes scale
        };
        break;

      case 'boolean':
        baseField.type = 'checkbox';
        break;

      case 'date':
        if (type.format === 'datetime') {
          baseField.type = 'dateTime';
          baseField.options = {
            timeZone: type.timezone === 'utc' ? 'utc' : 'user'
          };
        } else {
          baseField.type = 'date';
        }
        break;

      case 'enum':
        if (type.multi) {
          baseField.type = 'multipleSelects';
        } else {
          baseField.type = 'singleSelect';
        }
        baseField.options = {
          choices: type.options.map(name => ({ name, color: 'blueLight2' }))
        };
        break;

      case 'attachment':
        baseField.type = 'multipleAttachments';
        break;

      case 'foreign_key':
        baseField.type = 'multipleRecordLinks';
        baseField.options = {
          linkedTableId: type.refTable // Note: This should be table ID, not name
        };
        break;

      case 'computed':
        // Computed fields cannot be created via API in most cases
        throw new Error('Cannot create computed fields via Airtable API');

      case 'json':
      case 'array':
        // Airtable doesn't have native JSON/array types - map to long text
        baseField.type = 'multilineText';
        break;

      default:
        throw new Error(`Unsupported logical type: ${(type as any).kind}`);
    }

    // Set required flag
    if (field.nullable === false) {
      baseField.options = baseField.options || {};
      baseField.options.isRequired = true;
    }

    return baseField;
  }
}

