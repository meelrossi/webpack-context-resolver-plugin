const path = require('path');
const fs = require('fs');

class ContextResolverPlugin {

  constructor(appContext, contextNodeModules = []) {
    this.appContext = appContext;
    this.contextNodeModules = contextNodeModules;
  }

  apply(compiler) {

    compiler.plugin('normal-module-factory', (nmf) => {

      // check imports before they are resolved
      nmf.plugin('before-resolve', (result, callback) => {

        if (!this.appContext || !result || result.request[0] !== '.') {
          return callback(null, result);
        }

        let filePath = path.join(result.context, result.request);

        if(filePath.includes('node_modules')){
          let shouldApplyPlugin = false;
          this.contextNodeModules.forEach(
            module => {
              if(filePath.includes(module)) shouldApplyPlugin = true
            }
          );
          if(!shouldApplyPlugin){
            return callback(null, result);            
          }
        }      

        const issuer = result.contextInfo.issuer;
        let contextPath = '';

        // if the filePath form a Directory then it should import the index file
        // from that directory.
        fs.stat(filePath, (error, stats) => {
          if((!error && stats) && stats.isDirectory()) {
            contextPath = `${filePath}/index.${this.appContext}.js`;
          } else {
            const fileParts = path.basename(filePath).split('/').pop().split('.');
            const fileName = fileParts[0];
            const extension = fileParts.length < 2 ? 'js' : fileParts.pop();
            const dirName = path.dirname(filePath);
            contextPath = `${dirName}/${fileName}.${this.appContext}.${extension}`;
          }

          if (contextPath === issuer) {
            return callback(null, result);
          }

          fs.stat(contextPath, (fileError, fileStats) => {
            if (!fileError && fileStats.isFile()) {
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
