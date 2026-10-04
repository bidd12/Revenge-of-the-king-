import {chance,clamp} from "./utils.js";
import {CLASSES} from "./player.js";
export class Combat {
  constructor(game) { this.game=game; this.lock=false; this.enemy=null; this.jobs=new Set(); this.generation=0; }
  active() { return this.game.activeScreen==="battleScreen" && !document.hidden; }
  cancel() { this.generation++; for(const id of this.jobs) clearTimeout(id); this.jobs.clear(); this.lock=false; this.bleedTimer=false; }
  later(fn, delay) {
    const generation=this.generation;
    const tick=() => {
      this.jobs.delete(id);
      if(generation!==this.generation) return;
      if(!this.active()) { id=setTimeout(tick,100); this.jobs.add(id); return; }
      fn();
    };
    let id=setTimeout(tick,delay); this.jobs.add(id);
  }
  start(enemy,isBoss=false) { this.cancel(); this.enemy={...enemy,isBoss}; this.game.scene.setEnemy(this.enemy); this.update(); }
  update() { if(this.enemy) this.game.ui.enemy(this.enemy); }
  attack() {
    if(!this.active()||this.lock||!this.enemy||this.enemy.hp<=0||this.game.state.hp<=0) return;
    this.lock=true;
    const g=this.game; g.audio.play("attack"); g.scene.attackAnim();
    const combo=chance(Math.min(.9,(CLASSES[g.state.class].combo+g.inventory.comboChance())/100));
    let total=0;
    for(let n=0;n<(combo?2:1);n++) {
      const d=Math.max(1,Math.round(g.state.damage*(n?.85:1)));
      this.enemy.hp=clamp(this.enemy.hp-d,0,this.enemy.maxHp); total+=d;
      g.ui.floatDamage(d,false,combo); if(this.enemy.hp<=0) break;
    }
    g.ui.log(combo?"Комбо! Две атаки подряд.":`Вы нанесли ${total} урона.`);
    this.update();
    if(this.enemy.hp<=0) { this.later(()=>this.win(),350); return; }
    if(g.inventory.bleedChance()&&chance(g.inventory.bleedChance()/100)&&!this.bleedTimer) this.applyBleed();
    this.later(()=>this.enemyAttack(),500);
  }
  enemyAttack() {
    if(!this.enemy||this.enemy.hp<=0) { this.lock=false; return; }
    let d=this.enemy.damage;
    if(this.enemy.isBoss&&this.enemy.id==="dragon"&&chance(.25)) {
      d=Math.round(d*1.25); this.game.ui.bossWarning(); this.later(()=>this.take(d),700);
    } else this.take(d);
  }
  take(d) {
    const g=this.game; g.state.hp=clamp(g.state.hp-d,0,g.state.maxHp);
    g.ui.floatDamage(d,true); g.scene.hitAnim(); g.ui.updateHud(); g.save();
    this.lock=g.state.hp<=0;
    if(this.lock) this.later(()=>g.defeat(),350);
  }
  applyBleed() {
    this.bleedTimer=true; this.game.ui.log("Кровотечение! 5% текущего HP каждую секунду.");
    let n=0;
    const tick=()=>{
      if(!this.enemy||this.enemy.hp<=0||n>=5) { this.bleedTimer=false; return; }
      const before=this.enemy.hp;
      this.enemy.hp=Math.max(0,this.enemy.hp-Math.max(1,Math.round(this.enemy.hp*.05)));
      this.game.ui.floatDamage(before-this.enemy.hp,false); this.update(); n++;
      if(this.enemy.hp<=0) this.win(); else this.later(tick,1000);
    };
    this.later(tick,1000);
  }
  win() {
    if(!this.enemy||this.enemy._won) return;
    this.cancel(); this.enemy._won=true; this.lock=true;
    const g=this.game; g.audio.play("enemyDeath"); g.state.stats.kills++;
    g.state.collection.enemies[this.enemy.id]=true;
    if(this.enemy.isBoss) g.state.collection.bosses[this.enemy.id]=true;
    g.reward(this.enemy);
  }
}
