# Getting Started with the Monitoring System

This tutorial will show you how to register your first device and monitor its performance in real-time.

## 1. Register an Account
Navigate to the root URL of your deployed application (or `http://localhost:3000` if running locally). 
- You will be presented with a login/registration screen.
- Create a new account using your email and a secure password.

## 2. Register Your Device
Upon logging in, the system will detect that you are on a new device that hasn't been registered yet.
- You will be prompted to enter a "Display Name" for the current computer (e.g., "Main Workstation").
- Once submitted, the device is added to your fleet and associated with your user account.

## 3. View Live Telemetry
After registration, you will be redirected to the **Dashboard**.
- **The Magic of the Dashboard**: Without downloading any separate software, the dashboard will immediately begin displaying real-time gauges for your CPU and RAM usage. 
- This data is fetched directly from your machine using your browser session and is purely ephemeral (not saved to the database).

## 4. Run a Remote Diagnostic Test
To test the command pipeline:
1. Navigate to the **Admin Dashboard** (or Fleet view).
2. You will see your registered device in the list.
3. Click the "Run Test" or "Start Diagnostic" button next to your device.
4. The system will issue a command via Supabase Realtime. Your own browser session will pick up this command, execute an intensive diagnostic check (including disk speed), and save the result.
5. You can view the output of this test in the **Results** or **History** tabs.

Congratulations! You have successfully registered a device and executed a remote diagnostic test.
