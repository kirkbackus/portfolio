/**
 * Main Game Orchestrator (game.js)
 * Ties together inputs, physics engine, state machines, sound effects, and rendering loops.
 */

import { Controls } from './controls.js';
import { AudioManager } from './audio.js';
import { AIController } from './ai.js';
import { Renderer } from './renderer.js';
import { PhysicsEngine } from './physics.js';
import { GameState } from './gamestate.js';

const DEFAULT_LIGHTING = {
    'ambient-intensity': 0.90,
    'spotlight-intensity': 0.35,
    'spotlight-height': 20.0,
    'spotlight-distance': 33.28,
    'shadow-softness': 16.0,
    'underglow-intensity': 5.0,
    'underglow-height': -0.40,
    'underglow-spread': 0.65,
    'emissive-intensity': 1.5,
    'rail-wash': 0.40,
    'shadows-enabled': true
};

const DEFAULT_PHYSICS = {
    'phys-paddle-accel': 120.0,
    'phys-paddle-friction': 70.0,
    'phys-ball-speed-cap': 38.0,
    'phys-ball-speed-mult': 1.02,
    'phys-momentum-transfer': 0.25
};

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

    if (typeof window !== 'undefined') {
        window.onerror = function(message, source, lineno, colno, error) {
            sendLog('FATAL', `${message} at ${source}:${lineno}:${colno}`);
            return false;
        };
    }
})();

export const Game = {
    // Game dimensions
    arenaWidth: 40.0,
    arenaHeight: 22.0,
    goalWidth: 8.0,

    // Difficulty setting
    difficulty: 'medium',
    gameMode: '1p', // '1p' (vs AI) or '2p' (local 2 players)

    // Game Entities
    ball: {
        x: 0, z: 0,
        vx: 0, vz: 0,
        radius: 0.6,
        baseSpeed: 16.0,
        speed: 16.0,
        speedCap: 38.0
    },

    paddles: {
        // Red team (Player 1)
        pinkGk: { x: -18.0, z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 6.0 },   // Goalkeeper
        redFw:  { x: 7.0,   z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 9.0 },   // Forward
        // Blue team (AI / Player 2)
        blueFw: { x: -7.0,  z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 9.0 },   // Forward
        pinkGkAI:{ x: 18.0, z: 0, width: 1.2, height: 4.0, velocity: 0, limitZ: 6.0 }    // Goalkeeper
    },

    autoplay: false,

    // Physics Timestep
    lastTime: 0,
    accumulator: 0,
    fixedTimeStep: 1 / 60, // 60 updates per second

    debugFrameCount: 0,

    // Initialize Game
    init() {
        // Initialize inputs
        Controls.init();
        Controls.is2Player = (this.gameMode === '2p');

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
                Controls.is2Player = (this.gameMode === '2p');
                
                if (this.gameMode === '2p') {
                    diffSection.style.display = 'none';
                    controls1p.style.display = 'none';
                    controls2p.style.display = 'block';
                    return;
                }
                diffSection.style.display = 'block';
                controls1p.style.display = 'block';
                controls2p.style.display = 'none';
            });
        });

        // Difficulty Buttons
        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                diffBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
            });
        });

        // Initialize Renderer
        Renderer.init(document.getElementById('canvas-container'));

        // Load and apply initial settings from local storage if they exist
        let savedLighting = null;
        try {
            const data = localStorage.getItem('pong_soccer_lighting_config');
            if (data) savedLighting = JSON.parse(data);
        } catch (e) {}
        this.applyLighting(savedLighting || DEFAULT_LIGHTING);

        let savedPhysics = null;
        try {
            const data = localStorage.getItem('pong_soccer_physics_config');
            if (data) savedPhysics = JSON.parse(data);
        } catch (e) {}
        this.applyPhysics(savedPhysics || DEFAULT_PHYSICS);

        // Initialize Lighting Lab GUI listeners
        const labPanel = document.getElementById('lighting-lab');
        const labToggle = document.getElementById('lab-toggle');
        if (labToggle && labPanel) {
            labToggle.addEventListener('click', () => {
                labPanel.classList.toggle('collapsed');
            });
        }

        const setupLabSlider = (sliderId, valueId, onChange) => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(valueId);
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    valueSpan.textContent = val.toFixed(2);
                    onChange(val);
                    this.saveLightingSettings();
                });
            }
        };

        setupLabSlider('ambient-intensity', 'val-ambient', (val) => Renderer.setAmbientIntensity(val));
        setupLabSlider('spotlight-intensity', 'val-spotlight', (val) => Renderer.setSpotlightIntensity(val));
        setupLabSlider('spotlight-height', 'val-spotlight-height', (val) => Renderer.setSpotlightHeight(val));
        setupLabSlider('spotlight-distance', 'val-spotlight-distance', (val) => Renderer.setSpotlightDistance(val));
        setupLabSlider('shadow-softness', 'val-shadow', (val) => Renderer.setShadowSoftness(val));
        setupLabSlider('underglow-intensity', 'val-underglow', (val) => Renderer.setUnderglowIntensity(val));
        setupLabSlider('underglow-height', 'val-underglow-height', (val) => Renderer.setUnderglowHeight(val));
        setupLabSlider('underglow-spread', 'val-underglow-spread', (val) => Renderer.setUnderglowSpread(val));
        setupLabSlider('emissive-intensity', 'val-emissive', (val) => Renderer.setSelfEmissiveIntensity(val));
        setupLabSlider('rail-wash', 'val-rail-wash', (val) => Renderer.setRailLightWash(val));

        const shadowCheckbox = document.getElementById('shadows-toggle');
        if (shadowCheckbox) {
            shadowCheckbox.addEventListener('change', (e) => {
                Renderer.setShadowsEnabled(e.target.checked);
                this.saveLightingSettings();
            });
        }

        // Initialize Physics Lab GUI listeners
        const physPanel = document.getElementById('physics-lab');
        const physToggle = document.getElementById('phys-toggle');
        if (physToggle && physPanel) {
            physToggle.addEventListener('click', () => {
                physPanel.classList.toggle('collapsed');
            });
        }

        const setupPhysSlider = (sliderId, valueId, formatFn, onChange) => {
            const slider = document.getElementById(sliderId);
            const valueSpan = document.getElementById(valueId);
            if (slider && valueSpan) {
                slider.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    valueSpan.textContent = formatFn(val);
                    onChange(val);
                    this.savePhysicsSettings();
                });
            }
        };

        setupPhysSlider('phys-paddle-accel', 'val-phys-paddle-accel', (v) => v.toFixed(2), (val) => {
            PhysicsEngine.config.paddleAcceleration = val;
        });
        
        setupPhysSlider('phys-paddle-friction', 'val-phys-paddle-friction', (v) => v.toFixed(2), (val) => {
            PhysicsEngine.config.paddleFriction = val;
        });

        setupPhysSlider('phys-ball-speed-cap', 'val-phys-ball-speed-cap', (v) => v.toFixed(2), (val) => {
            this.ball.speedCap = val;
        });

        setupPhysSlider('phys-ball-speed-mult', 'val-phys-ball-speed-mult', (v) => ((v - 1.0) * 100).toFixed(2) + '%', (val) => {
            PhysicsEngine.config.ballSpeedIncrease = val;
        });

        setupPhysSlider('phys-momentum-transfer', 'val-phys-momentum-transfer', (v) => (v * 100).toFixed(0) + '%', (val) => {
            PhysicsEngine.config.momentumTransfer = val;
        });

        // Reset Buttons
        const btnResetLighting = document.getElementById('btn-reset-lighting');
        if (btnResetLighting) {
            btnResetLighting.addEventListener('click', () => {
                localStorage.removeItem('pong_soccer_lighting_config');
                this.applyLighting(DEFAULT_LIGHTING);
            });
        }

        const btnResetPhysics = document.getElementById('btn-reset-physics');
        if (btnResetPhysics) {
            btnResetPhysics.addEventListener('click', () => {
                localStorage.removeItem('pong_soccer_physics_config');
                this.applyPhysics(DEFAULT_PHYSICS);
            });
        }

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

        // Prevent negative delta times
        if (deltaTime < 0) deltaTime = 0;
        if (deltaTime > 0.1) deltaTime = 0.1;

        // Periodic debug logging for playtesting
        this.debugFrameCount++;
        if (this.debugFrameCount % 120 === 0) {
            console.log(`[DEBUG] Frame: ${this.debugFrameCount} | State: ${GameState.state} | KickoffTimer: ${GameState.kickoffTimer.toFixed(2)} | Ball: (${this.ball.x.toFixed(1)}, ${this.ball.z.toFixed(1)}) | Rally: ${GameState.rallyCount}`);
        }

        // Update camera idle sway (pass current time in seconds)
        Renderer.setCameraSway(time / 1000);

        if (GameState.state !== 'TITLE') {
            this.accumulator += deltaTime;
            
            // Fixed timestep loop for physics
            while (this.accumulator >= this.fixedTimeStep) {
                this.updatePhysics(this.fixedTimeStep);
                this.accumulator -= this.fixedTimeStep;
            }

            // Sync physics coordinate data to 3D Renderer elements
            Renderer.updatePaddles(this.paddles, deltaTime);
            const isExploded = (GameState.state === 'GOAL' || GameState.state === 'VICTORY');
            Renderer.updateBall(this.ball, isExploded);
        }

        // Render scene
        Renderer.render();

        requestAnimationFrame((t) => this.loop(t));
    },

    // Physics & State Updates
    updatePhysics(dt) {
        // 1. Update Game Timers based on state
        if (GameState.state === 'KICKOFF') {
            GameState.kickoffTimer -= dt;
            if (GameState.kickoffTimer <= 0) {
                GameState.changeState('PLAY');
                document.getElementById('countdown').innerText = '';
                document.getElementById('game-status').innerText = 'GO!';
                this.launchBall();
            } else {
                document.getElementById('countdown').innerText = Math.ceil(GameState.kickoffTimer);
                // Keep ball stationary during countdown
                this.ball.vx = 0;
                this.ball.vz = 0;
            }
        } else if (GameState.state === 'GOAL') {
            GameState.stateTimer -= dt;
            if (GameState.stateTimer <= 0) {
                if (GameState.isVictory()) {
                    this.endGame();
                } else {
                    this.startKickoff();
                }
            }
        }

        // 2. Process Player Paddle Inputs
        let inputs = { player1: 0, player2: 0 };
        const playerSpeed = 24.0;

        if (this.autoplay) {
            // Autoplay AI logic: track ball Z
            const targetP1Z = (this.ball.x > 0 && this.ball.vx > 0) 
                ? Math.max(-this.paddles.redFw.limitZ, Math.min(this.paddles.redFw.limitZ, this.ball.z)) 
                : Math.max(-this.paddles.pinkGk.limitZ, Math.min(this.paddles.pinkGk.limitZ, this.ball.z));
            const diffP1 = targetP1Z - this.paddles.redFw.z;
            if (Math.abs(diffP1) > 0.05) {
                inputs.player1 = Math.sign(diffP1) * 0.95;
            }

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

        // Remember old Z positions to detect boundary collisions
        const oldPositions = {};
        for (const [key, paddle] of Object.entries(this.paddles)) {
            oldPositions[key] = paddle.z;
        }

        // Apply momentum to Player 1 (Red Team)
        const acceleration = PhysicsEngine.config.paddleAcceleration;
        const friction = PhysicsEngine.config.paddleFriction;

        if (inputs.player1 !== 0) {
            this.paddles.pinkGk.velocity += inputs.player1 * acceleration * dt;
            this.paddles.pinkGk.velocity = Math.max(-playerSpeed, Math.min(playerSpeed, this.paddles.pinkGk.velocity));

            this.paddles.redFw.velocity += inputs.player1 * acceleration * dt;
            this.paddles.redFw.velocity = Math.max(-playerSpeed, Math.min(playerSpeed, this.paddles.redFw.velocity));
        } else {
            const decel = friction * dt;
            if (Math.abs(this.paddles.pinkGk.velocity) <= decel) {
                this.paddles.pinkGk.velocity = 0;
            } else {
                this.paddles.pinkGk.velocity -= Math.sign(this.paddles.pinkGk.velocity) * decel;
            }

            if (Math.abs(this.paddles.redFw.velocity) <= decel) {
                this.paddles.redFw.velocity = 0;
            } else {
                this.paddles.redFw.velocity -= Math.sign(this.paddles.redFw.velocity) * decel;
            }
        }

        // Integrate Player 1 position
        this.paddles.pinkGk.z += this.paddles.pinkGk.velocity * dt;
        this.paddles.redFw.z += this.paddles.redFw.velocity * dt;

        // Apply momentum or AI updates to Player 2 (Blue Team)
        if (this.gameMode === '2p') {
            if (inputs.player2 !== 0) {
                this.paddles.pinkGkAI.velocity += inputs.player2 * acceleration * dt;
                this.paddles.pinkGkAI.velocity = Math.max(-playerSpeed, Math.min(playerSpeed, this.paddles.pinkGkAI.velocity));

                this.paddles.blueFw.velocity += inputs.player2 * acceleration * dt;
                this.paddles.blueFw.velocity = Math.max(-playerSpeed, Math.min(playerSpeed, this.paddles.blueFw.velocity));
            } else {
                const decel = friction * dt;
                if (Math.abs(this.paddles.pinkGkAI.velocity) <= decel) {
                    this.paddles.pinkGkAI.velocity = 0;
                } else {
                    this.paddles.pinkGkAI.velocity -= Math.sign(this.paddles.pinkGkAI.velocity) * decel;
                }

                if (Math.abs(this.paddles.blueFw.velocity) <= decel) {
                    this.paddles.blueFw.velocity = 0;
                } else {
                    this.paddles.blueFw.velocity -= Math.sign(this.paddles.blueFw.velocity) * decel;
                }
            }
            // Integrate Player 2 position
            this.paddles.pinkGkAI.z += this.paddles.pinkGkAI.velocity * dt;
            this.paddles.blueFw.z += this.paddles.blueFw.velocity * dt;
        } else {
            AIController.update(
                this.ball, 
                this.paddles.blueFw, 
                this.paddles.pinkGkAI, 
                this.arenaWidth, 
                this.arenaHeight, 
                this.difficulty, 
                dt
            );
        }

        // Boundary Clamp and Collision Detection for all paddles
        for (const [key, paddle] of Object.entries(this.paddles)) {
            const limit = paddle.limitZ;
            const oldZ = oldPositions[key];

            if (paddle.z > limit) {
                paddle.z = limit;
                if (oldZ < limit && paddle.velocity > 2.0) {
                    Renderer.triggerPaddleImpact(key, 2.0, Math.abs(paddle.velocity), 0, true);
                    AudioManager.playPaddleWallCollision();
                }
                paddle.velocity = 0;
            } else if (paddle.z < -limit) {
                paddle.z = -limit;
                if (oldZ > -limit && paddle.velocity < -2.0) {
                    Renderer.triggerPaddleImpact(key, -2.0, Math.abs(paddle.velocity), 0, true);
                    AudioManager.playPaddleWallCollision();
                }
                paddle.velocity = 0;
            }
        }

        // 3. Update Ball Physics if state is PLAY or GOAL
        if (GameState.state === 'PLAY' || GameState.state === 'GOAL') {
            PhysicsEngine.integrateBall(this.ball, dt);
            PhysicsEngine.checkWallCollisions(this.ball, this.arenaHeight, () => AudioManager.playBounceWall());

            // If state is PLAY, check goal triggers and paddle hits
            if (GameState.state === 'PLAY') {
                PhysicsEngine.checkPaddleCollisions(this.ball, this.paddles, (key, relativeHitZ, speed, hitSideX) => {
                    AudioManager.playBouncePaddle();
                    Renderer.triggerPaddleImpact(key, relativeHitZ, speed, hitSideX, false);
                    GameState.incrementRally();
                    GameState.recordBallSpeed(speed);
                    AudioManager.updateCrowdAmbience(GameState.rallyCount);
                    this.updateHUDStats();
                });

                const goalScorer = PhysicsEngine.checkGoalTrigger(
                    this.ball, 
                    this.arenaWidth, 
                    this.goalWidth, 
                    () => AudioManager.playBounceWall()
                );
                if (goalScorer) {
                    this.triggerGoalScore(goalScorer);
                }
            }
        }
    },

    // Handle goal scoring sequence
    triggerGoalScore(scoringTeam) {
        GameState.changeState('GOAL');
        GameState.stateTimer = 2.5;

        // Play Goal audio and trigger 3D effects
        AudioManager.playGoal();
        
        const goalX = (scoringTeam === 'red') ? this.arenaWidth/2 : -this.arenaWidth/2;
        const teamColorHex = (scoringTeam === 'red') ? 0xff3b30 : 0x007aff;
        Renderer.triggerGoalExplosion(goalX, this.ball.z, teamColorHex);
        Renderer.triggerNetJiggle(scoringTeam === 'red' ? 'right' : 'left');
        Renderer.triggerCheering();

        const newScores = GameState.scoreGoal(scoringTeam);

        // Update score and trigger visual flash on HUD scorecard
        if (scoringTeam === 'red') {
            document.getElementById('score-red').innerText = newScores.red;
            document.getElementById('game-status').innerText = 'RED GOAL!';
            
            const card = document.getElementById('score-red').parentElement;
            card.classList.add('flash');
            setTimeout(() => card.classList.remove('flash'), 500);
        } else {
            document.getElementById('score-blue').innerText = newScores.blue;
            document.getElementById('game-status').innerText = 'BLUE GOAL!';
            
            const card = document.getElementById('score-blue').parentElement;
            card.classList.add('flash');
            setTimeout(() => card.classList.remove('flash'), 500);
        }

        AudioManager.updateCrowdAmbience(0);
        this.updateHUDStats();
    },

    // Launch ball at kickoff
    launchBall() {
        this.ball.x = 0;
        this.ball.z = 0;
        this.ball.speed = this.ball.baseSpeed;

        // Choose random direction
        const angleRange = Math.PI / 4;
        const direction = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() * 2 - 1) * angleRange;

        this.ball.vx = direction * Math.cos(angle) * this.ball.speed;
        this.ball.vz = Math.sin(angle) * this.ball.speed;
        
        this.updateHUDStats();
    },

    // Set up kickoff countdown
    startKickoff() {
        GameState.changeState('KICKOFF');
        GameState.kickoffTimer = 3.0;
        
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

    updateHUDStats() {
        const kmh = Math.round(this.ball.speed * 6.5);
        const speedElem = document.getElementById('ball-speed');
        if (speedElem) {
            speedElem.innerText = `${kmh} km/h`;
        }
        document.getElementById('rally-count').innerText = GameState.rallyCount;
    },

    // Action handlers for menus
    startGame() {
        AudioManager.init();

        // Scale ball base speed and cap speed by difficulty setting
        if (this.difficulty === 'easy') {
            this.ball.baseSpeed = 12.0;
            this.ball.speedCap = 25.0;
        } else if (this.difficulty === 'hard') {
            this.ball.baseSpeed = 18.0;
            this.ball.speedCap = 55.0;
        } else { // medium
            this.ball.baseSpeed = 16.0;
            this.ball.speedCap = 38.0;
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
        GameState.reset(this.ball.baseSpeed);

        document.getElementById('score-red').innerText = '0';
        document.getElementById('score-blue').innerText = '0';

        // Reset paddles to center
        for (const paddle of Object.values(this.paddles)) {
            paddle.z = 0;
            paddle.velocity = 0;
        }

        // Play initial crowd sound
        AudioManager.updateCrowdAmbience(0);

        // Reset cheering animation state
        Renderer.triggerCheering(false);

        // Start background music loop
        AudioManager.startBGM();

        this.startKickoff();
    },

    endGame() {
        GameState.changeState('VICTORY');
        
        // Play final chiptune fanfare
        AudioManager.playVictory();

        // Stop background music loop
        AudioManager.stopBGM();

        // Trigger infinite cheering/hopping on victory screen
        Renderer.triggerCheering(true);

        // Show victory modal overlay
        document.getElementById('hud').classList.remove('active');
        
        const winTitle = document.getElementById('victory-title');
        const winner = GameState.isVictory();
        const winnerText = winner === 'red' ? 'RED TEAM WINS!' : 'BLUE TEAM WINS!';
        winTitle.innerText = winnerText;
        winTitle.style.color = winner === 'red' ? 'var(--red-primary)' : 'var(--blue-primary)';

        // Display stats
        document.getElementById('max-rally').innerText = GameState.maxRallyRecord;
        const maxSpeedElem = document.getElementById('max-speed');
        if (maxSpeedElem) {
            maxSpeedElem.innerText = `${Math.round(GameState.maxBallSpeedRecord * 6.5)} km/h`;
        }

        document.getElementById('victory-screen').classList.add('active');
    },

    restartGame() {
        document.getElementById('victory-screen').classList.remove('active');
        this.startGame();
    },

    applyLighting(settings) {
        // Ambient Intensity
        Renderer.setAmbientIntensity(settings['ambient-intensity']);
        const sAmbient = document.getElementById('ambient-intensity');
        if (sAmbient) sAmbient.value = settings['ambient-intensity'];
        const vAmbient = document.getElementById('val-ambient');
        if (vAmbient) vAmbient.textContent = settings['ambient-intensity'].toFixed(2);

        // Spotlight Intensity
        Renderer.setSpotlightIntensity(settings['spotlight-intensity']);
        const sSpot = document.getElementById('spotlight-intensity');
        if (sSpot) sSpot.value = settings['spotlight-intensity'];
        const vSpot = document.getElementById('val-spotlight');
        if (vSpot) vSpot.textContent = settings['spotlight-intensity'].toFixed(2);

        // Spotlight Height
        Renderer.setSpotlightHeight(settings['spotlight-height']);
        const sHeight = document.getElementById('spotlight-height');
        if (sHeight) sHeight.value = settings['spotlight-height'];
        const vHeight = document.getElementById('val-spotlight-height');
        if (vHeight) vHeight.textContent = settings['spotlight-height'].toFixed(2);

        // Spotlight Distance
        Renderer.setSpotlightDistance(settings['spotlight-distance']);
        const sDist = document.getElementById('spotlight-distance');
        if (sDist) sDist.value = settings['spotlight-distance'];
        const vDist = document.getElementById('val-spotlight-distance');
        if (vDist) vDist.textContent = settings['spotlight-distance'].toFixed(2);

        // Shadow Softness
        Renderer.setShadowSoftness(settings['shadow-softness']);
        const sSoft = document.getElementById('shadow-softness');
        if (sSoft) sSoft.value = settings['shadow-softness'];
        const vSoft = document.getElementById('val-shadow');
        if (vSoft) vSoft.textContent = settings['shadow-softness'].toFixed(2);

        // Underglow Intensity
        Renderer.setUnderglowIntensity(settings['underglow-intensity']);
        const sUnder = document.getElementById('underglow-intensity');
        if (sUnder) sUnder.value = settings['underglow-intensity'];
        const vUnder = document.getElementById('val-underglow');
        if (vUnder) vUnder.textContent = settings['underglow-intensity'].toFixed(2);

        // Underglow Height
        Renderer.setUnderglowHeight(settings['underglow-height']);
        const sUnderH = document.getElementById('underglow-height');
        if (sUnderH) sUnderH.value = settings['underglow-height'];
        const vUnderH = document.getElementById('val-underglow-height');
        if (vUnderH) vUnderH.textContent = settings['underglow-height'].toFixed(2);

        // Underglow Spread
        Renderer.setUnderglowSpread(settings['underglow-spread']);
        const sUnderS = document.getElementById('underglow-spread');
        if (sUnderS) sUnderS.value = settings['underglow-spread'];
        const vUnderS = document.getElementById('val-underglow-spread');
        if (vUnderS) vUnderS.textContent = settings['underglow-spread'].toFixed(2);

        // Emissive Intensity
        Renderer.setSelfEmissiveIntensity(settings['emissive-intensity']);
        const sEm = document.getElementById('emissive-intensity');
        if (sEm) sEm.value = settings['emissive-intensity'];
        const vEm = document.getElementById('val-emissive');
        if (vEm) vEm.textContent = settings['emissive-intensity'].toFixed(2);

        // Rail Wash
        Renderer.setRailLightWash(settings['rail-wash']);
        const sWash = document.getElementById('rail-wash');
        if (sWash) sWash.value = settings['rail-wash'];
        const vWash = document.getElementById('val-rail-wash');
        if (vWash) vWash.textContent = settings['rail-wash'].toFixed(2);

        // Shadows Toggle
        Renderer.setShadowsEnabled(settings['shadows-enabled']);
        const cShadow = document.getElementById('shadows-toggle');
        if (cShadow) cShadow.checked = settings['shadows-enabled'];
    },

    applyPhysics(settings) {
        // Paddle Accel
        PhysicsEngine.config.paddleAcceleration = settings['phys-paddle-accel'];
        const sAccel = document.getElementById('phys-paddle-accel');
        if (sAccel) sAccel.value = settings['phys-paddle-accel'];
        const vAccel = document.getElementById('val-phys-paddle-accel');
        if (vAccel) vAccel.textContent = settings['phys-paddle-accel'].toFixed(2);

        // Paddle Friction
        PhysicsEngine.config.paddleFriction = settings['phys-paddle-friction'];
        const sFric = document.getElementById('phys-paddle-friction');
        if (sFric) sFric.value = settings['phys-paddle-friction'];
        const vFric = document.getElementById('val-phys-paddle-friction');
        if (vFric) vFric.textContent = settings['phys-paddle-friction'].toFixed(2);

        // Ball Speed Cap
        this.ball.speedCap = settings['phys-ball-speed-cap'];
        const sCap = document.getElementById('phys-ball-speed-cap');
        if (sCap) sCap.value = settings['phys-ball-speed-cap'];
        const vCap = document.getElementById('val-phys-ball-speed-cap');
        if (vCap) vCap.textContent = settings['phys-ball-speed-cap'].toFixed(2);

        // Speed Multiplier
        PhysicsEngine.config.ballSpeedIncrease = settings['phys-ball-speed-mult'];
        const sMult = document.getElementById('phys-ball-speed-mult');
        if (sMult) sMult.value = settings['phys-ball-speed-mult'];
        const vMult = document.getElementById('val-phys-ball-speed-mult');
        if (vMult) vMult.textContent = ((settings['phys-ball-speed-mult'] - 1.0) * 100).toFixed(2) + '%';

        // Momentum Transfer
        PhysicsEngine.config.momentumTransfer = settings['phys-momentum-transfer'];
        const sMom = document.getElementById('phys-momentum-transfer');
        if (sMom) sMom.value = settings['phys-momentum-transfer'];
        const vMom = document.getElementById('val-phys-momentum-transfer');
        if (vMom) vMom.textContent = (settings['phys-momentum-transfer'] * 100).toFixed(0) + '%';
    },

    saveLightingSettings() {
        const settings = {
            'ambient-intensity': parseFloat(document.getElementById('ambient-intensity').value),
            'spotlight-intensity': parseFloat(document.getElementById('spotlight-intensity').value),
            'spotlight-height': parseFloat(document.getElementById('spotlight-height').value),
            'spotlight-distance': parseFloat(document.getElementById('spotlight-distance').value),
            'shadow-softness': parseFloat(document.getElementById('shadow-softness').value),
            'underglow-intensity': parseFloat(document.getElementById('underglow-intensity').value),
            'underglow-height': parseFloat(document.getElementById('underglow-height').value),
            'underglow-spread': parseFloat(document.getElementById('underglow-spread').value),
            'emissive-intensity': parseFloat(document.getElementById('emissive-intensity').value),
            'rail-wash': parseFloat(document.getElementById('rail-wash').value),
            'shadows-enabled': document.getElementById('shadows-toggle').checked
        };
        localStorage.setItem('pong_soccer_lighting_config', JSON.stringify(settings));
    },

    savePhysicsSettings() {
        const settings = {
            'phys-paddle-accel': parseFloat(document.getElementById('phys-paddle-accel').value),
            'phys-paddle-friction': parseFloat(document.getElementById('phys-paddle-friction').value),
            'phys-ball-speed-cap': parseFloat(document.getElementById('phys-ball-speed-cap').value),
            'phys-ball-speed-mult': parseFloat(document.getElementById('phys-ball-speed-mult').value),
            'phys-momentum-transfer': parseFloat(document.getElementById('phys-momentum-transfer').value)
        };
        localStorage.setItem('pong_soccer_physics_config', JSON.stringify(settings));
    },

    showMainMenu() {
        document.getElementById('victory-screen').classList.remove('active');
        document.getElementById('title-screen').classList.add('active');
        GameState.changeState('TITLE');

        // Stop BGM if player returns to main menu
        AudioManager.stopBGM();
    }
};

// Start game after DOM load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        Game.init();
    });
}
