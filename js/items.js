export const RARITIES={
common:{name:"Обычный",mult:1,color:"r-common",sale:.25},
uncommon:{name:"Необычный",mult:1.35,color:"r-uncommon",sale:.30},
rare:{name:"Редкий",mult:2,color:"r-rare",sale:.35},
epic:{name:"Эпический",mult:2.6,color:"r-epic",sale:.40},
legendary:{name:"Легендарный",mult:3.5,color:"r-legendary",sale:.45},
mythic:{name:"Мифический",mult:5,color:"r-mythic",sale:.50}
};
export const ARMOR={chest:{name:"Нагрудник",type:"armor",slot:"chest",emoji:"🛡️",stats:{common:5,uncommon:10,rare:20,epic:25,legendary:35,mythic:50}},gloves:{name:"Перчатки",type:"armor",slot:"gloves",emoji:"🥊",stats:{common:5,uncommon:7,rare:10,epic:15,legendary:20,mythic:20}},boots:{name:"Ботинки",type:"armor",slot:"boots",emoji:"🥾",stats:{common:5,uncommon:10,rare:15,epic:20,legendary:30,mythic:40}}};
export const WEAPONS={
sword:{name:"Меч",type:"weapon",slot:"weapon",emoji:"⚔️",stats:{common:5,uncommon:10,rare:20,epic:25,legendary:35,mythic:50}},
spear:{name:"Копьё",type:"weapon",slot:"weapon",emoji:"🔱",stats:{common:3,uncommon:7,rare:10,epic:15,legendary:25,mythic:35},bleed:{common:10,uncommon:20,rare:30,epic:40,legendary:50,mythic:70}},
axe:{name:"Топор",type:"weapon",slot:"weapon",emoji:"🪓",stats:{rare:30,epic:40,legendary:50,mythic:60}},
bow:{name:"Лук",type:"weapon",slot:"weapon",emoji:"🏹",stats:{common:5,uncommon:10,rare:15,epic:25,legendary:30,mythic:40},combo:{common:10,uncommon:20,rare:40,epic:50,legendary:60,mythic:80}}
};
export function makeItem(kind,rarity){const d=WEAPONS[kind]||ARMOR[kind];if(!d)throw new Error(`Неизвестный предмет: ${kind}`);const bonus=d.stats[rarity];if(bonus==null||!RARITIES[rarity])throw new Error(`Недоступная редкость ${rarity} для предмета ${kind}`);return {id:crypto.randomUUID?.()||String(Date.now()+Math.random()),kind,name:d.name,type:d.type,slot:d.slot,rarity,emoji:d.emoji,bonus,bleed:d.bleed?.[rarity]||0,combo:d.combo?.[rarity]||0,price:Math.round(bonus*10*RARITIES[rarity].mult)}}
export const allDefinitions=()=>[...Object.entries(WEAPONS).map(([k,v])=>({kind:k,...v})),...Object.entries(ARMOR).map(([k,v])=>({kind:k,...v}))];
export function itemDesc(i){let a=`+${i.bonus} ${i.type==="weapon"?"урона":"HP"}`;if(i.bleed)a+=` · кровотечение ${i.bleed}%`;if(i.combo)a+=` · комбо ${i.combo}%`;return a}
