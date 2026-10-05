import {RARITIES,makeItem,WEAPONS,ARMOR} from "./items.js";
import {chance,weightedPick} from "./utils.js";
const POOLS={1:[["common",60],["uncommon",40]],2:[["common",35],["uncommon",45],["rare",20]],3:[["uncommon",35],["rare",45],["epic",15],["legendary",5]],4:[["rare",40],["epic",40],["legendary",15],["mythic",5]],5:[["epic",45],["legendary",35],["mythic",20]]};
export function chestRarity(loc,pity){let pool=POOLS[loc].map(([value,weight])=>({value,weight}));if(pity>=3)pool=pool.map(x=>({...x,weight:x.value==="common"?0:x.weight*(1+pity*.3)}));return weightedPick(pool)}
export function openChest(game){const r=chestRarity(game.state.location,game.state.pity);game.state.pity=0;const defs={...WEAPONS,...ARMOR};const keys=Object.keys(defs).filter(kind=>defs[kind].stats[r]!=null);const kind=keys[Math.floor(Math.random()*keys.length)];const item=makeItem(kind,r);game.inventory.add(item);game.state.collection.chests[r]=true;game.save();return item}
export const chestTypes=["common","uncommon","rare","epic","legendary","mythic"];
