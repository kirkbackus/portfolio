/**
 * AI Opponent Controller (ai.js)
 * Controls the Blue Forward and Purple Goalkeeper paddles with difficulty-based behavior.
 * Restructured into AIPredictor and AIController to implement SOLID principles.
 */

import { PhysicsEngine } from './physics.js';

export const AIPredictor = {
    // Predict where the ball will intersect a vertical line at targetX
    predictIntercept(ball, targetX, wallMinZ, wallMaxZ, maxBounces) {
        if (ball.vx === 0) return ball.z;
        
        // Time to reach targetX
        const t = (targetX - ball.x) / ball.vx;
        if (t < 0) return 0; // Ball is moving away from the target line

        let vz = ball.vz;
        let timeRemaining = t;
        let currentZ = ball.z;
        
        // Trace bounces
        let bounceCount = 0;
        
        while (bounceCount < maxBounces) {
            // Find next wall collision time
            let tWall = Infinity;
            if (vz > 0) {
                tWall = (wallMaxZ - currentZ) / vz;
            } else if (vz < 0) {
                tWall = (wallMinZ - currentZ) / vz;
            }

            if (tWall < 0 || tWall >= timeRemaining) {
                break;
            }

            // Move to collision point
            timeRemaining -= tWall;
            currentZ = currentZ + vz * tWall;
            // Bounce
            vz = -vz * 0.98; // accounting for 2% energy loss on wall hits
            currentZ = Math.max(wallMinZ, Math.min(wallMaxZ, currentZ));
            bounceCount++;
        }
        
        const finalZ = currentZ + vz * timeRemaining;
        return Math.max(wallMinZ, Math.min(wallMaxZ, finalZ));
    }
};

export const AIController = {
    // Reaction and prediction state trackers
    lastUpdateTime: 0,
    targetGkZ: 0,
    targetFwZ: 0,
    
    // Difficulty configurations
    config: {
        easy: {
            speed: 12.0,         // Max movement speed (fallback)
            fwSpeed: 12.0,
            gkSpeed: 8.0,       // Slower goalkeeper speed
            delay: 350,         // Reaction delay in ms
            prediction: false,  // Predicts ball path
            errorRange: 1.8,    // Random error offset (fallback)
            gkErrorRange: 2.8   // Large error range for goalkeeper
        },
        medium: {
            speed: 18.0,
            fwSpeed: 18.0,
            gkSpeed: 12.5,       // Slower goalkeeper speed
            delay: 150,
            prediction: true,
            maxBounces: 1,      // Can predict 1 wall bounce
            errorRange: 0.8,
            gkErrorRange: 1.6
        },
        hard: {
            speed: 24.0,
            fwSpeed: 24.0,
            gkSpeed: 18.0,      // Goalkeeper is slightly slower even on hard
            delay: 0,           // Real-time tracking
            prediction: true,
            maxBounces: 4,      // Multi-bounce exact prediction
            errorRange: 0.0,
            gkErrorRange: 0.6
        }
    },

    // Main update tick
    update(ball, aiFw, aiGk, arenaWidth, arenaHeight, diffName, deltaTime) {
        const now = Date.now();
        const settings = this.config[diffName] || this.config.medium;
        
        const halfH = arenaHeight / 2;
        
        // Define wall bounds for ball center (accounting for ball radius)
        const ballRad = 0.6;
        const wallMinZ = -halfH + ballRad;
        const wallMaxZ = halfH - ballRad;

        // Goalkeeper Z constraint (restricted to penalty box: e.g., -6 to 6)
        const gkMinZ = -6.0;
        const gkMaxZ = 6.0;
        
        // Forward Z constraint (full field)
        const fwMinZ = -halfH + 2.0; // Paddle half-height buffer
        const fwMaxZ = halfH - 2.0;

        // Update target decisions periodically based on difficulty delay
        if (now - this.lastUpdateTime > settings.delay) {
            this.lastUpdateTime = now;
            this.recalculateTargets(ball, aiFw, aiGk, wallMinZ, wallMaxZ, gkMinZ, gkMaxZ, fwMinZ, fwMaxZ, settings);
        }

        // Move paddles towards targets at configured speed
        const gkSpeed = settings.gkSpeed !== undefined ? settings.gkSpeed : settings.speed;
        const fwSpeed = settings.fwSpeed !== undefined ? settings.fwSpeed : settings.speed;
        this.movePaddle(aiGk, this.targetGkZ, gkSpeed, gkMinZ, gkMaxZ, deltaTime);
        this.movePaddle(aiFw, this.targetFwZ, fwSpeed, fwMinZ, fwMaxZ, deltaTime);
    },

    recalculateTargets(ball, aiFw, aiGk, wallMinZ, wallMaxZ, gkMinZ, gkMaxZ, fwMinZ, fwMaxZ, settings) {
        // 1. Goalkeeper AI Logic (defends right goal at X = 18.0)
        if (ball.vx > 0) {
            // Ball is heading towards AI's side
            this.targetGkZ = settings.prediction 
                ? AIPredictor.predictIntercept(ball, aiGk.x, wallMinZ, wallMaxZ, settings.maxBounces || 1)
                : ball.z;
            
            // Add difficulty-based error
            const gkErr = settings.gkErrorRange !== undefined ? settings.gkErrorRange : settings.errorRange;
            if (gkErr > 0) {
                this.targetGkZ += (Math.random() * 2 - 1) * gkErr;
            }
        } else {
            // Ball is moving away, drift back to center of penalty box
            this.targetGkZ = 0;
        }

        // Clamp goalkeeper target to penalty area
        this.targetGkZ = Math.max(gkMinZ, Math.min(gkMaxZ, this.targetGkZ));

        // 2. Forward AI Logic (attacks/defends mid-left at X = -7.0)
        // AI Forward intercepts the ball only on the left half of the field (ball.x < 0)
        if (ball.x < 0 && ball.vx < 0) {
            this.targetFwZ = settings.prediction
                ? AIPredictor.predictIntercept(ball, aiFw.x, wallMinZ, wallMaxZ, settings.maxBounces || 1)
                : ball.z;

            if (settings.errorRange > 0) {
                this.targetFwZ += (Math.random() * 2 - 1) * settings.errorRange;
            }
        } else {
            // Drift to center when ball is not in play zone
            this.targetFwZ = 0;
        }
        
        // Clamp forward target
        this.targetFwZ = Math.max(fwMinZ, Math.min(fwMaxZ, this.targetFwZ));
    },

    movePaddle(paddle, targetZ, speed, minZ, maxZ, deltaTime) {
        const diffZ = targetZ - paddle.z;
        if (Math.abs(diffZ) <= 0.05) {
            paddle.velocity = 0;
            return;
        }

        // Apply acceleration to AI paddle velocity to simulate momentum
        const acceleration = PhysicsEngine.config.paddleAcceleration;
        const targetVelocity = Math.sign(diffZ) * speed;
        const velDiff = targetVelocity - paddle.velocity;
        const accelStep = Math.sign(velDiff) * acceleration * deltaTime;
        paddle.velocity += (Math.abs(accelStep) > Math.abs(velDiff)) ? velDiff : accelStep;

        const step = paddle.velocity * deltaTime;
        paddle.z += (Math.abs(step) > Math.abs(diffZ)) ? diffZ : step;
        paddle.z = Math.max(minZ, Math.min(maxZ, paddle.z));
    }
};
