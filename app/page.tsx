'use client';

import { trpc } from '@/lib/trpc-client';
import { RefreshCw, Activity, Zap, Thermometer, Clock, AlertCircle, TrendingUp, Waves, CheckCircle, Wifi, Wind } from 'lucide-react';
import { useState, useEffect } from 'react';
import { HashrateChart } from './components/HashrateChart';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  // Fetch system info
  const { data: rawSystemInfo, isLoading: isLoadingSystem, error: errorSystem, refetch: refetchSystem, isRefetching: isRefetchingSystem } = trpc.antminer.getSystemInfo.useQuery(
    undefined,
    {
      refetchInterval: 10000,
      enabled: mounted,
    }
  );

  // Fetch mining stats
  const { data: rawStats, isLoading: isLoadingStats, error: errorStats, refetch: refetchStats, isRefetching: isRefetchingStats } = trpc.antminer.getStats.useQuery(
    undefined,
    {
      refetchInterval: 10000,
      enabled: mounted,
    }
  );

  // Fetch chart data
  const { data: rawChartData, isLoading: isLoadingChart, error: errorChart, refetch: refetchChart, isRefetching: isRefetchingChart } = trpc.antminer.getChartData.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      enabled: mounted,
    }
  );

  // Fetch pools data
  const { data: rawPools, isLoading: isLoadingPools, error: errorPools, refetch: refetchPools, isRefetching: isRefetchingPools } = trpc.antminer.getPools.useQuery(
    undefined,
    {
      refetchInterval: 15000, // Refresh every 15 seconds
      enabled: mounted,
    }
  );

  // Fetch summary data
  const { data: rawSummary, isLoading: isLoadingSummary, error: errorSummary, refetch: refetchSummary, isRefetching: isRefetchingSummary } = trpc.antminer.getSummary.useQuery(
    undefined,
    {
      refetchInterval: 10000, // Refresh every 10 seconds
      enabled: mounted,
    }
  );

  // Unwrap the superjson responses
  const systemInfo = (rawSystemInfo as any)?.json || rawSystemInfo;
  const stats = (rawStats as any)?.json || rawStats;
  const chartData = (rawChartData as any)?.json || rawChartData;
  const pools = (rawPools as any)?.json || rawPools;
  const summary = (rawSummary as any)?.json || rawSummary;
  
  const isLoading = isLoadingSystem || isLoadingStats || isLoadingChart || isLoadingPools || isLoadingSummary;
  const error = errorSystem || errorStats || errorChart || errorPools || errorSummary;
  const isRefetching = isRefetchingSystem || isRefetchingStats || isRefetchingChart || isRefetchingPools || isRefetchingSummary;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    refetchSystem();
    refetchStats();
    refetchChart();
    refetchPools();
    refetchSummary();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Activity className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Antminer Dashboard
                </h1>
                <p className="text-sm text-slate-400">Surveillance en temps réel</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading || isRefetching}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="mb-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-500 mb-1">Erreur de connexion</h3>
                <p className="text-sm text-slate-300">{error.message}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Vérifiez votre configuration dans le fichier .env
                </p>
              </div>
            </div>
          )}
          {systemInfo?.success && systemInfo?.data && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-500 font-medium">Connecté à l'Antminer</span>
                <span className="text-xs text-slate-400 ml-auto">
                  Dernière mise à jour: {new Date(systemInfo.timestamp).toLocaleTimeString('fr-FR')}
                </span>
              </div>

              {/* System Status Indicators */}
              {summary?.success && summary?.data?.SUMMARY?.[0]?.status && (
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {summary.data.SUMMARY[0].status.map((status: any, idx: number) => {
                      const isOk = status.status === 's';
                      const icons: Record<string, any> = {
                        rate: Zap,
                        network: Wifi,
                        fans: Wind,
                        temp: Thermometer,
                      };
                      const labels: Record<string, string> = {
                        rate: 'Hashrate',
                        network: 'Réseau',
                        fans: 'Ventilateurs',
                        temp: 'Température',
                      };
                      const Icon = icons[status.type] || CheckCircle;
                      
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${isOk ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <Icon className={`w-4 h-4 ${isOk ? 'text-green-500' : 'text-red-500'}`} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">{labels[status.type] || status.type}</p>
                            <p className={`text-sm font-semibold ${isOk ? 'text-green-500' : 'text-red-500'}`}>
                              {isOk ? 'OK' : 'Erreur'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {summary.data.SUMMARY[0].elapsed && (
                    <>
                      <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-1">Uptime</span>
                          <span className="text-slate-200 font-semibold">
                            {Math.floor(summary.data.SUMMARY[0].elapsed / 3600)}h {Math.floor((summary.data.SUMMARY[0].elapsed % 3600) / 60)}m
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-1">HW Errors</span>
                          <span className={`font-semibold ${summary.data.SUMMARY[0].hw_all > 100 ? 'text-orange-400' : 'text-green-400'}`}>
                            {summary.data.SUMMARY[0].hw_all}
                          </span>
                        </div>
                        {systemInfo.data?.ipaddress && (
                          <>
                            <div>
                              <span className="text-slate-400 block mb-1">IP</span>
                              <span className="text-cyan-400 font-mono font-semibold">{systemInfo.data.ipaddress}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-1">MAC</span>
                              <span className="text-slate-200 font-mono text-[10px]">{systemInfo.data.macaddr}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {systemInfo.data?.serinum && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-400">S/N: </span>
                          <span className="text-slate-300 font-mono">{systemInfo.data.serinum}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && !rawSystemInfo && !rawStats && !rawChartData && !rawPools && !rawSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Data Display - Test without success check */}
        {systemInfo?.data && (
          <>
            {/* Mining Stats - From stats.cgi */}
            {stats?.success && stats?.data?.STATS?.[0] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={<Zap className="w-6 h-6" />}
                  label="Hashrate (5s)"
                  value={`${(stats.data.STATS[0].rate_5s / 1000).toFixed(2)} TH/s`}
                  color="cyan"
                  subtitle={`Idéal: ${(stats.data.STATS[0].rate_ideal / 1000).toFixed(0)} TH/s`}
                />
                <StatCard
                  icon={<Thermometer className="w-6 h-6" />}
                  label="Température Max"
                  value={`${Math.max(...stats.data.STATS[0].chain.map((c: any) => Math.max(...c.temp_chip)))}°C`}
                  color="orange"
                  subtitle="Chip"
                />
                <StatCard
                  icon={<Activity className="w-6 h-6" />}
                  label="Ventilateur Max"
                  value={`${Math.max(...stats.data.STATS[0].fan)} RPM`}
                  color="green"
                  subtitle="Vitesse maximale"
                />
                <StatCard
                  icon={<Activity className="w-6 h-6" />}
                  label="Hashboards"
                  value={`${stats.data.STATS[0].chain_num} actifs`}
                  color="purple"
                  subtitle={`${stats.data.STATS[0].chain.reduce((acc: number, c: any) => acc + c.asic_num, 0)} ASICs`}
                />
              </div>
            )}

            {/* System Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Modèle"
                value={formatMinerType(systemInfo.data)}
                color="cyan"
              />
              <StatCard
                icon={<Zap className="w-6 h-6" />}
                label="Statut"
                value={formatStatus(systemInfo.data)}
                color="green"
              />
              <StatCard
                icon={<Thermometer className="w-6 h-6" />}
                label="Firmware"
                value={formatFirmware(systemInfo.data)}
                color="purple"
                subtitle={systemInfo.data?.firmware_type}
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Kernel"
                value={systemInfo.data?.system_kernel_version?.split(' ')[1] || 'N/A'}
                color="orange"
                subtitle="Linux"
              />
            </div>

            {/* Fans Details */}
            {stats?.success && stats?.data?.STATS?.[0]?.fan && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wind className="w-5 h-5 text-cyan-500" />
                  Détails des Ventilateurs
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.data.STATS[0].fan.map((fanSpeed: number, idx: number) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Wind className="w-5 h-5 text-green-500" />
                        </div>
                        <h3 className="text-white font-semibold">Fan #{idx + 1}</h3>
                      </div>
                      <div className="space-y-2">
                        <p className="text-3xl font-bold text-green-400">{fanSpeed}</p>
                        <p className="text-sm text-slate-400">RPM</p>
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${fanSpeed > 3000 ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                            <span className={`text-xs ${fanSpeed > 3000 ? 'text-green-500' : 'text-orange-500'}`}>
                              {fanSpeed > 3000 ? 'Normal' : 'Lent'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashboard Details */}
            {stats?.success && stats?.data?.STATS?.[0]?.chain && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  Détails des Hashboards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.data.STATS[0].chain.map((chain: any, idx: number) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                      <h3 className="text-cyan-400 font-semibold mb-4">Hashboard #{chain.index + 1}</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Hashrate:</span>
                          <span className="text-white font-semibold">{(chain.rate_real / 1000).toFixed(2)} TH/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Fréquence:</span>
                          <span className="text-white">{chain.freq_avg} MHz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Temp Chip:</span>
                          <span className={`font-semibold ${Math.max(...chain.temp_chip) > 70 ? 'text-red-400' : 'text-green-400'}`}>
                            {Math.max(...chain.temp_chip)}°C
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Temp PCB:</span>
                          <span className="text-white">{Math.max(...chain.temp_pcb)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">ASICs:</span>
                          <span className="text-white">{chain.asic_num}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">HW Errors:</span>
                          <span className={chain.hw > 100 ? 'text-orange-400' : 'text-green-400'}>{chain.hw}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">S/N:</span>
                          <span className="text-slate-300 text-xs">{chain.sn}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mining Pools */}
            {pools?.success && pools?.data?.POOLS && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Waves className="w-5 h-5 text-cyan-500" />
                  Pools de Minage
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {pools.data.POOLS.filter((pool: any) => pool.status !== 'Dead' || pool.url).map((pool: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`bg-slate-800/50 border rounded-xl p-6 ${
                        pool.status === 'Alive' ? 'border-green-500/30' : 'border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            pool.status === 'Alive' ? 'bg-green-500 animate-pulse' : 'bg-slate-600'
                          }`}></div>
                          <div>
                            <h3 className="text-white font-semibold">
                              Pool #{pool.index + 1} {pool.priority === 0 && '(Principal)'}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1 break-all">
                              {pool.url || 'Non configuré'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          pool.status === 'Alive' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {pool.status}
                        </span>
                      </div>

                      {pool.status === 'Alive' && (
                        <>
                          <div className="text-sm text-slate-400 mb-4">
                            Worker: <span className="text-slate-300">{pool.user}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 p-3 rounded-lg">
                              <p className="text-xs text-slate-400 mb-1">Shares acceptées</p>
                              <p className="text-lg font-semibold text-green-400">{pool.accepted.toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg">
                              <p className="text-xs text-slate-400 mb-1">Shares rejetées</p>
                              <p className="text-lg font-semibold text-red-400">{pool.rejected.toLocaleString()}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {pool.accepted > 0 ? ((pool.rejected / pool.accepted) * 100).toFixed(2) : '0.00'}%
                              </p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg">
                              <p className="text-xs text-slate-400 mb-1">Difficulté</p>
                              <p className="text-lg font-semibold text-cyan-400">{pool.diff || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg">
                              <p className="text-xs text-slate-400 mb-1">Dernière share</p>
                              <p className="text-lg font-semibold text-purple-400">{pool.lstime}</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hashrate Chart */}
            {chartData?.success && chartData?.data && (
              <div className="mb-8">
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-cyan-500" />
                      <h2 className="text-lg font-semibold">Historique du Hashrate (6 heures)</h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      Mise à jour toutes les 30 secondes
                    </span>
                  </div>
                  <div className="p-6">
                    <HashrateChart chartData={chartData.data} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p>🔒 Connexion sécurisée avec authentification Digest</p>
          <p className="mt-1">Les données sont actualisées automatiquement toutes les 10 secondes</p>
        </div>
      </div>
    </main>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'orange' | 'green' | 'purple';
  subtitle?: string;
}

function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
    green: 'text-green-500 bg-green-500/10 border-green-500/30',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color].split(' ').slice(1).join(' ')} mb-4`}>
        <div className={colorClasses[color].split(' ')[0]}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-bold break-all">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// Helper functions to format data
function formatHashrate(data: any): string {
  if (data.hashrate) return data.hashrate;
  if (data['GHS av']) return `${data['GHS av']} GH/s`;
  if (data.summary?.SUMMARY?.[0]?.['GHS av']) {
    return `${data.summary.SUMMARY[0]['GHS av']} GH/s`;
  }
  // For system_info endpoint, hashrate might not be available
  return 'Voir statistiques';
}

function formatTemperature(data: any): string {
  if (data.temp) return `${data.temp}°C`;
  if (data.stats?.temp) return `${data.stats.temp}°C`;
  if (data.temperature) return `${data.temperature}°C`;
  
  // Try to find any temperature field
  const tempFields = ['temp1', 'temp2', 'temp3', 'temp_chip'];
  for (const field of tempFields) {
    if (data[field]) return `${data[field]}°C`;
  }
  
  return 'Voir statistiques';
}

function formatStatus(data: any): string {
  if (data.status) return data.status;
  if (data.summary?.SUMMARY?.[0]?.Status) return data.summary.SUMMARY[0].Status;
  if (data.stats?.status) return data.stats.status;
  if (data.system_mode) return 'En ligne';
  return 'En ligne';
}

function formatMinerType(data: any): string {
  return data.minertype || data.type || data.model || 'Antminer';
}

function formatFirmware(data: any): string {
  return data.system_filesystem_version || data.firmware_version || data.firmware || 'N/A';
}
