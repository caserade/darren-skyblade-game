/* SKIN: loads the Blender-rigged Darren (assets/darren_model.js) and drives its bones from the same pose
   numbers the toy model uses. Bone names must match blender/darren_rig3.py. */
/* ---------- skinned Darren (Hi3D model rigged in Blender) ---------- */
const SK_EU = new T.Euler(),
  SK_Q = new T.Quaternion();
const RZP = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), PI / 2),
  RZN = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), -PI / 2);
// Pose a bone by a rotation given in model-aligned axes (the same axes the pose table uses), whatever the bone's own rest orientation is.
function setBone(b, x, y, z, post) {
  if (!b) return;
  SK_EU.set(x, y, z);
  SK_Q.setFromEuler(SK_EU);
  if (post) SK_Q.multiply(post);
  b.bone.quaternion.copy(b.pwi).multiply(SK_Q).multiply(b.pw).multiply(b.rl);
}
function applySkin(D, cp, t) {
  const B = D.bones;
  setBone(B.spine, cp.bp, cp.byw, cp.br);
  setBone(B.head, cp.hp - cp.bp * 0.45, cp.hy - cp.byw * 0.5, 0);
  setBone(B.arm_R, cp.aRx, cp.aRy, cp.aRz, RZP);
  setBone(B.arm_L, cp.aLx, cp.aLy, cp.aLz, RZN);
  setBone(B.leg_L, cp.lL, 0, 0);
  setBone(B.leg_R, cp.lR, 0, 0);
  const wg = cp.wing - D.wingRest;
  setBone(B.wing_L, 0, wg, cp.wf);
  setBone(B.wing_R, 0, -wg, -cp.wf);
  setBone(B.wingtip_L, 0, wg * 0.35, cp.wf * 0.5);
  setBone(B.wingtip_R, 0, -wg * 0.35, -cp.wf * 0.5);
  for (let i = 0; i < D.tailN; i++)
    setBone(
      B['tail_' + (i + 1)],
      (cp.tail - 0.13) * (1 + i * 0.15) + (i === 0 ? -cp.bp * 0.5 : 0) + Math.sin(t * 3 - i * 0.7) * 0.04,
      cp.ty * 0.4 + Math.sin(t * 2.4 - i * 0.6) * 0.05,
      0,
    );
}
function loadDarrenGLB(url) {
  if (!T.GLTFLoader) return;
  // the rigged model ships as base64 text in assets/darren_model.js (window.DARREN_MODEL_B64)
  const b64 = window.DARREN_MODEL_B64;
  if (!b64) return;
  try {
    const bin = atob(b64.trim()),
      buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    new T.GLTFLoader().parse(buf.buffer.slice(0), '', onModel, () => {});
    // a second copy of the same rig becomes Mom
    new T.GLTFLoader().parse(
      buf.buffer.slice(0),
      '',
      g => {
        try {
          const D = skinnedRig(g.scene);
          if (D) buildMomSkinned(D);
        } catch (e) {
          console.warn('Mom model swap failed', e);
        }
      },
      () => {},
    );
    // and a third becomes Gearwing, the Skyforge's forgemaster (Adventure mode)
    new T.GLTFLoader().parse(
      buf.buffer.slice(0),
      '',
      g => {
        try {
          const D = skinnedRig(g.scene);
          if (D) buildGearwing(D);
        } catch (e) {
          console.warn('Gearwing model failed', e);
        }
      },
      () => {},
    );
  } catch (_) {}
  function onModel(gltf) {
    try {
      const sc = gltf.scene;
      sc.updateMatrixWorld(true);
      const bones = {},
        names = [
          'hips',
          'spine',
          'head',
          'arm_L',
          'arm_R',
          'hand_L',
          'hand_R',
          'leg_L',
          'leg_R',
          'wing_L',
          'wing_R',
          'wingtip_L',
          'wingtip_R',
        ];
      for (let i = 1; i <= 8; i++) names.push('tail_' + i);
      let tailN = 0;
      for (const n of names) {
        const bone = sc.getObjectByName(n);
        if (!bone) continue;
        const pw = new T.Quaternion();
        bone.parent.getWorldQuaternion(pw);
        bones[n] = {
          bone,
          rl: bone.quaternion.clone(),
          pw,
          pwi: pw.clone().invert(),
          rw: bone.getWorldQuaternion(new T.Quaternion()),
          rm: bone.matrixWorld.clone(),
        };
        if (n.indexOf('tail_') === 0) tailN++;
      }
      if (!bones.spine || !bones.arm_R || !bones.hand_R) return;
      const root = new T.Group(),
        piv = grp(root, 0, 0.8, 0),
        rig = grp(piv, 0, -0.8, 0);
      rig.add(sc);
      sc.traverse(o => {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.frustumCulled = false;
        const m = o.material;
        // semi-realistic skin: satin scales with a faint grain instead of glossy plastic
        m.roughness = 0.5;
        m.metalness = 0;
        m.normalMap = lookTex('fine').normalMap;
        m.normalScale = new T.Vector2(0.25, 0.25);
        if (window.ENV_TEX) {
          m.envMap = window.ENV_TEX;
          m.envMapIntensity = 0.55;
        }
        m.needsUpdate = true;
      });
      const sw = buildSword(),
        sock = new T.Group();
      bones.arm_R.bone.add(sock);
      sock.position.copy(bones.hand_R.bone.position);
      sock.quaternion.copy(bones.arm_R.rw).invert().multiply(RZN);
      sock.add(sw.g);
      // left-hand socket for the L-arm weapon (Twin Arms)
      const sockL = new T.Group();
      if (bones.arm_L && bones.hand_L) {
        bones.arm_L.bone.add(sockL);
        sockL.position.copy(bones.hand_L.bone.position);
        sockL.quaternion.copy(bones.arm_L.rw).invert().multiply(RZP);
      }
      const D = {
        sockL,
        skin: true,
        root,
        piv,
        rig,
        bones,
        tailN,
        wingRest: 0.3,
        sword: sw.g,
        sBase: sw.base,
        sTip: sw.tip,
        bladeMat: sw.bladeMat,
      };
      scene.remove(P.m.root);
      P.m = D;
      scene.add(root);
      equipWeapon(P.weapon || UNLOCKS.weapon);
      if (window.refreshHands) refreshHands();
      if (window.attachArmor) attachArmor();
      window.__skinned = true;
    } catch (e) {
      console.warn('Darren model swap failed', e);
    }
  }
}

/* the same bone setup as Darren's, without the sword (used for Mom) */
function skinnedRig(sc) {
  sc.updateMatrixWorld(true);
  const bones = {},
    names = [
      'hips',
      'spine',
      'head',
      'arm_L',
      'arm_R',
      'hand_L',
      'hand_R',
      'leg_L',
      'leg_R',
      'wing_L',
      'wing_R',
      'wingtip_L',
      'wingtip_R',
    ];
  for (let i = 1; i <= 8; i++) names.push('tail_' + i);
  let tailN = 0;
  for (const n of names) {
    const bone = sc.getObjectByName(n);
    if (!bone) continue;
    const pw = new T.Quaternion();
    bone.parent.getWorldQuaternion(pw);
    bones[n] = {
      bone,
      rl: bone.quaternion.clone(),
      pw,
      pwi: pw.clone().invert(),
      rw: bone.getWorldQuaternion(new T.Quaternion()),
      rm: bone.matrixWorld.clone(),
    };
    if (n.indexOf('tail_') === 0) tailN++;
  }
  if (!bones.spine || !bones.head) return null;
  const root = new T.Group(),
    piv = grp(root, 0, 0.8, 0),
    rig = grp(piv, 0, -0.8, 0);
  rig.add(sc);
  return { skin: true, root, piv, rig, bones, tailN, wingRest: 0.3, sc };
}
/* attach a model-aligned socket to a bone, at a point given in the model's rest space */
function boneSocket(B, x, y, z) {
  // (x, y, z) is a point in the model's rest space; B.rm is the bone's rest matrix in that same space,
  // so this works whatever pose the rig is in and wherever the character stands
  const s = new T.Group();
  B.bone.add(s);
  s.position.copy(new T.Vector3(x, y, z).applyMatrix4(new T.Matrix4().copy(B.rm).invert()));
  s.quaternion.copy(B.rw).invert();
  return s;
}
/* Mom: Darren's high-poly rigged model, a little bigger and rosier, with an apron and a flower */
const MOM_SHAPE = { scale: 1.16, tint: 0xffc4d0, apron: [0, 0.55, 0.19], flower: [0.2, 1.68, 0.12] };
function buildMomSkinned(D) {
  const S = MOM_SHAPE;
  D.sc.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    const m = o.material.clone();
    m.color.setHex(S.tint);
    m.roughness = 0.5;
    m.metalness = 0;
    m.normalMap = lookTex('fine').normalMap;
    m.normalScale = new T.Vector2(0.25, 0.25);
    if (window.ENV_TEX) {
      m.envMap = window.ENV_TEX;
      m.envMapIntensity = 0.55;
    }
    o.material = m;
  });
  // apron on the belly (rides the spine bone), flower behind the ear (rides the head)
  const ap = boneSocket(D.bones.spine, S.apron[0], S.apron[1], S.apron[2]);
  const apM = mk(GEO.hemi, PROP.apron, 0, 0, 0, 0.21, 0.24, 0.09);
  apM.rotation.x = PI / 2 + 0.1;
  ap.add(apM);
  ap.add(mk(GEO.cyl, PROP.apron, 0, 0.15, -0.21, 0.3, 0.035, 0.28)); // waist tie
  ap.add(mk(GEO.mid, PROP.pink, 0, -0.04, 0.085, 0.06, 0.05, 0.02)); // pocket
  const fl = boneSocket(D.bones.head, S.flower[0], S.flower[1], S.flower[2]);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    fl.add(mk(GEO.mid, PROP.pink, Math.cos(a) * 0.07, Math.sin(a) * 0.07, 0, 0.06, 0.06, 0.03));
  }
  fl.add(mk(GEO.mid, PROP.flower, 0, 0, 0.015, 0.05, 0.05, 0.035));
  D.root.scale.setScalar(S.scale);
  const old = LV.mom;
  D.root.position.copy(old.root.position);
  D.root.rotation.copy(old.root.rotation);
  D.root.visible = old.root.visible;
  scene.remove(old.root);
  scene.add(D.root);
  LV.mom = D;
  window.__momSkinned = true;
}

/* recolour a textured material by rotating its hue in the shader (keeps the painted eyes and details) */
function hueShift(m, deg, satMul, lightMul) {
  const a = (deg * PI) / 180;
  m.onBeforeCompile = sh => {
    sh.uniforms.uHue = { value: a };
    sh.uniforms.uSat = { value: satMul || 1 };
    sh.uniforms.uLit = { value: lightMul || 1 };
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', 'uniform float uHue; uniform float uSat; uniform float uLit;\nvoid main() {')
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        {
          vec3 c = diffuseColor.rgb;
          const vec3 k = vec3(0.57735);
          float ca = cos(uHue);
          c = c * ca + cross(k, c) * sin(uHue) + k * dot(k, c) * (1.0 - ca);
          float l = dot(c, vec3(0.299, 0.587, 0.114));
          diffuseColor.rgb = max(mix(vec3(l), c, uSat) * uLit, 0.0);
        }`,
      );
  };
  m.customProgramCacheKey = () => 'hue' + deg + '_' + satMul + '_' + lightMul;
  m.needsUpdate = true;
}
/* Gearwing: a steel-blue Shoyru forgemaster with goggles and a tool belt */
const NPCS = { gear: null };
function buildGearwing(D) {
  D.sc.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.frustumCulled = false;
    const m = o.material.clone();
    m.roughness = 0.5;
    m.normalMap = lookTex('fine').normalMap;
    m.normalScale = new T.Vector2(0.25, 0.25);
    hueShift(m, 215, 0.75, 1.15);
    if (window.ENV_TEX) m.envMap = window.ENV_TEX;
    o.material = m;
  });
  const metal = toy(0xd8dde6, { metalness: 0.7, roughness: 0.25 }),
    lens = new T.MeshStandardMaterial({ color: 0xffc93c, emissive: 0xff9a1a, emissiveIntensity: 0.6, roughness: 0.1 });
  const gog = boneSocket(D.bones.head, 0, 1.62, 0.36);
  for (const s of [1, -1]) {
    const r = new T.Mesh(new T.TorusGeometry(0.12, 0.035, 8, 20), metal);
    r.position.set(s * 0.17, 0, 0);
    gog.add(r);
    const l = mk(GEO.cyl, lens, s * 0.17, 0, -0.01, 0.1, 0.02, 0.1);
    l.rotation.x = PI / 2;
    gog.add(l);
  }
  const strap = new T.Mesh(new T.TorusGeometry(0.5, 0.03, 6, 32), toy(0x5a3820));
  strap.rotation.x = PI / 2 - 0.15;
  strap.position.set(0, 0, -0.35);
  gog.add(strap);
  const belt = boneSocket(D.bones.spine, 0, 0.5, 0);
  belt.add(mk(GEO.cyl, toy(0x7a4a2a), 0, 0, 0, 0.3, 0.07, 0.28));
  belt.add(mk(GEO.box, metal, 0.18, -0.06, 0.2, 0.06, 0.16, 0.04));
  belt.add(mk(GEO.box, metal, -0.15, -0.04, 0.22, 0.12, 0.05, 0.04));
  D.root.scale.setScalar(1.05);
  NPCS.gear = D;
}
