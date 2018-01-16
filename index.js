const path = require('path');
const fs = require('fs');

class ContextResolverPlugin {

  constructor(appContext) {
    this.appContext = appContext;
  }

  apply(compiler) {

    compiler.plugin('normal-module-factory', (nmf) => {

      // check imports before they are resolved
      nmf.plugin('before-resolve', (result, callback) => {
        if (!this.appContext || !result || result.request[0] !== '.') {
          return callback(null, result);
        }

        const filePath = path.join(result.context, result.request);
        let contextPath = '';

        // if the filePath form a Directory then it should import the index file
        // from that directory.
        fs.stat(filePath, (error, stats) => {
          if (error || !stats) {
            return callback(null, result);
          }

          if(stats.isDirectory()) {
            contextPath = `${filePath}/index.${this.appContext}.js`;
          } else {
            const [fileName, extension] = path.basename(filePath).split('.');
            const dirName = path.dirname(filePath);
            contextPath = `${dirName}/${fileName}.${this.appContext}.${extension}`;
          }

          fs.stat(contextPath, (fileError, fileStats) => {
            if (fileError) return callback(null, result);

            if (fileStats.isFile()) {
              result.request = contextPath;
            }
            return callback(null, result);
          });
        });
      });
    });
  }
}

module.exports = ContextResolverPlugin;
