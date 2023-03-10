const jsreport = require('jsreport')()
const path = require('path')
const fs = require('fs')

if (process.env.JSREPORT_CLI) {
  // export jsreport instance to make it possible to use jsreport-cli
  module.exports = jsreport
} else {
  jsreport.init().then(() => {
    // we collect extension locations so runtime doesn't need to crawl directories
    // this may speed up the cold start by ~1s
    const extensionDirectories = jsreport.extensionsManager.extensions
        .map(e => path.normalize(path.relative(__dirname, path.join(e.directory, 'jsreport.config.js'))))
    fs.writeFileSync('locations.json', JSON.stringify({
      locations: extensionDirectories
    }))    
    
  }).catch((e) => {
    // error during startup
    console.error(e.stack)
    process.exit(1)
  })
}