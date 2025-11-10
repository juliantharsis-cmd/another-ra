/**
 * Airtable Source Adapter
 * 
 * Reads schema from Airtable and converts to logical schema
 */

import { SourceSchemaProvider } from '../core/adapters';
import { LogicalSchema, LogicalField, LogicalType } from '../core/types';
import Airtable from 'airtable';

export interface AirtableSourceConfig {
  apiKey: string;
  baseId: string;
  table?: string;
}

export class AirtableSource implements SourceSchemaProvider {
  private base: Airtable.Base;
  private config: AirtableSourceConfig;

  constructor(config: AirtableSourceConfig) {
    Airtable.configure({ apiKey: config.apiKey });
    this.base = Airtable.base(config.baseId);
    this.config = config;
  }

  getKind(): string {
    return 'airtable';
  }

  async getSchema(tableName?: string): Promise<LogicalSchema> {
    const targetTable = tableName || this.config.table;
    if (!targetTable) {
      throw new Error('Table name must be provided either in config or as parameter');
    }

    // Use Airtable Metadata API to get schema
    const metadataUrl = `https://api.airtable.com/v0/meta/bases/${this.config.baseId}/tables`;
    const response = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Airtable schema: ${response.statusText}`);
    }

    const data = await response.json() as { tables: Array<{ name: string; fields: any[] }> };
    const table = data.tables.find((t: any) => t.name === targetTable);
    
    if (!table) {
      throw new Error(`Table '${targetTable}' not found in base`);
    }

    const fields: LogicalField[] = table.fields.map((field: any) => 
      this.mapAirtableFieldToLogical(field)
    );

    return {
      tableName: targetTable,
      fields
    };
  }

  /**
   * Map Airtable field type to logical type
   */
  private mapAirtableFieldToLogical(field: any): LogicalField {
    const logicalType = this.mapAirtableTypeToLogical(field.type, field.options);
    
    return {
      name: field.name,
      logicalType,
      nullable: !field.options?.isRequired,
      description: field.description || undefined,
      metadata: {
        airtableId: field.id,
        airtableType: field.type
      }
    };
  }

  /**
   * Map Airtable field type to LogicalType
   */
  private mapAirtableTypeToLogical(airtableType: string, options?: any): LogicalType {
    switch (airtableType) {
      case 'singleLineText':
        return {
          kind: 'string',
          maxLength: options?.maxLength
        };

      case 'multilineText':
      case 'richText':
        return {
          kind: 'string',
          format: 'richtext'
        };

      case 'email':
        return {
          kind: 'string',
          format: 'email'
        };

      case 'url':
        return {
          kind: 'string',
          format: 'url'
        };

      case 'phoneNumber':
        return {
          kind: 'string',
          format: 'phone'
        };

      case 'number':
        const precision = options?.precision || 10;
        const scale = this.inferScale(options);
        return {
          kind: 'number',
          precision,
          scale,
          signed: true
        };

      case 'percent':
        return {
          kind: 'number',
          precision: options?.precision || 10,
          scale: 2,
          signed: false
        };

      case 'currency':
        return {
          kind: 'number',
          precision: options?.precision || 10,
          scale: 2,
          signed: true,
          metadata: {
            currency: options?.symbol || 'USD'
          }
        } as any; // Type assertion needed due to metadata in NumberType

      case 'rating':
        return {
          kind: 'number',
          precision: 10,
          scale: 0,
          signed: false,
          metadata: {
            max: options?.max || 5
          }
        } as any;

      case 'checkbox':
        return {
          kind: 'boolean'
        };

      case 'date':
        return {
          kind: 'date',
          format: 'date',
          timezone: 'naive'
        };

      case 'dateTime':
        return {
          kind: 'date',
          format: 'datetime',
          timezone: options?.timeZone === 'utc' ? 'utc' : 'naive'
        };

      case 'singleSelect':
        return {
          kind: 'enum',
          options: options?.choices?.map((c: any) => c.name) || [],
          multi: false
        };

      case 'multipleSelects':
        return {
          kind: 'enum',
          options: options?.choices?.map((c: any) => c.name) || [],
          multi: true
        };

      case 'multipleAttachments':
        return {
          kind: 'attachment',
          multiple: true
        };

      case 'multipleRecordLinks':
        return {
          kind: 'foreign_key',
          refTable: options?.linkedTableId || options?.linkedTableName || 'Unknown',
          cardinality: 'many'
        };

      case 'formula':
      case 'rollup':
      case 'lookup':
        // Best-effort inference of source type
        const sourceType = this.inferComputedSourceType(options);
        return {
          kind: 'computed',
          expression: options?.formula || undefined,
          sourceType,
          readOnly: true
        };

      case 'createdTime':
        return {
          kind: 'computed',
          sourceType: { kind: 'date', format: 'datetime', timezone: 'utc' },
          readOnly: true
        };

      case 'createdBy':
      case 'lastModifiedBy':
        return {
          kind: 'computed',
          sourceType: { kind: 'string' },
          readOnly: true
        };

      case 'lastModifiedTime':
        return {
          kind: 'computed',
          sourceType: { kind: 'date', format: 'datetime', timezone: 'utc' },
          readOnly: true
        };

      case 'barcode':
      case 'button':
      case 'count':
      case 'duration':
      case 'externalSyncSource':
      case 'multipleCollaborators':
      case 'aiText':
        // Fallback to string for unknown types
        return {
          kind: 'string'
        };

      default:
        console.warn(`Unknown Airtable field type: ${airtableType}, mapping to string`);
        return {
          kind: 'string'
        };
    }
  }

  /**
   * Infer scale from Airtable number options
   */
  private inferScale(options?: any): number {
    if (options?.precision) {
      // Airtable precision includes decimal places
      // We'll use a heuristic: if precision > 10, assume 2 decimal places
      return 2;
    }
    return 0; // Default to integer
  }

  /**
   * Infer source type for computed fields
   */
  private inferComputedSourceType(options?: any): LogicalType | undefined {
    // This is best-effort - Airtable doesn't always expose the return type
    if (options?.result) {
      const resultType = options.result;
      if (resultType === 'number') {
        return { kind: 'number' };
      }
      if (resultType === 'date') {
        return { kind: 'date', format: 'datetime' };
      }
      if (resultType === 'text') {
        return { kind: 'string' };
      }
    }
    return undefined;
  }
}

