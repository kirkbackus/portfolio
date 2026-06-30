// Playtest log bridge to local receiver
(function() {
    function sendLog(type, message) {
        fetch('http://localhost:8081/log', {
            method: 'POST',
            body: `[${type}] ${message}`
        }).catch(() => {});
    }

    const originalLog = console.log;
    console.log = function(...args) {
        originalLog.apply(console, args);
        sendLog('INFO', args.join(' '));
    };

    const originalError = console.error;
    console.error = function(...args) {
        originalError.apply(console, args);
        sendLog('ERROR', args.join(' '));
    };

    window.onerror = function(message, source, lineno, colno, error) {
        sendLog('FATAL', `${message} at ${source}:${lineno}:${colno}`);
        return false;
    };
})();

const Game = {
    // Game dimensions
    arenaWidth: 40.0,
    arenaHeight: 22.0,
    goalWidth: 8.0,

    // Difficulty setting
    difficulty: 'medium',
    gameMode: '1p', // '1p' (vs AI) or '2p' (local 2 players)

    // Game state
    state: 'TITLE', // TITLE, KICKOFF, PLAY, GOAL, VICTORY
    scores: { red: 0, blue: 0 },
    maxScore: 5,
    rallyCount: 0,
    maxRallyRecord: 0,
    maxBallSpeedRecord: 0,

    // Timers
    kickoffTimer: 0,
    stateTimer: 0,

    // Physics Timestep
    lastTime: 0,
    accumulator: 0,
    fixedTimeStep: 1 / 60, // 60 updates per second

    // Game Entities
    ball: {
        x: 0, z: 0,
        vx: 0, vz: 0,
        radius: 0.6,
        baseSpeed: 16.0,
        speed: 16.0,
        speedCap: 35.0
    },

    paddles: {
        // Red team (Player 1)
        pinkGk: { x: -18.0, z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 6.0 },   // Goalkeeper
        redFw:  { x: 7.0,   z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 9.0 },   // Forward
        // Blue team (AI)
        blueFw: { x: -7.0,  z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 9.0 },   // Forward
        pinkGkAI:{ x: 18.0, z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 6.0 }    // Goalkeeper (AI controls Purple)
    },

    autoplay: false,

    // Initialize Game
    init() {
        // Initialize inputs
        Controls.init();

        // Check Autoplay Mode
        const urlParams = new URLSearchParams(window.location.search);
        this.autoplay = urlParams.get('autoplay') === 'true';

        // Hook up UI Event Listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('sound-toggle').addEventListener('click', () => AudioManager.toggleMute());
        document.getElementById('rematch-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('menu-btn').addEventListener('click', () => this.showMainMenu());

        // Game Mode selector
        const modeBtns = document.querySelectorAll('.mode-btn');
        const diffSection = document.getElementById('difficulty-section');
        const controls1p = document.getElementById('controls-1p');
        const controls2p = document.getElementById('controls-2p');
        
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.gameMode = btn.dataset.mode;
                
                if (this.gameMode === '2p') {
                    diffSection.style.display = 'none';
                    controls1p.style.display = 'none';
                    controls2p.style.display = 'block';
                } else {
                    diffSection.style.display = 'block';
                    controls1p.style.display = 'block';
                    controls2p.style.display = 'none';
                }
            });
        });

        // Difficulty Buttons
        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
            });
        });

        // Initialize Renderer
        Renderer.init(document.getElementById('canvas-container'));

        // Start requestAnimationFrame loop
        this.lastTime = null;
        requestAnimationFrame((t) => this.loop(t));

        // Start autoplay if requested
        if (this.autoplay) {
            this.startGame();
        }
    },

    // Main Game Loop
    loop(time) {
        if (this.lastTime === null) {
            this.lastTime = time;
        }
        let deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Prevent negative delta times (e.g., if performance.now and RAF times use different epochs)
        if (deltaTime < 0) deltaTime = 0;
        if (deltaTime > 0.1) deltaTime = 0.1;

        // Periodic debug logging for playtesting
        this.debugFrameCount = (this.debugFrameCount || 0) + 1;
        if (this.debugFrameCount % 120 === 0) {
            console.log(`[DEBUG] Frame: ${this.debugFrameCount} | State: ${this.state} | KickoffTimer: ${this.kickoffTimer.toFixed(2)} | Ball: (${this.ball.x.toFixed(1)}, ${this.ball.z.toFixed(1)}) | Rally: ${this.rallyCount}`);
        }

        // Update camera idle sway (pass current time in seconds)
        Renderer.setCameraSway(time / 1000);

        if (this.state !== 'TITLE') {
            this.accumulator += deltaTime;
            
            // Fixed timestep loop for physics
            while (this.accumulator >= this.fixedTimeStep) {
                this.updatePhysics(this.fixedTimeStep);
                this.accumulator -= this.fixedTimeStep;
            }

            // Sync physics coordinate data to 3D Renderer elements
            Renderer.updatePaddles(this.paddles, deltaTime);
            Renderer.updateBall(this.ball);
        }

        // Render scene
        Renderer.render();

        requestAnimationFrame((t) => this.loop(t));
    },

    // Physics & State Updates
    updatePhysics(dt) {
        // 1. Update Game Timers based on state
        if (this.state === 'KICKOFF') {
            this.kickoffTimer -= dt;
            if (this.kickoffTimer <= 0) {
                this.state = 'PLAY';
                document.getElementById('countdown').innerText = '';
                document.getElementById('game-status').innerText = 'GO!';
                this.launchBall();
            } else {
                document.getElementById('countdown').innerText = Math.ceil(this.kickoffTimer);
                // Keep ball stationary during countdown countdown
                this.ball.vx = 0;
                this.ball.vz = 0;
            }
        } else if (this.state === 'GOAL') {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                if (this.scores.red >= this.maxScore || this.scores.blue >= this.maxScore) {
                    this.endGame();
                } else {
                    this.startKickoff();
                }
            }
        }

        // 2. Process Player Paddle Inputs
        let inputs = { player1: 0, player2: 0 };
        const playerSpeed = 18.0;

        if (this.autoplay) {
            // Autoplay AI logic: track ball Z when it moves towards us or is close
            // Player 1 (Red team - moves both pinkGk and redFw together)
            const targetP1Z = (this.ball.x > 0 && this.ball.vx > 0) 
                ? Math.max(-this.paddles.redFw.limitZ, Math.min(this.paddles.redFw.limitZ, this.ball.z)) 
                : Math.max(-this.paddles.pinkGk.limitZ, Math.min(this.paddles.pinkGk.limitZ, this.ball.z));
            const diffP1 = targetP1Z - this.paddles.redFw.z;
            if (Math.abs(diffP1) > 0.05) {
                inputs.player1 = Math.sign(diffP1) * 0.95;
            }

            // Player 2 (Blue team - moves both blueFw and pinkGkAI together)
            const targetP2Z = (this.ball.x < 0 && this.ball.vx < 0) 
                ? Math.max(-this.paddles.blueFw.limitZ, Math.min(this.paddles.blueFw.limitZ, this.ball.z)) 
                : Math.max(-this.paddles.pinkGkAI.limitZ, Math.min(this.paddles.pinkGkAI.limitZ, this.ball.z));
            const diffP2 = targetP2Z - this.paddles.blueFw.z;
            if (Math.abs(diffP2) > 0.05) {
                inputs.player2 = Math.sign(diffP2) * 0.95;
            }
        } else {
            // Keyboard / Gamepad inputs
            inputs = Controls.getInputs();
        }

        // Move Player 1 (Red Team - both GK and FW move together)
        if (inputs.player1 !== 0) {
            this.paddles.pinkGk.z += inputs.player1 * playerSpeed * dt;
            this.paddles.pinkGk.z = Math.max(-this.paddles.pinkGk.limitZ, Math.min(this.paddles.pinkGk.limitZ, this.paddles.pinkGk.z));
            this.paddles.pinkGk.velocity = inputs.player1 * playerSpeed;

            this.paddles.redFw.z += inputs.player1 * playerSpeed * dt;
            this.paddles.redFw.z = Math.max(-this.paddles.redFw.limitZ, Math.min(this.paddles.redFw.limitZ, this.paddles.redFw.z));
            this.paddles.redFw.velocity = inputs.player1 * playerSpeed;
        } else {
            this.paddles.pinkGk.velocity = 0;
            this.paddles.redFw.velocity = 0;
        }

        // Move Player 2 (Blue Team)
        if (this.gameMode === '2p') {
            // In 2 Player mode, Player 2 controls the Blue team (both GK and FW move together)
            if (inputs.player2 !== 0) {
                this.paddles.pinkGkAI.z += inputs.player2 * playerSpeed * dt;
                this.paddles.pinkGkAI.z = Math.max(-this.paddles.pinkGkAI.limitZ, Math.min(this.paddles.pinkGkAI.limitZ, this.paddles.pinkGkAI.z));
                this.paddles.pinkGkAI.velocity = inputs.player2 * playerSpeed;

                this.paddles.blueFw.z += inputs.player2 * playerSpeed * dt;
                this.paddles.blueFw.z = Math.max(-this.paddles.blueFw.limitZ, Math.min(this.paddles.blueFw.limitZ, this.paddles.blueFw.z));
                this.paddles.blueFw.velocity = inputs.player2 * playerSpeed;
            } else {
                this.paddles.pinkGkAI.velocity = 0;
                this.paddles.blueFw.velocity = 0;
            }
        } else {
            // In 1 Player mode, AI controls the Blue team
            AI.update(
                this.ball, 
                this.paddles.blueFw, 
                this.paddles.pinkGkAI, 
                this.arenaWidth, 
                this.arenaHeight, 
                this.difficulty, 
                dt
            );
        }

        // 4. Update Ball Physics if state is PLAY or GOAL (for post-goal physics rolling)
        if (this.state === 'PLAY' || this.state === 'GOAL') {
            // Apply velocity
            this.ball.x += this.ball.vx * dt;
            this.ball.z += this.ball.vz * dt;

            // Handle Wall Collisions (Top and Bottom)
            const halfHeight = this.arenaHeight / 2;
            const wallLimitZ = halfHeight - this.ball.radius;
            if (Math.abs(this.ball.z) > wallLimitZ) {
                this.ball.z = Math.sign(this.ball.z) * wallLimitZ;
                this.ball.vz = -this.ball.vz * 0.98; // 2% energy loss on walls
                AudioManager.playBounceWall();
            }

            // If state is PLAY, check goal triggers and paddle hits
            if (this.state === 'PLAY') {
                this.checkPaddleCollisions();
                this.checkGoalTrigger();
            }
        }
    },

    // Check collision between ball and all paddles
    checkPaddleCollisions() {
        for (const [key, paddle] of Object.entries(this.paddles)) {
            // Ball should pass through the back of paddles to avoid disadvantage
            if (key === 'pinkGk' && this.ball.vx > 0) continue;   // Left Goalkeeper only blocks ball moving left
            if (key === 'blueFw' && this.ball.vx < 0) continue;   // Left Forward (AI) only blocks ball moving right
            if (key === 'redFw' && this.ball.vx > 0) continue;    // Right Forward (Player) only blocks ball moving left
            if (key === 'pinkGkAI' && this.ball.vx < 0) continue; // Right Goalkeeper (AI) only blocks ball moving right

            // AABB-Sphere Collision Check
            const halfW = paddle.width / 2;
            const halfH = paddle.height / 2;

            // Find closest point on paddle to ball center
            const closestX = Math.max(paddle.x - halfW, Math.min(paddle.x + halfW, this.ball.x));
            const closestZ = Math.max(paddle.z - halfH, Math.min(paddle.z + halfH, this.ball.z));

            // Calculate distance
            const distX = this.ball.x - closestX;
            const distZ = this.ball.z - closestZ;
            const distanceSq = distX * distX + distZ * distZ;

            if (distanceSq < this.ball.radius * this.ball.radius) {
                // Collision occurred!
                // 1. Resolve overlap (push ball out of paddle along collision axis)
                const distance = Math.sqrt(distanceSq);
                
                // If overlap is tiny or ball is exactly centered, push along X-axis direction
                const overlap = this.ball.radius - distance;
                const dirX = (distance > 0.01) ? (distX / distance) : ((this.ball.vx > 0) ? -1 : 1);
                const dirZ = (distance > 0.01) ? (distZ / distance) : 0;
                
                // Push ball out
                this.ball.x += dirX * overlap;
                this.ball.z += dirZ * overlap;

                // 2. Rebound angle math
                // Invert horizontal velocity direction
                const bounceDirX = (paddle.x < this.ball.x) ? 1 : -1;
                
                // Speed calculation (increase 2% per hit up to cap)
                this.ball.speed = Math.min(this.ball.speedCap, this.ball.speed * 1.02);
                if (this.ball.speed > this.maxBallSpeedRecord) {
                    this.maxBallSpeedRecord = this.ball.speed;
                }

                // Deflection based on offset from center of paddle along Z-axis
                const offsetZ = (this.ball.z - paddle.z) / halfH; // -1.0 to 1.0
                const maxDeflectionAngle = Math.PI / 4.5; // ~40 degrees
                const targetAngle = offsetZ * maxDeflectionAngle;

                // Combine deflection angle and lateral velocity transfer from moving paddle
                let targetVz = Math.sin(targetAngle) * this.ball.speed;
                if (paddle.velocity !== 0) {
                    targetVz += paddle.velocity * 0.25; // 25% momentum transfer
                }

                // Construct new velocity vector
                let targetVx = bounceDirX * Math.sqrt(Math.max(10.0, this.ball.speed * this.ball.speed - targetVz * targetVz));
                
                // Re-normalize and scale vector to exactly match this.ball.speed
                const actualSpeed = Math.sqrt(targetVx * targetVx + targetVz * targetVz);
                this.ball.vx = (targetVx / actualSpeed) * this.ball.speed;
                this.ball.vz = (targetVz / actualSpeed) * this.ball.speed;

                // Play Audio
                AudioManager.playBouncePaddle();

                // Trigger visual soft-body deformation in the 3D Renderer
                const relativeHitZ = this.ball.z - paddle.z;
                Renderer.triggerPaddleImpact(key, relativeHitZ, this.ball.speed);

                // Increment Rally Count
                this.rallyCount++;
                if (this.rallyCount > this.maxRallyRecord) {
                    this.maxRallyRecord = this.rallyCount;
                }
                
                // Update crowd noise & HUD elements
                AudioManager.updateCrowdAmbience(this.rallyCount);
                this.updateHUDStats();
            }
        }
    },

    // Check if ball crossed a goal line
    checkGoalTrigger() {
        const halfWidth = this.arenaWidth / 2;
        const goalThreshold = halfWidth;

        // 1. Goal Left (Defended by Player 1 Pink GK, attacked by AI Blue Forward)
        if (this.ball.x < -goalThreshold) {
            // Is it inside the goal net limits?
            if (Math.abs(this.ball.z) < this.goalWidth / 2) {
                // GOAL FOR BLUE!
                this.triggerGoalScore('blue');
            } else {
                // Hit back wall, bounce back!
                this.ball.x = -goalThreshold;
                this.ball.vx = -this.ball.vx * 0.98;
                AudioManager.playBounceWall();
            }
        }
        // 2. Goal Right (Defended by AI Purple GK, attacked by Player 1 Red Forward)
        else if (this.ball.x > goalThreshold) {
            if (Math.abs(this.ball.z) < this.goalWidth / 2) {
                // GOAL FOR RED!
                this.triggerGoalScore('red');
            } else {
                // Hit back wall, bounce back!
                this.ball.x = goalThreshold;
                this.ball.vx = -this.ball.vx * 0.98;
                AudioManager.playBounceWall();
            }
        }
    },

    // Handle goal scoring sequence
    triggerGoalScore(scoringTeam) {
        this.state = 'GOAL';
        this.stateTimer = 2.5; // Wait 2.5 seconds before kickoff

        // Play Goal audio and trigger 3D effects
        AudioManager.playGoal();
        
        const goalX = (scoringTeam === 'red') ? this.arenaWidth/2 : -this.arenaWidth/2;
        Renderer.triggerGoalParticles(goalX, this.ball.z);
        Renderer.triggerNetJiggle(scoringTeam === 'red' ? 'right' : 'left');

        // Update score and trigger visual flash on HUD scorecard
        if (scoringTeam === 'red') {
            this.scores.red++;
            document.getElementById('score-red').innerText = this.scores.red;
            document.getElementById('game-status').innerText = 'RED GOAL!';
            
            const card = document.getElementById('score-red').parentElement;
            card.classList.add('flash');
            setTimeout(() => card.classList.remove('flash'), 500);
        } else {
            this.scores.blue++;
            document.getElementById('score-blue').innerText = this.scores.blue;
            document.getElementById('game-status').innerText = 'BLUE GOAL!';
            
            const card = document.getElementById('score-blue').parentElement;
            card.classList.add('flash');
            setTimeout(() => card.classList.remove('flash'), 500);
        }

        // Reset rally count
        this.rallyCount = 0;
        AudioManager.updateCrowdAmbience(0);
        this.updateHUDStats();
    },

    // Launch ball at kickoff
    launchBall() {
        this.ball.x = 0;
        this.ball.z = 0;
        this.ball.speed = this.ball.baseSpeed;

        // Choose random direction (primarily horizontal but with Z velocity)
        // Ensure angle is not too vertical
        const angleRange = Math.PI / 4; // +/- 45 degrees
        const direction = Math.random() < 0.5 ? -1 : 1; // Left or Right
        const angle = (Math.random() * 2 - 1) * angleRange;

        this.ball.vx = direction * Math.cos(angle) * this.ball.speed;
        this.ball.vz = Math.sin(angle) * this.ball.speed;
        
        this.updateHUDStats();
    },

    // Set up kickoff countdown
    startKickoff() {
        this.state = 'KICKOFF';
        this.kickoffTimer = 3.0;
        
        // Reset ball position
        this.ball.x = 0;
        this.ball.z = 0;
        this.ball.vx = 0;
        this.ball.vz = 0;
        this.ball.speed = this.ball.baseSpeed;

        document.getElementById('game-status').innerText = 'GET READY!';
        document.getElementById('countdown').innerText = '3';
        this.updateHUDStats();
    },

    // HUD Update
    updateHUDStats() {
        // Render speeds in arbitrary km/h units for arcade flavor
        const kmh = Math.round(this.ball.speed * 6.5);
        document.getElementById('ball-speed').innerText = `${kmh} km/h`;
        document.getElementById('rally-count').innerText = this.rallyCount;
    },

    // Action handlers for menus
    startGame() {
        // Initialize audio on first click
        AudioManager.init();

        // Scale ball base speed and cap speed by difficulty setting
        if (this.difficulty === 'easy') {
            this.ball.baseSpeed = 12.0;
            this.ball.speedCap = 20.0;
        } else if (this.difficulty === 'hard') {
            this.ball.baseSpeed = 18.0;
            this.ball.speedCap = 42.0;
        } else { // medium
            this.ball.baseSpeed = 16.0;
            this.ball.speedCap = 30.0;
        }
        this.ball.speed = this.ball.baseSpeed;

        // Switch Screen displays
        if (this.autoplay) {
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('title-screen').style.transition = 'none';
        }
        document.getElementById('title-screen').classList.remove('active');
        document.getElementById('hud').classList.add('active');

        // Reset game stats
        this.scores.red = 0;
        this.scores.blue = 0;
        this.rallyCount = 0;
        this.maxRallyRecord = 0;
        this.maxBallSpeedRecord = this.ball.baseSpeed;

        document.getElementById('score-red').innerText = '0';
        document.getElementById('score-blue').innerText = '0';

        // Reset paddles to center
        for (const [key, paddle] of Object.entries(this.paddles)) {
            paddle.z = 0;
            paddle.velocity = 0;
        }

        // Play initial crowd sound
        AudioManager.updateCrowdAmbience(0);

        // Start background music loop
        AudioManager.startBGM();

        this.startKickoff();
    },

    endGame() {
        this.state = 'VICTORY';
        
        // Play final chiptune fanfare
        AudioManager.playVictory();

        // Stop background music loop
        AudioManager.stopBGM();

        // Show victory modal overlay
        document.getElementById('hud').classList.remove('active');
        
        const winTitle = document.getElementById('victory-title');
        const winnerText = (this.scores.red >= this.maxScore) ? 'RED TEAM WINS!' : 'BLUE TEAM WINS!';
        winTitle.innerText = winnerText;
        winTitle.style.color = (this.scores.red >= this.maxScore) ? 'var(--red-primary)' : 'var(--blue-primary)';

        // Display stats
        document.getElementById('max-rally').innerText = this.maxRallyRecord;
        document.getElementById('max-speed').innerText = `${Math.round(this.maxBallSpeedRecord * 6.5)} km/h`;

        document.getElementById('victory-screen').classList.add('active');
    },

    restartGame() {
        document.getElementById('victory-screen').classList.remove('active');
        this.startGame();
    },

    showMainMenu() {
        document.getElementById('victory-screen').classList.remove('active');
        document.getElementById('title-screen').classList.add('active');
        this.state = 'TITLE';

        // Stop BGM if player returns to main menu
        AudioManager.stopBGM();
    }
};

// Start game after DOM load
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
