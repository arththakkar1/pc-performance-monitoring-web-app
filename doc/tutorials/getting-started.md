# Tutorial: Getting Started with PC Monitoring

This tutorial is an onboarding guide to get you up and running with the PC Performance Monitoring System. By the end of this tutorial, you will have registered your current machine and executed a remote diagnostic test on it.

## Step 1: Create an Account

1. Navigate to your application's base URL (e.g., `http://localhost:3000`).
2. You will see the Login/Registration portal. 
3. Switch to the **Register** tab and enter a valid email and password.
4. Click **Create Account**.

![Login and Registration View](../public/screenshots/Dark/Dark-6.png)

*Behind the scenes*: This leverages Supabase Auth to create a secure session.

## Step 2: Register Your First Device

Because the application uses a **Client-Driven Passive Agent** model, your browser acts as the monitoring agent. 

1. Immediately after logging in, the application will detect that your current machine is unknown to the database.
2. A prompt will appear asking you to name the device.
3. Type in a recognizable name, such as `"MacBook Pro - Work"`.
4. Click **Register Device**.

Your device's hostname and hardware profile are now linked to your user account in the `pcs` table.

## Step 3: Observe Live Telemetry

Once registered, you are dropped into the main **Dashboard**.

Watch the circular gauges for CPU and RAM. You should see them ticking up and down every few seconds. 

![Live Telemetry Dashboard](../public/screenshots/Dark/Dark-1.png)

- Try opening a heavy application or running a build script in the background. You will see the CPU gauge instantly reflect the system load.
- *Note: This telemetry is ephemeral. It is flowing from your operating system, through Next.js Server Actions, directly into the React UI. It is not bloating your database.*

## Step 4: Run a Diagnostic Test

Now let's simulate an Administrator running a heavy diagnostic test remotely.

1. Using the top navigation bar, click on **Admin Dashboard** (or the **Fleet** view).
2. You will see a table listing all registered devices. Your newly registered device will be listed with an `"online"` status.
3. Locate the **Action** column next to your device and click **Run Test**.
4. You will see a small toast notification indicating the command was dispatched.
5. Behind the scenes, the system just wrote an event to the database, which bounced back to your browser session, triggering an intense hardware scan.
6. Navigate to the **Results** or **History** tab using the top nav. You will see a brand new log entry containing CPU, RAM, and Disk Speed metrics. 

![History and Results View](../public/screenshots/Dark/Dark-3.png)

You've successfully completed the onboarding loop! You can now access this URL from any other computer, register it, and use this central dashboard to run tests on all of them.
