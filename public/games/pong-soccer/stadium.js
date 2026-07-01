/**
 * Stadium Builder Module (stadium.js)
 * Constructs the concrete floor, grass pitch stripes, line markers, goals, walls, and bleachers with spectators.
 */

// Shared geometries and materials to avoid GC overhead and compilation lag
let GeoCache = null;
let MatCache = null;

function initStadiumCaches() {
    if (GeoCache) return;

    GeoCache = {
        baseLow: new THREE.BoxGeometry(6.5, 0.3, 1.3),
        baseHigh: new THREE.BoxGeometry(6.5, 0.8, 1.3),
        back: new THREE.BoxGeometry(6.5, 1.2, 0.1),
        seat: new THREE.BoxGeometry(1.6, 0.3, 0.8),
        torso: new THREE.BoxGeometry(0.8, 0.8, 0.6),
        head: new THREE.BoxGeometry(0.5, 0.5, 0.5),
        hair: new THREE.BoxGeometry(0.54, 0.18, 0.54),
        glowPlate: new THREE.BoxGeometry(0.9, 0.05, 0.7)
    };

    MatCache = {
        metal: new THREE.MeshPhongMaterial({ color: 0x95a5a6, shininess: 80, specular: 0xffffff }),
        seats: {},
        skins: [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524].map(color => 
            new THREE.MeshLambertMaterial({ color })
        ),
        shirts: {},
        glows: {},
        hairs: {}
    };

    // Pre-create seat materials
    const seatColors = [0xf1c40f, 0x3498db, 0x2ecc71, 0xe74c3c];
    seatColors.forEach(color => {
        MatCache.seats[color] = new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.85, shininess: 100 });
    });

    // Pre-create shirt and glow materials
    const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22, 0x1abc9c];
    shirtColors.forEach(color => {
        MatCache.shirts[color] = new THREE.MeshLambertMaterial({ color });
        MatCache.glows[color] = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    });

    // Pre-create hair materials
    const hairColors = [0x2c3e50, 0x7f8c8d, 0xd35400, 0xf39c12, 0x34495e];
    hairColors.forEach(color => {
        MatCache.hairs[color] = new THREE.MeshLambertMaterial({ color });
    });
}

export const StadiumBuilder = {
    buildPremiumStand(group, x, z, angle, seatColorHex) {
        initStadiumCaches();
        const standGroup = new THREE.Group();
        standGroup.position.set(x, 0, z);
        standGroup.rotation.y = angle;

        // 1. Metal base frame (slanted tiers)
        // Lower tier base
        const baseLow = new THREE.Mesh(GeoCache.baseLow, MatCache.metal);
        baseLow.position.set(0, 0.15, 0.4);
        baseLow.castShadow = true;
        baseLow.receiveShadow = true;
        standGroup.add(baseLow);

        // Higher tier base
        const baseHigh = new THREE.Mesh(GeoCache.baseHigh, MatCache.metal);
        baseHigh.position.set(0, 0.4, -0.7);
        baseHigh.castShadow = true;
        baseHigh.receiveShadow = true;
        standGroup.add(baseHigh);

        // Backrest support rail
        const back = new THREE.Mesh(GeoCache.back, MatCache.metal);
        back.position.set(0, 1.1, -1.3);
        back.castShadow = true;
        back.receiveShadow = true;
        standGroup.add(back);

        // 2. Seats (3 seats per tier)
        const seatXOffsets = [-1.9, 0, 1.9];
        const seatMat = MatCache.seats[seatColorHex];

        // Lower row seats
        seatXOffsets.forEach(xOffset => {
            const seat = new THREE.Mesh(GeoCache.seat, seatMat);
            seat.position.set(xOffset, 0.3 + 0.15, 0.4);
            seat.castShadow = true;
            seat.receiveShadow = true;
            standGroup.add(seat);
        });

        // Higher row seats
        seatXOffsets.forEach(xOffset => {
            const seat = new THREE.Mesh(GeoCache.seat, seatMat);
            seat.position.set(xOffset, 0.8 + 0.15, -0.7);
            seat.castShadow = true;
            seat.receiveShadow = true;
            standGroup.add(seat);
        });

        // 3. Populate blocky spectators (randomly)
        const skinColors = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];
        const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xe67e22, 0x1abc9c];
        const hairColors = [0x2c3e50, 0x7f8c8d, 0xd35400, 0xf39c12, 0x34495e];

        // Seat index: 0 to 5 (0-2 front, 3-5 back)
        for (let s = 0; s < 6; s++) {
            // 65% chance to sit a spectator
            if (Math.random() < 0.65) {
                const spectator = new THREE.Group();
                
                // Random attributes
                const skinIndex = Math.floor(Math.random() * skinColors.length);
                const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
                const hair = hairColors[Math.floor(Math.random() * hairColors.length)];

                // Torso (colored shirt)
                const torso = new THREE.Mesh(GeoCache.torso, MatCache.shirts[shirt]);
                torso.position.y = 0.4;
                torso.castShadow = true;
                torso.receiveShadow = true;
                spectator.add(torso);

                // Glowing underside seat plate
                const glowPlate = new THREE.Mesh(GeoCache.glowPlate, MatCache.glows[shirt]);
                glowPlate.position.y = 0.025;
                spectator.add(glowPlate);

                // Head (skin color)
                const head = new THREE.Mesh(GeoCache.head, MatCache.skins[skinIndex]);
                head.position.set(0, 1.05, 0.0); // Raised to sit flush on torso, inset to prevent Z-fighting
                head.castShadow = true;
                head.receiveShadow = true;
                spectator.add(head);

                // Hair (hair color)
                const hairMesh = new THREE.Mesh(GeoCache.hair, MatCache.hairs[hair]);
                hairMesh.position.set(0, 1.38, 0.0); // Raised to sit flush on head
                hairMesh.castShadow = true;
                hairMesh.receiveShadow = true;
                spectator.add(hairMesh);

                // Position spectator based on seat
                const isFrontRow = s < 3;
                const xOffset = seatXOffsets[s % 3];
                const ySeat = isFrontRow ? 0.3 : 0.8;
                const zSeat = isFrontRow ? 0.4 : -0.7;

                spectator.position.set(xOffset, ySeat + 0.15, zSeat);
                
                // Set userData for hopping animations on goals
                spectator.userData.isSpectator = true;
                spectator.userData.baseY = ySeat + 0.15;
                spectator.userData.hopPhase = Math.random() * Math.PI * 2;
                spectator.userData.hopSpeed = 16.0 + Math.random() * 8.0;
                
                standGroup.add(spectator);
            }
        }

        group.add(standGroup);
    },

    build(scene, arenaW, arenaH) {
        const refs = {};

        // 1. Concrete Outer Stadium Floor
        const trackGeo = new THREE.PlaneGeometry(62, 38);
        const trackMat = new THREE.MeshStandardMaterial({ 
            color: 0x2b3846, // Brightened rich steel blue
            roughness: 0.55,
            metalness: 0.45
        });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.rotation.x = -Math.PI / 2;
        track.position.y = -0.05;
        track.receiveShadow = true;
        scene.add(track);

        // Subtle futuristic cyberpunk simulation grid overlay on concrete floor
        const grid = new THREE.GridHelper(62, 31, 0x00d2ff, 0x1d2733);
        grid.material.transparent = true;
        grid.material.opacity = 0.28;
        grid.position.set(0, -0.04, 0);
        scene.add(grid);

        // 2. Striped Grass Pitch (10 alternating light/dark green vertical stripes)
        const createGrassNoiseTexture = () => {
            const size = 512;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Neutral height base color
            ctx.fillStyle = '#808080';
            ctx.fillRect(0, 0, size, size);
            
            // Render fine vertical grass blades
            for (let i = 0; i < 25000; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                const len = 1.0 + Math.random() * 4.0;
                const thick = 1.0 + Math.random() * 1.0;
                const val = 128 + Math.floor((Math.random() - 0.5) * 90);
                ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
                ctx.fillRect(x, y, thick, len);
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            return texture;
        };

        const grassBumpMap = createGrassNoiseTexture();
        const stripeWidth = arenaW / 10;
        
        for (let i = 0; i < 10; i++) {
            const stripeGeo = new THREE.PlaneGeometry(stripeWidth, arenaH);
            const isLight = i % 2 === 0;
            
            // Clone texture to repeat it uniformly relative to aspect ratio
            const stripeBump = grassBumpMap.clone();
            stripeBump.needsUpdate = true;
            stripeBump.repeat.set(Math.round(stripeWidth * 3.0), Math.round(arenaH * 3.0));

            const stripeMat = new THREE.MeshStandardMaterial({ 
                color: isLight ? 0x2e8b57 : 0x228b22,
                roughness: 0.55,
                metalness: 0.22,
                bumpMap: stripeBump,
                bumpScale: 0.05
            });
            const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
            stripeMesh.rotation.x = -Math.PI / 2;
            stripeMesh.position.set(-arenaW / 2 + stripeWidth / 2 + (i * stripeWidth), 0, 0);
            stripeMesh.receiveShadow = true;
            scene.add(stripeMesh);
        }

        // 3. Field Lines (White markers)
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        // Midfield Center Circle
        const centerCircleGeo = new THREE.RingGeometry(4.4, 4.6, 24);
        const centerCircle = new THREE.Mesh(centerCircleGeo, lineMat);
        centerCircle.rotation.x = -Math.PI / 2;
        centerCircle.position.set(0, 0.01, 0);
        scene.add(centerCircle);

        // Midfield Center Dot
        const centerDotGeo = new THREE.CircleGeometry(0.5, 8);
        const centerDot = new THREE.Mesh(centerDotGeo, lineMat);
        centerDot.rotation.x = -Math.PI / 2;
        centerDot.position.set(0, 0.01, 0);
        scene.add(centerDot);

        // Midfield Line
        const midLineGeo = new THREE.PlaneGeometry(0.2, arenaH);
        const midLine = new THREE.Mesh(midLineGeo, lineMat);
        midLine.rotation.x = -Math.PI / 2;
        midLine.position.set(0, 0.01, 0);
        scene.add(midLine);

        // Border Boundary Lines (Outer boundary)
        const borderLines = [
            { w: arenaW, h: 0.2, x: 0, z: -arenaH/2 },
            { w: arenaW, h: 0.2, x: 0, z: arenaH/2 },
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
            scene.add(mesh);
        });

        // Penalty Box Lines
        const drawBox = (xSign) => {
            const x = xSign * (arenaW/2 - 3.5);
            const fGeo = new THREE.PlaneGeometry(0.2, 10);
            const fMesh = new THREE.Mesh(fGeo, lineMat);
            fMesh.rotation.x = -Math.PI / 2;
            fMesh.position.set(x, 0.01, 0);
            scene.add(fMesh);
            
            const sGeo = new THREE.PlaneGeometry(3.5, 0.2);
            const sMesh1 = new THREE.Mesh(sGeo, lineMat);
            sMesh1.rotation.x = -Math.PI / 2;
            sMesh1.position.set(xSign * (arenaW/2 - 1.75), 0.01, -5.0);
            scene.add(sMesh1);

            const sMesh2 = new THREE.Mesh(sGeo, lineMat);
            sMesh2.rotation.x = -Math.PI / 2;
            sMesh2.position.set(xSign * (arenaW/2 - 1.75), 0.01, 5.0);
            scene.add(sMesh2);
        };
        drawBox(-1);
        drawBox(1);

        // 4. Contiguous Playfield rails with rounded corners (matching physics boundary)
        const chromeMat = new THREE.MeshPhongMaterial({ color: 0xdcdde1, shininess: 120, specular: 0xffffff });
        const railH = 0.5;
        const T = 0.25; // railThickness
        const R = 0.6;  // slightly rounded corner radius
        
        const halfW = arenaW / 2; // 20
        const halfH = arenaH / 2; // 11
        const goalLimitZ = 4.0;    // goal starts at z = -4.0 and 4.0
        
        // 4a. Top C-shape Rail (Left-top side -> Top-left corner -> Top wall -> Top-right corner -> Right-top side)
        const topShape = new THREE.Shape();
        topShape.moveTo(halfW, goalLimitZ);
        topShape.lineTo(halfW, halfH - R);
        topShape.quadraticCurveTo(halfW, halfH, halfW - R, halfH);
        topShape.lineTo(-halfW + R, halfH);
        topShape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - R);
        topShape.lineTo(-halfW, goalLimitZ);
        
        topShape.lineTo(-halfW - T, goalLimitZ);
        topShape.lineTo(-halfW - T, halfH + T - R);
        topShape.quadraticCurveTo(-halfW - T, halfH + T, -halfW - T + R, halfH + T);
        topShape.lineTo(halfW + T - R, halfH + T);
        topShape.quadraticCurveTo(halfW + T, halfH + T, halfW + T, halfH + T - R);
        topShape.lineTo(halfW + T, goalLimitZ);
        topShape.closePath();

        // 4b. Bottom C-shape Rail (Left-bottom side -> Bottom-left corner -> Bottom wall -> Bottom-right corner -> Right-bottom side)
        const bottomShape = new THREE.Shape();
        bottomShape.moveTo(-halfW, -goalLimitZ);
        bottomShape.lineTo(-halfW, -halfH + R);
        bottomShape.quadraticCurveTo(-halfW, -halfH, -halfW + R, -halfH);
        bottomShape.lineTo(halfW - R, -halfH);
        bottomShape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + R);
        bottomShape.lineTo(halfW, -goalLimitZ);
        
        bottomShape.lineTo(halfW + T, -goalLimitZ);
        bottomShape.lineTo(halfW + T, -halfH - T + R);
        bottomShape.quadraticCurveTo(halfW + T, -halfH - T, halfW + T - R, -halfH - T);
        bottomShape.lineTo(-halfW - T + R, -halfH - T);
        bottomShape.quadraticCurveTo(-halfW - T, -halfH - T, -halfW - T, -halfH - T + R);
        bottomShape.lineTo(-halfW - T, -goalLimitZ);
        bottomShape.closePath();

        const railSettings = {
            steps: 1,
            depth: railH,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 2
        };

        const topRailGeom = new THREE.ExtrudeGeometry(topShape, railSettings);
        const topRailMesh = new THREE.Mesh(topRailGeom, chromeMat);
        topRailMesh.rotation.x = -Math.PI / 2;
        topRailMesh.position.y = 0;
        topRailMesh.castShadow = true;
        topRailMesh.receiveShadow = true;
        scene.add(topRailMesh);

        const bottomRailGeom = new THREE.ExtrudeGeometry(bottomShape, railSettings);
        const bottomRailMesh = new THREE.Mesh(bottomRailGeom, chromeMat);
        bottomRailMesh.rotation.x = -Math.PI / 2;
        bottomRailMesh.position.y = 0;
        bottomRailMesh.castShadow = true;
        bottomRailMesh.receiveShadow = true;
        scene.add(bottomRailMesh);

        // 5. Rounded outer metal guard rail loop - split into neon blue (left) and neon red (right) halves
        const outerW = 47.0;
        const outerH = 27.0;
        const outerRad = 6.0;
        const outerThick = 0.4;
        const outerRailH = 0.8;

        const halfX = outerW / 2;
        const halfY = outerH / 2;

        const leftShape = new THREE.Shape();
        leftShape.moveTo(0, -halfY);
        leftShape.lineTo(-halfX + outerRad, -halfY);
        leftShape.quadraticCurveTo(-halfX, -halfY, -halfX, -halfY + outerRad);
        leftShape.lineTo(-halfX, halfY - outerRad);
        leftShape.quadraticCurveTo(-halfX, halfY, -halfX + outerRad, halfY);
        leftShape.lineTo(0, halfY);
        leftShape.lineTo(0, halfY - outerThick);
        leftShape.lineTo(-halfX + outerRad, halfY - outerThick);
        leftShape.quadraticCurveTo(-halfX + outerThick, halfY - outerThick, -halfX + outerThick, halfY - outerRad);
        leftShape.lineTo(-halfX + outerThick, -halfY + outerRad);
        leftShape.quadraticCurveTo(-halfX + outerThick, -halfY + outerThick, -halfX + outerRad, -halfY + outerThick);
        leftShape.lineTo(0, -halfY + outerThick);
        leftShape.lineTo(0, -halfY);

        const rightShape = new THREE.Shape();
        rightShape.moveTo(0, -halfY);
        rightShape.lineTo(halfX - outerRad, -halfY);
        rightShape.quadraticCurveTo(halfX, -halfY, halfX, -halfY + outerRad);
        rightShape.lineTo(halfX, halfY - outerRad);
        rightShape.quadraticCurveTo(halfX, halfY, halfX - outerRad, halfY);
        rightShape.lineTo(0, halfY);
        rightShape.lineTo(0, halfY - outerThick);
        rightShape.lineTo(halfX - outerRad, halfY - outerThick);
        rightShape.quadraticCurveTo(halfX - outerThick, halfY - outerThick, halfX - outerThick, halfY - outerRad);
        rightShape.lineTo(halfX - outerThick, -halfY + outerRad);
        rightShape.quadraticCurveTo(halfX - outerThick, -halfY + outerThick, halfX - outerRad, -halfY + outerThick);
        rightShape.lineTo(0, -halfY + outerThick);
        rightShape.lineTo(0, -halfY);

        const extrudeSettings = {
            steps: 1,
            depth: outerRailH,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.05,
            bevelSegments: 2
        };

        const leftNeonMat = new THREE.MeshPhongMaterial({ 
            color: 0x007aff, 
            emissive: 0x0033aa, 
            shininess: 120, 
            specular: 0xffffff 
        });
        const rightNeonMat = new THREE.MeshPhongMaterial({ 
            color: 0xff3b30, 
            emissive: 0xaa1111, 
            shininess: 120, 
            specular: 0xffffff 
        });

        const leftGeo = new THREE.ExtrudeGeometry(leftShape, extrudeSettings);
        const leftMesh = new THREE.Mesh(leftGeo, leftNeonMat);
        leftMesh.rotation.x = -Math.PI / 2;
        leftMesh.position.y = 0;
        leftMesh.castShadow = true;
        leftMesh.receiveShadow = true;
        scene.add(leftMesh);

        const rightGeo = new THREE.ExtrudeGeometry(rightShape, extrudeSettings);
        const rightMesh = new THREE.Mesh(rightGeo, rightNeonMat);
        rightMesh.rotation.x = -Math.PI / 2;
        rightMesh.position.y = 0;
        rightMesh.castShadow = true;
        rightMesh.receiveShadow = true;
        scene.add(rightMesh);

        // 6. Goal Net Assemblies (Left & Right)
        const buildGoalAssembly = (isRight) => {
            const xSign = isRight ? 1 : -1;
            const goalGroup = new THREE.Group();
            goalGroup.position.set(xSign * arenaW / 2, 0, 0);

            // Goal frame (chrome tubes)
            const postG = new THREE.BoxGeometry(0.3, 3.2, 0.3);
            const crossbarG = new THREE.BoxGeometry(0.3, 0.3, 8.3);

            const post1 = new THREE.Mesh(postG, chromeMat);
            post1.position.set(0, 1.6, -4.0);
            post1.castShadow = true;
            goalGroup.add(post1);

            const post2 = post1.clone();
            post2.position.z = 4.0;
            goalGroup.add(post2);

            const crossbar = new THREE.Mesh(crossbarG, chromeMat);
            crossbar.position.set(0, 3.2 - 0.15, 0);
            crossbar.castShadow = true;
            goalGroup.add(crossbar);

            // Behind support frame
            const depthSupportG = new THREE.BoxGeometry(1.6, 0.2, 0.2);
            const backPostG = new THREE.BoxGeometry(0.2, 3.2, 0.2);

            const support1 = new THREE.Mesh(depthSupportG, chromeMat);
            support1.position.set(xSign * 0.8, 0.1, -4.0);
            goalGroup.add(support1);

            const support2 = support1.clone();
            support2.position.z = 4.0;
            goalGroup.add(support2);

            const backPost1 = new THREE.Mesh(backPostG, chromeMat);
            backPost1.position.set(xSign * 1.6, 1.6, -4.0);
            goalGroup.add(backPost1);

            const backPost2 = backPost1.clone();
            backPost2.position.z = 4.0;
            goalGroup.add(backPost2);

            const backCross = new THREE.Mesh(crossbarG, chromeMat);
            backCross.position.set(xSign * 1.6, 3.2 - 0.15, 0);
            goalGroup.add(backCross);

            // Net Mesh (Team color neon glowing grid)
            const netGeo = new THREE.BoxGeometry(1.6, 3.2, 8.0);
            const netMat = new THREE.MeshBasicMaterial({ 
                color: isRight ? 0x007aff : 0xff3b30, 
                transparent: true, 
                opacity: 0.25,
                wireframe: true
            });
            const netMesh = new THREE.Mesh(netGeo, netMat);
            netMesh.position.set(xSign * 0.8, 1.6, 0);
            goalGroup.add(netMesh);

            // Corner Flags
            const flagPoleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5);
            const poleMat = new THREE.MeshLambertMaterial({ color: 0xdcdde1 });
            
            const flagPole = new THREE.Mesh(flagPoleGeo, poleMat);
            flagPole.position.set(0, 3.2 + 0.75, -4.0);
            goalGroup.add(flagPole);

            const flagGeo = new THREE.BufferGeometry();
            const vertices = new Float32Array([
                0.0, 3.2 + 1.5, 0.0,
                xSign * 0.8, 3.2 + 1.1, 0.0,
                0.0, 3.2 + 0.7, 0.0
            ]);
            flagGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            const flagMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c, side: THREE.DoubleSide });
            const flag = new THREE.Mesh(flagGeo, flagMat);
            flag.position.set(0, 0, -4.0);
            goalGroup.add(flag);

            scene.add(goalGroup);

            if (isRight) {
                refs.netRight = netMesh;
                refs.flagRight = flag;
            } else {
                refs.netLeft = netMesh;
                refs.flagLeft = flag;
            }
        };

        buildGoalAssembly(false);
        buildGoalAssembly(true);

        // 7. Premium stands with colorful seats & spectators in rounded rectangular layout
        const seatingGroup = new THREE.Group();
        const colors = [0xf1c40f, 0x3498db, 0x2ecc71, 0xe74c3c]; // Yellow, Blue, Green, Red seat blocks

        // Left stands (2 stands)
        this.buildPremiumStand(seatingGroup, -25.0, -7.0, Math.PI / 2 - Math.PI / 12, colors[2]); // Green
        this.buildPremiumStand(seatingGroup, -25.0, 7.0, Math.PI / 2 + Math.PI / 12, colors[2]);  // Green

        // Right stands (2 stands)
        this.buildPremiumStand(seatingGroup, 25.0, -7.0, -Math.PI / 2 + Math.PI / 12, colors[1]);  // Blue
        this.buildPremiumStand(seatingGroup, 25.0, 7.0, -Math.PI / 2 - Math.PI / 12, colors[1]);   // Blue

        // Top stands (3 stands)
        this.buildPremiumStand(seatingGroup, -12.5, -15.5, Math.PI / 12, colors[0]);            // Yellow
        this.buildPremiumStand(seatingGroup, 0.0, -16.0, 0, colors[0]);                          // Yellow
        this.buildPremiumStand(seatingGroup, 12.5, -15.5, -Math.PI / 12, colors[0]);             // Yellow

        // Bottom stands (3 stands)
        this.buildPremiumStand(seatingGroup, -12.5, 15.5, Math.PI - Math.PI / 12, colors[3]);     // Red
        this.buildPremiumStand(seatingGroup, 0.0, 16.0, Math.PI, colors[3]);                     // Red
        this.buildPremiumStand(seatingGroup, 12.5, 15.5, Math.PI + Math.PI / 12, colors[3]);      // Red

        scene.add(seatingGroup);

        return refs;
    }
};
