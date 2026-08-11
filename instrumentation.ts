export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.MINER_MONITOR_ENABLED === 'true') {
    const { startMinerMonitor } = await import('./lib/monitor/miner-monitor');
    startMinerMonitor();
  }
}
