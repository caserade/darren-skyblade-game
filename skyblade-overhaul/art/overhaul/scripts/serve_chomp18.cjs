const http=require('http'),fs=require('fs'),path=require('path');
const dist=path.resolve(__dirname,'../chomp18/release/dist');
http.createServer((req,res)=>{try{const n=decodeURIComponent(new URL(req.url,'http://localhost').pathname),f=path.resolve(dist,'.'+(n==='/'?'/index.html':n));if(!f.startsWith(dist+path.sep)){res.writeHead(403);return res.end()};const body=fs.readFileSync(f);res.writeHead(200,{'Cache-Control':'no-store','Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream'});res.end(body)}catch(e){res.writeHead(404);res.end('Not found')}}).listen(4325,'127.0.0.1',()=>console.log('Local SkyDrake release candidate http://127.0.0.1:4325/'));


