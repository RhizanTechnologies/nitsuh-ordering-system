let appHandler = null;

module.exports = async (req, res) => {
  try {
    if (!appHandler) {
      const path = require('path');
      const localNodeModules = path.join(__dirname, '../node_modules');
      const rootNodeModules = path.join(__dirname, '../../../node_modules');
      if (!module.paths.includes(localNodeModules)) module.paths.unshift(localNodeModules);
      if (!module.paths.includes(rootNodeModules)) module.paths.push(rootNodeModules);

      require('reflect-metadata');
      const serverless = require('../dist/src/serverless');
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
