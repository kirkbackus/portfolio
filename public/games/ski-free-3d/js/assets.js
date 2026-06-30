const AssetBuilder = {
    // Helper to create materials
    materials: {
        snow: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.0, flatShading: true }),
        wood: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8, metalness: 0.1, flatShading: true }),
        foliageDark: new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.9, flatShading: true }),
        foliageMedium: new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.9, flatShading: true }),
        foliageLight: new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.9, flatShading: true }),
        rock: new THREE.MeshStandardMaterial({ color: 0x70777a, roughness: 0.8, metalness: 0.2, flatShading: true }),
        rockDark: new THREE.MeshStandardMaterial({ color: 0x4a4e51, roughness: 0.8, metalness: 0.2, flatShading: true }),
        skierCoat: new THREE.MeshStandardMaterial({ color: 0x00f0ff, roughness: 0.4, metalness: 0.1 }),
        skierPants: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }),
        skierSkis: new THREE.MeshStandardMaterial({ color: 0xff007f, roughness: 0.3 }),
        skierSkin: new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.6 }),
        goggles: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 }),
        yetiFur: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8, flatShading: true }),
        yetiSkin: new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.8, flatShading: true }),
        yetiMouth: new THREE.MeshBasicMaterial({ color: 0x1e293b }),
        yetiRedEye: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
        gateRed: new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 }),
        gateBlue: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 }),
        rampWood: new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8, flatShading: true })
    },

    createSkier() {
        const skier = new THREE.Group();
        skier.name = "skier";

        // Torso (Jacket)
        const torsoGeo = new THREE.BoxGeometry(0.35, 0.4, 0.25);
        const torso = new THREE.Mesh(torsoGeo, this.materials.skierCoat);
        torso.position.y = 0.45;
        torso.castShadow = true;
        torso.receiveShadow = true;
        skier.add(torso);

        // Head & Helmet
        const headGroup = new THREE.Group();
        headGroup.name = "headGroup";
        headGroup.position.set(0, 0.72, 0);

        const faceGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const face = new THREE.Mesh(faceGeo, this.materials.skierSkin);
        headGroup.add(face);

        const helmetGeo = new THREE.SphereGeometry(0.135, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.65);
        const helmet = new THREE.Mesh(helmetGeo, this.materials.skierSkis);
        helmet.rotation.x = -0.1;
        helmet.position.y = 0.02;
        headGroup.add(helmet);

        // Goggles
        const gogglesGeo = new THREE.BoxGeometry(0.18, 0.06, 0.06);
        const goggles = new THREE.Mesh(gogglesGeo, this.materials.goggles);
        goggles.position.set(0, 0.01, 0.1);
        headGroup.add(goggles);

        skier.add(headGroup);

        // Skis (Left & Right)
        const skiGeo = new THREE.BoxGeometry(0.08, 0.02, 1.4);
        
        // Let's bend the tips
        const tipGeo = new THREE.BoxGeometry(0.08, 0.02, 0.25);
        tipGeo.translate(0, 0.06, 0.65);
        tipGeo.rotateX(-0.35);

        const leftSkiGroup = new THREE.Group();
        leftSkiGroup.position.set(-0.16, 0.01, 0);
        const leftSkiBody = new THREE.Mesh(skiGeo, this.materials.skierSkis);
        const leftSkiTip = new THREE.Mesh(tipGeo, this.materials.skierSkis);
        leftSkiBody.castShadow = true;
        leftSkiTip.castShadow = true;
        leftSkiGroup.add(leftSkiBody, leftSkiTip);
        leftSkiGroup.name = "leftSki";
        skier.add(leftSkiGroup);

        const rightSkiGroup = new THREE.Group();
        rightSkiGroup.position.set(0.16, 0.01, 0);
        const rightSkiBody = new THREE.Mesh(skiGeo, this.materials.skierSkis);
        const rightSkiTip = new THREE.Mesh(tipGeo, this.materials.skierSkis);
        rightSkiBody.castShadow = true;
        rightSkiTip.castShadow = true;
        rightSkiGroup.add(rightSkiBody, rightSkiTip);
        rightSkiGroup.name = "rightSki";
        skier.add(rightSkiGroup);

        // Legs (Pants)
        const legGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
        const leftLeg = new THREE.Mesh(legGeo, this.materials.skierPants);
        leftLeg.position.set(-0.12, 0.2, 0);
        leftLeg.castShadow = true;
        skier.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, this.materials.skierPants);
        rightLeg.position.set(0.12, 0.2, 0);
        rightLeg.castShadow = true;
        skier.add(rightLeg);

        // Arms holding poles
        const armGeo = new THREE.BoxGeometry(0.08, 0.3, 0.08);
        const poleGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.2, 4);
        const poleRingGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 6);

        // Left Arm Group
        const leftArmGroup = new THREE.Group();
        leftArmGroup.name = "leftArm";
        leftArmGroup.position.set(-0.24, 0.5, 0);

        const leftArm = new THREE.Mesh(armGeo, this.materials.skierCoat);
        leftArm.position.y = -0.1;
        leftArmGroup.add(leftArm);

        const leftPole = new THREE.Mesh(poleGeo, this.materials.goggles);
        leftPole.position.set(-0.02, -0.4, 0.2);
        leftPole.rotation.x = 0.5; // Angled back
        leftArmGroup.add(leftPole);

        const leftPoleRing = new THREE.Mesh(poleRingGeo, this.materials.skierSkis);
        leftPoleRing.position.set(-0.02, -0.9, 0.45);
        leftPoleRing.rotation.x = 0.5;
        leftArmGroup.add(leftPoleRing);

        skier.add(leftArmGroup);

        // Right Arm Group
        const rightArmGroup = new THREE.Group();
        rightArmGroup.name = "rightArm";
        rightArmGroup.position.set(0.24, 0.5, 0);

        const rightArm = new THREE.Mesh(armGeo, this.materials.skierCoat);
        rightArm.position.y = -0.1;
        rightArmGroup.add(rightArm);

        const rightPole = new THREE.Mesh(poleGeo, this.materials.goggles);
        rightPole.position.set(0.02, -0.4, 0.2);
        rightPole.rotation.x = 0.5; // Angled back
        rightArmGroup.add(rightPole);

        const rightPoleRing = new THREE.Mesh(poleRingGeo, this.materials.skierSkis);
        rightPoleRing.position.set(0.02, -0.9, 0.45);
        rightPoleRing.rotation.x = 0.5;
        rightArmGroup.add(rightPoleRing);

        skier.add(rightArmGroup);

        return skier;
    },

    createPineTree(type = "medium") {
        const tree = new THREE.Group();
        tree.name = "pine_tree";

        let trunkHeight, trunkRadius, layers, startRadius, layerHeight;
        
        if (type === "small") {
            trunkHeight = 0.4;
            trunkRadius = 0.08;
            layers = 3;
            startRadius = 0.55;
            layerHeight = 0.5;
        } else if (type === "large") {
            trunkHeight = 0.8;
            trunkRadius = 0.16;
            layers = 5;
            startRadius = 1.0;
            layerHeight = 0.8;
        } else { // medium
            trunkHeight = 0.6;
            trunkRadius = 0.12;
            layers = 4;
            startRadius = 0.8;
            layerHeight = 0.65;
        }

        // Trunk
        const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.7, trunkRadius, trunkHeight, 5);
        const trunk = new THREE.Mesh(trunkGeo, this.materials.wood);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);

        // Foliage layers (stacked cones)
        let currentY = trunkHeight - 0.15;
        let currentRadius = startRadius;

        // Choose random shade of green for organic variety
        const shades = [this.materials.foliageDark, this.materials.foliageMedium, this.materials.foliageLight];
        const leafMat = shades[Math.floor(Math.random() * shades.length)];

        for (let i = 0; i < layers; i++) {
            const height = layerHeight * (1 - (i * 0.12));
            const coneGeo = new THREE.ConeGeometry(currentRadius, height, 5);
            const cone = new THREE.Mesh(coneGeo, leafMat);
            cone.position.y = currentY + height / 2;
            cone.castShadow = true;
            cone.receiveShadow = true;
            tree.add(cone);

            // Add snow caps on top of green cones!
            const snowCapHeight = height * 0.35;
            const snowCapRadius = currentRadius * 0.75;
            const snowCapGeo = new THREE.ConeGeometry(snowCapRadius, snowCapHeight, 5);
            const snowCap = new THREE.Mesh(snowCapGeo, this.materials.snow);
            snowCap.position.y = cone.position.y + (height / 2) - (snowCapHeight / 2) + 0.01;
            snowCap.castShadow = true;
            tree.add(snowCap);

            currentY += height * 0.6;
            currentRadius *= 0.75;
        }

        // Apply slight random lean for low-poly look
        tree.rotation.z = (Math.random() - 0.5) * 0.05;
        tree.rotation.x = (Math.random() - 0.5) * 0.05;
        
        // Random scale variance
        const s = 0.95 + Math.random() * 0.15;
        tree.scale.set(s, s, s);

        return tree;
    },

    createBareTree() {
        const tree = new THREE.Group();
        tree.name = "bare_tree";

        const trunkHeight = 1.2;
        const trunkRadius = 0.1;

        // Main trunk
        const trunkGeo = new THREE.CylinderGeometry(trunkRadius * 0.5, trunkRadius, trunkHeight, 4);
        const trunk = new THREE.Mesh(trunkGeo, this.materials.wood);
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        tree.add(trunk);

        // Branches
        const createBranch = (yPos, length, rotZ, rotY) => {
            const branchGeo = new THREE.CylinderGeometry(0.02, 0.05, length, 4);
            const branchMesh = new THREE.Mesh(branchGeo, this.materials.wood);
            branchMesh.position.y = length / 2;
            
            const branchPivot = new THREE.Group();
            branchPivot.position.set(0, yPos, 0);
            branchPivot.rotation.z = rotZ;
            branchPivot.rotation.y = rotY;
            branchPivot.add(branchMesh);
            branchMesh.castShadow = true;
            
            // Add a little bit of snow on top of the branch
            const snowGeo = new THREE.BoxGeometry(0.06, 0.02, length * 0.8);
            const snow = new THREE.Mesh(snowGeo, this.materials.snow);
            snow.position.set(0, length / 2, 0.02);
            snow.rotation.x = Math.PI / 2;
            branchPivot.add(snow);
            
            return branchPivot;
        };

        tree.add(createBranch(0.5, 0.6, 0.6, 0));
        tree.add(createBranch(0.7, 0.5, -0.7, Math.PI * 0.6));
        tree.add(createBranch(0.9, 0.4, 0.5, Math.PI * 1.3));

        return tree;
    },

    createRock() {
        const group = new THREE.Group();
        group.name = "rock";

        // Create a cluster of 2-3 rocks
        const rockCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
        const mat = Math.random() > 0.5 ? this.materials.rock : this.materials.rockDark;

        for (let i = 0; i < rockCount; i++) {
            const radius = 0.4 + Math.random() * 0.4;
            const geo = new THREE.DodecahedronGeometry(radius, 0);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Offset rocks in the cluster
            if (i > 0) {
                mesh.position.set(
                    (Math.random() - 0.5) * radius * 1.2,
                    0.05,
                    (Math.random() - 0.5) * radius * 1.2
                );
            } else {
                mesh.position.y = radius * 0.5; // Main rock sits half in ground
            }

            // Squash them slightly
            mesh.scale.set(1.0 + Math.random() * 0.2, 0.7 + Math.random() * 0.3, 1.0 + Math.random() * 0.2);
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            group.add(mesh);

            // Add snow patch on top of the rock
            if (Math.random() > 0.2) {
                const snowPatchGeo = new THREE.DodecahedronGeometry(radius * 0.75, 0);
                const snowPatch = new THREE.Mesh(snowPatchGeo, this.materials.snow);
                snowPatch.position.copy(mesh.position);
                snowPatch.position.y += radius * 0.45; // Shift to top
                snowPatch.scale.set(mesh.scale.x * 1.05, mesh.scale.y * 0.4, mesh.scale.z * 1.05);
                snowPatch.rotation.copy(mesh.rotation);
                snowPatch.castShadow = true;
                group.add(snowPatch);
            }
        }

        return group;
    },

    createSlalomGate(color = "red") {
        const gate = new THREE.Group();
        gate.name = `slalom_gate_${color}`;

        const poleHeight = 1.3;
        const poleRadius = 0.035;
        const width = 3.5; // Gate width to ski through
        const poleMat = color === "red" ? this.materials.gateRed : this.materials.gateBlue;

        // Left Pole
        const leftPole = new THREE.Mesh(
            new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 5),
            poleMat
        );
        leftPole.position.set(-width / 2, poleHeight / 2, 0);
        leftPole.castShadow = true;
        gate.add(leftPole);

        // Left Flag
        const flagGeo = new THREE.BoxGeometry(0.35, 0.22, 0.02);
        const leftFlag = new THREE.Mesh(flagGeo, poleMat);
        leftFlag.position.set(-width / 2 + 0.18, poleHeight - 0.15, 0);
        leftFlag.castShadow = true;
        gate.add(leftFlag);

        // Right Pole
        const rightPole = leftPole.clone();
        rightPole.position.x = width / 2;
        gate.add(rightPole);

        // Right Flag
        const rightFlag = new THREE.Mesh(flagGeo, poleMat);
        rightFlag.position.set(width / 2 - 0.18, poleHeight - 0.15, 0);
        rightFlag.castShadow = true;
        gate.add(rightFlag);

        // Small indicator sign in the center showing direction
        const arrowGroup = new THREE.Group();
        arrowGroup.position.set(0, 0.05, 0);
        
        // Dashed lines between poles to guide player (drawn once or thin line)
        const lineGeo = new THREE.BoxGeometry(width - 0.3, 0.005, 0.06);
        const lineMat = new THREE.MeshBasicMaterial({
            color: color === "red" ? 0xef4444 : 0x3b82f6,
            transparent: true,
            opacity: 0.15
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        gate.add(line);

        return gate;
    },

    createRamp() {
        const ramp = new THREE.Group();
        ramp.name = "ramp";

        const width = 2.2;
        const height = 0.55;
        const depth = 1.8;

        // Create custom geometry for wedge (sloping up in positive Z direction)
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(depth, 0);
        shape.lineTo(0, height);
        shape.lineTo(0, 0);

        const extrudeSettings = {
            depth: width,
            bevelEnabled: false
        };

        const wedgeGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        
        // Center the extrusion on X/Z but keep Y base at 0
        wedgeGeo.translate(-depth / 2, 0, -width / 2);
        
        // Rotate so that the slope rises as Z increases (facing the approaching player)
        wedgeGeo.rotateY(Math.PI / 2);
        
        const rampWedgeMat = new THREE.MeshLambertMaterial({ color: 0xdbeafe, flatShading: true }); // Very light blue
        const wedge = new THREE.Mesh(wedgeGeo, rampWedgeMat);
        wedge.castShadow = true;
        wedge.receiveShadow = true;
        wedge.position.set(0, 0, 0);
        ramp.add(wedge);

        // Wooden side braces (aligned flush along the slope)
        const slopeLen = Math.sqrt(depth * depth + height * height);
        const braceGeo = new THREE.BoxGeometry(0.06, 0.08, slopeLen);
        
        const leftBrace = new THREE.Mesh(braceGeo, this.materials.rampWood);
        leftBrace.position.set(-width / 2 - 0.03, height / 2, 0);
        leftBrace.rotation.x = -Math.atan2(height, depth); // Tilt up as Z increases
        leftBrace.castShadow = true;
        ramp.add(leftBrace);

        const rightBrace = new THREE.Mesh(braceGeo, this.materials.rampWood);
        rightBrace.position.set(width / 2 + 0.03, height / 2, 0);
        rightBrace.rotation.x = -Math.atan2(height, depth);
        rightBrace.castShadow = true;
        ramp.add(rightBrace);

        // Small red/yellow caution markings on the side of the ramp peak
        const flagGeo = new THREE.BoxGeometry(0.02, 0.5, 0.1);
        const flag = new THREE.Mesh(flagGeo, this.materials.gateRed);
        flag.position.set(-width / 2 - 0.05, height + 0.25, depth / 2 - 0.05);
        flag.castShadow = true;
        ramp.add(flag);

        const flag2 = flag.clone();
        flag2.position.x = width / 2 + 0.05;
        ramp.add(flag2);

        return ramp;
    },

    createYeti() {
        const yeti = new THREE.Group();
        yeti.name = "yeti";

        // Main Body (fuzzy blocky chest)
        const bodyGeo = new THREE.BoxGeometry(0.7, 0.8, 0.5);
        const body = new THREE.Mesh(bodyGeo, this.materials.yetiFur);
        body.position.y = 0.65;
        body.castShadow = true;
        body.receiveShadow = true;
        yeti.add(body);

        // Head
        const headGroup = new THREE.Group();
        headGroup.name = "headGroup";
        headGroup.position.set(0, 1.15, 0.1);

        const headGeo = new THREE.BoxGeometry(0.42, 0.35, 0.4);
        const head = new THREE.Mesh(headGeo, this.materials.yetiFur);
        head.castShadow = true;
        headGroup.add(head);

        // Blue faceplate
        const faceGeo = new THREE.BoxGeometry(0.32, 0.22, 0.05);
        const face = new THREE.Mesh(faceGeo, this.materials.yetiSkin);
        face.position.set(0, 0.02, 0.2);
        headGroup.add(face);

        // Glowing red eyes
        const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
        const leftEye = new THREE.Mesh(eyeGeo, this.materials.yetiRedEye);
        leftEye.position.set(-0.08, 0.06, 0.22);
        headGroup.add(leftEye);

        const rightEye = leftEye.clone();
        rightEye.position.x = 0.08;
        headGroup.add(rightEye);

        // Mouth (wide angry look)
        const mouthGeo = new THREE.BoxGeometry(0.2, 0.06, 0.02);
        const mouth = new THREE.Mesh(mouthGeo, this.materials.yetiMouth);
        mouth.position.set(0, -0.06, 0.22);
        headGroup.add(mouth);

        // White fangs
        const toothGeo = new THREE.BoxGeometry(0.03, 0.04, 0.02);
        const leftTooth = new THREE.Mesh(toothGeo, this.materials.snow);
        leftTooth.position.set(-0.06, -0.05, 0.23);
        headGroup.add(leftTooth);

        const rightTooth = leftTooth.clone();
        rightTooth.position.x = 0.06;
        headGroup.add(rightTooth);

        yeti.add(headGroup);

        // Arms (Left & Right) - long and swinging!
        const armGeo = new THREE.BoxGeometry(0.18, 0.75, 0.18);
        
        // Left Arm Pivot Group
        const leftArmGroup = new THREE.Group();
        leftArmGroup.name = "leftArm";
        leftArmGroup.position.set(-0.44, 0.9, 0);
        
        const leftArmMesh = new THREE.Mesh(armGeo, this.materials.yetiFur);
        leftArmMesh.position.y = -0.3; // Hang down
        leftArmMesh.castShadow = true;
        leftArmGroup.add(leftArmMesh);

        // Left Hand (claws)
        const handGeo = new THREE.BoxGeometry(0.2, 0.12, 0.2);
        const leftHand = new THREE.Mesh(handGeo, this.materials.yetiSkin);
        leftHand.position.set(-0.01, -0.65, 0.01);
        leftArmGroup.add(leftHand);

        yeti.add(leftArmGroup);

        // Right Arm Pivot Group
        const rightArmGroup = new THREE.Group();
        rightArmGroup.name = "rightArm";
        rightArmGroup.position.set(0.44, 0.9, 0);

        const rightArmMesh = new THREE.Mesh(armGeo, this.materials.yetiFur);
        rightArmMesh.position.y = -0.3;
        rightArmMesh.castShadow = true;
        rightArmGroup.add(rightArmMesh);

        // Right Hand
        const rightHand = new THREE.Mesh(handGeo, this.materials.yetiSkin);
        rightHand.position.set(0.01, -0.65, 0.01);
        rightArmGroup.add(rightHand);

        yeti.add(rightArmGroup);

        // Legs (short and stumpy)
        const legGeo = new THREE.BoxGeometry(0.22, 0.45, 0.22);
        
        // Left leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.name = "leftLeg";
        leftLegGroup.position.set(-0.2, 0.35, 0);
        const leftLeg = new THREE.Mesh(legGeo, this.materials.yetiFur);
        leftLeg.position.y = -0.15;
        leftLeg.castShadow = true;
        leftLegGroup.add(leftLeg);

        const footGeo = new THREE.BoxGeometry(0.25, 0.1, 0.35);
        const leftFoot = new THREE.Mesh(footGeo, this.materials.yetiSkin);
        leftFoot.position.set(0, -0.35, 0.05);
        leftLegGroup.add(leftFoot);

        yeti.add(leftLegGroup);

        // Right leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.name = "rightLeg";
        rightLegGroup.position.set(0.2, 0.35, 0);
        const rightLeg = new THREE.Mesh(legGeo, this.materials.yetiFur);
        rightLeg.position.y = -0.15;
        rightLeg.castShadow = true;
        rightLegGroup.add(rightLeg);

        const rightFoot = new THREE.Mesh(footGeo, this.materials.yetiSkin);
        rightFoot.position.set(0, -0.35, 0.05);
        rightLegGroup.add(rightFoot);

        yeti.add(rightLegGroup);

        return yeti;
    },

    createSnowball() {
        const group = new THREE.Group();
        group.name = "snowballGroup";
        
        // A slightly detailed snowball geometry
        const snowballGeo = new THREE.DodecahedronGeometry(0.5, 1);
        
        // Slightly random vertices to make it look organic
        const posAttr = snowballGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const y = posAttr.getY(i);
            const z = posAttr.getZ(i);
            // Apply slight noise scaling
            const length = Math.sqrt(x*x + y*y + z*z);
            const scale = 1.0 + (Math.random() - 0.5) * 0.08;
            posAttr.setXYZ(i, (x / length) * 0.5 * scale, (y / length) * 0.5 * scale, (z / length) * 0.5 * scale);
        }
        snowballGeo.computeVertexNormals();

        const snowball = new THREE.Mesh(snowballGeo, this.materials.snow);
        snowball.name = "snowballMesh";
        snowball.castShadow = true;
        snowball.receiveShadow = true;
        group.add(snowball);

        return group;
    },

    createSnowboarder() {
        const boarder = new THREE.Group();

        // 1. Snowboard
        const boardGeo = new THREE.BoxGeometry(0.3, 0.05, 1.4);
        // Bright neon snowboard material
        const boardMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.5, metalness: 0.1, flatShading: true }); // Bright neon pink
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(0, 0.025, 0);
        board.castShadow = true;
        board.receiveShadow = true;
        boarder.add(board);

        // 2. Rider Group (rotated 90 degrees to stand sideways on the board)
        const rider = new THREE.Group();
        rider.rotation.y = Math.PI / 2; // Face sideways
        rider.position.set(0, 0.05, 0);

        // Legs (standing crouched on board)
        const bootGeo = new THREE.BoxGeometry(0.12, 0.1, 0.22);
        const bootMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, flatShading: true }); // Dark grey boots
        
        const leftBoot = new THREE.Mesh(bootGeo, bootMat);
        leftBoot.position.set(0, 0.05, -0.3);
        rider.add(leftBoot);

        const rightBoot = new THREE.Mesh(bootGeo, bootMat);
        rightBoot.position.set(0, 0.05, 0.3);
        rider.add(rightBoot);

        // Pants / Legs group
        const legGeo = new THREE.BoxGeometry(0.14, 0.4, 0.14);
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8, flatShading: true }); // Blue pants
        
        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.set(0, 0.25, -0.3);
        leftLeg.rotation.x = 0.2; // Squat in
        leftLeg.castShadow = true;
        rider.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.set(0, 0.25, 0.3);
        rightLeg.rotation.x = -0.2;
        rightLeg.castShadow = true;
        rider.add(rightLeg);

        // Torso (leaning slightly)
        const bodyGeo = new THREE.BoxGeometry(0.3, 0.5, 0.4);
        const jacketMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.8, flatShading: true }); // Purple jacket
        const torso = new THREE.Mesh(bodyGeo, jacketMat);
        torso.position.set(0, 0.6, 0);
        torso.rotation.x = 0.05; // Lean forward
        torso.castShadow = true;
        torso.receiveShadow = true;
        rider.add(torso);

        // Arms (outstretched for balance!)
        const armGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        
        const leftArm = new THREE.Mesh(armGeo, jacketMat);
        leftArm.position.set(0, 0.65, -0.3);
        leftArm.rotation.x = -Math.PI / 3; // Outwards
        leftArm.castShadow = true;
        rider.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, jacketMat);
        rightArm.position.set(0, 0.65, 0.3);
        rightArm.rotation.x = Math.PI / 3;
        rightArm.castShadow = true;
        rider.add(rightArm);

        // Helmet/Head
        const headGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
        const helmetMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5, metalness: 0.1, flatShading: true }); // Neon yellow helmet
        const head = new THREE.Mesh(headGeo, helmetMat);
        head.position.set(0, 0.95, 0);
        head.castShadow = true;
        rider.add(head);

        // Goggles
        const gogglesGeo = new THREE.BoxGeometry(0.26, 0.08, 0.15);
        const gogglesMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const goggles = new THREE.Mesh(gogglesGeo, gogglesMat);
        goggles.position.set(0.08, 0.95, 0); // Face forward
        rider.add(goggles);

        boarder.add(rider);
        boarder.name = "snowboarder";

        return boarder;
    },

    createIcePatch() {
        const ice = new THREE.Group();
        
        // Flat plane
        const iceGeo = new THREE.PlaneGeometry(3.5, 4);
        const iceMat = new THREE.MeshStandardMaterial({
            color: 0xa5f3fc, // Shiny light cyan
            roughness: 0.1, // Shiny / reflective!
            metalness: 0.1,
            transparent: true,
            opacity: 0.6,
            flatShading: true
        });
        
        const mesh = new THREE.Mesh(iceGeo, iceMat);
        mesh.rotation.x = -Math.PI / 2; // Flat on ground
        mesh.position.y = 0.01; // Prevent z-fighting
        mesh.receiveShadow = true;
        ice.add(mesh);
        
        // Add a few dark ice cracks/lines for texture
        const crackGeo = new THREE.BoxGeometry(0.06, 0.01, 1.5);
        const crackMat = new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.3, flatShading: true });
        
        const crack1 = new THREE.Mesh(crackGeo, crackMat);
        crack1.position.set(-0.5, 0.012, 0.2);
        crack1.rotation.y = 0.5;
        ice.add(crack1);
        
        const crack2 = new THREE.Mesh(crackGeo, crackMat);
        crack2.position.set(0.6, 0.012, -0.6);
        crack2.rotation.y = -0.7;
        ice.add(crack2);

        return ice;
    },

    createPowderDrift() {
        const drift = new THREE.Group();
        drift.name = "powderDrift";
        
        const geo = new THREE.DodecahedronGeometry(0.7, 1);
        // Cool powder-blue material for contrast
        const mat = new THREE.MeshStandardMaterial({
            color: 0xd9e6f2, 
            roughness: 0.95,
            flatShading: true
        });
        
        // Generate 3-5 random overlapping snow clumps for shape variance
        const numClumps = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numClumps; i++) {
            const mesh = new THREE.Mesh(geo, mat);
            
            const sx = 0.8 + Math.random() * 0.9;
            const sy = 0.15 + Math.random() * 0.2;
            const sz = 0.8 + Math.random() * 0.9;
            mesh.scale.set(sx, sy, sz);
            
            const ox = (Math.random() - 0.5) * 1.5;
            const oy = sy * 0.4;
            const oz = (Math.random() - 0.5) * 1.5;
            mesh.position.set(ox, oy, oz);
            
            mesh.rotation.y = Math.random() * Math.PI * 2;
            
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            drift.add(mesh);
        }
        
        // Add a dry twig/branch sticking out for visual variety (50% chance)
        if (Math.random() > 0.5) {
            const branchGeo = new THREE.BoxGeometry(0.08, 0.6, 0.08);
            const branch = new THREE.Mesh(branchGeo, this.materials.wood);
            
            branch.position.set((Math.random() - 0.5) * 0.8, 0.25, (Math.random() - 0.5) * 0.8);
            branch.rotation.set(
                0.3 + Math.random() * 0.4,
                Math.random() * Math.PI,
                0.2 + Math.random() * 0.4
            );
            branch.castShadow = true;
            drift.add(branch);
        }
        
        return drift;
    }
};;
