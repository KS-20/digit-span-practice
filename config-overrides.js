// need to polyfill node modules, see : https://www.alchemy.com/blog/how-to-polyfill-node-core-modules-in-webpack-5 

const webpack = require('webpack'); 
module.exports = function override(config) { 
	const fallback = config.resolve.fallback || {}; 
	Object.assign(fallback, { 
		"crypto": require.resolve("crypto-browserify"),
		"stream": require.resolve("stream-browserify"), 
	}) 
	config.resolve.fallback = fallback; 
	config.plugins = (config.plugins || []).concat([ 
		new webpack.ProvidePlugin({ 
			process: 'process/browser', 
			Buffer: ['buffer', 'Buffer'] 
		}) 
	]) 
	return config; 
}