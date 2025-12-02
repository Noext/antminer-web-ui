import { authenticatedFetch } from './digest-auth';

export interface AntminerSystemInfo {
  [key: string]: unknown;
}

export class AntminerClient {
  private host: string;
  private username: string;
  private password: string;

  constructor(host: string, username: string, password: string) {
    this.host = host;
    this.username = username;
    this.password = password;
  }

  /**
   * Fetches system information from the Antminer
   */
  async getSystemInfo(): Promise<AntminerSystemInfo> {
    const url = `${this.host}/cgi-bin/get_system_info.cgi`;

    try {
      const response = await authenticatedFetch(
        url,
        this.username,
        this.password,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Referer': `${this.host}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches summary information (uptime, status indicators, etc.)
   */
  async getSummary(): Promise<unknown> {
    const url = `${this.host}/cgi-bin/summary.cgi`;

    try {
      const response = await authenticatedFetch(
        url,
        this.username,
        this.password,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Referer': `${this.host}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches mining pools information
   */
  async getPools(): Promise<unknown> {
    const url = `${this.host}/cgi-bin/pools.cgi`;

    try {
      const response = await authenticatedFetch(
        url,
        this.username,
        this.password,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Referer': `${this.host}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches historical hashrate data for charts
   */
  async getChartData(): Promise<unknown> {
    const url = `${this.host}/cgi-bin/chart.cgi`;

    try {
      const response = await authenticatedFetch(
        url,
        this.username,
        this.password,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Referer': `${this.host}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches detailed stats from the Antminer (hashrate, temps, fans, etc.)
   */
  async getStats(): Promise<unknown> {
    const url = `${this.host}/cgi-bin/stats.cgi`;

    try {
      const response = await authenticatedFetch(
        url,
        this.username,
        this.password,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Referer': `${this.host}/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Creates an Antminer client instance using environment variables
 */
export function createAntminerClient(): AntminerClient {
  const host = process.env.ANTMINER_HOST;
  const username = process.env.ANTMINER_USERNAME;
  const password = process.env.ANTMINER_PASSWORD;

  if (!host || !username || !password) {
    throw new Error(
      'Missing required environment variables: ANTMINER_HOST, ANTMINER_USERNAME, ANTMINER_PASSWORD'
    );
  }

  return new AntminerClient(host, username, password);
}

