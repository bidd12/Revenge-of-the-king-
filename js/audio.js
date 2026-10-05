export class AudioManager{
constructor(){this.sound=true;this.music=true;this.ctx=null}
beep(freq=440,duration=.08,type="sine"){if(!this.sound)return;try{this.ctx??=new AudioContext();if(this.ctx.state==="suspended")this.ctx.resume().catch(()=>{});const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.05,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration)}catch{}}
play(name){const f={attack:160,hit:90,enemyDeath:55,chestOpen:520,itemGet:700,levelUp:880,boss:70,victory:760,defeat:45}[name]||300;this.beep(f,name==="boss"?.3:.08,name==="boss"?"sawtooth":"square")}
}
