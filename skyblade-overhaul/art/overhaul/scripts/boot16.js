/* Required-script startup gate. Models keep their existing asynchronous fallbacks. */
(() => {
  'use strict';
  const screen = document.getElementById('startup16');
  const message = document.getElementById('startupMessage16');
  const retry = document.getElementById('startupRetry16');
  const game = document.getElementById('game');
  const state = window.__skybladeBoot = {pending:true,status:'loading',loaded:[],failed:null};
  const stopInput = event => { if (state.pending) event.stopImmediatePropagation(); };
  window.addEventListener('keydown', stopInput, true);
  window.addEventListener('keyup', stopInput, true);
  function validate(file) {
    const data = window.DARREN_DATA;
    const chapter = id => data?.chapters?.find(c => c.id === id);
    if (file === 'vendor/three.min.js' && !window.THREE) throw Error('Renderer module unavailable');
    if (file === 'vendor/GLTFLoader.js' && !window.THREE?.GLTFLoader) throw Error('Model loader unavailable');
    if (file === 'data/game_data.js' && !chapter('ch1')) throw Error('Chapter 1 data unavailable');
    if (file === 'data/chapter2.js' && !chapter('ch2')) throw Error('Chapter 2 data unavailable');
    if (file === 'data/adventure.js' && data?.adventure?.id !== 'adv') throw Error('Adventure data unavailable');
    if (file === 'data/stormglass.js') {
      if (!['ch1','ch2','ch3'].every(id => {
        const c=chapter(id);return c?.story&&c.ending&&c.level?.islands?.length&&c.zones?.length;
      })) throw Error('Required chapter data incomplete');
      if (new Set(data.chapters.map(c=>c.id)).size !== data.chapters.length) throw Error('Duplicate chapter data');
    }
    if (file === 'src/level.js' && !window.__game) throw Error('Game initialization incomplete');
    if (file === 'src/menu.js' && typeof openPanel !== 'function') throw Error('Menu initialization incomplete');
  }
  function load(file) {
    return new Promise((resolve,reject) => {
      const script=document.createElement('script'),url=new URL(file,document.baseURI).href;
      let settled=false;
      const finish=error=>{
        if(settled)return;settled=true;clearTimeout(timer);
        window.removeEventListener('error',runtimeError,true);
        script.onload=script.onerror=null;
        if(error){script.remove();reject(error)}else resolve();
      };
      const runtimeError=event=>{if(event.filename===url)finish(Error(event.message||'Script execution failed'))};
      const timer=setTimeout(()=>finish(Error('Required script timed out')),20000);
      window.addEventListener('error',runtimeError,true);
      script.async=false;script.src=file;
      script.onerror=()=>finish(Error('Required script download failed'));
      script.onload=()=>{try{validate(file);finish()}catch(error){finish(error)}};
      document.body.appendChild(script);
    });
  }
  async function start() {
    let file='startup module list';
    try {
      const files=JSON.parse(document.getElementById('startupModules16').textContent);
      for(file of files){await load(file);state.loaded.push(file)}
      state.pending=false;state.status='ready';game.inert=false;screen.hidden=true;
      window.removeEventListener('keydown',stopInput,true);window.removeEventListener('keyup',stopInput,true);
    } catch(error) {
      state.failed={file,message:String(error.message||error)};state.status='error';
      screen.dataset.state='error';screen.setAttribute('role','alert');
      message.textContent='The game could not finish loading. Please retry.';
      retry.hidden=false;retry.focus();
    }
  }
  start();
})();
