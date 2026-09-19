# Running Mobitez Locally

This guide explains how to set up and run the Mobitez e-commerce website on your local machine.

## Prerequisites

Ensure you have the following installed on your system:
* [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
* npm (automatically installed with Node.js)

---

## Setup Instructions

### 1. Extract Project Files
If your project files are in a zip or tar archive, extract them into a dedicated folder on your local machine:
```bash
# Example for zip file
unzip mobitez-project.zip -d mobitez-local
cd mobitez-local
```

### 2. Install Dependencies
Run the following command to download and install all package dependencies listed in `package.json`:
```bash
npm install
```

### 3. Configure Environment Variables
Create a file named `.env` in the root of the project folder (the same directory as `server.js` and `package.json`). Populate it with the following configuration:
```env
PORT=3055
API_BASE_URL=https://seller.webintez.com/api
API_KEY=mHRT3jvUD7tqSVy+iPIn3DE+wyuJXcBeLaPIjBGVHMo=
```
* **PORT**: The local port number the server will run on (defaults to `3055`).
* **API_BASE_URL**: The backend API endpoint URL.
* **API_KEY**: The API Key required to authenticate proxy requests with the backend seller server.

---

## Running the Application

Choose one of the following commands to launch the server:

### A. Development Mode (Recommended)
This runs the server using `nodemon`. The server will automatically reload whenever you make changes to any of the code or styles:
```bash
npm run dev
```

### B. Standard Mode
This runs the server normally using Node:
```bash
npm start
```

Once started, open your web browser and navigate to:
**[http://localhost:3055](http://localhost:3055)**

---

## Troubleshooting

### Directory Structure & Static Files Warning
In the production environment, static files may be expected inside a directory named `/public`. If the server fails to load pages or throws `ENOENT` errors locally:
1. Ensure your static HTML, CSS (`/css`), and JS (`/js`) assets are placed in the directory structure expected by `server.js` (e.g., if `server.js` refers to `path.join(__dirname, 'public', 'index.html')`, you may need to move your assets into a `/public` subfolder, or modify `server.js` line 191/paths to serve from the root directory `__dirname` directly).
