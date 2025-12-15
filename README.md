# Ohmni Web Client

Web-based client for launching and managing Gazebo simulations.

## Prerequisites

- Node.js 16+ and npm
- Ohmni Simulation API server running

## Installation

```bash
npm install
```

## Configuration

Edit `src/services/config.js` to set your API server URL:

```javascript
export const API_BASE_URL = 'http://localhost:5000';
```

## Running

```bash
npm start
```

The application will open at http://localhost:3000

## Building

```bash
npm run build
```

## Features

- Launch Gazebo simulations with custom configurations
- Configure robot pose (position and orientation)
- Select objects and environments to spawn
- Monitor active simulations
- Stop running simulations
- Validate configurations before launching

## Usage

1. **Start the API Server** (in another terminal):
   ```bash
   ros2 run ohmni_sim_api api_server.py
   ```

2. **Start the Web Client**:
   ```bash
   npm start
   ```

3. **Configure and Launch**:
   - Fill in the simulation configuration form
   - Select objects and environments
   - Click "Launch Simulation"
   - Monitor the status in the Active Simulations panel
