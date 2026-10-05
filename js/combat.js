import {chance,clamp} from './utils.js';
import {CLASSES} from './player.js';

export class Combat {
  constructor(game){
    this.game=game;this.lock=false;this.enemy=null;this.jobs=new Set();this.generation=0;this.time=0;this.previous=performance.now();
    const frame=now=>{const dt=Math.min(.05,Math.max(0,(now-this.previous)/1000));this.previous=now;this.tick(dt);requestAnimationFrame(frame)};
    requestAnimationFrame(frame);
  }
  active(){return this.game.activeScreen==='battleScreen'&&!document.hidden}
  cancel(){this.generation++;this.jobs.clear();this.lock=false;this.bleedTimer=false;this.game.scene.cancelAnimations?.()}
  later(fn,delay){this.jobs.add({at:this.time+delay/1000,fn,generation:this.generation})}
  tick(dt){
    if(!this.active())return;this.time+=dt;
    // Snapshot protects newly scheduled callbacks from running in this frame.
    for(const job of [...this.jobs])if(job.at<=this.time){this.jobs.delete(job);if(job.generation===this.generation&&this.active())job.fn()}
    this.syncButton();
  }
  syncButton(){const button=document.querySelector('#attackBtn');const disabled=this.lock||!!this.enemy?._dying;if(button.disabled!==disabled)button.disabled=disabled}
  start(enemy,isBoss=false){this.cancel();this.enemy={...enemy,isBoss};this.game.scene.setEnemy(this.enemy);this.update()}
  update(){if(this.enemy)this.game.ui.enemy(this.enemy);this.syncButton()}
  attack(){
    if(!this.active()||this.lock||!this.enemy||this.enemy.hp<=0||this.enemy._dying||this.game.state.hp<=0)return;
    this.lock=true;const g=this.game,kind=g.state.equipment.weapon?.kind||'fists',damage=g.state.damage,bleedChance=g.inventory.bleedChance();
    const combo=chance(Math.min(.9,(CLASSES[g.state.class].combo+g.inventory.comboChance())/100));
    const swing=(second=false)=>{
      g.audio.play('attack');const duration=g.scene.attackAnim(kind);
      this.later(()=>{
        if(!this.enemy||this.enemy.hp<=0||this.enemy._dying)return;
        const d=Math.max(1,Math.round(damage*(second?.85:1)));
        this.enemy.hp=clamp(this.enemy.hp-d,0,this.enemy.maxHp);g.scene.enemyHitAnim(d>=this.enemy.maxHp*.25||kind==='axe');
        g.ui.floatDamage(d,false,combo);g.ui.log(second?'Комбо! Второй удар.':`Вы нанесли ${d} урона.`);this.update();
        if(this.enemy.hp<=0){this.win();return}
        if(!second&&bleedChance&&chance(bleedChance/100)&&!this.bleedTimer)this.applyBleed();
      },duration.impact);
      this.later(()=>{
        if(this.enemy.hp<=0||this.enemy._dying)return;
        if(combo&&!second)swing(true);else this.enemyAttack();
      },duration.end+100);
    };
    swing();
  }
  enemyAttack(){
    if(!this.enemy||this.enemy.hp<=0||this.enemy._dying)return;
    const fire=this.enemy.id==='dragon'&&chance(.25),d=Math.round(this.enemy.damage*(fire?1.25:1));
    if(fire)this.game.ui.bossWarning();
    const duration=this.game.scene.enemyAttackAnim(this.enemy,fire);
    this.later(()=>{if(this.enemy.hp>0&&!this.enemy._dying)this.take(d,false)},duration.impact);
    this.later(()=>{if(this.game.state.hp>0&&!this.enemy._dying)this.lock=false},duration.end);
  }
  take(d,unlock=true){
    const g=this.game;if(!this.active()||!g.state||g.state.hp<=0||this.enemy?._dying)return;
    g.state.hp=clamp(g.state.hp-d,0,g.state.maxHp);g.ui.floatDamage(d,true);g.scene.hitAnim();g.ui.updateHud();g.save();
    if(g.state.hp<=0){this.jobs.clear();this.lock=true;this.later(()=>g.defeat(),350)}else if(unlock)this.lock=false;
  }
  applyBleed(){
    this.bleedTimer=true;this.game.ui.log('Кровотечение! 5% текущего HP каждую секунду.');let n=0;
    const tick=()=>{
      if(!this.enemy||this.enemy.hp<=0||this.enemy._dying||n>=5){this.bleedTimer=false;return}
      const before=this.enemy.hp;this.enemy.hp=Math.max(0,this.enemy.hp-Math.max(1,Math.round(this.enemy.hp*.05)));
      this.game.ui.floatDamage(before-this.enemy.hp,false);this.game.scene.enemyHitAnim(false);this.update();n++;
      if(this.enemy.hp<=0)this.win();else this.later(tick,1000);
    };this.later(tick,1000);
  }
  win(){
    if(!this.enemy||this.enemy._won||this.enemy._dying)return;
    this.cancel();this.enemy.hp=0;this.enemy._dying=true;this.lock=true;this.update();
    const g=this.game;g.audio.play('enemyDeath');const delay=g.scene.enemyDefeat(this.enemy);
    this.later(()=>{
      if(this.enemy._won)return;this.enemy._won=true;g.state.stats.kills++;
      g.state.collection.enemies[this.enemy.id]=true;if(this.enemy.isBoss)g.state.collection.bosses[this.enemy.id]=true;
      // Commit reward once, after the complete visual death sequence.
      g.scene.clearEnemy();g.reward(this.enemy);
    },delay);
  }
}
