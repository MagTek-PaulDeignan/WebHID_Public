const path = require('path');

module.exports = {
  // 1. The entry point: where Webpack starts looking at your code dependencies
  entry: './js/webpack_src.js', 

  // 2. The output: where Webpack should save the bundled bundle
  output: {
    filename: 'mt_device_bundle.js',
    path: path.resolve(__dirname, 'WebPack/dist'),
    clean: true,
    
    // --- Add these lines to output an ES Module ---
    library: {
      type: 'module',
    }
  },  
    optimization: {
      usedExports: true,
      splitChunks: {
      chunks: 'all',
      name: 'vendor', // Puts shared third-party/common code into a vendor.bundle.js
  },
    },

experiments: {
    outputModule: true,
  },
  // 3. Mode: 'development' keeps code readable, 'production' minifies it
  mode: 'production'
 
};