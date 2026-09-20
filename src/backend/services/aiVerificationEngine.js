/**
 * Master AI Pre-Verification Engine Proxy — BlueChain MRV System
 */

const { executePreVerificationPipeline, AI_STATES, ENGINE_VERSION } = require("./aiPreVerificationService");

module.exports = {
  runPreVerificationPipeline: executePreVerificationPipeline,
  executePreVerificationPipeline,
  AI_STATES,
  ENGINE_VERSION
};
