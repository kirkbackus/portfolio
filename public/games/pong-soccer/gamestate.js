/**
 * Game State Manager (gamestate.js)
 * Tracks score, active state, timers, and difficulty settings.
 */

export const GameState = {
    // Current state: 'TITLE', 'KICKOFF', 'PLAY', 'GOAL', 'VICTORY'
    state: 'TITLE', 
    scores: { red: 0, blue: 0 },
    maxScore: 5,
    rallyCount: 0,
    maxRallyRecord: 0,
    maxBallSpeedRecord: 0,
    
    // Timers
    kickoffTimer: 0,
    stateTimer: 0,

    reset(baseSpeed) {
        this.scores.red = 0;
        this.scores.blue = 0;
        this.rallyCount = 0;
        this.maxRallyRecord = 0;
        this.maxBallSpeedRecord = baseSpeed;
        this.kickoffTimer = 0;
        this.stateTimer = 0;
    },

    changeState(newState) {
        this.state = newState;
    },

    incrementRally() {
        this.rallyCount++;
        if (this.rallyCount > this.maxRallyRecord) {
            this.maxRallyRecord = this.rallyCount;
        }
        return this.rallyCount;
    },

    recordBallSpeed(speed) {
        if (speed > this.maxBallSpeedRecord) {
            this.maxBallSpeedRecord = speed;
        }
    },

    scoreGoal(team) {
        if (team === 'red') {
            this.scores.red++;
        } else if (team === 'blue') {
            this.scores.blue++;
        }
        this.rallyCount = 0;
        return this.scores;
    },

    isVictory() {
        if (this.scores.red >= this.maxScore) return 'red';
        if (this.scores.blue >= this.maxScore) return 'blue';
        return null;
    }
};
