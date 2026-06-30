class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        
        // Dynamic nodes
        this.slideNode = null;
        this.slideGain = null;
        this.slideFilter = null;
        
        // Settings
        this.slidePlaying = false;
    }

    init() {
        if (this.ctx) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            // Generate white noise buffer for slide/hit sounds
            this.noiseBuffer = this.createNoiseBuffer();
        } catch (e) {
            console.warn("Web Audio API not supported in this browser.", e);
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return null;
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopSkierSlide();
        }
        return this.muted;
    }

    playClick() {
        this.init();
        this.resume();
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playJump() {
        this.init();
        this.resume();
        if (this.muted || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    playHit() {
        this.init();
        this.resume();
        if (this.muted || !this.ctx || !this.noiseBuffer) return;

        // Crash noise
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.4);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        // Sub thud
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(10, this.ctx.currentTime + 0.25);
        oscGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noiseSource.start();
        osc.start();
        noiseSource.stop(this.ctx.currentTime + 0.5);
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playScoreGate() {
        this.init();
        this.resume();
        if (this.muted || !this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Two-tone chime: first tone, then higher tone
        const playTone = (freq, startTime, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0.08, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        playTone(660, now, 0.12);
        playTone(880, now + 0.08, 0.18);
    }

    playYetiRoar() {
        this.init();
        this.resume();
        if (this.muted || !this.ctx || !this.noiseBuffer) return;

        const now = this.ctx.currentTime;
        const duration = 1.2;

        // Guttural low-frequency roar
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const fm = this.ctx.createOscillator();
        const fmGain = this.ctx.createGain();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, now);
        osc.frequency.linearRampToValueAtTime(45, now + duration);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(66, now);
        osc2.frequency.linearRampToValueAtTime(46, now + duration);

        // Frequency modulation (growl vibrato)
        fm.type = 'sawtooth';
        fm.frequency.setValueAtTime(25, now); // Growl speed
        fmGain.gain.setValueAtTime(15, now);   // Growl depth

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(150, now);
        filter.frequency.exponentialRampToValueAtTime(350, now + 0.3);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);
        filter.Q.setValueAtTime(2.0, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        fm.connect(fmGain);
        fmGain.connect(osc.frequency);
        fmGain.connect(osc2.frequency);
        
        osc.connect(filter);
        osc2.connect(filter);
        
        // Add a layer of roaring noise
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(200, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + duration);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        filter.connect(gain);
        gain.connect(this.ctx.destination);

        fm.start(now);
        osc.start(now);
        osc2.start(now);
        noise.start(now);

        fm.stop(now + duration);
        osc.stop(now + duration);
        osc2.stop(now + duration);
        noise.stop(now + duration);
    }

    startSkierSlide() {
        this.init();
        this.resume();
        if (this.muted || !this.ctx || !this.noiseBuffer || this.slidePlaying) return;

        this.slidePlaying = true;

        this.slideSource = this.ctx.createBufferSource();
        this.slideSource.buffer = this.noiseBuffer;
        this.slideSource.loop = true;

        this.slideFilter = this.ctx.createBiquadFilter();
        this.slideFilter.type = 'lowpass';
        this.slideFilter.frequency.setValueAtTime(250, this.ctx.currentTime);

        this.slideGain = this.ctx.createGain();
        this.slideGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        // Fade in
        this.slideGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 0.15);

        this.slideSource.connect(this.slideFilter);
        this.slideFilter.connect(this.slideGain);
        this.slideGain.connect(this.ctx.destination);

        this.slideSource.start();
    }

    updateSkierSlide(speedPercent, isJumping = false) {
        if (this.muted || !this.ctx || !this.slidePlaying) return;

        // If jumping, slide sound should fade out to simulate airtime
        const targetVolume = isJumping ? 0.001 : 0.01 + (speedPercent * 0.04);
        // Modulate lowpass filter frequency by speed (faster = higher pitch swoosh)
        const targetFreq = isJumping ? 120 : 180 + (speedPercent * 250);

        if (this.slideGain) {
            this.slideGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
        }
        if (this.slideFilter) {
            this.slideFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        }
    }

    stopSkierSlide() {
        if (!this.slidePlaying) return;
        this.slidePlaying = false;

        if (this.slideGain) {
            try {
                this.slideGain.gain.setValueAtTime(this.slideGain.gain.value, this.ctx.currentTime);
                this.slideGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
                
                const source = this.slideSource;
                setTimeout(() => {
                    try { source.stop(); } catch(e) {}
                }, 150);
            } catch(e) {}
        }
    }

    playNewRecordFanfare() {
        if (this.muted || !this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        
        // Wii Sports-like fast celebratory arpeggio!
        const notes = [
            { note: 261.63, time: 0 },     // C4
            { note: 329.63, time: 0.08 },  // E4
            { note: 392.00, time: 0.16 },  // G4
            { note: 523.25, time: 0.24 },  // C5
            { note: 659.25, time: 0.32 },  // E5
            { note: 783.99, time: 0.40 },  // G5
            { note: 1046.50, time: 0.48 }  // C6 (hold)
        ];
        
        notes.forEach((item) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Triangle waves for clean retro brightness
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.note, now + item.time);
            
            gain.gain.setValueAtTime(0.001, now + item.time);
            gain.gain.linearRampToValueAtTime(0.18, now + item.time + 0.02);
            
            const duration = item.time === 0.48 ? 0.65 : 0.22;
            gain.gain.exponentialRampToValueAtTime(0.001, now + item.time + duration);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + item.time);
            osc.stop(now + item.time + duration + 0.05);
        });
    }
}

// Global sound engine instance
const sound = new SoundEngine();
