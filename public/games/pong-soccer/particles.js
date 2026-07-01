/**
 * Particle VFX Module (particles.js)
 * Manages pooled particle effects including paddle movement exhaust trails, speed trails, and goal scoring explosions.
 */

export const ParticleSystem = {
    particles: [],

    createPool(scene) {
        const particleGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const colors = [0xffffff, 0xffaa00, 0xff0055, 0x00ffcc, 0x99ff00];
        
        for (let i = 0; i < 120; i++) {
            const pMat = new THREE.MeshBasicMaterial({ 
                color: colors[i % colors.length] 
            });
            const pMesh = new THREE.Mesh(particleGeo, pMat);
            pMesh.visible = false;
            scene.add(pMesh);
            
            this.particles.push({
                mesh: pMesh,
                vx: 0, vy: 0, vz: 0,
                life: 0
            });
        }
    },

    trigger(goalX, goalZ, teamColorHex) {
        this.particles.forEach((p, idx) => {
            p.mesh.position.set(goalX, 0.6, goalZ);
            p.mesh.visible = true;
            p.mesh.scale.setScalar(1.0 + Math.random() * 0.5); // randomized size!
            
            // Mix team colors and white/orange spark colors
            const isTeamColor = Math.random() < 0.65;
            p.mesh.material.color.setHex(isTeamColor ? teamColorHex : 0xffffff);
            
            // Spherical coordinates for a radial explosion
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            const speed = 10.0 + Math.random() * 18.0; // high speed Rocket League blast!
            
            p.vx = Math.sin(phi) * Math.cos(theta) * speed;
            p.vy = Math.max(0.1, Math.cos(phi)) * speed * 1.2; // project upwards
            p.vz = Math.sin(phi) * Math.sin(theta) * speed;
            p.life = 0.5 + Math.random() * 0.7; // random lifetime
        });
    },

    update(dt) {
        this.particles.forEach(p => {
            if (!p.mesh.visible) return;
            p.life -= dt * 0.95;
            
            if (p.life <= 0) {
                p.mesh.visible = false;
                return;
            }

            p.vy -= 9.8 * 1.2 * dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            
            if (p.mesh.position.y < 0.15) {
                p.mesh.position.y = 0.15;
                p.vy = -p.vy * 0.55;
            }

            p.mesh.rotation.x += p.vx * 0.5;
            p.mesh.rotation.y += p.vy * 0.5;
            p.mesh.scale.setScalar(p.life);
        });
    }
};

export const ParticleManager = {
    exhaustParticles: [],
    maxExhaustParticles: 250,
    exhaustPoolIndex: 0,
    lastPaddlePositions: {},

    trailSpheres: [],
    maxTrailLength: 8,

    shockwaveRing: null,
    shockwaveLife: 0,
    shockwaveMaxLife: 0.8,

    init(scene) {
        // 1. Setup ball trail spheres
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        const trailGeo = new THREE.SphereGeometry(0.35, 8, 6);

        this.trailSpheres = [];
        for (let i = 0; i < this.maxTrailLength; i++) {
            const sphere = new THREE.Mesh(trailGeo, trailMat.clone());
            const ratio = (this.maxTrailLength - i) / this.maxTrailLength;
            sphere.scale.setScalar(ratio);
            sphere.material.opacity = ratio * 0.16;
            sphere.visible = false;
            
            scene.add(sphere);
            this.trailSpheres.push(sphere);
        }

        // 2. Goal celebration particles
        ParticleSystem.createPool(scene);

        // 3. Paddle exhaust particles pool
        this.exhaustParticles = [];
        this.exhaustPoolIndex = 0;
        this.lastPaddlePositions = {};

        const exhaustGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
        for (let i = 0; i < this.maxExhaustParticles; i++) {
            const pMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8
            });
            const pMesh = new THREE.Mesh(exhaustGeo, pMat);
            pMesh.visible = false;
            scene.add(pMesh);
            this.exhaustParticles.push({
                mesh: pMesh,
                vx: 0, vy: 0, vz: 0,
                life: 0,
                maxLife: 0
            });
        }

        // 4. Goal explosion shockwave ring
        const ringGeo = new THREE.RingGeometry(0.1, 1.2, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0
        });
        this.shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
        this.shockwaveRing.rotation.x = -Math.PI / 2;
        scene.add(this.shockwaveRing);
        this.shockwaveLife = 0;
    },

    spawnExhaust(x, y, z, vx, vy, vz, colorHex) {
        if (!this.exhaustParticles || this.exhaustParticles.length === 0) return;
        const p = this.exhaustParticles[this.exhaustPoolIndex];
        p.mesh.position.set(x, y, z);
        p.mesh.material.color.setHex(colorHex);
        p.mesh.material.opacity = 0.8;
        p.mesh.scale.setScalar(1);
        p.mesh.visible = true;
        p.vx = vx;
        p.vy = vy;
        p.vz = vz;
        p.life = 0.4;
        p.maxLife = 0.4;
        
        this.exhaustPoolIndex = (this.exhaustPoolIndex + 1) % this.maxExhaustParticles;
    },

    triggerGoalExplosion(goalX, goalZ, teamColorHex, ballMesh) {
        if (ballMesh) {
            ballMesh.visible = false;
        }

        ParticleSystem.trigger(goalX, goalZ, teamColorHex);

        if (this.shockwaveRing) {
            this.shockwaveRing.position.set(goalX, 0.05, goalZ);
            this.shockwaveRing.scale.set(1, 1, 1);
            this.shockwaveRing.material.color.setHex(teamColorHex);
            this.shockwaveRing.material.opacity = 0.9;
            this.shockwaveLife = this.shockwaveMaxLife;
        }
    },

    update(dt) {
        // 1. Update exhaust particles
        this.exhaustParticles.forEach(p => {
            if (!p.mesh.visible) return;
            p.life -= dt;
            if (p.life <= 0) {
                p.mesh.visible = false;
            } else {
                p.mesh.position.x += p.vx * dt;
                p.mesh.position.y += p.vy * dt;
                p.mesh.position.z += p.vz * dt;
                p.mesh.material.opacity = (p.life / p.maxLife) * 0.8;
                p.mesh.scale.setScalar(p.life / p.maxLife);
            }
        });

        // 2. Update celebration particles
        ParticleSystem.update(dt);

        // 3. Update shockwave ring
        if (this.shockwaveLife > 0) {
            this.shockwaveLife -= dt;
            const progress = 1.0 - (this.shockwaveLife / this.shockwaveMaxLife);
            const scale = 1.0 + progress * 14.0;
            this.shockwaveRing.scale.set(scale, scale, 1);
            this.shockwaveRing.material.opacity = (1.0 - progress) * 0.9;
        } else if (this.shockwaveRing) {
            this.shockwaveRing.material.opacity = 0;
        }
    }
};
