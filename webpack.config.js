// shell/webpack.config.js
const { shareAll, withModuleFederationPlugin } =
  require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin(
  {
    // no hard‑coded remotes—manifest loader will populate them
    shared: shareAll({
      singleton:     true,
      strictVersion: true,
      requiredVersion: 'auto',
      eager:         false
    })
  },
  {
    output: {
      publicPath:   'auto',
      chunkLoading: 'jsonp',               // kills import.meta errors
      library:      { type: 'var', name: 'shell_app' }  // var‑based share scope
    }
  }
);
