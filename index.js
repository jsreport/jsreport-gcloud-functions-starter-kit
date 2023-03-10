const JsReport = require('jsreport')
const path = require('path')
const fse = require('fs-extra')
const os = require('os')

let jsreport
const init = (async () => {    
  // precreate cache to skip crawling the directories when finding extensions
    // this may speed up the cold start by ~1s
    precreateExtensionsLocationsCache()

    console.log('creating jsreport')
    jsreport = JsReport({
        configFile: path.join(__dirname, 'prod.config.json')
    })    
    await fse.copy(path.join(__dirname, 'data'), '/tmp/data')
   
    return jsreport.init()
})()

exports.jsreport = async (req, res) => {
    try {
      await init
      
      const r = await jsreport.render(req.body)

      // here you may store the r.content buffer somewhere or respond it in base64
      // I return is as a string for a better initial debugging
      res.send(r.content.toString());
    } catch (e) {
      res.status(400).send(e.toString() + e.stack)
    }    
};

function precreateExtensionsLocationsCache() {    
  const rootDir = path.join(path.dirname(require.resolve('jsreport')), '../../')    
  const locationsPath = path.join(rootDir, 'locations.json')    
  
  if (fse.existsSync(locationsPath)) {
      console.log('locations.json found, extensions crawling will be skipped')
      const locations = JSON.parse(fse.readFileSync(locationsPath)).locations
      const tmpLocationsPath = path.join(os.tmpdir(), 'jsreport', 'core', 'locations.json')

      fse.ensureFileSync(tmpLocationsPath)       
      fse.writeFileSync(tmpLocationsPath, JSON.stringify({
          [path.join(rootDir, 'node_modules') + '/']: {
              rootDirectory: rootDir,
              locations: locations.map(l => path.normalize(path.join(rootDir, l).replace(/\\/g, '/'))),
              lastSync: Date.now()
          }
      }))       
  } else {
      console.log('locations.json not found, the startup will be a bit slower')
  }
}