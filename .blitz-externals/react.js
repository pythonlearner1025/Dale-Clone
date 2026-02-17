/**
 * External shim for react
 * Metro bundles will resolve to this instead of bundling react
 * This exports the global React instance provided by the container app
 */

// During Metro bundling (Node.js), this file is parsed but not fully evaluated
// At runtime on device, global.React will be available from the container
module.exports = typeof global !== 'undefined' && global.React ? global.React : {};
