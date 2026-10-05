// Presentation only: never add model references to saved inventory objects.
export const ITEM_STYLES = {
  common: {body:0x896444,edge:0xc6a780,grip:0x483123,glow:0,material:"Дерево / кожа"},
  uncommon: {body:0x697773,edge:0xa9b6a5,grip:0x39483e,glow:0,material:"Камень / кольчуга"},
  rare: {body:0x8fabbc,edge:0xe1eef3,grip:0x3c4f60,glow:0,material:"Железо"},
  epic: {body:0xc49a35,edge:0xffdf77,grip:0x554128,glow:0,material:"Золото"},
  legendary: {body:0x4ca890,edge:0xb2f4ec,grip:0x234b49,glow:0x164238,material:"Алмаз / изумруд"},
  mythic: {body:0x25232e,edge:0xf65045,grip:0x170f19,glow:0x6c1118,material:"Чёрный материал / красные элементы"}
};
const hex = n => '#'+n.toString(16).padStart(6,'0');
const cache=new Map();
export function itemIcon(item) {
  const requestedKind=item.kind||item.slot;
  const kind=['sword','spear','axe','bow','chest','gloves','boots','lootChest'].includes(requestedKind)?requestedKind:'artifact';
  const rarity=ITEM_STYLES[item.rarity]?item.rarity:'common';
  const key=kind+':'+rarity;
  if(cache.has(key))return cache.get(key);
  const s=ITEM_STYLES[rarity], body=hex(s.body),edge=hex(s.edge),grip=hex(s.grip);
  const patterns={
    common:'<path d="M0 5h8M2 0v8" stroke="'+edge+'" opacity=".22"/>',
    uncommon:'<path d="M0 0l8 8M8 0L0 8" stroke="'+edge+'" opacity=".32"/>',
    rare:'<path d="M1 0v8" stroke="'+edge+'" opacity=".35"/>',
    epic:'<path d="M4 0l4 4-4 4-4-4Z" fill="none" stroke="'+edge+'" opacity=".4"/>',
    legendary:'<path d="M0 8L4 0l4 8Z" fill="'+edge+'" opacity=".32"/>',
    mythic:'<path d="M5 0L2 4l4 1-3 3" fill="none" stroke="'+edge+'"/>'
  };
  const fill='url(#material-'+key+')';
  const shapes={
    sword:`<path d="M29 43V14l3-8 3 8v29Z" fill="${fill}"/><path d="M22 44h20v4H22Z" fill="${edge}"/><path d="M29 48h6v10h-6Z" fill="${grip}"/><path d="M32 13v28" stroke="${edge}"/>`,
    spear:`<path d="M30 25h4v35h-4Z" fill="${grip}"/><path d="M32 3l7 14-7 9-7-9Z" fill="${fill}"/><path d="M32 7v16" stroke="${edge}"/>`,
    axe:`<path d="M30 15h5v43h-5Z" fill="${grip}"/><path d="M29 10c-6 0-13 4-15 14 5 4 12 5 17 1l5-5c5 5 11 5 15 2-2-8-7-12-15-12Z" fill="${fill}"/><path d="M15 23q5 3 13 0M39 22q5 1 10-1" stroke="${edge}"/>`,
    bow:`<path d="M23 7q34 24 0 50l-3-4q25-21 0-42Z" fill="${fill}"/><path d="M23 7v50M15 32h31l-5-4m5 4-5 4" stroke="${edge}" fill="none"/><path d="M30 25v13" stroke="${grip}" stroke-width="5"/>`,
    chest:`<path d="M21 10l11 6 11-6 12 11-9 8-3-4v29H21V25l-3 4-9-8Z" fill="${fill}"/><path d="M21 39h22v6H21Z" fill="${grip}"/><path d="M32 20v16M24 24l8 7 8-7" stroke="${edge}" fill="none"/>`,
    gloves:`<path d="M18 54V34l-5-12 4-3 7 8V11h5v17-20h5v20-18h5v20-14h5v24l-7 14Z" fill="${fill}"/><path d="M18 45h21v7H18Z" fill="${grip}"/><path d="M25 31h16" stroke="${edge}"/>`,
    boots:`<path d="M23 10h20v29l11 8v8H12V44l11-5Z" fill="${fill}"/><path d="M12 51h42v5H12ZM23 13h20v7H23Z" fill="${grip}"/><path d="M26 24h13m-13 6h13" stroke="${edge}"/>`,
    lootChest:`<path d="M10 27q0-15 22-15t22 15v25H10Z" fill="${fill}"/><path d="M10 30h44M18 16v36M46 16v36" stroke="${edge}" stroke-width="3"/><path d="M28 28h8v12h-8Z" fill="${grip}"/>`
  };
  const shape=shapes[kind]||`<path d="M32 8l18 24-18 24-18-24Z" fill="${fill}"/>`;
  const gem=['epic','legendary','mythic'].includes(rarity)?`<path d="M32 35l4 4-4 4-4-4Z" fill="${edge}"/>`:'';
  const svg=`<svg class="item-art" width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><pattern id="material-${key}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${body}"/>${patterns[rarity]}</pattern></defs><g stroke="${edge}" stroke-width="1" stroke-linejoin="round">${shape}${gem}</g></svg>`;
  cache.set(key,svg);return svg;
}
