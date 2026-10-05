import {makeEnemy,makeHands,disposeGroup} from './models.js';

export class Scene3D {
  constructor(){
    this.canvas=document.querySelector('#gameCanvas');this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight);
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,100);this.camera.position.set(0,1.7,5);this.scene.add(this.camera);
    this.enemyGroup=new THREE.Group();this.scene.add(this.enemyGroup);this.enemyBase=new THREE.Vector3(0,0,-4);this.animations={};
    this.scene.add(new THREE.HemisphereLight(0xd8d6c6,0x27211a,2.1));const light=new THREE.DirectionalLight(0xffcf90,2.2);light.position.set(-3,6,4);this.scene.add(light);
    this.setupParticles();this.setLocation(1);addEventListener('resize',()=>this.resize());this.animate();
  }
  bindGame(game){this.game=game;this.syncEquipment(game.state)}
  now(){return this.game?.combat.time||0}
  resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();if(this.enemy)this.fitEnemy()}
  clearEnemy(){disposeGroup(this.enemyGroup);this.enemy=null;this.model=null;this.cancelAnimations()}
  cancelAnimations(){this.animations={};this.camera.position.set(0,1.7,5);this.projectile.visible=false;this.fireBreath.visible=false;this.shakeEnd=0;this.flashUntil=0;document.querySelector('#battleScreen')?.classList.remove('hitflash');this.resetParticles();if(this.enemy){this.enemyGroup.position.copy(this.enemyBase);this.enemyGroup.rotation.set(0,0,0);this.enemyGroup.scale.setScalar(this.enemyScale)}}
  setLocation(id){
    if(this.env){disposeGroup(this.env);this.scene.remove(this.env)}
    const env=this.env=new THREE.Group();this.scene.add(env);
    const palette=[null,0x383b40,0x363740,0x4b3e34,0xc7c3b7,0x414751],color=palette[id]||palette[1];
    this.scene.background=new THREE.Color(color).multiplyScalar(.35);this.scene.fog=new THREE.Fog(this.scene.background,18,42);
    // The original camera now always sees geometry/background rather than
    // the default black void. This is not the deferred photo/menu redesign.
    const mats=new Map(),geos=new Map(),batches=new Map();
    const box=(w,h,d,c,x,y,z)=>{const key=[w,h,d].join();if(!geos.has(key))geos.set(key,new THREE.BoxGeometry(w,h,d));if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.92}));const m=new THREE.Mesh(geos.get(key),mats.get(c));m.position.set(x,y,z);const batchKey=key+':'+c;if(!batches.has(batchKey))batches.set(batchKey,[]);batches.get(batchKey).push(m);return m};
    box(22,.4,58,color,0,-.3,-12);box(22,.5,58,color,0,6,-12);box(.5,6,58,color,-8,2.8,-12);box(.5,6,58,color,8,2.8,-12);box(16,6,.5,color,0,2.8,-39);
    for(let row=0;row<4;row++)for(let j=0;j<10;j++)for(const side of [-1,1])box(.18,1.2,3.9,color+(row%2?0x030303:0),side*7.72,.7+row*1.35,4-j*4+(row%2?1:0));
    for(let i=0;i<6;i++){
      const z=2-i*6;
      for(const side of [-1,1]){
        if(id===1){box(.35,5.4,.4,0x674e36,side*6.9,2.7,z);box(14,.3,.4,0x674e36,0,5.3,z)}
        else if(id===2){for(let n=0;n<5;n++)box(.06,3.4,.08,0x25282d,side*(5.7+n*.28),1.7,z);box(1.8,.08,.18,0x25282d,side*6.2,3.35,z)}
        else if(id===3){box(1.1,.9,1.1,0x6e4e30,side*6,.45,z);box(1.2,.08,1.15,0x38332d,side*6,.5,z);box(.12,.9,1.16,0x9c7548,side*6+.35,.45,z)}
        else if(id===4){box(.65,5.3,.65,0xe1d5b4,side*5.8,2.65,z);box(1,.2,1,0xa68a44,side*5.8,5.2,z);box(1,.2,1,0xa68a44,side*5.8,.05,z)}
        else {box(.15,1.9,1.6,0x708496,side*7.42,3.3,z);box(.23,2.05,.1,0x262b33,side*7.25,3.3,z);box(.23,.1,1.7,0x262b33,side*7.25,3.3,z)}
      }
      if(i<2)for(const side of [-1,1]){
        box(.16,.8,.2,0x503829,side*7.1,2.1,z);const flame=new THREE.Mesh(new THREE.ConeGeometry(.12,.4,6),new THREE.MeshBasicMaterial({color:id===5?0xff6a28:0xffad45}));flame.position.set(side*7.1,2.7,z);env.add(flame);
        const lamp=new THREE.PointLight(0xffa74b,10,9,2);lamp.position.set(side*7,2.8,z);env.add(lamp);
      }
    }
    // Deterministic relief, shared geometry and instancing: no per-frame objects.
    const rockGeo=new THREE.IcosahedronGeometry(1,1),rockMat=new THREE.MeshStandardMaterial({color:id===1?0x55535a:color,roughness:1,flatShading:true});
    const rocks=new THREE.InstancedMesh(rockGeo,rockMat,id===1?72:24),rock=new THREE.Object3D();
    for(let i=0;i<rocks.count;i++){
      const side=i%2?1:-1,z=3-Math.floor(i/2)*1.1;
      rock.position.set(side*(id===1?7.15:7.5),.5+(i%7)*.7,z);rock.rotation.set(i*.63,i*.91,i*.37);
      rock.scale.set(id===1?.65+(i%3)*.2:.35,.35+(i%4)*.18,.55+(i%5)*.12);rock.updateMatrix();rocks.setMatrixAt(i,rock.matrix);
    }
    rocks.instanceMatrix.needsUpdate=true;rocks.userData.relief=true;env.add(rocks);
    if(id===1){
      const ore=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.18,0),new THREE.MeshStandardMaterial({color:0x9c7952,metalness:.65,roughness:.6}),18);
      for(let i=0;i<18;i++){rock.position.set((i%2?1:-1)*6.75,1+(i%4)*.7,1-i*1.6);rock.rotation.set(i,.4*i,.7*i);rock.scale.set(1,1,1);rock.updateMatrix();ore.setMatrixAt(i,rock.matrix)}env.add(ore);
      for(let i=0;i<12;i++){const m=new THREE.Mesh(rockGeo,rockMat);m.scale.set(.35+(i%3)*.15,.18,.4);m.position.set((i%2?1:-1)*(3.2+i%3),.05,1-i*2.1);m.rotation.y=i;env.add(m)}
    }
    if(id===4)box(3,.025,45,0x74312d,0,-.075,-13);
    if(id===5){for(let i=0;i<8;i++){const m=box(.4+i%3*.15,.25,.55,0x25272d,(i%3-1)*2,.1,-3-i*2);m.rotation.y=i*.8}for(let i=0;i<5;i++)box(3,.18,1.05,color,3,.15*i,-16-i)}
    for(const batch of batches.values()){const first=batch[0],instances=new THREE.InstancedMesh(first.geometry,first.material,batch.length);batch.forEach((m,i)=>{m.updateMatrix();instances.setMatrixAt(i,m.matrix)});instances.instanceMatrix.needsUpdate=true;env.add(instances)}
  }
  syncEquipment(state){
    const eq=state?.equipment||{},key=['weapon','gloves','chest','boots'].map(slot=>eq[slot]?.kind+':'+eq[slot]?.rarity).join('|');if(key===this.equipmentKey)return;
    this.equipmentKey=key;if(this.hands){disposeGroup(this.hands);this.camera.remove(this.hands)}this.hands=makeHands(eq);this.camera.add(this.hands);
  }
  setEnemy(enemy){this.clearEnemy();this.enemy=enemy;this.model=makeEnemy(enemy);this.enemyGroup.add(this.model);this.enemyScale=enemy.isBoss?(enemy.id==='dragon'?1.35:1.55):1;this.enemyGroup.scale.setScalar(this.enemyScale);this.enemySize=new THREE.Vector3();new THREE.Box3().setFromObject(this.enemyGroup).getSize(this.enemySize);this.fitEnemy()}
  fitEnemy(){const size=this.enemySize,tangent=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));const distance=Math.max(8,size.y/(tangent*1.45),size.x/(tangent*this.camera.aspect*1.5));this.enemyBase.set(0,0,5-distance);this.enemyGroup.position.copy(this.enemyBase)}
  attackAnim(kind=this.hands?.userData.kind||'fists'){
    const impact=kind==='bow'?650:kind==='axe'?430:kind==='spear'?310:320,end=impact+260;
    this.animations.player={start:this.now(),end:end/1000,impact:impact/1000,kind};return {impact,end};
  }
  enemyAttackAnim(enemy,fire=false){
    const heavy=/golem|draugr|dragon/i.test(enemy.shape),impact=fire?900:heavy?650:enemy.shape==='goblin'?280:420,end=impact+350;
    this.animations.enemy={start:this.now(),end:end/1000,impact:impact/1000,fire,emitted:false};return {impact,end};
  }
  enemyHitAnim(strong=false){this.animations.reaction={start:this.now(),end:.28,strength:strong?.5:.22};this.emit(0,1.45,this.enemyBase.z+.45,strong?12:6,0xffd48e)}
  hitAnim(){this.shakeEnd=this.now()+.22;this.flashUntil=this.now()+.16;document.querySelector('#battleScreen').classList.add('hitflash');this.emit(0,1.1,3,7,0xc7553c)}
  enemyDefeat(enemy=this.enemy){
    const end=enemy?.id==='dragon'?2.8:enemy?.isBoss?1.65:/golem/i.test(enemy?.shape)?1.15:.9;
    this.animations={death:{start:this.now(),end,shape:enemy?.shape,boss:enemy?.isBoss,emitted:false}};return end*1000;
  }
  setupParticles(){
    this.capacity=64;this.positions=new Float32Array(this.capacity*3);this.colors=new Float32Array(this.capacity*3);this.velocities=new Float32Array(this.capacity*3);this.life=new Float32Array(this.capacity);this.cursor=0;
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(this.colors,3));this.particles=new THREE.Points(geometry,new THREE.PointsMaterial({size:.11,vertexColors:true,transparent:true,opacity:.8,depthWrite:false}));this.particles.frustumCulled=false;this.scene.add(this.particles);
    this.projectile=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.5,5),new THREE.MeshBasicMaterial({color:0xcdb485}));this.projectile.rotation.x=Math.PI/2;this.projectile.visible=false;this.scene.add(this.projectile);this.resetParticles();
    this.fireBreath=new THREE.Mesh(new THREE.ConeGeometry(1,1,10),new THREE.MeshBasicMaterial({color:0xff7926,transparent:true,opacity:.3,depthWrite:false}));this.fireBreath.rotation.x=-Math.PI/2;this.fireBreath.visible=false;this.scene.add(this.fireBreath);
  }
  resetParticles(){this.life.fill(0);for(let i=0;i<this.capacity;i++)this.positions[i*3+1]=-100;this.particles.geometry.attributes.position.needsUpdate=true;this.lastTime=this.now()}
  emit(x,y,z,count,color){for(let n=0;n<Math.min(count,16);n++){const i=this.cursor++%this.capacity,k=i*3;this.positions[k]=x;this.positions[k+1]=y;this.positions[k+2]=z;this.velocities[k]=(Math.random()-.5)*2;this.velocities[k+1]=Math.random()*1.6;this.velocities[k+2]=(Math.random()-.5)*2;this.life[i]=.45+Math.random()*.25;this.colors[k]=(color>>16&255)/255;this.colors[k+1]=(color>>8&255)/255;this.colors[k+2]=(color&255)/255}this.particles.geometry.attributes.color.needsUpdate=true}
  update(time){
    const dt=Math.min(.05,Math.max(0,time-this.lastTime));this.lastTime=time;
    for(let i=0;i<this.capacity;i++){if(this.life[i]<=0)continue;const k=i*3;this.life[i]-=dt;if(this.life[i]<=0){this.positions[k+1]=-100;continue}this.positions[k]+=this.velocities[k]*dt;this.positions[k+1]+=this.velocities[k+1]*dt;this.positions[k+2]+=this.velocities[k+2]*dt;this.velocities[k+1]-=dt*3}this.particles.geometry.attributes.position.needsUpdate=true;
    this.camera.position.set(0,1.7,5);if(time<this.shakeEnd){const intensity=(this.shakeEnd-time)*.18;this.camera.position.x=Math.sin(time*95)*intensity;this.camera.position.y+=Math.sin(time*73)*intensity}
    if(time>=this.flashUntil)document.querySelector('#battleScreen')?.classList.remove('hitflash');
    this.hands.visible=this.game?.activeScreen==='battleScreen';this.hands.scale.set(Math.min(1,this.camera.aspect/.9),1,1);
    const player=this.animations.player,arms=this.hands.userData;
    arms.rightArm.rotation.set(-.2,0,0);arms.leftArm.rotation.set(-.2,0,0);this.hands.position.set(0,0,0);this.projectile.visible=false;
    if(player){const elapsed=time-player.start,p=Math.min(1,elapsed/player.end),swing=Math.sin(p*Math.PI);
      if(player.kind==='bow'){arms.rightArm.rotation.x=-.2+swing*.6;arms.leftArm.rotation.y=swing*.16;const flight=THREE.MathUtils.clamp((elapsed-(player.impact-.25))/.25,0,1);if(flight>0&&flight<1){this.projectile.visible=true;this.projectile.position.set(.2*(1-flight),1.5,3+(this.enemyBase.z-3)*flight)}}
      else if(player.kind==='spear')this.hands.position.z=-swing*.65;
      else{arms.rightArm.rotation.z=-swing*(player.kind==='axe'?1.3:1);arms.rightArm.rotation.x=-.2-swing*.85;this.hands.position.z=-swing*.22}
      if(p>=1)delete this.animations.player;
    }
    this.fireBreath.visible=false;if(!this.enemy)return;
    this.enemyGroup.position.copy(this.enemyBase);this.enemyGroup.rotation.set(0,Math.sin(time*.6)*.025,0);this.enemyGroup.scale.setScalar(this.enemyScale);
    const rig=this.model.userData;for(const arm of [rig.rightArm,rig.leftArm])if(arm)arm.rotation.set(0,0,0);
    for(const [wing,side] of [[rig.rightWing,1],[rig.leftWing,-1]])if(wing)wing.rotation.z=Math.sin(time*1.8)*.08*side;
    const action=this.animations.enemy;if(action){const elapsed=time-action.start,p=Math.min(1,elapsed/action.end),move=Math.sin(p*Math.PI);this.enemyGroup.position.z+=move*(this.enemy.shape==='goblin'?1.55:.85);if(rig.rightArm){rig.rightArm.rotation.x=-move*1.8;rig.rightArm.rotation.z=-move*.4}if(action.fire&&!action.emitted&&elapsed>=action.impact-.3){action.emitted=true;for(let n=0;n<4;n++)this.emit(0,1.9,this.enemyBase.z+2+n*(4-this.enemyBase.z)/4,12,0xff7424)}if(p>=1)delete this.animations.enemy}
    if(action?.fire){const elapsed=time-action.start;if(elapsed>=action.impact-.3&&elapsed<action.impact+.15){const muzzle=this.enemyGroup.position.z+2.4,length=Math.max(1,Math.min(6,4-muzzle));this.fireBreath.visible=true;this.fireBreath.position.set(0,1.65,muzzle+length/2);this.fireBreath.scale.set(.4,length,.4);this.fireBreath.material.opacity=.16+Math.sin(time*40)*.04}}
    const reaction=this.animations.reaction;if(reaction){const p=Math.min(1,(time-reaction.start)/reaction.end),s=Math.sin(p*Math.PI);this.enemyGroup.position.z-=s*reaction.strength;this.enemyGroup.rotation.x=-s*.13;this.enemyGroup.position.x=Math.sin(p*25)*s*.035;if(p>=1)delete this.animations.reaction}
    const death=this.animations.death;if(death){const p=Math.min(1,(time-death.start)/death.end);this.enemyGroup.rotation.y=0;
      if(death.shape==='slime'){this.enemyGroup.scale.y=this.enemyScale*Math.max(.05,1-p);this.enemyGroup.scale.x=this.enemyScale*(1+p*.4)}
      else if(death.shape==='dragon'){const fall=THREE.MathUtils.clamp((p-.25)/.4,0,1);this.enemyGroup.rotation.z=Math.sin(p*15)*(1-fall)*.13+fall*1.25;this.enemyGroup.position.y=-fall*.6;for(const [wing,side] of [[rig.rightWing,1],[rig.leftWing,-1]])if(wing)wing.rotation.z=fall*side*.5}
      else{const fall=THREE.MathUtils.clamp(p/.65,0,1);this.enemyGroup.rotation.x=-fall*Math.PI/2;this.enemyGroup.position.y=-fall*.06}
      if(!death.emitted&&p>.65){death.emitted=true;this.emit(0,.25,this.enemyBase.z,death.boss?16:8,death.shape==='dragon'?0xff6b2a:0xa18b68);if(death.boss||/golem/i.test(death.shape))this.shakeEnd=time+.18}
      if(p>.88)this.enemyGroup.scale.multiplyScalar(Math.max(.01,(1-p)/.12));
    }else this.enemyGroup.position.y+=Math.sin(time*1.4)*.015;
  }
  animate(){requestAnimationFrame(()=>this.animate());if(document.hidden)return;if(this.hands){this.hands.visible=this.game?.activeScreen==='battleScreen';if(this.game?.combat.active())this.update(this.now())}this.renderer.render(this.scene,this.camera)}
}

export class FallbackScene {
  bindGame(game){this.game=game} resize(){} setLocation(){} setEnemy(){} clearEnemy(){} syncEquipment(){} cancelAnimations(){} enemyHitAnim(){} hitAnim(){}
  attackAnim(kind){return {impact:kind==='bow'?650:320,end:900}}
  enemyAttackAnim(e,fire){return {impact:fire?900:420,end:1250}}
  enemyDefeat(e){return e?.id==='dragon'?2800:e?.isBoss?1650:900}
}
