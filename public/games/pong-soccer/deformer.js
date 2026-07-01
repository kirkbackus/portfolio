/**
 * Paddle Deformer Module (deformer.js)
 * Handles spring-physics animations for paddle compression/bends under hit impacts.
 */

export function createPaddleTexture(colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. Dark black background
    ctx.fillStyle = '#0a0b0d';
    ctx.fillRect(0, 0, 128, 256);

    const strokeColor = '#' + colorHex.toString(16).padStart(6, '0');

    // 2. Thick outer glowing border (drawn at the canvas edge to cover 3D corners/seams)
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 16;
    ctx.lineJoin = 'miter';
    ctx.shadowColor = strokeColor;
    ctx.shadowBlur = 10;
    ctx.strokeRect(0, 0, 128, 256);

    // 3. Thin inner glowing line
    ctx.lineWidth = 4;
    ctx.shadowBlur = 6;
    ctx.strokeRect(14, 14, 100, 228);

    return new THREE.CanvasTexture(canvas);
}

export const PaddleDeformer = {
    springs: {
        pinkGk: {
            wall: { compression: 0, velocity: 0, hitZ: 0, stiffness: 100, damping: 10 },
            ball: { compression: 0, velocity: 0, hitZ: 0, hitSideX: 1, stiffness: 100, damping: 10 }
        },
        blueFw: {
            wall: { compression: 0, velocity: 0, hitZ: 0, stiffness: 100, damping: 10 },
            ball: { compression: 0, velocity: 0, hitZ: 0, hitSideX: 1, stiffness: 100, damping: 10 }
        },
        redFw: {
            wall: { compression: 0, velocity: 0, hitZ: 0, stiffness: 100, damping: 10 },
            ball: { compression: 0, velocity: 0, hitZ: 0, hitSideX: 1, stiffness: 100, damping: 10 }
        },
        pinkGkAI: {
            wall: { compression: 0, velocity: 0, hitZ: 0, stiffness: 100, damping: 10 },
            ball: { compression: 0, velocity: 0, hitZ: 0, hitSideX: 1, stiffness: 100, damping: 10 }
        }
    },

    update(paddles, dt) {
        for (const [key, springSet] of Object.entries(this.springs)) {
            const mesh = paddles[key];
            if (!mesh) continue;

            const wall = springSet.wall;
            const ball = springSet.ball;

            // 1. Solve wall-collision spring
            const wallForce = -wall.stiffness * wall.compression - wall.damping * wall.velocity;
            wall.velocity += wallForce * dt;
            wall.compression += wall.velocity * dt;

            // 2. Solve ball-impact spring
            const ballForce = -ball.stiffness * ball.compression - ball.damping * ball.velocity;
            ball.velocity += ballForce * dt;
            ball.compression += ball.velocity * dt;

            // Decay mesh emissive/shininess visual flashes back to baseline settings
            if (mesh.material) {
                // Return emissive color to the normal team color setting
                const targetEmIntensity = window.Game?.renderer?.currentEmissiveIntensity || 1.5;
                const curEm = mesh.material.emissiveIntensity;
                if (curEm > targetEmIntensity) {
                    mesh.material.emissiveIntensity = Math.max(targetEmIntensity, curEm - dt * 4.0);
                }

                // Return shininess to normal
                if (mesh.material.shininess > 120) {
                    mesh.material.shininess = Math.max(120, mesh.material.shininess - dt * 300);
                }
            }

            // 3. Deform paddle vertices by blending both spring states
            const geometry = mesh.geometry;
            const posAttr = geometry.attributes.position;
            const arr = posAttr.array;
            const orig = mesh.userData.originalPositions;
            const count = posAttr.count;

            if (orig) {
                const sigma = 0.50; // standard width deviation for the ball dent
                for (let i = 0; i < count; i++) {
                    const origX = orig[i * 3];
                    const origY = orig[i * 3 + 1];
                    const origZ = orig[i * 3 + 2];

                    let newX = origX;
                    let newZ = origZ;

                    // A: Apply wall squish (Vertical Z-axis scaling anchored at the hit wall edge)
                    if (Math.abs(wall.compression) > 0.0001) {
                        const anchorZ = wall.hitZ > 0 ? 2.0 : -2.0;
                        const factor = 1.0 - wall.compression * 0.28;
                        newZ = anchorZ + (origZ - anchorZ) * factor;
                    }

                    // B: Apply ball dent (Localized Gaussian indentation along the hit side X)
                    if (Math.abs(ball.compression) > 0.0001) {
                        const realDz = origZ - ball.hitZ;
                        const falloff = Math.exp(-(realDz * realDz) / (2 * sigma * sigma));
                        const dentAmount = ball.compression * 0.16 * falloff;
                        newX = origX - ball.hitSideX * dentAmount;
                    }

                    arr[i * 3] = newX;
                    arr[i * 3 + 1] = origY;
                    arr[i * 3 + 2] = newZ;
                }
                posAttr.needsUpdate = true;
                geometry.computeVertexNormals();

                // 4. Position paddle point lights under the deformed geometry coordinates
                if (mesh.userData.lights && mesh.userData.lights.length > 0) {
                    mesh.userData.lights.forEach(item => {
                        const origZ = item.originalZ;
                        let newZ = origZ;

                        if (Math.abs(wall.compression) > 0.0001) {
                            const anchorZ = wall.hitZ > 0 ? 2.0 : -2.0;
                            const factor = 1.0 - wall.compression * 0.28;
                            newZ = anchorZ + (origZ - anchorZ) * factor;
                        }

                        if (Math.abs(ball.compression) > 0.0001) {
                            const realDz = origZ - ball.hitZ;
                            const falloff = Math.exp(-(realDz * realDz) / (2 * sigma * sigma));
                            newZ = newZ + (origZ - ball.hitZ) * (ball.compression * 0.22 * falloff);
                        }

                        item.lightObject.position.z = newZ;
                    });
                }
            }
        }
    },

    triggerImpact(paddles, key, relativeHitZ, ballSpeed, hitSideX = 1, isWallHit = false) {
        const springSet = this.springs[key];
        if (!springSet) return;

        let strength = 0.03;
        if (ballSpeed > 30.0) {
            strength = 0.14;
        } else if (ballSpeed > 24.0) {
            strength = 0.10;
        } else if (ballSpeed > 16.0) {
            strength = 0.06;
        }

        const clampedHitZ = Math.max(-2.0, Math.min(2.0, relativeHitZ));

        if (isWallHit) {
            const wall = springSet.wall;
            wall.hitZ = clampedHitZ;
            wall.velocity = strength * 110;
        } else {
            const ball = springSet.ball;
            ball.hitZ = clampedHitZ;
            ball.hitSideX = hitSideX;
            ball.velocity = strength * 110;
        }

        const mesh = paddles[key];
        if (mesh && mesh.material) {
            mesh.material.emissive.setRGB(1.0, 1.0, 1.0);
            mesh.material.shininess = 350;
        }
    }
};
