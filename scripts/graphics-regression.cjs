const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.GAME_URL||'http://127.0.0.1:8000';
const out=process.env.REVIEW_DIR||'artifacts/graphics-review';
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH,args:process.env.HARDWARE_GPU?[]:['--use-angle=swiftshader']});
 const results={passed:false,checks:[],pageErrors:[],screenshots:[],metrics:{}};
 const check=name=>results.checks.push(name);
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>results.pageErrors.push(e.message));
 const shot=async(name,caption)=>{await page.screenshot({path:`${out}/${name}.png`});results.screenshots.push({name,caption})};
 const waitBattle=async()=>{await page.locator('#battleScreen').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>game.scene.constructor.name),'Scene3D')};
 const startEnemy=async(id='skeleton',boss=false)=>page.evaluate(async({id,boss})=>{
   const {ENEMIES,scaledEnemy}=await import('/js/enemies.js');const {BOSSES,scaledBoss}=await import('/js/bosses.js');
   game.combat.start(boss?scaledBoss(BOSSES[id],game.locations[game.state.location-1]):scaledEnemy(ENEMIES[id],game.locations[game.state.location-1],game.state.currentLevel),boss);
   game.ui.updateHud();game.ui.text('locationName',game.locations[game.state.location-1].name);game.ui.text('levelLabel',` · Уровень ${game.state.currentLevel}/10`);
 },{id,boss});
 const equip=async(kind,rarity='rare')=>page.evaluate(async({kind,rarity})=>{const {makeItem}=await import('/js/items.js');const item=makeItem(kind,rarity);game.inventory.add(item);game.inventory.equip(item.id);game.ui.updateHud()},{kind,rarity});
 const clockWait=async(seconds)=>{const target=await page.evaluate(s=>game.combat.time+s,seconds);await page.waitForFunction(t=>game.combat.time>=t,target)};
 try {
  await page.goto(base);await page.waitForFunction(()=>window.game&&document.querySelector('#bootScreen').hidden);
  await shot('01-menu','Главное меню: запуск без ошибок, кнопки доступны. Оформление по фото пока не внедрено.');
  await page.locator('#newGameBtn').click();await page.locator('#nameInput').fill('Виктор');await page.locator('[data-class="paladin"]').click();
  await shot('02-new-game','Новая игра: ввод имени, выбор класса и доступная кнопка создания героя.');
  await page.locator('#createHero').click();await page.locator('#startLocation').click();await waitBattle();await startEnemy();
  await equip('sword');await shot('03-battle-sword','Бой: реальная 3D-сцена, скелет с костяным телом, руки и экипированный меч.');
  await page.evaluate(()=>{Math.random=()=>.99;game.state.damage=1});
  const before=await page.evaluate(()=>({enemy:game.combat.enemy.hp,hp:game.state.hp}));
  const immediate=await page.evaluate(()=>{game.combat.attack();return game.combat.enemy.hp});assert.equal(immediate,before.enemy,'Damage must wait for contact');
  await page.locator('#hudMenu').click();const frozen=await page.evaluate(()=>({time:game.combat.time,hp:game.combat.enemy.hp,x:game.scene.hands.userData.rightArm.rotation.x}));
  await page.waitForTimeout(600);assert.deepEqual(await page.evaluate(()=>({time:game.combat.time,hp:game.combat.enemy.hp,x:game.scene.hands.userData.rightArm.rotation.x})),frozen);
  await shot('04-pause','Пауза посреди замаха: игровое время, положение оружия и HP не изменились за 600 мс.');
  await page.locator('#pauseResume').click();await page.waitForFunction(hp=>game.combat.enemy.hp<hp,before.enemy);
  await page.waitForFunction(()=>!!game.scene.animations.enemy);const enemyPosition=await page.evaluate(()=>game.scene.enemyGroup.position.z);await clockWait(.15);
  assert.notEqual(await page.evaluate(()=>game.scene.enemyGroup.position.z),enemyPosition,'Counterattack must move the model');
  await page.waitForFunction(hp=>game.state.hp<hp,before.hp);await page.waitForFunction(()=>!game.combat.lock);check('contact damage, paused windup, enemy physical movement, counterattack');

  for(const kind of ['sword','spear','axe','bow']){
    await equip(kind);assert.equal(await page.evaluate(()=>game.scene.hands.userData.kind),kind);
    await startEnemy();await page.evaluate(()=>{Math.random=()=>.99;game.state.damage=1});await page.locator('#attackBtn').click();
    if(kind==='bow'){await page.waitForFunction(()=>game.scene.projectile.visible);await shot('05-bow-shot','Лук: смена модели без перезагрузки, выпущенная 3D-стрела до попадания.');}
    await page.waitForFunction(()=>!game.combat.lock);
  }
  check('all four equipped weapons update instantly and complete their attack');

  await startEnemy();const kills=await page.evaluate(()=>game.state.stats.kills);await page.evaluate(()=>{game.state.damage=99999;game.combat.attack()});
  await page.waitForFunction(()=>game.combat.enemy._dying===true);assert.equal(await page.evaluate(()=>game.activeScreen),'battleScreen');assert.equal(await page.evaluate(()=>game.state.stats.kills),kills);
  assert(await page.locator('#attackBtn').isDisabled());await page.locator('#hudMenu').click();const deathTime=await page.evaluate(()=>game.combat.time);await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>game.combat.time),deathTime);assert.equal(await page.evaluate(()=>game.state.stats.kills),kills);
  await page.locator('#pauseResume').click();await page.locator('#rewardScreen').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>game.state.stats.kills),kills+1);
  await page.evaluate(()=>{game.combat.win();game.combat.win()});assert.equal(await page.evaluate(()=>game.state.stats.kills),kills+1);check('death freezes on pause, blocks attacks, commits one reward');
  await shot('06-reward','Награда: появляется после смерти, убийство и награда учитываются один раз.');
  await page.locator('#rewardContinue').click();await waitBattle();

  // Begin an attack, leave, then create a different hero: stale callbacks
  // must never affect the new enemy or reset the new animation.
  await page.evaluate(()=>{game.state.damage=1;game.combat.attack();game.toMenu()});await page.locator('#newGameBtn').click();await page.locator('#nameInput').fill('Новый герой');await page.locator('[data-class="knight"]').click();await page.locator('#createHero').click();await page.locator('#startLocation').click();
  const newHp=await page.evaluate(()=>({player:game.state.hp,enemy:game.combat.enemy.hp}));await clockWait(1.4);assert.deepEqual(await page.evaluate(()=>({player:game.state.hp,enemy:game.combat.enemy.hp})),newHp);check('new game cancels stale attack/death jobs');

  await page.evaluate(()=>{game.state.class='thief';game.state.equipment.weapon=null;game.ui.updateHud();game.combat.start({id:'skeleton',shape:'skeleton',color:0xc7c7bd,hp:100,maxHp:100,damage:1});game.state.damage=10;Math.random=()=>0;game.combat.attack()});
  await page.waitForFunction(()=>!game.combat.lock);assert.equal(await page.evaluate(()=>game.combat.enemy.hp),81);check('combo retains two separate impacts and 85% second-hit damage');
  await equip('spear');await page.evaluate(()=>{game.state.class='knight';game.combat.start({id:'golem',shape:'golem',color:0x77746c,hp:10,maxHp:10,damage:1});game.state.damage=9;Math.random=()=>0;game.combat.attack()});
  const bleedHp=await page.evaluate(()=>game.state.hp);await page.locator('#rewardScreen').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>game.state.hp),bleedHp);check('bleed kill cancels a heavy enemy strike queued after the bleed tick');await page.locator('#rewardContinue').click();

  await page.evaluate(async()=>{
    const {makeItem,WEAPONS,ARMOR,RARITIES}=await import('/js/items.js');
    for(const kind of Object.keys({...WEAPONS,...ARMOR}))for(const rarity of Object.keys(RARITIES))if((WEAPONS[kind]||ARMOR[kind]).stats[rarity]!=null)game.inventory.add(makeItem(kind,rarity));
    game.pause();game.openInventory();
  });
  assert.equal(await page.locator('#inventoryGrid .item-art').count(),41);await shot('07-inventory','Инвентарь: все 40 допустимых сочетаний предметов и редкости плюс экипированное копьё; предметы добавлены для проверки.');
  await page.locator('[data-filter="armor"]').click();assert.equal(await page.locator('#inventoryGrid .item-art').count(),18);await page.locator('[data-filter="all"]').click();check('all available item tiers and armor filter');
  await page.locator('#inventoryBack').click();await page.locator('#hudMenu').click();await page.locator('#pauseShop').click();await shot('08-shop','Магазин: иконки соответствуют редкости, цены и кнопки покупки сохранены.');await page.locator('#shopBack').click();
  await page.locator('#hudMenu').click();await page.locator('#pauseMenu').click();await page.locator('#collectionBtn').click();await page.locator('[data-cfilter="items"]').click();assert.equal(await page.locator('#collectionGrid .item-art').count(),40);await shot('13-collection','Коллекция: тестовые предметы используют те же иконки и русские названия редкости.');await page.locator('[data-cfilter="chests"]').click();await page.locator('#collectionBack').click();

  await page.evaluate(()=>game.save());const expected=await page.evaluate(()=>JSON.stringify(game.state));await page.reload();await page.waitForFunction(()=>window.game&&document.querySelector('#bootScreen').hidden);await page.locator('#continueBtn').click();assert.equal(await page.evaluate(()=>JSON.stringify(game.state)),expected);await page.locator('#startLocation').click();check('save format and continued equipment/progress survive reload');

  // Distinct locations and every existing enemy/boss ID must render without
  // fallback or leaking geometry on repeated replacement.
  for(let id=1;id<=5;id++){await page.evaluate(id=>{game.state.location=id;game.scene.setLocation(id)},id);await startEnemy(id===2?'goblin':id===3?'golem':id===4?'draugr':'skeleton');await shot(`location-${id}`,`Локация ${id}: заполненная 3D-сцена и собственные элементы окружения.`)}
  const models=await page.evaluate(async()=>{const {ENEMIES}=await import('/js/enemies.js');const {BOSSES}=await import('/js/bosses.js');return [...Object.values(ENEMIES),...Object.values(BOSSES).map(e=>({...e,isBoss:true}))]});
  for(const enemy of models){await page.evaluate(e=>game.combat.start({...e,hp:100,maxHp:100,damage:1},!!e.isBoss),enemy);await clockWait(.05);assert((await page.evaluate(()=>game.scene.renderer.info.render.triangles))>0);await shot('enemy-'+enemy.id,`${enemy.name}: модель реально отрисована в игре; художественная полировка ещё впереди.`)}
  assert.equal(models.length,20);check('all five locations and all 20 existing enemy/boss IDs render');
  await startEnemy('dragon',true);await page.evaluate(()=>{game.state.level=100;game.save();game.state.hp=game.state.maxHp;game.ui.updateHud();Math.random=()=>.1;game.combat.lock=true;game.combat.enemyAttack()});
  await page.waitForFunction(()=>game.scene.fireBreath.visible);await shot('09-dragon-fire','Дракон: крылья, хвост, лапы и отдельное огненное дыхание с ограниченным пулом эффектов.');await page.waitForFunction(()=>!game.combat.lock);assert((await page.evaluate(()=>game.scene.life.filter(v=>v>0).length))<=64);
  await page.evaluate(()=>{game.state.damage=99999;game.combat.attack()});await page.waitForFunction(()=>game.combat.enemy._dying);const dragonStart=await page.evaluate(()=>game.scene.animations.death.start);await clockWait(.95);assert.equal(await page.evaluate(()=>game.activeScreen),'battleScreen');await shot('10-dragon-death','Дракон: бой остаётся на экране во время продолжительной смерти; финал ещё не выдан.');
  await page.locator('#rewardScreen').waitFor({state:'visible'});assert((await page.evaluate(()=>game.combat.time))-dragonStart>=2.8);check('dragon fire and 2.8-second death before reward');
  await page.locator('#rewardContinue').click();assert(await page.locator('#victoryScreen').isVisible());await shot('11-victory','Финал: завершение пятой локации после смерти дракона, статистика и повторный запуск доступны.');

  await page.evaluate(()=>{game.state.completed=false;game.beginLevel()});
  const cycles=[];
  for(let i=0;i<30;i++){await page.evaluate(i=>{game.scene.setLocation(i%5+1);game.combat.start({id:'skeleton',shape:'skeleton',color:0xc7c7bd,hp:100,maxHp:100,damage:1})},i);await clockWait(.03);if(i%5===4)cycles.push(await page.evaluate(()=>({geometries:game.scene.renderer.info.memory.geometries,textures:game.scene.renderer.info.memory.textures,calls:game.scene.renderer.info.render.calls,triangles:game.scene.renderer.info.render.triangles})))}
  assert.equal(cycles.at(-1).geometries,cycles.at(-2).geometries);assert.equal(cycles.at(-1).textures,cycles.at(-2).textures);results.metrics.resourceCycles=cycles;check('30 replacements: stable geometry/texture counts for repeated locations');

  await page.setViewportSize({width:390,height:844});await startEnemy();await equip('sword');await shot('12-mobile','Узкий экран 390×844: сцена масштабируется, руки и оружие видны, кнопка атаки доступна.');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);check('mobile viewport has no horizontal overflow');
  results.metrics.gpu=await page.evaluate(()=>{const gl=game.scene.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)});
  const frames=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();function step(now){times.push(now-last);last=now;if(times.length>=90){times.sort((a,b)=>a-b);resolve({medianMs:times[45],p95Ms:times[85],frames:times.length})}else requestAnimationFrame(step)}requestAnimationFrame(step)}));results.metrics.frames=frames;
  assert.deepEqual(results.pageErrors,[]);results.passed=true;
 } finally {fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));await browser.close()}
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
