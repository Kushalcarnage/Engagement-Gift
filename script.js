// --- 1. Scene Setup & Camera ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x02040a); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 250; 

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.05;
controls.autoRotate = true; controls.autoRotateSpeed = 0.2; 

let targetCameraPos = new THREE.Vector3(0, 0, 250);
let targetLookAt = new THREE.Vector3(0, 0, 0);

// --- 2. AUDIO SETUP ---
const bgMusic = document.getElementById('bg-music');
const chimeSound = document.getElementById('chime-sound');
const whooshSound = document.getElementById('whoosh-sound');
if(bgMusic) bgMusic.volume = 0.4; 
if(chimeSound) chimeSound.volume = 0.7;
if(whooshSound) whooshSound.volume = 0.5;

function playChime() { if(chimeSound) { chimeSound.currentTime = 0; chimeSound.play(); } }
function playWhoosh() { if(whooshSound) { whooshSound.currentTime = 0; whooshSound.play(); } }

// --- 3. Glow Texture & Post Processing ---
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true; return texture;
}
const glowTexture = createGlowTexture();

const renderScene = new THREE.RenderPass(scene, camera);
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.8, 0.1);
const composer = new THREE.EffectComposer(renderer);
composer.addPass(renderScene); composer.addPass(bloomPass);

// --- 4. UI Elements Mapping ---
const uiLayer = document.getElementById('ui-layer');
const introScreen = document.getElementById('intro-screen');
const enterBtn = document.getElementById('enter-btn');
const tutorialScreen = document.getElementById('tutorial-screen');
const startBtn = document.getElementById('start-btn');
const playStoryBtn = document.getElementById('play-story-btn');
const modal = document.getElementById('photo-modal');
const modalImg = document.getElementById('modal-image');
const modalCaption = document.getElementById('modal-caption');
const closeModal = document.getElementById('close-modal');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const backBtn = document.createElement('button');
backBtn.id = 'back-button'; backBtn.className = 'hidden';
backBtn.innerText = '← Back to Galaxy'; document.body.appendChild(backBtn);
if(uiLayer) uiLayer.style.opacity = 0; 

// --- 5. Background Stars & Hyperdrive Vars ---
let isWarping = true; let warpSpeed = 30; let targetWarpSpeed = 30;

const bgStarCount = 3000;
const bgStarGeometry = new THREE.BufferGeometry();
const bgStarMaterial = new THREE.PointsMaterial({ color: 0xaaaaee, size: 2.5, map: glowTexture, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
const bgStarPositions = new Float32Array(bgStarCount * 3);
for (let i = 0; i < bgStarCount * 3; i++) {
    bgStarPositions[i * 3] = (Math.random() - 0.5) * 1800;
    bgStarPositions[i * 3 + 1] = (Math.random() - 0.5) * 1800;
    bgStarPositions[i * 3 + 2] = (Math.random() - 0.5) * 1800; 
}
bgStarGeometry.setAttribute('position', new THREE.BufferAttribute(bgStarPositions, 3));
scene.add(new THREE.Points(bgStarGeometry, bgStarMaterial));

// --- 6. Constellation Groups & Drawing Logic ---
const aquariusGroup = new THREE.Group();
const peacockGroup = new THREE.Group();
const bullGroup = new THREE.Group();
const elephantGroup = new THREE.Group();
scene.add(aquariusGroup, peacockGroup, bullGroup, elephantGroup);
aquariusGroup.visible = false; peacockGroup.visible = false; bullGroup.visible = false; elephantGroup.visible = false;

// Function to trigger the drawing animation
function triggerConstellationDraw(group) {
    if(group.userData.lines) {
        group.userData.lines.geometry.setDrawRange(0, 0); // Hide lines
        group.userData.lines.userData.drawCount = 0;      // Reset counter
        group.userData.lines.userData.isDrawing = true;   // Start drawing
    }
}

// Build Aquarius
const aquariusPoints = [
    { x: 15, y: 55, z: 0 }, { x: -5, y: 45, z: 5 }, { x: 35, y: 40, z: -5 },  
    { x: -25, y: 60, z: 10 }, { x: -35, y: 45, z: 10 }, { x: 5, y: 15, z: 0 },    
    { x: -15, y: -15, z: 5 }, { x: 25, y: -25, z: -5 }, { x: -45, y: 20, z: 15 }, 
    { x: -25, y: 0, z: 20 }, { x: -55, y: -20, z: 15 }, { x: -15, y: -45, z: 20 }, { x: -45, y: -65, z: 15 } 
];
const aqGeo = new THREE.BufferGeometry();
const aqPos = new Float32Array(aquariusPoints.length * 3);
aquariusPoints.forEach((p, i) => { aqPos[i*3] = p.x; aqPos[i*3+1] = p.y; aqPos[i*3+2] = p.z; });
aqGeo.setAttribute('position', new THREE.BufferAttribute(aqPos, 3));
aquariusGroup.add(new THREE.Points(aqGeo, new THREE.PointsMaterial({ color: 0x88ccff, size: 12, map: glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));

const connections = [[0, 1], [0, 2], [1, 5], [2, 5], [1, 4], [3, 4], [5, 6], [5, 7], [4, 8], [8, 9], [9, 10], [10, 11], [11, 12]];
const linePos = [];
connections.forEach(pair => { linePos.push(aquariusPoints[pair[0]].x, aquariusPoints[pair[0]].y, aquariusPoints[pair[0]].z, aquariusPoints[pair[1]].x, aquariusPoints[pair[1]].y, aquariusPoints[pair[1]].z); });
const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
const aqLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending}));
aqLines.userData = { drawCount: 0, maxPoints: linePos.length / 3, isDrawing: false }; // Setup drawing math
aquariusGroup.add(aqLines);
aquariusGroup.userData.lines = aqLines;

const portalMapping = [{ targetIndex: 3, name: 'peacock' }, { targetIndex: 2, name: 'bull' }, { targetIndex: 12, name: 'elephant' }];
const portalPos = [];
portalMapping.forEach(portal => { portalPos.push(aquariusPoints[portal.targetIndex].x, aquariusPoints[portal.targetIndex].y, aquariusPoints[portal.targetIndex].z); });
const portalGeo = new THREE.BufferGeometry();
portalGeo.setAttribute('position', new THREE.Float32BufferAttribute(portalPos, 3));
const portalStars = new THREE.Points(portalGeo, new THREE.PointsMaterial({ color: 0xffd700, size: 25, map: glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
aquariusGroup.add(portalStars);

// Build Animal Galleries
const photoData = [];
let photoIndex = 1;

function buildAnimalGallery(group, count, shapeType, colorHex) {
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.PointsMaterial({ color: colorHex, size: 15, map: glowTexture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        let x, y, z;
        if (shapeType === 'fan') {
            const angle = (i / (count - 1)) * Math.PI; const radius = 60 + (Math.random() * 15);
            x = Math.cos(angle) * radius; y = Math.sin(angle) * radius - 30; z = (Math.random() - 0.5) * 10;
        } else if (shapeType === 'vshape') {
            const branch = i % 2 === 0 ? 1 : -1; const step = Math.floor(i / 2) * 6;
            x = branch * step; y = step * 2 - 40; z = (Math.random() - 0.5) * 15;
        } else if (shapeType === 'trunk') {
            if (i < count / 2) { x = (Math.random() - 0.5) * 40; y = (Math.random() - 0.5) * 30 + 30; z = (Math.random() - 0.5) * 20; } 
            else { const step = i - (count / 2); x = Math.sin(step * 0.3) * 15; y = -step * 5 + 10; z = Math.cos(step * 0.3) * 10; }
        }
        positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
        photoData.push({ title: `Engagement Memory`, url: `images/photo _${photoIndex}.jpg`, x: x, y: y, z: z });
        photoIndex++;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(geo, mat);
    
    // Setup dynamic drawing lines for animals
    const animalLines = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
    animalLines.userData = { drawCount: 0, maxPoints: count, isDrawing: false };
    
    group.add(stars); group.add(animalLines); 
    group.userData.clickableStars = stars;
    group.userData.lines = animalLines;
}
buildAnimalGallery(peacockGroup, 24, 'fan', 0xffcc00);    
buildAnimalGallery(bullGroup, 24, 'vshape', 0xffcc00);    
buildAnimalGallery(elephantGroup, 25, 'trunk', 0xffcc00); 

// --- 7. Interaction & Story Mode Logic ---
let currentView = 'aquarius'; 
let currentModalPhotoIndex = 0; let isStoryMode = false; let storyTimer;
const raycaster = new THREE.Raycaster(); raycaster.params.Points.threshold = 8; 
const mouse = new THREE.Vector2();

// Intro -> Tutorial (Start Music!)
if(enterBtn) {
    enterBtn.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        targetWarpSpeed = 0; 
        if(bgMusic) bgMusic.play(); // Start the cinematic space music
        setTimeout(() => { if(tutorialScreen) tutorialScreen.classList.remove('hidden'); }, 1200);
    });
}

// Tutorial -> Main View (Trigger Aquarius Draw!)
if(startBtn) {
    startBtn.addEventListener('click', () => {
        tutorialScreen.classList.add('hidden');
        aquariusGroup.visible = true;
        if(uiLayer) uiLayer.style.opacity = 1;
        triggerConstellationDraw(aquariusGroup);
    });
}

function loadPhotoIntoModal(index) {
    if (index < 0) index = photoData.length - 1; 
    if (index >= photoData.length) index = 0;    
    currentModalPhotoIndex = index;
    const selectedPhoto = photoData[index];
    
    if(modalImg) modalImg.src = selectedPhoto.url;
    if(modalCaption) modalCaption.innerText = `${selectedPhoto.title} (${index + 1} of ${photoData.length})`;

    // Group Switching logic
    if (index < 24 && currentView !== 'peacock') { 
        peacockGroup.visible = true; bullGroup.visible = false; elephantGroup.visible = false; currentView = 'peacock'; triggerConstellationDraw(peacockGroup); 
    } else if (index >= 24 && index < 48 && currentView !== 'bull') { 
        peacockGroup.visible = false; bullGroup.visible = true; elephantGroup.visible = false; currentView = 'bull'; triggerConstellationDraw(bullGroup); 
    } else if (index >= 48 && currentView !== 'elephant') { 
        peacockGroup.visible = false; bullGroup.visible = false; elephantGroup.visible = true; currentView = 'elephant'; triggerConstellationDraw(elephantGroup); 
    }

    targetLookAt.set(selectedPhoto.x, selectedPhoto.y, selectedPhoto.z);
    targetCameraPos.set(selectedPhoto.x, selectedPhoto.y, selectedPhoto.z + 50);
}

// Story Mode
function playNextStoryPhoto() {
    playWhoosh(); // Play whoosh sound when moving to next photo
    loadPhotoIntoModal(currentModalPhotoIndex);
    if(modal) modal.classList.remove('hidden');
    currentModalPhotoIndex++;
    storyTimer = setTimeout(playNextStoryPhoto, 5000); 
}
function stopStoryMode() {
    isStoryMode = false; clearTimeout(storyTimer);
    if(playStoryBtn) {
        playStoryBtn.innerText = "▶ Play Story Mode"; 
        playStoryBtn.classList.remove('active');
    }
}
if(playStoryBtn) {
    playStoryBtn.addEventListener('click', () => {
        if (isStoryMode) { stopStoryMode(); } 
        else {
            isStoryMode = true; playStoryBtn.innerText = "⏹ Stop Story Mode"; playStoryBtn.classList.add('active');
            aquariusGroup.visible = false; backBtn.classList.remove('hidden');
            currentModalPhotoIndex = 0; playNextStoryPhoto();
        }
    });
}

// Clicking Stars
window.addEventListener('click', (event) => {
    if(event.target.tagName === 'BUTTON' || event.target.id === 'close-modal' || event.target.classList.contains('nav-arrow')) return;
    if(isStoryMode) stopStoryMode();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1; mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (currentView === 'aquarius' && aquariusGroup.visible) {
        const intersects = raycaster.intersectObject(portalStars);
        if (intersects.length > 0) {
            playChime(); // Play magical chime!
            const clickedPortalIndex = intersects[0].index;
            const selectedAnimal = portalMapping[clickedPortalIndex].name;
            
            aquariusGroup.visible = false; if(uiLayer) uiLayer.style.opacity = 0; backBtn.classList.remove('hidden');
            targetCameraPos.set(0, 0, 160); targetLookAt.set(0, 0, 0);
            
            peacockGroup.visible = false; bullGroup.visible = false; elephantGroup.visible = false;
            if (selectedAnimal === 'peacock') { peacockGroup.visible = true; currentView = 'peacock'; triggerConstellationDraw(peacockGroup); }
            if (selectedAnimal === 'bull') { bullGroup.visible = true; currentView = 'bull'; triggerConstellationDraw(bullGroup); }
            if (selectedAnimal === 'elephant') { elephantGroup.visible = true; currentView = 'elephant'; triggerConstellationDraw(elephantGroup); }
        }
    } else if (currentView !== 'aquarius') {
        let activeStars = currentView === 'peacock' ? peacockGroup.userData.clickableStars : (currentView === 'bull' ? bullGroup.userData.clickableStars : elephantGroup.userData.clickableStars);
        const intersects = raycaster.intersectObject(activeStars);
        if (intersects.length > 0) {
            playChime(); // Play magical chime!
            controls.autoRotate = false; 
            let absoluteIndex = intersects[0].index;
            if (currentView === 'bull') absoluteIndex += 24; 
            if (currentView === 'elephant') absoluteIndex += 48;
            loadPhotoIntoModal(absoluteIndex); if(modal) modal.classList.remove('hidden');
        }
    }
});

// Modals & Navigation
if(prevBtn) prevBtn.addEventListener('click', () => { playWhoosh(); stopStoryMode(); loadPhotoIntoModal(currentModalPhotoIndex - 1); });
if(nextBtn) nextBtn.addEventListener('click', () => { playWhoosh(); stopStoryMode(); loadPhotoIntoModal(currentModalPhotoIndex + 1); });
if(closeModal) closeModal.addEventListener('click', () => { stopStoryMode(); if(modal) modal.classList.add('hidden'); controls.autoRotate = true; targetCameraPos.set(0, 0, 160); targetLookAt.set(0, 0, 0); });
backBtn.addEventListener('click', () => {
    stopStoryMode(); currentView = 'aquarius'; targetCameraPos.set(0, 0, 250); targetLookAt.set(0, 0, 0);
    peacockGroup.visible = false; bullGroup.visible = false; elephantGroup.visible = false;
    aquariusGroup.visible = true; if(uiLayer) uiLayer.style.opacity = 1; backBtn.classList.add('hidden');
    triggerConstellationDraw(aquariusGroup); // Redraw map when returning
});

window.addEventListener('keydown', (event) => {
    if (modal && !modal.classList.contains('hidden')) {
        if (event.key === 'ArrowLeft') { playWhoosh(); stopStoryMode(); loadPhotoIntoModal(currentModalPhotoIndex - 1); }
        if (event.key === 'ArrowRight') { playWhoosh(); stopStoryMode(); loadPhotoIntoModal(currentModalPhotoIndex + 1); }
        if (event.key === 'Escape') { stopStoryMode(); modal.classList.add('hidden'); controls.autoRotate = true; targetCameraPos.set(0, 0, 160); targetLookAt.set(0, 0, 0); }
    }
});

// --- 8. Animation Loop ---
const constellationGroups = [aquariusGroup, peacockGroup, bullGroup, elephantGroup];

function animate() {
    requestAnimationFrame(animate);
    
    camera.position.lerp(targetCameraPos, 0.04);
    controls.target.lerp(targetLookAt, 0.04);
    controls.update(); 

    // Dynamic Line Drawing Animation Logic
    constellationGroups.forEach(group => {
        if (group.visible && group.userData.lines && group.userData.lines.userData.isDrawing) {
            const lines = group.userData.lines;
            lines.userData.drawCount += 0.5; // Controls the speed of the spark drawing
            lines.geometry.setDrawRange(0, Math.floor(lines.userData.drawCount));
            if (lines.userData.drawCount >= lines.userData.maxPoints) {
                lines.userData.isDrawing = false; // Stop when fully drawn
            }
        }
    });

    if (isWarping) {
        const positions = bgStarGeometry.attributes.position.array;
        for (let i = 0; i < bgStarCount; i++) {
            positions[i * 3 + 2] += warpSpeed; 
            if (positions[i * 3 + 2] > 300) positions[i * 3 + 2] = -1500; 
        }
        bgStarGeometry.attributes.position.needsUpdate = true;
        warpSpeed += (targetWarpSpeed - warpSpeed) * 0.02;
        if (warpSpeed < 0.1 && targetWarpSpeed === 0) isWarping = false; 
    }
    
    composer.render();
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight);
});