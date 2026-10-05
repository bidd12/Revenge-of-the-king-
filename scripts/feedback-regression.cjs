const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out='artifacts/feedback-review';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH});
 const results={passed:false,checks:[],screenshots:[],errors:[]};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>results.errors.push(e.message));
  const shot=async(name,caption)=>{await p.screenshot({path:`${out}/${name}.png`});results.screenshots.push({name,caption})};
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>window.game&&document.querySelector('#bootScreen').hidden);
  await shot('01-menu','Главное меню: игра загружается без ошибок; прежнее оформление сохранено.');
  await p.locator('#newGameBtn').click();await p.locator('#nameInput').fill('Проверка');await p.locator('[data-class="paladin"]').click();
  await shot('02-create','Новая игра: имя и класс выбраны, создание героя доступно.');
  await p.locator('#createHero').click();await p.locator('#startLocation').click();
  const balance=await p.evaluate(async()=>{
   const {scaledEnemy,ENEMIES}=await import('/js/enemies.js');const {scaledBoss,BOSSES}=await import('/js/bosses.js');
   const low=scaledEnemy(ENEMIES.slime,game.locations[0],1),high=scaledEnemy(ENEMIES.slime,game.locations[0],15),boss=scaledBoss(BOSSES.giantSkeleton,game.locations[0]);
   game.combat.start(scaledEnemy(ENEMIES.miner,game.locations[0],1));return {low,high,boss};
  });
  assert.equal(balance.low.hp,44);assert.equal(balance.low.damage,6);assert(balance.high.hp>balance.low.hp);assert.equal(balance.boss.hp,713);results.balance=balance;
  await p.waitForTimeout(150);await shot('03-mine','Шахта: выступающие скалы, руда и обломки; пропорции шахтёра обновлены, имя над HP.');
  const nameBox=await p.locator('#enemyName').boundingBox(),hpBox=await p.locator('.enemyHp').boundingBox();assert(nameBox.y+nameBox.height<=hpBox.y);
  assert.equal(await p.locator('#enemyName').textContent(),'Унылый шахтёр');
  results.checks.push('increased enemy/boss stats; enemy name above HP');
  // Real attack: impact, enemy counterattack and death still use the original flow.
  await p.evaluate(()=>{Math.random=()=>.99;game.state.damage=1});const hp=await p.evaluate(()=>game.state.hp);
  await p.locator('#attackBtn').click();await p.waitForFunction(()=>!game.combat.lock);assert((await p.evaluate(()=>game.state.hp))<hp);
  await p.evaluate(()=>{game.remaining=1;game.state.damage=99999;Math.random=()=>.1;game.combat.attack()});
  await p.locator('#rewardScreen').waitFor({state:'visible'});const coins=await p.evaluate(()=>game.state.coins);assert(coins>=8&&coins<=18);
  await p.locator('#rewardContinue').click();const injured=await p.evaluate(()=>game.state.hp);await p.locator('#nextLevelBtn').click();assert.equal(await p.evaluate(()=>game.state.hp),injured);
  results.checks.push('real attack/counterattack/death; coins 8–18; no second heal on next level');
  const open=async()=>{await p.evaluate(()=>{game.combat.cancel();game.ui.renderReward({kind:'chest'});Math.random=()=>.01});await p.locator('#openChest').click();assert(await p.locator('#rewardContinue').isDisabled());assert.equal(await p.locator('#lootActions button').count(),3)};
  await open();await shot('04-loot','Полученный предмет: три действия — экипировать, продать или оставить в инвентаре.');
  let id=await p.evaluate(()=>game.rewardItem.id);await p.locator('#lootEquip').click();assert(await p.evaluate(id=>Object.values(game.state.equipment).some(i=>i?.id===id),id));assert(await p.locator('#rewardContinue').isEnabled());
  await shot('05-equipped','Экипировка с экрана награды: предмет надет, характеристики и визуал обновлены.');
  await open();id=await p.evaluate(()=>game.rewardItem.id);const sale=await p.evaluate(async()=>{const {RARITIES}=await import('/js/items.js');return Math.max(1,Math.floor(game.rewardItem.price*RARITIES[game.rewardItem.rarity].sale))});const before=await p.evaluate(()=>game.state.coins);
  await p.locator('#lootSell').click();assert.equal(await p.evaluate(()=>game.state.coins),before+sale);assert(!(await p.evaluate(id=>game.state.inventory.some(i=>i.id===id),id)));
  await p.evaluate(()=>document.querySelector('#lootSell').click());assert.equal(await p.evaluate(()=>game.state.coins),before+sale);await shot('06-sold','Продажа награды: монеты начислены один раз, предмет удалён из инвентаря.');
  await open();id=await p.evaluate(()=>game.rewardItem.id);await p.locator('#lootKeep').click();assert(await p.evaluate(id=>game.state.inventory.some(i=>i.id===id),id));
  const expected=await p.evaluate(()=>JSON.stringify(game.state));await p.reload();await p.waitForFunction(()=>window.game&&document.querySelector('#bootScreen').hidden);await p.locator('#continueBtn').click();assert.equal(await p.evaluate(()=>JSON.stringify(game.state)),expected);await p.locator('#startLocation').click();
  results.checks.push('all three loot actions; duplicate sale blocked; saved equipment/inventory/coins survive reload');
  const migration=await p.evaluate(async()=>{const {saveGame,loadGame}=await import('/js/save.js');const baseline=JSON.stringify(game.state);const legacy=JSON.parse(baseline);legacy.currentLevel=14;saveGame(legacy);const loaded=loadGame();const level=loaded.currentLevel;loaded.currentLevel=game.state.currentLevel;const preserved=JSON.stringify(loaded)===baseline;saveGame(game.state);return {level,preserved}});assert.deepEqual(migration,{level:11,preserved:true});
  for(const [location,boss] of [[1,'giantSkeleton'],[2,'warden'],[3,'giantGolem'],[4,'king'],[5,'dragon']]){
   await p.evaluate(location=>{game.state.completed=false;game.state.location=location;game.state.currentLevel=10;game.beginLevel()},location);assert.equal(await p.evaluate(()=>game.combat.enemy.isBoss),false);
   await p.evaluate(()=>game.nextLevel());assert.equal(await p.evaluate(()=>game.state.currentLevel),11);assert.equal(await p.evaluate(()=>game.combat.enemy.id),boss);assert(await p.evaluate(()=>game.combat.enemy.isBoss));assert.match(await p.locator('#levelLabel').textContent(),/Босс этапа/);
   if(location===1)await shot('09-boss','После 10 обычных уровней: отдельный босс шахты — Огромный скелет.');
   await p.evaluate(()=>{game.state.damage=999999;game.combat.attack()});await p.locator('#rewardScreen').waitFor({state:'visible'});await p.locator('#rewardContinue').click();
   if(location<5){assert.equal(await p.evaluate(()=>game.state.location),location+1);assert.equal(await p.evaluate(()=>game.state.currentLevel),1)}else{assert(await p.locator('#victoryScreen').isVisible());await shot('10-final','После босса пятого этапа: финал; все пять переходов проверены с тестовым уроном.');}
  }
  results.checks.push('five stages: ten ordinary levels, then separate boss, correct next stage and final; legacy level 14 migrates to boss preserving all other state');
  await p.evaluate(()=>{game.state.completed=false;game.state.location=2;game.state.currentLevel=1;game.beginLevel();game.combat.start({id:'guard',name:'Обычный стражник',shape:'guard',color:0x56677a,hp:100,maxHp:100,damage:1});game.scene.setLocation(2)});await p.waitForTimeout(120);await shot('07-guard','Стражник: уменьшена голова, удлинены ноги, округлены конечности; имя над HP.');
  const memory=await p.evaluate(async()=>{
   for(let n=0;n<30;n++){game.scene.setLocation(n%5+1);game.scene.setEnemy(game.combat.enemy);game.scene.renderer.render(game.scene.scene,game.scene.camera)}
   const first={...game.scene.renderer.info.memory};for(let n=0;n<30;n++){game.scene.setLocation(n%5+1);game.scene.setEnemy(game.combat.enemy);game.scene.renderer.render(game.scene.scene,game.scene.camera)}return {first,last:{...game.scene.renderer.info.memory}};
  });assert.deepEqual(memory.first,memory.last);results.memory=memory;results.checks.push('60 scene/model swaps: stable geometry and texture counters');
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(100);await shot('08-mobile','Узкий экран: имя находится над HP и не перекрывает полоску; сцена и атака доступны.');
  const mn=await p.locator('#enemyName').boundingBox(),mh=await p.locator('.enemyHp').boundingBox();assert(mn.y+mn.height<=mh.y);assert.equal(results.errors.length,0);results.passed=true;
 }finally{fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close()}
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
