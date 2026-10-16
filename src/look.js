/* LOOK: the semi-realistic rendering layer — procedural textures (grass, rock, bark, wood planks, fine bump),
   low volumetric fog between the islands, the sky dome with sun, the sea of clouds under the islands, a few high
   billboard clouds, and post-processing
   (HDR bloom, filmic tone mapping, colour grade, vignette). Graphics quality is SETTINGS.gfx: 'high' | 'low'.
   Loaded right after core.js; models.js and props.js use the textures. */

/* ---------- low volumetric fog ----------
   Instead of cloud billboards at eye level, a height fog pools under and between the islands: thick below the
   island tops, thin at Darren's height, so the view across an island stays clear and the drops between islands
   melt into soft white mist. It is exponential height fog, integrated along each view ray, with a puffy texture
   taken where the ray meets the fog layer. It replaces three.js's fog chunks, so every fogged material shares it
   (the usual distance fog, scene.fog, still works on top). Tuning: LOWFOG below. */
const LOWFOG = {
  top: -2.0, // metres: the density reference height (just under the island tops at 0)
  fall: 0.17, // how fast the fog thins with height (per metre)
  density: 0.0042, // density at `top`
  max: 0.93, // strongest the fog can get (keeps a hint of what is below)
};
(function installLowFog() {
  const f = v => (Number.isInteger(v) ? v.toFixed(1) : String(v));
  T.ShaderChunk.fog_pars_vertex = `#ifdef USE_FOG
  varying float fogDepth;
  varying vec3 vFogWorld;
#endif`;
  // world position from the view-space position (works for skinned, instanced and sprite vertices alike)
  T.ShaderChunk.fog_vertex = `#ifdef USE_FOG
  fogDepth = - mvPosition.z;
  vFogWorld = cameraPosition + vec3(dot(viewMatrix[0].xyz, mvPosition.xyz), dot(viewMatrix[1].xyz, mvPosition.xyz), dot(viewMatrix[2].xyz, mvPosition.xyz));
#endif`;
  T.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float fogDepth;
  varying vec3 vFogWorld;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
  float lowFogHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float lowFogNoise(vec2 p) {
    vec2 i = floor(p), u = fract(p); u = u * u * (3.0 - 2.0 * u);
    return mix(mix(lowFogHash(i), lowFogHash(i + vec2(1.0, 0.0)), u.x), mix(lowFogHash(i + vec2(0.0, 1.0)), lowFogHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  // how much low fog lies between the camera and this point (0..1), and how bright its puffs are there
  vec2 lowFog(vec3 cam, vec3 pw) {
    vec3 rv = pw - cam;
    float L = length(rv), ry = rv.y, b = ${f(LOWFOG.fall)};
    float camH = clamp(cam.y - (${f(LOWFOG.top)}), -20.0, 60.0);
    float k = b * ry;
    float shape = abs(k) > 0.001 ? (1.0 - exp(-clamp(k, -30.0, 30.0))) / k : 1.0;
    // puffy texture: sample where the ray crosses the layer a few metres under the island tops
    float t = abs(ry) > 0.01 ? clamp(((${f(LOWFOG.top)}) - 3.0 - cam.y) / ry, 0.0, 1.0) : 1.0;
    vec2 q = (cam.xz + rv.xz * t) * 0.045;
    float n = lowFogNoise(q) * 0.6 + lowFogNoise(q * 2.7 + 7.0) * 0.4;
    float amount = ${f(LOWFOG.density)} * L * exp(-b * camH) * shape * (0.65 + 0.7 * n);
    return vec2(min(${f(LOWFOG.max)}, 1.0 - exp(-amount)), n);
  }
#endif`;
  T.ShaderChunk.fog_fragment = `#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
  vec2 lowF = lowFog(cameraPosition, vFogWorld);
  // the mist is the sky colour lifted towards white, brighter on its puffs
  vec3 lowC = mix(fogColor, vec3(0.96, 0.97, 1.0), 0.45 + 0.3 * lowF.y);
  gl_FragColor.rgb = mix( gl_FragColor.rgb, lowC, lowF.x );
#endif`;
})();

/* ---------- procedural textures ---------- */
function makeNoise(n, octaves, seed) {
  // tiling value noise, 0..1, n x n
  let s = seed || 1;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647,
    out = new Float32Array(n * n);
  let amp = 1,
    total = 0;
  for (let o = 0; o < octaves; o++) {
    const g = 4 << o,
      grid = new Float32Array(g * g);
    for (let i = 0; i < g * g; i++) grid[i] = rand();
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const fx = (x / n) * g,
          fy = (y / n) * g,
          x0 = Math.floor(fx),
          y0 = Math.floor(fy),
          tx = fx - x0,
          ty = fy - y0,
          sx = tx * tx * (3 - 2 * tx),
          sy = ty * ty * (3 - 2 * ty),
          a = grid[(y0 % g) * g + (x0 % g)],
          b = grid[(y0 % g) * g + ((x0 + 1) % g)],
          c = grid[((y0 + 1) % g) * g + (x0 % g)],
          d = grid[((y0 + 1) % g) * g + ((x0 + 1) % g)];
        out[y * n + x] += (a + (b - a) * sx + (c - a + (a - b + d - c) * sx) * sy) * amp;
      }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < n * n; i++) out[i] /= total;
  return out;
}
function texFrom(n, fill, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const x = c.getContext('2d'),
    img = x.createImageData(n, n);
  fill(img.data, n);
  x.putImageData(img, 0, 0);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 8;
  if (repeat) t.repeat.set(repeat, repeat);
  t.userData = { canvas: c };
  return t;
}
// normal map from a height field (Sobel)
function normalTex(h, n, strength) {
  return texFrom(n, (d, n) => {
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const at = (xx, yy) => h[((yy + n) % n) * n + ((xx + n) % n)],
          dx = (at(x + 1, y) - at(x - 1, y)) * strength,
          dy = (at(x, y + 1) - at(x, y - 1)) * strength,
          l = Math.hypot(dx, dy, 1),
          i = (y * n + x) * 4;
        d[i] = (-dx / l) * 127 + 128;
        d[i + 1] = (-dy / l) * 127 + 128;
        d[i + 2] = (1 / l) * 255;
        d[i + 3] = 255;
      }
  });
}
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const LOOKTEX = {};
function lookTex(kind) {
  if (LOOKTEX[kind]) return LOOKTEX[kind];
  const n = COARSE ? 256 : 512;
  let r;
  if (kind === 'grass') {
    const h = makeNoise(n, 6, 11),
      big = makeNoise(n, 2, 5),
      blades = makeNoise(n, 1, 7);
    const map = texFrom(n, (d, n) => {
      for (let i = 0; i < n * n; i++) {
        const v = h[i],
          b = big[i];
        let c = mixc([62, 112, 38], [104, 150, 52], v);
        c = mixc(c, [128, 138, 60], Math.max(0, b - 0.55) * 1.6); // dry patches
        c = mixc(c, [40, 80, 30], Math.max(0, 0.42 - v) * 1.4); // shade
        const sp = blades[(i * 7) % (n * n)] > 0.78 ? 0.85 : 1;
        d[i * 4] = c[0] * sp;
        d[i * 4 + 1] = c[1] * sp;
        d[i * 4 + 2] = c[2] * sp;
        d[i * 4 + 3] = 255;
      }
    });
    map.encoding = T.sRGBEncoding;
    r = { map, normalMap: normalTex(h, n, 6) };
  } else if (kind === 'rock') {
    const h = makeNoise(n, 6, 23),
      fine = makeNoise(n, 3, 29);
    const map = texFrom(n, (d, n) => {
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const i = y * n + x,
            band = 0.5 + 0.5 * Math.sin((y / n) * TAU * 7 + h[i] * 6),
            v = h[i] * 0.6 + band * 0.25 + fine[i] * 0.15;
          let c = mixc([88, 76, 64], [150, 136, 116], v);
          c = mixc(c, [118, 98, 70], band * 0.3);
          d[i * 4] = c[0];
          d[i * 4 + 1] = c[1];
          d[i * 4 + 2] = c[2];
          d[i * 4 + 3] = 255;
        }
    });
    map.encoding = T.sRGBEncoding;
    const hh = new Float32Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        hh[y * n + x] = h[y * n + x] * 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((y / n) * TAU * 7 + h[y * n + x] * 6));
    r = { map, normalMap: normalTex(hh, n, 9) };
  } else if (kind === 'stone') {
    const h = makeNoise(n, 6, 41);
    const map = texFrom(n, (d, n) => {
      for (let i = 0; i < n * n; i++) {
        const c = mixc([118, 114, 108], [178, 172, 162], h[i]);
        d[i * 4] = c[0];
        d[i * 4 + 1] = c[1];
        d[i * 4 + 2] = c[2];
        d[i * 4 + 3] = 255;
      }
    });
    map.encoding = T.sRGBEncoding;
    r = { map, normalMap: normalTex(h, n, 7) };
  } else if (kind === 'bark') {
    const m = 256,
      h = makeNoise(m, 5, 53);
    const hs = new Float32Array(m * m);
    for (let y = 0; y < m; y++)
      for (let x = 0; x < m; x++)
        hs[y * m + x] =
          0.5 + 0.5 * Math.sin((x / m) * TAU * 9 + h[((y >> 3) % m) * m + x] * 8) * 0.8 + h[y * m + x] * 0.2;
    const map = texFrom(m, (d, n) => {
      for (let i = 0; i < n * n; i++) {
        const c = mixc([64, 42, 28], [128, 90, 58], hs[i]);
        d[i * 4] = c[0];
        d[i * 4 + 1] = c[1];
        d[i * 4 + 2] = c[2];
        d[i * 4 + 3] = 255;
      }
    });
    map.encoding = T.sRGBEncoding;
    r = { map, normalMap: normalTex(hs, m, 5) };
  } else if (kind === 'plank') {
    const m = 256,
      h = makeNoise(m, 5, 61);
    const hs = new Float32Array(m * m);
    for (let y = 0; y < m; y++)
      for (let x = 0; x < m; x++) hs[y * m + x] = 0.5 + 0.5 * Math.sin((x / m) * TAU * 3 + h[y * m + x] * 10);
    const map = texFrom(m, (d, n) => {
      for (let i = 0; i < n * n; i++) {
        const c = mixc([96, 64, 40], [168, 120, 78], hs[i] * 0.7 + h[i] * 0.3);
        d[i * 4] = c[0];
        d[i * 4 + 1] = c[1];
        d[i * 4 + 2] = c[2];
        d[i * 4 + 3] = 255;
      }
    });
    map.encoding = T.sRGBEncoding;
    r = { map, normalMap: normalTex(hs, m, 3) };
  } else if (kind === 'fine') {
    // subtle surface grain for characters and props
    const m = 256,
      h = makeNoise(m, 4, 71);
    r = { normalMap: normalTex(h, m, 2.5) };
  } else if (kind === 'snow') {
    const h = makeNoise(n, 5, 83);
    const map = texFrom(n, (d, n) => {
      for (let i = 0; i < n * n; i++) {
        const c = mixc([196, 208, 224], [232, 238, 246], h[i]);
        d[i * 4] = c[0];
        d[i * 4 + 1] = c[1];
        d[i * 4 + 2] = c[2];
        d[i * 4 + 3] = 255;
      }
    });
    map.encoding = T.sRGBEncoding;
    r = { map, normalMap: normalTex(h, n, 4) };
  }
  return (LOOKTEX[kind] = r);
}
// a textured lit material; `rep` repeats the texture
function lookMat(kind, color, rep, o) {
  const tx = lookTex(kind),
    clone = t => {
      if (!t) return null;
      const c = t.clone();
      c.needsUpdate = true;
      c.repeat.set(rep || 1, rep || 1);
      return c;
    };
  return new T.MeshStandardMaterial(
    Object.assign(
      {
        color: color === undefined ? 0xffffff : color,
        map: clone(tx.map),
        normalMap: clone(tx.normalMap),
        normalScale: new T.Vector2(1, 1),
        roughness: 0.9,
        metalness: 0,
      },
      o || {},
    ),
  );
}

// average normals of vertices that share a position, so jittered blobs shade smoothly
function smoothNormals(geo) {
  geo.computeVertexNormals();
  const p = geo.attributes.position,
    n = geo.attributes.normal,
    acc = {};
  for (let i = 0; i < p.count; i++) {
    const k = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3),
      a = acc[k] || (acc[k] = [0, 0, 0, []]);
    a[0] += n.getX(i);
    a[1] += n.getY(i);
    a[2] += n.getZ(i);
    a[3].push(i);
  }
  for (const k in acc) {
    const a = acc[k],
      l = Math.hypot(a[0], a[1], a[2]) || 1;
    for (const i of a[3]) n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l);
  }
  n.needsUpdate = true;
  return geo;
}
/* ---------- sky dome ---------- */
const SKY = {
  top: new T.Color(0x1d58b0),
  mid: new T.Color(0x5b9ddf),
  horizon: new T.Color(0xc4dcee),
  sunDir: new T.Vector3(0.45, 0.62, 0.35).normalize(),
};
function buildSkyDome() {
  const m = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: SKY.top.clone().convertSRGBToLinear() },
      uMid: { value: SKY.mid.clone().convertSRGBToLinear() },
      uHor: { value: SKY.horizon.clone().convertSRGBToLinear() },
      uSun: { value: SKY.sunDir },
    },
    vertexShader:
      'varying vec3 vD;void main(){vD=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w*0.9999;}',
    fragmentShader: `uniform vec3 uTop,uMid,uHor,uSun;varying vec3 vD;
      void main(){
        float h=vD.y;
        vec3 c=mix(uHor,uMid,smoothstep(-0.02,0.22,h));
        c=mix(c,uTop,smoothstep(0.2,0.85,h));
        c=mix(c,uHor*0.9,smoothstep(0.0,-0.25,h));
        float s=max(dot(vD,uSun),0.0);
        c+=vec3(1.0,0.86,0.62)*(pow(s,8.0)*0.35+pow(s,64.0)*0.8)+vec3(1.0,0.95,0.85)*smoothstep(0.9985,0.9995,s)*6.0;
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,
  });
  const d = new T.Mesh(new T.SphereGeometry(500, 48, 24), m);
  d.frustumCulled = false;
  d.renderOrder = -10;
  return d;
}

/* ---------- the sea of clouds below the islands ---------- */
function buildCloudSea() {
  const m = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: false,
    uniforms: {
      uT: { value: 0 },
      uHor: { value: SKY.horizon.clone().convertSRGBToLinear() },
      uSun: { value: SKY.sunDir },
      uCam: { value: new T.Vector3() },
    },
    vertexShader:
      'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: `uniform float uT;uniform vec3 uHor,uSun,uCam;varying vec3 vW;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=0.5;}return v;}
      void main(){
        vec2 p=vW.xz*0.012+vec2(uT*0.004,uT*0.002);
        float n=fbm(p)*0.7+fbm(p*3.1-uT*0.01)*0.3;
        float puff=smoothstep(0.32,0.75,n);
        vec3 base=mix(vec3(0.5,0.62,0.8),vec3(1.0,0.98,0.95),puff);
        base+=vec3(1.0,0.85,0.6)*0.15*puff*max(uSun.y,0.0);
        float d=length(vW.xz-uCam.xz);
        float fade=1.0-smoothstep(260.0,520.0,d);
        vec3 c=mix(uHor,base,fade*0.85+0.15);
        // seen through the low fog: lifted towards the same soft white mist (look.js LOWFOG)
        c=mix(c,mix(uHor,vec3(0.96,0.97,1.0),0.55+0.25*puff),0.55);
        gl_FragColor=vec4(c,0.7+0.3*puff);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`,
  });
  const p = new T.Mesh(new T.PlaneGeometry(1400, 1400, 1, 1), m);
  p.rotation.x = -PI / 2;
  p.position.y = -48;
  p.renderOrder = -5;
  return p;
}

/* ---------- soft billboard clouds ---------- */
const CLOUD_TEX = (function () {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  for (let i = 0; i < 26; i++) {
    const px = 64 + (Math.random() - 0.5) * 70,
      py = 70 + (Math.random() - 0.5) * 34,
      r = 14 + Math.random() * 26,
      g = x.createRadialGradient(px, py, 0, px, py, r);
    const sh = py > 74 ? 0.9 : 1;
    g.addColorStop(0, `rgba(${255 * sh},${255 * sh},${255 * sh},0.7)`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.beginPath();
    x.arc(px, py, r, 0, TAU);
    x.fill();
  }
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  return t;
})();
function buildSoftCloud() {
  const g = new T.Group(),
    n = 3 + Math.floor(rnd(4));
  for (let j = 0; j < n; j++) {
    const s = new T.Sprite(
      new T.SpriteMaterial({
        map: CLOUD_TEX,
        transparent: true,
        depthWrite: false,
        opacity: rnd(0.75, 0.95),
        fog: true,
      }),
    );
    const k = rnd(16, 34);
    s.scale.set(k * 1.8, k, 1);
    s.position.set((j - n / 2) * k * 0.7 + rnd(-4, 4), rnd(-3, 3), rnd(-5, 5));
    g.add(s);
  }
  return g;
}

/* ---------- post-processing ---------- */
const POST = { on: false, composer: null, bloom: null, grade: null };
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uExposure: { value: 1.08 },
    uVig: { value: 0.34 },
    uSat: { value: 1.12 },
    uWarm: { value: 0.025 },
  },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uExposure,uVig,uSat,uWarm;varying vec2 vUv;
    vec3 aces(vec3 x){x*=0.6;return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
    void main(){
      vec3 c=texture2D(tDiffuse,vUv).rgb*uExposure;
      c=aces(c);
      c=mix(c,c*c*(3.0-2.0*c),0.22); // gentle S-curve for contrast
      float l=dot(c,vec3(0.2126,0.7152,0.0722));
      c=mix(vec3(l),c,uSat);
      c+=vec3(uWarm,uWarm*0.4,-uWarm)*(1.0-l);
      vec2 q=vUv-0.5;
      c*=1.0-uVig*dot(q,q)*1.6;
      c=pow(max(c,0.0),vec3(1.0/2.2));
      gl_FragColor=vec4(c,1.0);
    }`,
};
function canPost() {
  return !!(T.EffectComposer && T.RenderPass && T.UnrealBloomPass && T.ShaderPass);
}
function setupPost() {
  if (!canPost()) return false;
  const w = renderer.domElement.width,
    h = renderer.domElement.height;
  let rt;
  const opts = { format: T.RGBAFormat, type: renderer.capabilities.isWebGL2 ? T.HalfFloatType : T.UnsignedByteType };
  if (renderer.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget) {
    rt = new T.WebGLMultisampleRenderTarget(w, h, opts);
    rt.samples = 4;
  } else rt = new T.WebGLRenderTarget(w, h, opts);
  const c = new T.EffectComposer(renderer, rt);
  c.addPass(new T.RenderPass(scene, camera));
  const bloom = new T.UnrealBloomPass(new T.Vector2(w / 2, h / 2), 0.28, 0.5, 0.97);
  c.addPass(bloom);
  const grade = new T.ShaderPass(GradeShader);
  c.addPass(grade);
  POST.composer = c;
  POST.bloom = bloom;
  POST.grade = grade;
  return true;
}
// switch quality live: 'high' = bloom + grade + shadows + dense grass, 'low' = direct render with ACES tone mapping
function setGfx(mode) {
  const high = mode === 'high' && (POST.composer || setupPost());
  POST.on = !!high;
  renderer.toneMapping = high ? T.NoToneMapping : T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputEncoding = high ? T.LinearEncoding : T.sRGBEncoding;
  scene.traverse(o => {
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => (m.needsUpdate = true));
  });
  resizePost();
}
function resizePost() {
  if (!POST.composer) return;
  const w = renderer.domElement.width,
    h = renderer.domElement.height;
  POST.composer.setPixelRatio(1);
  POST.composer.setSize(w, h);
}
addEventListener('resize', () => setTimeout(resizePost, 0));
function renderFrame() {
  if (POST.on) POST.composer.render();
  else renderer.render(scene, camera);
}
SETTINGS.gfx = gfxFor(SETTINGS.graphics);

/* ---------- contact shadows: soft dark blobs that ground characters (on every quality level) ---------- */
const BLOB_TEX = (function () {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'),
    g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(0.6, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c);
})();
const BLOBS = [];
const BLOB_GEO = new T.PlaneGeometry(1, 1);
BLOB_GEO.rotateX(-PI / 2);
function blobAt(i, x, y, z, r) {
  let b = BLOBS[i];
  if (!b) {
    b = BLOBS[i] = new T.Mesh(
      BLOB_GEO,
      new T.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, depthWrite: false, fog: true }),
    );
    b.renderOrder = 1;
    scene.add(b);
  }
  const ok = groundAt(x, z) && y > -0.5;
  b.visible = ok;
  if (!ok) return;
  const k = Math.max(0, 1 - Math.max(0, y) / 7);
  b.position.set(x, 0.03, z);
  b.scale.setScalar(r * (1.4 - k * 0.4) * 2);
  b.material.opacity = k * 0.9;
}
function updateBlobs() {
  let i = 0;
  blobAt(i++, P.x, P.y, P.z, 0.6);
  if (LV.ruffy && LV.ruffy.root.visible)
    blobAt(i++, LV.ruffy.root.position.x, LV.ruffy.root.position.y, LV.ruffy.root.position.z, 0.45);
  if (typeof DUMP !== 'undefined' && DUMP.on && DUMP.m)
    blobAt(i++, DUMP.x, DUMP.y, DUMP.z, (0.85 + DUMP.vis * 0.35) * DATA.dumpling.scale);
  if (LV.mom && LV.mom.root.visible && LV.mom.root.parent)
    blobAt(i++, LV.mom.root.position.x, 0, LV.mom.root.position.z, 0.65);
  for (const e of G.enemies) {
    if (i > 30) break;
    if (!e.alive || e.under || e.d.static) continue;
    blobAt(i++, e.x, e.y, e.z, e.r * (e.d.boss ? 1.1 : 1.2));
  }
  for (; i < BLOBS.length; i++) BLOBS[i].visible = false;
}

/* ---------- ambience: wind, birds, footsteps, wing beats ---------- */
const AMB = { wind: null, windF: null, birdT: 3, stepPh: 0 };
function ambStart() {
  const c = Snd.ctx;
  if (!c || AMB.wind) return;
  const src = c.createBufferSource();
  src.buffer = Snd.nb;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 420;
  f.Q.value = 0.4;
  const g = c.createGain();
  g.gain.value = 0;
  src.connect(f);
  f.connect(g);
  g.connect(Snd.out);
  src.start();
  AMB.wind = g;
  AMB.windF = f;
}
function ambTick(dt) {
  if (!Snd.ctx) return;
  ambStart();
  const t = Snd.ctx.currentTime,
    play = G.mode === 'play',
    fly = P.fly ? 1 : 0,
    speed = Math.hypot(P.vx, P.vz);
  // wind rises with height and while flying
  const w =
    (0.05 + Math.min(0.12, Math.max(0, P.y) * 0.008) + fly * 0.05 + Math.sin(t * 0.21) * 0.02) *
    (play || G.mode === 'title' ? 1 : 0.5);
  AMB.wind.gain.setTargetAtTime(w, t, 0.6);
  AMB.windF.frequency.setTargetAtTime(380 + fly * speed * 40 + Math.sin(t * 0.37) * 120, t, 0.5);
  // birds on calm islands
  AMB.birdT -= dt;
  const calm = !G.enemies.some(e => e.alive && !e.d.static && Math.hypot(e.x - P.x, e.z - P.z) < 25);
  if (AMB.birdT <= 0) {
    AMB.birdT = rnd(3, 9);
    if (calm && !CH.snowfall) chirp();
  }
}
function chirp() {
  const c = Snd.ctx,
    t0 = c.currentTime,
    base = rnd(2200, 3600),
    n = 2 + Math.floor(rnd(4));
  for (let i = 0; i < n; i++) {
    const t = t0 + i * rnd(0.09, 0.16),
      o = c.createOscillator(),
      g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(base * rnd(0.9, 1.1), t);
    o.frequency.exponentialRampToValueAtTime(base * rnd(1.2, 1.5), t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.025, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g);
    g.connect(Snd.out);
    o.start(t);
    o.stop(t + 0.1);
  }
}
// called by animDarren with the run phase; a footstep on every half cycle
function footstep(ph, spd) {
  const half = Math.floor(ph / PI);
  if (half === AMB.stepPh) return;
  AMB.stepPh = half;
  if (!P.onG || spd < 2) return;
  const fx = Math.sin(P.face),
    fz = Math.cos(P.face),
    side = half % 2 ? 0.18 : -0.18;
  burst(
    puffs,
    P.x + Math.cos(P.face) * side - fx * 0.1,
    0.08,
    P.z - Math.sin(P.face) * side - fz * 0.1,
    2,
    0.8,
    0.45,
    CH.snowfall ? 0xffffff : 0xd8ceb4,
    0.35,
    { flat: true, up: 0.3, a: 0.35, dr: 3 },
  );
  if (!Snd.ctx) return;
  Snd.noise(0.06, 0.05 + spd * 0.004, CH.snowfall ? 1800 : 900, 300, 1.2);
}
function wingBeat() {
  if (!Snd.ctx) return;
  Snd.noise(0.18, 0.06, 260, 120, 0.8);
}
