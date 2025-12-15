import axios from 'axios';
import { API_BASE_URL, API_ENDPOINT } from './config';

/**
 * API Service for Ohmni Simulation
 */
class SimulationAPI {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  /**
   * Get available objects
   */
  async getObjects() {
    const response = await this.client.get(`${API_ENDPOINT}/objects`);
    return response.data;
  }

  /**
   * Get available environments
   */
  async getEnvironments() {
    const response = await this.client.get(`${API_ENDPOINT}/environments`);
    return response.data;
  }

  /**
   * Launch world (without robots)
   * @param {Object} config - World configuration
   */
  async launchWorld(config) {
    const response = await this.client.post(
      `${API_ENDPOINT}/world/launch`,
      config
    );
    return response.data;
  }

  /**
   * Spawn robot in existing world
   * @param {Object} config - Robot configuration with world_session_id
   */
  async spawnRobot(config) {
    const response = await this.client.post(
      `${API_ENDPOINT}/robot/spawn`,
      config
    );
    return response.data;
  }

  /**
   * Launch simulation (DEPRECATED - use launchWorld + spawnRobot)
   * @param {Object} config - Simulation configuration
   */
  async launchSimulation(config) {
    const response = await this.client.post(
      `${API_ENDPOINT}/simulation/launch`,
      config
    );
    return response.data;
  }

  /**
   * Get status of all simulations or specific simulation
   * @param {string} sessionId - Optional session ID
   */
  async getStatus(sessionId = null) {
    const url = sessionId
      ? `${API_ENDPOINT}/simulation/status/${sessionId}`
      : `${API_ENDPOINT}/simulation/status`;
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Stop specific simulation
   * @param {string} sessionId - Session ID
   */
  async stopSimulation(sessionId) {
    const response = await this.client.post(
      `${API_ENDPOINT}/simulation/stop/${sessionId}`
    );
    return response.data;
  }

  /**
   * Stop all simulations
   */
  async stopAllSimulations() {
    const response = await this.client.post(
      `${API_ENDPOINT}/simulation/stop-all`
    );
    return response.data;
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration to validate
   */
  async validateConfig(config) {
    const response = await this.client.post(
      `${API_ENDPOINT}/config/validate`,
      config
    );
    return response.data;
  }
}

export default new SimulationAPI();
