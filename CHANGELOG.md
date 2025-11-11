# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Versioning framework documentation
- CHANGELOG.md for tracking changes
- Automated release script (scripts/release.ps1)

## [1.0.0] - 2025-01-15

### Added
- Welcome Dashboard with AI Assistant analysis feature
  - Animated KPI cards
  - AI Assistant icon with sub-menu (3 analysis types)
  - Slide-out animations with gravitation effect
  - Analysis overlay with typewriter effect and KPI highlighting
  - Three analysis types: Overview, Trends, Recommendations
  - Persistent filtering preference (don't show again)
- Attachment management system with Airtable and PostgreSQL support
  - Upload/remove functionality
  - Attachment rendering in list mode
- User Roles and Industry Classification tables
- Companies table with pagination
- System configuration space
- Admin space
- GHG Emission management space
- Emission factor version table
- Field ID mapping system
- Persistent filtering feature flag
- Codespaces CORS and API URL configuration

### Fixed
- Filter persistence and double API call issue
- Bottom banner visibility during transitions

---

**Note**: This changelog will be updated with each release. See [docs/VERSIONING_FRAMEWORK.md](docs/VERSIONING_FRAMEWORK.md) for versioning guidelines.

