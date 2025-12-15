# Quick Start Guide

## Prerequisites

- Node.js 16+ and npm
- Ohmni Simulation API server (running on port 5000)

## Installation Steps

### 1. Install Dependencies

```bash
cd /home/hoangnguyen/mysource/github/ohmni_web_client
npm install
```

### 2. Configure API URL (Optional)

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if your API server is on a different host/port:

```bash
REACT_APP_API_URL=http://localhost:5000
```

### 3. Start the API Server

In a separate terminal, start the Ohmni Simulation API:

```bash
cd /home/hoangnguyen/SimbaDevDocker/host/ohmni-simulation-gz-sim
source install/setup.bash
ros2 run ohmni_sim_api api_server.py
```

### 4. Start the Web Client

```bash
npm start
```

The application will automatically open at http://localhost:3000

## Using the Application

### Launch a Simulation

1. **Configure World**
   - Enter world name (default: "empty")
   - Toggle headless mode if running on server

2. **Configure Robot**
   - Enter a unique robot name (e.g., "robot1234")
   - Select robot type (Symbot or Minibot)
   - Set position (X, Y, Z in meters)
   - Set orientation (Roll, Pitch, Yaw in radians)

3. **Select Objects** (optional)
   - Click on objects to add them: box_mini, plastic_box, line_1000

4. **Select Environment** (optional)
   - Click on environment elements: inbound_driveway_rail, product_aisle_bay

5. **Launch**
   - Click "Launch Simulation" to start
   - Monitor status in the Active Simulations panel

### Manage Active Simulations

- View all running simulations in the right sidebar
- See uptime and process status
- Stop individual simulations
- Stop all simulations at once

### Validate Configuration

Click "Validate Config" to check your configuration without launching.

## Common Configurations

### Default Symbot Setup

```
Robot Name: robot1234
Robot Type: symbot
Position: (45.385, -5.797, 0.12)
Yaw: -0.7854 (≈ -45°)
Objects: box_mini, plastic_box, line_1000
Environment: inbound_driveway_rail, product_aisle_bay
```

### Test Setup at Origin

```
Robot Name: test_robot
Robot Type: symbot
Position: (0.0, 0.0, 0.12)
Yaw: 0.0
Objects: box_mini
Environment: (none)
```

## Orientation Helper

Yaw values (in radians):
- 0.0 = 0° (facing North/+X)
- 1.5708 = 90° (facing East/+Y)
- 3.1416 = 180° (facing South/-X)
- -1.5708 = -90° (facing West/-Y)
- ±0.7854 = ±45°

The UI shows both radians (input) and degrees (display).

## Troubleshooting

### "API: offline" Status

**Problem**: Cannot connect to API server

**Solutions**:
1. Check API server is running: `ros2 run ohmni_sim_api api_server.py`
2. Verify URL in `.env` matches server location
3. Check firewall settings

### Launch Fails

**Problem**: Simulation doesn't start

**Solutions**:
1. Verify robot name is filled in
2. Check API server logs for errors
3. Ensure ROS 2 workspace is sourced
4. Verify Gazebo is installed

### Page Won't Load

**Problem**: React app doesn't start

**Solutions**:
1. Run `npm install` to install dependencies
2. Check Node.js version (needs 16+)
3. Clear npm cache: `npm cache clean --force`
4. Delete `node_modules` and reinstall

## Development

### Project Structure

```
src/
├── components/
│   └── SimulationLauncher.js    # Main UI component
├── services/
│   ├── api.js                    # API client
│   └── config.js                 # Configuration
├── styles/
│   ├── index.css                 # Global styles
│   └── SimulationLauncher.css   # Component styles
├── App.js                        # Root component
└── index.js                      # Entry point
```

### Adding New Features

Edit `src/components/SimulationLauncher.js` for UI changes.

Edit `src/services/api.js` to add new API endpoints.

### Building for Production

```bash
npm run build
```

The optimized build will be in the `build/` directory.

### Deploying

Serve the build folder with any static file server:

```bash
# Using serve
npm install -g serve
serve -s build -p 3000

# Or using Python
cd build
python3 -m http.server 3000
```

## Tips

- Use the "Validate Config" button to test configurations
- Monitor the API status indicator in the header
- Active simulations auto-refresh every 3 seconds
- Each simulation gets a unique session ID
- Robot names must be unique per session

## Support

For issues with:
- **Web Client**: Check browser console (F12)
- **API Server**: Check terminal output
- **Simulation**: Check Gazebo output

## Next Steps

- Customize object/environment libraries in the API
- Add more robot types
- Implement custom world selection
- Add configuration presets
- Implement simulation recording
