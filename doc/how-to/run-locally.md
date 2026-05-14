# How to Run the System Locally

This guide will walk you through setting up and running the PC Performance Monitoring System on your local machine for development or testing.

## Prerequisites

- **Node.js**: Version 20 or higher is required.
- **Supabase**: You must have an active Supabase project instance.

## Step 1: Configure Supabase Database
Your Supabase project requires a specific schema and Realtime configurations.
1. Go to your Supabase project dashboard.
2. Navigate to the SQL Editor.
3. Copy the contents of `supabase/schema.sql` from this repository and run it. This will create the `pcs`, `logs`, `test_results`, and `commands` tables, and enable Realtime for them.

## Step 2: Environment Variables
Create a `.env` file in the root directory of the repository and populate it with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_RUNTIME=nodejs
```

## Step 3: Install Dependencies
Open your terminal in the project root and install the required NPM packages:

```bash
npm install
```

## Step 4: Start the Development Server
Run the Next.js development server:

```bash
npm run dev
```

## Step 5: Access the Application
Open your browser and navigate to `http://localhost:3000`. 
- Since you are running it locally, the device you open it on will be the device being monitored.
- You can register an account, and the current machine will be added to your fleet.
