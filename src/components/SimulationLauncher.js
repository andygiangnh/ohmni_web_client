import React, { useState, useEffect } from 'react';
import { FaRobot, FaCube, FaTree, FaPlay, FaStop, FaCheckCircle, FaPlus, FaTrash } from 'react-icons/fa';
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
    objects: [],      // Will be array of object instances
    environments: []  // Will be array of environment instances
  });
  
  // Object/Environment type definitions
  const objectTypes = {
    box_mini: { name: 'Box Mini', icon: '📦', defaultPose: { x: 1.3, y: 18.7, z: 2.82, qx: 0, qy: 0, qz: 0, qw: 1 } },
    plastic_box: { name: 'Plastic Box', icon: '🗃️', defaultPose: { x: 41.335468, y: 9.3227, z: 0.444936, qx: 0, qy: 0, qz: 0.7071068, qw: 0.7071068 } },
    line_1000: { name: 'Line 1000', icon: '➖', defaultPose: { x: 45.385, y: 3.750, z: 0, qx: 0, qy: 0, qz: 0, qw: 1 } }
  };
  
  const environmentTypes = {
    inbound_driveway_rail: { name: 'Inbound Driveway Rail', icon: '🛤️', defaultPose: { x: 44.96, y: -7.0, z: -0.003569, qx: 0, qy: 0, qz: 1, qw: 0 } },
    product_aisle_bay: { name: 'Product Aisle Bay', icon: '🏪', defaultPose: { x: 40.999336, y: 8.435519, z: -0.030416, qx: 0, qy: 0, qz: 0, qw: 1 } }
  };
  
  // State for adding new objects/environments
  const [newObjectType, setNewObjectType] = useState('box_mini');
  const [newObjectPose, setNewObjectPose] = useState(objectTypes.box_mini.defaultPose);
  const [newEnvironmentType, setNewEnvironmentType] = useState('inbound_driveway_rail');
  const [newEnvironmentPose, setNewEnvironmentPose] = useState(environmentTypes.inbound_driveway_rail.defaultPose);

  // Robot configuration (for spawning)
  const [robotConfig, setRobotConfig] = useState({
    robot_name: '',
    robot_type: 'symbot',
    pose: {
      position: { x: 0.0, y: 0.0, z: 0.12 },
      orientation_rpy: { roll: 0.0, pitch: 0.0, yaw: 0.0 }
    }
  });

  const [activeSessions, setActiveSessions] = useState({});
  const [worldSessionId, setWorldSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiStatus, setApiStatus] = useState('unknown');

  // Check API health and fetch sessions on mount
  useEffect(() => {
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

  // Handlers for adding/removing objects
  const handleAddObject = () => {
    const newInstance = {
      id: Date.now(), // Unique ID
      type: newObjectType,
      name: `${newObjectType}_${worldConfig.objects.length + 1}`,
      pose: { ...newObjectPose }
    };
    setWorldConfig(prev => ({
      ...prev,
      objects: [...prev.objects, newInstance]
    }));
  };

  const handleRemoveObject = (id) => {
    setWorldConfig(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== id)
    }));
  };

  const handleAddEnvironment = () => {
    const newInstance = {
      id: Date.now(),
      type: newEnvironmentType,
      name: `${newEnvironmentType}_${worldConfig.environments.length + 1}`,
      pose: { ...newEnvironmentPose }
    };
    setWorldConfig(prev => ({
      ...prev,
      environments: [...prev.environments, newInstance]
    }));
  };

  const handleRemoveEnvironment = (id) => {
    setWorldConfig(prev => ({
      ...prev,
      environments: prev.environments.filter(env => env.id !== id)
    }));
  };

  // Handler when object type changes - update pose to default
  const handleObjectTypeChange = (type) => {
    setNewObjectType(type);
    setNewObjectPose(objectTypes[type].defaultPose);
  };

  const handleEnvironmentTypeChange = (type) => {
    setNewEnvironmentType(type);
    setNewEnvironmentPose(environmentTypes[type].defaultPose);
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
                  
                  {/* Add Object Form */}
                  <div className="add-item-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Type</label>
                        <select 
                          value={newObjectType} 
                          onChange={(e) => handleObjectTypeChange(e.target.value)}
                        >
                          {Object.entries(objectTypes).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.icon} {value.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Position X</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={newObjectPose.x}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Position Y</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={newObjectPose.y}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Position Z</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={newObjectPose.z}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>

                    {/* Orientation (Quaternion) */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Quat X</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newObjectPose.qx}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, qx: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quat Y</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newObjectPose.qy}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, qy: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quat Z</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newObjectPose.qz}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, qz: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quat W</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newObjectPose.qw}
                          onChange={(e) => setNewObjectPose(prev => ({ ...prev, qw: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <button className="btn btn-secondary" onClick={handleAddObject}>
                      <FaPlus /> Add Object
                    </button>
                  </div>

                  {/* List of added objects */}
                  {worldConfig.objects.length > 0 && (
                    <div className="added-items-list">
                      <h3>Added Objects ({worldConfig.objects.length})</h3>
                      {worldConfig.objects.map(obj => (
                        <div key={obj.id} className="added-item">
                          <span className="item-icon">{objectTypes[obj.type].icon}</span>
                          <span className="item-name">{obj.name}</span>
                          <span className="item-type">({objectTypes[obj.type].name})</span>
                          <span className="item-pos">
                            [{obj.pose.x.toFixed(2)}, {obj.pose.y.toFixed(2)}, {obj.pose.z.toFixed(2)}]
                          </span>
                          <button 
                            className="btn-icon btn-danger" 
                            onClick={() => handleRemoveObject(obj.id)}
                            title="Remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Environment Selection */}
                <section className="config-section">
                  <h2><FaTree /> Environment</h2>
                  
                  {/* Add Environment Form */}
                  <div className="add-item-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Type</label>
                        <select 
                          value={newEnvironmentType} 
                          onChange={(e) => handleEnvironmentTypeChange(e.target.value)}
                        >
                          {Object.entries(environmentTypes).map(([key, value]) => (
                            <option key={key} value={key}>
                              {value.icon} {value.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Position */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Position X</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={newEnvironmentPose.x}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Position Y</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={newEnvironmentPose.y}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Position Z</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          value={newEnvironmentPose.z}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, z: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>

                    {/* Orientation (Quaternion) */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Quat X</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newEnvironmentPose.qx}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, qx: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quat Y</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newEnvironmentPose.qy}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, qy: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quat Z</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newEnvironmentPose.qz}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, qz: parseFloat(e.target.value) }))}
                        />
                      </div>
                      <div className="form-group">
                        <label>Quat W</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={newEnvironmentPose.qw}
                          onChange={(e) => setNewEnvironmentPose(prev => ({ ...prev, qw: parseFloat(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <button className="btn btn-secondary" onClick={handleAddEnvironment}>
                      <FaPlus /> Add Environment
                    </button>
                  </div>

                  {/* List of added environments */}
                  {worldConfig.environments.length > 0 && (
                    <div className="added-items-list">
                      <h3>Added Environments ({worldConfig.environments.length})</h3>
                      {worldConfig.environments.map(env => (
                        <div key={env.id} className="added-item">
                          <span className="item-icon">{environmentTypes[env.type].icon}</span>
                          <span className="item-name">{env.name}</span>
                          <span className="item-type">({environmentTypes[env.type].name})</span>
                          <span className="item-pos">
                            [{env.pose.x.toFixed(2)}, {env.pose.y.toFixed(2)}, {env.pose.z.toFixed(2)}]
                          </span>
                          <button 
                            className="btn-icon btn-danger" 
                            onClick={() => handleRemoveEnvironment(env.id)}
                            title="Remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
