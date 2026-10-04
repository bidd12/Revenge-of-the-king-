const {chromium}=require(process.env.PLAYWRIGHT_MODULE||"playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs");
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_PATH,args:["--use-angle=swiftshader"]});
 try {
  const p=await browser.newPage();const errors=[];p.on("pageerror",e=>errors.push(e.message));
  await p.goto("http://127.0.0.1:8000/");
  await p.waitForFunction(()=>window.game&&document.querySelector("#bootScreen").hidden);
  await p.locator("#newGameBtn").click();await p.locator("#nameInput").fill("Прогресс");await p.locator('[data-class="knight"]').click();await p.locator("#createHero").click();
  await p.locator("#startLocation").click();
  await p.evaluate(()=>{game.state.artifacts=5;game.pause()});
  await p.locator("#pauseInventory").click();await p.locator("#upgradeHero").click();
  assert.equal(await p.evaluate(()=>game.state.level),2);assert.equal(await p.evaluate(()=>game.state.artifacts),0);
  await p.locator("#inventoryBack").click();
  await p.evaluate(()=>{Math.random=()=>.6;game.state.damage=99999});
  await p.locator("#attackBtn").click();await p.waitForTimeout(500);
  assert(await p.locator("#openChest").isVisible());assert(await p.locator("#rewardContinue").isDisabled());
  await p.locator("#openChest").click();assert.equal(await p.evaluate(()=>game.state.inventory.length),1);assert.equal(await p.evaluate(()=>game.state.stats.foundItems),1);
  await p.locator("#rewardContinue").click();await p.locator("#hudMenu").click();await p.locator("#pauseInventory").click();
  await p.locator("[data-equip]").first().click();assert.equal(await p.locator("[data-equip]").count(),0);
  await p.locator("#inventoryBack").click();await p.locator("#hudMenu").click();await p.locator("#pauseShop").click();
  await p.evaluate(()=>{game.state.coins=10000});await p.locator("[data-buy]").first().click();
  assert.equal(await p.evaluate(()=>game.state.inventory.length),2);assert((await p.evaluate(()=>game.state.coins))<10000);
  await p.locator("#shopBack").click();await p.locator("#hudMenu").click();await p.locator("#pauseInventory").click();
  p.once("dialog",d=>d.accept());await p.locator("[data-sell]:not([disabled])").first().click();assert.equal(await p.evaluate(()=>game.state.inventory.length),1);
  await p.locator("#inventoryBack").click();await p.locator("#hudMenu").click();await p.locator("#pauseMenu").click();
  // Exercise progression boundaries directly so 80 levels don't require hours of clicks.
  await p.evaluate(()=>{game.state.currentLevel=16;game.state.location=1;game.beginLevel();game.state.damage=999999});
  await p.locator("#attackBtn").click();await p.waitForTimeout(500);await p.locator("#rewardContinue").click();
  assert.equal(await p.evaluate(()=>game.state.location),2);assert.equal(await p.evaluate(()=>game.state.currentLevel),1);
  await p.evaluate(()=>{game.state.location=5;game.state.currentLevel=16;game.beginLevel();game.state.damage=999999});
  await p.locator("#attackBtn").click();await p.waitForTimeout(500);await p.locator("#rewardContinue").click();
  assert(await p.locator("#victoryScreen").isVisible());assert.equal(await p.evaluate(()=>game.state.completed),true);
  await p.locator("#victoryMenu").click();await p.locator("#continueBtn").click();assert(await p.locator("#victoryScreen").isVisible());
  await p.locator("#restartBtn").click();await p.waitForFunction(()=>window.game&&document.querySelector("#bootScreen").hidden);
  assert(await p.locator("#continueBtn").isDisabled());
  assert.deepEqual(errors,[]);
  // SDK stub validates call order only; real portal verification remains necessary.
  await p.close();
  const sdk=await browser.newPage();
  await sdk.addInitScript(()=>{
    window.calls=[];window.sdkHandlers={};
    window.YaGames={init:async()=>({features:{LoadingAPI:{ready:()=>calls.push("ready")},GameplayAPI:{start:()=>calls.push("start"),stop:()=>calls.push("stop")}},on:(event,fn)=>sdkHandlers[event]=fn})};
  });
  await sdk.route("http://127.0.0.1:8000/",r=>r.fulfill({status:200,contentType:"text/html",body:fs.readFileSync("index.html","utf8").replace('<html lang="ru">','<html lang="ru" data-platform="yandex">')}));
  await sdk.goto("http://127.0.0.1:8000/");await sdk.waitForFunction(()=>window.game&&document.querySelector("#bootScreen").hidden);
  assert.deepEqual(await sdk.evaluate(()=>calls),["ready"]);
  await sdk.locator("#newGameBtn").click();await sdk.locator("#nameInput").fill("SDK");await sdk.locator('[data-class="mage"]').click();await sdk.locator("#createHero").click();await sdk.locator("#startLocation").click();
  await sdk.evaluate(()=>sdkHandlers.game_api_pause());assert(await sdk.locator("#pauseScreen").isVisible());
  assert.deepEqual(await sdk.evaluate(()=>calls),["ready","start","stop"]);
  await sdk.locator("#pauseResume").click();assert.deepEqual(await sdk.evaluate(()=>calls),["ready","start","stop","start"]);
  console.log(JSON.stringify({passed:true,checks:["upgrade","chest cannot skip","equipment","buy/sell","boss transition","dragon final","completed continue","restart","SDK ready/start/stop pause stub"],pageErrors:errors},null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
