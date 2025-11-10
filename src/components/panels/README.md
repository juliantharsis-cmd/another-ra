# Reusable Panel Components

A modular, reusable panel system for displaying entity details across the application.

## Overview

The panel system consists of:
- **DetailPanel**: Main container with smooth slide-in animation
- **PanelHeader**: Title and action buttons
- **PanelSection**: Generic section wrapper with optional dividers
- **PanelField**: Form fields (text, textarea, select, readonly)
- **PanelTags**: Tag/pill display for categories
- **PanelActivity**: Action logs and timestamps
- **PanelComments**: Comment input and display

## Quick Start

### 1. Create a Panel Configuration

```typescript
// src/components/panels/configs/userPanelConfig.tsx
import { PanelConfig } from '../types'

export const userPanelConfig: PanelConfig = {
  titleKey: 'name',
  actions: {
    delete: {
      label: 'Delete user',
      onClick: () => {},
    },
  },
  sections: [
    {
      type: 'fields',
      title: 'User Information',
      fields: [
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'role', label: 'Role', type: 'select', options: [...] },
      ],
    },
    {
      type: 'activity',
      title: 'Activity Log',
      activities: [
        { key: 'createdBy', label: 'Created By', timestampKey: 'created' },
      ],
    },
  ],
}
```

### 2. Use in Your Component

```typescript
import { DetailPanel, PanelHeader, ... } from './panels'
import { userPanelConfig } from './panels/configs/userPanelConfig'

export default function UserDetailPanel({ user, isOpen, onClose }) {
  const panelTitle = getPanelTitle(user, userPanelConfig)
  
  return (
    <DetailPanel isOpen={isOpen} onClose={onClose}>
      <PanelHeader title={panelTitle} actions={...} onClose={onClose} />
      {/* Render sections based on config */}
    </DetailPanel>
  )
}
```

## Component API

### DetailPanel

Main container component with smooth animations.

```typescript
<DetailPanel
  isOpen={boolean}
  onClose={() => void}
  header={ReactNode}
  children={ReactNode}
  maxWidth="max-w-2xl" // optional
/>
```

### PanelHeader

Header with title and actions.

```typescript
<PanelHeader
  title={string}
  actions={ReactNode} // optional
  onClose={() => void}
/>
```

### PanelSection

Generic section wrapper.

```typescript
<PanelSection
  title={string} // optional
  showDivider={boolean} // optional
  className={string} // optional
>
  {children}
</PanelSection>
```

### PanelField

Form field component.

```typescript
<PanelField
  label={string}
  value={string | number | undefined}
  onChange={(value: string) => void} // optional
  onBlur={() => void} // optional
  type="text" | "textarea" | "select" | "readonly"
  options={Array<{value: string, label: string}>} // for select
  placeholder={string} // optional
  rows={number} // for textarea
/>
```

### PanelTags

Tag/pill display.

```typescript
<PanelTags
  title={string} // optional
  tags={Array<{label: string, value: string, color?: string}>}
  getTagColor={(value: string) => string} // optional
/>
```

### PanelActivity

Activity log display.

```typescript
<PanelActivity
  title={string} // optional, default: "Activity"
  activities={Array<{label: string, value: string, timestamp?: string}>}
/>
```

### PanelComments

Comment input and display.

```typescript
<PanelComments
  title={string} // optional, default: "Comments"
  comments={Array<{id: string, text: string, author: string, timestamp: string}>} // optional
  onSubmit={(comment: string) => void} // optional
  placeholder={string} // optional
/>
```

## Design System

The components follow the Schneider Electric design tokens:
- **Colors**: Neutral greys with green accents (`green-500`, `neutral-*`)
- **Typography**: Inter font family, consistent sizing
- **Spacing**: Consistent padding and margins
- **Animations**: Smooth 400ms transitions with GPU acceleration

## Examples

See:
- `src/components/panels/configs/companyPanelConfig.tsx` - Company entity configuration
- `src/components/CompanyDetailPanel.tsx` - Implementation example

## Future Enhancements

- [ ] Support for custom section types
- [ ] Dynamic field validation
- [ ] Rich text editor for notes/comments
- [ ] File attachments
- [ ] Real-time collaboration features

