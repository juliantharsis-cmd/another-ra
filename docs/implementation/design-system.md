# Another RA - Design System

## Schneider Electric-Inspired Design

This document outlines the design system used across the Another RA application, following modern UI principles with Schneider Electric branding.

## Color Palette

### Primary Colors (Green - Schneider Electric)
- **Primary 500**: `#22c55e` - Main brand green
- **Primary 600**: `#16a34a` - Darker green for hover states
- **Primary 700**: `#15803d` - Active states
- **Primary 50-100**: Light backgrounds and highlights

### Neutral Palette (Grey Shades)
- **Neutral 50**: `#fafafa` - Background
- **Neutral 100**: `#f5f5f5` - Light backgrounds
- **Neutral 200**: `#e5e5e5` - Borders
- **Neutral 300**: `#d4d4d4` - Input borders
- **Neutral 500**: `#737373` - Secondary text
- **Neutral 700**: `#404040` - Primary text
- **Neutral 900**: `#171717` - Headings

### Semantic Colors
- **Success**: Green (`#22c55e`)
- **Error**: Red (`#ef4444`)
- **Warning**: Amber (`#f59e0b`)
- **Info**: Blue (`#3b82f6`)

## Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif

### Font Sizes
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)

### Font Weights
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing

- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

## Border Radius

- **sm**: 0.25rem (4px)
- **md**: 0.5rem (8px)
- **lg**: 0.75rem (12px)
- **xl**: 1rem (16px)
- **full**: 9999px (fully rounded)

## Components

### Sidebar Navigation
- **Background**: White (`bg-white`)
- **Border**: Neutral 200 (`border-neutral-200`)
- **Active State**: Green 50 background with green 500 border-right
- **Hover State**: Neutral 100 background
- **Icons**: SVG icons (no emojis)
- **Badge**: Green 500 background

### Table
- **Header**: Neutral 50 background
- **Row Hover**: Green 50 background
- **Borders**: Neutral 200
- **Text**: Neutral 700/900
- **Tags**: Colored pills with borders

### Detail Panel
- **Background**: White
- **Shadow**: Large shadow for depth
- **Animation**: 300ms ease-out slide-in
- **Backdrop**: Neutral 900 with 30% opacity

### Form Elements
- **Input Border**: Neutral 300
- **Focus Ring**: Green 500 (2px)
- **Border Radius**: Large (0.75rem)
- **Padding**: 1rem horizontal, 0.625rem vertical

## Interaction Patterns

### Hover States
- **Subtle background change**: Neutral 100 or Green 50
- **Color transition**: 200ms duration
- **Icon color change**: Green 600 on hover

### Click Interactions
- **Row click**: Opens detail panel
- **Hover reveal**: "Open" button appears on row hover
- **Smooth transitions**: 200-300ms duration

### Animations
- **Panel slide**: 300ms ease-out
- **Hover effects**: 200ms ease-in-out
- **Transform**: translate-x for slide animations

## Icon System

All icons are SVG-based components located in `src/components/icons.tsx`:
- HomeIcon
- BuildingIcon
- FolderIcon
- GlobeIcon
- LeafIcon
- ChartIcon
- DocumentIcon
- SettingsIcon
- OpenIcon
- CloseIcon
- And more...

## Usage Examples

### Button (Primary)
```tsx
<button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
  Button Text
</button>
```

### Tag/Pill
```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
  Tag Text
</span>
```

### Input Field
```tsx
<input
  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
/>
```

## Design Tokens File

All design tokens are centralized in `src/lib/designTokens.ts` for easy maintenance and consistency.

