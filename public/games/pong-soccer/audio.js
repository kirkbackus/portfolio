/**
 * Soccer Arena Audio Synthesizer (audio.js)
 * Generates retro 8-bit / 16-bit arcade sound effects and crowd noise dynamically using the Web Audio API.
 */

export const AudioManager = {
    ctx: null,
    muted: false,
    crowdNode: null,
    crowdFilter: null,
    crowdGain: null,
    baselineCrowdVolume: 0.03,
    bgmIntervalId: null,
    bgmStep: 0,
    bgmPlaying: false,
    bgmPattern: [
        110.00, 164.81, 220.00, 164.81, 110.00, 164.81, 220.00, 164.81, // Bar 1 (A2, E3, A3, E3)
        87.31, 130.81, 174.61, 130.81, 87.31, 130.81, 174.61, 130.81,   // Bar 2 (F2, C3, F3, C3)
        65.41, 98.00, 130.81, 98.00, 65.41, 98.00, 130.81, 98.00,       // Bar 3 (C2, G2, C3, G2)
        98.00, 146.83, 196.00, 146.83, 98.00, 146.83, 196.00, 146.83    // Bar 4 (G2, D3, G3, D3)
    ],

    // Initialize the Web Audio Context (must be triggered by user interaction)
    init() {
        if (this.ctx) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return; // safety for node environments
            this.ctx = new AudioContextClass();
            
            // Set up crowd ambience
            this.setupCrowdAmbience();
            
            console.log("Audio Context initialized successfully.");
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser:", e);
        }
    },

    // Toggle mute state
    toggleMute() {
        this.muted = !this.muted;
        const btn = document.getElementById('sound-toggle');
        
        if (this.muted) {
            if (btn) {
                btn.classList.add('muted');
                btn.querySelector('.icon').innerText = '🔈';
            }
            if (this.crowdGain && this.ctx) {
                this.crowdGain.gain.setValueAtTime(0, this.ctx.currentTime);
            }
            return this.muted;
        }

        if (btn) {
            btn.classList.remove('muted');
            btn.querySelector('.icon').innerText = '🔊';
        }
        // Resume crowd noise if context exists
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.updateCrowdAmbience(0);
        }
        return this.muted;
    },

    // Create a procedural white noise buffer for crowd ambience
    setupCrowdAmbience() {
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        // Fill buffer with white noise (random values between -1 and 1)
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        // Create buffer source and set it to loop
        this.crowdNode = this.ctx.createBufferSource();
        this.crowdNode.buffer = noiseBuffer;
        this.crowdNode.loop = true;

        // Create bandpass filter to shape white noise into crowd roar/hiss
        this.crowdFilter = this.ctx.createBiquadFilter();
        this.crowdFilter.type = 'bandpass';
        this.crowdFilter.frequency.value = 450; // Hz
        this.crowdFilter.Q.value = 1.2;

        // Create gain node for volume control
        this.crowdGain = this.ctx.createGain();
        this.crowdGain.gain.value = this.muted ? 0 : this.baselineCrowdVolume;

        // Connect graph
        this.crowdNode.connect(this.crowdFilter);
        this.crowdFilter.connect(this.crowdGain);
        this.crowdGain.connect(this.ctx.destination);

        // Start playing crowd loop
        this.crowdNode.start(0);
    },

    // Update crowd volume and pitch (filter frequency) based on current rally length
    updateCrowdAmbience(rallyCount) {
        if (!this.ctx || this.muted || !this.crowdGain || !this.crowdFilter) return;

        const now = this.ctx.currentTime;
        
        // Scale gain and frequency with rally length
        // Maximum rally scale cap at 15 hits
        const scale = Math.min(rallyCount / 15, 1.0); 
        
        const targetVolume = this.baselineCrowdVolume + (scale * 0.08); // Max crowd volume
        const targetFrequency = 450 + (scale * 300); // Shift frequency up to sound more excited/higher pitched
        
        // Smooth transition over 0.5s to sound natural
        this.crowdGain.gain.setTargetAtTime(targetVolume, now, 0.5);
        this.crowdFilter.frequency.setTargetAtTime(targetFrequency, now, 0.5);
    },

    // Retro bounce sound when hitting a paddle
    playBouncePaddle() {
        if (!this.ctx || this.muted) return;
        this.init(); // Fallback safety

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // N64/NES triangle style sound for a round organic feel
        osc.type = 'triangle';
        
        // Quick upward frequency sweep: 200Hz to 380Hz
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

        // Envelopes: instantaneous attack, fast decay
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    },

    // Softer bounce sound when hitting a wall
    playBounceWall() {
        if (!this.ctx || this.muted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        
        // Lower pitch, downward frequency sweep: 150Hz to 110Hz
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.1);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
    },

    // Heavy thud sound when a paddle hits the boundary wall
    playPaddleWallCollision() {
        if (!this.ctx || this.muted) return;
        this.init(); // Fallback safety

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Use triangle wave for a solid physical thud
        osc.type = 'triangle';
        
        // Fast downward sweep: 100Hz to 60Hz
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(60, now + 0.15);

        // Slightly louder, with decay over 0.15s
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    },


    // Goal celebration chiptune fanfare
    playGoal() {
        if (!this.ctx || this.muted) return;

        const now = this.ctx.currentTime;
        
        // 1. Play a fast, sweet ascending arpeggio using triangle waves (C5 -> E5 -> G5 -> C6)
        const arpeggioNotes = [523.25, 659.25, 783.99, 1046.50];
        const noteDuration = 0.08;
        
        arpeggioNotes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + (idx * noteDuration));
            
            gain.gain.setValueAtTime(0.12, now + (idx * noteDuration));
            gain.gain.exponentialRampToValueAtTime(0.01, now + ((idx + 1) * noteDuration) - 0.01);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + (idx * noteDuration));
            osc.stop(now + ((idx + 1) * noteDuration));
        });

        // 2. Play a warm, sustained C-Major chord at the end of the arpeggio (C4, E4, G4, C5)
        const chordDelay = arpeggioNotes.length * noteDuration;
        const chordNotes = [261.63, 329.63, 392.00, 523.25];
        
        chordNotes.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + chordDelay);
            
            // Soft chord entry with decay
            gain.gain.setValueAtTime(0.08, now + chordDelay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + chordDelay + 1.2);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + chordDelay);
            osc.stop(now + chordDelay + 1.2);
        });
    },

    // Victory celebration fanfare (longer chiptune melody)
    playVictory() {
        if (!this.ctx || this.muted) return;

        const now = this.ctx.currentTime;
        
        // Simple melody: C5(0.15s), G4(0.15s), C5(0.15s), E5(0.15s), G5(0.15s), E5(0.15s), C5(0.15s), G5(0.3s)
        const melody = [
            { f: 523.25, d: 0.12 }, // C5
            { f: 392.00, d: 0.12 }, // G4
            { f: 523.25, d: 0.12 }, // C5
            { f: 659.25, d: 0.12 }, // E5
            { f: 783.99, d: 0.12 }, // G5
            { f: 659.25, d: 0.12 }, // E5
            { f: 783.99, d: 0.15 }, // G5
            { f: 1046.50, d: 0.40 } // C6 (long finish)
        ];
        
        let startOffset = 0;
        melody.forEach((note) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = (startOffset > 0.6) ? 'square' : 'triangle';
            osc.frequency.setValueAtTime(note.f, now + startOffset);
            
            gain.gain.setValueAtTime(0.15, now + startOffset);
            gain.gain.exponentialRampToValueAtTime(0.01, now + startOffset + note.d);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(now + startOffset);
            osc.stop(now + startOffset + note.d);
            
            startOffset += note.d + 0.02; // Small gap between notes
        });
    },

    // Start background music loop
    startBGM() {
        if (this.bgmPlaying) return;
        this.init(); // safety
        this.bgmPlaying = true;
        this.bgmStep = 0;

        // Schedule BGM tick every 180ms (~83 BPM for double time feel)
        this.bgmIntervalId = setInterval(() => {
            this.playBGMNote();
        }, 180);
    },

    // Stop background music loop
    stopBGM() {
        if (!this.bgmPlaying) return;
        clearInterval(this.bgmIntervalId);
        this.bgmIntervalId = null;
        this.bgmPlaying = false;
    },

    // Play a single procedural note of the loop
    playBGMNote() {
        if (!this.ctx || this.muted || !this.bgmPlaying) return;

        const now = this.ctx.currentTime;
        const freq = this.bgmPattern[this.bgmStep % this.bgmPattern.length];
        this.bgmStep++;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Low triangle wave for organic, round bass tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Keep it low and soft in the background
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.165);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.17);
    }
};
