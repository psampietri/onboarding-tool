# Access Request Automation Tool

This project is a complete solution for managing user onboarding and access requests, built with a modern technology stack.

## Project Structure

-   **/backend**: Contains the microservices-based backend.
-   **/frontend**: The React-based single-page application for the user interface.

## Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   PostgreSQL

## Setup and Installation

1.  **Database Setup**:
    -   Make sure you have PostgreSQL installed and running.
    -   Create a new database (e.g., `onboarding_db`).
    -   Run the SQL script located in `/backend/shared/config/schema.sql` to create the necessary tables.
    -   Update the database connection details in the `.env` files within each backend service directory if they differ from the defaults.

2.  **Install All Dependencies**:
    -   A helper script is provided to install all `npm` dependencies for the backend and frontend at once.
    -   First, make the script executable:
        ```bash
        chmod +x install-dependencies.sh
        ```
    -   Then, run the script:
        ```bash
        ./install-dependencies.sh
        ```

## Running the Application

1.  **Start the Backend Services**:
    -   Make the start script executable:
        ```bash
        chmod +x start-backend.sh
        ```
    -   Run the script:
        ```bash
        ./start-backend.sh
        ```
    This will open a new terminal window for each backend service.

2.  **Start the Frontend**:
    -   In a new terminal, navigate to the `/frontend` directory.
    -   Run `npm run dev`. The application will be available at `http://localhost:5173`.
