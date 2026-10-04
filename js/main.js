import {Game} from "./game.js";
import {UI} from "./ui.js";
import {DEBUG_MODE} from "./utils.js";

class Scene3D{
constructor(){this.canvas=document.querySelector("#gameCanvas");this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,100);this.camera.position.set(0,1.7,5);this.clock=new THREE.Clock();this.enemyGroup=new THREE.Group();this.scene.add(this.enemyGroup);this.setupLights();this.setLocation(1);addEventListener("resize",()=>this.resize());this.animate()}
setupLights(){this.scene.add(new THREE.AmbientLight(0x777777,1.8));this.key=new THREE.PointLight(0xffaa55,18,25);this.key.position.set(0,4,2);this.scene.add(this.key);const hemi=new THREE.HemisphereLight(0x8899aa,0x21160e,1.2);this.scene.add(hemi)}
resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix()}
clearGroup(g){const geometries=new Set(),materials=new Set();for(const o of [...g.children]){g.remove(o);o.traverse(x=>{if(x.geometry)geometries.add(x.geometry);if(x.material)(Array.isArray(x.material)?x.material:[x.material]).forEach(m=>materials.add(m))})}geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose())}
clearEnemy(){this.clearGroup(this.enemyGroup)}
setLocation(id){const previous=this.scene.getObjectByName("env");if(previous){this.clearGroup(previous);this.scene.remove(previous)}const env=new THREE.Group();env.name="env";this.scene.add(env);const themes=[null,"dungeon","prison","cellar","palace","tower"];const theme=themes[id];const colors={dungeon:0x36383b,prison:0x343238,cellar:0x4a3330,palace:0xc7c3b7,tower:0x3c4048};const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:colors[theme],roughness:.9}));floor.rotation.x=-Math.PI/2;env.add(floor);for(let i=-8;i<=8;i+=4){const wall=new THREE.Mesh(new THREE.BoxGeometry(.4,5,40),new THREE.MeshStandardMaterial({color:colors[theme]}));wall.position.set(i%8===0?-7:7,2.5,0);env.add(wall)}for(let i=0;i<12;i++){const p=new THREE.PointLight(theme==="tower"?0xff5522:0xffa13a,8,7);p.position.set((i%2?5:-5),2,(i-6)*3);env.add(p);const flame=new THREE.Mesh(new THREE.ConeGeometry(.16,.45,8),new THREE.MeshBasicMaterial({color:0xff8c2a}));flame.position.copy(p.position);flame.position.y+=.5;env.add(flame)}for(let i=0;i<8;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(.3,4,3),new THREE.MeshStandardMaterial({color:theme==="palace"?0xe5dfcf:0x55504a}));c.position.set((i%2?3.8:-3.8),2,(i-4)*4);env.add(c)}if(theme==="tower"){for(let i=0;i<9;i++){const fire=new THREE.Mesh(new THREE.SphereGeometry(.25,8,8),new THREE.MeshBasicMaterial({color:0xff3217}));fire.position.set((i%3-1)*3,1,(i-4)*3);env.add(fire)}}}
setEnemy(e){this.clearGroup(this.enemyGroup);this.enemyGroup.position.set(0,0,-5);this.enemyGroup.rotation.set(0,0,0);this.enemyGroup.scale.setScalar(e.isBoss?1.8:1);this.enemyGroup.add(this.makeEnemy(e))}
makeEnemy(e){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:e.color,roughness:.65}),dark=new THREE.MeshStandardMaterial({color:0x151515}),skin=new THREE.MeshStandardMaterial({color:e.color});const add=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o};if(e.shape==="slime"){add(new THREE.SphereGeometry(1,20,12),mat,0,1.1,0).scale.set(1.2,.7,.8)}else if(e.shape==="golem"||e.shape==="giantGolem"){add(new THREE.BoxGeometry(1.7,2.4,1.2),mat,0,1.4,0);add(new THREE.SphereGeometry(.7,16,12),mat,0,3,0);for(const x of [-1.1,1.1])add(new THREE.BoxGeometry(.55,1.7,.6),mat,x,1.4,0)}else if(e.shape==="dragon"){add(new THREE.ConeGeometry(1.5,3,8),mat,0,2.1,0).rotation.z=Math.PI/2;add(new THREE.SphereGeometry(1.0,16,12),mat,0,1.5,1);for(const x of [-1,1]){const w=add(new THREE.ConeGeometry(.8,2,4),mat,x*1.4,2,0);w.rotation.z=x*.9}add(new THREE.ConeGeometry(.25,1.2,8),mat,0,3.7,0).rotation.x=Math.PI}else{add(new THREE.SphereGeometry(.58,16,12),skin,0,2.5,0);add(new THREE.BoxGeometry(1.1,1.5,.7),mat,0,1.45,0);for(const x of [-.75,.75]){add(new THREE.CylinderGeometry(.14,.18,1.5,8),dark,x,1.45,0);add(new THREE.CylinderGeometry(.12,.16,1.5,8),dark,x,0,0)}if(e.shape==="giantSkeleton")g.scale.setScalar(1.4)}add(new THREE.SphereGeometry(.08,8,8),dark,-.2,2.6,-.5);add(new THREE.SphereGeometry(.08,8,8),dark,.2,2.6,-.5);return g}
attackAnim(){this.enemyGroup.rotation.y=.25;setTimeout(()=>this.enemyGroup.rotation.y=0,180)}
hitAnim(){this.enemyGroup.position.x=.2;document.querySelector("#battleScreen").classList.add("hitflash");setTimeout(()=>{this.enemyGroup.position.x=0;document.querySelector("#battleScreen").classList.remove("hitflash")},160)}
enemyDefeat(){this.enemyGroup.scale.multiplyScalar(.85);this.enemyGroup.rotation.z=.2}
animate(){requestAnimationFrame(()=>this.animate());const t=this.clock.getElapsedTime();if(this.enemyGroup.children.length){this.enemyGroup.position.y=Math.sin(t*1.4)*.04;this.enemyGroup.rotation.y=Math.sin(t*.4)*.04}if(!document.hidden)this.renderer.render(this.scene,this.camera)}
}
class FallbackScene {
  resize() {}
  setLocation() {}
  setEnemy() {}
  clearEnemy() {}
  attackAnim() {}
  hitAnim() {}
  enemyDefeat() {}
}

let scene;
try {
  scene = (typeof THREE !== "undefined") ? new Scene3D() : new FallbackScene();
} catch (error) {
  console.warn("Three.js не удалось инициализировать. Игра продолжит работу без 3D-сцены:", error);
  scene = new FallbackScene();
}

const ui=new UI();
const game=new Game(scene,ui);
ui.game=game;
ui.bind();
window.game=game;

// Интерфейс запускается сразу на безопасной сцене. Если Three.js загрузится позже,
// незаметно подключаем полноценную 3D-сцену без перезапуска игры.
if (window.threeReadyPromise) {
  window.threeReadyPromise.then(ready => {
    if (!ready || !(scene instanceof FallbackScene) || typeof THREE === "undefined") return;
    try {
      const upgradedScene = new Scene3D();
      scene = upgradedScene;
      game.scene = upgradedScene;
      if (game.state) {
        upgradedScene.setLocation(game.state.location);
        if (game.combat?.enemy) upgradedScene.setEnemy(game.combat.enemy);
      }
    } catch (error) {
      console.warn("Не удалось включить 3D-сцену. Игра продолжает работу без неё:", error);
    }
  });
}

window.addEventListener("keydown",e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target.isContentEditable)return;if(e.code==="Escape"){if(game.activeScreen==="battleScreen")game.pause();else if(game.activeScreen==="pauseScreen")game.resumeBattle();else if(["mapScreen","inventoryScreen","shopScreen"].includes(game.activeScreen))game.returnToBattleOrMenu();else game.toMenu()}if(e.code==="Space"&&game.activeScreen==="battleScreen"){e.preventDefault();if(!e.repeat)game.combat.attack()}});
document.addEventListener("visibilitychange",()=>{if(document.hidden){game.pause();game.audio.ctx?.suspend();game.platform?.setGameplay(false)}});
if(DEBUG_MODE){const p=document.querySelector("#debugPanel");p.classList.remove("hidden");p.innerHTML=`<button onclick="game.state.coins+=1000;game.save();game.ui.updateHud()">+1000🪙</button><button onclick="game.state.artifacts+=5;game.save();game.ui.updateHud()">+5 арт.</button><button onclick="game.state.hp=game.state.maxHp;game.ui.updateHud()">FULL HP</button>`}
