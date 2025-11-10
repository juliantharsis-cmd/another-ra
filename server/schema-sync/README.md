# SchemaSync

**SchemaSync** is a production-grade TypeScript/Node CLI tool for synchronizing field definitions between data sources (Airtable, PostgreSQL, etc.).

**Tool Name:** `SchemaSync` (or `schema-sync` CLI command)

## Features

- **Generic Logical Type System**: Vendor-agnostic type model that works with any persistence layer
- **Adapter Pattern**: Pluggable source providers and target appliers
- **Idempotent**: Running twice is a no-op if already aligned
- **Non-destructive by default**: Default `--dry-run` mode with `--allow-breaking` for destructive changes
- **Config-driven**: YAML/JSON configuration with environment variable substitution
- **Minimal dependencies**: Clean architecture with focused dependencies

## Installation

```bash
cd server/schema-sync
npm install
npm run build
```

## Usage

### Plan Changes (Dry Run)

```bash
npm run build
node dist/cli/index.js plan --config schema.yml
```

### Apply Changes

```bash
# Dry run (default)
node dist/cli/index.js apply --config schema.yml

# Actually apply changes
node dist/cli/index.js apply --config schema.yml --no-dry-run

# Allow breaking changes
node dist/cli/index.js apply --config schema.yml --no-dry-run --allow-breaking
```

### Export Schema

```bash
node dist/cli/index.js export --source airtable --out schema.json --config schema.yml --table "My Table"
```

## Configuration

Create a `schema.yml` file based on `schema.yml.example`:

```yaml
source:
  kind: airtable
  baseId: ${AIRTABLE_BASE_ID}
  table: "Source Table"
  apiKey: ${AIRTABLE_API_KEY}

target:
  kind: airtable
  baseId: ${AIRTABLE_RA_BASE_ID}
  table: "RA Table"
  apiKey: ${AIRTABLE_API_KEY}

options:
  defaultNumberTypeForUnknown: "double"
  enumStrategy: "text-check"
  applyComputed: false
  allowBreaking: false
  dryRun: true
```

Environment variables are substituted using `${VAR_NAME}` syntax.

## Logical Type System

The tool uses a generic logical type system that maps to/from vendor-specific types:

- `string` (with maxLength, format: email/url/phone/richtext)
- `number` (with precision, scale, signed)
- `boolean`
- `date` (with timezone, format: date/datetime)
- `enum` (with options, multi)
- `json`
- `array` (with items type)
- `foreign_key` (with refTable, refField, cardinality)
- `attachment` (with multiple, constraints)
- `computed` (formulas, rollups, lookups)

## Supported Sources/Targets

### Currently Implemented

- **Airtable Source**: Reads schema from Airtable via Metadata API
- **Airtable Target**: Applies changes via Airtable Metadata API
- **PostgreSQL Target**: Generates and applies ALTER TABLE statements

### Planned

- PostgreSQL Source
- JSON Source/Target
- Plan-only Target (for testing)

## Safety Features

- **Breaking Change Detection**: Identifies potentially destructive changes (precision reduction, enum option removal, type narrowing)
- **Dry Run by Default**: Never applies changes without explicit `--no-dry-run`
- **Transaction Support**: PostgreSQL changes are wrapped in transactions
- **Idempotency**: Safe to run multiple times

## Development

```bash
# Build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Test
npm test

# Watch mode
npm run dev
```

## Architecture

```
src/
  core/
    types.ts          # Logical type system
    diff.ts           # Schema comparison engine
    adapters.ts       # Provider/applier interfaces
  adapters/
    airtable-source.ts
    airtable-target.ts
    postgres-target.ts
  config/
    config.ts         # Configuration parser
  cli/
    index.ts          # CLI entry point
```

## License

MIT

