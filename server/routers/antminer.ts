import { router, publicProcedure } from '@/lib/trpc';
import { createAntminerClient } from '@/lib/antminer-client';
import { z } from 'zod';

export const antminerRouter = router({
  /**
   * Get system information from the Antminer
   */
  getSystemInfo: publicProcedure.query(async () => {
    try {
      const client = createAntminerClient();
      const systemInfo = await client.getSystemInfo();
      
      return {
        success: true,
        data: systemInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TRPC] Error in getSystemInfo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Get summary information (uptime, system status)
   */
  getSummary: publicProcedure.query(async () => {
    try {
      const client = createAntminerClient();
      const summary = await client.getSummary();
      
      return {
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TRPC] Error in getSummary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Get mining pools information
   */
  getPools: publicProcedure.query(async () => {
    try {
      const client = createAntminerClient();
      const pools = await client.getPools();
      
      return {
        success: true,
        data: pools,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TRPC] Error in getPools:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Get historical hashrate chart data
   */
  getChartData: publicProcedure.query(async () => {
    try {
      const client = createAntminerClient();
      const chartData = await client.getChartData();
      
      return {
        success: true,
        data: chartData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TRPC] Error in getChartData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Get detailed miner statistics (hashrate, temps, fans, chains)
   */
  getStats: publicProcedure.query(async () => {
    try {
      const client = createAntminerClient();
      const stats = await client.getStats();
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[TRPC] Error in getStats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }),
});

