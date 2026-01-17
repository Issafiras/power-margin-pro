# Power Margin Optimizer Pro

## Overview

Power Margin Optimizer Pro is a Danish-language web application designed for Power.dk sales personnel to identify high-margin laptop products. The tool allows users to search for products by SKU or model name, then displays the searched product alongside alternative laptops that offer higher profit margins. The application extracts and compares hardware specifications (CPU, GPU, RAM) to help salespeople recommend suitable alternatives to customers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with dark mode only (Power.dk orange/slate branding)
- **Build Tool**: Vite with React plugin

The frontend follows a single-page application pattern with a simple route structure. The main Dashboard page handles product search and displays results in a responsive grid layout with a ProductCard for the main product and AlternativesTable for high-margin alternatives.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api` prefix
- **External API Integration**: Proxies requests to Power.dk's product API (`power.dk/api/v2/productlists`)

The server acts as a proxy to the Power.dk API, fetching laptop products and enriching them with margin analysis and specification extraction. User agent rotation is implemented to avoid rate limiting.

### Data Flow
1. User searches for a product via the frontend
2. Frontend calls `/api/search?q={query}` endpoint
3. Backend fetches products from Power.dk API
4. Backend extracts specs (CPU, GPU, RAM) from product names using regex patterns
5. Backend marks products as high-margin based on business logic
6. Frontend displays results with comparison features

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts`
- **Products Table**: Stores synchronized laptop products from Power.dk API with specs and margin data

The database stores synchronized laptop products via the "Synkroniser Database" feature. When products are synced:
1. All 359 laptops are fetched from Power.dk API and stored in PostgreSQL
2. Products are enriched with extracted specs (CPU, GPU, RAM, Storage)
3. High-margin status is calculated and stored
4. Search alternatives are fetched directly from the database when products exist

### Key Design Decisions
- **Proxy Architecture**: Backend proxies Power.dk API to avoid CORS issues and add margin analysis
- **Dark Mode Only**: Enforces consistent branding with Power.dk's color scheme
- **Spec Extraction**: Uses regex pattern matching on product names rather than structured API data
- **In-Memory Storage**: User storage uses in-memory Map (MemStorage class) rather than database

## External Dependencies

### Third-Party Services
- **Power.dk API**: Primary data source for laptop products (`https://www.power.dk/api/v2/productlists`)
- **Google Fonts**: DM Sans, Fira Code, Geist Mono font families

### Key NPM Packages
- **UI**: Radix UI primitives, shadcn/ui components, Lucide icons, Embla Carousel
- **Data**: TanStack React Query, Axios, Zod for validation, Drizzle ORM
- **Forms**: React Hook Form with Zod resolver
- **Utilities**: date-fns, class-variance-authority, clsx, tailwind-merge

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **connect-pg-simple**: PostgreSQL session store (available but not actively used)

### Development Tools
- **Vite**: Frontend build and dev server with HMR
- **esbuild**: Production server bundling
- **Drizzle Kit**: Database migrations (`npm run db:push`)
- **Replit Plugins**: Error overlay, cartographer, dev banner for Replit environment