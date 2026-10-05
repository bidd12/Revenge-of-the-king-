import {ITEM_STYLES} from './item-visuals.js';

// Each builder owns its cached resources. Resources are shared within a model,
// never between models that may be disposed independently.
class Builder {
  constructor(root=new THREE.Group()){this.root=root;this.geometries=new Map();this.materials=new Map()}
  material(color,options={}){const key=color+JSON.stringify(options);if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.78,...options}));return this.materials.get(key)}
  mesh(kind,size,color,x=0,y=0,z=0,parent=this.root,options={}){
    const key=kind+size.join(',');let geo=this.geometries.get(key);
    if(!geo){geo=kind==='sphere'?new THREE.SphereGeometry(1,20,14):kind==='capsule'?new THREE.CapsuleGeometry(size[0],size[1],4,12):kind==='cylinder'?new THREE.CylinderGeometry(size[0],size[1],size[2],12):kind==='cone'?new THREE.ConeGeometry(size[0],size[1],8):new THREE.BoxGeometry(...size);this.geometries.set(key,geo)}
    const m=new THREE.Mesh(geo,this.material(color,options));if(kind==='sphere')m.scale.set(...size);m.position.set(x,y,z);parent.add(m);return m;
  }
  group(x,y,z,parent=this.root){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
}

export function makeWeapon(kind='fists',rarity='common') {
  const b=new Builder(),g=b.root,s=ITEM_STYLES[rarity]||ITEM_STYLES.common;
  const metal={metalness:rarity==='common'?0:.55,roughness:.48,emissive:s.glow,emissiveIntensity:.22};
  const box=(size,c,x,y,z)=>b.mesh('box',size,c,x,y,z,g,c===s.body?metal:{});
  if(kind==='fists')return g;
  b.mesh('cylinder',[.045,.05,.3],s.grip,0,0,0);
  if(kind==='sword'){
    box([.2,.9,.045],s.body,0,.65,0);b.mesh('cone',[.12,.22],s.edge,0,1.2,0);
    box([.48,.075,.1],s.edge,0,.18,0);box([.018,.88,.052],s.edge,0,.64,0);
  }else if(kind==='spear'){
    b.mesh('cylinder',[.035,.045,1.95],s.grip,0,.4,0);
    b.mesh('cone',[.14,.52],s.body,0,1.63,0,g,metal);box([.09,.12,.09],s.edge,0,1.31,0);
  }else if(kind==='axe'||kind==='pickaxe'){
    b.mesh('cylinder',[.045,.06,1.05],s.grip,0,.3,0);
    if(kind==='pickaxe')box([.9,.1,.1],s.body,0,.82,0);
    else{box([.4,.35,.08],s.body,-.2,.78,0);b.mesh('cone',[.22,.36],s.edge,-.39,.78,0).rotation.z=Math.PI/2;box([.13,.18,.15],s.edge,.1,.78,0)}
  }else if(kind==='bow'){
    const points=[];for(let i=0;i<=12;i++){const a=-Math.PI/2+i*Math.PI/12;points.push(new THREE.Vector3(Math.cos(a)*.33,Math.sin(a)*.78,0))}
    const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.045,5,false),limb=new THREE.Mesh(geo,b.material(s.body,metal));g.add(limb);
    b.mesh('cylinder',[.008,.008,1.56],s.edge,0,0,0);
    box([.065,.27,.07],s.grip,.3,0,0);
  }
  if(['epic','legendary','mythic'].includes(rarity))b.mesh('sphere',[.075,.1,.055],s.edge,0,.2,.065,g,{emissive:s.glow,emissiveIntensity:.45});
  g.userData.kind=kind;g.userData.rarity=rarity;return g;
}

function humanoid(e) {
  const b=new Builder(),g=b.root,shape=e.shape;
  const skeleton=shape==='skeleton'||shape==='giantSkeleton',goblin=shape==='goblin',undead=shape==='draugr';
  const elite=/elite/i.test(e.id)||undead||shape==='king',miner=shape==='miner';
  const armor=e.color,skin=skeleton?0xd2c6a5:goblin?0x67984f:undead?0x8a9890:0xbca387;
  const dark=0x24252b,trim=elite?0xc2a35c:0x7d8890;
  const head=b.group(0,2.6,0),torso=b.group(0,1.76,0);head.scale.setScalar(.8);
  b.mesh('sphere',[.33,.4,.28],skin,0,0,0,head);
  for(const x of [-.13,.13])b.mesh('sphere',[skeleton?.085:.045,.065,.03],skeleton?dark:undead?0x70b4b4:dark,x,.045,.27,head,{emissive:undead?0x1b5050:0});
  b.mesh('box',[.14,.1,.09],skin,0,-.08,.3,head);
  if(skeleton){
    b.mesh('box',[.28,.12,.25],skin,0,-.27,.025,head);for(let i=-2;i<=2;i++)b.mesh('box',[.025,.07,.04],dark,i*.047,-.26,.16,head);
    b.mesh('cylinder',[.07,.08,1.1],skin,0,0,0,torso);
    for(let i=0;i<5;i++){const w=.62-i*.055;for(const x of [-1,1]){b.mesh('box',[w/2,.055,.09],skin,x*w/4,.42-i*.15,.1,torso);b.mesh('box',[.06,.055,.27],skin,x*w/2,.42-i*.15,0,torso)}}
    b.mesh('box',[.58,.15,.24],skin,0,-.56,0,torso);
  }else{
    b.mesh('sphere',[.43,.58,.27],armor,0,0,0,torso);
    b.mesh('box',[.75,.09,.57],dark,0,-.32,0,torso);b.mesh('box',[.12,.13,.035],trim,0,-.32,.3,torso);
    if(!goblin&&!miner){b.mesh('box',[.53,.49,.12],armor,0,.18,.27,torso,{metalness:.45});b.mesh('box',[.055,.45,.04],trim,0,.18,.35,torso)}
    if(miner){b.mesh('sphere',[.36,.18,.3],0x9d7f3e,0,.28,0,head);b.mesh('cylinder',[.39,.39,.04],0x6d572f,0,.18,0,head);b.mesh('sphere',[.09,.09,.055],0xffd787,0,.24,.32,head,{emissive:0xa67b24});for(const x of [-.18,.18])b.mesh('box',[.07,.7,.03],0x493226,x,.07,.28,torso)}
    else if(!goblin){b.mesh('sphere',[.36,.22,.3],armor,0,.26,0,head,{metalness:.45});b.mesh('box',[.055,.43,.04],trim,0,.05,.3,head);for(const x of [-.27,.27])b.mesh('box',[.13,.26,.25],armor,x,-.04,0,head)}
    if(goblin){for(const x of [-1,1]){const ear=b.mesh('cone',[.16,.55],skin,x*.4,.05,0,head);ear.rotation.z=-x*.9}b.mesh('sphere',[.16,.11,.13],skin,0,-.05,.3,head);for(const x of [-.1,.1])b.mesh('cone',[.025,.12],0xe1d8a8,x,-.2,.27,head)}
    if(shape==='king'){for(let i=-2;i<=2;i++)b.mesh('cone',[.07,.25],0xcfa847,i*.12,.56,0,head)}
  }
  const arms=[];
  for(const x of [-1,1]){
    const arm=b.group(x*.53,2.16,0);arms.push(arm);
    if(elite)b.mesh('sphere',[.27,.2,.3],armor,0,0,0,arm,{metalness:.4});
    b.mesh('capsule',[skeleton?.065:.12,.30],skeleton?skin:armor,0,-.3,0,arm);
    b.mesh('sphere',[.09,.09,.09],skin,0,-.59,0,arm);
    b.mesh('capsule',[skeleton?.055:.10,.29],skeleton?skin:armor,0,-.81,.025,arm);
    const hand=b.group(0,-1.09,.045,arm);b.mesh('sphere',[.08,.105,.075],skin,0,0,0,hand);
    for(let i=0;i<3;i++)b.mesh('box',[.028,.14,.04],skin,-.045+i*.045,-.09,.065,hand);
    if(x===1){const weapon=makeWeapon(miner?'pickaxe':goblin?'spear':undead?'axe':'sword',elite?'epic':'common');weapon.rotation.x=Math.PI*.1;hand.add(weapon)}
    else if(!skeleton&&!goblin&&!miner){const shield=b.mesh('box',[.43,.62,.08],armor,0,-.78,.16,arm);shield.rotation.z=.1;b.mesh('box',[.04,.45,.04],trim,0,-.78,.22,arm)}
    const leg=b.group(x*.22,1.1,0);b.mesh('capsule',[skeleton?.07:.13,.31],skeleton?skin:dark,0,-.25,0,leg);b.mesh('sphere',[.09,.09,.09],skin,0,-.54,0,leg);b.mesh('capsule',[skeleton?.06:.105,.28],skeleton?skin:armor,0,-.77,0,leg);b.mesh('box',[.22,.14,.36],skeleton?skin:dark,0,-1.03,.08,leg);
  }
  if(undead){b.mesh('box',[.6,.9,.08],0x353d45,0,1.45,-.3);for(const x of [-1,1])b.mesh('cone',[.09,.32],trim,x*.62,2.2,0).rotation.z=-x*.4}
  if(goblin)g.scale.set(.83,.82,.83);if(elite)g.scale.multiplyScalar(1.13);
  g.userData={rightArm:arms[1],leftArm:arms[0],head};return g;
}

export function makeEnemy(e) {
  if(!['slime','golem','giantGolem','dragon','hound'].includes(e.shape))return humanoid(e);
  const b=new Builder(),g=b.root,c=e.color,dark=0x22232a;
  if(e.shape==='slime'){
    b.mesh('sphere',[.82,.61,.72],c,0,.62,0,g,{transparent:true,opacity:.8,roughness:.25});b.mesh('sphere',[.46,.29,.46],0x97c967,0,.35,0);
    for(const x of [-.24,.24]){b.mesh('sphere',[.12,.16,.065],0xe0f4c8,x,.83,.6);b.mesh('sphere',[.055,.07,.03],dark,x,.84,.66)}
  }else if(e.shape==='golem'||e.shape==='giantGolem'){
    b.mesh('sphere',[.92,1.06,.67],c,0,1.8,0);b.mesh('box',[1.05,.95,.75],c,0,2,.12);b.mesh('box',[.75,.64,.65],c,0,3,0);
    for(const x of [-1,1]){b.mesh('sphere',[.42,.42,.47],c,x*.92,2.5,0);const arm=b.group(x*1.05,2.45,0);b.mesh('box',[.48,.85,.55],c,0,-.4,0,arm);b.mesh('box',[.63,.61,.66],c,0,-1.06,.1,arm);if(x===1)g.userData.rightArm=arm;else g.userData.leftArm=arm;b.mesh('box',[.5,.9,.55],c,x*.45,.54,0);b.mesh('box',[.62,.28,.8],dark,x*.45,.16,.13);b.mesh('box',[.17,.08,.05],0xc4ac57,x*.19,3.1,.34,g,{emissive:0x85691b})}
    b.mesh('box',[.12,.65,.05],dark,.06,2,.51).rotation.z=.4;
  }else if(e.shape==='hound'){
    b.mesh('sphere',[.43,.55,.95],c,0,.95,0);b.mesh('sphere',[.33,.36,.44],c,0,1.35,.82);b.mesh('box',[.35,.22,.4],c,0,1.21,1.12);for(const x of [-1,1]){b.mesh('cone',[.13,.31],c,x*.22,1.7,.79);for(const z of [-.52,.52])b.mesh('cylinder',[.08,.07,.65],c,x*.29,.45,z);b.mesh('sphere',[.04,.04,.025],0xc6a23e,x*.16,1.42,1.19)}b.mesh('cone',[.14,.85],c,0,1.14,-1.05).rotation.x=-.9;
  }else{
    b.mesh('sphere',[.88,.72,1.7],c,0,1.27,-.25);const head=b.group(0,1.75,1.05);b.mesh('sphere',[.42,.42,.72],c,0,0,.35,head);b.mesh('box',[.65,.24,.65],c,0,-.2,.87,head);for(const x of [-1,1]){b.mesh('cone',[.12,.62],0xd3b883,x*.29,.43,.01,head).rotation.x=-.3;b.mesh('sphere',[.07,.07,.055],0xffbf43,x*.35,.04,.72,head,{emissive:0xb34b0c});for(let i=0;i<3;i++)b.mesh('cone',[.03,.15],0xf0d7ab,x*.24,-.3,.69+i*.13,head);for(const z of [-1,.7]){b.mesh('cylinder',[.2,.15,.8],c,x*.62,.58,z);b.mesh('box',[.38,.2,.58],c,x*.62,.16,z+.12)}const wing=b.group(x*.64,1.8,-.47);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,x*2.5,1.4,-.3,x*2.2,.3,-1.3,0,0,0,x*2.2,.3,-1.3,x*1.1,-.25,-1.1],3));geo.computeVertexNormals();wing.add(new THREE.Mesh(geo,b.material(0x642728,{side:THREE.DoubleSide,roughness:.9})));if(x===1)g.userData.rightWing=wing;else g.userData.leftWing=wing}
    for(let i=0;i<7;i++)b.mesh('cone',[.1,.25],0xcfab79,0,1.9-i*.075,-.7-i*.22);
    const tail=b.mesh('cone',[.32,2.3],c,0,.8,-2.5);tail.rotation.x=-Math.PI/2;g.userData.head=head;
  }
  return g;
}

export function makeHands(equipment={}) {
  const b=new Builder(),g=b.root,style=ITEM_STYLES[equipment.gloves?.rarity]||ITEM_STYLES.common;
  const arms=[];
  for(const x of [-1,1]){
    const arm=b.group(x*.5,-.35,-1.25);arms.push(arm);arm.rotation.x=-.2;
    b.mesh('capsule',[.105,.34],style.body,0,-.2,.02,arm);
    b.mesh('box',[.18,.12,.2],style.edge,0,.03,.02,arm);
    b.mesh('sphere',[.085,.13,.09],equipment.gloves?style.body:0xbba285,0,.18,.03,arm);
    for(let i=0;i<4;i++)b.mesh('capsule',[.019,.10],equipment.gloves?style.grip:0xbba285,-.056+i*.038,.18,.13,arm);
    const held=makeWeapon(x===1?(equipment.weapon?.kind||'fists'):'fists',equipment.weapon?.rarity||'common');held.position.y=.2;held.scale.setScalar(equipment.weapon?.kind==='spear'?.55:.72);arm.add(held);
  }
  if(equipment.weapon?.kind==='bow'){arms[1].position.x=.13;arms[0].position.set(-.38,-.37,-1.25);const bow=makeWeapon('bow',equipment.weapon.rarity);bow.scale.setScalar(.8);arms[0].add(bow);arms[1].children.at(-1).visible=false}
  g.userData={rightArm:arms[1],leftArm:arms[0],kind:equipment.weapon?.kind||'fists'};return g;
}

export function makeHero(state) {
  const color=ITEM_STYLES[state.equipment.chest?.rarity]?.body||0x725b43;
  const g=humanoid({id:'hero',shape:'guard',color});
  // Anatomical hero for later equipment preview; first-person hands use the
  // same equipment data. Do not force a new UI layout before design approval.
  return g;
}

export function disposeGroup(group){
  const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m))});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();
}
