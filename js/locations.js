export const LEVELS_PER_LOCATION=10;
export const BOSS_LEVEL=LEVELS_PER_LOCATION+1;
export const LOCATIONS=[
{id:1,name:"Подземелье",story:"Вы были рабом короля в шахтах. В шахте произошёл взрыв… Это ваш шанс отомстить.",description:"Серые каменные шахты: камень, факелы, руда, деревянные опоры и шахтные тоннели.",theme:"dungeon",mult:1.0,enemies:["skeleton","slime","miner"],boss:"giantSkeleton"},
{id:2,name:"Тюрьма",story:"Вы поднимаетесь вверх по длинной лестнице. Кажется, вы ближе к королю.",description:"Каменные стены, решётки, факелы, камеры, железные двери и лестницы.",theme:"prison",mult:1.28,enemies:["bandit","goblin","guard"],boss:"warden"},
{id:3,name:"Подвал",story:"Вы под палатами короля. Месть близко…",description:"Каменная кладка, колонны, красные ковры, бочки, стойки для брони и винный подвал.",theme:"cellar",mult:1.62,enemies:["royalGuard","palaceGuard","golem"],boss:"giantGolem"},
{id:4,name:"Дворец",story:"Время мести.",description:"Белый мрамор, золото, красные ковры, колонны и королевские залы.",theme:"palace",mult:2.05,enemies:["hound","eliteGuard","draugr"],boss:"king"},
{id:5,name:"Северная башня",story:"Кажется, на замок напал дракон… Нужно помочь людям.",description:"Каменные лестницы, ограды, окна, высокие коридоры, разрушенные стены, следы огня, дым, пепел и ветер.",theme:"tower",mult:2.48,enemies:["guard2","eliteGuard2","draugr2"],boss:"dragon"}
];
export const getLocation=id=>LOCATIONS.find(x=>x.id===id);
