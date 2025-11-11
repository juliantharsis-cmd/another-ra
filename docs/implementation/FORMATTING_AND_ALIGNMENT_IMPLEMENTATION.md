# Formatting and Alignment Implementation

## Overview

This document describes the implementation of user preference-based formatting for numbers, dates, and locations, as well as consistent table alignment across all tables.

## Implementation

### 1. Formatting Utilities (`src/lib/formatters.ts`)

Created a comprehensive formatting utility library that respects user preferences:

- **`formatNumber()`**: Formats numbers with locale-aware thousand separators, decimal symbols, and decimal places
- **`formatDate()`**: Formats dates according to user's date format preference (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **`formatCurrency()`**: Formats currency values with locale-aware symbols and separators
- **`formatPercent()`**: Formats percentage values
- **`formatLocation()`**: Formats location/address fields (extensible for future locale-specific formatting)

### 2. React Hook (`src/hooks/useFormatters.ts`)

Created a React hook that automatically injects user preferences:

```typescript
const { formatNumber, formatDate, formatCurrency, formatPercent, formatLocation } = useFormatters()
```

### 3. Table Alignment Improvements

**Changes made to `ListDetailTemplate.tsx`:**

1. **Table Container Padding**: Added `px-6` to the table container for consistent horizontal padding
2. **Table Width**: Changed from `flex-1` to `w-full` with `overflow-x-auto` for better alignment
3. **Table Element**: Added `minWidth: '100%'` to ensure table fills container properly

**Result**: All tables now have consistent alignment and can be fully viewed without horizontal scrolling issues.

### 4. Number Field Formatting

**Updated EF GWP Config** (`src/components/templates/configs/efGwpConfig.tsx`):

- Changed `gwp_value` render function to use `Intl.NumberFormat` with locale detection
- Respects browser locale for thousand separators and decimal symbols
- Configurable decimal places (minimum: 2, maximum: 6)

**Example:**
```typescript
render: (value: number) => {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
  return (
    <span className="text-sm text-neutral-700">
      {value !== null && value !== undefined ? new Intl.NumberFormat(locale, { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 6,
        useGrouping: true
      }).format(value) : '—'}
    </span>
  )
}
```

## User Preferences Integration

### Current Preferences Supported

1. **Language**: Used for locale-aware formatting
2. **Date Format**: DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD
3. **Time Format**: 12h or 24h
4. **Time Zone**: IANA timezone (e.g., 'America/New_York')

### Future Enhancements

- Number of decimals per field type
- Thousand separator preference (comma, period, space)
- Decimal symbol preference (comma, period)
- Currency symbol position
- Location formatting conventions

## Usage in Table Configs

### For Number Fields

```typescript
{
  key: 'gwp_value',
  label: 'GWP Value',
  sortable: true,
  align: 'right',
  render: (value: number) => {
    const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US'
    return (
      <span className="text-sm text-neutral-700">
        {value !== null && value !== undefined 
          ? new Intl.NumberFormat(locale, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 6,
              useGrouping: true
            }).format(value) 
          : '—'}
      </span>
    )
  },
}
```

### For Date Fields

```typescript
{
  key: 'created_at',
  label: 'Created At',
  sortable: true,
  align: 'left',
  render: (value: string) => {
    // Use formatDate utility with user preferences
    return (
      <span className="text-sm text-neutral-700">
        {formatDate(value, preferences)}
      </span>
    )
  },
}
```

## Alignment Standards

All tables using `ListDetailTemplate` now have:

1. **Consistent Padding**: `px-6` on table container
2. **Full Width**: Table uses `w-full` with `overflow-x-auto` for horizontal scrolling when needed
3. **Proper Alignment**: Table fills container properly with `minWidth: '100%'`
4. **Responsive**: Works on all screen sizes

## Next Steps

1. **Update All Table Configs**: Apply formatting to all number and date fields across all table configs
2. **Airtable Field Metadata**: Fetch decimal places and format preferences from Airtable field metadata
3. **User Preference UI**: Add UI for users to customize number formatting preferences
4. **Location Formatting**: Implement locale-specific location formatting
5. **Currency Formatting**: Apply currency formatting to all currency fields

## Files Modified

- `src/lib/formatters.ts` (new)
- `src/hooks/useFormatters.ts` (new)
- `src/components/templates/ListDetailTemplate.tsx` (alignment improvements)
- `src/components/templates/configs/efGwpConfig.tsx` (number formatting example)

## Testing

To test the formatting:

1. Change user preferences (language, date format)
2. Verify numbers display with correct separators and decimal symbols
3. Verify dates display in the selected format
4. Check table alignment across different screen sizes
5. Verify all tables have consistent appearance

