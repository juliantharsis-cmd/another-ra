# System Configuration Workspace - Data Model Relationships

## Entity Relationship Overview

```
┌─────────────┐
│  Company    │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────┐
│  Division   │
└─────────────┘

┌─────────────────┐
│  Protocol       │
└────────┬────────┘
         │ N:M
         │
┌────────▼────────┐      ┌──────────────┐
│    EF GWP       │◄─────┤  GHG TYPE    │
│  (GWP Factors)  │ N:M  │              │
└────────┬────────┘      └──────┬───────┘
         │                       │
         │                       │
┌────────▼───────────────────────▼────────┐
│     Std Emission factors                  │
│     (Central Linking Table)              │
└────────┬─────────────────────────────────┘
         │
         │
┌────────▼────────┐
│ EF/Detailed G   │
└─────────────────┘

┌──────────────────────┐
│ Emission Factor Set  │
└──────────┬───────────┘
           │ 1:N
           │
┌──────────▼──────────────┐
│ Emission Factor Version │
└─────────────────────────┘

┌─────────────┐
│  Commodity  │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────────────┐
│ Activity Density    │
└──────┬─────────────┘
       │ N:1
       │
┌──────▼──────────────┐
│ Unit Conversion     │
└─────────────────────┘
```

## Detailed Relationships

### 1. Organizational Structure
- **Company** (1) ──< (N) **Division**
  - One company can have many divisions
  - Division has a reference to its parent company

### 2. Emission Factor Core
- **Protocol** (N) ──< (N) **EF GWP**
  - Many-to-many: Protocols can have multiple GWP factors
  - GWP factors can belong to multiple protocols

- **GHG TYPE** (N) ──< (N) **EF GWP**
  - Many-to-many: GHG types can have multiple GWP factors
  - GWP factors reference specific greenhouse gases

- **EF GWP** (N) ──< (N) **Std Emission factors**
  - Many-to-many: Standard emission factors link to GWP factors

- **GHG TYPE** (N) ──< (N) **Std Emission factors**
  - Many-to-many: Standard emission factors reference GHG types

- **EF/Detailed G** (N) ──< (N) **Std Emission factors**
  - Many-to-many: Detailed GHG factors link to standard factors

### 3. Emission Factor Versioning
- **Emission Factor Set** (1) ──< (N) **Emission Factor Version**
  - One set can have multiple versions
  - Versions track published, effective, and expiration dates

- **Emission Factor Version** (N) ──< (N) **Std Emission factors**
  - Versions contain multiple standard emission factors

### 4. Commodity & Activity
- **Commodity** (1) ──< (N) **Activity Density**
  - One commodity can have multiple activity density records
  - Activity density includes unit conversion information

- **Unit Conversion** (1) ──< (N) **Activity Density**
  - One unit conversion can be used by multiple activity densities
  - Defines conversion factors between units

## Key Tables by Purpose

### Configuration & Reference Data
- **Company**: Organizational entities
- **Division**: Sub-organizational units
- **Protocol**: Emission protocols (e.g., IPCC, GHG Protocol)
- **GHG TYPE**: Greenhouse gas types (CO2, CH4, N2O, etc.)

### Emission Factor Management
- **EF GWP**: Global Warming Potential factors
- **Std Emission factors**: Standard emission factor library
- **EF/Detailed G**: Detailed GHG-specific factors
- **Emission Factor Set**: Collections of emission factors
- **Emission Factor Version**: Versioned releases of factor sets

### Activity & Commodity Tracking
- **Commodity**: Commodity definitions
- **Activity Density**: Activity density calculations
- **Unit Conversion**: Unit conversion factors

### Application Management
- **Application list**: Registry of applications
- **Emission Factor Set Lifecycle Stage**: Lifecycle tracking

## Data Flow

1. **Emission Factor Definition Flow:**
   ```
   Protocol + GHG TYPE → EF GWP → Std Emission factors → EF/Detailed G
   ```

2. **Versioning Flow:**
   ```
   Emission Factor Set → Emission Factor Version → Std Emission factors
   ```

3. **Activity Calculation Flow:**
   ```
   Commodity → Activity Density → Unit Conversion
   ```

## Field Relationships Summary

| Source Table | Source Field | Target Table | Target Field | Relationship Type |
|-------------|--------------|--------------|--------------|-------------------|
| Division | Parent Company | Company | - | Many-to-One |
| EF GWP | Green House Gas | GHG TYPE | - | Many-to-One |
| EF GWP | Protocol | Protocol | - | Many-to-One |
| EF GWP | EF/Detailed G | EF/Detailed G | - | Many-to-Many |
| GHG TYPE | EF GWP | EF GWP | - | One-to-Many (inverse) |
| GHG TYPE | Std Emission factors | Std Emission factors | - | Many-to-Many |
| Emission Factor Version | Emission Factor Set | Emission Factor Set | - | Many-to-One |
| Emission Factor Version | Std Emission factors | Std Emission factors | - | Many-to-Many |
| Activity Density | Commodity | Commodity | - | Many-to-One |
| Activity Density | Unit Conversion | Unit Conversion | - | Many-to-One |

