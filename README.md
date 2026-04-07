# PC Performance Monitoring System

**Note: This project is currently a Work In Progress (WIP).**

## Overview

The PC Performance Monitoring System is a full-stack application designed to track, visualize, and manage computer performance metrics in real-time. It consists of a web-based dashboard and a client-side agent, offering secure access, data visualization, and remote administrative controls.

## Architecture

The system is built on a modern technology stack separated into three primary components:

*   **Frontend Web Application:** Built with Next.js 14. It provides the user interface for authentication, device management, and real-time data visualization using Recharts.
*   **Backend & Database:** Powered by Supabase, handling PostgreSQL database operations, role-based authentication, and real-time data synchronization.
*   **Client Agent:** A Node.js-based telemetry agent that runs directly on the target machines to gather local hardware metrics.

## System Workflow

The end-to-end workflow of the monitoring system is structured as follows:

### 1. Agent Initialization and Telemetry Collection
The Node.js agent is deployed and executed on the host machine. It continuously interfaces with the local operating system to gather critical performance indicators, specifically central processing unit (CPU) utilization and random access memory (RAM) consumption.

### 2. Device Registration and Authentication
Users access the Next.js web application to authenticate their accounts. Devices running the agent generate specific identifiers to securely register themselves within the Supabase backend. The platform enforces role-based access control (RBAC), distinguishing between standard users and system administrators. 

### 3. Real-Time Data Ingestion
Once registered and authorized, the client agent begins securely transmitting the collected hardware metrics to the Supabase backend at defined intervals. This data rests in the PostgreSQL database and utilizes Supabase's real-time capabilities for immediate broadcast to connected web clients.

### 4. Data Visualization and Monitoring
The Next.js frontend subscribes to the telemetry data streams. For standard users, the application filters the incoming data to display only the metrics associated with their personal devices. This data is rendered into interactive graphs, allowing users to monitor their hardware stability over time.

### 5. Administrative Operations
Accounts with elevated administrative privileges have access to a global oversight dashboard. Administrators can view the performance metrics of all connected devices across the entire system. Furthermore, administrators have the capability to dispatch remote commands back to particular client agents, such as executing specific performance tests across the network.

## Setup Instructions
*(Detailed setup and deployment instructions for Next.js, Supabase, and the Node.js agent will be added in future updates.)*
