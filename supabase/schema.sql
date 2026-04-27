-- Create pcs table
CREATE TABLE IF NOT EXISTS public.pcs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    device_name TEXT UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'online'
);

-- Create logs table for continuous telemetry
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id TEXT REFERENCES public.pcs(id) ON DELETE CASCADE,
    cpu NUMERIC,
    ram NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create test_results table for manual tests
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pc_id TEXT REFERENCES public.pcs(id) ON DELETE CASCADE,
    cpu NUMERIC,
    ram NUMERIC,
    disk_speed NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create commands table 
CREATE TABLE IF NOT EXISTS public.commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    target TEXT REFERENCES public.pcs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.pcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commands ENABLE ROW LEVEL SECURITY;

-- Disable RLS for now to allow easier prototype testing without complicated policies
-- OR add simple policies: 

-- Allow reading all data to everyone
CREATE POLICY "Enable read access for all users" ON public.pcs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.logs FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.test_results FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.commands FOR SELECT USING (true);

-- Allow inserting for all (Agents)
CREATE POLICY "Enable insert for all users" ON public.pcs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for all users" ON public.commands FOR INSERT WITH CHECK (true);

-- Allow updates for agents updating last_seen
CREATE POLICY "Enable update for pcs" ON public.pcs FOR UPDATE USING (true);

-- Turn on Realtime for these tables
-- Run this to manually add the tables to the supabase realtime publication if needed
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pcs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commands;
ALTER PUBLICATION supabase_realtime ADD TABLE public.test_results;
