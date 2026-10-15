// Local review only. Serves an in-memory adapter; never writes to dist or publishes.
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../..'),dist=path.join(root,'dist');
const server=http.createServer((req,res)=>{try{
 const u=new URL(req.url,'http://127.0.0.1:4321'),n=decodeURIComponent(u.pathname);let file,body,type;
 if(n==='/__skydrake-candidate.glb'||n==='/__skydrake-lod.glb'){file=path.join(root,'art/overhaul/skydrake11/export',n.includes('lod')?'skydrake-lod.glb':'skydrake-candidate.glb');type='model/gltf-binary';}
 else if(n==='/__skydrake-adapter.js'){body=fs.readFileSync(path.join(__dirname,'skydrake-local-adapter11.js'),'utf8');if(u.searchParams.get('variant')!=='full')body=body.replace('/__skydrake-candidate.glb','/__skydrake-lod.glb');type='text/javascript';}
 else {file=path.resolve(dist,'.'+(n==='/'?'/index.html':n));if(!file.startsWith(dist+path.sep)){res.writeHead(403);return res.end();}type=({'.html':'text/html','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream';if(n==='/'){body=fs.readFileSync(file,'utf8').replace('</body>',`<script src="/__skydrake-adapter.js?variant=${u.searchParams.get('variant')==='full'?'full':'lod'}"></script></body>`);}}
 if(body===undefined)body=fs.readFileSync(file);res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
 }catch(e){res.writeHead(404);res.end('Not found');}});
server.listen(4321,'127.0.0.1',()=>console.log('Local SkyDrake review: http://127.0.0.1:4321/ (reduced); ?variant=full (full). Separate browser storage origin. Ctrl+C stops.'));
