/**
 * AI Opponent Controller (ai.js)
 * Controls the Blue Forward and Purple Goalkeeper paddles with difficulty-based behavior.
 */

const AI = {
    // Reaction and prediction state trackers
    lastUpdateTime: 0,
    targetGkZ: 0,
    targetFwZ: 0,
    
    // Difficulty configurations
    config: {
        easy: {
            speed: 9.0,         // Max movement speed
            delay: 350,         // Reaction delay in ms
            prediction: false,  // Predicts ball path
            errorRange: 1.8     // Random error offset applied to target
        },
        medium: {
            speed: 13.5,
            delay: 150,
            prediction: true,
            maxBounces: 1,      // Can predict 1 wall bounce
            errorRange: 0.8
        },
        hard: {
            speed: 18.0,
            delay: 0,           // Real-time tracking
            prediction: true,
            maxBounces: 4,      // Multi-bounce exact prediction
            errorRange: 0.0
        }
    },

    // Predict where the ball will intersect a vertical line at targetX
    predictIntercept(ball, targetX, wallMinZ, wallMaxZ, maxBounces) {
        if (ball.vx === 0) return ball.z;
        
        // Time to reach targetX
        const t = (targetX - ball.x) / ball.vx;
        if (t < 0) return 0; // Ball is moving away from the target line

        let z = ball.z + ball.vz * t;
        let vz = ball.vz;
        let timeRemaining = t;
        let currentZ = ball.z;
        let currentX = ball.x;
        
        // Trace bounces
        const halfHeight = (wallMaxZ - wallMinZ) / 2;
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
                // No more wall collisions before reaching targetX
                z = currentZ + vz * timeRemaining;
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
        
        return Math.max(wallMinZ, Math.min(wallMaxZ, z));
    },

    // Main update tick
    update(ball, aiFw, aiGk, arenaWidth, arenaHeight, diffName, deltaTime) {
        const now = Date.now();
        const settings = this.config[diffName] || this.config.medium;
        
        const halfW = arenaWidth / 2;
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

            // 1. Goalkeeper AI Logic (defends right goal at X = 18.0)
            if (ball.vx > 0) {
                // Ball is heading towards AI's side
                if (settings.prediction) {
                    this.targetGkZ = this.predictIntercept(
                        ball, 
                        aiGk.x, 
                        wallMinZ, 
                        wallMaxZ, 
                        settings.maxBounces || 1
                    );
                } else {
                    this.targetGkZ = ball.z;
                }
                
                // Add difficulty-based error
                if (settings.errorRange > 0) {
                    this.targetGkZ += (Math.random() * 2 - 1) * settings.errorRange;
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
                if (settings.prediction) {
                    this.targetFwZ = this.predictIntercept(
                        ball, 
                        aiFw.x, 
                        wallMinZ, 
                        wallMaxZ, 
                        settings.maxBounces || 1
                    );
                } else {
                    this.targetFwZ = ball.z;
                }

                if (settings.errorRange > 0) {
                    this.targetFwZ += (Math.random() * 2 - 1) * settings.errorRange;
                }
            } else {
                // Drift to center when ball is not in play zone
                this.targetFwZ = 0;
            }
            
            // Clamp forward target
            this.targetFwZ = Math.max(fwMinZ, Math.min(fwMaxZ, this.targetFwZ));
        }

        // Move paddles towards targets at configured speed
        const speed = settings.speed;
        
        // Move Goalkeeper (AI controls Purple at X = 18.0)
        let diffGkZ = this.targetGkZ - aiGk.z;
        if (Math.abs(diffGkZ) > 0.05) {
            const step = Math.sign(diffGkZ) * speed * deltaTime;
            aiGk.z += (Math.abs(step) > Math.abs(diffGkZ)) ? diffGkZ : step;
            aiGk.z = Math.max(gkMinZ, Math.min(gkMaxZ, aiGk.z));
            aiGk.velocity = Math.sign(diffGkZ) * speed;
        } else {
            aiGk.velocity = 0;
        }

        // Move Forward (AI controls Blue at X = -7.0)
        let diffFwZ = this.targetFwZ - aiFw.z;
        if (Math.abs(diffFwZ) > 0.05) {
            const step = Math.sign(diffFwZ) * speed * deltaTime;
            aiFw.z += (Math.abs(step) > Math.abs(diffFwZ)) ? diffFwZ : step;
            aiFw.z = Math.max(fwMinZ, Math.min(fwMaxZ, aiFw.z));
            aiFw.velocity = Math.sign(diffFwZ) * speed;
        } else {
            aiFw.velocity = 0;
        }
    }
};
