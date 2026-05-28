const BOIDS = 100;
const DISTANCE_SQUARED = 100 ** 2;
const SEPARATION_DISTANCE_SQUARED = 20 ** 2;
const SEPARATION_POWER = 0.5;
const ALIGNMENT_POWER  = 0.2;
const COHESION_POWER   = 0.1;
const MAX_VELOCITY     = 5;
const MAX_ACCELERATION = 0.1;
const LINE_MULTIPLIER = 10;
const TRAIL = 0.8;

const mouse = { x: 0, y: 0};
document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

let followMouse = false;
let avoidMouse = false;
const followCheckbox = document.getElementById("follow");
followCheckbox.addEventListener("click", () => {
    followMouse = followCheckbox.checked;
});
const avoidCheckbox = document.getElementById("avoid");
avoidCheckbox.addEventListener("click", () => {
    avoidMouse = avoidCheckbox.checked;
});

function addRangeListener(sliderID, config, defaultValue) {
    const input = document.getElementById(sliderID);
    const span = document.getElementById(sliderID + "Value");
    input.value = defaultValue;
    span.textContent = input.value;
    input.addEventListener("input", () => {
        // Specific use case for distances as they need to be squared
        if (sliderID === "distance" | sliderID === "separationDistance") {
            config[sliderID + "Squared"] = Number(input.value) ** 2;
        } else {
            config[sliderID] = Number(input.value);
        }
        span.textContent = input.value;
    });
}

function distanceSquared(u, v) {
    const dx = u.x - v.x;
    const dy = u.y - v.y;
    return dx * dx + dy * dy;
}

function randomInclusiveInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Boid {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.config.maxAcceleration;
        this.vy = Math.sin(angle) * this.config.maxAcceleration;
        this.ax = 0;
        this.ay = 0;
        this.neighbours = [];
    }

    move() {
        const accMagnitude = Math.sqrt(this.ax * this.ax + this.ay * this.ay);
        if (accMagnitude > this.config.maxAcceleration) {
            this.ax = (this.ax / accMagnitude) * this.config.maxAcceleration;
            this.ay = (this.ay / accMagnitude) * this.config.maxAcceleration;
        }

        this.vx += this.ax;
        this.vy += this.ay;

        const velMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (velMagnitude > this.config.maxVelocity) {
            this.vx = (this.vx / velMagnitude) * this.config.maxVelocity;
            this.vy = (this.vy / velMagnitude) * this.config.maxVelocity;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) {
            this.x += this.config.width;
        } else if (this.x > this.config.width) {
            this.x = this.config.width - this.x;
        }

        if (this.y < 0) {
            this.y += this.config.height;
        } else if (this.y > this.config.height) {
            this.y = this.config.height - this.y;
        }

        this.ax = 0;
        this.ay = 0;
    }

    separation() {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (const boid of this.neighbours) {
            if (distanceSquared(this, boid) < this.config.separationDistanceSquared) {
                sumX += boid.x;
                sumY += boid.y;
                count++;
            }
        }

        if (count === 0) return;
        this.ax += (this.x - sumX / count) * this.config.separationPower;
        this.ay += (this.y - sumY / count) * this.config.separationPower;
    }

    alignment() {
        if (this.neighbours.length === 0) return;
        let sumX = 0;
        let sumY = 0;
        for (const boid of this.neighbours) {
            sumX += boid.vx;
            sumY += boid.vy;
        }

        this.ax += (sumX / this.neighbours.length) * this.config.alignmentPower;
        this.ay += (sumY / this.neighbours.length) * this.config.alignmentPower;
    }

    cohesion() {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (const boid of this.neighbours) {
            if (distanceSquared(this, boid) >= this.config.separationDistanceSquared) {
                sumX += boid.x;
                sumY += boid.y;
                count++;
            }
        }

        if (count === 0) return;
        this.ax += (sumX / count - this.x) * this.config.cohesionPower;
        this.ay += (sumY / count - this.y) * this.config.cohesionPower;
    }

    attraction() {
        if (followMouse) {
            this.ax += mouse.x - this.x;
            this.ay += mouse.y - this.y;
        }
    }

    avoid() {
        if (avoidMouse) {
            this.ax += this.x - mouse.x;
            this.ay += this.y - mouse.y;
        }
    }

    update() {
        this.separation();
        this.cohesion();
        this.alignment();
        this.attraction();
        this.avoid();
    }
}

class Board {
    constructor(canvasId, boidsCount, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.config = config;
        this.boids = [];
        this.resizeCanvas();
        this.initializeBoids(boidsCount);

        window.addEventListener("resize", () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.config.width = window.innerWidth;
        this.config.height = window.innerHeight;
        this.canvas.width = this.config.width;
        this.canvas.height = this.config.height;
    }

    initializeBoids(boidsCount) {
        this.boids = [];
        for (let i = 0; i < boidsCount; i++) {
            this.boids.push(
                new Boid(
                    randomInclusiveInt(0, this.config.width),
                    randomInclusiveInt(0, this.config.height),
                    this.config
                )
            );
        }
    }

    updateNeighbours() {
        for (const boid of this.boids) boid.neighbours = [];

        for (let i = 0; i < this.boids.length - 1; i++) {
            const boid1 = this.boids[i];
            for (let j = i + 1; j < this.boids.length; j++) {
                const boid2 = this.boids[j];

                if (distanceSquared(boid1, boid2) < this.config.distanceSquared) {
                    boid1.neighbours.push(boid2);
                    boid2.neighbours.push(boid1);
                }
            }
        }
    }

    draw() {
        this.ctx.fillStyle = `rgba(255,255,255,${1-this.config.trail})`;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);

        this.ctx.fillStyle = "red";
        this.ctx.strokeStyle = "blue";
        this.ctx.lineWidth = 2;
        for (const boid of this.boids) {
            this.ctx.fillRect(boid.x - 5, boid.y - 5, 10, 10);
            this.ctx.beginPath();
            this.ctx.moveTo(boid.x, boid.y);
            this.ctx.lineTo(boid.x + boid.vx * this.config.lineMultiplier, boid.y + boid.vy * this.config.lineMultiplier);
            this.ctx.stroke();
        }
    }

    update() {
        this.updateNeighbours();
        for (const boid of this.boids) boid.update();
        for (const boid of this.boids) boid.move();
        this.draw();
    }
}

const defaultConfig = {
    distanceSquared: DISTANCE_SQUARED,
    separationDistanceSquared: SEPARATION_DISTANCE_SQUARED,
    separationPower: SEPARATION_POWER,
    alignmentPower: ALIGNMENT_POWER,
    cohesionPower: COHESION_POWER,
    maxVelocity: MAX_VELOCITY,
    maxAcceleration: MAX_ACCELERATION,
    lineMultiplier: LINE_MULTIPLIER,
    trail: TRAIL
}
let board = new Board("canvas", BOIDS, defaultConfig);

addRangeListener("distance", defaultConfig, Math.sqrt(DISTANCE_SQUARED));
addRangeListener("separationDistance", defaultConfig, Math.sqrt(SEPARATION_DISTANCE_SQUARED));
addRangeListener("separationPower", defaultConfig, SEPARATION_POWER);
addRangeListener("alignmentPower", defaultConfig, ALIGNMENT_POWER);
addRangeListener("cohesionPower", defaultConfig, COHESION_POWER);
addRangeListener("maxVelocity", defaultConfig, MAX_VELOCITY);
addRangeListener("maxAcceleration", defaultConfig, MAX_ACCELERATION);
addRangeListener("lineMultiplier", defaultConfig, LINE_MULTIPLIER);
addRangeListener("trail", defaultConfig, TRAIL);

let running = true;

const toggleButton = document.getElementById("toggle");
toggleButton.addEventListener("click", () => {
    if (running) {
        toggleButton.value = "Resume";
        running = false;
    } else {
        toggleButton.value = "Pause";
        running = true;
        updateLoop();
    }
});

let boids = BOIDS;
const boidsInput = document.getElementById("boids")
boidsInput.addEventListener("input", () => {
    boids = boidsInput.value;
});

document.getElementById("restart").addEventListener("click", () => {
    board = new Board("canvas", boids, defaultConfig);
});

function updateLoop() {
    board.update();
    if (running) requestAnimationFrame(() => updateLoop());
}
updateLoop();
