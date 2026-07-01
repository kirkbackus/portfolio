/**
 * Three.js 3D Renderer (renderer.js)
 * Manages the WebGL scene, isometric camera, low-poly N64 models, textures, animations, and particle VFX.
 * Restructured to satisfy SOLID principles.
 */

import { StadiumBuilder } from './stadium.js';
import { PaddleDeformer, createPaddleTexture } from './deformer.js';
import { ParticleManager } from './particles.js';

export const Renderer = {
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    bloomPass: null,
    
    // Meshes
    paddles: {},
    ballMesh: null,
    trailHistory: [],
    maxTrailLength: 8,
    
    // Stadium References
    netLeft: null,
    netRight: null,
    flagLeft: null,
    flagRight: null,

    // Spectator Cheering & Goal Animation States
    netJiggleLeft: 0,
    netJiggleRight: 0,
    cheerTime: 0,
    spectators: [],

    baseCamPos: { x: 0, y: 22, z: 26 },
    currentEmissiveIntensity: 1.5,

    // Cached temporary objects to prevent garbage collection allocations in loops
    tempQuaternion: new THREE.Quaternion(),
    tempVector: new THREE.Vector3(),

    init(container) {
        if (!container) return; // safety for SSR/node environments

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x16181c);

        // 2. Camera
        const aspect = width / height;
        const viewSize = 15.0;
        this.camera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            0.1, 1000
        );
        this.camera.position.set(this.baseCamPos.x, this.baseCamPos.y, this.baseCamPos.z);
        this.camera.lookAt(0, -1.0, 0);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // 3b. Bloom Postprocessing
        this.composer = new THREE.EffectComposer(this.renderer);
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(width, height),
            1.6,   // Bloom Strength
            0.4,   // Bloom Radius
            1.05   // Bloom Threshold (higher threshold isolates bloom to bright paddle emissives)
        );
        this.composer.addPass(this.bloomPass);

        // Resize Listener
        window.addEventListener('resize', () => this.onWindowResize(container));

        // 4. Lighting - 4 Stadium Corner Spotlights (Softer contrast)
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
        this.scene.add(this.ambientLight);

        this.spotlights = [];
        const addSpotlight = (x, y, z) => {
            const spotLight = new THREE.SpotLight(0xffffff, 0.35);
            spotLight.position.set(x, y, z);
            spotLight.target.position.set(0, 0, 0);
            spotLight.angle = Math.PI / 4.5;
            spotLight.penumbra = 0.8;
            spotLight.decay = 1.0;
            spotLight.distance = 70;
            spotLight.castShadow = true;
            spotLight.shadow.mapSize.width = 512;
            spotLight.shadow.mapSize.height = 512;
            spotLight.shadow.radius = 16.0;
            spotLight.shadow.camera.near = 10;
            spotLight.shadow.camera.far = 70;
            spotLight.shadow.bias = -0.001;
            spotLight.userData = {
                originalX: x,
                originalZ: z
            };
            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
            this.spotlights.push(spotLight);
        };

        addSpotlight(-28, 20, -18);
        addSpotlight(28, 20, -18);
        addSpotlight(-28, 20, 18);
        addSpotlight(28, 20, 18);

        // Build Environment
        const refs = StadiumBuilder.build(this.scene, 40.0, 22.0);
        this.netLeft = refs.netLeft;
        this.netRight = refs.netRight;
        this.flagLeft = refs.flagLeft;
        this.flagRight = refs.flagRight;

        // 6. Static Neon Loop Wash Lights (Gives the illusion of outer loops emitting physical light rays)
        this.leftRailLight = new THREE.PointLight(0x007aff, 0.40, 30.0, 1.2);
        this.leftRailLight.position.set(-20, 2.0, 0);
        this.leftRailLight.castShadow = true;
        this.leftRailLight.shadow.mapSize.width = 256;
        this.leftRailLight.shadow.mapSize.height = 256;
        this.leftRailLight.shadow.bias = -0.002;
        this.leftRailLight.shadow.camera.near = 1.0;
        this.leftRailLight.shadow.camera.far = 35.0;
        this.scene.add(this.leftRailLight);

        this.rightRailLight = new THREE.PointLight(0xff3b30, 0.40, 30.0, 1.2);
        this.rightRailLight.position.set(20, 2.0, 0);
        this.rightRailLight.castShadow = true;
        this.rightRailLight.shadow.mapSize.width = 256;
        this.rightRailLight.shadow.mapSize.height = 256;
        this.rightRailLight.shadow.bias = -0.002;
        this.rightRailLight.shadow.camera.near = 1.0;
        this.rightRailLight.shadow.camera.far = 35.0;
        this.scene.add(this.rightRailLight);

        this.createPaddles();
        this.createBall();

        // 5. VFX Pools (exhaust, ball trail, goal shockwave)
        ParticleManager.init(this.scene);

        // Gather all spectator meshes for the goal cheering/hopping animation
        this.spectators = [];
        this.cheerTime = 0.0;
        this.scene.traverse(node => {
            if (node.userData && node.userData.isSpectator) {
                this.spectators.push(node);
            }
        });
    },

    onWindowResize(container) {
        if (!container || !this.camera || !this.renderer) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const aspect = width / height;
        const viewSize = 15.0;
 
        this.camera.left = -viewSize * aspect;
        this.camera.right = viewSize * aspect;
        this.camera.top = viewSize;
        this.camera.bottom = -viewSize;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        if (this.bloomPass) {
            this.bloomPass.setSize(width, height);
        }
    },

    createPaddles() {
        const pw = 1.2;
        const ph = 4.0;
        const pd = 0.9;

        const lightColors = {
            pinkGk: 0xff1493,
            redFw: 0xff3b30,
            blueFw: 0x007aff,
            pinkGkAI: 0x8a2be2
        };

        for (const [key, lightColor] of Object.entries(lightColors)) {
            const geom = new THREE.BoxGeometry(pw, pd, ph, 8, 8, 128);
            
            // Round the geometry edges/corners mathematically (Superellipsoid rounding)
            const r = 0.18;
            const innerX = pw / 2 - r;
            const innerY = pd / 2 - r;
            const innerZ = ph / 2 - r;
            const posAttr = geom.attributes.position;
            const arr = posAttr.array;
            for (let i = 0; i < posAttr.count; i++) {
                const x = arr[i * 3];
                const y = arr[i * 3 + 1];
                const z = arr[i * 3 + 2];
                
                const cx = Math.max(-innerX, Math.min(innerX, x));
                const cy = Math.max(-innerY, Math.min(innerY, y));
                const cz = Math.max(-innerZ, Math.min(innerZ, z));
                
                const dx = x - cx;
                const dy = y - cy;
                const dz = z - cz;
                
                const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (len > 0.0001) {
                    arr[i * 3] = cx + (dx / len) * r;
                    arr[i * 3 + 1] = cy + (dy / len) * r;
                    arr[i * 3 + 2] = cz + (dz / len) * r;
                }
            }
            geom.computeVertexNormals();
            
            // Create a gorgeous neon glowing canvas texture for this paddle
            const texture = createPaddleTexture(lightColor);
            const material = new THREE.MeshPhongMaterial({
                map: texture,
                emissiveMap: texture,
                emissive: new THREE.Color(lightColor),
                emissiveIntensity: 1.5,
                shininess: 120,
                specular: 0xffffff,
                transparent: false,
                opacity: 1.0
            });

            const mesh = new THREE.Mesh(geom, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.y = pd / 2 + 0.12;
            
            mesh.userData.originalPositions = new Float32Array(geom.attributes.position.array);
            
            // Add three underside point lights along the Z-axis (long axis) to match the rectangular paddle footprint
            const lightIntensity = 5.0;
            const lightDistance = 5.0;
            const zOffsets = [-0.65, 0, 0.65];
            mesh.userData.lights = [];
            zOffsets.forEach(zVal => {
                const pLight = new THREE.PointLight(lightColor, lightIntensity, lightDistance, 1.0);
                pLight.position.set(0, -0.40, zVal);
                mesh.add(pLight);
                
                mesh.userData.lights.push({
                    lightObject: pLight,
                    originalZ: zVal
                });
            });

            this.scene.add(mesh);
            this.paddles[key] = mesh;
        }
    },

    createBall() {
        const radius = 0.6;
        const ballGeo = new THREE.SphereGeometry(radius, 12, 10);
        
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 128);

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
            flatShading: true
        });

        this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
        this.ballMesh.castShadow = true;
        this.ballMesh.position.set(0, radius, 0);
        this.scene.add(this.ballMesh);
    },

    triggerNetJiggle(side) {
        if (side === 'left') {
            this.netJiggleLeft = 1.0;
        } else {
            this.netJiggleRight = 1.0;
        }
    },

    triggerCheering(forceCheer = false) {
        this.cheerTime = forceCheer ? Infinity : 5.0;
    },

    updatePaddles(pData, dt) {
        if (!pData) return;

        // 1. Sync mesh positions from physics data
        if (this.paddles.pinkGk && pData.pinkGk) {
            this.paddles.pinkGk.position.x = pData.pinkGk.x;
            this.paddles.pinkGk.position.z = pData.pinkGk.z;
        }
        if (this.paddles.redFw && pData.redFw) {
            this.paddles.redFw.position.x = pData.redFw.x;
            this.paddles.redFw.position.z = pData.redFw.z;
        }
        if (this.paddles.blueFw && pData.blueFw) {
            this.paddles.blueFw.position.x = pData.blueFw.x;
            this.paddles.blueFw.position.z = pData.blueFw.z;
        }
        if (this.paddles.pinkGkAI && pData.pinkGkAI) {
            this.paddles.pinkGkAI.position.x = pData.pinkGkAI.x;
            this.paddles.pinkGkAI.position.z = pData.pinkGkAI.z;
        }

        // 2. Track displacement to emit exhaust trails
        for (const [key, mesh] of Object.entries(this.paddles)) {
            if (!mesh) continue;
            
            const lastPos = ParticleManager.lastPaddlePositions[key] || { x: mesh.position.x, z: mesh.position.z };
            const dx = mesh.position.x - lastPos.x;
            const dz = mesh.position.z - lastPos.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist > 0.005) {
                // Determine exhaust direction (opposite to paddle movement)
                const ndx = -dx / dist;
                const ndz = -dz / dist;
                
                let lightColor = 0xffffff;
                if (key === 'pinkGk' || key === 'pinkGkAI') lightColor = 0xff1493;
                else if (key === 'redFw') lightColor = 0xff3b30;
                else if (key === 'blueFw') lightColor = 0x007aff;
                
                // Emit 1-2 glowing exhaust sparks behind the paddle
                const pCount = Math.random() < 0.65 ? 1 : 2;
                for (let i = 0; i < pCount; i++) {
                    const offsetZ = (Math.random() - 0.5) * 2.8;
                    const offsetX = (Math.random() - 0.5) * 0.4;
                    const px = mesh.position.x + ndx * 0.8 + offsetX;
                    const py = 0.4 + (Math.random() - 0.5) * 0.3;
                    const pz = mesh.position.z + ndz * 0.8 + offsetZ;
                    
                    const vx = ndx * (4.0 + Math.random() * 8.0) + (Math.random() - 0.5) * 1.5;
                    const vy = 0.5 + Math.random() * 2.0;
                    const vz = ndz * (4.0 + Math.random() * 8.0) + (Math.random() - 0.5) * 1.5;
                    
                    ParticleManager.spawnExhaust(px, py, pz, vx, vy, vz, lightColor);
                }
            }
            
            ParticleManager.lastPaddlePositions[key] = { x: mesh.position.x, z: mesh.position.z };
        }

        // 3. Update soft-body deformations
        PaddleDeformer.update(this.paddles, dt);
    },

    triggerPaddleImpact(key, relativeHitZ, ballSpeed, hitSideX = 1, isWallHit = false) {
        PaddleDeformer.triggerImpact(this.paddles, key, relativeHitZ, ballSpeed, hitSideX, isWallHit);
    },

    updateBall(ballData, isExploded = false) {
        if (!this.ballMesh) return;
        
        this.ballMesh.visible = !isExploded;
        
        const lastX = this.ballMesh.position.x;
        const lastZ = this.ballMesh.position.z;

        this.ballMesh.position.x = ballData.x;
        this.ballMesh.position.z = ballData.z;

        const dx = ballData.x - lastX;
        const dz = ballData.z - lastZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist > 0.001) {
            const rollSpeed = dist / ballData.radius;
            const axisX = dz / dist;
            const axisZ = -dx / dist;
            
            this.tempVector.set(axisX, 0, axisZ);
            this.tempQuaternion.setFromAxisAngle(this.tempVector, rollSpeed);
            this.ballMesh.quaternion.premultiply(this.tempQuaternion);
        }

        // Reuse trail history objects to prevent garbage collection pressure
        let historyObj;
        if (this.trailHistory.length >= this.maxTrailLength * 3) {
            historyObj = this.trailHistory.pop();
        } else {
            historyObj = {};
        }
        historyObj.x = ballData.x;
        historyObj.z = ballData.z;
        this.trailHistory.unshift(historyObj);

        const isHighSpeed = ballData.speed > 18;
        if (ParticleManager.trailSpheres) {
            ParticleManager.trailSpheres.forEach((sphere, idx) => {
                const historyIdx = (idx + 1) * 2;
                if (isHighSpeed && this.trailHistory[historyIdx]) {
                    const pos = this.trailHistory[historyIdx];
                    sphere.position.set(pos.x, ballData.radius, pos.z);
                    sphere.visible = true;
                } else {
                    sphere.visible = false;
                }
            });
        }

        // Spawn glowing ball wind trail particles
        const speed = ballData.speed || 0;
        if (speed > 5.0) {
            const dirX = -ballData.vx / speed;
            const dirZ = -ballData.vz / speed;
            
            if (Math.random() < 0.7) {
                const px = this.ballMesh.position.x + (Math.random() - 0.5) * 0.2;
                const py = ballData.radius + (Math.random() - 0.5) * 0.2;
                const pz = this.ballMesh.position.z + (Math.random() - 0.5) * 0.2;
                
                const vx = dirX * (1.5 + Math.random() * 3.0) + (Math.random() - 0.5) * 0.5;
                const vy = 0.3 + Math.random() * 0.8;
                const vz = dirZ * (1.5 + Math.random() * 3.0) + (Math.random() - 0.5) * 0.5;
                
                ParticleManager.spawnExhaust(px, py, pz, vx, vy, vz, 0xffffff);
            }
        }
    },

    setCameraSway(timeSeconds) {
        if (!this.camera) return;

        const horizontalSway = Math.sin(timeSeconds * 0.8) * 0.45;
        const verticalSway = Math.cos(timeSeconds * 0.95) * 0.24;
        const rotationSway = Math.sin(timeSeconds * 0.7) * (0.5 * Math.PI / 180);

        this.camera.position.x = this.baseCamPos.x + horizontalSway;
        this.camera.position.z = this.baseCamPos.z + verticalSway;
        
        // Re-align camera to lock onto the center of the pitch (3D tracking)
        this.camera.lookAt(0, -1.0, 0);

        // Apply a subtle roll tilt sway
        this.camera.rotation.z = rotationSway;

        // 1. Animate Corner Flags
        const flagWave = Math.sin(timeSeconds * 6) * 0.1;
        if (this.flagLeft && this.flagRight) {
            this.flagLeft.rotation.y = flagWave;
            this.flagRight.rotation.y = -flagWave;
        }

        // 2. Animate Goal Net Jiggle
        const dt = 1/60;
        if (this.netLeft) {
            if (this.netJiggleLeft > 0.01) {
                this.netJiggleLeft -= dt * 1.5;
                const jiggle = Math.sin(timeSeconds * 30) * 0.18 * this.netJiggleLeft;
                this.netLeft.scale.set(1.0 - jiggle, 1.0, 1.0);
            } else {
                this.netLeft.scale.set(1, 1, 1);
            }
        }

        if (this.netRight) {
            if (this.netJiggleRight > 0.01) {
                this.netJiggleRight -= dt * 1.5;
                const jiggle = Math.sin(timeSeconds * 30) * 0.18 * this.netJiggleRight;
                this.netRight.scale.set(1.0 + jiggle, 1.0, 1.0);
            } else {
                this.netRight.scale.set(1, 1, 1);
            }
        }

        // 3. Update celebration & exhaust particles
        ParticleManager.update(dt);

        // 3.5. Update spectator hopping/cheering animation
        if (this.cheerTime > 0) {
            if (this.cheerTime !== Infinity) {
                this.cheerTime -= dt;
            }
            if (this.spectators) {
                this.spectators.forEach(spectator => {
                    const phase = timeSeconds * spectator.userData.hopSpeed + spectator.userData.hopPhase;
                    const hop = Math.max(0, Math.sin(phase)) * 0.45;
                    spectator.position.y = spectator.userData.baseY + hop;
                });
            }
        } else if (this.spectators) {
            // Smoothly reset spectators to their base seats when cheering ends
            this.spectators.forEach(spectator => {
                if (spectator.position.y !== spectator.userData.baseY) {
                    spectator.position.y = spectator.userData.baseY;
                }
            });
        }
    },

    triggerGoalExplosion(goalX, goalZ, teamColorHex) {
        // Hide ball and trigger particles/shockwave
        ParticleManager.triggerGoalExplosion(goalX, goalZ, teamColorHex, this.ballMesh);
        
        // Cheer duration
        this.cheerTime = 6.0;
    },

    render() {
        if (this.composer) {
            this.composer.render();
        } else if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    },

    setAmbientIntensity(val) {
        if (this.ambientLight) this.ambientLight.intensity = val;
    },

    setSpotlightIntensity(val) {
        if (this.spotlights) {
            this.spotlights.forEach(spot => spot.intensity = val);
        }
    },

    setSpotlightHeight(val) {
        if (this.spotlights) {
            this.spotlights.forEach(spot => {
                spot.position.y = val;
            });
        }
    },

    setSpotlightDistance(val) {
        if (this.spotlights) {
            const baseDistance = 33.28;
            const scale = val / baseDistance;
            this.spotlights.forEach(spot => {
                if (spot.userData && spot.userData.originalX !== undefined) {
                    spot.position.x = spot.userData.originalX * scale;
                    spot.position.z = spot.userData.originalZ * scale;
                }
            });
        }
    },

    setShadowSoftness(val) {
        if (this.spotlights) {
            this.spotlights.forEach(spot => {
                spot.shadow.radius = val;
            });
        }
    },

    setUnderglowIntensity(val) {
        for (const paddle of Object.values(this.paddles)) {
            if (paddle.userData && paddle.userData.lights) {
                paddle.userData.lights.forEach(item => {
                    item.lightObject.intensity = val;
                });
            }
        }
    },

    setUnderglowHeight(val) {
        for (const paddle of Object.values(this.paddles)) {
            if (paddle.userData && paddle.userData.lights) {
                paddle.userData.lights.forEach(item => {
                    item.lightObject.position.y = val;
                });
            }
        }
    },

    setUnderglowSpread(val) {
        for (const paddle of Object.values(this.paddles)) {
            if (paddle.userData && paddle.userData.lights) {
                if (paddle.userData.lights.length === 3) {
                    paddle.userData.lights[0].lightObject.position.z = -val;
                    paddle.userData.lights[0].originalZ = -val;
                    
                    paddle.userData.lights[1].lightObject.position.z = 0;
                    paddle.userData.lights[1].originalZ = 0;
                    
                    paddle.userData.lights[2].lightObject.position.z = val;
                    paddle.userData.lights[2].originalZ = val;
                }
            }
        }
    },

    setHoverlightIntensity(val) {
        for (const paddle of Object.values(this.paddles)) {
            if (paddle.userData && paddle.userData.hoverLight) {
                paddle.userData.hoverLight.intensity = val;
            }
        }
    },

    setHoverlightHeight(val) {
        for (const paddle of Object.values(this.paddles)) {
            if (paddle.userData && paddle.userData.hoverLight) {
                paddle.userData.hoverLight.position.y = val;
            }
        }
    },

    setShadowsEnabled(enabled) {
        if (this.renderer) {
            this.renderer.shadowMap.enabled = enabled;
            this.scene.traverse(node => {
                if (node.material) {
                    node.material.needsUpdate = true;
                }
            });
        }
    },

    setRailLightWash(val) {
        if (this.leftRailLight) this.leftRailLight.intensity = val;
        if (this.rightRailLight) this.rightRailLight.intensity = val;
    },

    setSelfEmissiveIntensity(val) {
        this.currentEmissiveIntensity = val;
        this.scene.traverse(node => {
            if (node.isMesh && node.material) {
                if (node.material.emissive && node.material.emissiveIntensity !== undefined) {
                    node.material.emissiveIntensity = val;
                }
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => {
                        if (mat.emissive && mat.emissiveIntensity !== undefined) {
                            mat.emissiveIntensity = val;
                        }
                    });
                }
            }
        });
        if (this.bloomPass) {
            // Map emissive intensity (0.0 - 3.0) to bloom strength
            this.bloomPass.strength = val * 1.07;
        }
    }
};
