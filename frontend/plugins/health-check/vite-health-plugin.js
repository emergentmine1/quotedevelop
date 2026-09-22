const os = require('os');

const SERVER_START_TIME = Date.now();

function createStatus() {
  return {
    state: 'idle',
    errors: [],
    warnings: [],
    lastCompileTime: null,
    lastSuccessTime: null,
    compileDuration: 0,
    totalCompiles: 0,
    firstCompileTime: null,
  };
}

function withComputed(status) {
  return {
    ...status,
    isHealthy: status.state === 'success',
    errorCount: status.errors.length,
    warningCount: status.warnings.length,
    hasCompiled: status.totalCompiles > 0,
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function normalizeIssue(issue) {
  if (!issue) {
    return { message: 'Unknown error' };
  }

  if (typeof issue === 'string') {
    return { message: issue };
  }

  const id = issue.id || issue.plugin;
  const location = issue.loc
    ? `${issue.loc.file || ''}:${issue.loc.line || ''}:${issue.loc.column || ''}`.replace(/^:+|:+$/g, '')
    : issue.id || issue.frame || issue.loc || null;

  return {
    message: issue.message || String(issue),
    stack: issue.stack,
    moduleName: id,
    loc: location,
    frame: issue.frame,
  };
}

function createHealthMiddleware(getStatus) {
  return (req, res, next) => {
    const pathname = (req.url || '').split('?')[0];
    if (!pathname.startsWith('/health')) {
      next();
      return;
    }

    const status = withComputed(getStatus());
    const uptime = Date.now() - SERVER_START_TIME;
    const memUsage = process.memoryUsage();

    const sendJson = (code, payload) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
    };

    const sendText = (code, payload) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(payload);
    };

    switch (pathname) {
      case '/health':
        sendJson(status.isHealthy ? 200 : 503, {
          status: status.isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          uptime: {
            seconds: Math.floor(uptime / 1000),
            formatted: formatDuration(uptime),
          },
          vite: {
            state: status.state,
            isHealthy: status.isHealthy,
            hasCompiled: status.hasCompiled,
            errors: status.errorCount,
            warnings: status.warningCount,
            lastCompileTime: status.lastCompileTime ? new Date(status.lastCompileTime).toISOString() : null,
            lastSuccessTime: status.lastSuccessTime ? new Date(status.lastSuccessTime).toISOString() : null,
            compileDuration: status.compileDuration ? `${status.compileDuration}ms` : null,
            totalCompiles: status.totalCompiles,
            firstCompileTime: status.firstCompileTime ? new Date(status.firstCompileTime).toISOString() : null,
          },
          server: {
            nodeVersion: process.version,
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            memory: {
              heapUsed: formatBytes(memUsage.heapUsed),
              heapTotal: formatBytes(memUsage.heapTotal),
              rss: formatBytes(memUsage.rss),
              external: formatBytes(memUsage.external),
            },
            systemMemory: {
              total: formatBytes(os.totalmem()),
              free: formatBytes(os.freemem()),
              used: formatBytes(os.totalmem() - os.freemem()),
            },
          },
          environment: process.env.NODE_ENV || 'development',
        });
        return;
      case '/health/simple':
        if (status.state === 'success') {
          sendText(200, 'OK');
        } else if (status.state === 'compiling') {
          sendText(200, 'COMPILING');
        } else if (status.state === 'idle') {
          sendText(200, 'IDLE');
        } else {
          sendText(503, 'ERROR');
        }
        return;
      case '/health/ready':
        if (status.state === 'success') {
          sendJson(200, { ready: true, state: status.state });
        } else {
          sendJson(503, {
            ready: false,
            state: status.state,
            reason: status.state === 'compiling' ? 'Compilation in progress' : 'Compilation failed',
          });
        }
        return;
      case '/health/live':
        sendJson(200, { alive: true, timestamp: new Date().toISOString() });
        return;
      case '/health/errors':
        sendJson(200, {
          errorCount: status.errorCount,
          warningCount: status.warningCount,
          errors: status.errors,
          warnings: status.warnings,
          state: status.state,
        });
        return;
      case '/health/stats':
        sendJson(200, {
          totalCompiles: status.totalCompiles,
          averageCompileTime: status.totalCompiles > 0 ? `${Math.round(uptime / status.totalCompiles)}ms` : null,
          lastCompileDuration: status.compileDuration ? `${status.compileDuration}ms` : null,
          firstCompileTime: status.firstCompileTime ? new Date(status.firstCompileTime).toISOString() : null,
          serverUptime: formatDuration(uptime),
        });
        return;
      default:
        next();
    }
  };
}

module.exports = function createViteHealthPlugin() {
  const status = createStatus();
  let settleTimer;

  const beginCompile = () => {
    const now = Date.now();
    if (!status.firstCompileTime) status.firstCompileTime = now;
    status.state = 'compiling';
    status.lastCompileTime = now;
  };

  const finishCompile = ({ errors = [], warnings = [] } = {}) => {
    status.totalCompiles += 1;
    status.compileDuration = status.lastCompileTime ? Date.now() - status.lastCompileTime : 0;
    status.errors = errors.map(normalizeIssue);
    status.warnings = warnings.map(normalizeIssue);

    if (status.errors.length > 0) {
      status.state = 'failed';
      return;
    }

    status.state = 'success';
    status.lastSuccessTime = Date.now();
  };

  const scheduleSuccess = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => finishCompile(), 75);
  };

  return {
    name: 'vite-health-plugin',
    apply: 'serve',
    configureServer(server) {
      beginCompile();
      server.middlewares.use(createHealthMiddleware(() => status));

      server.watcher.once('ready', () => {
        finishCompile();
      });

      server.watcher.on('change', beginCompile);
      server.watcher.on('add', beginCompile);
      server.watcher.on('unlink', beginCompile);

      const originalSend = server.ws.send;
      server.ws.send = function patchedSend(payload, ...rest) {
        if (payload?.type === 'error') {
          finishCompile({ errors: [payload.err || payload] });
        } else if (payload?.type === 'update' || payload?.type === 'full-reload') {
          scheduleSuccess();
        }

        return originalSend.call(this, payload, ...rest);
      };
    },
    buildStart() {
      beginCompile();
    },
    buildEnd(error) {
      if (error) {
        finishCompile({ errors: [error] });
      } else {
        scheduleSuccess();
      }
    },
    handleHotUpdate(context) {
      beginCompile();
      scheduleSuccess();
      return context.modules;
    },
  };
};

