/**
 * Unit tests for schema diff engine
 */

import { compareSchemas } from '../../src/core/diff';
import { LogicalSchema, LogicalField } from '../../src/core/types';

describe('compareSchemas', () => {
  it('should detect no changes when schemas are identical', () => {
    const source: LogicalSchema = {
      tableName: 'test',
      fields: [
        {
          name: 'name',
          logicalType: { kind: 'string' }
        }
      ]
    };

    const target: LogicalSchema = {
      tableName: 'test',
      fields: [
        {
          name: 'name',
          logicalType: { kind: 'string' }
        }
      ]
    };

    const plan = compareSchemas(source, target);
    expect(plan.operations.filter(op => op.type !== 'no_change')).toHaveLength(0);
    expect(plan.breaking).toBe(false);
  });

  it('should detect field additions', () => {
    const source: LogicalSchema = {
      tableName: 'test',
      fields: [
        { name: 'name', logicalType: { kind: 'string' } },
        { name: 'age', logicalType: { kind: 'number' } }
      ]
    };

    const target: LogicalSchema = {
      tableName: 'test',
      fields: [
        { name: 'name', logicalType: { kind: 'string' } }
      ]
    };

    const plan = compareSchemas(source, target);
    const adds = plan.operations.filter(op => op.type === 'add');
    expect(adds).toHaveLength(1);
    expect(adds[0].type === 'add' && adds[0].field.name).toBe('age');
  });

  it('should detect field removals as breaking', () => {
    const source: LogicalSchema = {
      tableName: 'test',
      fields: [
        { name: 'name', logicalType: { kind: 'string' } }
      ]
    };

    const target: LogicalSchema = {
      tableName: 'test',
      fields: [
        { name: 'name', logicalType: { kind: 'string' } },
        { name: 'old_field', logicalType: { kind: 'string' } }
      ]
    };

    const plan = compareSchemas(source, target, { allowBreaking: false });
    const removes = plan.operations.filter(op => op.type === 'remove');
    expect(removes).toHaveLength(0); // Should be skipped without allowBreaking
    expect(plan.warnings.length).toBeGreaterThan(0);
  });

  it('should detect precision reduction as breaking', () => {
    const source: LogicalSchema = {
      tableName: 'test',
      fields: [
        {
          name: 'value',
          logicalType: { kind: 'number', precision: 5, scale: 2 }
        }
      ]
    };

    const target: LogicalSchema = {
      tableName: 'test',
      fields: [
        {
          name: 'value',
          logicalType: { kind: 'number', precision: 10, scale: 2 }
        }
      ]
    };

    const plan = compareSchemas(source, target, { allowBreaking: false });
    const modifies = plan.operations.filter(op => op.type === 'modify');
    expect(modifies.length).toBeGreaterThan(0);
    expect(plan.breaking).toBe(true);
  });
});

