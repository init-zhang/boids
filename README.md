# Boids

Boids implementation using HTML canvas.

## Rules

- separation: steer to avoid crowding local flock mates
- alignment: steer towards the average heading of local flock mates
- cohesion: steer to move towards the average position (centre of mass) of local flock mates

## Pseudocode

Assuming `neighbour` are all local flock mates within distance and have the following attributes:

- x position
- y position
- x direction
- y direction

Normalisation is omitted.

Separation is the average vector from every neighbour to boid:

```
position = (50, 50)
sumVector = (0, 0)

for boid in neighbour:
    sumVector.x += position.x - boid.x
    sumVector.y += position.y - boid.y

directionVector = (sumVector.x / count, sumVector.y / count)
```

Alignment is the average direction of every neighbour:

```
sumVector = (0, 0)

for boid in neighbour:
    sumVector.x += boid.direction.x
    sumVector.y += boid.direction.y

directionVector = (sumVector.x / count, sumVector.y / count)
```

Cohesion is the average position of every neighbour:

```
position = (50, 50)
sumVector = (0, 0)

for boid in neighbour:
    sumVector.x += boid.x
    sumVector.y += boid.y

averageVector = (sumVector.x / count, sumVector.y / count)
directionVector = (averageVector.x - position.x, averageVector.y - position.y)
```
