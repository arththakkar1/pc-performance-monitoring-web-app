# How to Run the System Locally (Runbook)

This guide provides step-by-step instructions for getting the system running locally. 

## Prerequisites

- **Node.js**: `v20.x` or higher.
- **Git**: To clone the repository.
- **Supabase Account**: A free-tier Supabase project is sufficient.

---

## Step-by-Step Procedure

### 1. Setup Supabase Project
1. Create a new project on [Supabase](https://supabase.com/).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of `supabase/schema.sql` from this repository.
4. Paste it into the SQL Editor and click **Run**. This will create the required tables and configure Row Level Security (RLS) and Realtime publications.

### 2. Configure Environment Variables
In the root directory of your cloned repository, create a `.env` file. You need to provide your Supabase connection strings.

```env
# Find these in Supabase Dashboard -> Project Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-public-key>

# Required for Next.js to properly execute systeminformation
NEXT_RUNTIME=nodejs
```

### 3. Install NPM Dependencies
Use npm to install the Next.js, Shadcn, and Supabase dependencies.
```bash
npm install
```

### 4. Start the Application
Boot the Next.js development server:
```bash
npm run dev
```

### 5. Access the Platform
Navigate to `http://localhost:3000` in your web browser. 

---

## Troubleshooting & Escalation

### Issue: Hardware stats are returning `null` or crashing
- **Cause**: The `systeminformation` library requires native OS APIs. It may fail if running in an isolated Docker container without hardware privileges or on an unsupported OS.
- **Fix**: Ensure you are running `npm run dev` directly on your host machine (Windows, macOS, or Linux), not inside an Alpine-based Docker container or restricted sandbox.

### Issue: Remote tests are not triggering
- **Cause**: Supabase Realtime is not enabled for the `commands` table.
- **Fix**: Re-run the bottom section of `supabase/schema.sql` which drops and recreates the `supabase_realtime` publication:
  ```sql
  BEGIN;
    DROP PUBLICATION IF EXISTS supabase_realtime;
    CREATE PUBLICATION supabase_realtime;
  COMMIT;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pcs;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.commands;
  ```
