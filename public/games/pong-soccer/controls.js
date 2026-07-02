/**
 * Input Controls Manager (controls.js)
 * Tracks keyboard states and queries gamepad axes for paddle movement.
 * Supports Player 1 (Red team) and Player 2 (Blue team) controls.
 * Now includes touchscreen & multi-touch support for local play.
 */

import { GameState } from './gamestate.js';

export const Controls = {
    keys: {
        KeyW: false,
        KeyS: false,
        ArrowUp: false,
        ArrowDown: false
    },

    is2Player: false,

    // Touch tracking state
    touches: {
        p1: {
            id: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            active: false,
            input: 0
        },
        p2: {
            id: null,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            active: false,
            input: 0
        }
    },

    rangeY: 60, // Distance in pixels for full deflection

    init() {
        // Keyboard listeners
        window.addEventListener('keydown', (e) => {
            if (!(e.code in this.keys)) return;
            this.keys[e.code] = true;
            // Prevent scrolling with arrows
            if (e.code.startsWith('Arrow')) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!(e.code in this.keys)) return;
            this.keys[e.code] = false;
        });

        // Gamepad listeners
        window.addEventListener('gamepadconnected', (e) => {
            console.log("Gamepad connected:", e.gamepad.id, "Index:", e.gamepad.index);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log("Gamepad disconnected");
        });

        // Create visual touch joysticks in DOM
        const uiContainer = document.getElementById('ui-container') || document.body;
        
        const p1Joystick = document.createElement('div');
        p1Joystick.id = 'touch-joystick-p1';
        p1Joystick.className = 'touch-joystick p1';
        p1Joystick.innerHTML = '<div class="joystick-ring"></div><div class="joystick-knob"></div>';
        p1Joystick.style.display = 'none';
        uiContainer.appendChild(p1Joystick);

        const p2Joystick = document.createElement('div');
        p2Joystick.id = 'touch-joystick-p2';
        p2Joystick.className = 'touch-joystick p2';
        p2Joystick.innerHTML = '<div class="joystick-ring"></div><div class="joystick-knob"></div>';
        p2Joystick.style.display = 'none';
        uiContainer.appendChild(p2Joystick);

        // Touch listeners
        window.addEventListener('touchstart', (e) => {
            // Check if game is active
            if (GameState.state === 'TITLE' || GameState.state === 'VICTORY') {
                this.resetTouches(p1Joystick, p2Joystick);
                return;
            }
            
            // Check if we are touching a button or menu
            if (e.target.closest('button, input, a, .menu-box, .lighting-lab, .physics-lab')) {
                return; 
            }

            // We want to prevent default touch action to avoid browser scrolling/zooming
            e.preventDefault();

            const width = window.innerWidth;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const x = touch.clientX;
                const y = touch.clientY;

                // Player 1 (Left Half)
                if (x < width / 2) {
                    if (!this.touches.p1.active) {
                        this.touches.p1.active = true;
                        this.touches.p1.id = touch.identifier;
                        this.touches.p1.startX = x;
                        this.touches.p1.startY = y;
                        this.touches.p1.currentX = x;
                        this.touches.p1.currentY = y;
                        this.touches.p1.input = 0;

                        // Position and show joystick
                        p1Joystick.style.left = `${x}px`;
                        p1Joystick.style.top = `${y}px`;
                        p1Joystick.style.display = 'block';
                        
                        const knob = p1Joystick.querySelector('.joystick-knob');
                        knob.style.transform = 'translate3d(0px, 0px, 0px)';
                    }
                }
                // Player 2 (Right Half) - only if 2p mode is active
                else if (x >= width / 2 && this.is2Player) {
                    if (!this.touches.p2.active) {
                        this.touches.p2.active = true;
                        this.touches.p2.id = touch.identifier;
                        this.touches.p2.startX = x;
                        this.touches.p2.startY = y;
                        this.touches.p2.currentX = x;
                        this.touches.p2.currentY = y;
                        this.touches.p2.input = 0;

                        // Position and show joystick
                        p2Joystick.style.left = `${x}px`;
                        p2Joystick.style.top = `${y}px`;
                        p2Joystick.style.display = 'block';

                        const knob = p2Joystick.querySelector('.joystick-knob');
                        knob.style.transform = 'translate3d(0px, 0px, 0px)';
                    }
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                
                // Player 1 touch move
                if (this.touches.p1.active && touch.identifier === this.touches.p1.id) {
                    e.preventDefault();
                    this.touches.p1.currentX = touch.clientX;
                    this.touches.p1.currentY = touch.clientY;

                    // Update floating anchor and calculate input
                    let dy = this.touches.p1.currentY - this.touches.p1.startY;
                    if (dy > this.rangeY) {
                        this.touches.p1.startY = this.touches.p1.currentY - this.rangeY;
                        dy = this.rangeY;
                    } else if (dy < -this.rangeY) {
                        this.touches.p1.startY = this.touches.p1.currentY + this.rangeY;
                        dy = -this.rangeY;
                    }
                    
                    // Update joystick start position
                    p1Joystick.style.left = `${this.touches.p1.startX}px`;
                    p1Joystick.style.top = `${this.touches.p1.startY}px`;

                    // Calculate input (-1 to 1)
                    this.touches.p1.input = dy / this.rangeY;

                    // Move knob in 2D
                    let dx = this.touches.p1.currentX - this.touches.p1.startX;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance > this.rangeY) {
                        dx = (dx / distance) * this.rangeY;
                    }
                    const knob = p1Joystick.querySelector('.joystick-knob');
                    knob.style.transform = `translate3d(${dx}px, ${dy}px, 0px)`;
                }

                // Player 2 touch move
                if (this.touches.p2.active && touch.identifier === this.touches.p2.id) {
                    e.preventDefault();
                    this.touches.p2.currentX = touch.clientX;
                    this.touches.p2.currentY = touch.clientY;

                    // Update floating anchor and calculate input
                    let dy = this.touches.p2.currentY - this.touches.p2.startY;
                    if (dy > this.rangeY) {
                        this.touches.p2.startY = this.touches.p2.currentY - this.rangeY;
                        dy = this.rangeY;
                    } else if (dy < -this.rangeY) {
                        this.touches.p2.startY = this.touches.p2.currentY + this.rangeY;
                        dy = -this.rangeY;
                    }
                    
                    // Update joystick start position
                    p2Joystick.style.left = `${this.touches.p2.startX}px`;
                    p2Joystick.style.top = `${this.touches.p2.startY}px`;

                    // Calculate input (-1 to 1)
                    this.touches.p2.input = dy / this.rangeY;

                    // Move knob in 2D
                    let dx = this.touches.p2.currentX - this.touches.p2.startX;
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance > this.rangeY) {
                        dx = (dx / distance) * this.rangeY;
                    }
                    const knob = p2Joystick.querySelector('.joystick-knob');
                    knob.style.transform = `translate3d(${dx}px, ${dy}px, 0px)`;
                }
            }
        }, { passive: false });

        const handleTouchEnd = (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                
                if (this.touches.p1.active && touch.identifier === this.touches.p1.id) {
                    this.touches.p1.active = false;
                    this.touches.p1.id = null;
                    this.touches.p1.input = 0;
                    p1Joystick.style.display = 'none';
                }
                
                if (this.touches.p2.active && touch.identifier === this.touches.p2.id) {
                    this.touches.p2.active = false;
                    this.touches.p2.id = null;
                    this.touches.p2.input = 0;
                    p2Joystick.style.display = 'none';
                }
            }
        };

        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);
    },

    resetTouches(p1Joystick, p2Joystick) {
        this.touches.p1.active = false;
        this.touches.p1.id = null;
        this.touches.p1.input = 0;
        this.touches.p2.active = false;
        this.touches.p2.id = null;
        this.touches.p2.input = 0;
        if (p1Joystick) p1Joystick.style.display = 'none';
        if (p2Joystick) p2Joystick.style.display = 'none';
    },

    // Get input vectors for Player 1 (Red Team) and Player 2 (Blue Team)
    // Returns { player1: number, player2: number } where values are between -1 (UP) and 1 (DOWN).
    getInputs() {
        let p1 = 0; // Player 1 (Red) input
        let p2 = 0; // Player 2 (Blue) input

        // 1. Process Keyboard Input (Vertical controls)
        if (this.keys.KeyW) p1 -= 1; // W moves Red team Up (negative Z)
        if (this.keys.KeyS) p1 += 1; // S moves Red team Down (positive Z)
        
        if (this.keys.ArrowUp) p2 -= 1;   // Up Arrow moves Blue team Up (negative Z)
        if (this.keys.ArrowDown) p2 += 1; // Down Arrow moves Blue team Down (positive Z)

        // 2. Process Touch Input (if active)
        if (this.touches.p1.active) {
            p1 = this.touches.p1.input;
        }
        if (this.touches.p2.active && this.is2Player) {
            p2 = this.touches.p2.input;
        }

        // 3. Process Gamepad Input
        if (!navigator.getGamepads) {
            return {
                player1: Math.max(-1, Math.min(1, p1)),
                player2: Math.max(-1, Math.min(1, p2))
            };
        }

        const gamepads = navigator.getGamepads();
        
        // Filter non-null gamepads
        const activeGamepads = [];
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                activeGamepads.push(gamepads[i]);
            }
        }

        const deadzone = 0.15;

        // Gamepad 1 controls Player 1 (Red Team) if touch is not active
        if (activeGamepads[0] && !this.touches.p1.active) {
            const gp1 = activeGamepads[0];
            const axis1 = gp1.axes[1]; // Left Stick Y
            if (Math.abs(axis1) > deadzone) {
                p1 = axis1;
            } else {
                // Fallback to D-pad Up/Down
                if (gp1.buttons[12]?.pressed) p1 -= 1; // D-pad Up
                if (gp1.buttons[13]?.pressed) p1 += 1; // D-pad Down
            }
        }

        // Gamepad 2 controls Player 2 (Blue Team) if touch is not active
        if (activeGamepads[1] && !this.touches.p2.active) {
            const gp2 = activeGamepads[1];
            const axis2 = gp2.axes[1]; // Left Stick Y
            if (Math.abs(axis2) > deadzone) {
                p2 = axis2;
            } else {
                // Fallback to D-pad Up/Down
                if (gp2.buttons[12]?.pressed) p2 -= 1; // D-pad Up
                if (gp2.buttons[13]?.pressed) p2 += 1; // D-pad Down
            }
        }

        // Clamp inputs just in case
        return {
            player1: Math.max(-1, Math.min(1, p1)),
            player2: Math.max(-1, Math.min(1, p2))
        };
    }
};
