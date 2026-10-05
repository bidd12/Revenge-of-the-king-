const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:800}});
  await p.goto(process.env.GAME_URL||'http://127.0.0.1:8000');await p.waitForFunction(()=>window.game&&document.querySelector('#bootScreen').hidden);
  await p.locator('#newGameBtn').click();await p.locator('#nameInput').fill('Замер');await p.locator('[data-class="paladin"]').click();await p.locator('#createHero').click();await p.locator('#startLocation').click();
  const gpu=await p.evaluate(()=>{const gl=game.scene.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
  const sample=()=>p.evaluate(()=>new Promise(resolve=>{let last=performance.now();const frames=[];function frame(now){frames.push(now-last);last=now;if(frames.length<180){requestAnimationFrame(frame);return}frames.sort((a,b)=>a-b);resolve({frames:frames.length,medianMs:frames[90],p95Ms:frames[171],calls:game.scene.renderer.info.render.calls,triangles:game.scene.renderer.info.render.triangles})}requestAnimationFrame(frame)}));
  const single=await sample();
  await p.evaluate(async()=>{const {makeEnemy}=await import('/js/models.js');const {ENEMIES}=await import('/js/enemies.js');window.stressModels=[];for(const [id,x] of [['guard',-2.5],['golem',2.5]]){const model=makeEnemy(ENEMIES[id]);model.position.set(x,0,game.scene.enemyBase.z-1);game.scene.scene.add(model);stressModels.push(model)}for(let n=0;n<4;n++)game.scene.emit(0,1,game.scene.enemyBase.z,16,0xff7424)});
  const threeModelStress=await sample();
  await p.evaluate(async()=>{const {disposeGroup}=await import('/js/models.js');for(const model of stressModels){game.scene.scene.remove(model);disposeGroup(model)}delete window.stressModels});
  await p.setViewportSize({width:390,height:844});const mobileViewport=await sample();
  const results={gpu,single,threeModelStress,mobileViewport,notes:'Three-model case is a rendering stress fixture; gameplay still uses one enemy. Headless/browser measurements do not substitute for real mobile devices or other PCs.'};fs.writeFileSync('artifacts/graphics-review/performance.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
