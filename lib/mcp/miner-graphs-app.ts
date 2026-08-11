export const MINER_GRAPHS_RESOURCE_URI = 'ui://antminer/miner-graphs.html';
export const MCP_APP_MIME_TYPE = 'text/html;profile=mcp-app';

export const MINER_GRAPHS_APP_HTML = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Antminer — graphiques live</title>
  <style>
    :root{color-scheme:light dark;font-family:var(--font-sans,Inter,system-ui,sans-serif);background:var(--color-background-primary,#0f172a);color:var(--color-text-primary,#f8fafc)}
    *{box-sizing:border-box}body{margin:0;padding:16px;background:transparent}.head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px}h1{font-size:18px;margin:0}.stamp{font-size:12px;color:var(--color-text-secondary,#94a3b8)}button{border:1px solid #0891b2;background:#0e7490;color:white;border-radius:8px;padding:8px 12px;cursor:pointer}.metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}.metric,.panel{border:1px solid var(--color-border-primary,#334155);background:var(--color-background-secondary,#1e293b);border-radius:12px;padding:12px}.metric span{display:block;font-size:11px;color:var(--color-text-secondary,#94a3b8)}.metric strong{font-size:22px}.grid{display:grid;grid-template-columns:2fr 1fr;gap:12px}.panel h2{font-size:13px;margin:0 0 10px;color:var(--color-text-secondary,#cbd5e1)}svg{width:100%;height:220px;overflow:visible}.axis{stroke:#64748b;stroke-width:1}.line{fill:none;stroke-width:3;stroke-linejoin:round;stroke-linecap:round}.bars{display:flex;height:220px;align-items:end;gap:9px}.bar-wrap{height:100%;flex:1;display:flex;align-items:center;flex-direction:column;justify-content:end;font-size:10px;color:#94a3b8}.bar{width:100%;max-width:42px;border-radius:6px 6px 2px 2px;background:linear-gradient(#22d3ee,#2563eb);min-height:2px}.error{color:#fca5a5;padding:16px;border:1px solid #ef4444;border-radius:10px}@media(max-width:620px){.metrics{grid-template-columns:1fr}.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="head"><div><h1 id="title">Antminer</h1><div class="stamp" id="stamp">Chargement…</div></div><button id="refresh">Actualiser</button></div>
  <div id="content"><div class="stamp">En attente des données du mineur…</div></div>
  <script>
    (() => {
      let nextId = 1;
      const pending = new Map();
      const send = message => window.parent.postMessage(message, '*');
      const request = (method, params) => new Promise((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        send({ jsonrpc: '2.0', id, method, params });
      });
      const notify = (method, params = {}) => send({ jsonrpc: '2.0', method, params });
      const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
      const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

      function polyline(values, width, height, maximum) {
        if (!values.length) return '';
        const step = values.length > 1 ? width / (values.length - 1) : 0;
        return values.map((value, index) => (index * step) + ',' + (height - (num(value) / maximum * height))).join(' ');
      }

      function render(result) {
        const data = result && result.structuredContent;
        if (!data || !data.hashrate) {
          document.getElementById('content').innerHTML = '<div class="error">Données graphiques indisponibles.</div>';
          return;
        }
        document.getElementById('title').textContent = data.miner?.model || 'Antminer';
        document.getElementById('stamp').textContent = 'Mis à jour ' + new Date(data.collectedAt).toLocaleString();
        const history = data.hashrateHistory || { labels: [], series: [] };
        const allValues = history.series.flatMap(series => series.values || []).map(num);
        const maximum = Math.max(1, ...allValues) * 1.08;
        const colors = ['#22d3ee','#a78bfa','#f59e0b','#34d399'];
        const lines = history.series.map((series, index) => '<polyline class="line" stroke="' + colors[index % colors.length] + '" points="' + polyline(series.values || [], 560, 190, maximum) + '"><title>' + esc(series.name) + '</title></polyline>').join('');
        const legends = history.series.map((series, index) => '<span style="color:' + colors[index % colors.length] + ';margin-right:12px">● ' + esc(series.name) + '</span>').join('');
        const temps = data.temperatures?.byHashboard || [];
        const tempBars = temps.map(item => '<div class="bar-wrap"><b>' + num(item.maximumChipCelsius) + '°</b><div class="bar" style="height:' + Math.min(100, num(item.maximumChipCelsius)) + '%"></div><span>HB ' + (num(item.index) + 1) + '</span></div>').join('');
        const fans = data.fans || [];
        const maxFan = Math.max(1, ...fans.map(fan => num(fan.rpm)));
        const fanBars = fans.map(fan => '<div class="bar-wrap"><b>' + num(fan.rpm) + '</b><div class="bar" style="height:' + (num(fan.rpm) / maxFan * 100) + '%"></div><span>Fan ' + (num(fan.index) + 1) + '</span></div>').join('');
        document.getElementById('content').innerHTML =
          '<div class="metrics"><div class="metric"><span>Hashrate live</span><strong>' + num(data.hashrate.current).toFixed(2) + ' TH/s</strong></div><div class="metric"><span>Température max</span><strong>' + num(data.temperatures?.maximumChipCelsius) + ' °C</strong></div><div class="metric"><span>Uptime</span><strong>' + Math.floor(num(data.uptimeSeconds) / 3600) + ' h</strong></div></div>' +
          '<div class="grid"><section class="panel"><h2>Hashrate par hashboard — ' + esc(history.unit || 'TH/s') + '</h2><svg viewBox="0 0 560 220" preserveAspectRatio="none"><line class="axis" x1="0" y1="190" x2="560" y2="190"></line>' + lines + '</svg><div>' + legends + '</div></section>' +
          '<section class="panel"><h2>Températures des hashboards</h2><div class="bars">' + tempBars + '</div></section>' +
          '<section class="panel"><h2>Ventilateurs — RPM</h2><div class="bars">' + fanBars + '</div></section></div>';
      }

      window.addEventListener('message', event => {
        const message = event.data;
        if (!message || message.jsonrpc !== '2.0') return;
        if (message.id !== undefined && pending.has(message.id)) {
          const waiter = pending.get(message.id); pending.delete(message.id);
          message.error ? waiter.reject(message.error) : waiter.resolve(message.result);
          return;
        }
        if (message.method === 'ui/notifications/tool-result') render(message.params);
        if (message.method === 'ui/resource-teardown' && message.id !== undefined) send({ jsonrpc: '2.0', id: message.id, result: {} });
      });

      document.getElementById('refresh').addEventListener('click', async () => {
        const button = document.getElementById('refresh'); button.disabled = true;
        try { render(await request('tools/call', { name: 'show_miner_graphs', arguments: {} })); }
        catch { document.getElementById('stamp').textContent = 'Échec de l’actualisation'; }
        finally { button.disabled = false; }
      });

      request('ui/initialize', {
        protocolVersion: '2026-01-26',
        appCapabilities: { availableDisplayModes: ['inline', 'fullscreen'] },
        appInfo: { name: 'Antminer Graphs', version: '1.0.0' }
      }).then(result => {
        const variables = result?.hostContext?.styles?.variables || {};
        Object.entries(variables).forEach(([name, value]) => value && document.documentElement.style.setProperty(name, value));
        notify('ui/notifications/initialized');
        new ResizeObserver(() => notify('ui/notifications/size-changed', { width: document.body.scrollWidth, height: document.body.scrollHeight })).observe(document.body);
      }).catch(() => document.getElementById('stamp').textContent = 'Hôte MCP Apps incompatible');
    })();
  </script>
</body>
</html>`;
