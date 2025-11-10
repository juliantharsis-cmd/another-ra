/**
 * Schema Diff Engine
 * 
 * Compares two logical schemas and generates a change plan
 */

import { 
  LogicalSchema, 
  LogicalField, 
  ChangePlan, 
  ChangeOperation, 
  SafetyLevel,
  LogicalType,
  StringType,
  NumberType,
  DateType,
  EnumType,
  ArrayType,
  ForeignKeyType,
  AttachmentType,
  ComputedType
} from './types';

/**
 * Compare two logical schemas and generate a change plan
 */
export function compareSchemas(
  source: LogicalSchema,
  target: LogicalSchema,
  options: {
    includeComputed?: boolean;
    allowBreaking?: boolean;
  } = {}
): ChangePlan {
  const { includeComputed = false, allowBreaking = false } = options;
  
  const operations: ChangeOperation[] = [];
  const warnings: string[] = [];
  let breaking = false;

  // Create maps for efficient lookup
  const sourceFields = new Map<string, LogicalField>();
  const targetFields = new Map<string, LogicalField>();

  source.fields.forEach(field => {
    if (!includeComputed && field.logicalType.kind === 'computed') {
      return; // Skip computed fields if not included
    }
    sourceFields.set(field.name, field);
  });

  target.fields.forEach(field => {
    if (!includeComputed && field.logicalType.kind === 'computed') {
      return;
    }
    targetFields.set(field.name, field);
  });

  // Find fields to add (in source but not in target)
  for (const [name, field] of sourceFields) {
    if (!targetFields.has(name)) {
      operations.push({ type: 'add', field });
    }
  }

  // Find fields to modify or remove
  for (const [name, targetField] of targetFields) {
    const sourceField = sourceFields.get(name);
    
    if (!sourceField) {
      // Field exists in target but not in source - mark for removal
      const safety = assessChangeSafety(
        { type: 'remove', fieldName: name, previous: targetField },
        null
      );
      
      if (safety === 'breaking' && !allowBreaking) {
        warnings.push(`Skipping removal of field '${name}' (requires --allow-breaking)`);
      } else {
        operations.push({ type: 'remove', fieldName: name, previous: targetField });
        if (safety === 'breaking') breaking = true;
      }
    } else {
      // Field exists in both - check if modification is needed
      if (!fieldsEqual(sourceField, targetField)) {
        const safety = assessChangeSafety(
          { type: 'modify', field: sourceField, previous: targetField },
          sourceField
        );
        
        if (safety === 'breaking' && !allowBreaking) {
          warnings.push(`Skipping modification of field '${name}' (requires --allow-breaking)`);
        } else {
          operations.push({ type: 'modify', field: sourceField, previous: targetField });
          if (safety === 'breaking') breaking = true;
        }
      } else {
        operations.push({ type: 'no_change', field: sourceField });
      }
    }
  }

  return {
    tableName: target.tableName,
    operations,
    breaking,
    warnings
  };
}

/**
 * Check if two fields are semantically equal
 */
function fieldsEqual(field1: LogicalField, field2: LogicalField): boolean {
  // Compare names (case-insensitive for logical comparison)
  if (field1.name.toLowerCase() !== field2.name.toLowerCase()) {
    return false;
  }

  // Compare types
  if (!typesEqual(field1.logicalType, field2.logicalType)) {
    return false;
  }

  // Compare nullable (default to true if not specified)
  const nullable1 = field1.nullable !== false;
  const nullable2 = field2.nullable !== false;
  if (nullable1 !== nullable2) {
    return false;
  }

  // Compare default values (loose equality for practical purposes)
  if (field1.defaultValue !== field2.defaultValue) {
    return false;
  }

  // Note: We don't compare description or metadata as they're less critical
  return true;
}

/**
 * Check if two logical types are equal
 */
function typesEqual(type1: LogicalType, type2: LogicalType): boolean {
  if (type1.kind !== type2.kind) {
    return false;
  }

  switch (type1.kind) {
    case 'string':
      const str2 = type2 as StringType;
      return (
        type1.maxLength === str2.maxLength &&
        type1.format === str2.format
      );
    
    case 'number':
      const num2 = type2 as NumberType;
      return (
        type1.precision === num2.precision &&
        type1.scale === num2.scale &&
        (type1.signed ?? true) === (num2.signed ?? true)
      );
    
    case 'boolean':
      return true;
    
    case 'date':
      const date2 = type2 as DateType;
      return (
        type1.timezone === date2.timezone &&
        type1.format === date2.format
      );
    
    case 'enum':
      const enum2 = type2 as EnumType;
      if (type1.options.length !== enum2.options.length) {
        return false;
      }
      if (type1.multi !== enum2.multi) {
        return false;
      }
      // Compare options (order matters for enums)
      return type1.options.every((opt, i) => opt === enum2.options[i]);
    
    case 'json':
      return true;
    
    case 'array':
      const arr2 = type2 as ArrayType;
      return typesEqual(type1.items, arr2.items);
    
    case 'foreign_key':
      const fk2 = type2 as ForeignKeyType;
      return (
        type1.refTable === fk2.refTable &&
        type1.refField === fk2.refField &&
        type1.cardinality === fk2.cardinality
      );
    
    case 'attachment':
      const att2 = type2 as AttachmentType;
      return (
        (type1.multiple ?? false) === (att2.multiple ?? false)
        // Note: constraints comparison omitted for simplicity
      );
    
    case 'computed':
      // Computed fields are compared by expression if available
      const comp2 = type2 as ComputedType;
      return type1.expression === comp2.expression;
    
    default:
      return false;
  }
}

/**
 * Assess the safety level of a change operation
 */
function assessChangeSafety(
  operation: ChangeOperation,
  sourceField: LogicalField | null
): SafetyLevel {
  if (operation.type === 'no_change') {
    return 'safe';
  }

  if (operation.type === 'add') {
    return 'safe';
  }

  if (operation.type === 'remove') {
    return 'breaking'; // Removing fields is always breaking
  }

  if (operation.type === 'modify') {
    const { field, previous } = operation;
    
    // Type narrowing is breaking
    if (isTypeNarrowing(previous.logicalType, field.logicalType)) {
      return 'breaking';
    }

    // Precision reduction is breaking
    if (
      previous.logicalType.kind === 'number' &&
      field.logicalType.kind === 'number'
    ) {
      const prev = previous.logicalType;
      const curr = field.logicalType;
      if (
        (curr.precision && prev.precision && curr.precision < prev.precision) ||
        (curr.scale && prev.scale && curr.scale < prev.scale)
      ) {
        return 'breaking';
      }
    }

    // Enum option removal is breaking
    if (
      previous.logicalType.kind === 'enum' &&
      field.logicalType.kind === 'enum'
    ) {
      const prev = previous.logicalType;
      const curr = field.logicalType;
      const removedOptions = prev.options.filter(opt => !curr.options.includes(opt));
      if (removedOptions.length > 0) {
        return 'breaking';
      }
    }

    // Nullable to non-nullable is breaking
    const prevNullable = previous.nullable !== false;
    const currNullable = field.nullable !== false;
    if (prevNullable && !currNullable) {
      return 'breaking';
    }

    return 'safe';
  }

  return 'warning';
}

/**
 * Check if type2 is a narrowing of type1
 */
function isTypeNarrowing(type1: LogicalType, type2: LogicalType): boolean {
  // Different kinds are narrowing
  if (type1.kind !== type2.kind) {
    return true;
  }

  // String format narrowing (e.g., string -> email)
  if (type1.kind === 'string' && type2.kind === 'string') {
    if (type1.format && type2.format && type1.format !== type2.format) {
      return true;
    }
  }

  // Number to boolean or other type narrowing
  // (handled by kind check above)

  return false;
}

