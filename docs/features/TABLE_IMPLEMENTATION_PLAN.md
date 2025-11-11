# Table Implementation Plan

This document tracks the implementation of 8 new tables following the Standard Emission Factors pattern.

## Tables to Implement

1. ✅ **Normalized Activities** - Types created
2. ⏳ **EF/Detailed G** - Types created
3. ⏳ **Scope** - Types created
4. ⏳ **scope & categorisation** - Types created
5. ⏳ **Unit** - Types created
6. ⏳ **Unit Conversion** - Types created
7. ⏳ **Standard ECM catalog** - Types created
8. ⏳ **Standard ECM Classification** - Types created

## Implementation Checklist (per table)

### Backend
- [ ] Types (`server/src/types/`)
- [ ] Service (`server/src/services/`)
- [ ] Controller (`server/src/controllers/`)
- [ ] Routes (`server/src/routes/`)
- [ ] Register route in `server/src/index.ts`

### Frontend
- [ ] API Client (`src/lib/api/`)
- [ ] Config (`src/components/templates/configs/`)
- [ ] Page (`src/app/spaces/emission-management/`)
- [ ] Layout (`src/app/spaces/emission-management/`)
- [ ] Add to Sidebar navigation

## Relationship Handling

Each table that has linked records needs:
- Relationship resolution in service
- Display of resolved names in frontend
- Proper field mapping for create/update operations

## Status

**Current Progress:** Types created for all 8 tables. Services, controllers, routes, and frontend files need to be created.

**Next Steps:** 
1. Create service files for all tables
2. Create controllers and routes
3. Create frontend API clients
4. Create frontend configs and pages
5. Update navigation

