'use strict';

const TILE = 48;
let MAP_W = 20, MAP_H = 15;
const PLAYER_SPD = 5;
const MAP_JSON_PATH = 'map.json';

const T_SOIL             = 0;
const T_GRASS            = 1;
const T_STONE            = 2;
const T_RUIN             = 3;
const T_BUSH             = 4;
const T_FENCE            = 5;
const T_PIT_OPEN         = 6;
const T_CHEST            = 7;
const T_STONE_RUB        = 8;
const T_JUNGLE           = 9;
const T_GRASS_PATCH      = 10;
const T_BURIED           = 11;
const T_RUBBLE           = 12;
const T_POTS             = 13;
const T_RUIN_WALL        = 14;
const T_STONE_WALL       = 15;
const T_STONE_WALL_GRASS = 16;
const T_SOIL_TOP         = 17;
const T_SOIL_LONG        = 18;
const T_SOIL_SMALL       = 19;
const T_SOIL_DARK        = 20;
const T_GRASS_TOP        = 21;
const T_GRASS_TILE       = 22;
const T_STONE_FLOOR      = 23;
const T_SOIL_BIG         = 24;

const MANUAL_CUT_ROOT = 'img/manual_cut';
const GENERATED_CUT_ROOT = 'img/cut';
const STRUCTURE_SPRITE_NAMES = [
  'SOIL_TOP', 'GRASS_TOP', 'RUIN_ARCH', 'RUIN_WALL', 'JUNGLE',
  'FENCE', 'STONE_WALL', 'STONE_WALL_GRASS', 'CHEST', 'SOIL_BIG',
  'PIT', 'BUSH', 'SOIL_LONG', 'STONE_FLOOR', 'GRASS_TILE',
  'BURIED', 'GRASS_PATCH', 'SOIL_SMALL', 'SOIL_DARK', 'RUBBLE', 'POTS',
];

const GROUND_VARIANTS = {
  [T_SOIL]:      ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG', 'SOIL_SMALL', 'SOIL_DARK'],
  [T_GRASS]:     ['GRASS_TILE', 'GRASS_TOP', 'GRASS_PATCH'],
  [T_STONE]:     ['STONE_FLOOR', 'STONE_WALL'],
  [T_RUIN]:      ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_BUSH]:      ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_FENCE]:     ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_PIT_OPEN]:  ['SOIL_DARK', 'SOIL_BIG'],
  [T_CHEST]:     ['SOIL_TOP', 'SOIL_BIG'],
  [T_STONE_RUB]: ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_JUNGLE]:    ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_GRASS_PATCH]: ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_BURIED]:    ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_RUBBLE]:    ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_POTS]:      ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_RUIN_WALL]: ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_STONE_WALL]: ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_STONE_WALL_GRASS]: ['SOIL_BIG', 'SOIL_TOP', 'SOIL_LONG'],
  [T_SOIL_TOP]:  ['SOIL_TOP'],
  [T_SOIL_LONG]: ['SOIL_LONG'],
  [T_SOIL_SMALL]: ['SOIL_SMALL'],
  [T_SOIL_DARK]: ['SOIL_DARK'],
  [T_GRASS_TOP]: ['GRASS_TOP'],
  [T_GRASS_TILE]: ['GRASS_TILE'],
  [T_STONE_FLOOR]: ['STONE_FLOOR'],
  [T_SOIL_BIG]: ['SOIL_BIG'],
};

const GROUND = {
  [T_SOIL]:      { base:'#8B5E1A', hi:'#A07228', lo:'#6B4510', dot:'#C08C3A' },
  [T_GRASS]:     { base:'#3D7A28', hi:'#4E9933', lo:'#2A5A18', dot:'#5BB840' },
  [T_STONE]:     { base:'#6A6A5A', hi:'#7A7A6A', lo:'#505044', dot:'#8A8A78' },
  [T_RUIN]:      { base:'#5A4A30', hi:'#6A5A3C', lo:'#3A2E1A', dot:'#7A6A4A' },
  [T_BUSH]:      { base:'#2A5A18', hi:'#3A7A24', lo:'#1A3E10', dot:'#4A9030' },
  [T_FENCE]:     { base:'#5C2E00', hi:'#703800', lo:'#3A1A00', dot:'#8B4A14' },
  [T_PIT_OPEN]:  { base:'#2A1A08', hi:'#3A2A10', lo:'#180E04', dot:'#4A3218' },
  [T_CHEST]:     { base:'#7A4800', hi:'#8B5A00', lo:'#5A3400', dot:'#C07800' },
  [T_STONE_RUB]: { base:'#5A5040', hi:'#6A6050', lo:'#3A3428', dot:'#7A7060' },
};

const TILE_DEFS = [
  {id:T_SOIL, key:'soil', label:'Soil', color:'#8B5E1A', walkable:true},
  {id:T_GRASS, key:'grass', label:'Grass', color:'#4A7C30', walkable:true},
  {id:T_STONE, key:'stone', label:'Stone', color:'#666666', walkable:true},
  {id:T_RUIN, key:'ruin_arch', label:'Ruin Arch', color:'#99856b', object:'RUIN_ARCH', width:2.2, baseY:1.72, walkable:false},
  {id:T_BUSH, key:'bush', label:'Bush', color:'#2A5A18', object:'BUSH', width:1.75, baseY:1.03, walkable:false},
  {id:T_FENCE, key:'fence', label:'Fence', color:'#5C3A1A', object:'FENCE', width:1.85, baseY:1.02, walkable:false},
  {id:T_PIT_OPEN, key:'pit', label:'Pit', color:'#2A1A08', object:'PIT', width:3.7, baseY:1.18, walkable:false},
  {id:T_CHEST, key:'chest', label:'Chest', color:'#FFD166', object:'CHEST', width:1.95, baseY:1.03, walkable:false},
  {id:T_STONE_RUB, key:'stone_wall_random', label:'Stone Wall Mix', color:'#70685a', object:'STONE_WALL', width:1.72, baseY:1.05, walkable:false},
  {id:T_JUNGLE, key:'jungle', label:'Jungle', color:'#1f6f1e', object:'JUNGLE', width:1.85, baseY:1.05, walkable:false},
  {id:T_GRASS_PATCH, key:'grass_patch', label:'Grass Patch', color:'#3e8c24', object:'GRASS_PATCH', width:1.85, baseY:1.04, walkable:false},
  {id:T_BURIED, key:'buried', label:'Buried Detail', color:'#A07228', object:'BURIED', width:1.55, baseY:1.03, walkable:true},
  {id:T_RUBBLE, key:'rubble', label:'Rubble', color:'#9a6d38', object:'RUBBLE', width:2.25, baseY:1.05, walkable:false},
  {id:T_POTS, key:'pots', label:'Pots', color:'#b66b22', object:'POTS', width:1.95, baseY:1.04, walkable:false},
  {id:T_RUIN_WALL, key:'ruin_wall', label:'Ruin Wall', color:'#8d7b62', object:'RUIN_WALL', width:2.35, baseY:1.08, walkable:false},
  {id:T_STONE_WALL, key:'stone_wall', label:'Stone Wall', color:'#746a5c', object:'STONE_WALL', width:1.95, baseY:1.05, walkable:false},
  {id:T_STONE_WALL_GRASS, key:'stone_wall_grass', label:'Stone Wall Grass', color:'#83715e', object:'STONE_WALL_GRASS', width:1.8, baseY:1.05, walkable:false},
  {id:T_SOIL_TOP, key:'soil_top', label:'Soil Top', color:'#9b691e', walkable:true},
  {id:T_SOIL_LONG, key:'soil_long', label:'Soil Long', color:'#a06f23', walkable:true},
  {id:T_SOIL_SMALL, key:'soil_small', label:'Soil Small', color:'#9a6720', walkable:true},
  {id:T_SOIL_DARK, key:'soil_dark', label:'Soil Dark', color:'#6d4218', walkable:true},
  {id:T_GRASS_TOP, key:'grass_top', label:'Grass Top', color:'#5aa332', walkable:true},
  {id:T_GRASS_TILE, key:'grass_tile', label:'Grass Tile', color:'#67b531', walkable:true},
  {id:T_STONE_FLOOR, key:'stone_floor', label:'Stone Floor', color:'#827a68', walkable:true},
  {id:T_SOIL_BIG, key:'soil_big', label:'Soil Big', color:'#9b6a22', walkable:true},
];
const TILE_DEFS_BY_ID = Object.fromEntries(TILE_DEFS.map(def=>[def.id,def]));
const TILE_IDS_BY_KEY = Object.fromEntries(TILE_DEFS.map(def=>[def.key,def.id]));

const QUESTIONS = [
  {era:'paleo',icon:'🪓',pts:100,
   q:'เครื่องมือหินยุคหินเก่าที่สำคัญที่สุดคืออะไร?',
   c:['Hand Axe / Chopper','ขวานหินขัด','เครื่องปั้นดินเผา','ลูกศรหิน'],a:0,
   ex:'ยุคหินเก่าใช้ Hand Axe / Chopper ทำจากหินกรวด เป็นเครื่องมืออเนกประสงค์'},
  {era:'paleo',icon:'🦣',pts:100,
   q:'มนุษย์ยุคหินเก่าดำรงชีวิตอย่างไร?',
   c:['เพาะปลูกข้าว','เลี้ยงสัตว์','เร่ร่อนล่าสัตว์และเก็บหาอาหาร','อยู่ในเมือง'],a:2,
   ex:'มนุษย์ยุคหินเก่าเป็น Nomads ล่าสัตว์และเก็บหาอาหารในป่า'},
  {era:'paleo',icon:'🦴',pts:100,
   q:'แหล่งโบราณคดียุคหินเก่าในไทยอยู่ที่ใด?',
   c:['เชียงใหม่','กระบี่','อยุธยา','ราชบุรี'],a:1,
   ex:'ถ้ำหลังโรงเรียน จ.กระบี่ พบ Hand Axe และกระดูกสัตว์โบราณ'},
  {era:'paleo',icon:'🌋',pts:150,
   q:'ยุคหินเก่าในไทยเริ่มต้นเมื่อกี่ปีมาแล้ว?',
   c:['5,000 ปี','50,000 ปี','100,000 ปี','500,000+ ปี'],a:3,
   ex:'ยุคหินเก่าในไทยมีช่วงประมาณ 500,000–10,000 ปีมาแล้ว'},
  {era:'meso',icon:'🏕️',pts:100,
   q:'วัฒนธรรมสำคัญยุคหินกลางในเอเชียตะวันออกเฉียงใต้คือ?',
   c:['วัฒนธรรมบ้านเชียง','วัฒนธรรมโฮบินเฮียน','วัฒนธรรมลุ่มโขง','วัฒนธรรมสุวรรณภูมิ'],a:1,
   ex:'Hoabinhian Culture เป็นวัฒนธรรมยุคหินกลางที่โดดเด่นในภูมิภาค'},
  {era:'meso',icon:'💀',pts:100,
   q:'ถ้ำไทรโยค จ.กาญจนบุรี พบอะไร?',
   c:['หม้อดินเผา','โครงกระดูกพร้อมเครื่องมือหิน','รูปเขียนสี','เมล็ดข้าว'],a:1,
   ex:'พบโครงกระดูกมนุษย์ยุคหินกลางพร้อมเครื่องมือหิน เป็นพิธีกรรมความตาย'},
  {era:'meso',icon:'🪨',pts:100,
   q:'เครื่องมือหินกลางต่างจากหินเก่าอย่างไร?',
   c:['ใหญ่กว่าและหนักกว่า','ทำสองด้าน (Bifacial) ประณีตขึ้น','ทำจากทองแดง','รูปสี่เหลี่ยม'],a:1,
   ex:'ยุคหินกลางมี Bifacial ทำให้คมและใช้งานดีกว่า'},
  {era:'meso',icon:'🌿',pts:150,
   q:'ยุคหินกลางมีช่วงเวลาประมาณใด?',
   c:['1,000,000–500,000 ปี','10,000–5,000 ปี','500–100 ปี','5,000–3,500 ปี'],a:1,
   ex:'ยุคหินกลางในไทยมีช่วงเวลาประมาณ 10,000–5,000 ปีมาแล้ว'},
  {era:'neo',icon:'🏺',pts:100,
   q:'Neolithic Revolution หมายถึงอะไร?',
   c:['การค้นพบไฟ','เปลี่ยนจากผู้ล่าเป็นผู้ผลิต','การสร้างพีระมิด','การประดิษฐ์ล้อ'],a:1,
   ex:'มนุษย์เปลี่ยนจาก "ผู้ล่า" เป็น "ผู้ผลิต" โดยเริ่มทำเกษตรกรรมและเลี้ยงสัตว์'},
  {era:'neo',icon:'⚒️',pts:100,
   q:'เครื่องมือสัญลักษณ์ยุคหินใหม่คืออะไร?',
   c:['Chopper','Hand Axe','ขวานหินขัด (Polished Stone Axe)','มีดสั้น'],a:2,
   ex:'ขวานหินขัด ผิวเรียบเนียน คมกว่ายุคก่อน เป็นสัญลักษณ์ยุคหินใหม่'},
  {era:'neo',icon:'🏘️',pts:100,
   q:'บ้านเก่า จ.กาญจนบุรี มีความสำคัญอย่างไร?',
   c:['แหล่งเกษตรกรรมแรก','พบขวานหินขัดจำนวนมาก','พบรูปเขียนในถ้ำ','เป็นราชธานีโบราณ'],a:1,
   ex:'บ้านเก่าเป็นแหล่งขุดค้นสำคัญพบขวานหินขัดและโครงกระดูกมนุษย์ยุคหินใหม่'},
  {era:'neo',icon:'🌾',pts:150,
   q:'บ้านเชียง จ.อุดรธานี มีความพิเศษอย่างไร?',
   c:['แหล่งตัดหินขนาดใหญ่','ระยะแรกก่อนพัฒนาสู่ยุคโลหะ','พบฟอสซิลไดโนเสาร์','ที่อยู่มนุษย์หินเก่า'],a:1,
   ex:'บ้านเชียงมีระยะแรกในยุคหินใหม่ ก่อนพัฒนาสู่ยุคสำริดและเหล็ก'},
];

const NPC_TASK_LINE =
  'ภารกิจของเธอคือค้นหาเครื่องมือโบราณที่ส่องแสงอยู่ในแหล่งขุดค้น แล้วกด E เพื่อเก็บและตอบคำถามให้ถูกต้อง เก็บให้ครบทุกชิ้นเพื่อเป็นนักโบราณคดีตัวจริง!';

const sprites = { structure:{}, tools:[], chars:{ boy:[], girl:[] }, oldman:[] };
const spriteMetrics = { chars:{ boy:{w:1,h:1}, girl:{w:1,h:1} }, oldman:{w:1,h:1} };

let score=0,lives=3,combo=0,maxCombo=0,xp=0,lv=1;
let answered=0,correct=0,day=1,artifactsFound=0;
let gameActive=false;

const player = {
  x:5,y:6, px:5*TILE,py:6*TILE,
  dir:2,frame:0,frameT:0,char:'boy',
  moving:false,targetX:5,targetY:6,
};

const keyDown={};
let interactFlag=false;
let interactPressed=false;
let joystickDir=null;

let mapTiles=[], tileRotations=[], digSites=[];
const NPC_POS   = {x:3,y:4};
const CHEST_POS = {x:17,y:2};
const PLAYER_START = {x:5,y:6};
let loadedMapConfig = null;
let mapLoadPromise = null;
let mapLoadError = '';
let mapLoadSource = '';

let canvas,ctx,rafId=null,lastTs=0;
let viewW=0, viewH=0, canvasDpr=1;

let tileNoise = [];

function assetFile(name){
  return name.toLowerCase()+'.png';
}

function charDir(charKey){
  return charKey.charAt(0).toUpperCase()+charKey.slice(1);
}

function buildAssetEntries(){
  const entries=[];
  STRUCTURE_SPRITE_NAMES.forEach(name=>{
    entries.push({
      srcs: [
        `${MANUAL_CUT_ROOT}/Structure/${assetFile(name)}`,
        `${GENERATED_CUT_ROOT}/structure/${assetFile(name)}`,
      ],
      set: img=>{ sprites.structure[name]=img; },
    });
  });
  for(let i=0;i<8;i++){
    entries.push({
      srcs: [
        `${MANUAL_CUT_ROOT}/Tools/tool_${i}.png`,
        `${GENERATED_CUT_ROOT}/tools/tool_${i}.png`,
      ],
      set: img=>{ sprites.tools[i]=img; },
    });
  }
  ['boy','girl'].forEach(charKey=>{
    for(let r=0;r<3;r++){
      sprites.chars[charKey][r]=[];
      for(let c=0;c<4;c++){
        entries.push({
          srcs: [
            `${MANUAL_CUT_ROOT}/${charDir(charKey)}/r${r}_${c}.png`,
            `${GENERATED_CUT_ROOT}/${charKey}/r${r}_${c}.png`,
          ],
          set: img=>{ sprites.chars[charKey][r][c]=img; },
        });
      }
    }
  });
  for(let i=0;i<2;i++){
    entries.push({
      srcs: [
        `${MANUAL_CUT_ROOT}/OldMan/${i}.png`,
        `${GENERATED_CUT_ROOT}/oldman/${i}.png`,
      ],
      set: img=>{ sprites.oldman[i]=img; },
    });
  }
  return entries;
}

function computeSpriteMetrics(){
  ['boy','girl'].forEach(charKey=>{
    let w=1,h=1;
    sprites.chars[charKey].forEach(row=>{
      row.forEach(frame=>{
        if(frame&&frame.naturalWidth){
          w=Math.max(w,frame.naturalWidth);
          h=Math.max(h,frame.naturalHeight);
        }
      });
    });
    spriteMetrics.chars[charKey]={w,h};
  });
  let oldW=1,oldH=1;
  sprites.oldman.forEach(frame=>{
    if(frame&&frame.naturalWidth){
      oldW=Math.max(oldW,frame.naturalWidth);
      oldH=Math.max(oldH,frame.naturalHeight);
    }
  });
  spriteMetrics.oldman={w:oldW,h:oldH};
}

function loadAssets(onDone){
  const entries=buildAssetEntries();
  let done=0;
  const bar=document.querySelector('.load-bar');
  const finishOne=()=>{
    done++;
    if(bar) bar.style.width=(done/entries.length*100)+'%';
    if(done===entries.length){
      computeSpriteMetrics();
      onDone();
    }
  };
  entries.forEach(entry=>{
    const img=new Image();
    let srcIdx=0;
    img.onload=finishOne;
    img.onerror=()=>{
      srcIdx++;
      if(srcIdx<entry.srcs.length){
        img.src=entry.srcs[srcIdx];
      } else {
        finishOne();
      }
    };
    entry.set(img);
    img.src=entry.srcs[srcIdx];
  });
}

async function loadMapConfig(){
  if(mapLoadPromise) return mapLoadPromise;
  mapLoadPromise=fetch(MAP_JSON_PATH,{cache:'no-store'})
    .then(response=>{
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data=>{
      mapLoadError='';
      mapLoadSource='map.json';
      return normalizeMapConfig(data);
    })
    .catch(error=>{
      const bundledMap = window.STONE_AGE_MAP_DATA;
      if(bundledMap){
        try {
          const config=normalizeMapConfig(bundledMap);
          mapLoadError='';
          mapLoadSource='map-data.js';
          console.warn(`Could not load ${MAP_JSON_PATH}; using bundled map-data.js instead.`, error);
          return config;
        } catch (bundleError) {
          console.warn('Bundled map-data.js is not valid.', bundleError);
        }
      }
      mapLoadError = `Could not load ${MAP_JSON_PATH}: ${error.message || error}`;
      mapLoadSource='random';
      console.warn(`${mapLoadError}; using random map fallback.`, error);
      return null;
    });
  return mapLoadPromise;
}

function normalizeMapConfig(data){
  if(!data||!Array.isArray(data.tiles)) throw new Error('map.json needs a tiles array');
  const height=Math.max(1,Number(data.height)||data.tiles.length);
  const width=Math.max(1,Number(data.width)||Math.max(...data.tiles.map(row=>Array.isArray(row)?row.length:0)));
  const tiles=[];
  const rotations=[];
  for(let y=0;y<height;y++){
    const sourceRow=Array.isArray(data.tiles[y]) ? data.tiles[y] : [];
    tiles[y]=[];
    rotations[y]=[];
    for(let x=0;x<width;x++){
      const cell=tileCellFromValue(sourceRow[x]);
      tiles[y][x]=cell.type;
      rotations[y][x]=cell.rot;
    }
  }
  return {
    width,
    height,
    tiles,
    rotations,
    npc: normalizePoint(data.npc, {x:3,y:4}, width, height),
    playerStart: normalizePoint(data.playerStart, {x:5,y:6}, width, height),
    digSites: normalizeDigSites(data.digSites, width, height),
  };
}

function normalizePoint(point, fallback, width, height){
  const x=Math.max(0,Math.min(width-1,Number(point?.x ?? fallback.x)|0));
  const y=Math.max(0,Math.min(height-1,Number(point?.y ?? fallback.y)|0));
  return {x,y};
}

function normalizeDigSites(sites, width, height){
  if(!Array.isArray(sites)) return null;
  return sites
    .map((site,index)=>({
      x:Math.max(0,Math.min(width-1,Number(site?.x)|0)),
      y:Math.max(0,Math.min(height-1,Number(site?.y)|0)),
      qIdx:Math.max(0,Number(site?.qIdx ?? index)|0)%QUESTIONS.length,
      found:false,
    }))
    .filter((site,index,self)=>self.findIndex(other=>other.x===site.x&&other.y===site.y)===index)
    .slice(0,QUESTIONS.length);
}

function tileCellFromValue(value){
  if(value&&typeof value==='object'&&!Array.isArray(value)){
    return {
      type: tileIdFromValue(value.key ?? value.tile ?? value.type),
      rot: normalizeRotation(value.rot ?? value.rotation ?? 0),
    };
  }
  return {type: tileIdFromValue(value), rot: 0};
}

function tileIdFromValue(value){
  if(Number.isInteger(value)&&TILE_DEFS_BY_ID[value]) return value;
  if(typeof value==='string'){
    const key=value.trim().toLowerCase();
    if(Object.prototype.hasOwnProperty.call(TILE_IDS_BY_KEY,key)) return TILE_IDS_BY_KEY[key];
  }
  return T_SOIL;
}

function normalizeRotation(rot){
  const value=Number(rot)||0;
  const quarterTurns=Math.abs(value)>3 ? Math.round(value/90) : Math.round(value);
  return ((quarterTurns%4)+4)%4;
}

function buildMap(){
  if(loadedMapConfig){
    applyMapConfig(loadedMapConfig);
    return;
  }
  buildRandomMap();
}

function applyMapConfig(config){
  MAP_W=config.width;
  MAP_H=config.height;
  mapTiles=config.tiles.map(row=>row.slice());
  tileRotations=config.rotations.map(row=>row.slice());
  NPC_POS.x=config.npc.x;
  NPC_POS.y=config.npc.y;
  PLAYER_START.x=config.playerStart.x;
  PLAYER_START.y=config.playerStart.y;
  const chest=findFirstTile(T_CHEST);
  if(chest){
    CHEST_POS.x=chest.x;
    CHEST_POS.y=chest.y;
  } else {
    CHEST_POS.x=-99;
    CHEST_POS.y=-99;
  }
  buildTileNoise();
  digSites=(config.digSites&&config.digSites.length)
    ? config.digSites.map(site=>({...site, found:false}))
    : createRandomDigSites();
}

function buildRandomMap(){
  MAP_W=20;
  MAP_H=15;
  mapTiles=[];
  tileRotations=[];
  for(let y=0;y<MAP_H;y++){
    mapTiles[y]=[];
    tileRotations[y]=[];
    for(let x=0;x<MAP_W;x++){
      tileRotations[y][x]=0;
      if(x===0||x===MAP_W-1||y===0||y===MAP_H-1){
        mapTiles[y][x]=T_FENCE; continue;
      }
      const r=Math.random();
      mapTiles[y][x]= r<.58 ? T_SOIL
                    : r<.72 ? T_GRASS
                    : r<.80 ? T_STONE
                    : r<.86 ? T_BUSH
                    : T_SOIL;
    }
  }
  NPC_POS.x=3; NPC_POS.y=4;
  CHEST_POS.x=17; CHEST_POS.y=2;
  PLAYER_START.x=5; PLAYER_START.y=6;
  mapTiles[NPC_POS.y][NPC_POS.x]     = T_SOIL;
  mapTiles[CHEST_POS.y][CHEST_POS.x] = T_CHEST;
  [[3,13],[4,13]].forEach(([y,x])=>{ mapTiles[y][x]=T_RUIN; });
  [[3,14],[4,14]].forEach(([y,x])=>{ mapTiles[y][x]=T_RUIN_WALL; });
  [[7,10],[7,11],[8,10]].forEach(([y,x])=>{ mapTiles[y][x]=T_STONE_RUB; });
  buildTileNoise();
  digSites=createRandomDigSites();
}

function buildTileNoise(){
  tileNoise=[];
  for(let y=0;y<MAP_H;y++){
    tileNoise[y]=[];
    for(let x=0;x<MAP_W;x++){
      tileNoise[y][x]=seededTileNoise(x,y,mapTiles[y]?.[x]??T_SOIL);
      if(!tileRotations[y]) tileRotations[y]=[];
      tileRotations[y][x]=normalizeRotation(tileRotations[y][x]);
    }
  }
}

function seededTileNoise(x,y,type){
  const n=Math.sin((x+1)*12.9898+(y+1)*78.233+(type+1)*37.719)*43758.5453;
  return n-Math.floor(n);
}

function findFirstTile(type){
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      if(mapTiles[y]?.[x]===type) return {x,y};
    }
  }
  return null;
}

function createRandomDigSites(){
  const shuffled=[...QUESTIONS].sort(()=>Math.random()-.5);
  const sites=[];
  for(let attempt=0;attempt<500&&sites.length<Math.min(12,QUESTIONS.length);attempt++){
    const x=1+Math.floor(Math.random()*Math.max(1,MAP_W-2));
    const y=1+Math.floor(Math.random()*Math.max(1,MAP_H-2));
    if(!walkableForDig(x,y)) continue;
    if(Math.abs(x-NPC_POS.x)<3  && Math.abs(y-NPC_POS.y)<3)  continue;
    if(Math.abs(x-CHEST_POS.x)<3&& Math.abs(y-CHEST_POS.y)<3) continue;
    if(sites.some(d=>Math.abs(d.x-x)<3&&Math.abs(d.y-y)<3)) continue;
    sites.push({x,y,qIdx:QUESTIONS.indexOf(shuffled[sites.length]),found:false});
  }
  return sites;
}

function walkableForDig(x,y){
  const type=mapTiles[y]?.[x];
  const def=TILE_DEFS_BY_ID[type];
  return !!def?.walkable;
}

function walkable(x,y){
  if(x<1||x>=MAP_W-1||y<1||y>=MAP_H-1) return false;
  const t=mapTiles[y][x];
  const def=TILE_DEFS_BY_ID[t];
  if(!def?.walkable) return false;
  if(x===NPC_POS.x&&y===NPC_POS.y) return false;
  return true;
}

function startLoop(){ gameActive=true; lastTs=performance.now(); rafId=requestAnimationFrame(loop); }
function stopLoop() { gameActive=false; if(rafId){cancelAnimationFrame(rafId);rafId=null;} }

function loop(ts){
  if(!gameActive) return;
  const dt=Math.min(ts-lastTs,60);
  lastTs=ts;
  update(dt);
  render();
  rafId=requestAnimationFrame(loop);
}

function update(dt){
  if(player.moving){
    player.frameT+=dt;
    if(player.frameT>100){player.frameT=0;player.frame=(player.frame+1)%4;}
    const spd=PLAYER_SPD*TILE*dt/1000;
    const tx=player.targetX*TILE, ty=player.targetY*TILE;
    const dx=tx-player.px, dy=ty-player.py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<=spd){
      player.px=tx;player.py=ty;
      player.x=player.targetX;player.y=player.targetY;
      player.moving=false;
    } else {
      player.px+=dx/dist*spd;
      player.py+=dy/dist*spd;
    }
    return;
  }

  let mx=0,my=0;
  if(joystickDir){mx=joystickDir.mx;my=joystickDir.my;}
  else if(keyDown['ArrowUp']   ||keyDown['w']||keyDown['W']) my=-1;
  else if(keyDown['ArrowDown'] ||keyDown['s']||keyDown['S']) my=1;
  else if(keyDown['ArrowLeft'] ||keyDown['a']||keyDown['A']) mx=-1;
  else if(keyDown['ArrowRight']||keyDown['d']||keyDown['D']) mx=1;

  if(mx||my){
    if(mx>0) player.dir=1; else if(mx<0) player.dir=3;
    else if(my<0) player.dir=0; else player.dir=2;
    const nx=player.x+mx, ny=player.y+my;
    if(walkable(nx,ny)){
      player.targetX=nx;player.targetY=ny;player.moving=true;
    }
  }

  const doE=interactFlag||interactPressed;
  interactFlag=false;
  interactPressed=false;
  if(document.getElementById('quiz-modal').style.display!=='none') return;

  if(doE){
    if(document.getElementById('dialog').style.display==='block'){
      document.getElementById('dialog').style.display='none'; return;
    }
    if(Math.abs(player.x-NPC_POS.x)<=1&&Math.abs(player.y-NPC_POS.y)<=1){
      openDialog('ผู้เฒ่าอาจารย์',NPC_TASK_LINE);
      return;
    }
    const site=digSites.find(d=>d.x===player.x&&d.y===player.y&&!d.found);
    if(site){openQuiz(site);return;}
    const done=digSites.find(d=>d.x===player.x&&d.y===player.y&&d.found);
    if(done) floatText('ขุดแล้ว!',player.px+TILE/2,player.py);
  }
}

function render(){
  if(!canvas) return;
  const W=viewW||window.innerWidth, H=viewH||window.innerHeight;
  const worldW=MAP_W*TILE, worldH=MAP_H*TILE;

  const camX=worldW<=W ? -(W-worldW)/2 : Math.max(0,Math.min(player.px-W/2+TILE/2, worldW-W));
  const camY=worldH<=H ? -(H-worldH)/2 : Math.max(0,Math.min(player.py-H/2+TILE/2, worldH-H));

  ctx.setTransform(canvasDpr,0,0,canvasDpr,0,0);
  ctx.clearRect(0,0,W,H);
  drawBackdrop(W,H);
  ctx.save();
  ctx.translate(-camX,-camY);
  drawWorldFrame(worldW,worldH);

  const left=Math.max(0,camX), right=Math.min(worldW,camX+W);
  const top=Math.max(0,camY), bottom=Math.min(worldH,camY+H);
  const sx=Math.max(0,Math.floor(left/TILE));
  const ex=Math.min(MAP_W,Math.ceil(right/TILE)+1);
  const sy=Math.max(0,Math.floor(top/TILE));
  const ey=Math.min(MAP_H,Math.ceil(bottom/TILE)+1);

  for(let y=sy;y<ey;y++)
    for(let x=sx;x<ex;x++)
      drawGround(mapTiles[y][x], x*TILE, y*TILE, tileNoise[y][x], tileRotations[y]?.[x]||0);

  for(let y=sy;y<ey;y++){
    for(let x=sx;x<ex;x++){
      const t=mapTiles[y][x];
      const sx2=x*TILE, sy2=y*TILE;
      drawMapObjectTile(t,x,y,sx2,sy2,tileRotations[y]?.[x]||0);
    }
  }

  const now=Date.now();
  digSites.forEach(d=>{
    if(d.found){
      drawGround(T_PIT_OPEN, d.x*TILE, d.y*TILE, 0, 0);
      drawObjectSprite('PIT', d.x*TILE+TILE/2, d.y*TILE+TILE*1.18, TILE*3.7, 0);
      return;
    }
    const cx2=d.x*TILE+TILE/2, cy2=d.y*TILE+TILE/2;
    const pulse=0.5+0.5*Math.sin(now*0.0028+d.x*1.7+d.y*0.9);
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=0.32+0.30*pulse;
    const g=ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,TILE*1.08);
    g.addColorStop(0,'#FFE080');
    g.addColorStop(0.34,'rgba(255,190,64,.62)');
    g.addColorStop(1,'rgba(255,190,64,0)');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(cx2,cy2,TILE*1.08,0,Math.PI*2);
    ctx.fill();
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=0.70+0.25*pulse;
    ctx.strokeStyle='#FFE080';
    ctx.lineWidth=2.5;
    ctx.beginPath();
    ctx.arc(cx2,cy2,TILE*(0.34+0.07*pulse),0,Math.PI*2);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    const tool=sprites.tools[(d.qIdx+d.x+d.y)%Math.max(1,sprites.tools.length)];
    const bob=Math.sin(now*0.004+d.x)*3;
    if(tool){
      const icon=30+8*pulse;
      ctx.globalAlpha=0.92;
      ctx.shadowColor='#FFE080';
      ctx.shadowBlur=12+10*pulse;
      ctx.drawImage(tool,cx2-icon/2,cy2-icon*.72+bob,icon,icon);
    } else {
      const sz=26+6*pulse|0;
      ctx.font=`${sz}px serif`;
      ctx.textAlign='center';
      ctx.textBaseline='middle';
      ctx.globalAlpha=0.9;
      ctx.shadowColor='#FFE080';
      ctx.shadowBlur=14;
      ctx.fillText('✨',cx2,cy2+bob);
    }
    ctx.restore();
  });

  drawShadow(NPC_POS.x*TILE+TILE/2,(NPC_POS.y+0.85)*TILE);
  drawOldMan(NPC_POS.x*TILE-TILE*0.2,(NPC_POS.y-0.7)*TILE,TILE*1.5);
  drawNameTag('ผู้เฒ่าอาจารย์',NPC_POS.x*TILE+TILE/2,(NPC_POS.y-1.08)*TILE);

  drawShadow(player.px+TILE/2,player.py+TILE*0.9);
  drawPlayer();

  ctx.restore();

  drawMinimap(W,H);
  drawMapLoadWarning(W,H);
}

function drawBackdrop(W,H){
  ctx.fillStyle='#120904';
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.globalAlpha=.20;
  ctx.fillStyle='#2b1608';
  for(let y=0;y<H;y+=32){
    ctx.fillRect(0,y,W,1);
  }
  for(let x=0;x<W;x+=36){
    ctx.fillRect(x,0,1,H);
  }
  ctx.globalAlpha=.10;
  ctx.fillStyle='#d18a31';
  for(let y=12;y<H;y+=96){
    for(let x=18;x<W;x+=144){
      ctx.fillRect(x,y,3,3);
    }
  }
  ctx.restore();
}

function drawWorldFrame(worldW,worldH){
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.30)';
  ctx.fillRect(-10,-10,worldW+20,worldH+20);
  ctx.strokeStyle='#8B5A1A';
  ctx.lineWidth=3;
  ctx.strokeRect(1.5,1.5,worldW-3,worldH-3);
  ctx.strokeStyle='rgba(255,209,102,.18)';
  ctx.lineWidth=1;
  ctx.strokeRect(7.5,7.5,worldW-15,worldH-15);
  ctx.restore();
}

function drawGround(type, sx, sy, noise, rot=0){
  const texture=getGroundTexture(type,noise);
  if(texture){
    drawSolidGroundBase(type,sx,sy);
    const overlap=2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx,sy,TILE,TILE);
    ctx.clip();
    drawRotatedImage(texture,sx-overlap,sy-overlap,TILE+overlap*2,TILE+overlap*2,rot);
    ctx.restore();
  } else {
    drawFallbackGround(type,sx,sy,noise);
  }

  ctx.strokeStyle='rgba(43,25,4,.18)';
  ctx.lineWidth=1;
  ctx.strokeRect(sx+0.5,sy+0.5,TILE-1,TILE-1);
}

function drawSolidGroundBase(type,sx,sy){
  ctx.fillStyle=groundBaseColor(type);
  ctx.fillRect(sx,sy,TILE,TILE);
}

function groundBaseColor(type){
  if(type===T_GRASS||type===T_GRASS_TOP||type===T_GRASS_TILE) return '#3D7A28';
  if(type===T_STONE||type===T_STONE_FLOOR) return '#6A6A5A';
  if(type===T_PIT_OPEN) return '#2A1A08';
  return '#8B5E1A';
}

function getGroundTexture(type,noise=0){
  const variants=GROUND_VARIANTS[type]||GROUND_VARIANTS[T_SOIL];
  const idx=Math.min(variants.length-1,Math.max(0,Math.floor((noise||0)*variants.length)));
  const img=sprites.structure[variants[idx]];
  return img&&img.naturalWidth ? img : null;
}

function drawImageContain(cx,img,dx,dy,dw,dh){
  const scale=Math.min(dw/img.width,dh/img.height);
  const w=img.width*scale, h=img.height*scale;
  cx.drawImage(img,dx+(dw-w)/2,dy+(dh-h)/2,w,h);
}

function drawFallbackGround(type,sx,sy,noise){
  drawFallbackGroundOnContext(ctx,fallbackGroundType(type),sx,sy,noise);
}

function fallbackGroundType(type){
  if(type===T_GRASS||type===T_GRASS_TOP||type===T_GRASS_TILE) return T_GRASS;
  if(type===T_STONE||type===T_STONE_FLOOR) return T_STONE;
  if(type===T_PIT_OPEN) return T_PIT_OPEN;
  return GROUND[type] ? type : T_SOIL;
}

function drawFallbackGroundOnContext(target,type,sx,sy,noise){
  const g = GROUND[type] || GROUND[T_SOIL];
  const T2=TILE;

  target.fillStyle = g.base;
  target.fillRect(sx,sy,T2,T2);

  target.fillStyle = g.hi;
  const n=noise;
  target.fillRect(sx+T2*0.1, sy+T2*(0.15+n*0.1), T2*0.35, 2);
  target.fillRect(sx+T2*0.5, sy+T2*(0.45+n*0.08), T2*0.28, 2);
  target.fillRect(sx+T2*0.2, sy+T2*(0.72+n*0.06), T2*0.4,  2);

  target.fillStyle = g.lo;
  target.fillRect(sx+T2*0.55, sy+T2*(0.25+n*0.12), T2*0.3, 2);
  target.fillRect(sx+T2*0.08, sy+T2*(0.58+n*0.09), T2*0.25, 2);

  target.fillStyle = g.dot;
  const dotCount = 4;
  for(let i=0;i<dotCount;i++){
    const dx=((n*137.5*(i+1))%1)*T2;
    const dy=((n*93.7*(i+2))%1)*T2;
    target.fillRect(sx+dx|0, sy+dy|0, 2, 2);
  }

  if(type===T_GRASS){
    target.fillStyle='#5EC440';
    for(let i=0;i<3;i++){
      const bx=sx+T2*(0.2+i*0.28+n*0.1)|0;
      const by=sy+T2*(0.3+n*0.3)|0;
      target.fillRect(bx,by,2,T2*0.25|0);
      target.fillRect(bx+1,by-2,1,T2*0.18|0);
    }
  }

  if(type===T_STONE||type===T_STONE_RUB){
    target.strokeStyle='rgba(0,0,0,0.3)';
    target.lineWidth=1;
    target.beginPath();
    target.moveTo(sx+T2*0.3,sy+T2*0.2);
    target.lineTo(sx+T2*0.6,sy+T2*0.55);
    target.lineTo(sx+T2*0.45,sy+T2*0.8);
    target.stroke();
  }
}

function drawRuinCluster(x,y,sx,sy){
  const hasLeft=mapTiles[y]?.[x-1]===T_RUIN;
  const hasTop=mapTiles[y-1]?.[x]===T_RUIN;
  if(hasLeft||hasTop) return;
  drawObjectSprite('RUIN_ARCH',sx+TILE,sy+TILE*1.82,TILE*2.35);
  drawObjectSprite('RUIN_WALL',sx+TILE*1.42,sy+TILE*2.05,TILE*2.35);
}

function drawMapObjectTile(type,x,y,sx,sy,rot=0){
  if(type===T_FENCE){
    drawFence(sx,sy,x,y,rot);
    return;
  }
  if(type===T_STONE_RUB){
    drawStoneRubble(x,y,sx,sy,rot);
    return;
  }
  const def=TILE_DEFS_BY_ID[type];
  if(!def?.object) return;
  drawObjectSprite(
    def.object,
    sx+TILE*(def.anchorX??0.5),
    sy+TILE*(def.baseY??1.05),
    TILE*(def.width??1.6),
    rot
  );
}

function drawStoneRubble(x,y,sx,sy,rot=0){
  const variant=(x+y)%2===0?'STONE_WALL_GRASS':'STONE_WALL';
  drawObjectSprite(variant,sx+TILE/2,sy+TILE*1.05,TILE*1.72,rot);
}

function drawStructSprite(name,sx,sy,dw,dh){
  const spr=sprites.structure[name];
  if(!spr||!spr.naturalWidth) return;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(spr,sx,sy,dw,dh);
  ctx.restore();
}

function drawObjectSprite(name,cx,baseY,width,rot=0){
  const spr=sprites.structure[name];
  if(!spr||!spr.naturalWidth) return;
  const height=width*(spr.naturalHeight/spr.naturalWidth);
  const x=cx-width/2;
  const y=baseY-height;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  drawRotatedImage(spr,x,y,width,height,rot);
  ctx.restore();
}

function drawRotatedImage(img,x,y,width,height,rot=0){
  const turns=normalizeRotation(rot);
  if(!turns){
    ctx.drawImage(img,x,y,width,height);
    return;
  }
  ctx.save();
  ctx.translate(x+width/2,y+height/2);
  ctx.rotate(turns*Math.PI/2);
  ctx.drawImage(img,-width/2,-height/2,width,height);
  ctx.restore();
}

function drawFence(sx,sy,x,y,rot=0){
  const top=y===0, bottom=y===MAP_H-1, left=x===0, right=x===MAP_W-1;
  if(!(top||bottom||left||right)){
    drawObjectSprite('FENCE',sx+TILE/2,sy+TILE*1.02,TILE*1.85,rot);
    return;
  }
  ctx.fillStyle='#3A1A00';
  ctx.fillRect(sx,sy,TILE,TILE);

  if(top||bottom){
    for(let i=0;i<4;i++){
      const py=sy+4+i*10;
      ctx.fillStyle=i%2===0?'#7A4010':'#5C2E00';
      ctx.fillRect(sx+1,py,TILE-2,7);
      ctx.fillStyle='#9B5518';
      ctx.fillRect(sx+1,py, TILE-2,1);
    }
  }

  if(left||right){
    for(let i=0;i<4;i++){
      const px=sx+4+i*10;
      ctx.fillStyle=i%2===0?'#7A4010':'#5C2E00';
      ctx.fillRect(px,sy+1,7,TILE-2);
      ctx.fillStyle='#9B5518';
      ctx.fillRect(px,sy+1,1,TILE-2);
    }
  }

  if((top||bottom)&&(left||right)){
    ctx.fillStyle='#8A4A16';
    ctx.fillRect(sx+8,sy+8,TILE-16,TILE-16);
    ctx.fillStyle='#3A1A00';
    ctx.fillRect(sx+16,sy+16,TILE-32,TILE-32);
  }

  ctx.fillStyle='#1f0d00';
  for(let i=0;i<2;i++){
    ctx.fillRect(sx+TILE*.25+i*TILE*.42|0,sy+TILE*.30|0,3,3);
    ctx.fillRect(sx+TILE*.25+i*TILE*.42|0,sy+TILE*.68|0,3,3);
  }
}

function drawShadow(cx,cy){
  ctx.save();
  ctx.globalAlpha=0.22;
  ctx.fillStyle='#000';
  ctx.beginPath();
  ctx.ellipse(cx,cy,TILE*0.38,TILE*0.12,0,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(){
  const row = player.dir===2?0 : player.dir===0?1 : 2;
  const col = player.frame%4;
  const frame=sprites.chars[player.char]?.[row]?.[col]||sprites.chars.boy?.[row]?.[col];
  if(!frame){
    ctx.fillStyle='#E76F51';
    ctx.fillRect(player.px,player.py,TILE,TILE);
    return;
  }
  const metrics=spriteMetrics.chars[player.char]||spriteMetrics.chars.boy;
  const boxH=TILE*1.24;
  const scale=boxH/Math.max(1,metrics.h);
  const boxW=metrics.w*scale;
  const drawW=frame.naturalWidth*scale;
  const drawH=frame.naturalHeight*scale;
  const dx=player.px+TILE/2-boxW/2+(boxW-drawW)/2;
  const dy=player.py+TILE-boxH+2+(boxH-drawH);
  ctx.save();
  if(player.dir===3){
    ctx.scale(-1,1);
    ctx.drawImage(frame,-(dx+drawW),dy,drawW,drawH);
  } else {
    ctx.drawImage(frame,dx,dy,drawW,drawH);
  }
  ctx.restore();
}

function drawOldMan(sx,sy,size){
  const f=Math.floor(Date.now()/700)%2;
  const frame=sprites.oldman[f];
  if(!frame){ctx.fillStyle='#4FC3F7';ctx.fillRect(sx,sy,size,size);return;}
  const metrics=spriteMetrics.oldman;
  const scale=size/Math.max(1,metrics.h);
  const boxW=metrics.w*scale;
  const drawW=frame.naturalWidth*scale;
  const drawH=frame.naturalHeight*scale;
  const dx=sx+size/2-boxW/2+(boxW-drawW)/2;
  const dy=sy+size-drawH;
  ctx.drawImage(frame,dx,dy,drawW,drawH);
}

function drawNameTag(text,cx,ty){
  ctx.font='bold 11px Kanit,sans-serif';
  const W=ctx.measureText(text).width+16;
  ctx.fillStyle='rgba(0,0,0,0.70)';
  ctx.fillRect(cx-W/2,ty,W,18);
  ctx.fillStyle='#FFD166';
  ctx.textAlign='center';
  ctx.textBaseline='top';
  ctx.fillText(text,cx,ty+3);
}

function drawMinimap(W,H){
  const mm=3, mx=W-MAP_W*mm-12, my=12;
  ctx.save();
  ctx.globalAlpha=0.80;
  ctx.fillStyle='rgba(10,5,0,0.75)';
  ctx.fillRect(mx-3,my-3,MAP_W*mm+6,MAP_H*mm+6);
  ctx.strokeStyle='#8B5A1A';
  ctx.lineWidth=1;
  ctx.strokeRect(mx-3,my-3,MAP_W*mm+6,MAP_H*mm+6);

  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const t=mapTiles[y][x];
      ctx.fillStyle = TILE_DEFS_BY_ID[t]?.color || '#7A5018';
      ctx.fillRect(mx+x*mm, my+y*mm, mm, mm);
    }
  }
  digSites.forEach(d=>{
    ctx.fillStyle=d.found?'#333':'#FFD166';
    ctx.fillRect(mx+d.x*mm,my+d.y*mm,mm,mm);
  });
  ctx.fillStyle='#4FC3F7';
  ctx.fillRect(mx+NPC_POS.x*mm,my+NPC_POS.y*mm,mm+1,mm+1);
  ctx.fillStyle='#FF5733';
  ctx.fillRect(mx+(player.px/TILE)*mm|0, my+(player.py/TILE)*mm|0, mm+1,mm+1);
  ctx.restore();
}

function drawMapLoadWarning(W,H){
  if(!mapLoadError) return;
  ctx.save();
  const text='map.json not loaded - random fallback map';
  ctx.font='bold 13px Kanit,sans-serif';
  const boxW=Math.min(W-24,ctx.measureText(text).width+24);
  const x=12;
  const y=Math.max(74,H-54);
  ctx.fillStyle='rgba(20,6,0,.88)';
  ctx.fillRect(x,y,boxW,34);
  ctx.strokeStyle='#c0392b';
  ctx.lineWidth=2;
  ctx.strokeRect(x+0.5,y+0.5,boxW-1,33);
  ctx.fillStyle='#ffb3b3';
  ctx.textAlign='left';
  ctx.textBaseline='middle';
  ctx.fillText(text,x+12,y+17);
  ctx.restore();
}

function openDialog(name,text){
  document.getElementById('dlg-name').textContent=name;
  document.getElementById('dlg-text').textContent=text;
  document.getElementById('dialog').style.display='block';
}

let quizSite=null, quizTimer=null, quizSec=15;
const ERA_NAMES={paleo:'ยุคหินเก่า',meso:'ยุคหินกลาง',neo:'ยุคหินใหม่'};

function openQuiz(site){
  quizSite=site;
  const q=QUESTIONS[site.qIdx];
  document.getElementById('qz-topbar').className='qz-topbar '+q.era;
  document.getElementById('qz-icon').textContent=q.icon;
  document.getElementById('qz-era').textContent=ERA_NAMES[q.era];
  const bonus=combo>0?` (x${1+Math.floor(combo*.5)})`:'';
  document.getElementById('qz-pts').textContent='+'+q.pts+bonus;
  document.getElementById('qz-question').textContent=q.q;
  document.getElementById('qz-feedback').style.display='none';
  document.getElementById('qz-next').style.display='none';
  const labels=['ก.','ข.','ค.','ง.'];
  const cf=document.getElementById('qz-choices');
  cf.innerHTML='';
  q.c.forEach((ch,i)=>{
    const b=document.createElement('button');
    b.className='qz-choice';
    b.textContent=labels[i]+' '+ch;
    b.addEventListener('click',()=>answerQuiz(i,b));
    cf.appendChild(b);
  });
  quizSec=15;
  document.getElementById('qz-tfill').style.width='100%';
  clearInterval(quizTimer);
  quizTimer=setInterval(()=>{
    quizSec-=0.1;
    const pct=Math.max(0,quizSec/15*100);
    const fill=document.getElementById('qz-tfill');
    fill.style.width=pct+'%';
    fill.style.background=pct>50?'#FFD166':pct>25?'#E76F51':'#C0392B';
    if(quizSec<=0){clearInterval(quizTimer);quizTimeout();}
  },100);
  document.getElementById('quiz-modal').style.display='flex';
}

function answerQuiz(chosen,btn){
  clearInterval(quizTimer);
  document.querySelectorAll('.qz-choice').forEach(b=>b.disabled=true);
  const q=QUESTIONS[quizSite.qIdx];
  answered++;
  const fb=document.getElementById('qz-feedback');
  if(chosen===q.a){
    btn.classList.add('correct');
    combo++;maxCombo=Math.max(maxCombo,combo);
    const pts=Math.floor(q.pts*(1+combo*.5));
    score+=pts;xp+=pts;correct++;
    quizSite.found=true;artifactsFound++;
    fb.textContent='✅ ถูกต้อง! +'+pts+' คะแนน — '+q.ex;
    fb.className='qz-feedback correct';
    if(combo>1) floatText(combo+'x COMBO! 🔥',window.innerWidth/2,window.innerHeight*.45);
    checkLevelUp();
  } else {
    document.querySelectorAll('.qz-choice')[q.a].classList.add('correct');
    btn.classList.add('wrong');
    combo=0;lives=Math.max(0,lives-1);
    quizSite.found=true;artifactsFound++;
    fb.textContent='❌ ผิด! '+q.ex;
    fb.className='qz-feedback wrong';
  }
  fb.style.display='block';
  document.getElementById('qz-next').style.display='block';
  if(lives===0) document.getElementById('qz-next').textContent='ดูผลคะแนน ⭐';
  updateHUD();
}

function quizTimeout(){
  document.querySelectorAll('.qz-choice').forEach(b=>b.disabled=true);
  const q=QUESTIONS[quizSite.qIdx];
  document.querySelectorAll('.qz-choice')[q.a].classList.add('correct');
  combo=0;lives=Math.max(0,lives-1);
  quizSite.found=true;artifactsFound++;answered++;
  const fb=document.getElementById('qz-feedback');
  fb.textContent='⏰ หมดเวลา! '+q.ex;
  fb.className='qz-feedback wrong';
  fb.style.display='block';
  document.getElementById('qz-next').style.display='block';
  updateHUD();
}

function quizNext(){
  clearInterval(quizTimer);
  document.getElementById('quiz-modal').style.display='none';
  day=Math.floor(artifactsFound/3)+1;
  updateHUD();
  if(lives===0||artifactsFound>=digSites.length) endGame();
}

function updateHUD(){
  document.getElementById('hud-hearts').textContent='❤️'.repeat(lives)+'🖤'.repeat(Math.max(0,3-lives));
  document.getElementById('hud-score').textContent='⭐ '+score;
  document.getElementById('hud-lv-num').textContent=lv;
  document.getElementById('hud-day').textContent='วันที่ '+day;
  document.getElementById('hud-art').textContent='โบราณวัตถุ '+artifactsFound+'/'+digSites.length;
  document.getElementById('xp-bar').style.width=Math.min(100,xp%500/5)+'%';
  const cd=document.getElementById('hud-combo');
  if(combo>1){cd.style.display='block';document.getElementById('combo-n').textContent=combo;}
  else cd.style.display='none';
}

function checkLevelUp(){
  if(xp>=lv*500){lv++;floatText('LEVEL UP! LV'+lv+' 🌟',window.innerWidth/2,window.innerHeight*.35);}
}

function floatText(txt,x,y){
  const el=document.createElement('div');
  el.className='combo-float';
  el.textContent=txt;
  el.style.left=x+'px';
  el.style.top=y+'px';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),1200);
}

function endGame(){
  stopLoop();
  const best=Math.max(score,parseInt(localStorage.getItem('sa_best')||'0'));
  localStorage.setItem('sa_best',best);
  const pct=answered>0?correct/answered:0;
  const d=pct>=.9?{t:'🥇',h:'อัจฉริยะยุคหิน!',s:'คะแนนสมบูรณ์แบบ!'}
          :pct>=.7?{t:'🏆',h:'นักขุดค้นมืออาชีพ!',s:'ยอดเยี่ยม!'}
          :pct>=.5?{t:'🎖️',h:'นักโบราณคดีฝึกหัด',s:'ต้องศึกษาเพิ่มอีกนิด'}
          :        {t:'🪨',h:'ยังต้องฝึกอีกนะ!',s:'ลองขุดใหม่อีกครั้ง'};
  document.getElementById('r-trophy').textContent=d.t;
  document.getElementById('r-title').textContent=d.h;
  document.getElementById('r-sub').textContent=d.s;
  document.getElementById('r-score').textContent=score;
  document.getElementById('r-correct').textContent=correct+'/'+answered;
  document.getElementById('r-combo').textContent=maxCombo+'x';
  document.getElementById('r-lv').textContent=lv;
  document.getElementById('r-best').textContent=best;
  showScreen('s-result');
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function startNewGame(charChoice){
  score=0;lives=3;combo=0;maxCombo=0;xp=0;lv=1;
  answered=0;correct=0;day=1;artifactsFound=0;
  loadedMapConfig=await loadMapConfig();
  buildMap();
  player.char=charChoice;
  player.x=PLAYER_START.x;player.y=PLAYER_START.y;
  player.px=PLAYER_START.x*TILE;player.py=PLAYER_START.y*TILE;
  player.dir=2;player.frame=0;player.moving=false;
  player.targetX=PLAYER_START.x;player.targetY=PLAYER_START.y;
  for(const k in keyDown) keyDown[k]=false;
  interactFlag=false;
  interactPressed=false;
  joystickDir=null;
  document.getElementById('dialog').style.display='none';
  updateHUD();

  canvas=document.getElementById('gameCanvas');
  ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  resizeCanvas();
  window.addEventListener('resize',resizeCanvas);

  const mobile=('ontouchstart' in window)||(navigator.maxTouchPoints>0);
  document.getElementById('mobile-controls').style.display=mobile?'flex':'none';

  showScreen('s-game');
  startLoop();
}

function resizeCanvas(){
  if(!canvas) return;
  viewW=window.innerWidth;
  viewH=window.innerHeight;
  canvasDpr=Math.max(1,Math.min(2,window.devicePixelRatio||1));
  canvas.width=Math.round(viewW*canvasDpr);
  canvas.height=Math.round(viewH*canvasDpr);
  canvas.style.width=viewW+'px';
  canvas.style.height=viewH+'px';
  if(ctx){
    ctx.imageSmoothingEnabled=false;
    ctx.setTransform(canvasDpr,0,0,canvasDpr,0,0);
  }
}

window.addEventListener('keydown',e=>{
  if((e.key==='e'||e.key==='E'||e.key===' ')&&!e.repeat) interactPressed=true;
  keyDown[e.key]=true;
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup',e=>{keyDown[e.key]=false;});
window.addEventListener('selectstart',e=>e.preventDefault());
window.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('contextmenu',e=>e.preventDefault());

function bindMoveStick(){
  const stick=document.getElementById('move-stick');
  const thumb=document.getElementById('move-stick-thumb');
  if(!stick||!thumb) return;
  let activeId=null;
  const radius=42;
  const dead=14;
  const reset=()=>{
    activeId=null;
    joystickDir=null;
    stick.classList.remove('active');
    thumb.style.transform='translate(-50%,-50%)';
  };
  const apply=(x,y)=>{
    const rect=stick.getBoundingClientRect();
    const cx=rect.left+rect.width/2;
    const cy=rect.top+rect.height/2;
    const dx=x-cx;
    const dy=y-cy;
    const dist=Math.hypot(dx,dy);
    const clamped=Math.min(radius,dist);
    const ux=dist?dx/dist:0;
    const uy=dist?dy/dist:0;
    thumb.style.transform=`translate(calc(-50% + ${ux*clamped}px), calc(-50% + ${uy*clamped}px))`;
    if(dist<dead){joystickDir=null;return;}
    if(Math.abs(dx)>Math.abs(dy)) joystickDir={mx:dx>0?1:-1,my:0};
    else joystickDir={mx:0,my:dy>0?1:-1};
  };
  stick.addEventListener('pointerdown',e=>{
    activeId=e.pointerId;
    stick.setPointerCapture(e.pointerId);
    stick.classList.add('active');
    apply(e.clientX,e.clientY);
    e.preventDefault();
  });
  stick.addEventListener('pointermove',e=>{
    if(e.pointerId!==activeId) return;
    apply(e.clientX,e.clientY);
    e.preventDefault();
  });
  stick.addEventListener('pointerup',e=>{if(e.pointerId===activeId) reset();});
  stick.addEventListener('pointercancel',e=>{if(e.pointerId===activeId) reset();});
  stick.addEventListener('lostpointercapture',reset);
}

let selectedChar='boy';
window.addEventListener('DOMContentLoaded',()=>{
  const loading=document.createElement('div');
  loading.id='loading';
  loading.innerHTML=`<div class="load-icon">⛏️</div><div class="load-text">กำลังโหลด...</div><div class="load-bar-wrap"><div class="load-bar"></div></div>`;
  document.body.appendChild(loading);

  loadAssets(()=>{
    loading.classList.add('hidden');
    renderPreviews();
  });

  document.getElementById('btn-start').addEventListener('click',()=>showScreen('s-charsel'));
  document.getElementById('btn-back-title').addEventListener('click',()=>showScreen('s-title'));
  document.getElementById('btn-confirm-char').addEventListener('click',()=>startNewGame(selectedChar));
  document.getElementById('btn-replay').addEventListener('click',()=>startNewGame(selectedChar));
  document.getElementById('btn-result-home').addEventListener('click',()=>showScreen('s-title'));
  document.getElementById('qz-next').addEventListener('click',quizNext);

  document.querySelectorAll('.char-card').forEach(card=>{
    card.addEventListener('click',()=>{
      selectedChar=card.dataset.char;
      document.querySelectorAll('.char-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
    });
  });

  bindMoveStick();
  const ab=document.getElementById('btn-action');
  if(ab) ab.addEventListener('pointerdown',e=>{interactFlag=true;e.preventDefault();});
});

function renderPreviews(){
  ['boy','girl'].forEach(k=>{
    const cv=document.getElementById('prev-'+k);
    if(!cv) return;
    const cx=cv.getContext('2d');
    cx.imageSmoothingEnabled=false;
    cx.clearRect(0,0,80,80);
    const frame=sprites.chars[k]?.[0]?.[0];
    if(!frame) return;
    drawImageContain(cx,frame,0,0,80,80);
  });
}
