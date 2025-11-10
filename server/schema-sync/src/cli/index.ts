#!/usr/bin/env node

/**
 * SchemaSync CLI
 * 
 * Production-grade schema synchronization tool
 * 
 * Tool Name: SchemaSync
 * CLI Command: schema-sync
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, SyncConfig } from '../config/config';
import { AirtableSource } from '../adapters/airtable-source';
import { AirtableTarget } from '../adapters/airtable-target';
import { PostgresTarget } from '../adapters/postgres-target';
import { SourceSchemaProvider, TargetSchemaApplier } from '../core/adapters';
import { compareSchemas } from '../core/diff';
import { LogicalSchema } from '../core/types';

const program = new Command();

program
  .name('schema-sync')
  .description('Synchronize schemas between data sources')
  .version('1.0.0');

/**
 * Plan command: Generate a change plan without applying
 */
program
  .command('plan')
  .description('Generate a change plan (dry-run)')
  .requiredOption('--config <path>', 'Path to configuration file')
  .option('--table <name>', 'Limit to specific table')
  .option('--include-computed', 'Include computed fields', false)
  .option('--exclude-computed', 'Exclude computed fields (default)', false)
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      const includeComputed = options.includeComputed || !options.excludeComputed;

      // Create source provider
      const source = createSourceProvider(config.source);
      
      // Create target applier
      const target = createTargetApplier(config.target);

      // Get schemas
      console.log(chalk.blue('📖 Reading source schema...'));
      const sourceSchema = await source.getSchema(options.table || config.source.table);
      console.log(chalk.green(`✓ Found ${sourceSchema.fields.length} fields in source`));

      console.log(chalk.blue('📖 Reading target schema...'));
      const targetSchema = await target.getCurrentSchema(options.table || config.target.table);
      console.log(chalk.green(`✓ Found ${targetSchema.fields.length} fields in target`));

      // Compare schemas
      console.log(chalk.blue('🔍 Comparing schemas...'));
      const plan = compareSchemas(sourceSchema, targetSchema, {
        includeComputed,
        allowBreaking: config.options?.allowBreaking || false
      });

      // Display plan
      displayPlan(plan);

      if (plan.breaking && !config.options?.allowBreaking) {
        console.log(chalk.yellow('\n⚠️  Breaking changes detected. Use --allow-breaking to apply.'));
      }

      if (plan.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Warnings:'));
        plan.warnings.forEach(w => console.log(chalk.yellow(`  - ${w}`)));
      }

    } catch (error: any) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Apply command: Apply the change plan
 */
program
  .command('apply')
  .description('Apply schema changes')
  .requiredOption('--config <path>', 'Path to configuration file')
  .option('--allow-breaking', 'Allow breaking changes', false)
  .option('--dry-run', 'Dry run mode (default)', true)
  .option('--no-dry-run', 'Actually apply changes')
  .option('--table <name>', 'Limit to specific table')
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      const dryRun = options.dryRun !== false;

      if (!dryRun) {
        console.log(chalk.red('⚠️  DRY RUN DISABLED - Changes will be applied!'));
        // Could add confirmation prompt here
      }

      // Create source provider
      const source = createSourceProvider(config.source);
      
      // Create target applier
      const target = createTargetApplier(config.target);

      // Get schemas
      console.log(chalk.blue('📖 Reading schemas...'));
      const sourceSchema = await source.getSchema(options.table || config.source.table);
      const targetSchema = await target.getCurrentSchema(options.table || config.target.table);

      // Compare and generate plan
      const plan = compareSchemas(sourceSchema, targetSchema, {
        includeComputed: config.options?.applyComputed || false,
        allowBreaking: options.allowBreaking || config.options?.allowBreaking || false
      });

      // Apply plan
      console.log(chalk.blue('🔄 Applying changes...'));
      const result = await target.applyPlan(plan, {
        dryRun,
        allowBreaking: options.allowBreaking || config.options?.allowBreaking || false
      });

      // Display results
      if (result.applied) {
        console.log(chalk.green('\n✓ Changes applied successfully!'));
      } else {
        console.log(chalk.yellow('\n⚠️  Dry run - no changes applied'));
      }

      if (result.changes.length > 0) {
        console.log(chalk.blue('\nChanges:'));
        result.changes.forEach(change => console.log(`  ${change}`));
      }

      if (result.errors.length > 0) {
        console.log(chalk.red('\nErrors:'));
        result.errors.forEach(error => console.log(`  ${error}`));
        process.exit(1);
      }

    } catch (error: any) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Export command: Export schema to JSON
 */
program
  .command('export')
  .description('Export schema to JSON')
  .requiredOption('--source <kind>', 'Source kind (airtable, postgres, json)')
  .requiredOption('--out <path>', 'Output file path')
  .option('--config <path>', 'Path to configuration file (for credentials)')
  .option('--table <name>', 'Table name')
  .action(async (options) => {
    try {
      let config: Partial<SyncConfig> = {};
      if (options.config) {
        config = loadConfig(options.config);
      }

      // Create source provider
      const sourceConfig: any = {
        kind: options.source,
        ...(config.source || {})
      };
      const source = createSourceProvider(sourceConfig);

      // Get schema
      console.log(chalk.blue('📖 Reading schema...'));
      const schema = await source.getSchema(options.table);

      // Write to file
      const outputPath = path.resolve(options.out);
      fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
      console.log(chalk.green(`✓ Schema exported to ${outputPath}`));

    } catch (error: any) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

/**
 * Create source provider from config
 */
function createSourceProvider(config: any): SourceSchemaProvider {
  switch (config.kind) {
    case 'airtable':
      return new AirtableSource({
        apiKey: config.apiKey!,
        baseId: config.baseId!,
        table: config.table
      });
    
    case 'postgres':
      // TODO: Implement PostgresSource
      throw new Error('Postgres source not yet implemented');
    
    case 'json':
      // TODO: Implement JsonSource
      throw new Error('JSON source not yet implemented');
    
    default:
      throw new Error(`Unknown source kind: ${config.kind}`);
  }
}

/**
 * Create target applier from config
 */
function createTargetApplier(config: any): TargetSchemaApplier {
  switch (config.kind) {
    case 'airtable':
      return new AirtableTarget({
        apiKey: config.apiKey!,
        baseId: config.baseId!,
        table: config.table
      });
    
    case 'postgres':
      return new PostgresTarget({
        connection: config.connection!,
        table: config.table,
        options: config.options
      });
    
    case 'plan-only':
      // TODO: Implement PlanOnlyTarget (just prints plan)
      throw new Error('Plan-only target not yet implemented');
    
    default:
      throw new Error(`Unknown target kind: ${config.kind}`);
  }
}

/**
 * Display change plan in a readable format
 */
function displayPlan(plan: any): void {
  console.log(chalk.blue(`\n📋 Change Plan for table: ${plan.tableName}`));
  console.log(chalk.blue('─'.repeat(60)));

  const operations = plan.operations.filter((op: any) => op.type !== 'no_change');
  
  if (operations.length === 0) {
    console.log(chalk.green('✓ No changes needed - schemas are in sync'));
    return;
  }

  const adds = operations.filter((op: any) => op.type === 'add');
  const modifies = operations.filter((op: any) => op.type === 'modify');
  const removes = operations.filter((op: any) => op.type === 'remove');

  if (adds.length > 0) {
    console.log(chalk.green(`\n➕ Add (${adds.length}):`));
    adds.forEach((op: any) => {
      console.log(`  ${chalk.green('+')} ${op.field.name} (${op.field.logicalType.kind})`);
    });
  }

  if (modifies.length > 0) {
    console.log(chalk.yellow(`\n🔄 Modify (${modifies.length}):`));
    modifies.forEach((op: any) => {
      console.log(`  ${chalk.yellow('~')} ${op.field.name}`);
      console.log(`    Previous: ${JSON.stringify(op.previous.logicalType)}`);
      console.log(`    New:      ${JSON.stringify(op.field.logicalType)}`);
    });
  }

  if (removes.length > 0) {
    console.log(chalk.red(`\n➖ Remove (${removes.length}):`));
    removes.forEach((op: any) => {
      console.log(`  ${chalk.red('-')} ${op.fieldName}`);
    });
  }
}

// Run CLI
program.parse();

