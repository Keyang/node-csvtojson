var webpack = require('webpack')
var path = require('path')




/*
 * SplitChunksPlugin is enabled by default and replaced
 * deprecated CommonsChunkPlugin. It automatically identifies modules which
 * should be splitted of chunk by heuristics using module duplication count and
 * module category (i. e. node_modules). And splits the chunks…
 *
 * It is safe to remove "splitChunks" from the generated configuration
 * and was added as an educational example.
 *
 * https://webpack.js.org/plugins/split-chunks-plugin/
 *
 */

module.exports = {
  module: {
    rules: []
  },

  entry: "./index.js",

  output: {
    library: "csv",
    filename: 'csvtojson.js',
    path: path.resolve(__dirname, 'browser'),
    libraryTarget: "umd"
  },

  mode: 'development',
  plugins: [
    new webpack.IgnorePlugin(/fs/),
  ]
}
