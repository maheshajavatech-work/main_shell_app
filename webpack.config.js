const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  remotes: {
    "tasks_mfe": "tasks_mfe@https://d24sj5sfeucquy.cloudfront.net/remoteEntry.js",
    "reports_mfe": "reports_mfe@https://ddhet9i7mvwo.cloudfront.net/remoteEntry.js",
    "settings_mfe": "settings_mfe@https://d23ys2uta19zlw.cloudfront.net/remoteEntry.js"
  },
  

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

});
