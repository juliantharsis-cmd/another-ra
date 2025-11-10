# Panel Redesign - Modular & Reusable System

## Overview

The right sliding panel has been redesigned into a modular, reusable component system that can be applied to any table/entity in the app (Companies, Users, Projects, etc.).

## Architecture

### Core Components

Located in `src/components/panels/`:

1. **DetailPanel** - Main container with smooth slide-in animation
2. **PanelHeader** - Title and primary actions (Delete, Edit, etc.)
3. **PanelSection** - Generic section wrapper with optional dividers
4. **PanelField** - Form fields (text, textarea, select, readonly)
5. **PanelTags** - Tag/pill display for categories
6. **PanelActivity** - Action logs (Created by, Modified by, timestamps)
7. **PanelComments** - Comment input and collaboration

### Configuration System

Panel layouts are defined through configuration objects:

```typescript
// Example: companyPanelConfig.tsx
export const companyPanelConfig: PanelConfig = {
  titleKey: 'companyName',
  actions: { delete: { label: 'Delete company', onClick: () => {} } },
  sections: [
    { type: 'fields', title: 'Main Information', fields: [...] },
    { type: 'tags', title: 'Categories', tags: [...] },
    { type: 'activity', title: 'Action Logs', activities: [...] },
    { type: 'comments' },
  ],
}
```

## Design System

### Visual Structure

- **Header Section**: Light grey background (`bg-neutral-50`), border bottom
- **Main Information**: Form fields with consistent spacing
- **Tags Section**: Pill-style tags with color coding
- **Activity Section**: Timestamped action logs with dividers
- **Comments Section**: Input field with existing comments display

### Spacing & Typography

- Consistent padding: `p-6` for sections
- Section spacing: `space-y-6`
- Typography: Inter font, semantic sizing
- Dividers: `border-t border-neutral-200 pt-6`

### Colors (Schneider Electric Palette)

- Primary: Green accents (`green-500`, `green-100`, `green-700`)
- Neutral: Grey shades (`neutral-50` to `neutral-900`)
- Semantic: Red for delete actions (`red-600`)

### Animations

- Smooth slide-in: `duration-400 ease-smooth`
- GPU-accelerated: `translate3d()` transforms
- Backdrop fade: `opacity-30` with transition

## Implementation

### Company Panel (Example)

The `CompanyDetailPanel` now uses the modular system:

```typescript
import { DetailPanel, PanelHeader, ... } from './panels'
import { companyPanelConfig } from './panels/configs/companyPanelConfig'

export default function CompanyDetailPanel({ company, isOpen, onClose, ... }) {
  const panelTitle = getPanelTitle(company, companyPanelConfig)
  
  return (
    <DetailPanel isOpen={isOpen} onClose={onClose} header={...}>
      {/* Sections rendered from config */}
    </DetailPanel>
  )
}
```

## Benefits

### ✅ Reusability
- Same components work for any entity type
- Configuration-driven layout
- Easy to add new entity panels

### ✅ Consistency
- Unified design across all panels
- Consistent spacing and typography
- Standardized interactions

### ✅ Maintainability
- Single source of truth for panel styling
- Easy to update design system-wide
- Clear component boundaries

### ✅ Scalability
- Add new section types easily
- Support custom field types
- Extend for future features

## Usage for New Entities

### Step 1: Create Configuration

```typescript
// src/components/panels/configs/userPanelConfig.tsx
export const userPanelConfig: PanelConfig = {
  titleKey: 'name',
  sections: [
    { type: 'fields', fields: [...] },
    { type: 'activity', activities: [...] },
  ],
}
```

### Step 2: Create Panel Component

```typescript
// src/components/UserDetailPanel.tsx
import { DetailPanel, PanelHeader, ... } from './panels'
import { userPanelConfig } from './panels/configs/userPanelConfig'

export default function UserDetailPanel({ user, isOpen, onClose }) {
  // Use helper functions to render sections
  return (
    <DetailPanel isOpen={isOpen} onClose={onClose} header={...}>
      {/* Render sections */}
    </DetailPanel>
  )
}
```

## File Structure

```
src/components/
├── panels/
│   ├── DetailPanel.tsx          # Main container
│   ├── PanelHeader.tsx          # Header with title & actions
│   ├── PanelSection.tsx         # Generic section wrapper
│   ├── PanelField.tsx           # Form fields
│   ├── PanelTags.tsx            # Tag/pill display
│   ├── PanelActivity.tsx        # Activity logs
│   ├── PanelComments.tsx        # Comments
│   ├── types.ts                 # TypeScript types & helpers
│   ├── index.ts                 # Exports
│   ├── configs/
│   │   ├── companyPanelConfig.tsx
│   │   └── userPanelConfig.example.tsx
│   └── README.md                # Documentation
└── CompanyDetailPanel.tsx       # Company implementation
```

## Future Enhancements

- [ ] Custom section types for specialized content
- [ ] Dynamic field validation
- [ ] Rich text editor for notes
- [ ] File attachments
- [ ] Real-time collaboration
- [ ] Panel state persistence
- [ ] Keyboard shortcuts

## Migration Notes

The old `CompanyDetailPanel` has been refactored to use the new system. All functionality is preserved:
- ✅ Field editing with auto-save
- ✅ Delete action
- ✅ Tag display
- ✅ Activity logs
- ✅ Comments input
- ✅ Smooth animations

No breaking changes to the component API - it still accepts the same props.

