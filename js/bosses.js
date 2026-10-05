export const BOSSES={
giantSkeleton:{id:"giantSkeleton",name:"Огромный скелет",baseHp:620,baseDamage:32,description:"Гигантский костяной надзиратель шахт.",shape:"giantSkeleton",color:0xd6d0b8,special:"Удар костями"},
warden:{id:"warden",name:"Надзиратель",baseHp:820,baseDamage:42,description:"Жестокий хозяин тюрьмы.",shape:"warden",color:0x66556d,special:"Кнут"},
giantGolem:{id:"giantGolem",name:"Огромный голем",baseHp:1150,baseDamage:48,description:"Гигантский каменный защитник.",shape:"giantGolem",color:0x77766d,special:"Каменный удар"},
king:{id:"king",name:"Король",baseHp:1450,baseDamage:57,description:"Правитель, которому герой поклялся отомстить.",shape:"king",color:0x9e7738,special:"Королевский приказ"},
dragon:{id:"dragon",name:"Дракон",baseHp:2100,baseDamage:68,description:"Древний дракон, напавший на замок.",shape:"dragon",color:0x8b3028,special:"Огненное дыхание"}
};
export const scaledBoss=(b,loc)=>({...b,maxHp:Math.round(b.baseHp*loc.mult*1.15),hp:Math.round(b.baseHp*loc.mult*1.15),damage:Math.round(b.baseDamage*loc.mult*1.1)});
