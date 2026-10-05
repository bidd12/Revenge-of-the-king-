import {Game} from "./game.js";
import {UI} from "./ui.js";
import {DEBUG_MODE} from "./utils.js";

import {Scene3D,FallbackScene} from "./scene.js";

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
scene.bindGame(game);

// Интерфейс запускается сразу на безопасной сцене. Если Three.js загрузится позже,
// незаметно подключаем полноценную 3D-сцену без перезапуска игры.
if (window.threeReadyPromise) {
  window.threeReadyPromise.then(ready => {
    if (!ready || !(scene instanceof FallbackScene) || typeof THREE === "undefined") return;
    try {
      const upgradedScene = new Scene3D();
      scene = upgradedScene;
      game.scene = upgradedScene;
      upgradedScene.bindGame(game);
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
