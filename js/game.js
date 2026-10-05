import {LOCATIONS,getLocation,LEVELS_PER_LOCATION,BOSS_LEVEL} from "./locations.js";
import {ENEMIES,scaledEnemy} from "./enemies.js";
import {BOSSES,scaledBoss} from "./bosses.js";
import {newPlayer,CLASSES,recalc,levelUp} from "./player.js";
import {saveGame,loadGame,deleteSave,hasSave} from "./save.js";
import {Inventory} from "./inventory.js";
import {Combat} from "./combat.js";
import {AudioManager} from "./audio.js";
import {openChest as chestOpen} from "./chests.js";
import {availableShop,buy} from "./shop.js";
import {randomInt,chance,DEBUG_MODE} from "./utils.js";
import {RARITIES,WEAPONS,ARMOR} from "./items.js";
import {itemIcon} from "./item-visuals.js";
export class Game{
constructor(scene,ui){this.activeScreen="menuScreen";this.scene=scene;this.ui=ui;this.locations=LOCATIONS;this.classes=CLASSES;this.audio=new AudioManager();this.selectedClass=null;this.inventory=null;this.combat=new Combat(this);this.state=null;this.pendingReward=null;this.shopItems=[];this.collectionFilter="enemies";this.fromBattle=false;this.updateContinue()}
updateContinue(){document.querySelector("#continueBtn").disabled=!hasSave()}
createHero(){const name=document.querySelector("#nameInput").value.trim();if(!name||!this.selectedClass)return;this.combat.cancel();this.pendingReward=null;this.rewardItem=null;this.state=newPlayer(name,this.selectedClass);this.inventory=new Inventory(this);this.state.collection.enemies.skeleton=true;recalc(this.state,this.inventory);this.save();this.showLocation();this.ui.updateHud()}
continueGame(){const s=loadGame();if(!s){this.ui.toast("Сохранение отсутствует или повреждено.");this.updateContinue();return;}this.combat.cancel();this.pendingReward=null;this.rewardItem=null;this.state=s;this.inventory=new Inventory(this);recalc(this.state,this.inventory);if(this.state.hp<=0)this.state.hp=this.state.maxHp;this.save();this.ui.updateHud();if(this.state.completed)this.winGame();else this.showLocation()}
save(){if(this.state){recalc(this.state,this.inventory);this.scene.syncEquipment(this.state);if(!saveGame(this.state))this.ui.toast("Не удалось сохранить прогресс: хранилище недоступно.");this.updateContinue()}}
showLocation(){const l=getLocation(this.state.location);this.scene.setLocation(l.id);this.ui.renderLocation(l)}
startLocation(){this.beginLevel()}
beginLevel(){this.scene.clearEnemy();this.ui.hideAll();document.querySelector("#hud").classList.remove("hidden");document.querySelector("#battleScreen").classList.remove("hidden");this.activeScreen="battleScreen";this.platform?.setGameplay(true);this.ui.updateHud();document.querySelector("#locationName").textContent=getLocation(this.state.location).name;document.querySelector("#levelLabel").textContent=this.state.currentLevel===BOSS_LEVEL?" · Босс этапа":` · Уровень ${this.state.currentLevel}/${LEVELS_PER_LOCATION}`;document.querySelector("#combatLog").innerHTML="";if(this.state.currentLevel===BOSS_LEVEL){this.state.hp=this.state.maxHp;this.spawnBoss()}else{this.remaining=randomInt(3,5);this.spawnNextEnemy()}}
spawnNextEnemy(){const loc=getLocation(this.state.location),id=loc.enemies[randomInt(0,loc.enemies.length-1)],e=scaledEnemy(ENEMIES[id],loc,this.state.currentLevel);this.combat.start(e,false)}
spawnBoss(){const loc=getLocation(this.state.location),e=scaledBoss(BOSSES[loc.boss],loc);e.id=loc.boss;this.combat.start(e,true);this.audio.play("boss")}
reward(enemy){this.pendingReward={enemy};if(enemy.isBoss){this.state.defeatedBosses.push(enemy.id);this.state.artifacts+=2;this.state.hp=this.state.maxHp;this.save();this.bossReward();return}this.remaining--;this.state.artifacts+=1;let type;let amount=0;if(this.state.pity>=3){type="chest"}else{const r=Math.random();type=r<.5?"coins":r<.8?"chest":"nothing"}if(type==="coins"){amount=randomInt(8,18);this.state.coins+=amount;this.state.pity=0}else if(type==="chest"){this.state.pity=0}else this.state.pity++;this.save();this.ui.renderReward(type==="coins"?{kind:"coins",amount}:type==="chest"?{kind:"chest"}:{kind:"nothing"});this.audio.play(type==="nothing"?"hit":"itemGet")}
bossReward(){this.ui.show("rewardScreen");document.querySelector("#rewardContent").innerHTML=`<div class="rewardBox"><div class="rewardIcon">🏆</div><h3>${this.combat.enemy.name} повержен!</h3><p>+2 артефакта · HP полностью восстановлено.</p></div>`;document.querySelector("#rewardContinue").disabled=false;this.audio.play("victory")}
continueReward(){if(this.activeScreen!=="rewardScreen"||this.rewardItem||document.querySelector("#rewardContinue").disabled)return;if(this.pendingReward?.enemy?.isBoss){this.pendingReward=null;if(this.state.location===5){this.winGame();return}this.state.location++;this.state.unlockedLocations.push(this.state.location);this.state.currentLevel=1;this.state.hp=this.state.maxHp;this.save();this.showLocation();return}if(this.remaining>0){this.beginBattleAgain()}else{this.state.hp=Math.min(this.state.maxHp,this.state.hp+Math.round(this.state.maxHp*.1));this.save();this.ui.text("levelCompleteText",`Все враги повержены. Вы восстановили 10% HP. Артефакты: ${this.state.artifacts}/5`);this.ui.show("levelCompleteScreen")}}
beginBattleAgain(){this.ui.hideAll();document.querySelector("#hud").classList.remove("hidden");document.querySelector("#battleScreen").classList.remove("hidden");this.activeScreen="battleScreen";this.platform?.setGameplay(true);this.ui.updateHud();this.ui.text("levelLabel",this.state.currentLevel===BOSS_LEVEL?" · Босс этапа":` · Уровень ${this.state.currentLevel}/${LEVELS_PER_LOCATION}`);this.spawnNextEnemy()}
nextLevel(){if(this.state.artifacts>=5){this.ui.toast("Можно повысить уровень: 5 артефактов.");}this.state.currentLevel=Math.min(BOSS_LEVEL,this.state.currentLevel+1);this.save();this.beginLevel()}
defeat(){this.combat.cancel();this.save();this.ui.show("defeatScreen")}
retry(){this.state.hp=this.state.maxHp;this.save();this.beginLevel()}
previous(){this.state.currentLevel=Math.max(1,this.state.currentLevel-1);this.state.hp=this.state.maxHp;this.save();this.beginLevel()}
pause(){if(document.querySelector("#battleScreen").classList.contains("hidden"))return;this.ui.show("pauseScreen")}
resumeBattle(){this.ui.show("battleScreen");document.querySelector("#hud").classList.remove("hidden")}
openMap(){this.fromBattle=this.activeScreen==="battleScreen"||this.activeScreen==="pauseScreen";this.ui.renderMap()}
resumeFromMap(){if(this.fromBattle)this.resumeBattle();else this.showLocation()}
upgradeHero(){if(levelUp(this.state,this.inventory)){this.save();this.audio.play("levelUp");this.ui.updateHud();this.inventory.render();this.ui.toast("Уровень повышен. Здоровье восстановлено.")}else this.ui.toast("Нужно 5 артефактов.")}
openInventory(){this.fromBattle=this.activeScreen==="battleScreen"||this.activeScreen==="pauseScreen";this.inventory.render();this.ui.show("inventoryScreen")}
openShop(){this.fromBattle=this.activeScreen==="battleScreen"||this.activeScreen==="pauseScreen";this.shopItems=availableShop(this);this.ui.renderShop()}
returnToBattleOrMenu(){this.fromBattle?this.resumeBattle():this.toMenu()}
buyItem(id){const i=this.shopItems.find(x=>x.id===id);if(i)buy(this,i)}
openChest(){const i=chestOpen(this);this.state.stats.foundItems++;this.save();this.audio.play("itemGet");return i}
winGame(){this.state.completed=true;this.save();this.ui.text("victoryStats",`Герой: ${this.state.name} · Класс: ${this.classes[this.state.class].name}\nУровень: ${this.state.level}\nПобеждено врагов: ${this.state.stats.kills}\nМонет: ${this.state.coins}\nНайдено предметов: ${this.state.stats.foundItems}\nКоллекционных объектов: ${this.collectionCount()}`);this.ui.show("victoryScreen");this.audio.play("victory")}
collectionCount(){return Object.values(this.state.collection).reduce((n,o)=>n+Object.values(o).filter(Boolean).length,0)}
toMenu(){this.combat.cancel();this.fromBattle=false;this.ui.hideAll();document.querySelector("#hud").classList.add("hidden");this.ui.show("menuScreen");this.updateContinue()}
allEnemyCards(){return Object.values(ENEMIES)}
allBossCards(){return Object.values(BOSSES)}
allItemCollection(){return Object.keys(this.state.collection.items).map(key=>{const [kind,rarity]=key.split(":");return {id:key,key,kind,rarity,name:`${RARITIES[rarity]?.name||"Неизвестный"} ${(WEAPONS[kind]||ARMOR[kind])?.name||"предмет"}`,description:"Найденный предмет"}})}
cardCollection(x,unlocked){return `<article class="collectionCard ${unlocked&&x.rarity?`rarity-${x.rarity}`:""} ${unlocked?"":"locked"}"><div class="icon">${unlocked?(x.kind&&x.rarity?itemIcon(x):(x.emoji||"☠️")):"?"}</div><h3>${unlocked?x.name:"Неизвестно"}</h3><p>${unlocked?(x.description||"Открыто"):"Силуэт пока скрыт"}</p></article>`}
}
