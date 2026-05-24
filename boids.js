const BOIDS = 100;
const DISTANCE_SQUARED = 100 ** 2;
const SEPARATION_POWER = 5;
const SEPARATION_DISTANCE_SQUARED = 20 ** 2;
const ALIGNMENT_POWER = 2;
const COHESION_POWER = 1;
const MAX_VELOCITY = 5;
const MAX_ACCELERATION = 0.5;
const FRICTION = 0.8;

function distanceSquared(u, v) {
    const dx = u.x - v.x;
    const dy = u.y - v.y;
    return dx * dx + dy * dy;
}

function randomInclusiveInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Boid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * MAX_ACCELERATION;
        this.vy = Math.sin(angle) * MAX_ACCELERATION;
        this.ax = 0;
        this.ay = 0;
        this.neighbours = [];
    }

    move() {
        this.vx += this.ax;
        this.vy += this.ay;

        const velMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (velMagnitude > MAX_VELOCITY) {
            this.vx = (this.vx / velMagnitude) * MAX_VELOCITY;
            this.vy = (this.vy / velMagnitude) * MAX_VELOCITY;
        }
        this.vx * FRICTION;
        this.vy * FRICTION;

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) {
            this.x = 0;
            this.vx *= -1;
        } else if (this.x > 500) {
            this.x = 500;
            this.vx *= -1;
        }

        if (this.y < 0) {
            this.y = 0;
            this.vy *= -1;
        } else if (this.y > 500) {
            this.y = 500;
            this.vy *= -1;
        }

        this.ax = 0;
        this.ay = 0;
    }

    separation() {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (const boid of this.neighbours) {
            if (distanceSquared(this, boid) < SEPARATION_DISTANCE_SQUARED) {
                sumX += this.x - boid.x;
                sumY += this.y - boid.y;
                count++;
            }
        }

        if (count === 0) return;
        this.ax += (sumX / count) * SEPARATION_POWER;
        this.ay += (sumY / count) * SEPARATION_POWER;
    }

    alignment() {
        if (this.neighbours.length === 0) return;
        let sumX = 0;
        let sumY = 0;
        for (const boid of this.neighbours) {
            sumX += boid.vx;
            sumY += boid.vy;
        }

        this.ax += (sumX / this.neighbours.length) * ALIGNMENT_POWER;
        this.ay += (sumY / this.neighbours.length) * ALIGNMENT_POWER;
    }

    cohesion() {
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        for (const boid of this.neighbours) {
            if (distanceSquared(this, boid) >= SEPARATION_DISTANCE_SQUARED) {
                sumX += boid.x;
                sumY += boid.y;
                count++;
            }
        }

        if (count === 0) return;
        const averageX = sumX / count;
        const averageY = sumY / count;
        this.ax += (averageX - this.x) * COHESION_POWER;
        this.ay += (averageY - this.y) * COHESION_POWER;
    }

    update() {
        this.separation();
        this.cohesion();
        this.alignment();

        const accMagnitude = Math.sqrt(this.ax * this.ax + this.ay * this.ay);
        if (accMagnitude > MAX_ACCELERATION) {
            this.ax = (this.ax / accMagnitude) * MAX_ACCELERATION;
            this.ay = (this.ay / accMagnitude) * MAX_ACCELERATION;
        }
    }
}

class Board {
    constructor(canvasId, boidsCount) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.boids = [];
        for (let i = 0; i < boidsCount; i++) {
            this.boids.push(new Boid(randomInclusiveInt(0, 500), randomInclusiveInt(0, 500)));
        }
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(10, 10, 100, 100);
    }

    updateNeighbours() {
        for (const boid of this.boids) boid.neighbours = [];

        for (let i = 0; i < this.boids.length - 1; i++) {
            const boid1 = this.boids[i];
            for (let j = i + 1; j < this.boids.length; j++) {
                const boid2 = this.boids[j];

                if (distanceSquared(boid1, boid2) < DISTANCE_SQUARED) {
                    boid1.neighbours.push(boid2);
                    boid2.neighbours.push(boid1);
                }
            }
        }
    }

    draw() {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, 500, 500);

        this.ctx.fillStyle = "red";
        for (const boid of this.boids) this.ctx.fillRect(boid.x - 5, boid.y - 5, 10, 10);
    }

    update() {
        this.updateNeighbours();
        for (const boid of this.boids) boid.update();
        for (const boid of this.boids) boid.move();
        this.draw();
    }
}

const board = new Board("canvas", BOIDS);

function updateLoop() {
    board.update();
    console.log(board.boids[0]);
    requestAnimationFrame(() => updateLoop());
}
updateLoop();
