import {RARITIES,itemDesc} from "./items.js";
import {itemIcon} from "./item-visuals.js";
export class Inventory{
constructor(game){this.game=game}
get items(){return this.game.state.inventory}
add(item){this.items.push(item);this.game.state.collection.items[item.kind+":"+item.rarity]=true;this.game.save();this.game.ui.toast(`Получен предмет: ${item.name} (${RARITIES[item.rarity].name})`)}
remove(id){this.game.state.inventory=this.items.filter(i=>i.id!==id)}
equipped(id){return Object.values(this.game.state.equipment).some(x=>x?.id===id)}
equip(id){const i=this.items.find(x=>x.id===id);if(!i)return false;this.game.state.equipment[i.slot]=i;this.game.save();this.game.ui.toast(`Экипировано: ${i.name}`);return true}
sell(id){const i=this.items.find(x=>x.id===id);if(!i||this.equipped(id))return false;const price=Math.max(1,Math.floor(i.price*RARITIES[i.rarity].sale));this.remove(id);this.game.state.coins+=price;this.game.save();this.game.ui.toast(`Продано за ${price} монет`);return true}
armorHP(){return ["chest","gloves","boots"].reduce((s,k)=>s+(this.game.state.equipment[k]?.bonus||0),0)}
weaponDamage(){return this.game.state.equipment.weapon?.bonus||0}
comboChance(){return this.game.state.equipment.weapon?.combo||0}
bleedChance(){return this.game.state.equipment.weapon?.bleed||0}
render(filter="all"){const el=document.querySelector("#inventoryGrid");const arr=this.items.filter(i=>filter==="all"||i.type===filter);el.innerHTML=arr.length?arr.map(i=>`<article class="itemCard rarity-${i.rarity}"><div class="icon">${itemIcon(i)}</div><h3>${i.name}</h3><b class="${RARITIES[i.rarity].color}">${RARITIES[i.rarity].name}</b><p>${itemDesc(i)}</p><small>Цена: ${i.price}</small><br>${this.equipped(i.id)?'<button disabled>Экипировано</button>':`<button data-equip="${i.id}">Экипировать</button>`}<button ${this.equipped(i.id)?"disabled":""} data-sell="${i.id}">Продать</button></article>`).join(""):`<p class="muted">Инвентарь пуст.</p>`;
el.querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>{this.equip(b.dataset.equip);this.render(filter);this.game.ui.updateHud()});
el.querySelectorAll("[data-sell]").forEach(b=>b.onclick=()=>{const i=this.items.find(x=>x.id===b.dataset.sell);const price=Math.max(1,Math.floor(i.price*RARITIES[i.rarity].sale));if(confirm(`Продать ${i.name} за ${price} монет?`)){this.sell(i.id);this.render(filter);this.game.ui.updateHud()}});
document.querySelector("#equipmentPanel").innerHTML=Object.entries(this.game.state.equipment).map(([k,v])=>`<span class="equipSlot">${k}: <b>${v?.name||"—"}</b></span>`).join("")+`<div class="row"><button id="upgradeHero" class="gold" ${this.game.state.artifacts<5?"disabled":""}>Повысить уровень · 5 артефактов</button></div>`;
document.querySelector("#upgradeHero").onclick=()=>this.game.upgradeHero();
}}
