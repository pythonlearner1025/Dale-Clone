/**
 * External shim for react-native
 * Metro bundles will resolve to this instead of bundling react-native
 * This exports the global ReactNative instance provided by the container app
 */

// During Metro bundling (Node.js), this file is parsed but not fully evaluated
// At runtime on device, global.ReactNative will be available from the container
module.exports = typeof global !== 'undefined' && global.ReactNative ? global.ReactNative : {};
