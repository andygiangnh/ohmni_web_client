import React, { useState, useEffect } from 'react';
import { FaRobot, FaCube, FaTree, FaPlay, FaStop, FaCheckCircle, FaPlus } from 'react-icons/fa';
import api from '../services/api';
import '../styles/SimulationLauncher.css';

const SimulationLauncher = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('world');
  
  // Orientation input mode: 'rpy' or 'quaternion'
  const [orientationMode, setOrientationMode] = useState('rpy');

  // World configuration (no robot)
  const [worldConfig, setWorldConfig] = useState({
    world_name: 'empty',
    headless: false,
    objects: [],
    environments: []
  });

  // Robot configuration (for spawning)
  const [robotConfig, setRobotConfig] = useState({
    robot_name: '',
    robot_type: 'symbot',
    pose: {
      position: { x: 0.0, y: 0.0, z: 0.12 },
      orientation_rpy: { roll: 0.0, pitch: 0.0, yaw: 0.0 }
    }
  });

  const [availableObjects, setAvailableObjects] = useState([]);
  const [availableEnvironments, setAvailableEnvironments] = useState([]);
  const [activeSessions, setActiveSessions] = useState({});
  const [worldSessionId, setWorldSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');

  // Fetch available objects and environments on mount
  useEffect(() => {
    fetchResources();
    checkApiHealth();
    const interval = setInterval(fetchActiveSessions, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      await api.healthCheck();
      setApiStatus('healthy');
    } catch (err) {
      setApiStatus('offline');
    }
  };

  const fetchResources = async () => {
    try {
      const [objectsRes, envsRes] = await Promise.all([
        api.getObjects(),
        api.getEnvironments()
      ]);
      setAvailableObjects(objectsRes.objects || []);
      setAvailableEnvironments(envsRes.environments || []);
    } catch (err) {
      setError('Failed to fetch available resources');
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await api.getStatus();
      if (response.success && response.sessions) {
        setActiveSessions(response.sessions);
      }
    } catch (err) {
      // Silently fail for polling
    }
  };

  const handleWorldInputChange = (field, value) => {
    setWorldConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRobotInputChange = (field, value) => {
    setRobotConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePoseChange = (axis, value) => {
    setRobotConfig(prev => ({
      ...prev,
      pose: {
        ...prev.pose,
        position: {
          ...prev.pose.position,
          [axis]: parseFloat(value) || 0
        }
      }
    }));
  };

  const handleOrientationChange = (axis, value) => {
    setRobotConfig(prev => ({
      ...prev,
      pose: {
        ...prev.pose,
        orientation_rpy: {
          ...prev.pose.orientation_rpy,
          [axis]: parseFloat(value) || 0
        }
      }
    }));
  };

  const toggleObject = (obj) => {
    setWorldConfig(prev => ({
      ...prev,
      objects: prev.objects.includes(obj)
        ? prev.objects.filter(o => o !== obj)
        : [...prev.objects, obj]
    }));
  };

  const toggleEnvironment = (env) => {
    setWorldConfig(prev => ({
      ...prev,
      environments: prev.environments.includes(env)
        ? prev.environments.filter(e => e !== env)
        : [...prev.environments, env]
    }));
  };

  const handleLaunchWorld = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      const response = await api.launchWorld(worldConfig);
      if (response.success) {
        setWorldSessionId(response.session_id);
        setSuccess(`World launched successfully! Session ID: ${response.session_id}`);
        fetchActiveSessions();
      } else {
        setError(response.error || 'Failed to launch world');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to launch world');
    } finally {
      setLoading(false);
    }
  };

  const handleSpawnRobot = async () => {
    setError(null);
    setSuccess(null);

    if (!worldSessionId) {
      setError('Please launch a world first');
      return;
    }

    if (!robotConfig.robot_name.trim()) {
      setError('Robot name is required');
      return;
    }

    setLoading(true);
    try {
      // Convert orientation to quaternion if in RPY mode
      const { roll, pitch, yaw } = robotConfig.pose.orientation_rpy;
      const quaternion = rpyToQuaternion(roll, pitch, yaw);
      
      const payload = {
        world_session_id: worldSessionId,
        robot_name: robotConfig.robot_name,
        robot_type: robotConfig.robot_type,
        pose: {
          position: robotConfig.pose.position,
          orientation_rpy: robotConfig.pose.orientation_rpy
        }
      };
      const response = await api.spawnRobot(payload);
      if (response.success) {
        setSuccess(`Robot '${response.robot_name}' spawned successfully!`);
        fetchActiveSessions();
        // Reset robot name for next spawn
        setRobotConfig(prev => ({ ...prev, robot_name: '' }));
      } else {
        setError(response.error || 'Failed to spawn robot');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to spawn robot');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setError(null);
    setSuccess(null);

    if (!robotConfig.robot_name.trim()) {
      setError('Robot name is required');
      return;
    }

    setLoading(true);
    try {
      // Combine worldConfig and robotConfig for validation
      const configToValidate = {
        ...worldConfig,
        robot: robotConfig
      };
      const response = await api.validateConfig(configToValidate);
      if (response.success && response.valid) {
        setSuccess('Configuration is valid!');
      } else {
        setError('Configuration is invalid');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSimulation = async (sessionId) => {
    try {
      const response = await api.stopSimulation(sessionId);
      if (response.success) {
        setSuccess(`Stopped session: ${sessionId}`);
        // Reset worldSessionId if the stopped session was the world
        if (sessionId === worldSessionId) {
          setWorldSessionId(null);
          setActiveTab('world');
        }
        fetchActiveSessions();
      }
    } catch (err) {
      setError(`Failed to stop session: ${sessionId}`);
    }
  };

  const handleStopAll = async () => {
    try {
      const response = await api.stopAllSimulations();
      if (response.success) {
        setSuccess('All simulations stopped');
        // Reset worldSessionId since all sessions are stopped
        setWorldSessionId(null);
        setActiveTab('world');
        fetchActiveSessions();
      }
    } catch (err) {
      setError('Failed to stop all simulations');
    }
  };

  const degreesToRadians = (degrees) => (degrees * Math.PI / 180).toFixed(4);
  const radiansToDegrees = (radians) => (radians * 180 / Math.PI).toFixed(2);

  // Convert RPY (radians) to Quaternion
  const rpyToQuaternion = (roll, pitch, yaw) => {
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);

    return {
      x: sr * cp * cy - cr * sp * sy,
      y: cr * sp * cy + sr * cp * sy,
      z: cr * cp * sy - sr * sp * cy,
      w: cr * cp * cy + sr * sp * sy
    };
  };

  // Convert Quaternion to RPY (radians)
  const quaternionToRpy = (x, y, z, w) => {
    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (w * y - z * x);
    const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { roll, pitch, yaw };
  };

  return (
    <div className="simulation-launcher">
      <header className="header">
        <div className="header-content">
          <FaRobot className="logo-icon" />
          <h1>Ohmni Simulation Launcher</h1>
          <div className={`api-status ${apiStatus}`}>
            <span className="status-dot"></span>
            API: {apiStatus}
          </div>
        </div>
      </header>

      <div className="content">
        <div className="main-panel">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'world' ? 'active' : ''}`}
              onClick={() => setActiveTab('world')}
            >
              <FaCube /> World Configuration
            </button>
            <button
              className={`tab-button ${activeTab === 'robot' ? 'active' : ''}`}
              onClick={() => setActiveTab('robot')}
              disabled={!worldSessionId}
            >
              <FaRobot /> Robot Configuration
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* World Configuration Tab */}
            {activeTab === 'world' && (
              <>
                <section className="config-section">
                  <h2><FaCube /> World Settings</h2>
                  <div className="form-group">
                    <label>World Name</label>
                    <input
                      type="text"
                      value={worldConfig.world_name}
                      onChange={(e) => handleWorldInputChange('world_name', e.target.value)}
                      placeholder="empty"
                    />
                  </div>
                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={worldConfig.headless}
                        onChange={(e) => handleWorldInputChange('headless', e.target.checked)}
                      />
                      Headless Mode
                    </label>
                  </div>
                </section>

                {/* Objects Selection */}
                <section className="config-section">
                  <h2><FaCube /> Objects</h2>
                  <div className="selection-grid">
                    {availableObjects.map(obj => (
                      <div
                        key={obj}
                        className={`selection-item ${worldConfig.objects.includes(obj) ? 'selected' : ''}`}
                        onClick={() => toggleObject(obj)}
                      >
                        <FaCube />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Environment Selection */}
                <section className="config-section">
                  <h2><FaTree /> Environment</h2>
                  <div className="selection-grid">
                    {availableEnvironments.map(env => (
                      <div
                        key={env}
                        className={`selection-item ${worldConfig.environments.includes(env) ? 'selected' : ''}`}
                        onClick={() => toggleEnvironment(env)}
                      >
                        <FaTree />
                        <span>{env}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* World Launch Button */}
                <section className="actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleLaunchWorld}
                    disabled={loading || worldSessionId}
                  >
                    <FaPlay /> {loading ? 'Launching...' : worldSessionId ? 'World Active' : 'Launch World'}
                  </button>
                  {worldSessionId && (
                    <div className="info-box">
                      <FaCheckCircle className="success-icon" />
                      <span>World Session: {worldSessionId}</span>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Robot Configuration Tab */}
            {activeTab === 'robot' && worldSessionId && (
              <>
                <section className="config-section">
                  <h2><FaRobot /> Robot Configuration</h2>
                  <div className="info-box">
                    <FaCheckCircle className="success-icon" />
                    <span>Active World: {worldSessionId}</span>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Robot Name *</label>
                      <input
                        type="text"
                        value={robotConfig.robot_name}
                        onChange={(e) => handleRobotInputChange('robot_name', e.target.value)}
                        placeholder="robot1"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Robot Type</label>
                      <select
                        value={robotConfig.robot_type}
                        onChange={(e) => handleRobotInputChange('robot_type', e.target.value)}
                      >
                        <option value="symbot">Symbot</option>
                        <option value="minibot">Minibot</option>
                      </select>
                    </div>
                  </div>

                  <h3>Position (meters)</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>X</label>
                      <input
                        type="number"
                        step="0.1"
                        value={robotConfig.pose.position.x}
                        onChange={(e) => handlePoseChange('x', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Y</label>
                      <input
                        type="number"
                        step="0.1"
                        value={robotConfig.pose.position.y}
                        onChange={(e) => handlePoseChange('y', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Z</label>
                      <input
                        type="number"
                        step="0.01"
                        value={robotConfig.pose.position.z}
                        onChange={(e) => handlePoseChange('z', e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <h3>Orientation</h3>
                    <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center', marginBottom: 0 }}>
                      <label style={{ marginBottom: 0 }}>Input Mode:</label>
                      <select
                        value={orientationMode}
                        onChange={(e) => setOrientationMode(e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        <option value="rpy">Roll-Pitch-Yaw</option>
                        <option value="quaternion">Quaternion</option>
                      </select>
                    </div>
                  </div>

                  {orientationMode === 'rpy' ? (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Roll (radians)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={robotConfig.pose.orientation_rpy.roll}
                          onChange={(e) => handleOrientationChange('roll', e.target.value)}
                        />
                        <small>{radiansToDegrees(robotConfig.pose.orientation_rpy.roll)}°</small>
                      </div>
                      <div className="form-group">
                        <label>Pitch (radians)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={robotConfig.pose.orientation_rpy.pitch}
                          onChange={(e) => handleOrientationChange('pitch', e.target.value)}
                        />
                        <small>{radiansToDegrees(robotConfig.pose.orientation_rpy.pitch)}°</small>
                      </div>
                      <div className="form-group">
                        <label>Yaw (radians)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={robotConfig.pose.orientation_rpy.yaw}
                          onChange={(e) => handleOrientationChange('yaw', e.target.value)}
                        />
                        <small>{radiansToDegrees(robotConfig.pose.orientation_rpy.yaw)}°</small>
                      </div>
                    </div>
                  ) : (
                    <div className="form-row">
                      <div className="form-group">
                        <label>X</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={rpyToQuaternion(
                            robotConfig.pose.orientation_rpy.roll,
                            robotConfig.pose.orientation_rpy.pitch,
                            robotConfig.pose.orientation_rpy.yaw
                          ).x.toFixed(4)}
                          onChange={(e) => {
                            const quat = rpyToQuaternion(
                              robotConfig.pose.orientation_rpy.roll,
                              robotConfig.pose.orientation_rpy.pitch,
                              robotConfig.pose.orientation_rpy.yaw
                            );
                            quat.x = parseFloat(e.target.value) || 0;
                            const rpy = quaternionToRpy(quat.x, quat.y, quat.z, quat.w);
                            setRobotConfig(prev => ({
                              ...prev,
                              pose: {
                                ...prev.pose,
                                orientation_rpy: rpy
                              }
                            }));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Y</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={rpyToQuaternion(
                            robotConfig.pose.orientation_rpy.roll,
                            robotConfig.pose.orientation_rpy.pitch,
                            robotConfig.pose.orientation_rpy.yaw
                          ).y.toFixed(4)}
                          onChange={(e) => {
                            const quat = rpyToQuaternion(
                              robotConfig.pose.orientation_rpy.roll,
                              robotConfig.pose.orientation_rpy.pitch,
                              robotConfig.pose.orientation_rpy.yaw
                            );
                            quat.y = parseFloat(e.target.value) || 0;
                            const rpy = quaternionToRpy(quat.x, quat.y, quat.z, quat.w);
                            setRobotConfig(prev => ({
                              ...prev,
                              pose: {
                                ...prev.pose,
                                orientation_rpy: rpy
                              }
                            }));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Z</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={rpyToQuaternion(
                            robotConfig.pose.orientation_rpy.roll,
                            robotConfig.pose.orientation_rpy.pitch,
                            robotConfig.pose.orientation_rpy.yaw
                          ).z.toFixed(4)}
                          onChange={(e) => {
                            const quat = rpyToQuaternion(
                              robotConfig.pose.orientation_rpy.roll,
                              robotConfig.pose.orientation_rpy.pitch,
                              robotConfig.pose.orientation_rpy.yaw
                            );
                            quat.z = parseFloat(e.target.value) || 0;
                            const rpy = quaternionToRpy(quat.x, quat.y, quat.z, quat.w);
                            setRobotConfig(prev => ({
                              ...prev,
                              pose: {
                                ...prev.pose,
                                orientation_rpy: rpy
                              }
                            }));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label>W</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={rpyToQuaternion(
                            robotConfig.pose.orientation_rpy.roll,
                            robotConfig.pose.orientation_rpy.pitch,
                            robotConfig.pose.orientation_rpy.yaw
                          ).w.toFixed(4)}
                          onChange={(e) => {
                            const quat = rpyToQuaternion(
                              robotConfig.pose.orientation_rpy.roll,
                              robotConfig.pose.orientation_rpy.pitch,
                              robotConfig.pose.orientation_rpy.yaw
                            );
                            quat.w = parseFloat(e.target.value) || 0;
                            const rpy = quaternionToRpy(quat.x, quat.y, quat.z, quat.w);
                            setRobotConfig(prev => ({
                              ...prev,
                              pose: {
                                ...prev.pose,
                                orientation_rpy: rpy
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* Robot Spawn Button */}
                <section className="actions">
                  <button
                    className="btn btn-success"
                    onClick={handleSpawnRobot}
                    disabled={loading}
                  >
                    <FaPlus /> {loading ? 'Spawning...' : 'Spawn Robot'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleValidate}
                    disabled={loading}
                  >
                    <FaCheckCircle /> Validate Config
                  </button>
                </section>
              </>
            )}
          </div>

          {/* Messages */}
          {error && <div className="message error">{error}</div>}
          {success && <div className="message success">{success}</div>}
        </div>

        {/* Active Simulations Sidebar */}
        <aside className="sidebar">
          <h2>Active Simulations</h2>
          {Object.keys(activeSessions).length === 0 ? (
            <p className="no-sessions">No active simulations</p>
          ) : (
            <>
              <div className="sessions-list">
                {Object.entries(activeSessions).map(([sessionId, session]) => (
                  <div key={sessionId} className="session-card">
                    <div className="session-header">
                      <strong>{sessionId}</strong>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleStopSimulation(sessionId)}
                      >
                        <FaStop /> Stop
                      </button>
                    </div>
                    <div className="session-info">
                      <div>Bridge: {session.bridge_running ? '✓' : '✗'}</div>
                      <div>Spawn: {session.spawn_running ? '✓' : '✗'}</div>
                      <div>Uptime: {session.uptime?.toFixed(1)}s</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-danger btn-block"
                onClick={handleStopAll}
              >
                <FaStop /> Stop All
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SimulationLauncher;
