const path = require('path');

// Add apps/api/node_modules and root node_modules to module lookup paths
const localNodeModules = path.join(__dirname, '../node_modules');
const rootNodeModules = path.join(__dirname, '../../../node_modules');
if (!module.paths.includes(localNodeModules)) {
  module.paths.unshift(localNodeModules);
}
if (!module.paths.includes(rootNodeModules)) {
  module.paths.push(rootNodeModules);
}

// Static requires for Vercel Node File Trace (@vercel/nft)
require('reflect-metadata');
require('@nestjs/core');
require('@nestjs/common');
require('@nestjs/platform-express');
require('@nestjs/websockets');
require('@nestjs/platform-socket.io');
require('@nestjs/jwt');
require('@nestjs/passport');
require('passport');
require('passport-jwt');
require('bcryptjs');
require('class-transformer');
require('class-validator');
require('rxjs');
require('express');
require('@prisma/client');

const serverless = require('../dist/src/serverless');

const handler = serverless.default || serverless;

module.exports = async (req, res) => {
  try {
    return await handler(req, res);
  } catch (err) {
    console.error('Handler execution error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          status: 'error',
          stage: 'handler_execution',
          message: err?.message || 'Server error',
          stack: err?.stack,
        }),
      );
    }
  }
};
