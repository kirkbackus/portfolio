class ParticleSystemManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];

        // Reusable geometries and materials to avoid GC overhead
        this.trailGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        this.trailMat = new THREE.MeshStandardMaterial({
            color: 0xcbd5e1, // Cool slate-grey shadow color
            transparent: true,
            opacity: 0.75,
            roughness: 0.8,
            flatShading: true
        });

        this.debrisGeo = new THREE.DodecahedronGeometry(0.1, 0);

        // Falling Snow system
        this.snowCount = 180;
        this.snowBounds = 40; // Size of the box around the player
        this.snowParticles = [];
        this.createEnvironmentSnow();
    }

    createEnvironmentSnow() {
        const snowGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(this.snowCount * 3);
        
        for (let i = 0; i < this.snowCount; i++) {
            // Randomize position in a box around origin
            positions[i * 3] = (Math.random() - 0.5) * this.snowBounds;
            positions[i * 3 + 1] = Math.random() * (this.snowBounds / 2) + 2; // Keep above ground level mostly
            positions[i * 3 + 2] = (Math.random() - 0.5) * this.snowBounds;
            
            this.snowParticles.push({
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    -(Math.random() * 0.15 + 0.1), // Downward drift
                    (Math.random() - 0.5) * 0.1
                )
            });
        }

        snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create a custom soft snow texture programmatically
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        const texture = new THREE.CanvasTexture(canvas);

        const snowMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.35,
            map: texture,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false
        });

        this.snowPoints = new THREE.Points(snowGeo, snowMat);
        this.scene.add(this.snowPoints);
    }

    updateEnvironmentSnow(playerPos) {
        if (!this.snowPoints) return;

        const positions = this.snowPoints.geometry.attributes.position.array;
        
        for (let i = 0; i < this.snowCount; i++) {
            const index = i * 3;
            
            // Apply velocity
            positions[index] += this.snowParticles[i].velocity.x;
            positions[index + 1] += this.snowParticles[i].velocity.y;
            positions[index + 2] += this.snowParticles[i].velocity.z;

            // Keep relative to player. If player moves, snow should wrap around them.
            // Check relative X distance
            const relX = positions[index] - playerPos.x;
            if (Math.abs(relX) > this.snowBounds / 2) {
                positions[index] = playerPos.x - Math.sign(relX) * (this.snowBounds / 2);
            }

            // Check relative Y distance
            if (positions[index + 1] < playerPos.y - 5) {
                positions[index + 1] = playerPos.y + this.snowBounds / 2;
            } else if (positions[index + 1] > playerPos.y + this.snowBounds / 2) {
                positions[index + 1] = playerPos.y - 5;
            }

            // Check relative Z distance
            const relZ = positions[index + 2] - playerPos.z;
            if (Math.abs(relZ) > this.snowBounds / 2) {
                positions[index + 2] = playerPos.z - Math.sign(relZ) * (this.snowBounds / 2);
            }
        }

        this.snowPoints.geometry.attributes.position.needsUpdate = true;
    }

    spawnSnowTrail(pos, speedPercent = 1) {
        const count = Math.ceil(speedPercent * 2);
        
        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.trailGeo, this.trailMat.clone());
            mesh.castShadow = true; // Cast tiny shadows on snow for visibility!
            mesh.position.copy(pos);
            // Offset slightly to spray from heels
            mesh.position.x += (Math.random() - 0.5) * 0.3;
            mesh.position.y += 0.05;
            mesh.position.z -= 0.15; // Just behind

            this.scene.add(mesh);

            this.particles.push({
                mesh: mesh,
                type: 'trail',
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.4,
                    Math.random() * 0.5 + 0.2, // Shoot upwards slightly
                    -(Math.random() * 0.5 + 0.5) // Spray backwards relative to direction
                ),
                maxLife: 0.4 + Math.random() * 0.2,
                life: 0.4 + Math.random() * 0.2,
                startScale: 1.0 + Math.random() * 0.5
            });
        }
    }

    spawnDebris(pos, colorHex, count = 12) {
        const mat = new THREE.MeshLambertMaterial({
            color: colorHex,
            flatShading: true
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.debrisGeo, mat);
            mesh.position.copy(pos);
            mesh.position.y += 0.2; // Spawn slightly off the ground

            // Random initial rotation
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            this.scene.add(mesh);

            this.particles.push({
                mesh: mesh,
                type: 'debris',
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    Math.random() * 3 + 2, // Explode upwards
                    (Math.random() - 0.5) * 3
                ),
                rotSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10
                ),
                maxLife: 0.8 + Math.random() * 0.4,
                life: 0.8 + Math.random() * 0.4,
                startScale: 1.0
            });
        }
    }

    spawnBloodSplatter(pos, count = 40) {
        const mat = new THREE.MeshBasicMaterial({
            color: 0xd60000, // Deep bright blood red
            flatShading: true
        });

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.debrisGeo, mat);
            mesh.position.copy(pos);
            mesh.position.y += 0.2;

            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            this.scene.add(mesh);

            // High velocity splatter
            this.particles.push({
                mesh: mesh,
                type: 'debris',
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 7,
                    Math.random() * 6 + 3, // Shoot high
                    (Math.random() - 0.5) * 7
                ),
                rotSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 15
                ),
                maxLife: 6.0 + Math.random() * 4.0, // Long life to paint the snow!
                life: 6.0 + Math.random() * 4.0,
                startScale: 0.8 + Math.random() * 0.8
            });
        }
    }

    update(dt, playerPos) {
        // Update regular particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                // If it's a debris particle, its material is cloned/unique, dispose it too
                if (p.type === 'debris') {
                    p.mesh.material.dispose();
                }
                this.particles.splice(i, 1);
                continue;
            }

            const lifeRatio = p.life / p.maxLife;

            // Apply movement
            if (p.type === 'debris') {
                // Apply gravity to debris
                p.velocity.y -= 9.8 * dt;
                
                // Rotations
                p.mesh.rotation.x += p.rotSpeed.x * dt;
                p.mesh.rotation.y += p.rotSpeed.y * dt;
                p.mesh.rotation.z += p.rotSpeed.z * dt;

                // Stop falling at ground level
                if (p.mesh.position.y <= 0.05) {
                    p.mesh.position.y = 0.05;
                    p.velocity.set(0, 0, 0); // Stop moving
                }
            }

            p.mesh.position.addScaledVector(p.velocity, dt);

            // Visual fade / scale down
            if (p.type === 'trail') {
                p.mesh.material.opacity = lifeRatio * 0.65;
                const s = lifeRatio * p.startScale;
                p.mesh.scale.set(s, s, s);
            } else if (p.type === 'debris') {
                if (lifeRatio < 0.5) {
                    const s = lifeRatio * 2;
                    p.mesh.scale.set(s, s, s);
                }
            }
        }

        // Update background falling snow
        this.updateEnvironmentSnow(playerPos);
    }

    clear() {
        // Remove all active particles
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            if (p.type === 'debris') {
                p.mesh.material.dispose();
            }
        }
        this.particles = [];
    }
}
