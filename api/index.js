let appHandler = null;

module.exports = async (req, res) => {
  try {
    // If Vercel has already parsed or consumed the request stream, mark _body to prevent body-parser crash
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {}
      }
      req._body = true;
    } else if (req.readable === false || req.readableEnded) {
      req.body = req.body || {};
      req._body = true;
    }

    if (!appHandler) {
      const path = require('path');
      const apiNodeModules = path.join(__dirname, '../apps/api/node_modules');
      if (!module.paths.includes(apiNodeModules)) {
        module.paths.unshift(apiNodeModules);
      }

      require('reflect-metadata');
      const serverless = require('../apps/api/dist/src/serverless');
      appHandler = serverless.default || serverless;
    }
    return await appHandler(req, res);
  } catch (err) {
    console.error('SERVERLESS RUNTIME CRASH:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify(
        {
          status: 'error',
          name: err?.name,
          message: err?.message,
          stack: err?.stack,
          nodeVersion: process.version,
          cwd: process.cwd(),
          dirname: __dirname,
        },
        null,
        2,
      ),
    );
  }
};
