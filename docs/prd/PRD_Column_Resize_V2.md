# Product Requirements Document: Column Resize V2

## Document Information

**Document Title:** Column Resize V2 Feature  
**Version:** 1.0  
**Date:** January 2025  
**Author:** Product Team  
**Status:** Draft  
**Domain:** ui  
**Project Naming:** another-ra-ui, another-ra-api

---

## 1. Executive Summary

### 1.1. Problem Statement

Users need the ability to customize column widths in tables to optimize their viewing experience. The current system lacks advanced column resizing capabilities, making it difficult for users to adjust column widths based on content and personal preferences. Users require drag-and-drop resizing, persistent column widths across sessions, and support for different list modes (compact, comfortable, spacious).

### 1.2. Solution Overview

Implement an advanced Column Resize V2 system that provides:
- Drag-and-drop column resizing with visual feedback
- Persistent column widths per table and list mode
- Support for multiple list modes (compact, comfortable, spacious)
- Minimum and maximum width constraints
- Auto-sizing capability
- Smooth resize animations

### 1.3. Business Value

**User Experience:** Personalized table layouts improve productivity  
**Efficiency:** Optimized column widths reduce horizontal scrolling  
**Consistency:** Persistent widths maintain user preferences  
**Flexibility:** Multiple list modes support different use cases  
**Adoption:** Customizable interface increases user satisfaction

---

## 2. User Personas & Use Cases

### 2.1. Primary Personas

**Persona 1: Data Analyst**
- **Characteristics:** Professionals analyzing data in tables, need optimal column widths for readability
- **Needs:** Ability to resize columns, persist preferences, use different list modes
- **Challenges:** Finding optimal column widths, maintaining preferences across sessions

**Persona 2: Data Administrator**
- **Characteristics:** Technical professionals managing data, need consistent table layouts
- **Needs:** Persistent column widths, support for different screen sizes
- **Challenges:** Column widths resetting, inconsistent layouts

### 2.2. Use Cases

**UC1: Resize Column by Dragging**
- **Actor:** All users
- **Description:** Adjust column width by dragging column border
- **Preconditions:** User has access to table with resizable columns
- **Flow:** Hover over column border → Drag to desired width → Release → Width saved
- **Postconditions:** Column width updated, preference saved

**UC2: Auto-size Column**
- **Actor:** Data Analyst
- **Description:** Automatically adjust column width to fit content
- **Preconditions:** User has access to table with auto-sizing enabled
- **Flow:** Click auto-size button or use column context menu → Column width adjusts to content
- **Postconditions:** Column width optimized for content

**UC3: Switch List Mode**
- **Actor:** All users
- **Description:** Change list mode (compact/comfortable/spacious) with different column widths
- **Preconditions:** User has access to table with multiple list modes
- **Flow:** Select list mode → Column widths adjust to mode-specific preferences
- **Postconditions:** Table displays in selected mode with appropriate column widths

---

## 3. User Stories

**US1:** As a user, I want to resize columns by dragging so that I can customize table layout to my needs.

**US2:** As a user, I want column widths to persist across sessions so that I don't have to resize them repeatedly.

**US3:** As a data analyst, I want different column widths for different list modes so that I can optimize for different viewing contexts.

**US4:** As a user, I want to auto-size columns so that content fits without manual adjustment.

**US5:** As a user, I want minimum and maximum width constraints so that columns don't become unusable.

---

## 4. Functional Requirements

### 4.1. Column Resizing

**FR1: Drag-and-Drop Resizing**
- **Requirement:** Resize columns by dragging column borders
- **Acceptance Criteria:**
  - Resize handle visible on column borders
  - Cursor changes to resize cursor on hover
  - Dragging updates column width in real-time
  - Visual feedback during resize
  - Width constraints enforced (min/max)
  - Resize persists on release

**FR2: Width Constraints**
- **Requirement:** Enforce minimum and maximum column widths
- **Acceptance Criteria:**
  - Minimum width: 60px (prevents columns from becoming too narrow)
  - Maximum width: 800px (prevents columns from becoming too wide)
  - Constraints enforced during drag
  - Visual feedback when constraint reached

**FR3: Resize Persistence**
- **Requirement:** Save column widths per table and list mode
- **Acceptance Criteria:**
  - Widths saved to localStorage
  - Per-table storage (by entityNamePlural)
  - Per-mode storage (compact, comfortable, spacious)
  - Widths loaded on table mount
  - Fallback to default widths if not saved

### 4.2. List Modes

**FR4: Multiple List Modes**
- **Requirement:** Support compact, comfortable, and spacious list modes
- **Acceptance Criteria:**
  - Three modes: compact, comfortable, spacious
  - Different default column widths per mode
  - Mode-specific width storage
  - Mode selector in table header
  - Mode preference persists

**FR5: Mode-Specific Widths**
- **Requirement:** Store and apply different column widths for each list mode
- **Acceptance Criteria:**
  - Widths stored separately per mode
  - Switching modes loads appropriate widths
  - Resizing in one mode doesn't affect others
  - Default widths provided for each mode

### 4.3. Auto-Sizing

**FR6: Column Auto-Sizing**
- **Requirement:** Automatically size columns to fit content
- **Acceptance Criteria:**
  - Auto-size button in table header
  - Calculates optimal width based on content
  - Considers header text and cell content
  - Samples first 10 rows for performance
  - Respects min/max constraints
  - Applies to all visible columns or selected column

---

## 5. Non-Functional Requirements

### 5.1. Performance Requirements

**Performance Targets:**
- Resize operation: < 16ms (60fps)
- Width save: < 100ms
- Width load: < 50ms
- Auto-size calculation: < 200ms for 10 rows

### 5.2. Usability Requirements

**User Interface:**
- Smooth resize animations
- Clear resize handles
- Visual feedback during resize
- Intuitive drag interaction

**Accessibility:**
- Keyboard support for resize (future)
- ARIA labels for resize handles
- Screen reader announcements

---

## 6. Technical Requirements

### 6.1. Component Structure

**Components:**
- `useResizableColumnsV2`: Hook for column resizing logic
- `ColumnResizer`: Component for resize handles
- Width storage utilities

**Implementation:**
```typescript
interface ColumnInfo {
  key: string
  minWidth: number
  maxWidth: number
  defaultWidth: number
  type?: string
}

interface ResizeState {
  columnWidths: Record<string, number>
  isResizing: boolean
  resizingColumn: string | null
}
```

### 6.2. Storage

**localStorage Structure:**
```typescript
{
  table_prefs_{tableId}: {
    columnWidthsByMode: {
      compact: { [columnKey]: width },
      comfortable: { [columnKey]: width },
      spacious: { [columnKey]: width }
    },
    listMode: 'comfortable'
  }
}
```

---

## 7. Success Metrics

**Target Metrics:**
- 70% of users resize at least one column
- 50% of users use multiple list modes
- 40% of users use auto-sizing feature
- Column width persistence: > 95%
- User satisfaction: 4.5/5.0

---

## 8. Risk Assessment

**Risk:** Performance degradation with many columns
- **Mitigation:** Optimize resize calculations, use requestAnimationFrame, limit simultaneous resizes

**Risk:** Width preferences lost
- **Mitigation:** Robust localStorage handling, backup mechanisms, clear error messages

---

## 9. Implementation Plan

### 9.1. Phase 1: Core Resizing (Completed)
- ✅ Drag-and-drop resize implementation
- ✅ Width constraints
- ✅ Basic persistence

### 9.2. Phase 2: List Modes (Completed)
- ✅ Multiple list modes support
- ✅ Mode-specific width storage
- ✅ Mode selector

### 9.3. Phase 3: Auto-Sizing (Completed)
- ✅ Auto-size calculation
- ✅ Auto-size button
- ✅ Content-based width calculation

---

## 10. Acceptance Criteria

### 10.1. Resize Functionality
- ✅ Columns can be resized by dragging
- ✅ Resize handles visible and functional
- ✅ Width constraints enforced
- ✅ Resize persists across sessions

### 10.2. List Modes
- ✅ Three list modes available
- ✅ Mode-specific widths stored separately
- ✅ Switching modes loads correct widths
- ✅ Mode preference persists

### 10.3. Auto-Sizing
- ✅ Auto-size button works
- ✅ Columns auto-size to content
- ✅ Constraints respected during auto-size
- ✅ Performance acceptable

---

## 11. Dependencies

### 11.1. Technical Dependencies
- React 18+
- TypeScript
- localStorage API
- Feature flag system

### 11.2. Component Dependencies
- ListDetailTemplate
- Table preferences system
- Column configuration

---

## 12. Appendices

### 12.1. Default Column Widths

**Compact Mode:**
- Default: 100px
- Min: 60px
- Max: 400px

**Comfortable Mode:**
- Default: 150px
- Min: 60px
- Max: 600px

**Spacious Mode:**
- Default: 200px
- Min: 60px
- Max: 800px

### 12.2. Auto-Size Algorithm

```typescript
function calculateAutoWidth(
  columnKey: string,
  columnInfo: ColumnInfo,
  sampleData: any[]
): number {
  // Measure header text width
  const headerWidth = measureText(columnInfo.label)
  
  // Measure sample cell content widths
  const cellWidths = sampleData.map(item => 
    measureText(formatCellValue(item[columnKey]))
  )
  
  // Calculate optimal width
  const maxContentWidth = Math.max(headerWidth, ...cellWidths)
  const optimalWidth = maxContentWidth + 32 // padding
  
  // Apply constraints
  return Math.max(
    columnInfo.minWidth,
    Math.min(columnInfo.maxWidth, optimalWidth)
  )
}
```

---

**Document Status:** Draft  
**Last Updated:** January 2025  
**Next Review:** After enhancements

