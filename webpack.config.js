const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  remotes: {
    "tasks": "http://localhost:4201/remoteEntry.js",  
    "reports": "http://localhost:4202/remoteEntry.js",  
    "settings": "http://localhost:4203/remoteEntry.js",    
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

});
