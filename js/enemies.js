export const ENEMIES={
skeleton:{id:"skeleton",name:"Скелет",baseHp:45,baseDamage:8,description:"Костяной раб шахт.",shape:"skeleton",color:0xc7c7bd},
slime:{id:"slime",name:"Слизень",baseHp:35,baseDamage:5,description:"Медленный шахтный слизень.",shape:"slime",color:0x5ca64e},
miner:{id:"miner",name:"Унылый шахтёр",baseHp:75,baseDamage:6,description:"Уставший пленник, сломленный шахтой.",shape:"miner",color:0x8a6849},
bandit:{id:"bandit",name:"Разбойник",baseHp:55,baseDamage:9,description:"Быстрый преступник тюремных коридоров.",shape:"bandit",color:0x51384a},
goblin:{id:"goblin",name:"Гоблин",baseHp:48,baseDamage:11,description:"Злобный мелкий охранник.",shape:"goblin",color:0x4d8d52},
guard:{id:"guard",name:"Охранник",baseHp:80,baseDamage:13,description:"Тюремный страж.",shape:"guard",color:0x56677a},
royalGuard:{id:"royalGuard",name:"Обычный стражник",baseHp:95,baseDamage:15,description:"Страж королевского подвала.",shape:"guard",color:0x586b8c},
palaceGuard:{id:"palaceGuard",name:"Страж палат",baseHp:90,baseDamage:19,description:"Защитник королевских покоев.",shape:"guard",color:0x8c733c},
golem:{id:"golem",name:"Голем",baseHp:155,baseDamage:13,description:"Каменный страж.",shape:"golem",color:0x77746c},
hound:{id:"hound",name:"Сторожевой пёс",baseHp:115,baseDamage:18,description:"Королевский боевой пёс.",shape:"hound",color:0x543c31},
eliteGuard:{id:"eliteGuard",name:"Элитный страж",baseHp:120,baseDamage:23,description:"Лучший воин дворца.",shape:"guard",color:0xb39a58},
draugr:{id:"draugr",name:"Драугр",baseHp:145,baseDamage:25,description:"Древний мертвец.",shape:"draugr",color:0x557b82},
guard2:{id:"guard2",name:"Обычный стражник",baseHp:125,baseDamage:22,description:"Северный страж.",shape:"guard",color:0x65748a},
eliteGuard2:{id:"eliteGuard2",name:"Элитный стражник",baseHp:165,baseDamage:29,description:"Элитный защитник башни.",shape:"guard",color:0xc0a85b},
draugr2:{id:"draugr2",name:"Драугр",baseHp:190,baseDamage:31,description:"Мертвец северной башни.",shape:"draugr",color:0x6e9192}
};
export function scaledEnemy(e,loc,level){const levelMult=1+(level-1)*0.055;return {...e,maxHp:Math.round(e.baseHp*loc.mult*levelMult),hp:Math.round(e.baseHp*loc.mult*levelMult),damage:Math.round(e.baseDamage*loc.mult*levelMult)}}
