/**
 * Configuration Parser
 * 
 * Parses YAML/JSON configuration files with environment variable substitution
 */

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

export interface SourceConfig {
  kind: 'airtable' | 'postgres' | 'json';
  baseId?: string;
  table?: string;
  apiKey?: string;
  connection?: string; // For postgres
  file?: string; // For json
}

export interface TargetConfig {
  kind: 'airtable' | 'postgres' | 'plan-only';
  baseId?: string;
  table?: string;
  apiKey?: string;
  connection?: string; // For postgres
  options?: {
    enumStrategy?: 'pg-enum' | 'text-check' | 'text';
    timezoneStrategy?: 'utc' | 'naive' | 'preserve';
    defaultNumberType?: string;
  };
}

export interface SyncOptions {
  defaultNumberTypeForUnknown?: string;
  enumStrategy?: 'pg-enum' | 'text-check' | 'text';
  applyComputed?: boolean;
  allowBreaking?: boolean;
  dryRun?: boolean;
  overrides?: Record<string, any>;
}

export interface SyncConfig {
  source: SourceConfig;
  target: TargetConfig;
  options?: SyncOptions;
}

/**
 * Load and parse configuration file
 */
export function loadConfig(configPath: string): SyncConfig {
  const fullPath = path.resolve(configPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Configuration file not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const raw = yaml.load(content) as any;

  // Substitute environment variables
  const config = substituteEnvVars(raw);

  // Validate and normalize
  return validateConfig(config);
}

/**
 * Substitute environment variables in config (supports ${VAR} syntax)
 */
function substituteEnvVars(obj: any): any {
  if (typeof obj === 'string') {
    return obj.replace(/\${([^}]+)}/g, (match, varName) => {
      const value = process.env[varName];
      if (value === undefined) {
        throw new Error(`Environment variable ${varName} is not set`);
      }
      return value;
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(item => substituteEnvVars(item));
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVars(value);
    }
    return result;
  }

  return obj;
}

/**
 * Validate configuration structure
 */
function validateConfig(raw: any): SyncConfig {
  if (!raw.source || !raw.target) {
    throw new Error('Configuration must have "source" and "target" sections');
  }

  const source: SourceConfig = {
    kind: raw.source.kind || 'airtable'
  };

  if (source.kind === 'airtable') {
    if (!raw.source.baseId) {
      throw new Error('Airtable source requires "baseId"');
    }
    if (!raw.source.apiKey) {
      throw new Error('Airtable source requires "apiKey"');
    }
    source.baseId = raw.source.baseId;
    source.apiKey = raw.source.apiKey;
    source.table = raw.source.table;
  } else if (source.kind === 'postgres') {
    if (!raw.source.connection) {
      throw new Error('Postgres source requires "connection"');
    }
    source.connection = raw.source.connection;
    source.table = raw.source.table;
  } else if (source.kind === 'json') {
    if (!raw.source.file) {
      throw new Error('JSON source requires "file"');
    }
    source.file = raw.source.file;
  }

  const target: TargetConfig = {
    kind: raw.target.kind || 'airtable'
  };

  if (target.kind === 'airtable') {
    if (!raw.target.baseId) {
      throw new Error('Airtable target requires "baseId"');
    }
    if (!raw.target.apiKey) {
      throw new Error('Airtable target requires "apiKey"');
    }
    target.baseId = raw.target.baseId;
    target.apiKey = raw.target.apiKey;
    target.table = raw.target.table;
  } else if (target.kind === 'postgres') {
    if (!raw.target.connection) {
      throw new Error('Postgres target requires "connection"');
    }
    target.connection = raw.target.connection;
    target.table = raw.target.table;
    target.options = raw.target.options;
  }

  const options: SyncOptions = {
    defaultNumberTypeForUnknown: raw.options?.defaultNumberTypeForUnknown || 'double',
    enumStrategy: raw.options?.enumStrategy || 'text-check',
    applyComputed: raw.options?.applyComputed || false,
    allowBreaking: raw.options?.allowBreaking || false,
    dryRun: raw.options?.dryRun !== false, // Default true
    overrides: raw.options?.overrides
  };

  return {
    source,
    target,
    options
  };
}

