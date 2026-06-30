class GameController {
    constructor() {
        // Game States: 'MENU', 'PLAYING', 'CRASHED', 'EATEN', 'GAMEOVER'
        this.state = 'MENU';
        this.highScore = parseInt(localStorage.getItem('ski3d_pb')) || 0;
        
        // High Scores (localStorage)
        this.bestDistance = parseInt(localStorage.getItem('ski3d_best_distance')) || 0;
        this.bestStyle = parseInt(localStorage.getItem('ski3d_best_style')) || 0;
        this.distRecordBeaten = false;
        this.styleRecordBeaten = false;
        this.lastYetiResetDistance = 2000;
        
        // Setup Three.js environment
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Lights
        this.dirLight = null;
        this.ambientLight = null;
        
        // Gameplay Variables
        this.distance = 0;
        this.speed = 0;
        this.targetSpeed = 0;
        this.styleScore = 0;
        this.gatesPassed = 0;
        this.elapsedTime = 0;
        
        // Constants
        this.BASE_MAX_SPEED = 18;  // Starting max speed (81 km/h)
        this.PEAK_MAX_SPEED = 24;  // Peak max speed (108 km/h)
        this.currentMaxSpeed = 18; // Dynamic max speed
        this.ACCEL = 10;           // Acceleration rate
        this.DECEL = 8;            // Deceleration rate
        this.STEER_SPEED = 10;     // Steering rate
        this.GRAVITY = 16;         // Gravity for jumps
        
        // Player & Entities
        this.player = null;
        this.playerPhysics = {
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(0, 0, 0),
            steerAngle: 0,
            targetSteerAngle: 0,
            isJumping: false,
            jumpTime: 0,
            spinTimer: 0,        // For style tricks in the air!
            spinSpeed: 0,
            crashTimer: 0,        // Stun lock timer on hit
            onIce: false,
            inPowder: false
        };
        
        // Input tracking
        this.keys = {};
        this.mouseX = 0;
        this.rightClickPressed = false;
        this.useMouseControl = false;
        
        // Obstacles & Spawning
        this.obstacles = [];
        this.nextSpawnZ = 30;
        this.spawnInterval = 3;    // Meters between obstacle group spawns
        this.roadWidth = 35;       // Steering boundary
        
        // Yeti (Abominable Snow Monster)
        this.yeti = null;
        this.yetiPhysics = {
            pos: new THREE.Vector3(0, 0, 0),
            vel: new THREE.Vector3(0, 0, 0),
            state: 'SLEEPING', // 'SLEEPING', 'CHASING', 'EATING', 'DANCING'
            speed: 21,         // Slightly faster than skier normal speed
            animTime: 0
        };
        this.yetiTriggerDistance = 1500; // Yeti spawns after 1500m (adjusted for fast-paced action!)
        this.yetiWarningTriggered = false;
        
        // Environment
        this.groundTiles = [];
        this.tileSize = 100;
        
        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        
        // Last frame time
        this.lastTime = 0;
        
        // Subsystem managers
        this.particles = null;
    }

    init() {
        // Create Three.js Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xeef2f7); // Crisp white snow sky color
        
        // Fog for fading obstacles in/out
        this.scene.fog = new THREE.FogExp2(0xeef2f7, 0.015);
        
        // Camera setup (30-degree tilt angle)
        // 30 degree tilt means looking down at 60 degrees relative to horizontal ground
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        this.updateCameraPosition();
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
        
        // Lights
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
        this.scene.add(this.ambientLight);
        
        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        this.dirLight.position.set(40, 60, -30); // Warm overhead light casting forward shadows
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 200;
        const d = 40;
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.dirLight.shadow.bias = -0.0005;
        this.scene.add(this.dirLight);
        
        // Initialize particle manager
        this.particles = new ParticleSystemManager(this.scene);
        
        // Create Ground Tiles
        this.createGround();
        
        // Setup Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        window.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // UI Button bindings
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());
        
        const muteBtnMenu = document.getElementById('audio-toggle-menu');
        const muteBtnHud = document.getElementById('hud-mute-btn');
        const restartBtnHud = document.getElementById('hud-restart-btn');
        
        const toggleAudio = () => {
            sound.init(); // Initialize context on first user click
            const isMuted = sound.toggleMute();
            const iconHtml = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
            muteBtnMenu.innerHTML = iconHtml + (isMuted ? ' Audio Off' : ' Audio On');
            muteBtnHud.innerHTML = iconHtml;
            sound.playClick();
        };
        
        muteBtnMenu.addEventListener('click', toggleAudio);
        muteBtnHud.addEventListener('click', toggleAudio);
        restartBtnHud.addEventListener('click', () => {
            sound.playClick();
            this.restartGame();
        });
        
        // Initialize high score display
        this.updateHighScoresMenu();
        
        // Start Render Loop
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }
    
    createGround() {
        // Create 3 repeating ground segments to slide beneath the skier
        const groundGeo = new THREE.PlaneGeometry(this.tileSize * 2, this.tileSize);
        // Slightly shaded snow color
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.0
        });
        
        for (let i = 0; i < 3; i++) {
            const tile = new THREE.Mesh(groundGeo, groundMat);
            tile.rotation.x = -Math.PI / 2; // Flat on X-Z plane
            tile.position.set(0, 0, i * this.tileSize - this.tileSize);
            tile.receiveShadow = true;
            this.scene.add(tile);
            this.groundTiles.push(tile);
        }
    }
    
    updateCameraPosition() {
        if (this.state === 'MENU') {
            // Static menu view
            this.camera.position.set(0, 10, -18);
            this.camera.lookAt(0, 0, 5);
            return;
        }
        
        // Camera follows the player from behind and above.
        // Tilted down 30 degrees (which is 60 degrees from horizontal)
        // Camera target is slightly ahead of the player so they can see obstacles
        const targetCamX = this.playerPhysics.pos.x * 0.7; // Dampen horizontal movement to prevent motion sickness
        const targetCamY = this.playerPhysics.pos.y + 11;
        const targetCamZ = this.playerPhysics.pos.z - 17; // Follow behind
        
        // Apply screen shake
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeIntensity > 0.01) {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
        }
        
        this.camera.position.set(targetCamX + shakeX, targetCamY + shakeY, targetCamZ);
        this.camera.lookAt(this.playerPhysics.pos.x, this.playerPhysics.pos.y + 1.5, this.playerPhysics.pos.z + 8);
    }
    
    startGame() {
        sound.init(); // Initialize audio context on button click
        sound.playClick();
        
        // Hide Menu Overlay, Show HUD
        document.getElementById('menu-screen').classList.remove('active');
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        this.resetGameVariables();
        
        // Create player model
        this.player = AssetBuilder.createSkier();
        this.scene.add(this.player);
        this.playerPhysics.pos.set(0, 0, 0);
        this.playerPhysics.vel.set(0, 0, 0);
        this.player.position.copy(this.playerPhysics.pos);
        
        // Pre-populate some obstacles in front
        this.prePopulateObstacles();
        
        this.state = 'PLAYING';
        sound.startSkierSlide();
    }
    
    showMenu() {
        sound.playClick();
        this.cleanupEntities();
        
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        document.getElementById('menu-screen').classList.add('active');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('yeti-warning').classList.add('hidden');
        
        this.updateHighScoresMenu();
        this.state = 'MENU';
        this.updateCameraPosition();
    }
    
    restartGame() {
        sound.playClick();
        this.cleanupEntities();
        
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('yeti-warning').classList.add('hidden');
        
        this.resetGameVariables();
        
        // Create player
        this.player = AssetBuilder.createSkier();
        this.scene.add(this.player);
        
        this.prePopulateObstacles();
        
        this.state = 'PLAYING';
        sound.startSkierSlide();
    }
    
    resetGameVariables() {
        this.distance = 0;
        this.speed = 0;
        this.targetSpeed = 0;
        this.currentMaxSpeed = this.BASE_MAX_SPEED; // Reset max speed
        this.styleScore = 0;
        this.gatesPassed = 0;
        this.elapsedTime = 0;
        
        this.distRecordBeaten = false;
        this.styleRecordBeaten = false;
        this.playerPhysics.onIce = false;
        this.playerPhysics.inPowder = false;
        
        // Hide game over record badges
        document.getElementById('go-dist-record-badge').classList.add('hidden');
        document.getElementById('go-style-record-badge').classList.add('hidden');
        document.getElementById('record-banner').classList.add('hidden');
        
        this.playerPhysics.pos.set(0, 0, 0);
        this.playerPhysics.vel.set(0, 0, 0);
        this.playerPhysics.steerAngle = 0;
        this.playerPhysics.targetSteerAngle = 0;
        this.playerPhysics.isJumping = false;
        this.playerPhysics.spinTimer = 0;
        this.playerPhysics.spinSpeed = 0;
        this.playerPhysics.crashTimer = 0;
        
        this.yetiWarningTriggered = false;
        this.yetiPhysics.state = 'SLEEPING';
        this.lastYetiResetDistance = 2000;
        
        this.nextSpawnZ = 20;
        
        this.updateHud();
    }
    
    cleanupEntities() {
        // Remove player
        if (this.player) {
            this.scene.remove(this.player);
            this.player = null;
        }
        
        // Remove Yeti
        if (this.yeti) {
            this.scene.remove(this.yeti);
            this.yeti = null;
        }
        
        // Remove obstacles
        for (const obs of this.obstacles) {
            this.scene.remove(obs.mesh);
            // Recursively dispose geometries and materials
            obs.mesh.traverse((node) => {
                if (node.isMesh) {
                    node.geometry.dispose();
                    // Don't dispose builder shared materials, but clone/unique ones is fine.
                    // To be safe, we just let JS garbage collect unless we dynamically created them.
                }
            });
        }
        this.obstacles = [];
        
        // Clear particles
        if (this.particles) {
            this.particles.clear();
        }
        
        sound.stopSkierSlide();
    }
    
    prePopulateObstacles() {
        // Spawn basic trees and rocks ahead, giving the skier a clear starting pad
        for (let z = 30; z < 100; z += 12) {
            this.spawnObstacleRow(z);
        }
        this.nextSpawnZ = 100;
    }
    
    spawnObstacleRow(z) {
        // Determine number of obstacles in this row (increases with distance)
        const diffMultiplier = Math.min(1.0 + (this.distance / 1000), 3.0); // Faster difficulty scaling, caps at 3x
        const spawnChance = 0.60 * diffMultiplier; // Increased base row trigger chance to 60%
        
        if (Math.random() > spawnChance) return;
        
        // Spawn count scales higher with distance: up to 5 max, and minimum rises to 2
        const maxObstacles = Math.min(3 + Math.floor(this.distance / 800), 5); // 3 (<800m), 4 (800-1600m), 5 (1600m+)
        const minObstacles = Math.min(1 + Math.floor(this.distance / 1500), 2); // 1 (<1500m), 2 (1500m+)
        const numObstacles = Math.floor(Math.random() * (maxObstacles - minObstacles + 1)) + minObstacles;
        const gridPositions = [-18, -12, -6, 0, 6, 12, 18];
        
        // Shuffle grid
        gridPositions.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < numObstacles; i++) {
            const xOffset = gridPositions[i] + (Math.random() - 0.5) * 2;
            
            // Choose obstacle type based on 3 distinct difficulty stages
            const dist = this.distance;
            let mesh, type, radius = 0.5, gateColor = "";
            const r = Math.random();
            
            if (dist < 1000) {
                // Stage 1: Beginner (0m - 1000m) - Basic static obstacles
                if (r < 0.45) {
                    const sizeRand = Math.random();
                    const size = sizeRand < 0.2 ? "small" : (sizeRand < 0.85 ? "medium" : "large");
                    mesh = AssetBuilder.createPineTree(size);
                    type = "tree";
                    radius = size === "small" ? 0.35 : (size === "medium" ? 0.55 : 0.85);
                } else if (r < 0.63) {
                    mesh = AssetBuilder.createRock();
                    type = "rock";
                    radius = 0.8;
                } else if (r < 0.75) {
                    mesh = AssetBuilder.createBareTree();
                    type = "tree";
                    radius = 0.4;
                } else if (r < 0.90) {
                    const isRed = Math.random() > 0.5;
                    gateColor = isRed ? "red" : "blue";
                    mesh = AssetBuilder.createSlalomGate(gateColor);
                    type = "gate";
                    radius = 1.8;
                } else {
                    mesh = AssetBuilder.createRamp();
                    type = "ramp";
                    radius = 1.2;
                }
            } else if (dist < 2000) {
                // Stage 2: Intermediate (1000m - 2000m) - Adds terrain elements (Ice & Powder)
                if (r < 0.38) {
                    const sizeRand = Math.random();
                    const size = sizeRand < 0.2 ? "small" : (sizeRand < 0.85 ? "medium" : "large");
                    mesh = AssetBuilder.createPineTree(size);
                    type = "tree";
                    radius = size === "small" ? 0.35 : (size === "medium" ? 0.55 : 0.85);
                } else if (r < 0.53) {
                    mesh = AssetBuilder.createRock();
                    type = "rock";
                    radius = 0.8;
                } else if (r < 0.63) {
                    mesh = AssetBuilder.createBareTree();
                    type = "tree";
                    radius = 0.4;
                } else if (r < 0.78) {
                    const isRed = Math.random() > 0.5;
                    gateColor = isRed ? "red" : "blue";
                    mesh = AssetBuilder.createSlalomGate(gateColor);
                    type = "gate";
                    radius = 1.8;
                } else if (r < 0.88) {
                    mesh = AssetBuilder.createRamp();
                    type = "ramp";
                    radius = 1.2;
                } else if (r < 0.94) {
                    mesh = AssetBuilder.createIcePatch();
                    type = "ice";
                    radius = 1.8;
                } else {
                    mesh = AssetBuilder.createPowderDrift();
                    type = "powder";
                    radius = 1.6;
                }
            } else {
                // Stage 3: Advanced (2000m+) - Full Gauntlet with dynamic hazards (Snowballs & Snowboarders)
                if (r < 0.30) {
                    const sizeRand = Math.random();
                    const size = sizeRand < 0.2 ? "small" : (sizeRand < 0.85 ? "medium" : "large");
                    mesh = AssetBuilder.createPineTree(size);
                    type = "tree";
                    radius = size === "small" ? 0.35 : (size === "medium" ? 0.55 : 0.85);
                } else if (r < 0.44) {
                    mesh = AssetBuilder.createRock();
                    type = "rock";
                    radius = 0.8;
                } else if (r < 0.54) {
                    mesh = AssetBuilder.createBareTree();
                    type = "tree";
                    radius = 0.4;
                } else if (r < 0.66) {
                    const isRed = Math.random() > 0.5;
                    gateColor = isRed ? "red" : "blue";
                    mesh = AssetBuilder.createSlalomGate(gateColor);
                    type = "gate";
                    radius = 1.8;
                } else if (r < 0.76) {
                    mesh = AssetBuilder.createRamp();
                    type = "ramp";
                    radius = 1.2;
                } else if (r < 0.82) {
                    mesh = AssetBuilder.createIcePatch();
                    type = "ice";
                    radius = 1.8;
                } else if (r < 0.88) {
                    mesh = AssetBuilder.createPowderDrift();
                    type = "powder";
                    radius = 1.6;
                } else if (r < 0.94) {
                    mesh = AssetBuilder.createSnowball();
                    type = "snowball";
                    radius = 0.5;
                } else {
                    // Carving Snowboarder (dynamic) - limit to max 2 active simultaneously
                    const activeSnowboardersCount = this.obstacles.filter(obs => obs.type === "snowboarder").length;
                    if (activeSnowboardersCount < 2) {
                        mesh = AssetBuilder.createSnowboarder();
                        type = "snowboarder";
                        radius = 0.8;
                    } else {
                        mesh = AssetBuilder.createPineTree("medium");
                        type = "tree";
                        radius = 0.55;
                    }
                }
            }
            
            const zOffset = (Math.random() - 0.5) * 3;
            const spawnZ = z + zOffset;
            
            // Overlap check to prevent obstacles spawning on top of each other
            let overlaps = false;
            for (const existing of this.obstacles) {
                const dx = xOffset - existing.x;
                const dz = spawnZ - existing.z;
                const distSq = dx * dx + dz * dz;
                const minDistance = radius + existing.radius + 3.0; // sum of radii + 3m buffer
                if (distSq < minDistance * minDistance) {
                    overlaps = true;
                    break;
                }
            }
            
            if (overlaps) {
                continue; // Skip spawning this candidate to keep the run clean!
            }
            
            mesh.position.set(xOffset, 0, spawnZ);
            this.scene.add(mesh);
            
            const obstacleObj = {
                mesh: mesh,
                type: type,
                x: xOffset,
                z: spawnZ,
                radius: radius,
                passed: false, // Used for gate scoring
                gateColor: gateColor,
                hit: false
            };
            
            if (type === "snowball") {
                obstacleObj.scale = 1.0;
            }
            if (type === "snowboarder") {
                obstacleObj.startX = mesh.position.x;
                obstacleObj.carveTime = Math.random() * 5.0; // Random starting phase
            }
            
            this.obstacles.push(obstacleObj);
        }
    }
    
    spawnYeti() {
        this.yeti = AssetBuilder.createYeti();
        this.scene.add(this.yeti);
        
        // Spawn behind player and off to the side
        this.yetiPhysics.pos.set(
            this.playerPhysics.pos.x + (Math.random() > 0.5 ? 12 : -12),
            0,
            this.playerPhysics.pos.z - 20
        );
        this.yeti.position.copy(this.yetiPhysics.pos);
        this.yetiPhysics.state = 'CHASING';
        this.yetiPhysics.animTime = 0;
        
        sound.playYetiRoar();
    }
    
    // Inputs
    
    onMouseMove(e) {
        this.useMouseControl = true;
        // Normalize mouseX: -1 (left screen border) to +1 (right screen border)
        this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    }
    
    onTouchMove(e) {
        this.useMouseControl = true;
        if (e.touches && e.touches.length > 0) {
            this.mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            e.preventDefault(); // Prevent background scrolling
        }
    }
    
    onTouchStart(e) {
        this.useMouseControl = true;
        if (e.touches && e.touches.length > 0) {
            this.mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            
            // Check if tapping on UI buttons
            const target = e.target;
            if (target.tagName !== 'BUTTON' && !target.closest('.overlay-card') && !target.closest('.hud-btn')) {
                this.triggerJump();
                e.preventDefault(); // Prevent double trigger zoom/scrolling
            }
        }
    }
    
    onMouseDown(e) {
        if (e.button === 0) { // Left click
            // Don't jump if clicking on UI buttons/cards
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('.overlay-card')) {
                this.triggerJump();
            }
        } else if (e.button === 2) { // Right click
            this.rightClickPressed = true;
        }
    }
    
    onMouseUp(e) {
        if (e.button === 2) { // Right click release
            this.rightClickPressed = false;
        }
    }
    
    triggerJump() {
        if (this.state !== 'PLAYING') return;
        
        if (!this.playerPhysics.isJumping && this.playerPhysics.crashTimer <= 0) {
            this.playerPhysics.isJumping = true;
            this.playerPhysics.vel.y = 7.0; // Jump force
            sound.playJump();
            
            // Random spin direction for style in the air!
            if (this.keys['a'] || this.keys['arrowleft']) {
                this.playerPhysics.spinSpeed = -14;
            } else if (this.keys['d'] || this.keys['arrowright']) {
                this.playerPhysics.spinSpeed = 14;
            } else {
                this.playerPhysics.spinSpeed = Math.random() > 0.5 ? 8 : -8;
            }
        }
    }
    
    // Window resize
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Loop
    animate(time) {
        requestAnimationFrame((t) => this.animate(t));
        
        let dt = (time - this.lastTime) / 1000;
        if (dt > 0.1) dt = 0.1; // Cap time step on tab unfocus
        this.lastTime = time;
        
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
    }
    
    update(dt) {
        // Environment falling snow updates continuously
        if (this.particles) {
            this.particles.update(dt, this.playerPhysics.pos);
        }
        
        if (this.state === 'MENU') {
            // Simple slow rotation of ground for background visual
            for (let i = 0; i < this.groundTiles.length; i++) {
                this.groundTiles[i].position.z += 1.5 * dt;
                if (this.groundTiles[i].position.z > 80) {
                    this.groundTiles[i].position.z -= 300;
                }
            }
            this.updateCameraPosition();
            return;
        }
        
        this.elapsedTime += dt;
        
        // Mid-run record breaking check
        if (this.state === 'PLAYING') {
            this.checkRecordBreakers();
        }
        
        if (this.state === 'PLAYING' || this.state === 'CRASHED' || this.state === 'EATEN') {
            this.updatePlayerPhysics(dt);
            this.updateYeti(dt);
            this.updateObstacles(dt);
            this.updateGroundInfinite();
            this.updateCameraPosition();
            this.updateHud();
        }
    }
    
    updatePlayerPhysics(dt) {
        if (!this.player) return;
        const physics = this.playerPhysics;
        
        // Reset and check ice/powder overlapping
        physics.onIce = false;
        physics.inPowder = false;
        for (const obs of this.obstacles) {
            if (obs.type === 'ice' || obs.type === 'powder') {
                const dx = physics.pos.x - obs.x;
                const dz = physics.pos.z - obs.z;
                const distSq = dx * dx + dz * dz;
                const radiusSum = obs.radius + 0.25;
                if (distSq < radiusSum * radiusSum) {
                    if (obs.type === 'ice') physics.onIce = true;
                    if (obs.type === 'powder') physics.inPowder = true;
                }
            }
        }
        
        // Handle crash stun countdown
        if (physics.crashTimer > 0) {
            physics.crashTimer -= dt;
            this.speed = Math.max(this.speed - 35 * dt, 0);
            
            // Rest recovery: skier is flat on snow
            this.player.rotation.z = Math.PI / 2.2;
            this.player.rotation.y = Math.PI;
            this.player.position.y = 0.05;
            
            // Skier remains stationary during crash stun
            physics.vel.set(0, 0, 0);
            return;
        }
        
        // 1. Steering logic (ignored in the air/jumping or on ice)
        if (!physics.isJumping && !physics.onIce) {
            // Project player position to screen space to compare cursor position
            const tempV = new THREE.Vector3();
            tempV.copy(physics.pos);
            tempV.project(this.camera); // tempV.x is NDC x (-1 to 1)
            
            // Compare cursor X with player NDC screen X (negated for reversed controls)
            const dx = -(this.mouseX - tempV.x);
            
            // Apply steering away from mouse (reversed control scheme)
            if (Math.abs(dx) < 0.05) {
                physics.targetSteerAngle = 0;
            } else {
                physics.targetSteerAngle = THREE.MathUtils.clamp(dx * 1.8, -0.9, 0.9);
            }
            
            // Smoothly interpolate steering angle
            physics.steerAngle += (physics.targetSteerAngle - physics.steerAngle) * this.STEER_SPEED * dt;
        }
        
        // Slowly build up maximum speed if not braking, crashed, or in deep powder
        if (this.speed > 2 && !physics.isJumping && !physics.inPowder) {
            this.currentMaxSpeed = Math.min(this.currentMaxSpeed + 0.22 * dt, this.PEAK_MAX_SPEED);
        }

        // 2. Speed and Acceleration
        let maxAllowedSpeed = this.currentMaxSpeed;
        let accelerationRate = this.ACCEL;
        
        if (physics.inPowder) {
            // Capped by powder snow (max speed of 108 km/h scaled down to 92 km/h, using 0.85x ratio)
            maxAllowedSpeed = this.currentMaxSpeed * 0.85;
            accelerationRate = -this.DECEL * 2.0; // Moderate slow down
        } else if (Math.abs(physics.steerAngle) > 0.4) {
            // Sharp turning naturally slows player down (retained momentum on ice)
            if (physics.onIce) {
                // No drag on ice!
            } else {
                maxAllowedSpeed = this.currentMaxSpeed * 0.7;
            }
        }
        
        if (physics.isJumping) {
            // Maintain speed in the air, no snow friction deceleration
            accelerationRate = 0;
        }
        
        // Accelerate or decelerate towards target speed
        if (this.speed < maxAllowedSpeed) {
            this.speed = Math.min(this.speed + accelerationRate * dt, maxAllowedSpeed);
        } else if (this.speed > maxAllowedSpeed) {
            const dec = (physics.isJumping) ? 0.5 : this.DECEL;
            this.speed = Math.max(this.speed - dec * 1.5 * dt, maxAllowedSpeed);
        }
        
        // If speed is zero, steering rotation matches steering keys
        
        // Calculate velocities: Z is forward down the mountain, X is sideways
        physics.vel.z = this.speed * Math.cos(physics.steerAngle * 0.35); // Move forward
        physics.vel.x = this.speed * Math.sin(physics.steerAngle * 0.9);   // Side-to-side drift
        
        // 3. Vertical (Jump) physics
        if (physics.isJumping) {
            physics.vel.y -= this.GRAVITY * dt; // Apply gravity
            physics.pos.y += physics.vel.y * dt;
            
            // Handle style spins in the air!
            physics.spinTimer += physics.spinSpeed * dt;
            this.player.rotation.y = physics.spinTimer;
            this.player.rotation.x = -0.15; // Lean forward in jump
            
            // Spray particles less often in air, or none
            
            // Landing check
            if (physics.pos.y <= 0) {
                physics.pos.y = 0;
                physics.isJumping = false;
                physics.vel.y = 0;
                
                // Reward style points for spins on landing
                const fullSpins = Math.floor(Math.abs(physics.spinTimer) / (Math.PI * 2));
                if (fullSpins > 0) {
                    const points = fullSpins * 150;
                    this.styleScore += points;
                    this.triggerSlalomBanner(`TRICK LANDED! +${points}`);
                    sound.playScoreGate();
                }
                
                physics.spinTimer = 0;
                sound.playClick(); // Landing thud
            }
        } else {
            // Ground movement
            physics.pos.y = 0;
            physics.vel.y = 0;
            
            // Set skier rotations based on steering angle
            this.player.rotation.y = physics.steerAngle * 0.8;
            this.player.rotation.z = -physics.steerAngle * 0.4; // Lean into turn
            this.player.rotation.x = 0.15; // Leaning tuck
            
            // Emit ski snow spray particles (heavier in powder drifts!)
            if (this.speed > 2 && this.particles) {
                const trailMultiplier = physics.inPowder ? 4.5 : 1.0;
                this.particles.spawnSnowTrail(physics.pos, (this.speed / this.currentMaxSpeed) * trailMultiplier);
            }
        }
        
        // Update physics position
        physics.pos.x += physics.vel.x * dt;
        physics.pos.z += physics.vel.z * dt;
        
        // Clamping horizontal movement to ski run boundaries
        if (physics.pos.x < -this.roadWidth / 2) {
            physics.pos.x = -this.roadWidth / 2;
            physics.vel.x = 0;
        } else if (physics.pos.x > this.roadWidth / 2) {
            physics.pos.x = this.roadWidth / 2;
            physics.vel.x = 0;
        }
        
        // Update distance (matches skier's Z travel)
        this.distance = Math.floor(physics.pos.z);
        
        // Update player 3D mesh position
        this.player.position.copy(physics.pos);
        
        // Update slide sound volume/frequency
        sound.updateSkierSlide(this.speed / this.currentMaxSpeed, physics.isJumping);
    }
    
    updateYeti(dt) {
        // Trigger warning at distance
        if (this.distance > this.yetiTriggerDistance && !this.yetiWarningTriggered) {
            this.yetiWarningTriggered = true;
            const warningEl = document.getElementById('yeti-warning');
            warningEl.classList.remove('hidden');
            setTimeout(() => {
                warningEl.classList.add('hidden');
            }, 3000);
            
            // Spawn Yeti 5 seconds later or when distance reaches warning + 40
            setTimeout(() => {
                if (this.state === 'PLAYING') {
                    this.spawnYeti();
                }
            }, 2500);
        }
        
        if (!this.yeti) return;
        
        const yPhys = this.yetiPhysics;
        yPhys.animTime += dt * 8; // Animation swing speed
        
        const yetiBody = this.yeti.getObjectByName('yeti');
        const leftArm = this.yeti.getObjectByName('leftArm');
        const rightArm = this.yeti.getObjectByName('rightArm');
        const leftLeg = this.yeti.getObjectByName('leftLeg');
        const rightLeg = this.yeti.getObjectByName('rightLeg');
        const headGroup = this.yeti.getObjectByName('headGroup');
        
        if (yPhys.state === 'CHASING') {
            // Chase logic: move Yeti directly towards Player
            const dir = new THREE.Vector3().copy(this.playerPhysics.pos).sub(yPhys.pos);
            const distToPlayer = dir.length();
            
            // Periodically teleport Yeti closer if player has outrun it by 1500m
            if (this.distance - this.lastYetiResetDistance >= 1500) {
                if (distToPlayer > 18) {
                    yPhys.pos.set(
                        this.playerPhysics.pos.x + (Math.random() > 0.5 ? 10 : -10),
                        0,
                        this.playerPhysics.pos.z - 18
                    );
                    this.yeti.position.copy(yPhys.pos);
                    sound.playYetiRoar();
                    
                    // Flash the warning banner to alert the player
                    const warningEl = document.getElementById('yeti-warning');
                    warningEl.classList.remove('hidden');
                    if (this.yetiResetTimeout) clearTimeout(this.yetiResetTimeout);
                    this.yetiResetTimeout = setTimeout(() => {
                        warningEl.classList.add('hidden');
                    }, 2000);
                    
                    // Recalculate direction and distance after teleportation
                    dir.copy(this.playerPhysics.pos).sub(yPhys.pos);
                }
                this.lastYetiResetDistance = this.distance;
            }
            
            dir.normalize();
            
            // Yeti is slightly faster than skier, but lags in side-to-side steering
            const targetVelX = dir.x * yPhys.speed;
            const targetVelZ = dir.z * yPhys.speed;
            
            yPhys.vel.x += (targetVelX - yPhys.vel.x) * 4 * dt;
            yPhys.vel.z += (targetVelZ - yPhys.vel.z) * 6 * dt;
            
            yPhys.pos.addScaledVector(yPhys.vel, dt);
            this.yeti.position.copy(yPhys.pos);
            
            // Face the player
            this.yeti.rotation.y = Math.atan2(dir.x, dir.z);
            
            // Animate Yeti running (arms swing, legs stomp)
            if (leftArm) leftArm.rotation.x = Math.sin(yPhys.animTime) * 1.0;
            if (rightArm) rightArm.rotation.x = -Math.sin(yPhys.animTime) * 1.0;
            if (leftLeg) leftLeg.rotation.x = -Math.cos(yPhys.animTime) * 0.7;
            if (rightLeg) rightLeg.rotation.x = Math.cos(yPhys.animTime) * 0.7;
            if (headGroup) headGroup.rotation.y = Math.sin(yPhys.animTime * 0.5) * 0.15;
            
            // Catch condition (player within Yeti grasp)
            if (distToPlayer < 1.4 && this.state !== 'EATEN') {
                this.yetiCatchPlayer();
            }
        } else if (yPhys.state === 'EATING') {
            // Yeti eating animation
            if (leftArm) {
                leftArm.rotation.x = -Math.PI / 1.5 + Math.sin(yPhys.animTime * 2) * 0.3;
                leftArm.rotation.z = Math.sin(yPhys.animTime * 2.5) * 0.2;
            }
            if (rightArm) {
                rightArm.rotation.x = -Math.PI / 1.5 - Math.sin(yPhys.animTime * 2) * 0.3;
                rightArm.rotation.z = -Math.sin(yPhys.animTime * 2.5) * 0.2;
            }
            if (headGroup) {
                headGroup.rotation.x = 0.25 + Math.sin(yPhys.animTime * 4) * 0.15; // Munch head shaking
            }
            
            // Spray snow/debris during munching (excessively bloody!)
            if (Math.random() > 0.4 && this.particles) {
                const mouthPos = new THREE.Vector3().copy(yPhys.pos);
                mouthPos.y += 1.1; // Mouth level
                mouthPos.z += 0.3 * Math.cos(this.yeti.rotation.y);
                mouthPos.x += 0.3 * Math.sin(this.yeti.rotation.y);
                this.particles.spawnBloodSplatter(mouthPos, 12);
            }
        } else if (yPhys.state === 'DANCING') {
            // Yeti victory dance
            const hop = Math.abs(Math.sin(yPhys.animTime * 1.2));
            this.yeti.position.y = hop * 0.6;
            
            if (leftArm) {
                leftArm.rotation.x = -Math.PI + Math.sin(yPhys.animTime) * 0.5;
                leftArm.rotation.z = -0.5 + Math.cos(yPhys.animTime) * 0.3;
            }
            if (rightArm) {
                rightArm.rotation.x = -Math.PI + Math.cos(yPhys.animTime) * 0.5;
                rightArm.rotation.z = 0.5 - Math.sin(yPhys.animTime) * 0.3;
            }
            if (leftLeg) leftLeg.rotation.x = 0;
            if (rightLeg) rightLeg.rotation.x = 0;
        }
    }
    
    yetiCatchPlayer() {
        this.state = 'EATEN';
        this.yetiPhysics.state = 'EATING';
        this.yetiPhysics.animTime = 0;
        this.speed = 0;
        
        // Hide player skier model (eaten)
        this.scene.remove(this.player);
        this.player = null;
        
        // Huge initial blood splatter!
        if (this.particles) {
            this.particles.spawnBloodSplatter(this.yetiPhysics.pos, 90);
        }
        
        sound.stopSkierSlide();
        sound.playHit();
        sound.playYetiRoar();
        
        // Trigger camera shake
        this.shakeIntensity = 2.5;
        
        // Animate eating for 3 seconds, then transition to dancing
        setTimeout(() => {
            if (this.yetiPhysics.state === 'EATING') {
                this.yetiPhysics.state = 'DANCING';
                sound.playYetiRoar();
                
                // Show game over card 1.5 seconds into the dance
                setTimeout(() => {
                    this.gameOver("EATEN");
                }, 1500);
            }
        }, 3000);
    }
    
    updateObstacles(dt) {
        const playerZ = this.playerPhysics.pos.z;
        
        // 1. Spawning check (increased ahead distance to 150m to prevent visual pop-in)
        if (playerZ + 150 > this.nextSpawnZ) {
            this.spawnObstacleRow(this.nextSpawnZ);
            this.nextSpawnZ += this.spawnInterval;
        }
        
        // 2. Loop through and update active obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            
            // Recycle obstacles far behind or too far ahead of player (matching the 150m spawn boundary)
            if (obs.z < playerZ - 20 || obs.z > playerZ + 180) {
                this.scene.remove(obs.mesh);
                obs.mesh.traverse((node) => {
                    if (node.isMesh) node.geometry.dispose();
                });
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Skip collision checks if player is already eaten
            if (this.state === 'EATEN' || this.state === 'GAMEOVER') continue;
            
            // Update movement of dynamic obstacles
            if (obs.type === "snowball") {
                if (!obs.hit) {
                    obs.z += 7.5 * dt;
                    obs.scale = (obs.scale || 1.0) + 0.15 * dt;
                    obs.scale = Math.min(obs.scale, 2.4);
                    obs.radius = 0.5 * obs.scale;
                    obs.mesh.scale.setScalar(obs.scale);
                    obs.mesh.position.y = 0.15 * obs.scale; // adjust height
                    
                    // Roll animation
                    const rollMesh = obs.mesh.getObjectByName("snowballMesh");
                    if (rollMesh) rollMesh.rotation.x += 6 * dt;
                    
                    obs.mesh.position.z = obs.z;
                }
            } else if (obs.type === "snowboarder") {
                if (!obs.hit) {
                    obs.z += 10.5 * dt;
                    obs.carveTime = (obs.carveTime || 0) + dt;
                    const carveX = obs.startX + Math.sin(obs.carveTime * 2.2) * 4.0;
                    
                    const prevX = obs.x;
                    obs.x = carveX;
                    const dxCarve = obs.x - prevX;
                    const dzCarve = 10.5 * dt;
                    obs.mesh.rotation.y = Math.atan2(dxCarve, dzCarve);
                    
                    obs.mesh.position.set(obs.x, 0, obs.z);
                } else {
                    // Wiped out snowboarder lies flat on the snow
                    obs.mesh.rotation.x = Math.PI / 2.2;
                }
            }
            
            // Skip collision checks if player is already eaten
            if (this.state === 'EATEN' || this.state === 'GAMEOVER') continue;
            
            // 3. Collision Checks
            const dx = this.playerPhysics.pos.x - obs.x;
            const dz = this.playerPhysics.pos.z - obs.z;
            const distanceSq = dx * dx + dz * dz;
            const radiusSum = obs.radius + 0.25; // Skier radius is ~0.25
            
            // Check heights (must be close to ground to hit standard trees/rocks)
            const isSkierNearGround = this.playerPhysics.pos.y < 0.6;
            
            // Debug check for snowboarder/snowball distance
            if (obs.type === "snowboarder" || obs.type === "snowball") {
                const distance = Math.sqrt(distanceSq);
                if (distance < 5.0) {
                    console.log(`Near dynamic obs! Type: ${obs.type}, Distance: ${distance.toFixed(2)}, RadiusSum: ${radiusSum.toFixed(2)}, isSkierNearGround: ${isSkierNearGround}, PlayerPos: (${this.playerPhysics.pos.x.toFixed(2)}, ${this.playerPhysics.pos.z.toFixed(2)}), ObsPos: (${obs.x.toFixed(2)}, ${obs.z.toFixed(2)})`);
                }
            }
            
            if (distanceSq < radiusSum * radiusSum) {
                
                if (obs.type === "tree" || obs.type === "rock" || obs.type === "snowboarder" || obs.type === "snowball") {
                    if (!obs.hit && isSkierNearGround && this.playerPhysics.crashTimer <= 0) {
                        obs.hit = true;
                        this.triggerCrash(obs);
                        
                        // If snowball, hide the mesh immediately (shattered)
                        if (obs.type === "snowball") {
                            this.scene.remove(obs.mesh);
                            obs.mesh.position.y = -100; // Move off-stage
                        }
                    }
                } else if (obs.type === "ramp") {
                    const relZ = this.playerPhysics.pos.z - obs.z;
                    if (Math.abs(dx) < 1.1 && relZ >= -0.9 && relZ < 1.5 && !this.playerPhysics.isJumping) {
                        
                        // If they are on the slope (between -0.9 and 0.75), slide up visually!
                        if (relZ <= 0.75) {
                            const fraction = (relZ + 0.9) / 1.65; // 1.65 is slope length to peak
                            this.playerPhysics.pos.y = Math.min(fraction, 1) * 0.55;
                            this.player.position.y = this.playerPhysics.pos.y;
                        } else {
                            // If they passed the peak (between 0.75 and 1.5), trigger launch!
                            this.playerPhysics.isJumping = true;
                            this.playerPhysics.vel.y = 9.0; // Big air!
                            this.playerPhysics.pos.y = 0.55;
                            this.player.position.y = 0.55;
                            sound.playJump();
                            
                            this.styleScore += 250;
                            this.triggerSlalomBanner("BIG AIR! +250");
                            
                            // Spin visual trigger
                            this.playerPhysics.spinSpeed = Math.random() > 0.5 ? 16 : -16;
                        }
                    }
                } else if (obs.type === "gate") {
                    // Slalom gate passing check
                    // A slalom gate has two poles spaced 3.5 units apart.
                    // The center is obs.x. The left pole is obs.x - 1.75, right pole is obs.x + 1.75.
                    // Collision with poles directly:
                    const leftPoleDx = this.playerPhysics.pos.x - (obs.x - 1.75);
                    const rightPoleDx = this.playerPhysics.pos.x - (obs.x + 1.75);
                    const isHittingLeftPole = (leftPoleDx * leftPoleDx + dz * dz) < 0.15;
                    const isHittingRightPole = (rightPoleDx * rightPoleDx + dz * dz) < 0.15;
                    
                    if (!obs.hit && isSkierNearGround && (isHittingLeftPole || isHittingRightPole) && this.playerPhysics.crashTimer <= 0) {
                        obs.hit = true;
                        this.triggerCrash(obs);
                    } else if (dz > 0 && !obs.passed) {
                        // Player skied past the Z line of the gate.
                        // Were they between the poles?
                        if (Math.abs(dx) < 1.75) {
                            obs.passed = true;
                            this.gatesPassed++;
                            
                            const comboPoints = 100 + (this.gatesPassed * 25);
                            this.styleScore += comboPoints;
                            
                            this.triggerSlalomBanner(`GATE PASSED! +${comboPoints}`);
                            sound.playScoreGate();
                            
                            // Visual color flash on flags (temporarily)
                            obs.mesh.traverse((node) => {
                                if (node.isMesh && node.material.color) {
                                    node.material.color.setHex(0xffd700); // Glow gold
                                }
                            });
                        } else {
                            // Missed the gate! Marks gate passed but no points
                            obs.passed = true;
                        }
                    }
                }
            }
        }
    }
    
    triggerCrash(obstacle) {
        this.state = 'CRASHED';
        this.speed = 0;
        this.currentMaxSpeed = this.BASE_MAX_SPEED; // Reset max speed on crash!
        this.playerPhysics.crashTimer = 1.0; // Stunned for 1s
        this.playerPhysics.vel.set(0, 0, 0);
        
        sound.playHit();
        sound.stopSkierSlide();
        
        // Spawn particle debris based on obstacle type
        let particleColor = 0x5c4033; // Brown wood
        if (obstacle.type === "rock") particleColor = 0x70777a; // Grey rock
        if (obstacle.type === "gate") particleColor = obstacle.gateColor === "red" ? 0xef4444 : 0x3b82f6;
        if (obstacle.type === "snowball") particleColor = 0xe2e8f0; // White snow chunks
        if (obstacle.type === "snowboarder") particleColor = 0xdb2777; // Pink board chunks
        
        if (this.particles) {
            this.particles.spawnDebris(this.playerPhysics.pos, particleColor, 15);
            // Spawn snow burst
            this.particles.spawnDebris(this.playerPhysics.pos, 0xffffff, 10);
            // Spawn some blood spray for no reason!
            this.particles.spawnBloodSplatter(this.playerPhysics.pos, 15);
        }
        
        // Screen shake
        this.shakeIntensity = 0.65;
        
        // Recover after 1 second
        setTimeout(() => {
            if (this.state === 'CRASHED') {
                this.state = 'PLAYING';
                this.player.rotation.set(0, 0, 0); // Restore rotation
                sound.startSkierSlide();
            }
        }, 1000);
    }
    
    updateGroundInfinite() {
        const playerZ = this.playerPhysics.pos.z;
        
        // Shift tiles forward as player skis down
        for (let i = 0; i < this.groundTiles.length; i++) {
            const tile = this.groundTiles[i];
            
            // If the tile is behind the player's view, shift it to the front
            if (tile.position.z < playerZ - this.tileSize) {
                tile.position.z += this.tileSize * 3; // Shift 3 tiles forward
            }
        }
        
        // Move directional light to follow the player in Z (keeping relative lighting constant)
        this.dirLight.position.set(
            this.playerPhysics.pos.x + 40,
            60,
            this.playerPhysics.pos.z - 30
        );
        if (this.player) {
            this.dirLight.target = this.player;
        }
    }
    
    triggerSlalomBanner(text) {
        const banner = document.getElementById('slalom-banner');
        const textSpan = document.getElementById('slalom-text');
        textSpan.innerText = text;
        banner.classList.remove('active');
        // Force reflow
        void banner.offsetWidth;
        banner.classList.add('active');
    }
    
    updateHud() {
        document.getElementById('hud-distance').innerHTML = `${this.distance}<small>m</small>`;
        
        // Visual speed in km/h is simulated from units/sec
        const kmh = Math.floor(this.speed * 4.5);
        document.getElementById('hud-speed').innerHTML = `${kmh}<small>km/h</small>`;
        document.getElementById('hud-style').innerText = this.styleScore;
        document.getElementById('hud-gates').innerText = this.gatesPassed;
    }
    
    gameOver(cause) {
        this.state = 'GAMEOVER';
        this.cleanupEntities();
        
        const finalScore = this.distance + this.styleScore + (this.gatesPassed * 200);
        
        // Track record updates
        let newDistRecord = false;
        let newStyleRecord = false;
        
        if (this.distance > this.bestDistance) {
            this.bestDistance = this.distance;
            localStorage.setItem('ski3d_best_distance', this.bestDistance);
            newDistRecord = true;
        }
        
        if (this.styleScore > this.bestStyle) {
            this.bestStyle = this.styleScore;
            localStorage.setItem('ski3d_best_style', this.bestStyle);
            newStyleRecord = true;
        }
        
        // Check overall personal best
        if (finalScore > this.highScore) {
            this.highScore = finalScore;
            localStorage.setItem('ski3d_pb', this.highScore);
        }
        
        // Show game over overlay
        const screen = document.getElementById('game-over-screen');
        screen.classList.remove('hidden');
        screen.classList.add('active');
        document.getElementById('hud').classList.add('hidden');
        
        // Setup texts
        const titleEl = document.getElementById('game-over-title');
        const subEl = document.getElementById('game-over-subtitle');
        
        if (cause === "EATEN") {
            titleEl.innerText = "EATEN!";
            titleEl.style.color = "var(--accent-pink)";
            titleEl.style.textShadow = "var(--glow-pink)";
            subEl.innerText = "The Abominable Snowman had a nice snack.";
        } else {
            titleEl.innerText = "GAME OVER";
            titleEl.style.color = "var(--danger-red)";
            titleEl.style.textShadow = "0 0 15px rgba(239, 68, 68, 0.4)";
            subEl.innerText = "You crashed one time too many.";
        }
        
        // Update stats values
        document.getElementById('go-distance').innerText = `${this.distance}m`;
        document.getElementById('go-style').innerText = this.styleScore;
        document.getElementById('go-gates').innerText = this.gatesPassed;
        document.getElementById('go-total').innerText = finalScore;
        
        // Wii Sports Record Stamps Slam Activation
        if (newDistRecord) {
            const badge = document.getElementById('go-dist-record-badge');
            badge.classList.remove('hidden');
        }
        if (newStyleRecord) {
            const badge = document.getElementById('go-style-record-badge');
            badge.classList.remove('hidden');
        }
        
        // Play record sound fanfare if any record was broken!
        if (newDistRecord || newStyleRecord) {
            sound.playNewRecordFanfare();
        }
    }

    updateHighScoresMenu() {
        this.bestDistance = parseInt(localStorage.getItem('ski3d_best_distance')) || 0;
        this.bestStyle = parseInt(localStorage.getItem('ski3d_best_style')) || 0;
        
        document.getElementById('pb-distance').innerText = this.bestDistance + ' m';
        document.getElementById('pb-style').innerText = this.bestStyle + ' pts';
    }

    checkRecordBreakers() {
        // Distance record check
        if (this.bestDistance > 0 && this.distance > this.bestDistance && !this.distRecordBeaten) {
            this.distRecordBeaten = true;
            this.triggerRecordBanner("NEW DISTANCE RECORD!");
            sound.playNewRecordFanfare();
        }
        
        // Style record check
        if (this.bestStyle > 0 && this.styleScore > this.bestStyle && !this.styleRecordBeaten) {
            this.styleRecordBeaten = true;
            this.triggerRecordBanner("NEW STYLE RECORD!");
            sound.playNewRecordFanfare();
        }
    }

    triggerRecordBanner(text) {
        const banner = document.getElementById('record-banner');
        const bannerText = document.getElementById('record-banner-text');
        
        bannerText.innerText = text;
        banner.classList.remove('hidden');
        
        // Force reflow to restart CSS animation
        banner.style.animation = 'none';
        void banner.offsetHeight;
        banner.style.animation = 'recordSlideIn 2.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
        
        if (this.recordTimeout) clearTimeout(this.recordTimeout);
        this.recordTimeout = setTimeout(() => {
            banner.classList.add('hidden');
        }, 2200);
    }
}

// Instantiate and start game controller when window loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
    window.game.init();
});
