/**
 * Input Controls Manager (controls.js)
 * Tracks keyboard states and queries gamepad axes for paddle movement.
 * Supports Player 1 (Red team) and Player 2 (Blue team) controls.
 */

const Controls = {
    keys: {
        KeyW: false,
        KeyS: false,
        ArrowUp: false,
        ArrowDown: false
    },

    init() {
        // Keyboard listeners
        window.addEventListener('keydown', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = true;
                // Prevent scrolling with arrows
                if (e.code.startsWith('Arrow')) {
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
            }
        });

        // Gamepad listeners
        window.addEventListener('gamepadconnected', (e) => {
            console.log("Gamepad connected:", e.gamepad.id, "Index:", e.gamepad.index);
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log("Gamepad disconnected");
        });
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

        // 2. Process Gamepad Input
        if (navigator.getGamepads) {
            const gamepads = navigator.getGamepads();
            
            // Filter non-null gamepads
            const activeGamepads = [];
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i]) {
                    activeGamepads.push(gamepads[i]);
                }
            }

            const deadzone = 0.15;

            // Gamepad 1 controls Player 1 (Red Team)
            if (activeGamepads[0]) {
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

            // Gamepad 2 controls Player 2 (Blue Team)
            if (activeGamepads[1]) {
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
        }

        // Clamp inputs just in case
        return {
            player1: Math.max(-1, Math.min(1, p1)),
            player2: Math.max(-1, Math.min(1, p2))
        };
    }
};
