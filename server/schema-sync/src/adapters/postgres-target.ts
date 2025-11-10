/**
 * PostgreSQL Target Adapter
 * 
 * Applies schema changes to PostgreSQL
 */

import { TargetSchemaApplier } from '../core/adapters';
import { LogicalSchema, LogicalField, ChangePlan, ChangeOperation, LogicalType } from '../core/types';
import { Client } from 'pg';

export interface PostgresTargetConfig {
  connection: string; // DSN or connection string
  table?: string;
  options?: {
    enumStrategy?: 'pg-enum' | 'text-check' | 'text';
    timezoneStrategy?: 'utc' | 'naive' | 'preserve';
    defaultNumberType?: string;
  };
}

export class PostgresTarget implements TargetSchemaApplier {
  private config: PostgresTargetConfig;
  private client: Client | null = null;

  constructor(config: PostgresTargetConfig) {
    this.config = config;
  }

  getKind(): string {
    return 'postgres';
  }

  private async getClient(): Promise<Client> {
    if (!this.client) {
      this.client = new Client({ connectionString: this.config.connection });
      await this.client.connect();
    }
    return this.client;
  }

  async getCurrentSchema(tableName?: string): Promise<LogicalSchema> {
    const targetTable = tableName || this.config.table;
    if (!targetTable) {
      throw new Error('Table name must be provided');
    }

    const client = await this.getClient();

    // Query PostgreSQL information_schema to get current schema
    const query = `
      SELECT 
        column_name,
        data_type,
        udt_name,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        (SELECT enumlabel FROM pg_enum WHERE enumtypid = t.udt_name::regtype ORDER BY enumsortorder) as enum_values
      FROM information_schema.columns c
      LEFT JOIN pg_type t ON t.typname = c.udt_name
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;

    const result = await client.query(query, [targetTable]);
    
    const fields: LogicalField[] = result.rows.map(row => 
      this.mapPostgresColumnToLogical(row)
    );

    return {
      tableName: targetTable,
      fields
    };
  }

  async applyPlan(
    plan: ChangePlan,
    options: { dryRun?: boolean; allowBreaking?: boolean } = {}
  ): Promise<{ applied: boolean; changes: string[]; errors: string[] }> {
    const { dryRun = true, allowBreaking = false } = options;
    const changes: string[] = [];
    const errors: string[] = [];

    if (dryRun) {
      // Generate SQL statements
      for (const op of plan.operations) {
        const sql = this.generateSQL(plan.tableName, op, allowBreaking);
        if (sql) {
          changes.push(sql);
        }
      }
      return { applied: false, changes, errors };
    }

    // Apply changes
    const client = await this.getClient();

    try {
      await client.query('BEGIN');

      for (const op of plan.operations) {
        try {
          const sql = this.generateSQL(plan.tableName, op, allowBreaking);
          if (sql) {
            await client.query(sql);
            changes.push(`Applied: ${sql}`);
          }
        } catch (error: any) {
          errors.push(`Failed to apply ${op.type}: ${error.message}`);
          if (!allowBreaking) {
            throw error; // Rollback on error
          }
        }
      }

      await client.query('COMMIT');
      return { applied: true, changes, errors };
    } catch (error: any) {
      await client.query('ROLLBACK');
      errors.push(`Transaction failed: ${error.message}`);
      return { applied: false, changes, errors };
    }
  }

  /**
   * Generate SQL for a change operation
   */
  private generateSQL(
    tableName: string,
    operation: ChangeOperation,
    allowBreaking: boolean
  ): string | null {
    switch (operation.type) {
      case 'add':
        return this.generateAddColumnSQL(tableName, operation.field);
      
      case 'modify':
        return this.generateModifyColumnSQL(tableName, operation.field, operation.previous, allowBreaking);
      
      case 'remove':
        if (!allowBreaking) {
          return null; // Skip removal without --allow-breaking
        }
        return `ALTER TABLE "${tableName}" DROP COLUMN "${operation.fieldName}";`;
      
      case 'no_change':
        return null;
    }
  }

  /**
   * Generate SQL for adding a column
   */
  private generateAddColumnSQL(tableName: string, field: LogicalField): string {
    const typeDef = this.mapLogicalTypeToPostgres(field.logicalType);
    const nullable = field.nullable !== false ? '' : 'NOT NULL';
    const defaultValue = field.defaultValue !== undefined 
      ? `DEFAULT ${this.formatDefaultValue(field.defaultValue, field.logicalType)}`
      : '';
    
    return `ALTER TABLE "${tableName}" ADD COLUMN "${field.name}" ${typeDef} ${nullable} ${defaultValue};`.trim();
  }

  /**
   * Generate SQL for modifying a column
   */
  private generateModifyColumnSQL(
    tableName: string,
    field: LogicalField,
    previous: LogicalField,
    allowBreaking: boolean
  ): string {
    const typeDef = this.mapLogicalTypeToPostgres(field.logicalType);
    const statements: string[] = [];

    // Type change
    if (!this.typesEqual(field.logicalType, previous.logicalType)) {
      if (allowBreaking) {
        statements.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" TYPE ${typeDef} USING "${field.name}"::${typeDef};`);
      } else {
        // Only allow widening changes
        statements.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" TYPE ${typeDef};`);
      }
    }

    // Nullable change
    const wasNullable = previous.nullable !== false;
    const isNullable = field.nullable !== false;
    if (wasNullable && !isNullable) {
      if (allowBreaking) {
        statements.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" SET NOT NULL;`);
      }
    } else if (!wasNullable && isNullable) {
      statements.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" DROP NOT NULL;`);
    }

    // Default value change
    if (field.defaultValue !== previous.defaultValue) {
      if (field.defaultValue !== undefined) {
        statements.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" SET DEFAULT ${this.formatDefaultValue(field.defaultValue, field.logicalType)};`);
      } else {
        statements.push(`ALTER TABLE "${tableName}" ALTER COLUMN "${field.name}" DROP DEFAULT;`);
      }
    }

    return statements.join('\n');
  }

  /**
   * Map logical type to PostgreSQL type definition
   */
  private mapLogicalTypeToPostgres(type: LogicalType): string {
    const strategy = this.config.options?.enumStrategy || 'text-check';
    const timezoneStrategy = this.config.options?.timezoneStrategy || 'preserve';
    const defaultNumberType = this.config.options?.defaultNumberType || 'DOUBLE PRECISION';

    switch (type.kind) {
      case 'string':
        if (type.maxLength) {
          return `VARCHAR(${type.maxLength})`;
        }
        return 'TEXT';

      case 'number':
        if (type.precision && type.scale !== undefined) {
          return `NUMERIC(${type.precision}, ${type.scale})`;
        }
        return defaultNumberType;

      case 'boolean':
        return 'BOOLEAN';

      case 'date':
        if (type.format === 'datetime') {
          if (type.timezone === 'utc' || (timezoneStrategy === 'utc' && type.timezone !== 'naive')) {
            return 'TIMESTAMP WITH TIME ZONE';
          }
          return 'TIMESTAMP';
        }
        return 'DATE';

      case 'enum':
        if (strategy === 'pg-enum' && !type.multi) {
          // Would need to create ENUM type first
          const enumName = `enum_${type.options.join('_').toLowerCase().replace(/[^a-z0-9_]/g, '_')}`;
          return enumName;
        } else if (strategy === 'text-check' && !type.multi) {
          // Use TEXT with CHECK constraint (would be added separately)
          return 'TEXT';
        } else {
          // Multi-enum or text strategy
          return type.multi ? 'TEXT[]' : 'TEXT';
        }

      case 'json':
        return 'JSONB';

      case 'array':
        const itemType = this.mapLogicalTypeToPostgres(type.items);
        return `${itemType}[]`;

      case 'foreign_key':
        const refField = type.refField || 'id';
        return `INTEGER REFERENCES "${type.refTable}"("${refField}")`;

      case 'attachment':
        return 'JSONB'; // Store as JSONB array

      case 'computed':
        // Would need GENERATED ALWAYS AS or view
        return 'TEXT'; // Fallback

      default:
        return 'TEXT';
    }
  }

  /**
   * Map PostgreSQL column to logical field
   */
  private mapPostgresColumnToLogical(row: any): LogicalField {
    const logicalType = this.mapPostgresTypeToLogical(row);
    
    return {
      name: row.column_name,
      logicalType,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default || undefined,
      metadata: {
        postgresType: row.data_type,
        udtName: row.udt_name
      }
    };
  }

  /**
   * Map PostgreSQL type to logical type
   */
  private mapPostgresTypeToLogical(row: any): LogicalType {
    const dataType = row.data_type;
    const udtName = row.udt_name;

    if (dataType === 'character varying' || dataType === 'text') {
      return {
        kind: 'string',
        maxLength: row.character_maximum_length || undefined
      };
    }

    if (dataType === 'numeric') {
      return {
        kind: 'number',
        precision: row.numeric_precision || undefined,
        scale: row.numeric_scale || undefined
      };
    }

    if (dataType === 'double precision' || dataType === 'real' || dataType === 'integer' || dataType === 'bigint') {
      return {
        kind: 'number',
        precision: 10,
        scale: 0
      };
    }

    if (dataType === 'boolean') {
      return { kind: 'boolean' };
    }

    if (dataType === 'date') {
      return {
        kind: 'date',
        format: 'date',
        timezone: 'naive'
      };
    }

    if (dataType === 'timestamp without time zone' || dataType === 'timestamp with time zone') {
      return {
        kind: 'date',
        format: 'datetime',
        timezone: dataType.includes('time zone') ? 'utc' : 'naive'
      };
    }

    if (dataType === 'ARRAY') {
      // Would need to parse array element type
      return {
        kind: 'array',
        items: { kind: 'string' } // Default fallback
      };
    }

    if (dataType === 'json' || dataType === 'jsonb') {
      return { kind: 'json' };
    }

    // Enum type
    if (row.enum_values && row.enum_values.length > 0) {
      return {
        kind: 'enum',
        options: row.enum_values,
        multi: false
      };
    }

    // Default fallback
    return { kind: 'string' };
  }

  /**
   * Format default value for SQL
   */
  private formatDefaultValue(value: any, type: LogicalType): string {
    if (type.kind === 'string') {
      return `'${value.toString().replace(/'/g, "''")}'`;
    }
    if (type.kind === 'number' || type.kind === 'boolean') {
      return value.toString();
    }
    if (type.kind === 'date') {
      return `'${value}'::timestamp`;
    }
    return `'${value}'`;
  }

  /**
   * Check if two types are equal (simplified)
   */
  private typesEqual(type1: LogicalType, type2: LogicalType): boolean {
    return JSON.stringify(type1) === JSON.stringify(type2);
  }

  /**
   * Cleanup database connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}

