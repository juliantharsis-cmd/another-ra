# FeatureBuild Framework

A structured template for transforming feature requests into AI-ready implementation specifications.

## Usage

When you want to request a feature implementation, use the keyword `[FeatureBuild]` followed by your request. The AI will automatically transform it into the structured format below.

## Template Structure

```
You are a [ROLE]. Implement a **[FEATURE_NAME]** that [BRIEF_DESCRIPTION] with **[KEY_TECHNICAL_REQUIREMENT]**.

# Goals

1) **[PRIMARY_GOAL_1]** - [Description]

2) **[PRIMARY_GOAL_2]** - [Description]
   - [Sub-requirement]
   - [Sub-requirement]

3) **[PRIMARY_GOAL_3]** - [Description]

# [TECHNICAL_SECTION_NAME]

[Detailed specifications, schemas, configurations]

# [IMPLEMENTATION_SECTION_NAME]

[Code examples, scripts, or implementation details]

> NOTE: [Important constraints, security considerations, or limitations]
```

## Framework Components

### 1. Role & Context
- Define the AI's role (e.g., "senior full-stack engineer", "backend architect")
- State the feature name and brief description
- Highlight key technical requirements

### 2. Goals (Numbered List)
- Break down into clear, actionable goals
- Use sub-bullets for detailed requirements
- Each goal should be specific and measurable

### 3. Technical Specifications
- Database schemas (if applicable)
- API endpoints
- Data structures
- Configuration requirements

### 4. Implementation Details
- Code examples
- Scripts for automation
- Integration points
- Testing considerations

### 5. Notes & Constraints
- Security considerations
- Performance requirements
- Limitations
- Future considerations

## Example Transformation

### Input (Regular Prompt):
```
I need a notification system that sends emails when users create records.
```

### Output (FeatureBuild Format):
```
You are a senior full-stack engineer. Implement a **Notification System** that sends emails when users create records, with **event-driven architecture** and **template-based email rendering**.

# Goals

1) **Create Event System** - Build an event emitter/listener system
   - Support multiple event types (create, update, delete)
   - Allow multiple listeners per event
   - Support async event processing

2) **Email Service** - Implement email sending with templates
   - Template engine (Handlebars/Mustache)
   - SMTP configuration
   - Retry logic for failed sends

3) **Notification Preferences** - User-configurable notification settings
   - Per-event opt-in/opt-out
   - Email frequency controls
   - Unsubscribe handling

# Email Templates

Template structure:
- Subject template: `{{eventType}} - {{entityName}}`
- Body template: HTML with variables
- Storage: File system or database

# Event System

Event types:
- `record.created`
- `record.updated`
- `record.deleted`

> NOTE: Ensure GDPR compliance with unsubscribe links. Rate limit emails to prevent spam.
```

## Key Principles

1. **Specificity**: Use concrete examples and exact field names
2. **Completeness**: Include all technical details needed for implementation
3. **Structure**: Organize information hierarchically
4. **Context**: Provide background and constraints
5. **Examples**: Include code snippets when helpful

## When to Use FeatureBuild

- Complex features requiring multiple components
- Features with database schemas
- API integrations
- System architecture changes
- Features requiring configuration or setup

## Quick Reference

```
[FeatureBuild]

[Your feature request here - the AI will transform it into the structured format]
```

