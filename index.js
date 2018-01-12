const path = require('path');
var fs = require('fs');

class ContextResolverPlugin {
  constructor(appContext) {
    this.appContext = appContext;
  }

  apply(compiler) {
    compiler.plugin("normal-module-factory", (nmf) => {

      // check imports before they are resolved
      nmf.plugin("before-resolve", (result, callback) => {

        const filePath = path.join(result.context, result.request);
        let contextPath = '';

        if (fs.existsSync(filePath)) {

          // if the filePath form a Directory then it should import the index file
          // from that directory.
          if(fs.lstatSync(filePath).isDirectory()) {
            contextPath = `${filePath}/index.${this.appContext}.js`;
          } else {
            const [fileName, extension] = path.basename(filePath).split('.');
            const dirName = path.dirname(filePath);
            contextPath = `${dirName}/${fileName}.${this.appContext}.${extension}`;
          }
        }

        // it will override the request only if a file with the specific context exists
        if (contextPath && fs.existsSync(contextPath)) {
          result.request = contextPath;
        }

        return callback(null, result);
      });
    });
  }
}

module.exports = ContextResolverPlugin;
