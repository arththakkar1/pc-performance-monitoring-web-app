# PC Performance Monitoring System

A centralized hardware performance monitoring platform and diagnostic dashboard. This system provides real-time hardware telemetry and historical analytics through a high-contrast, demand-driven architecture.

## Primary Features

### Demand-Driven Monitoring
The application utilizes a local-first monitoring model that eliminates persistent background network traffic. Hardware metrics are retrieved on-demand by the client interface, significantly reducing server overhead and local resource consumption.

### Local Telemetry Dashboard
Real-time metrics for central processing units (CPU) and random-access memory (RAM) are fetched directly from the host system. This data is displayed locally to provide immediate feedback without unnecessary database persistence.

### Administrative Diagnostics
Administrators possess the authorization to trigger full system diagnostic tests across the registered device fleet. These tests include disk input/output performance measurements and are persisted to the database for long-term reporting.

### Historical Performance Analytics
The platform provides comprehensive visualization of performance trends. Charts are engineered to be theme-aware, utilizing dynamic color resolution to maintain legibility across both light and dark system color schemes.

### Activity Logging and Auditing
A dedicated history component provides searchable and filterable access to all previous diagnostic results and continuous telemetry logs. Data is organized by device classification and temporal ranges.

## Technical Specification

- **Core Framework**: Next.js 16 (App Router)
- **Data Architecture**: Supabase (PostgreSQL, Authentication, Realtime)
- **Visualization**: Recharts (Dynamic SVG Rendering)
- **Typography and UI**: High-contrast monochromatic design system

## Operational Architecture

The system operates on a client-driven synchronization model:
1. **Host Discovery**: Devices are uniquely identified and registered within the Supabase ecosystem.
2. **On-Demand Retrieval**: The user interface invokes server actions to gather system-level metrics via the `systeminformation` library.
3. **Persistence Logic**: Database write operations are reserved for formal diagnostic events and administrator-requested sessions.
4. **Theme Synchronization**: UI components utilize CSS variables and hook-based theme detection for consistent visual fidelity.

## Deployment and Installation

### Prerequisites
- Node.js runtime environment (LTS version)
- Active Supabase project instance

### Configuration
A `.env` file must be provisioned in the root directory with the following parameters:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
NEXT_RUNTIME=nodejs
```

### Initialization
```bash
npm install
npm run dev
```

## System Workflows

### Standard User Procedures
- Device registration and configuration.
- Real-time local metric monitoring.
- Personal diagnostic history review and analytics.

### Administrator Procedures
- Global device fleet oversight.
- Execution of remote diagnostic protocols.
- Comparative system analytics across the infrastructure.

## License
MIT License
