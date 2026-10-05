import {BOSS_LEVEL} from './locations.js';
const KEY="revenge_of_the_king_save_v1";
const classes=new Set(["paladin","knight","mage","thief"]);
const slots=["weapon","chest","gloves","boots"];
const rarities=new Set(["common","uncommon","rare","epic","legendary","mythic"]);
export function validSave(s) {
  const record=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
  const nonnegative=v=>Number.isFinite(v)&&v>=0;
  const item=i=>record(i)&&typeof i.id==="string"&&typeof i.name==="string"&&slots.includes(i.slot)&&rarities.has(i.rarity)&&nonnegative(i.bonus)&&nonnegative(i.price);
  return record(s)&&typeof s.name==="string"&&s.name.length>0&&s.name.length<=20&&classes.has(s.class)
    &&Number.isInteger(s.location)&&s.location>=1&&s.location<=5
    &&Number.isInteger(s.currentLevel)&&s.currentLevel>=1&&s.currentLevel<=16
    &&Number.isInteger(s.level)&&s.level>=1
    &&["hp","maxHp","coins","artifacts","pity"].every(k=>nonnegative(s[k]))&&s.hp<=s.maxHp
    &&Array.isArray(s.inventory)&&s.inventory.every(item)
    &&record(s.equipment)&&slots.every(k=>s.equipment[k]===null||item(s.equipment[k]))
    &&record(s.collection)&&["enemies","bosses","items","chests"].every(k=>record(s.collection[k]))
    &&Array.isArray(s.unlockedLocations)&&s.unlockedLocations.every(n=>Number.isInteger(n)&&n>=1&&n<=5)
    &&Array.isArray(s.defeatedBosses)&&record(s.stats)&&["kills","foundItems"].every(k=>nonnegative(s.stats[k]));
}
export function saveGame(state) { try { localStorage.setItem(KEY,JSON.stringify(state)); return true; } catch(e) { console.warn("Save failed",e); return false; } }
export function loadGame() { try { const raw=localStorage.getItem(KEY); const s=raw?JSON.parse(raw):null; if(!validSave(s))return null; s.currentLevel=Math.min(s.currentLevel,BOSS_LEVEL);return s; } catch { return null; } }
export function deleteSave() { try { localStorage.removeItem(KEY); return true; } catch { return false; } }
export function hasSave() { return loadGame()!==null; }
