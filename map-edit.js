'use strict';

const TILE = 48;
const DEFAULT_W = 20;
const DEFAULT_H = 15;
const MAP_FILE = 'map.json';
const MANUAL_CUT_ROOT = 'img/manual_cut';
const GENERATED_CUT_ROOT = 'img/cut';

const STRUCTURE_SPRITE_NAMES = [
  'SOIL_TOP', 'GRASS_TOP', 'RUIN_ARCH', 'RUIN_WALL', 'JUNGLE',
  'FENCE', 'STONE_WALL', 'STONE_WALL_GRASS', 'CHEST', 'SOIL_BIG',
  'PIT', 'BUSH', 'SOIL_LONG', 'STONE_FLOOR', 'GRASS_TILE',
  'BURIED', 'GRASS_PATCH', 'SOIL_SMALL', 'SOIL_DARK', 'RUBBLE', 'POTS',
];

const TILE_TYPES = [
  {key:'soil', label:'Soil', color:'#8B5E1A', ground:['SOIL_BIG','SOIL_TOP','SOIL_LONG','SOIL_SMALL','SOIL_DARK'], walkable:true},
  {key:'grass', label:'Grass', color:'#4A7C30', ground:['GRASS_TILE','GRASS_TOP','GRASS_PATCH'], walkable:true},
  {key:'stone', label:'Stone', color:'#666666', ground:['STONE_FLOOR','STONE_WALL'], walkable:true},
  {key:'ruin_arch', label:'Ruin Arch', color:'#99856b', base:'SOIL_BIG', object:'RUIN_ARCH', width:2.2, baseY:1.72, walkable:false},
  {key:'bush', label:'Bush', color:'#2A5A18', base:'SOIL_BIG', object:'BUSH', width:1.75, baseY:1.03, walkable:false},
  {key:'fence', label:'Fence', color:'#5C3A1A', base:'SOIL_BIG', object:'FENCE', width:1.85, baseY:1.02, walkable:false},
  {key:'pit', label:'Pit', color:'#2A1A08', base:'SOIL_DARK', object:'PIT', width:3.7, baseY:1.18, walkable:false},
  {key:'chest', label:'Chest', color:'#FFD166', base:'SOIL_TOP', object:'CHEST', width:1.95, baseY:1.03, walkable:false},
  {key:'stone_wall_random', label:'Stone Mix', color:'#70685a', base:'SOIL_BIG', object:'STONE_WALL', altObject:'STONE_WALL_GRASS', width:1.72, baseY:1.05, walkable:false},
  {key:'jungle', label:'Jungle', color:'#1f6f1e', base:'SOIL_BIG', object:'JUNGLE', width:1.85, baseY:1.05, walkable:false},
  {key:'grass_patch', label:'Grass Patch', color:'#3e8c24', base:'SOIL_BIG', object:'GRASS_PATCH', width:1.85, baseY:1.04, walkable:false},
  {key:'buried', label:'Buried', color:'#A07228', base:'SOIL_BIG', object:'BURIED', width:1.55, baseY:1.03, walkable:true},
  {key:'rubble', label:'Rubble', color:'#9a6d38', base:'SOIL_BIG', object:'RUBBLE', width:2.25, baseY:1.05, walkable:false},
  {key:'pots', label:'Pots', color:'#b66b22', base:'SOIL_BIG', object:'POTS', width:1.95, baseY:1.04, walkable:false},
  {key:'ruin_wall', label:'Ruin Wall', color:'#8d7b62', base:'SOIL_BIG', object:'RUIN_WALL', width:2.35, baseY:1.08, walkable:false},
  {key:'stone_wall', label:'Stone Wall', color:'#746a5c', base:'SOIL_BIG', object:'STONE_WALL', width:1.95, baseY:1.05, walkable:false},
  {key:'stone_wall_grass', label:'Wall Grass', color:'#83715e', base:'SOIL_BIG', object:'STONE_WALL_GRASS', width:1.8, baseY:1.05, walkable:false},
  {key:'soil_big', label:'Soil Big', color:'#9b6a22', ground:['SOIL_BIG'], walkable:true},
  {key:'soil_top', label:'Soil Top', color:'#9b691e', ground:['SOIL_TOP'], walkable:true},
  {key:'soil_long', label:'Soil Long', color:'#a06f23', ground:['SOIL_LONG'], walkable:true},
  {key:'soil_small', label:'Soil Small', color:'#9a6720', ground:['SOIL_SMALL'], walkable:true},
  {key:'soil_dark', label:'Soil Dark', color:'#6d4218', ground:['SOIL_DARK'], walkable:true},
  {key:'grass_top', label:'Grass Top', color:'#5aa332', ground:['GRASS_TOP'], walkable:true},
  {key:'grass_tile', label:'Grass Tile', color:'#67b531', ground:['GRASS_TILE'], walkable:true},
  {key:'stone_floor', label:'Stone Floor', color:'#827a68', ground:['STONE_FLOOR'], walkable:true},
];

const TILE_BY_KEY = Object.fromEntries(TILE_TYPES.map(type => [type.key, type]));

const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const ui = {
  palette: document.getElementById('palette'),
  status: document.getElementById('status'),
  stats: document.getElementById('stats'),
  file: document.getElementById('map-name'),
};

const sprites = { structure:{}, oldman:null, player:null };
const state = {
  width: DEFAULT_W,
  height: DEFAULT_H,
  tiles: [],
  digSites: [],
  npc: {x:3,y:4},
  playerStart: {x:5,y:6},
  selectedKey: 'soil_big',
  rotation: 0,
  tool: 'tile',
  hover: null,
  pointerDown: false,
  dragSnapshotTaken: false,
  undoStack: [],
};

function assetFile(name){
  return name.toLowerCase()+'.png';
}

function setStatus(text, kind=''){
  ui.status.className = kind;
  ui.status.textContent = text;
}

function loadImage(srcs){
  return new Promise(resolve=>{
    const img = new Image();
    let index = 0;
    img.onload = () => resolve(img);
    img.onerror = () => {
      index++;
      if(index < srcs.length) img.src = srcs[index];
      else resolve(null);
    };
    img.src = srcs[index];
  });
}

async function loadAssets(){
  await Promise.all(STRUCTURE_SPRITE_NAMES.map(async name=>{
    sprites.structure[name] = await loadImage([
      `${MANUAL_CUT_ROOT}/Structure/${assetFile(name)}`,
      `${GENERATED_CUT_ROOT}/structure/${assetFile(name)}`,
    ]);
  }));
  sprites.oldman = await loadImage([
    `${MANUAL_CUT_ROOT}/OldMan/0.png`,
    `${GENERATED_CUT_ROOT}/oldman/0.png`,
  ]);
  sprites.player = await loadImage([
    `${MANUAL_CUT_ROOT}/Boy/r0_0.png`,
    `${GENERATED_CUT_ROOT}/boy/r0_0.png`,
  ]);
}

async function loadMap(){
  try {
    const response = await fetch(MAP_FILE, {cache:'no-store'});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    normalizeMap(await response.json());
    state.undoStack = [];
    syncUndoButtons();
    setStatus('Loaded map.json', 'good');
  } catch (error) {
    fillDefaultMap();
    state.undoStack = [];
    syncUndoButtons();
    setStatus(`Could not load map.json, started a new map. ${error.message}`, 'bad');
  }
}

function normalizeMap(data){
  const width = Math.max(1, Number(data.width) || DEFAULT_W);
  const height = Math.max(1, Number(data.height) || DEFAULT_H);
  state.width = width;
  state.height = height;
  state.tiles = [];
  for(let y=0;y<height;y++){
    const row = Array.isArray(data.tiles?.[y]) ? data.tiles[y] : [];
    state.tiles[y] = [];
    for(let x=0;x<width;x++){
      state.tiles[y][x] = normalizeTileCell(row[x]);
    }
  }
  state.npc = normalizePoint(data.npc, {x:3,y:4});
  state.playerStart = normalizePoint(data.playerStart, {x:5,y:6});
  state.digSites = Array.isArray(data.digSites)
    ? data.digSites.map((site,index)=>({
      x: clamp(Number(site.x)|0, 0, width-1),
      y: clamp(Number(site.y)|0, 0, height-1),
      qIdx: Math.max(0, Number(site.qIdx ?? index)|0),
    })).filter(uniqueSite)
    : [];
}

function normalizeTileKey(value){
  if(typeof value === 'string' && TILE_BY_KEY[value]) return value;
  if(Number.isInteger(value) && TILE_TYPES[value]) return TILE_TYPES[value].key;
  return 'soil_big';
}

function normalizeTileCell(value){
  if(value && typeof value === 'object' && !Array.isArray(value)){
    return makeCell(normalizeTileKey(value.key ?? value.tile ?? value.type), value.rot ?? value.rotation ?? 0);
  }
  return makeCell(normalizeTileKey(value), 0);
}

function makeCell(key, rot=0){
  return {key: normalizeTileKey(key), rot: normalizeRotation(rot)};
}

function normalizeRotation(rot){
  const value = Number(rot) || 0;
  const quarterTurns = Math.abs(value) > 3 ? Math.round(value / 90) : Math.round(value);
  return ((quarterTurns % 4) + 4) % 4;
}

function cellKey(cell){
  return typeof cell === 'string' ? normalizeTileKey(cell) : normalizeTileKey(cell?.key);
}

function cellRot(cell){
  return typeof cell === 'object' ? normalizeRotation(cell?.rot ?? 0) : 0;
}

function cellsEqual(a,b){
  return cellKey(a) === cellKey(b) && cellRot(a) === cellRot(b);
}

function cloneTiles(tiles=state.tiles){
  return tiles.map(row => row.map(cell => makeCell(cellKey(cell), cellRot(cell))));
}

function snapshotState(){
  return {
    width: state.width,
    height: state.height,
    tiles: cloneTiles(),
    digSites: state.digSites.map(site => ({...site})),
    npc: {...state.npc},
    playerStart: {...state.playerStart},
  };
}

function restoreSnapshot(snapshot){
  state.width = snapshot.width;
  state.height = snapshot.height;
  state.tiles = cloneTiles(snapshot.tiles);
  state.digSites = snapshot.digSites.map(site => ({...site}));
  state.npc = {...snapshot.npc};
  state.playerStart = {...snapshot.playerStart};
  render();
}

function pushUndo(){
  state.undoStack.push(snapshotState());
  if(state.undoStack.length > 80) state.undoStack.shift();
  syncUndoButtons();
}

function undo(){
  const snapshot = state.undoStack.pop();
  if(!snapshot){
    setStatus('Nothing to undo.');
    syncUndoButtons();
    return;
  }
  restoreSnapshot(snapshot);
  syncUndoButtons();
  setStatus('Undo complete.', 'good');
}

function normalizePoint(point, fallback){
  return {
    x: clamp(Number(point?.x ?? fallback.x)|0, 0, state.width-1),
    y: clamp(Number(point?.y ?? fallback.y)|0, 0, state.height-1),
  };
}

function uniqueSite(site,index,self){
  return self.findIndex(other => other.x === site.x && other.y === site.y) === index;
}

function fillDefaultMap(){
  state.width = DEFAULT_W;
  state.height = DEFAULT_H;
  state.tiles = Array.from({length:state.height}, (_,y) =>
    Array.from({length:state.width}, (_,x) =>
      makeCell(x===0||y===0||x===state.width-1||y===state.height-1 ? 'fence' : 'soil_big')
    )
  );
  state.npc = {x:3,y:4};
  state.playerStart = {x:5,y:6};
  state.digSites = [];
}

function randomizeMap(){
  const weighted = [
    ['soil_big',34], ['soil_top',12], ['soil_long',10], ['soil_small',9],
    ['grass_tile',8], ['grass_top',5], ['stone_floor',4], ['bush',4],
    ['jungle',3], ['grass_patch',3], ['stone_wall',2], ['buried',2],
  ];
  state.tiles = Array.from({length:state.height}, (_,y) =>
    Array.from({length:state.width}, (_,x) => {
      if(x===0||y===0||x===state.width-1||y===state.height-1) return makeCell('fence');
      return makeCell(pickWeighted(weighted), randomObjectRotation());
    })
  );
  state.tiles[2][state.width-3] = makeCell('chest');
  state.tiles[3][state.width-7] = makeCell('ruin_arch');
  state.tiles[4][state.width-7] = makeCell('ruin_wall', 2);
  state.tiles[7][Math.floor(state.width/2)] = makeCell('rubble');
  state.tiles[8][Math.floor(state.width/2)] = makeCell('stone_wall_grass', 2);
  state.npc = {x:3,y:4};
  state.playerStart = {x:5,y:6};
  placeGeneratedDigSites();
  render();
  setStatus('Generated a new map layout.', 'good');
}

function randomObjectRotation(){
  return Math.random() < 0.25 ? Math.floor(Math.random()*4) : 0;
}

function pickWeighted(items){
  const total = items.reduce((sum,item)=>sum+item[1],0);
  let roll = Math.random()*total;
  for(const [key,weight] of items){
    roll -= weight;
    if(roll <= 0) return key;
  }
  return items[0][0];
}

function placeGeneratedDigSites(){
  state.digSites = [];
  for(let attempt=0;attempt<600 && state.digSites.length<12;attempt++){
    const x = 1 + Math.floor(Math.random()*(state.width-2));
    const y = 1 + Math.floor(Math.random()*(state.height-2));
    if(!isWalkableTile(x,y)) continue;
    if(Math.abs(x-state.npc.x)<3 && Math.abs(y-state.npc.y)<3) continue;
    if(Math.abs(x-state.playerStart.x)<2 && Math.abs(y-state.playerStart.y)<2) continue;
    if(state.digSites.some(site => Math.abs(site.x-x)<3 && Math.abs(site.y-y)<3)) continue;
    state.digSites.push({x,y,qIdx:state.digSites.length});
  }
}

function isWalkableTile(x,y){
  return !!TILE_BY_KEY[cellKey(state.tiles[y]?.[x])]?.walkable;
}

function clamp(value,min,max){
  return Math.max(min, Math.min(max, value));
}

function seedNoise(x,y,key){
  const typeIndex = TILE_TYPES.findIndex(type => type.key === key);
  const n = Math.sin((x+1)*12.9898 + (y+1)*78.233 + (typeIndex+1)*37.719) * 43758.5453;
  return n - Math.floor(n);
}

function draw(){
  canvas.width = state.width * TILE;
  canvas.height = state.height * TILE;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let y=0;y<state.height;y++){
    for(let x=0;x<state.width;x++){
      drawGroundTile(state.tiles[y][x], x, y);
    }
  }
  for(let y=0;y<state.height;y++){
    for(let x=0;x<state.width;x++){
      drawObjectTile(state.tiles[y][x], x, y);
    }
  }
  drawMarkers();
  drawGrid();
  updateStats();
}

function drawGroundTile(cell,x,y){
  const key = cellKey(cell);
  const rot = cellRot(cell);
  const def = TILE_BY_KEY[key] || TILE_BY_KEY.soil_big;
  const sx = x*TILE;
  const sy = y*TILE;
  const groundName = getGroundName(def, x, y);
  const baseColor = def.key.startsWith('grass') || def.key === 'grass' ? '#3D7A28'
    : def.key.startsWith('stone') || def.key === 'stone' ? '#6A6A5A'
    : def.key === 'pit' ? '#2A1A08'
    : '#8B5E1A';
  ctx.fillStyle = baseColor;
  ctx.fillRect(sx, sy, TILE, TILE);
  const img = sprites.structure[groundName];
  if(img?.naturalWidth){
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, TILE, TILE);
    ctx.clip();
    drawRotatedImage(img, sx-2, sy-2, TILE+4, TILE+4, rot);
    ctx.restore();
  }
  ctx.strokeStyle = 'rgba(43,25,4,.18)';
  ctx.strokeRect(sx+0.5, sy+0.5, TILE-1, TILE-1);
}

function getGroundName(def,x,y){
  if(def.ground?.length){
    const index = Math.min(def.ground.length-1, Math.floor(seedNoise(x,y,def.key)*def.ground.length));
    return def.ground[index];
  }
  return def.base || 'SOIL_BIG';
}

function drawObjectTile(cell,x,y){
  const key = cellKey(cell);
  const rot = cellRot(cell);
  if(key === 'fence' && isMapEdge(x,y)){
    drawEditorFence(x*TILE, y*TILE, x, y);
    return;
  }
  const def = TILE_BY_KEY[key];
  if(!def?.object) return;
  const objectName = def.altObject && (x+y)%2 ? def.altObject : def.object;
  drawObjectSprite(objectName, x*TILE + TILE*0.5, y*TILE + TILE*(def.baseY ?? 1.05), TILE*(def.width ?? 1.6), rot);
}

function isMapEdge(x,y){
  return x === 0 || y === 0 || x === state.width-1 || y === state.height-1;
}

function drawEditorFence(sx,sy,x,y){
  const top=y===0, bottom=y===state.height-1, left=x===0, right=x===state.width-1;
  ctx.save();
  ctx.fillStyle='#3A1A00';
  ctx.fillRect(sx,sy,TILE,TILE);

  if(top||bottom){
    for(let i=0;i<4;i++){
      const py=sy+4+i*10;
      ctx.fillStyle=i%2===0?'#7A4010':'#5C2E00';
      ctx.fillRect(sx+1,py,TILE-2,7);
      ctx.fillStyle='#9B5518';
      ctx.fillRect(sx+1,py,TILE-2,1);
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
  ctx.restore();
}

function drawObjectSprite(name,cx,baseY,width,rot=0){
  const img = sprites.structure[name];
  if(!img?.naturalWidth) return;
  const height = width * (img.naturalHeight / img.naturalWidth);
  drawRotatedImage(img, cx-width/2, baseY-height, width, height, rot);
}

function drawRotatedImage(img,x,y,width,height,rot=0){
  const turns = normalizeRotation(rot);
  if(!turns){
    ctx.drawImage(img, x, y, width, height);
    return;
  }
  ctx.save();
  ctx.translate(x+width/2, y+height/2);
  ctx.rotate(turns*Math.PI/2);
  ctx.drawImage(img, -width/2, -height/2, width, height);
  ctx.restore();
}

function drawMarkers(){
  state.digSites.forEach((site,index)=>{
    const cx = site.x*TILE + TILE/2;
    const cy = site.y*TILE + TILE/2;
    ctx.save();
    ctx.fillStyle = 'rgba(255,209,102,.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, TILE*.33, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#120904';
    ctx.font = 'bold 12px Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index+1), cx, cy);
    ctx.restore();
  });

  drawCharacterMarker(state.playerStart, sprites.player, '#ff7043', 'S');
  drawCharacterMarker(state.npc, sprites.oldman, '#4fc3f7', 'N');
  if(state.hover){
    ctx.save();
    ctx.strokeStyle = '#fff7c2';
    ctx.lineWidth = 3;
    ctx.strokeRect(state.hover.x*TILE+1.5, state.hover.y*TILE+1.5, TILE-3, TILE-3);
    ctx.restore();
  }
}

function drawCharacterMarker(point,img,color,label){
  const cx = point.x*TILE + TILE/2;
  const baseY = point.y*TILE + TILE*.95;
  ctx.save();
  ctx.globalAlpha = .24;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, TILE*.36, TILE*.12, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = 1;
  if(img?.naturalWidth){
    const h = TILE*1.2;
    const w = h * (img.naturalWidth / img.naturalHeight);
    ctx.drawImage(img, cx-w/2, baseY-h, w, h);
  }
  ctx.fillStyle = color;
  ctx.strokeStyle = '#120904';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx+TILE*.28, point.y*TILE+TILE*.22, 10, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#120904';
  ctx.font = 'bold 11px Menlo, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx+TILE*.28, point.y*TILE+TILE*.22);
  ctx.restore();
}

function drawGrid(){
  ctx.save();
  ctx.strokeStyle = 'rgba(20,10,2,.46)';
  ctx.lineWidth = 1;
  for(let x=0;x<=state.width;x++){
    ctx.beginPath();
    ctx.moveTo(x*TILE+.5, 0);
    ctx.lineTo(x*TILE+.5, state.height*TILE);
    ctx.stroke();
  }
  for(let y=0;y<=state.height;y++){
    ctx.beginPath();
    ctx.moveTo(0, y*TILE+.5);
    ctx.lineTo(state.width*TILE, y*TILE+.5);
    ctx.stroke();
  }
  ctx.restore();
}

function canvasCell(event){
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / rect.width * state.width);
  const y = Math.floor((event.clientY - rect.top) / rect.height * state.height);
  if(x<0||y<0||x>=state.width||y>=state.height) return null;
  return {x,y};
}

function applyTool(cell, erase=false){
  if(!cell) return;
  if(state.tool === 'tile'){
    const nextCell = erase ? makeCell('soil_big') : makeCell(state.selectedKey, state.rotation);
    if(cellsEqual(state.tiles[cell.y][cell.x], nextCell)) return;
    state.tiles[cell.y][cell.x] = nextCell;
    if(!isWalkableTile(cell.x,cell.y)){
      state.digSites = state.digSites.filter(site => site.x !== cell.x || site.y !== cell.y);
    }
  } else if(state.tool === 'dig'){
    const index = state.digSites.findIndex(site => site.x === cell.x && site.y === cell.y);
    if(index >= 0 || erase){
      if(index >= 0) state.digSites.splice(index, 1);
    } else if(isWalkableTile(cell.x, cell.y)) {
      state.digSites.push({x:cell.x, y:cell.y, qIdx:state.digSites.length});
    }
  } else if(state.tool === 'npc'){
    if(state.npc.x === cell.x && state.npc.y === cell.y) return;
    state.npc = cell;
  } else if(state.tool === 'start'){
    if(state.playerStart.x === cell.x && state.playerStart.y === cell.y) return;
    state.playerStart = cell;
  }
  renumberDigSites();
  draw();
}

function renumberDigSites(){
  state.digSites.forEach((site,index)=>{ site.qIdx = index % 12; });
}

function buildPalette(){
  ui.palette.innerHTML = '';
  TILE_TYPES.forEach(type=>{
    const btn = document.createElement('button');
    btn.className = 'tile-btn';
    btn.type = 'button';
    btn.dataset.key = type.key;
    const preview = document.createElement('canvas');
    preview.width = 34;
    preview.height = 34;
    const name = document.createElement('div');
    name.className = 'tile-name';
    name.textContent = type.label;
    btn.append(preview, name);
    btn.addEventListener('click', () => {
      state.selectedKey = type.key;
      state.tool = 'tile';
      syncToolButtons();
      syncPalette();
    });
    ui.palette.appendChild(btn);
    drawPalettePreview(preview, type);
  });
  syncPalette();
}

function drawPalettePreview(preview,type){
  const pc = preview.getContext('2d');
  pc.imageSmoothingEnabled = false;
  pc.fillStyle = type.color || '#8B5E1A';
  pc.fillRect(0,0,34,34);
  const ground = type.ground?.[0] || type.base;
  const gImg = sprites.structure[ground];
  if(gImg?.naturalWidth) pc.drawImage(gImg,0,0,34,34);
  const oImg = sprites.structure[type.object];
  if(oImg?.naturalWidth){
    const w = type.object === 'PIT' ? 34 : Math.min(34, 34*(type.width || 1.3)/1.8);
    const h = w * (oImg.naturalHeight / oImg.naturalWidth);
    pc.drawImage(oImg,17-w/2,32-h,w,h);
  }
}

function syncPalette(){
  document.querySelectorAll('.tile-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.key === state.selectedKey && state.tool === 'tile');
  });
}

function syncToolButtons(){
  document.querySelectorAll('#tools button').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tool === state.tool);
  });
  syncPalette();
}

function syncRotationButtons(){
  const label = `Rotate ${state.rotation*90}°`;
  document.getElementById('rotate').textContent = label;
  document.getElementById('rotate-side').textContent = label;
}

function syncUndoButtons(){
  const disabled = state.undoStack.length === 0;
  document.getElementById('undo').disabled = disabled;
  document.getElementById('undo-side').disabled = disabled;
}

function rotateSelection(){
  state.rotation = (state.rotation + 1) % 4;
  syncRotationButtons();
  updateStats();
  setStatus(`Rotation set to ${state.rotation*90}°. Paint a tile to use it.`, 'good');
}

function updateStats(){
  const counts = new Map();
  state.tiles.flat().forEach(cell => {
    const key = cellKey(cell);
    counts.set(key, (counts.get(key)||0)+1);
  });
  const selected = TILE_BY_KEY[state.selectedKey]?.label || state.selectedKey;
  ui.stats.textContent = `${state.width} x ${state.height} cells | ${state.digSites.length} dig sites | selected: ${selected} | rot: ${state.rotation*90}°`;
}

function exportMap(){
  renumberDigSites();
  return {
    schemaVersion: 1,
    width: state.width,
    height: state.height,
    playerStart: {...state.playerStart},
    npc: {...state.npc},
    tiles: state.tiles.map(row => row.map(exportCell)),
    digSites: state.digSites.map(site => ({x:site.x, y:site.y, qIdx:site.qIdx})),
  };
}

function exportCell(cell){
  const key = cellKey(cell);
  const rot = cellRot(cell);
  return rot ? {key, rot} : key;
}

function downloadMap(){
  const name = safeMapFileName(ui.file.value);
  const blob = new Blob([JSON.stringify(exportMap(), null, 2) + '\n'], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`Downloaded ${name}`, 'good');
}

async function saveMap(){
  const fileName = safeMapFileName(ui.file.value);
  setStatus('Saving map...');
  try {
    const response = await fetch('/save-map', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({fileName, map: exportMap()}),
    });
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if(!result.ok) throw new Error(result.error || 'Save failed');
    setStatus(`Saved ${result.path}`, 'good');
  } catch (error) {
    downloadMap();
    setStatus(`Static browser mode: downloaded ${fileName}. Run scripts/map_editor_server.py for direct save.`, 'bad');
  }
}

function safeMapFileName(value){
  const cleaned = String(value || 'map.json').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'map.json';
  return cleaned.toLowerCase().endsWith('.json') ? cleaned : `${cleaned}.json`;
}

canvas.addEventListener('contextmenu', event => event.preventDefault());
canvas.addEventListener('pointerdown', event=>{
  const cell = canvasCell(event);
  state.pointerDown = true;
  state.dragSnapshotTaken = false;
  if(cell){
    pushUndo();
    state.dragSnapshotTaken = true;
  }
  applyTool(cell, event.button === 2);
  event.preventDefault();
});
canvas.addEventListener('pointermove', event=>{
  const cell = canvasCell(event);
  state.hover = cell;
  if(state.pointerDown && state.tool === 'tile') applyTool(cell, event.buttons === 2);
  else draw();
});
canvas.addEventListener('pointerup', ()=>{
  state.pointerDown = false;
  state.dragSnapshotTaken = false;
});
canvas.addEventListener('pointerleave', ()=>{
  state.pointerDown = false;
  state.dragSnapshotTaken = false;
  state.hover = null;
  draw();
});

document.querySelectorAll('#tools button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    state.tool = btn.dataset.tool;
    syncToolButtons();
  });
});

document.getElementById('save').addEventListener('click', saveMap);
document.getElementById('download').addEventListener('click', downloadMap);
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('undo-side').addEventListener('click', undo);
document.getElementById('rotate').addEventListener('click', rotateSelection);
document.getElementById('rotate-side').addEventListener('click', rotateSelection);
document.getElementById('fill-soil').addEventListener('click', ()=>{
  pushUndo();
  state.tiles = Array.from({length:state.height}, () => Array.from({length:state.width}, () => makeCell('soil_big')));
  render();
  setStatus('Filled map with soil.', 'good');
});
document.getElementById('border-fence').addEventListener('click', ()=>{
  pushUndo();
  for(let y=0;y<state.height;y++){
    for(let x=0;x<state.width;x++){
      if(x===0||y===0||x===state.width-1||y===state.height-1) state.tiles[y][x] = makeCell('fence');
    }
  }
  render();
  setStatus('Added fence border.', 'good');
});
document.getElementById('clear-dig').addEventListener('click', ()=>{
  pushUndo();
  state.digSites = [];
  render();
  setStatus('Removed all dig sites.', 'good');
});
document.getElementById('randomize').addEventListener('click', ()=>{
  pushUndo();
  randomizeMap();
});

window.addEventListener('keydown', event=>{
  if((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z'){
    event.preventDefault();
    undo();
    return;
  }
  if(event.key.toLowerCase() === 'r'){
    event.preventDefault();
    rotateSelection();
  }
});

function render(){
  draw();
}

async function boot(){
  setStatus('Loading assets...');
  await loadAssets();
  buildPalette();
  syncRotationButtons();
  syncUndoButtons();
  await loadMap();
  render();
}

boot();
