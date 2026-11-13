import * as THREE from './three.module.min.js';

export function mountPetScene(host, {level=1, onTouch=()=>{}}={}) {
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label','绿色小猫头鹰 3D 模型；左右拖动可以转身');
  canvas.setAttribute('role','img');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0,2.3,7.8); camera.lookAt(0,1.45,0);
  scene.add(new THREE.HemisphereLight(0xfff7e5,0x82967a,2.5));
  const key = new THREE.DirectionalLight(0xfff4db,3.3); key.position.set(-3,6,5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc7eee0,2); rim.position.set(4,3,-2); scene.add(rim);
  const materials = new Map(), geometries = new Set();
  const material = (color, roughness=.65) => {
    const id=color+'|'+roughness;
    if(!materials.has(id)) materials.set(id,new THREE.MeshStandardMaterial({color,roughness}));
    return materials.get(id);
  };
  const ballGeometry = new THREE.SphereGeometry(1,32,24); geometries.add(ballGeometry);
  function ball(parent,color,position,scale,roughness=.65) {
    const mesh=new THREE.Mesh(ballGeometry,material(color,roughness));
    mesh.position.set(...position);mesh.scale.set(...scale);parent.add(mesh);return mesh;
  }
  function shape(parent,geometry,color,position) {
    geometries.add(geometry);const mesh=new THREE.Mesh(geometry,material(color));
    mesh.position.set(...position);parent.add(mesh);return mesh;
  }
  // All parts are real shaded meshes; no image or remote model is needed.
  const podium=shape(scene,new THREE.CylinderGeometry(1.48,1.58,.18,64),0xdbe7c9,[0,.03,0]);
  shape(scene,new THREE.CylinderGeometry(1.43,1.43,.025,64),0xf3f1d9,[0,.13,0]);
  const pet=new THREE.Group(); scene.add(pet);
  ball(pet,0x88ad79,[0,1.22,0],[.86,1.04,.65]);
  ball(pet,0xa7c98c,[0,2.05,.03],[.94,.8,.68]);
  ball(pet,0xe8ebc5,[0,1.08,.52],[.61,.68,.2]);
  const eyes=[];
  for(const side of [-1,1]) {
    const ear=ball(pet,0xa7c98c,[side*.65,2.65,-.01],[.22,.45,.22]);ear.rotation.z=-side*.36;
    ball(pet,0xf8f4da,[side*.34,2.13,.57],[.35,.41,.18]);
    eyes.push(ball(pet,0x263b31,[side*.33,2.15,.733],[.125,.19,.075],.2));
    ball(pet,0xffffff,[side*.33-.035,2.22,.795],[.035,.045,.018],.2);
    ball(pet,0xd9a397,[side*.58,1.87,.59],[.15,.075,.045]);
    ball(pet,0xd7a85d,[side*.35,.27,.25],[.23,.13,.31]);
  }
  const beak=shape(pet,new THREE.ConeGeometry(.14,.22,4),0xe4b266,[0,1.91,.79]);
  beak.rotation.x=Math.PI;beak.rotation.y=Math.PI/4;
  const wings=[];
  for(const side of [-1,1]) {
    const pivot=new THREE.Group();pivot.position.set(side*.76,1.58,0);pet.add(pivot);
    const wing=ball(pivot,0x749e68,[side*.08,-.24,.04],[.22,.52,.38]);wing.rotation.z=side*.2;
    wings.push(pivot);
  }
  ball(pet,0x7c9f6d,[0,1.02,-.61],[.37,.38,.22]);
  const sprout=new THREE.Group();sprout.position.set(0,2.82,0);pet.add(sprout);
  const leaf=ball(sprout,0x577e4c,[-.1,.1,0],[.12,.25,.07]);leaf.rotation.z=-.65;
  if(level>=5){const leaf2=ball(sprout,0x8ba85c,[.12,.16,0],[.12,.28,.07]);leaf2.rotation.z=.65;}
  if(level>=10){const star=shape(pet,new THREE.OctahedronGeometry(.12),0xedc166,[0,1.35,.73]);star.rotation.z=.3;}
  const pebbles=[];
  for(let i=0;i<5;i++) {
    const angle=i*1.25;pebbles.push(ball(scene,i%2?0xb2c997:0xc3d4ab,[Math.cos(angle)*1.2,.23,Math.sin(angle)*1.1],[.11,.12,.11]));
  }
  let yaw=-.15,targetYaw=-.15,drag=null,touchedAt=-10000,disposed=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const resize=()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();draw(performance.now());};
  const observer=new ResizeObserver(resize);observer.observe(host);
  function react() { touchedAt=performance.now();onTouch();draw(touchedAt); }
  function down(e){if(!e.isPrimary)return;drag={x:e.clientX,start:e.clientX,yaw:targetYaw};canvas.setPointerCapture(e.pointerId);}
  function move(e){if(drag)targetYaw=drag.yaw+(e.clientX-drag.x)*.012;}
  function up(e){if(drag&&Math.abs(e.clientX-drag.start)<8)react();drag=null;}
  function cancel(){drag=null;}
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);
  function draw(time) {
    if(disposed)return;
    const t=time/1000, elapsed=(time-touchedAt)/1000;
    const happy=elapsed<1.8?Math.sin(Math.min(elapsed/1.8,1)*Math.PI):0;
    yaw += (targetYaw-yaw)*.12;pet.rotation.y=yaw;
    const motion=!reduced.matches;
    pet.position.y=motion?Math.sin(t*1.8)*.035+happy*.18:0;
    pet.rotation.z=motion?Math.sin(t*2.2)*.012+happy*Math.sin(t*14)*.08:0;
    wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*(motion?happy*.75+Math.sin(t*2)*.025:0));
    const blink=motion&&t%4.8>4.58?.12:1;
    // Scale only the two dark eye meshes; the eye whites stay round.
    eyes.forEach(m=>m.scale.y=.19*blink);
    renderer.render(scene,camera);
  }
  const loop=time=>{if(!document.hidden)draw(time);};renderer.setAnimationLoop(loop);resize();
  function contextLost(e){e.preventDefault();renderer.setAnimationLoop(null);host.dispatchEvent(new Event('pet-render-error'));}
  canvas.addEventListener('webglcontextlost',contextLost);
  return {
    react,
    turn(direction){targetYaw+=direction*.6;draw(performance.now());},
    destroy(){disposed=true;observer.disconnect();renderer.setAnimationLoop(null);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('webglcontextlost',contextLost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();},
  };
}
