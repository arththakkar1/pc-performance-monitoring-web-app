# Problem Statement and Tech Stack

## The Problem

Monitoring the hardware performance (CPU, RAM, Disk I/O) of a large fleet of personal computers or workstations typically involves installing background daemons (like Collectd, Telegraf, or Datadog agents) on every single device. 

These traditional agents present several issues:
1. **Resource Drain**: They continuously run in the background, consuming CPU and memory on the host machine even when no one is looking at the metrics.
2. **Cloud Costs**: They constantly ship telemetry data over the network to a centralized database, inflating network egress costs and database storage sizes with useless idle data.
3. **Security/Privilege**: They often require root or administrator-level system privileges to install and run as services, expanding the attack surface.

**The Solution**: A **Client-Driven Passive Monitoring System**. This project completely flips the model. There is no background agent to install. By navigating to the web dashboard, the user's browser temporarily becomes the monitoring agent. Hardware telemetry is only gathered and streamed while the dashboard is open, reducing background footprint and database bloat to absolute zero when not in use.

---

## Tech Stack

The system is built on a modern, high-performance web stack designed for real-time responsiveness and low overhead.

### Frontend
- **Next.js 16.2 (App Router)**: The core React framework handling routing and server integration.
- **React 19**: Leveraging the latest React features for efficient rendering.
- **Tailwind CSS v4 & Shadcn UI**: Providing a high-contrast, fully responsive, and accessible UI component library.
- **Recharts**: For dynamic, SVG-based data visualization that seamlessly reacts to Dark/Light mode theme changes.
- **Next-Themes**: For seamless dark mode handling across the dashboard.

### Backend & Telemetry
- **Node.js**: The underlying server runtime used by Next.js Server Actions.
- **systeminformation**: A critical Node.js package used within Server Actions to securely poll host OS hardware metrics (CPU load, RAM usage, Filesystem latency) without requiring native binaries.
- **Next.js Server Actions**: Used to bridge the gap between the client-side React UI and the secure server-side Node.js environment where hardware polling occurs.

### Database & Realtime Infrastructure
- **Supabase (PostgreSQL)**: Serves as the persistent database for fleet registration and historical diagnostic results.
- **Supabase Auth**: Manages user accounts and secures access to device data.
- **Supabase Realtime**: The backbone of the remote diagnostic feature. It acts as an event bus, broadcasting SQL `INSERT` commands to subscribed browsers, allowing administrators to trigger tests on remote machines instantly.
- **Row Level Security (RLS)**: Enforces strict data access rules directly at the database layer.
