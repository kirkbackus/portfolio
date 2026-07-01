/**
 * Physics Engine (physics.js)
 * Handles basic ball kinematics, boundary checks, and collision deflection math.
 */

export const PhysicsEngine = {
    config: {
        paddleAcceleration: 120.0,
        paddleFriction: 70.0,
        ballSpeedIncrease: 1.02,
        momentumTransfer: 0.25
    },

    // Update ball coordinates based on velocity
    integrateBall(ball, dt) {
        ball.x += ball.vx * dt;
        ball.z += ball.vz * dt;
    },

    // Handle Wall Collisions (Top and Bottom)
    checkWallCollisions(ball, arenaHeight, onWallBounce) {
        const halfHeight = arenaHeight / 2;
        const wallLimitZ = halfHeight - ball.radius;
        
        if (Math.abs(ball.z) > wallLimitZ) {
            ball.z = Math.sign(ball.z) * wallLimitZ;
            ball.vz = -ball.vz * 0.98; // 2% energy loss on walls
            if (onWallBounce) {
                onWallBounce();
            }
        }
    },

    // Check Paddle collisions & resolve overlap
    checkPaddleCollisions(ball, paddles, onPaddleHit) {
        const halfW = 0.6; // paddle width = 1.2
        const halfH = 2.0; // paddle height = 4.0

        for (const [key, paddle] of Object.entries(paddles)) {
            // Ball should pass through the back of paddles to avoid disadvantage
            if (key === 'pinkGk' && ball.vx > 0) continue;   // Left GK blocks ball moving left
            if (key === 'blueFw' && ball.vx < 0) continue;   // Left FW blocks ball moving right
            if (key === 'redFw' && ball.vx > 0) continue;    // Right FW blocks ball moving left
            if (key === 'pinkGkAI' && ball.vx < 0) continue; // Right GK blocks ball moving right

            // Find closest point on paddle to ball center
            const closestX = Math.max(paddle.x - halfW, Math.min(paddle.x + halfW, ball.x));
            const closestZ = Math.max(paddle.z - halfH, Math.min(paddle.z + halfH, ball.z));

            // Calculate distance
            const distX = ball.x - closestX;
            const distZ = ball.z - closestZ;
            const distanceSq = distX * distX + distZ * distZ;

            if (distanceSq >= ball.radius * ball.radius) continue;

            // Collision occurred! Resolve overlap
            const distance = Math.sqrt(distanceSq);
            const overlap = ball.radius - distance;
            const dirX = (distance > 0.01) ? (distX / distance) : ((ball.vx > 0) ? -1 : 1);
            const dirZ = (distance > 0.01) ? (distZ / distance) : 0;
            
            // Push ball out
            ball.x += dirX * overlap;
            ball.z += dirZ * overlap;

            // Rebound angle math
            const bounceDirX = (paddle.x < ball.x) ? 1 : -1;
            
            // Speed calculation (increase per hit up to cap)
            ball.speed = Math.min(ball.speedCap, ball.speed * PhysicsEngine.config.ballSpeedIncrease);

            // Deflection based on offset from center of paddle along Z-axis
            const offsetZ = (ball.z - paddle.z) / halfH; // -1.0 to 1.0
            const maxDeflectionAngle = Math.PI / 4.5; // ~40 degrees
            const targetAngle = offsetZ * maxDeflectionAngle;

            // Combine deflection angle and lateral velocity transfer from moving paddle
            let targetVz = Math.sin(targetAngle) * ball.speed;
            if (paddle.velocity !== 0) {
                targetVz += paddle.velocity * PhysicsEngine.config.momentumTransfer; // dynamic momentum transfer
            }

            // Construct new velocity vector
            const targetVx = bounceDirX * Math.sqrt(Math.max(10.0, ball.speed * ball.speed - targetVz * targetVz));
            
            // Re-normalize and scale vector to exactly match ball.speed
            const actualSpeed = Math.sqrt(targetVx * targetVx + targetVz * targetVz);
            ball.vx = (targetVx / actualSpeed) * ball.speed;
            ball.vz = (targetVz / actualSpeed) * ball.speed;

            if (onPaddleHit) {
                onPaddleHit(key, ball.z - paddle.z, ball.speed, bounceDirX);
            }
        }
    },

    // Check if ball crossed a goal line
    checkGoalTrigger(ball, arenaWidth, goalWidth, onBackWallBounce) {
        const halfWidth = arenaWidth / 2;
        const goalThreshold = halfWidth;

        // 1. Goal Left (Defended by Player 1 Pink GK, attacked by AI Blue Forward)
        if (ball.x < -goalThreshold) {
            // Is it inside the goal net limits?
            if (Math.abs(ball.z) < goalWidth / 2) {
                return 'blue';
            }
            
            // Hit back wall, bounce back!
            ball.x = -goalThreshold;
            ball.vx = -ball.vx * 0.98;
            if (onBackWallBounce) {
                onBackWallBounce();
            }
            return null;
        }
        
        // 2. Goal Right (Defended by AI Purple GK, attacked by Player 1 Red Forward)
        if (ball.x > goalThreshold) {
            if (Math.abs(ball.z) < goalWidth / 2) {
                return 'red';
            }
            
            // Hit back wall, bounce back!
            ball.x = goalThreshold;
            ball.vx = -ball.vx * 0.98;
            if (onBackWallBounce) {
                onBackWallBounce();
            }
            return null;
        }

        return null;
    }
};
