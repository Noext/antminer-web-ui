import { createAntminerClient } from './antminer-client';

type JsonObject = Record<string, unknown>;

export interface MinerLiveInfo {
  collectedAt: string;
  miner: {
    model: string;
    ipAddress: string | null;
    firmware: string | null;
  };
  uptimeSeconds: number;
  health: Record<string, 'ok' | 'error'>;
  hashrate: {
    unit: 'TH/s';
    current: number;
    thirtyMinutes: number;
    average: number;
    ideal: number;
  };
  temperatures: {
    maximumChipCelsius: number;
    byHashboard: Array<{ index: number; maximumChipCelsius: number }>;
  };
  fans: Array<{ index: number; rpm: number }>;
  hashboards: Array<{
    index: number;
    hashrateTHs: number;
    idealHashrateTHs: number;
    frequencyMHz: number;
    asicCount: number;
    hardwareErrors: number;
  }>;
  activePool: {
    url: string;
    status: string;
    acceptedShares: number;
    rejectedShares: number;
  } | null;
}

export interface MinerGraphData extends MinerLiveInfo {
  hashrateHistory: {
    unit: 'TH/s';
    labels: string[];
    series: Array<{ name: string; values: number[] }>;
  };
}

function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function maxNumber(values: unknown): number {
  const numbers = asArray(values).map(asNumber);
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

export async function getMinerLiveInfo(): Promise<MinerLiveInfo> {
  const client = createAntminerClient();
  const [rawSystem, rawStats, rawSummary, rawPools] = await Promise.all([
    client.getSystemInfo(),
    client.getStats(),
    client.getSummary(),
    client.getPools(),
  ]);

  const system = asObject(rawSystem);
  const statsRoot = asObject(rawStats);
  const summaryRoot = asObject(rawSummary);
  const poolsRoot = asObject(rawPools);
  const stats = asObject(asArray(statsRoot.STATS)[0]);
  const summary = asObject(asArray(summaryRoot.SUMMARY)[0]);
  const info = asObject(statsRoot.INFO);
  const chains = asArray(stats.chain).map(asObject);
  const pool = asArray(poolsRoot.POOLS).map(asObject).find((item) => asString(item.status) === 'Alive');

  const temperatures = chains.map((chain, index) => ({
    index: asNumber(chain.index) || index,
    maximumChipCelsius: maxNumber(chain.temp_chip),
  }));

  return {
    collectedAt: new Date().toISOString(),
    miner: {
      model: asString(info.type) || asString(system.minertype) || 'Antminer',
      ipAddress: asString(system.ipaddress) || null,
      firmware: asString(system.firmware_version) || asString(system.firmware_type) || null,
    },
    uptimeSeconds: asNumber(summary.elapsed || stats.elapsed),
    health: Object.fromEntries(
      asArray(summary.status).map((entry) => {
        const status = asObject(entry);
        return [asString(status.type) || 'unknown', asString(status.status) === 's' ? 'ok' : 'error'];
      }),
    ),
    hashrate: {
      unit: 'TH/s',
      current: round(asNumber(stats.rate_5s) / 1000),
      thirtyMinutes: round(asNumber(stats.rate_30m) / 1000),
      average: round(asNumber(stats.rate_avg) / 1000),
      ideal: round(asNumber(stats.rate_ideal) / 1000),
    },
    temperatures: {
      maximumChipCelsius: temperatures.length > 0
        ? Math.max(...temperatures.map((item) => item.maximumChipCelsius))
        : 0,
      byHashboard: temperatures,
    },
    fans: asArray(stats.fan).map((rpm, index) => ({ index, rpm: asNumber(rpm) })),
    hashboards: chains.map((chain, index) => ({
      index: asNumber(chain.index) || index,
      hashrateTHs: round(asNumber(chain.rate_real) / 1000),
      idealHashrateTHs: round(asNumber(chain.rate_ideal) / 1000),
      frequencyMHz: asNumber(chain.freq_avg),
      asicCount: asNumber(chain.asic_num),
      hardwareErrors: asNumber(chain.hw),
    })),
    activePool: pool
      ? {
          url: asString(pool.url),
          status: asString(pool.status),
          acceptedShares: asNumber(pool.accepted),
          rejectedShares: asNumber(pool.rejected),
        }
      : null,
  };
}

export async function getMinerGraphData(): Promise<MinerGraphData> {
  const client = createAntminerClient();
  const [live, rawChart] = await Promise.all([getMinerLiveInfo(), client.getChartData()]);
  const chartRoot = asObject(rawChart);
  const rate = asObject(asArray(chartRoot.RATE)[0]);

  return {
    ...live,
    hashrateHistory: {
      unit: 'TH/s',
      labels: asArray(rate.xAxis).map(asString),
      series: asArray(rate.series).map((rawSeries, index) => {
        const series = asObject(rawSeries);
        return {
          name: asString(series.name) || `chain${index}`,
          values: asArray(series.data).map((value) => round(asNumber(value) / 1000)),
        };
      }),
    },
  };
}

export function formatMinerSummary(info: MinerLiveInfo): string {
  const health = Object.entries(info.health)
    .map(([name, status]) => `${name}: ${status}`)
    .join(', ');
  const pool = info.activePool ? `${info.activePool.status} (${info.activePool.url})` : 'aucun';

  return [
    `${info.miner.model} — données du ${info.collectedAt}`,
    `Hashrate: ${info.hashrate.current} TH/s (30 min: ${info.hashrate.thirtyMinutes}, moyenne: ${info.hashrate.average}, cible: ${info.hashrate.ideal})`,
    `Température maximale: ${info.temperatures.maximumChipCelsius} °C`,
    `Ventilateurs: ${info.fans.map((fan) => `${fan.rpm} RPM`).join(', ')}`,
    `État: ${health || 'indisponible'}`,
    `Pool actif: ${pool}`,
  ].join('\n');
}
