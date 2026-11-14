const serverless = require('../dist/src/serverless');

const handler = serverless.default || serverless;

module.exports = (req, res) => {
  return handler(req, res);
};
