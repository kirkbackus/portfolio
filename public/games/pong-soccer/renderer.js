/**
 * Three.js 3D Renderer (renderer.js)
 * Manages the WebGL scene, isometric camera, low-poly N64 models, textures, animations, and particle VFX.
 */

const Renderer = {
    scene: null,
    camera: null,
    renderer: null,
    
    // Meshes
    paddles: {},
    ballMesh: null,
    trailSpheres: [],
    maxTrailLength: 8,
    trailHistory: [],
    
    // Stadium Meshes
    netLeft: null,
    netRight: null,
    flagLeftPole: null,
    flagRightPole: null,
    flagLeft: null,
    flagRight: null,

    // Net jiggle animation states
    netJiggleLeft: 0,
    netJiggleRight: 0,

    // Particles
    particles: [],

    // Paddle spring-damper impact deformation states
    paddleSprings: {
        pinkGk: { compression: 0, velocity: 0, hitZ: 0, stiffness: 250, damping: 18 },
        blueFw: { compression: 0, velocity: 0, hitZ: 0, stiffness: 250, damping: 18 },
        redFw: { compression: 0, velocity: 0, hitZ: 0, stiffness: 250, damping: 18 },
        pinkGkAI: { compression: 0, velocity: 0, hitZ: 0, stiffness: 250, damping: 18 }
    },

    // Camera settings
    baseCamPos: { x: 0, y: 26, z: 15 }, // Adjusted for isometric orthographic viewport

    init(container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x3a2312); // Deep brown dirt stadium background color

        // 2. Camera (Orthographic for isometric 2D look)
        const aspect = width / height;
        const viewSize = 25.0; // Fits the width=40, height=22 arena nicely
        this.camera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 1000
        );
        this.camera.position.set(this.baseCamPos.x, this.baseCamPos.y, this.baseCamPos.z);
        this.camera.lookAt(0, -2, 0);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Resize Listener
        window.addEventListener('resize', () => this.onWindowResize(container));

        // 4. Lighting (Flat, bright 90s console aesthetic)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.55);
        dirLight.position.set(5, 30, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.left = -25;
        dirLight.shadow.camera.right = 25;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 50;
        this.scene.add(dirLight);

        // Build Environment
        this.buildStadium();
        this.createPaddles();
        this.createBall();
        this.createVFXPools();
    },

    onWindowResize(container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const aspect = width / height;
        const viewSize = 25.0;

        this.camera.left = -viewSize * aspect;
        this.camera.right = viewSize * aspect;
        this.camera.top = viewSize;
        this.camera.bottom = -viewSize;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    },

    // Build the N64 Stadium and Soccer Pitch
    buildStadium() {
        const arenaW = 40.0;
        const arenaH = 22.0;

        // 1. Dirt Outer Ring / Track
        const trackGeo = new THREE.PlaneGeometry(54, 32);
        const trackMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 }); // Light brown dirt
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = -Math.PI / 2;
        track.position.y = -0.05; // Slightly below grass
        track.receiveShadow = true;
        this.scene.add(track);

        // 2. Striped Grass Pitch (10 alternating light/dark green vertical stripes)
        const stripeWidth = arenaW / 10;
        for (let i = 0; i < 10; i++) {
            const stripeGeo = new THREE.PlaneGeometry(stripeWidth, arenaH);
            const isLight = i % 2 === 0;
            const stripeMat = new THREE.MeshLambertMaterial({ 
                color: isLight ? 0x2e8b57 : 0x228b22 // SeaGreen and ForestGreen
            });
            const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
            stripeMesh.rotation.x = -Math.PI / 2;
            // Place stripes sequentially along X
            stripeMesh.position.set(-arenaW / 2 + stripeWidth / 2 + (i * stripeWidth), 0, 0);
            stripeMesh.receiveShadow = true;
            this.scene.add(stripeMesh);
        }

        // 3. Field Lines (White markers)
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Midfield Center Circle (Low-Poly Cylinder)
        const centerCircleGeo = new THREE.RingGeometry(4.4, 4.6, 24);
        const centerCircle = new THREE.Mesh(centerCircleGeo, lineMat);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.set(0, 0.01, 0);
        this.scene.add(centerCircle);

        // Midfield Center Dot
        const centerDotGeo = new THREE.CircleGeometry(0.5, 8);
        const centerDot = new THREE.Mesh(centerDotGeo, lineMat);
        centerDot.rotation.x = -Math.PI / 2;
        centerDot.position.set(0, 0.01, 0);
        this.scene.add(centerDot);

        // Midfield Line
        const midLineGeo = new THREE.PlaneGeometry(0.2, arenaH);
        const midLine = new THREE.Mesh(midLineGeo, lineMat);
        midLine.rotation.x = -Math.PI / 2;
        midLine.position.set(0, 0.01, 0);
        this.scene.add(midLine);

        // Border Boundary Lines (Outer boundary)
        const borderLines = [
            { w: arenaW, h: 0.2, x: 0, z: -arenaH/2 },
            { w: arenaW, h: 0.2, x: 0, z: arenaH/2 },
            // Left/right borders (broken by goals at center Z = -4 to 4)
            { w: 0.2, h: (arenaH - 8) / 2, x: -arenaW/2, z: -arenaH/4 - 2 },
            { w: 0.2, h: (arenaH - 8) / 2, x: -arenaW/2, z: arenaH/4 + 2 },
            { w: 0.2, h: (arenaH - 8) / 2, x: arenaW/2, z: -arenaH/4 - 2 },
            { w: 0.2, h: (arenaH - 8) / 2, x: arenaW/2, z: arenaH/4 + 2 }
        ];

        borderLines.forEach(line => {
            const geo = new THREE.PlaneGeometry(line.w, line.h);
            const mesh = new THREE.Mesh(geo, lineMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(line.x, 0.01, line.z);
            this.scene.add(mesh);
        });

        // Penalty Box Lines
        // Left Penalty Box
        const penBoxLeftGeo = new THREE.RingGeometry(0, 0, 4); // Dummy wrapper or draw individual lines
        const drawBox = (xSign) => {
            const x = xSign * (arenaW/2 - 3.5);
            // Front line
            const fGeo = new THREE.PlaneGeometry(0.2, 10);
            const fMesh = new THREE.Mesh(fGeo, lineMat);
            fMesh.rotation.x = -Math.PI / 2;
            fMesh.position.set(x, 0.01, 0);
            this.scene.add(fMesh);
            // Side lines
            const sGeo = new THREE.PlaneGeometry(3.5, 0.2);
            
            const sMesh1 = new THREE.Mesh(sGeo, lineMat);
            sMesh1.rotation.x = -Math.PI / 2;
            sMesh1.position.set(xSign * (arenaW/2 - 1.75), 0.01, -5.0);
            this.scene.add(sMesh1);

            const sMesh2 = new THREE.Mesh(sGeo, lineMat);
            sMesh2.rotation.x = -Math.PI / 2;
            sMesh2.position.set(xSign * (arenaW/2 - 1.75), 0.01, 5.0);
            this.scene.add(sMesh2);
        };
        drawBox(-1); // Left
        drawBox(1);  // Right

        // 4. White Boundary Walls
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
        const wallH = 1.0;
        const wallThickness = 0.5;

        // Long top/bottom walls
        const wallTopGeo = new THREE.BoxGeometry(arenaW + wallThickness, wallH, wallThickness);
        const wallTop = new THREE.Mesh(wallTopGeo, wallMat);
        wallTop.position.set(0, wallH/2, -arenaH/2 - wallThickness/2);
        wallTop.castShadow = true;
        wallTop.receiveShadow = true;
        this.scene.add(wallTop);

        const wallBottom = wallTop.clone();
        wallBottom.position.z = arenaH/2 + wallThickness/2;
        this.scene.add(wallBottom);

        // Side walls (above and below goals)
        const wallSideHeight = (arenaH - 8) / 2; // goal is 8 wide
        const wallSideGeo = new THREE.BoxGeometry(wallThickness, wallH, wallSideHeight);
        
        // Left walls
        const wallLeftTop = new THREE.Mesh(wallSideGeo, wallMat);
        wallLeftTop.position.set(-arenaW/2 - wallThickness/2, wallH/2, -arenaH/2 + wallSideHeight/2);
        wallLeftTop.castShadow = true;
        this.scene.add(wallLeftTop);

        const wallLeftBottom = wallLeftTop.clone();
        wallLeftBottom.position.z = arenaH/2 - wallSideHeight/2;
        this.scene.add(wallLeftBottom);

        // Right walls
        const wallRightTop = wallLeftTop.clone();
        wallRightTop.position.x = arenaW/2 + wallThickness/2;
        this.scene.add(wallRightTop);

        const wallRightBottom = wallLeftBottom.clone();
        wallRightBottom.position.x = arenaW/2 + wallThickness/2;
        this.scene.add(wallRightBottom);

        // 5. Goal Net Assemblies (Left & Right)
        const buildGoalAssembly = (isRight) => {
            const xSign = isRight ? 1 : -1;
            const goalGroup = new THREE.Group();
            goalGroup.position.set(xSign * arenaW / 2, 0, 0);

            // Goal frame (Low-poly tubes modeled with thin boxes)
            const frameMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const postG = new THREE.BoxGeometry(0.3, 3.2, 0.3);
            const crossbarG = new THREE.BoxGeometry(0.3, 0.3, 8.3);

            const post1 = new THREE.Mesh(postG, frameMat);
            post1.position.set(0, 1.6, -4.0);
            post1.castShadow = true;
            goalGroup.add(post1);

            const post2 = post1.clone();
            post2.position.z = 4.0;
            goalGroup.add(post2);

            const crossbar = new THREE.Mesh(crossbarG, frameMat);
            crossbar.position.set(0, 3.2 - 0.15, 0);
            crossbar.castShadow = true;
            goalGroup.add(crossbar);

            // Behind support frame
            const depthSupportG = new THREE.BoxGeometry(1.6, 0.2, 0.2);
            const backPostG = new THREE.BoxGeometry(0.2, 3.2, 0.2);

            const support1 = new THREE.Mesh(depthSupportG, frameMat);
            support1.position.set(xSign * 0.8, 0.1, -4.0);
            goalGroup.add(support1);

            const support2 = support1.clone();
            support2.position.z = 4.0;
            goalGroup.add(support2);

            const backPost1 = new THREE.Mesh(backPostG, frameMat);
            backPost1.position.set(xSign * 1.6, 1.6, -4.0);
            goalGroup.add(backPost1);

            const backPost2 = backPost1.clone();
            backPost2.position.z = 4.0;
            goalGroup.add(backPost2);

            const backCross = new THREE.Mesh(crossbarG, frameMat);
            backCross.position.set(xSign * 1.6, 3.2 - 0.15, 0);
            goalGroup.add(backCross);

            // Net Mesh (transparent box with wireframe overlay)
            const netGeo = new THREE.BoxGeometry(1.6, 3.2, 8.0);
            const netMat = new THREE.MeshBasicMaterial({ 
                color: 0xcccccc, 
                transparent: true, 
                opacity: 0.18,
                wireframe: true // creates a nice grid pattern
            });
            const netMesh = new THREE.Mesh(netGeo, netMat);
            netMesh.position.set(xSign * 0.8, 1.6, 0);
            goalGroup.add(netMesh);

            // Corner Flags
            const flagPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5);
            const poleMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b }); // wooden pole
            
            const flagPole = new THREE.Mesh(flagPoleGeo, poleMat);
            flagPole.position.set(0, 3.2 + 0.75, -4.0);
            goalGroup.add(flagPole);

            const flagGeo = new THREE.BufferGeometry();
            // Triangle vertices relative to pole top
            const vertices = new Float32Array([
                0.0, 3.2 + 1.5, -4.0,  // top pole point
                xSign * 0.8, 3.2 + 1.1, -4.0, // tip of flag
                0.0, 3.2 + 0.7, -4.0   // lower pole point
            ]);
            flagGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            const flagMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
            const flag = new THREE.Mesh(flagGeo, flagMat);
            goalGroup.add(flag);

            this.scene.add(goalGroup);

            // Keep reference to net and flag for animations
            if (isRight) {
                this.netRight = netMesh;
                this.flagRight = flag;
            } else {
                this.netLeft = netMesh;
                this.flagLeft = flag;
            }
        };

        buildGoalAssembly(false); // Left goal
        buildGoalAssembly(true);  // Right goal

        // 6. N64 Stadium Seating Backdrop (Outer ring of colored box rows)
        const seatingGroup = new THREE.Group();
        
        // Draw an octagon of blocky colorful seats
        const colors = [0xe60012, 0x00a0e9, 0xffd900, 0x009944]; // Nintendo colors
        const radius = 35;
        const steps = 16;
        
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * (radius * 0.75); // elliptical to fit arena ratio
            
            const standGeo = new THREE.BoxGeometry(8, 4, 3);
            const standMat = new THREE.MeshLambertMaterial({ 
                color: colors[i % colors.length] 
            });
            const stand = new THREE.Mesh(standGeo, standMat);
            stand.position.set(x, 1.9, z);
            stand.rotation.y = -angle + Math.PI/2;
            seatingGroup.add(stand);

            // Add a lower tier
            const lowerGeo = new THREE.BoxGeometry(8, 2, 2);
            const lowerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const lowerStand = new THREE.Mesh(lowerGeo, lowerMat);
            lowerStand.position.set(Math.cos(angle)*(radius-2.5), 0.9, Math.sin(angle)*(radius*0.75-2.5));
            lowerStand.rotation.y = -angle + Math.PI/2;
            seatingGroup.add(lowerStand);
        }
        this.scene.add(seatingGroup);
    },

    // Create custom rounded box geometries for paddles
    createPaddleGeometry(width, height, depth, radius) {
        const shape = new THREE.Shape();
        // Rounded corners
        shape.moveTo(-width/2 + radius, -height/2);
        shape.lineTo(width/2 - radius, -height/2);
        shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
        shape.lineTo(width/2, height/2 - radius);
        shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
        shape.lineTo(-width/2 + radius, height/2);
        shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
        shape.lineTo(-width/2, -height/2 + radius);
        shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

        const extrudeSettings = {
            depth: depth,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.04,
            bevelThickness: 0.04
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Center geometry
        geom.center();
        // Rotate so it lies horizontal on Z-plane (width along X, height along Z)
        geom.rotateX(Math.PI / 2);
        return geom;
    },

    // Create 3D paddle meshes
    createPaddles() {
        const pw = 1.2;
        const ph = 4.0;
        const pd = 0.9;

        // Paddle Materials
        const mats = {
            pinkGk: new THREE.MeshPhongMaterial({ color: 0xff69b4, shininess: 30 }),    // Hot Pink
            redFw: new THREE.MeshPhongMaterial({ color: 0xff3b30, shininess: 30 }),     // Red
            blueFw: new THREE.MeshPhongMaterial({ color: 0x007aff, shininess: 30 }),    // Blue
            pinkGkAI: new THREE.MeshPhongMaterial({ color: 0x8a2be2, shininess: 30 }) // Purple
        };

        // Instantiate
        for (const [key, material] of Object.entries(mats)) {
            // BoxGeometry with 16 segments along Z-axis (height) for smooth elastic deformation
            const geom = new THREE.BoxGeometry(pw, pd, ph, 1, 1, 16);
            const mesh = new THREE.Mesh(geom, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.y = pd / 2; // Sit on field
            
            // Store original vertex positions for deformation
            mesh.userData.originalPositions = new Float32Array(geom.attributes.position.array);
            
            this.scene.add(mesh);
            this.paddles[key] = mesh;
        }
    },

    // Create procedural classic black & white soccer ball
    createBall() {
        const radius = 0.6;
        // Segment count is low (12, 10) for blocky low-poly N64 aesthetic!
        const ballGeo = new THREE.SphereGeometry(radius, 12, 10);
        
        // Procedurally draw soccer pattern onto canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 128);

        // Draw classic pentagon dot grid
        ctx.fillStyle = '#111111';
        const spots = [
            [32, 32, 16], [96, 32, 16], [160, 32, 16], [224, 32, 16],
            [0, 96, 16], [64, 96, 16], [128, 96, 16], [192, 96, 16], [256, 96, 16]
        ];
        spots.forEach(([x, y, r]) => {
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        const ballMat = new THREE.MeshPhongMaterial({ 
            map: texture, 
            shininess: 40,
            flatShading: true // flat faces matches retro style
        });

        this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
        this.ballMesh.castShadow = true;
        this.ballMesh.position.set(0, radius, 0);
        this.scene.add(this.ballMesh);
    },

    // Pre-create pools for particle VFX and motion trails
    createVFXPools() {
        // 1. Ball Trail Spheres (Pool of 8 fading translucent spheres)
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        const trailGeo = new THREE.SphereGeometry(0.35, 8, 6);

        for (let i = 0; i < this.maxTrailLength; i++) {
            const sphere = new THREE.Mesh(trailGeo, trailMat.clone());
            // Gradually shrink and fade out along the chain
            const ratio = (this.maxTrailLength - i) / this.maxTrailLength;
            sphere.scale.setScalar(ratio);
            sphere.material.opacity = ratio * 0.16;
            sphere.visible = false;
            
            this.scene.add(sphere);
            this.trailSpheres.push(sphere);
        }

        // 2. Goal Celebration Particles Pool (40 particles)
        const particleGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        
        for (let i = 0; i < 45; i++) {
            const pMat = new THREE.MeshBasicMaterial({ 
                color: colors[i % colors.length] 
            });
            const pMesh = new THREE.Mesh(particleGeo, pMat);
            pMesh.visible = false;
            this.scene.add(pMesh);
            
            this.particles.push({
                mesh: pMesh,
                vx: 0, vy: 0, vz: 0,
                life: 0
            });
        }
    },

    // Trigger explosive goal particles
    triggerGoalParticles(goalX, goalZ) {
        this.particles.forEach(p => {
            p.mesh.position.set(goalX, 1.0, goalZ);
            p.mesh.visible = true;
            
            // Random explosion velocity vector
            const angle = Math.random() * Math.PI * 2;
            const speed = 4.0 + Math.random() * 8.0;
            const spreadX = (goalX > 0) ? -1 : 1; // blow out of the goal
            
            p.vx = (spreadX * Math.abs(Math.cos(angle)) * 0.6 + (Math.random() * 2 - 1) * 0.4) * speed;
            p.vy = (0.3 + Math.random() * 0.7) * speed * 1.5;
            p.vz = Math.sin(angle) * speed;
            p.life = 1.0; // Life starts at 1.0 and decays
        });
    },

    // Trigger goal net shake animation
    triggerNetJiggle(side) {
        if (side === 'left') {
            this.netJiggleLeft = 1.0;
        } else {
            this.netJiggleRight = 1.0;
        }
    },

    // Sync gameplay positions to meshes, run spring-damper impact deformations and materials glow
    updatePaddles(pData, dt) {
        dt = dt || 0.01667;

        this.paddles.pinkGk.position.x = pData.pinkGk.x;
        this.paddles.pinkGk.position.z = pData.pinkGk.z;
        
        this.paddles.redFw.position.x = pData.redFw.x;
        this.paddles.redFw.position.z = pData.redFw.z;
        
        this.paddles.blueFw.position.x = pData.blueFw.x;
        this.paddles.blueFw.position.z = pData.blueFw.z;
        
        this.paddles.pinkGkAI.position.x = pData.pinkGkAI.x;
        this.paddles.pinkGkAI.position.z = pData.pinkGkAI.z;

        // Update spring-damper systems and apply deformation to each paddle mesh
        for (const [key, spring] of Object.entries(this.paddleSprings)) {
            const mesh = this.paddles[key];
            if (!mesh) continue;

            // Spring simulation: target compression is 0 (uncompressed state)
            const a = -spring.stiffness * spring.compression - spring.damping * spring.velocity;
            spring.velocity += a * dt;
            spring.compression += spring.velocity * dt;

            // Decay emissive highlight and specular shininess
            if (mesh.material) {
                // Decay emissive glow
                const curEmissive = mesh.material.emissive.r;
                if (curEmissive > 0.01) {
                    const newInt = Math.max(0, curEmissive - dt * 2.5); // decay over ~0.4s
                    mesh.material.emissive.setRGB(newInt, newInt, newInt);
                } else {
                    mesh.material.emissive.setHex(0x000000);
                }

                // Decay shininess back to default 30
                if (mesh.material.shininess > 30) {
                    mesh.material.shininess = Math.max(30, mesh.material.shininess - dt * 350);
                }
            }

            // Apply localized Gaussian deformation on the mesh geometry
            const geometry = mesh.geometry;
            if (geometry && geometry.attributes.position && mesh.userData.originalPositions) {
                const posAttr = geometry.attributes.position;
                const arr = posAttr.array;
                const orig = mesh.userData.originalPositions;
                const count = posAttr.count;

                const compression = spring.compression;
                const hitZ = spring.hitZ;
                
                const paddleHeight = 4.0;
                const sigma = paddleHeight / 3.5; // falloff spread

                for (let i = 0; i < count; i++) {
                    const x = orig[i * 3];
                    const y = orig[i * 3 + 1];
                    const z = orig[i * 3 + 2];

                    // Distance from hit position on vertical axis (Z)
                    const dz = z - hitZ;
                    const falloff = Math.exp(-(dz * dz) / (2 * sigma * sigma));

                    // Compress width (X) towards center line
                    const newX = x * (1.0 - compression * falloff);

                    // Expand length (Z) to preserve volume
                    const newZ = z + (z - hitZ) * (compression * 0.22 * falloff);

                    arr[i * 3] = newX;
                    arr[i * 3 + 2] = newZ;
                }
                posAttr.needsUpdate = true;
            }
        }
    },

    // Trigger local soft-body compression animation on ball impact
    triggerPaddleImpact(key, relativeHitZ, ballSpeed) {
        const spring = this.paddleSprings[key];
        if (!spring) return;

        // Calculate impact strength from ball speed (Slow: 3%, Med: 6%, Fast: 10%, Max: 12-15%)
        // Base speed is 16.0
        let strength = 0.03;
        if (ballSpeed > 30.0) {
            strength = 0.14;
        } else if (ballSpeed > 24.0) {
            strength = 0.10;
        } else if (ballSpeed > 16.0) {
            strength = 0.06;
        }

        // Set local contact point along the Z axis (clamped to paddle bounds [-2.0, 2.0])
        spring.hitZ = Math.max(-2.0, Math.min(2.0, relativeHitZ));

        // Start compression velocity (positive compression drives it inward)
        spring.velocity = strength * 60; // Kickstart spring

        // Visual flash overlay on materials
        const mesh = this.paddles[key];
        if (mesh && mesh.material) {
            // Brighten with emissive glow
            mesh.material.emissive.setHex(0x444444);
            mesh.material.shininess = 120; // boost specular highlight
        }
    },

    updateBall(ballData) {
        const lastX = this.ballMesh.position.x;
        const lastZ = this.ballMesh.position.z;

        // Update ball coordinates
        this.ballMesh.position.x = ballData.x;
        this.ballMesh.position.z = ballData.z;

        // Apply rolling rotation proportional to movement direction/distance
        const dx = ballData.x - lastX;
        const dz = ballData.z - lastZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.001) {
            const rollSpeed = dist / ballData.radius;
            // Rotation axis is perpendicular to travel direction vector
            const axisX = dz / dist;
            const axisZ = -dx / dist;
            
            const q = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(axisX, 0, axisZ), 
                rollSpeed
            );
            this.ballMesh.quaternion.premultiply(q);
        }

        // Apply motion trail behind the ball
        // Insert current position to history
        this.trailHistory.unshift({ x: ballData.x, z: ballData.z });
        if (this.trailHistory.length > this.maxTrailLength * 3) {
            this.trailHistory.pop();
        }

        // Place trail spheres at historic intervals
        // We only show trails if the ball is moving at high speed (> 18)
        const isHighSpeed = ballData.speed > 18;
        
        this.trailSpheres.forEach((sphere, idx) => {
            const historyIdx = (idx + 1) * 2;
            if (isHighSpeed && this.trailHistory[historyIdx]) {
                const pos = this.trailHistory[historyIdx];
                sphere.position.set(pos.x, ballData.radius, pos.z);
                sphere.visible = true;
            } else {
                sphere.visible = false;
            }
        });
    },

    // Apply sinusoidal camera idle sway and update visual effect timers
    setCameraSway(timeSeconds) {
        // Subtle sinusoidal sway
        const horizontalSway = Math.sin(timeSeconds * 0.8) * 0.15;
        const verticalSway = Math.cos(timeSeconds * 0.95) * 0.08;
        const rotationSway = Math.sin(timeSeconds * 0.7) * (0.15 * Math.PI / 180);

        this.camera.position.x = this.baseCamPos.x + horizontalSway;
        this.camera.position.z = this.baseCamPos.z + verticalSway;
        this.camera.rotation.z = rotationSway;

        // 1. Animate Corner Flags (subtle wave)
        const flagWave = Math.sin(timeSeconds * 6) * 0.1;
        if (this.flagLeft && this.flagRight) {
            this.flagLeft.rotation.y = flagWave;
            this.flagRight.rotation.y = -flagWave;
        }

        // 2. Animate Goal Net Jiggle (decaying spring oscillation)
        const dt = 1/60; // Approximate render step
        if (this.netJiggleLeft > 0.01) {
            this.netJiggleLeft -= dt * 1.5;
            const jiggle = Math.sin(timeSeconds * 30) * 0.18 * this.netJiggleLeft;
            this.netLeft.scale.set(1.0 - jiggle, 1.0, 1.0);
        } else {
            this.netLeft.scale.set(1, 1, 1);
        }

        if (this.netJiggleRight > 0.01) {
            this.netJiggleRight -= dt * 1.5;
            const jiggle = Math.sin(timeSeconds * 30) * 0.18 * this.netJiggleRight;
            this.netRight.scale.set(1.0 + jiggle, 1.0, 1.0);
        } else {
            this.netRight.scale.set(1, 1, 1);
        }

        // 3. Update active goal celebration particles
        this.particles.forEach(p => {
            if (p.mesh.visible) {
                p.life -= dt * 0.95; // fade over ~1s
                
                if (p.life <= 0) {
                    p.mesh.visible = false;
                } else {
                    // Apply gravity
                    p.vy -= 9.8 * 1.2 * dt;
                    
                    // Move
                    p.mesh.position.x += p.vx * dt;
                    p.mesh.position.y += p.vy * dt;
                    p.mesh.position.z += p.vz * dt;
                    
                    // Bounce off ground (Y=0)
                    if (p.mesh.position.y < 0.15) {
                        p.mesh.position.y = 0.15;
                        p.vy = -p.vy * 0.55; // bounce energy loss
                    }

                    // Spin
                    p.mesh.rotation.x += p.vx * 0.5;
                    p.mesh.rotation.y += p.vy * 0.5;
                    
                    // Scale down as life decays
                    p.mesh.scale.setScalar(p.life);
                }
            }
        });

        // 4. Idle Paddle Bobbing (gentle Y float)
        const bobSpeed = 3.5;
        const bobAmp = 0.08;
        const baseHeight = 0.45; // pd / 2
        if (this.paddles.pinkGk) {
            this.paddles.pinkGk.position.y = baseHeight + Math.sin(timeSeconds * bobSpeed) * bobAmp;
            this.paddles.redFw.position.y = baseHeight + Math.sin(timeSeconds * bobSpeed + 1.2) * bobAmp;
            this.paddles.blueFw.position.y = baseHeight + Math.sin(timeSeconds * bobSpeed + 2.4) * bobAmp;
            this.paddles.pinkGkAI.position.y = baseHeight + Math.sin(timeSeconds * bobSpeed + 3.6) * bobAmp;
        }
    },

    render() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
};
