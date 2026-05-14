# PC Performance Monitoring System

![Dashboard View](../public/screenshots/Dark/Dark-1.png)

Welcome to the comprehensive documentation for the PC Performance Monitoring System. This platform provides real-time hardware telemetry and historical analytics through a high-contrast, demand-driven architecture. 

It is designed to give you centralized visibility into your device fleet without the heavy footprint of traditional background daemons.

## Documentation Structure

This documentation is structured according to the Diátaxis framework to help you find the exact information you need, when you need it:

*   **[Tutorials](tutorials/getting-started.md)**: Start here if you are new. Step-by-step guides to get your first device registered and monitored.
*   **[How-to Guides](how-to/run-locally.md)**: Goal-oriented practical guides for specific tasks, such as setting up the environment, deploying to Vercel, and configuring Supabase.
*   **[Reference](reference/database-schema.md)**: Technical reference material detailing the Supabase database schema, Row Level Security (RLS) policies, and the internal Next.js components.
*   **[Explanation](explanation/architecture.md)**: Deep dives into the system architecture, our Client-Driven Passive Agent model, and the reasoning behind our technology choices. Includes the [Problem Statement & Tech Stack](explanation/problem-statement.md).

## Why this project exists

Traditional PC performance monitoring requires installing background daemons (like Collectd, Telegraf, or Datadog agents). These agents constantly poll hardware stats and ship them over the network, consuming local resources and generating unnecessary cloud costs. 

This system takes a different approach: **Client-Driven Passive Monitoring**. It only monitors and streams telemetry when an administrator or user is actively viewing the dashboard or requests a diagnostic test.

## Quick Start (Under 5 Minutes)

1. Ensure you have Node.js 20+ installed.
2. Clone this repository and run `npm install`.
3. Create a Supabase project and run the SQL from `supabase/schema.sql`.
4. Copy your Supabase URL and Anon Key into a `.env` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key
   NEXT_RUNTIME=nodejs
   ```
5. Run `npm run dev` and navigate to `http://localhost:3000`.

*See the [Getting Started Tutorial](tutorials/getting-started.md) for full details.*

## Contributing

We welcome contributions! Please review the [Architecture](explanation/architecture.md) documentation to understand the data flow before submitting pull requests. Ensure all code passes `npm run lint` and adheres to our Shadcn UI + Tailwind v4 design system.
