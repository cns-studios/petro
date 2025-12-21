const pino = require('pino');

const targets = [
  {
    level: 'info',
    target: 'pino/file',
    options: { destination: 'server.log', mkdir: true },
  },
];

if (process.env.NODE_ENV === 'development') {
  targets.push({
    level: 'info',
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  });
} else {
  // In production, log JSON to stdout
  targets.push({
    level: 'info',
    target: 'pino/file',
    options: { destination: 1 }, // 1 is stdout
  });
}

const logger = pino({
  level: process.env.PINO_LOG_LEVEL || 'info',
  transport: {
    targets,
  },
});

module.exports = logger;
