// The core calls this interface; only this adapter knows about Yandex.
export class BrowserPlatform {
  async init() {}
  ready() {}
  setGameplay() {}
}
export class YandexPlatform extends BrowserPlatform {
  constructor() { super(); this.sdk=null; this.playing=false; this.loaded=false; }
  async init() {
    if(!window.YaGames) {
      await new Promise((resolve,reject)=>{
        const script=document.createElement("script");
        const timer=setTimeout(()=>{script.remove();reject(new Error("Яндекс SDK: превышено время загрузки"));},12000);
        script.src="/sdk.js";
        script.onload=()=>{clearTimeout(timer);resolve();};
        script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error("Яндекс SDK недоступен"));};
        document.head.appendChild(script);
      });
    }
    let timer;
    try { this.sdk=await Promise.race([window.YaGames.init(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("Яндекс SDK: превышено время инициализации")),12000)})]); }
    finally { clearTimeout(timer); }
    const pause=()=>{window.game?.pause();window.game?.audio.ctx?.suspend();this.setGameplay(false);};
    this.sdk.on("game_api_pause",pause);
    // Resuming requires the player's explicit pause-menu action.
    this.sdk.on("game_api_resume",()=>{});
  }
  ready() { if(!this.loaded) { this.sdk.features.LoadingAPI.ready(); this.loaded=true; } }
  setGameplay(playing) {
    if(!this.sdk||!this.loaded||playing===this.playing) return;
    const api=this.sdk.features.GameplayAPI;
    if(playing) api?.start(); else api?.stop();
    this.playing=playing;
  }
}
export const createPlatform=()=>document.documentElement.dataset.platform==="yandex"?new YandexPlatform():new BrowserPlatform();
