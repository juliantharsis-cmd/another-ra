# Another RA

A web-based multi-space tool for system management, administration, and GHG emissions tracking.

## Overview

Another RA is a modern web application built with Next.js that provides multiple specialized spaces:

- **System Configuration Space**: Manage system settings, configurations, and parameters
- **Admin Space**: Administrative functions and user management
- **GHG Emission Space**: Track and manage greenhouse gas emissions data

## Features

- 🏗️ Multi-space architecture with dedicated areas for different functions
- 🔗 Airtable integration for data management
- 🎨 Modern, responsive UI built with Tailwind CSS
- ⚡ Fast and efficient with Next.js 14
- 🔒 Type-safe with TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Airtable account with API access (optional, for data integration)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```env
NEXT_PUBLIC_AIRTABLE_API_KEY=your_airtable_api_key
NEXT_PUBLIC_SYSTEM_CONFIG_BASE_ID=your_system_config_base_id
NEXT_PUBLIC_ADMIN_BASE_ID=your_admin_base_id
NEXT_PUBLIC_GHG_EMISSION_BASE_ID=your_ghg_emission_base_id
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
another-ra/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── spaces/            # Space-specific pages
│   │   │   ├── system-config/
│   │   │   ├── admin/
│   │   │   └── ghg-emission/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   └── SpaceNavigation.tsx
│   └── lib/                   # Utilities and helpers
│       └── airtable.ts        # Airtable integration
├── docs/                      # Documentation
├── data/                      # Data files
└── public/                    # Static assets
```

## Spaces

### System Configuration Space
Manage system-wide settings, integration configurations, security parameters, and data management settings.

### Admin Space
Administrative functions including user management, system logs, audit trails, and backup/restore operations.

### GHG Emission Space
Track greenhouse gas emissions with:
- Real-time emission tracking
- Data entry and management
- Reports and analytics
- Compliance monitoring

## Airtable Integration

The application includes Airtable integration utilities for seamless data management. Configure your Airtable bases in the environment variables to connect each space to its respective Airtable base.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technologies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Airtable** - Data management (optional)

## License

[Add your license here]
