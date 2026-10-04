import {randomInt} from "./utils.js";
export function createLevelQueue(location){return randomInt(3,5)}
export const levelIsBoss=l=>l===16;
export const nextLevel=(loc,lvl)=>lvl<16?lvl+1:1;
