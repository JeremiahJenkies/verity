
// NOCTURNE: endless woodland and skinwalker pursuit.
const endlessChunks=new Set();
let skinwalker=null,skinwalkerSpeed=1.65,huntElapsed=0,huntNoticeAt=0;
const endlessMaterials={
 ground:new THREE.MeshStandardMaterial({color:0x101c1b,roughness:1}),
 trunk:new THREE.MeshStandardMaterial({color:0x171b1a,roughness:1}),
 canopy:new THREE.MeshStandardMaterial({color:0x0b1716,roughness:1}),
 pale:new THREE.MeshStandardMaterial({color:0xc4c8b8,roughness:.9}),
 dark:new THREE.MeshStandardMaterial({color:0x101315,roughness:1}),
 eye:new THREE.MeshBasicMaterial({color:0xe8d6a0})
};
function makeEndlessTree(x,z,scale=1){
 const g=new THREE.Group();
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*scale,.34*scale,4.8*scale,5),endlessMaterials.trunk);
 trunk.position.y=2.4*scale;g.add(trunk);
 for(let i=0;i<4;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry((2.2-i*.35)*scale,(4.1-i*.45)*scale,6),endlessMaterials.canopy);cone.position.set(0,(4.1+i*1.45)*scale,0);g.add(cone)}
 g.position.set(x,0,z);scene.add(g);
}
function makeEndlessChunk(index){
 if(endlessChunks.has(index))return;
 endlessChunks.add(index);
 const z=index*48;
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(112,50),endlessMaterials.ground);
 floor.rotation.x=-Math.PI/2;floor.position.set(0,-.035,z);floor.receiveShadow=true;scene.add(floor);
 const trail=new THREE.Mesh(new THREE.PlaneGeometry(5.5,50),new THREE.MeshStandardMaterial({color:0x202a25,roughness:1}));
 trail.rotation.x=-Math.PI/2;trail.position.set(0,-.018,z);scene.add(trail);
 let seed=Math.abs((index*9301+49297)%233280)/233280;
 for(let i=0;i<18;i++){
  seed=(seed*9301+49297)%233280/233280;
  const side=i%2===0?-1:1,x=side*(7+seed*43),zz=z-24+((i*17+Math.floor(seed*19))%48);
  makeEndlessTree(x,zz,.75+seed*1.25);
 }
}
function ensureEndlessWorld(){
 const center=Math.floor(player.position.z/48);
 for(let i=center-3;i<=center+4;i++)makeEndlessChunk(i);
}
function createSkinwalker(){
 if(skinwalker)return;
 const g=new THREE.Group();
 const torso=new THREE.Mesh(new THREE.CylinderGeometry(.32,.48,1.85,7),endlessMaterials.dark);torso.position.y=1.55;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.36,8,7),endlessMaterials.pale);head.scale.set(.78,1.25,.72);head.position.set(0,2.82,-.02);g.add(head);
 const jaw=new THREE.Mesh(new THREE.BoxGeometry(.22,.38,.2),endlessMaterials.dark);jaw.position.set(0,2.54,-.2);g.add(jaw);
 for(const side of [-1,1]){
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.055,6,5),endlessMaterials.eye);eye.position.set(side*.14,2.88,-.28);g.add(eye);
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,1.55,5),endlessMaterials.dark);arm.position.set(side*.53,1.72,-.02);arm.rotation.z=side*.13;g.add(arm);
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(.12,.09,1.35,5),endlessMaterials.dark);leg.position.set(side*.2,.55,0);g.add(leg);
 }
 g.scale.set(1.02,1.08,1.02);
 const a=Math.random()*Math.PI*2,d=34+Math.random()*12;
 g.position.set(player.position.x+Math.sin(a)*d,0,player.position.z+Math.cos(a)*d);
 scene.add(g);skinwalker=g;
}
function updateSkinwalker(dt){
 if(!started||paused||!player||!scene)return;
 huntElapsed+=dt;
 if(!skinwalker&&huntElapsed>18)createSkinwalker();
 if(!skinwalker)return;
 skinwalkerSpeed=Math.min(3.8,1.65+huntElapsed*.012);
 const dx=player.position.x-skinwalker.position.x,dz=player.position.z-skinwalker.position.z,dist=Math.hypot(dx,dz);
 if(dist>1.35){skinwalker.position.x+=dx/dist*skinwalkerSpeed*dt;skinwalker.position.z+=dz/dist*skinwalkerSpeed*dt}
 skinwalker.rotation.y=Math.atan2(-dx,-dz);
 skinwalker.position.y=.035+Math.abs(Math.sin(huntElapsed*7))*.045;
 if(dist>115){const a=Math.random()*Math.PI*2,d=42+Math.random()*14;skinwalker.position.set(player.position.x+Math.sin(a)*d,0,player.position.z+Math.cos(a)*d)}
 if(dist<17&&huntElapsed-huntNoticeAt>8){huntNoticeAt=huntElapsed;$('discoveryText').textContent='Something is following you. Keep moving.'}
 if(dist<3.1){$('discoveryText').textContent='IT FOUND YOU — the woods fall silent.';const a=Math.random()*Math.PI*2,d=44+Math.random()*12;skinwalker.position.set(player.position.x+Math.sin(a)*d,0,player.position.z+Math.cos(a)*d);huntElapsed+=4}
}
