const path = require('path');
const fs = require('fs');

let handler = null;
let initError = null;

function getHandler() {
  if (handler) return handler;
  try {
    // Try multiple possible paths for the compiled bundle depending on Vercel Lambda layout
    const candidates = [
      path.join(__dirname, '../dist/src/serverless'),
      path.join(process.cwd(), 'dist/src/serverless'),
      path.join(process.cwd(), 'apps/api/dist/src/serverless'),
    ];

    let loaded = null;
    let lastErr = null;

    for (const cand of candidates) {
      try {
        loaded = require(cand);
        if (loaded) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!loaded) {
      throw lastErr || new Error('Could not find compiled serverless bundle in candidates');
    }

    handler = loaded.default || loaded;
    return handler;
  } catch (err) {
    initError = err;
    console.error('Failed to load serverless bundle:', err);
    return null;
  }
}

module.exports = async (req, res) => {
  const h = getHandler();

  if (!h) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify(
        {
          status: 'error',
          stage: 'module_initialization',
          errorName: initError?.name,
          errorMessage: initError?.message,
          stack: initError?.stack,
          cwd: process.cwd(),
          dirname: __dirname,
          cwdFiles: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : [],
        },
        null,
        2,
      ),
    );
  }

  try {
    return await h(req, res);
  } catch (err) {
    console.error('Handler execution error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify(
          {
            status: 'error',
            stage: 'request_handling',
            errorName: err?.name,
            errorMessage: err?.message,
            stack: err?.stack,
          },
          null,
          2,
        ),
      );
    }
  }
};
