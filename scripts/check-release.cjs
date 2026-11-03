const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const version=html.match(/<meta name="cpc-release" content="(\d+)"/i)?.[1];
const body=html.match(/<body data-cpc-version="(\d+)"/i)?.[1];
const cache=sw.match(/CACHE_PREFIX\+'v(\d+)'/)?.[1];
if(!version||version!==body||version!==cache)throw Error(`Version mismatch: meta=${version}, body=${body}, SW=${cache}`);
for(const x of ['id="home"','id="picker"','id="prayer"','cpcMassCreedGesture','cpcSingaporeCalendarData','cpcScheduleAuto']){
 if(!html.includes(x))throw Error(`Missing app feature: ${x}`);
}
if(!fs.existsSync('manifest.webmanifest'))throw Error('Missing PWA manifest');
console.log(`Catholic Companion v${version}: version, core symbols and PWA files present`);
