# Database Schema Reference

The system relies on Supabase (PostgreSQL) for persistence and realtime functionality. 

## Tables

### 1. `pcs`
Stores the registered devices within the fleet.
- `id` (TEXT, PK): Unique identifier for the PC.
- `name` (TEXT): Human-readable name provided during registration.
- `device_name` (TEXT, UNIQUE): The system-level hostname.
- `user_id` (UUID, FK): References the authenticated user (`auth.users`) who registered the PC.
- `last_seen` (TIMESTAMP): Last time the PC checked in.
- `status` (TEXT): Current status (e.g., 'online', 'offline').

### 2. `logs`
Stores continuous telemetry data.
- `id` (UUID, PK): Auto-generated ID.
- `pc_id` (TEXT, FK): References the PC in the `pcs` table.
- `cpu` (NUMERIC): CPU load percentage.
- `ram` (NUMERIC): RAM usage percentage.
- `created_at` (TIMESTAMP): Time of logging.

### 3. `test_results`
Stores comprehensive data from manual, admin-invoked diagnostics.
- `id` (UUID, PK): Auto-generated ID.
- `pc_id` (TEXT, FK): References the PC.
- `cpu` (NUMERIC): CPU load percentage.
- `ram` (NUMERIC): RAM usage percentage.
- `disk_speed` (NUMERIC): Disk I/O performance metric.
- `created_at` (TIMESTAMP): Time of test completion.

### 4. `commands`
Acts as an action queue for remote commands sent to devices.
- `id` (UUID, PK): Auto-generated ID.
- `type` (TEXT): The type of command (e.g., `START_TEST`).
- `target` (TEXT, FK): References the `pcs` table.
- `created_at` (TIMESTAMP): Time the command was issued.

## Security & Realtime

- **Row Level Security (RLS)** is enabled on all tables. In the current prototype structure (as defined in `supabase/schema.sql`), policies are permissive to allow agents and users to insert/select data freely, but can be tightened for production.
- **Supabase Realtime** is enabled via the `supabase_realtime` publication for all four tables. This is critical for the application's core functionality, enabling immediate UI updates and remote command execution.
