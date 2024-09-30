let astronaut;
let planets = [];
let planetSpacing = 800;
let maxVisiblePlanets = 6;
let bullets = [];
let enemies = [];
let credits = 0;
let currentPlanet = null;
let inSpace = true;
let gravity = 0.005;
let planetsVisited = 0;
let physicsParams = {
    velocityX: 0,
    velocityY: 0,
    gravity: gravity,
};
let starField = [];
let explorationTimer = 0;
let shopVisible = false;
let mentalState = 100;
let oxygenLevel = 100;
let cameraY = 0;
let inventory = {
    healthPacks: 0,
    speedBoosts: 0,
    mentalStimulants: 0,
    oxygenTanks: 0
};
let shieldEnergy = 100;
let shieldActive = false;
let shieldCooldown = 0;
let dash = 100;
let isDashing = false;
let currentEvent = null;

function setup() {
    createCanvas(900, 700);
    astronaut = new Astronaut();
    generateStarField();
    generateInitialPlanets();
}

function draw() {
    cameraY = lerp(cameraY, astronaut.y - height / 2, 0.1);
    
    push();
    translate(0, -cameraY);
    
    if (inSpace) {
        drawStarField();
        updatePlanets();
    } else {
        drawPlanetBackground();
    }

    astronaut.update();
    astronaut.display();

    if (inSpace) {
        for (let planet of planets) {
            planet.display();
            if (dist(astronaut.x, astronaut.y, planet.x, planet.y) < planet.size / 2 + 10) {
                currentPlanet = planet;
                landOnPlanet();
                break;
            }
        }
    } else {
        if (enemies.length === 0 && explorationTimer === 0) {
            credits += 10 * planetsVisited;
            explorationTimer = 0;
        }

        if (explorationTimer > 0 && millis() > explorationTimer) {
            returnToSpace();
        }

        for (let enemy of enemies) {
            enemy.update();
            enemy.display();
            if (dist(astronaut.x, astronaut.y, enemy.x, enemy.y) < 20) {
                if (!shieldActive || shieldEnergy <= 0) {
                    astronaut.health -= 5;
                    mentalState = max(mentalState - 2, 0);
                }
                if (astronaut.health <= 0) {
                    gameOver();
                }
            }
        }
    }

    for (let bullet of bullets) {
        bullet.update();
        bullet.display();
    }

    bullets = bullets.filter(bullet => bullet.isVisible());
    enemies = enemies.filter(enemy => enemy.isVisible());

    pop();

    drawHUD();

    if (shopVisible) {
        drawShop();
    }

    updateAstronautStatus();
    
    if (currentEvent) {
        drawEvent();
    }
}

function drawHUD() {
    push();
    fill(0, 150);
    rect(0, 0, width, 100);

    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);

    text(`Credits: ${credits}`, 10, 10);
    text(`Planets: ${planetsVisited}`, 10, 35);
    
    drawBar(width - 210, 10, astronaut.health, 200, color(255, 0, 0), color(0, 255, 0), "Health");
    drawBar(width - 210, 35, mentalState, 100, color(100), color(0, 255, 255), "Mental");
    drawBar(width - 210, 60, oxygenLevel, 100, color(100), color(255, 255, 0), "Oxygen");
    drawBar(10, 60, shieldEnergy, 100, color(100), color(0, 255, 255), "Shield");
    drawBar(10, 85, dash, 100, color(100), color(255, 165, 0), "Dash");
    
    textAlign(RIGHT, TOP);
    text(`HP: ${inventory.healthPacks} | SB: ${inventory.speedBoosts} | MS: ${inventory.mentalStimulants} | OT: ${inventory.oxygenTanks}`, width - 10, 85);
    
    pop();
}

function drawBar(x, y, value, maxValue, bgColor, fgColor, label) {
    const barWidth = 200;
    const barHeight = 20;
    
    fill(bgColor);
    rect(x, y, barWidth, barHeight);
    fill(fgColor);
    rect(x, y, (value / maxValue) * barWidth, barHeight);
    fill(255);
    textAlign(LEFT, CENTER);
    text(`${label}: ${value.toFixed(0)}/${maxValue}`, x + 5, y + barHeight / 2);
}

function drawStarField() {
    background(0);
    for (let star of starField) {
        fill(255, star.brightness);
        ellipse(star.x, star.y + cameraY, star.size, star.size);
    }
}

function drawPlanetBackground() {
    background(currentPlanet.color);
    fill(255);
    textSize(18);
    text(`Exploring ${currentPlanet.name}`, 10, 120);
    text(`Time left: ${((explorationTimer - millis()) / 1000).toFixed(1)}s`, 10, 150);
}

function generateStarField() {
    for (let i = 0; i < 500; i++) {
        starField.push({
            x: random(width),
            y: random(-height * 5, height * 5),
            size: random(1, 3),
            brightness: random(100, 255)
        });
    }
}

function generateInitialPlanets() {
    for (let i = 0; i < maxVisiblePlanets; i++) {
        planets.push(new Planet(random(100, width - 100), i * planetSpacing, `Planet-${i + 1}`));
    }
}

function updatePlanets() {
    let visibleRange = height * 2;
    planets = planets.filter(planet => abs(planet.y - cameraY) < visibleRange);

    while (planets.length < maxVisiblePlanets) {
        let lastPlanet = planets[planets.length - 1];
        let newY;
        if (!lastPlanet || random() < 0.5) {
            newY = cameraY - visibleRange / 2;
        } else {
            newY = lastPlanet.y + planetSpacing;
        }
        planets.push(new Planet(random(100, width - 100), newY, `Planet-${planetsVisited + planets.length}`));
    }

    for (let planet of planets) {
        planet.display();
    }
}

function landOnPlanet() {
    inSpace = false;
    enemies = [];
    planetsVisited += 1;

    let enemyCount = min(planetsVisited + 1, 8);
    for (let i = 0; i < enemyCount; i++) {
        enemies.push(new Enemy(random(width), random(cameraY, cameraY + height)));
    }

    explorationTimer = millis() + 30000;
    gravity = 0.2;
    
    astronaut.health = min(astronaut.health + 10, 200);
    mentalState = min(mentalState + 5, 100);
    oxygenLevel = min(oxygenLevel + 15, 100);
    
    if (random() < 0.3) {
        triggerRandomEvent();
    }
}

function returnToSpace() {
    inSpace = true;
    currentPlanet = null;
    astronaut.x = width / 2;
    astronaut.y += 100;
    gravity = 0.005;
    currentEvent = null;
}

function keyPressed() {
    if (key === 'r' || key === 'R') {
        restartGame();
    }

    if (key === '1') useInventoryItem('healthPacks');
    if (key === '2') useInventoryItem('speedBoosts');
    if (key === '3') useInventoryItem('mentalStimulants');
    if (key === '4') useInventoryItem('oxygenTanks');

    if (key === 'q' || key === 'Q') {
        shieldActive = true;
    }
    
    if (key === 'e' || key === 'E') {
        isDashing = true;
    }

    return false;
}

function keyReleased() {
    if (key === 'q' || key === 'Q') {
        shieldActive = false;
        shieldCooldown = 120;
    }
    
    if (key === 'e' || key === 'E') {
        isDashing = false;
    }
}

function mousePressed() {
    if (shopVisible) {
        let buttonClicked = checkShopButtons();
        if (buttonClicked) {
            shopVisible = false;
        }
    } else {
        let bulletAngle = atan2(mouseY - astronaut.y + cameraY, mouseX - astronaut.x);
        bullets.push(new Bullet(astronaut.x, astronaut.y, bulletAngle, 10, 'astronaut'));
    }
}

class Astronaut {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.vx = 0;
        this.vy = 0;
        this.health = 200;
        this.maxSpeed = 5;
    }

    update() {
        const acceleration = 0.2;

        if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) this.vx -= acceleration;
        if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) this.vx += acceleration;
        if (keyIsDown(87) || keyIsDown(UP_ARROW)) this.vy -= acceleration;
        if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) this.vy += acceleration;

        if (isDashing && dash > 0) {
            this.vx *= 2;
            this.vy *= 2;
            dash -= 2;
        }

        let speed = dist(0, 0, this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.98;
        this.vy *= 0.98;

        this.x = constrain(this.x, 0, width);
        this.y = constrain(this.y, cameraY, cameraY + height);

        if (!isDashing && dash < 100) {
            dash += 0.5;
        }

        if (shieldActive && shieldEnergy > 0) {
            shieldEnergy -= 1;
        } else if (!shieldActive && shieldEnergy < 100 && shieldCooldown <= 0) {
            shieldEnergy += 0.5;
        }

        if (shieldCooldown > 0) {
            shieldCooldown--;
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(atan2(mouseY - this.y + cameraY, mouseX - this.x));
        
        if (shieldActive && shieldEnergy > 0) {
            noFill();
            stroke(0, 255, 255, 100);
            ellipse(0, 0, 50, 50);
        }
        
        fill(0, 100, 255);
        noStroke();
        triangle(-10, -10, -10, 10, 20, 0);
        pop();
    }
}

class Bullet {
    constructor(x, y, angle, speed, firedBy = 'astronaut') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.firedBy = firedBy;
        this.lifetime = 120;
    }

    update() {
        this.x += cos(this.angle) * this.speed;
        this.y += sin(this.angle) * this.speed;
        this.lifetime--;

        if (this.firedBy === 'astronaut') {
            for (let enemy of enemies) {
                if (dist(this.x, this.y, enemy.x, enemy.y) < 15) {
                    enemy.health -= 1;
                    this.lifetime = 0;
                    break;
                }
            }
        } else if (this.firedBy === 'enemy') {
            if (dist(this.x, this.y, astronaut.x, astronaut.y) < 15) {
                if (!shieldActive || shieldEnergy <= 0) {
                    astronaut.health -= 5;
                    mentalState = max(mentalState - 2, 0);
                }
                this.lifetime = 0;
            }
        }
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.angle);
        fill(this.firedBy === 'astronaut' ? color(0, 255, 255) : color(255, 0, 0));
        rect(0, -2, 10, 4);
        pop();
    }

    isVisible() {
        return this.lifetime > 0;
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = random(-1, 1);
        this.vy = random(-1, 1);
        this.health = 3;
        this.shootCooldown = 0;
        this.behavior = random(['aggressive', 'defensive', 'erratic']);
    }

    update() {
        let dx = astronaut.x - this.x;
        let dy = astronaut.y - this.y;
        let dist = sqrt(dx * dx + dy * dy);
        
        switch (this.behavior) {
            case 'aggressive':
                this.chaseAstronaut(dx, dy, dist);
                break;
            case 'defensive':
                this.keepDistance(dx, dy, dist);
                break;
            case 'erratic':
                this.moveErratically();
                break;
        }
        
        if (dist < 300 && this.shootCooldown <= 0) {
            this.shoot(dx, dy);
        }
        
        this.y = constrain(this.y, cameraY, cameraY + height);
        
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.shootCooldown--;
    }

    chaseAstronaut(dx, dy, dist) {
        this.vx += dx / dist * 0.1;
        this.vy += dy / dist * 0.1;
    }

    keepDistance(dx, dy, dist) {
        if (dist < 150) {
            this.vx -= dx / dist * 0.1;
            this.vy -= dy / dist * 0.1;
        } else if (dist > 250) {
            this.vx += dx / dist * 0.1;
            this.vy += dy / dist * 0.1;
        }
    }

    moveErratically() {
        if (random() < 0.05) {
            this.vx = random(-2, 2);
            this.vy = random(-2, 2);
        }
    }

    shoot(dx, dy) {
        let angle = atan2(dy, dx);
        bullets.push(new Bullet(this.x, this.y, angle, 5, 'enemy'));
        this.shootCooldown = 60;
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(atan2(this.vy, this.vx));
        fill(255, 0, 0);
        triangle(-10, -10, -10, 10, 20, 0);
        pop();
    }

    isVisible() {
        return this.health > 0;
    }
}

class Planet {
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.size = random(60, 120);
        this.color = color(random(100, 255), random(100, 255), random(100, 255));
        this.atmosphere = [];
        this.generateAtmosphere();
        this.orbitRadius = random(20, 40);
        this.orbitSpeed = random(0.01, 0.03);
        this.orbitAngle = random(TWO_PI);
    }

    generateAtmosphere() {
        for (let i = 0; i < 20; i++) {
            this.atmosphere.push({
                angle: random(TWO_PI),
                distance: random(this.size/2, this.size/2 + 20),
                size: random(2, 5)
            });
        }
    }

    update() {
        this.orbitAngle += this.orbitSpeed;
        this.x += cos(this.orbitAngle) * this.orbitRadius;
        this.y += sin(this.orbitAngle) * this.orbitRadius;
    }

    display() {
        push();
        translate(this.x, this.y);
        
        for (let particle of this.atmosphere) {
            fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], 100);
            ellipse(cos(particle.angle) * particle.distance, 
                    sin(particle.angle) * particle.distance, 
                    particle.size);
        }

        fill(this.color);
        ellipse(0, 0, this.size, this.size);
        
        fill(255);
        textAlign(CENTER);
        textSize(14);
        text(this.name, 0, -this.size/2 - 20);
        
        pop();
    }
}

function drawShop() {
    push();
    fill(0, 200);
    rect(50, 50, width - 100, height - 100);
    fill(255);
    textSize(32);
    textAlign(CENTER, TOP);
    text('Space Shop', width/2, 70);
    
    let buttonY = 150;
    let buttonSpacing = 70;
    drawShopButton('Health Pack', 'healthPacks', 50, buttonY);
    drawShopButton('Speed Boost', 'speedBoosts', 100, buttonY + buttonSpacing);
    drawShopButton('Mental Stimulant', 'mentalStimulants', 75, buttonY + buttonSpacing * 2);
    drawShopButton('Oxygen Tank', 'oxygenTanks', 60, buttonY + buttonSpacing * 3);
    
    textSize(24);
    text(`Current Credits: ${credits}`, width/2, height - 100);
    pop();
}

function drawShopButton(label, item, cost, y) {
    fill(100);
    rect(width/2 - 150, y, 300, 50, 10);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(20);
    text(`${label} (${cost} Credits)`, width/2, y + 15);
    textSize(16);
    text(`Owned: ${inventory[item]}`, width/2, y + 35);
}

function checkShopButtons() {
    let buttonY = 150;
    let buttonSpacing = 70;
    if (mouseY > buttonY && mouseY < buttonY + 50) buyItem('healthPacks', 50);
    else if (mouseY > buttonY + buttonSpacing && mouseY < buttonY + buttonSpacing + 50) buyItem('speedBoosts', 100);
    else if (mouseY > buttonY + buttonSpacing * 2 && mouseY < buttonY + buttonSpacing * 2 + 50) buyItem('mentalStimulants', 75);
    else if (mouseY > buttonY + buttonSpacing * 3 && mouseY < buttonY + buttonSpacing * 3 + 50) buyItem('oxygenTanks', 60);
    else return false;
    return true;
}

function buyItem(item, cost) {
    if (credits >= cost) {
        credits -= cost;
        inventory[item]++;
    }
}

function useInventoryItem(item) {
    if (inventory[item] > 0) {
        inventory[item]--;
        switch(item) {
            case 'healthPacks':
                astronaut.health = min(astronaut.health + 50, 200);
                break;
            case 'speedBoosts':
                astronaut.maxSpeed += 0.5;
                break;
            case 'mentalStimulants':
                mentalState = min(mentalState + 25, 100);
                break;
            case 'oxygenTanks':
                oxygenLevel = min(oxygenLevel + 40, 100);
                break;
        }
    }
}

function updateAstronautStatus() {
    if (inSpace) {
        oxygenLevel = max(oxygenLevel - 0.03, 0);
    }
    
    if (oxygenLevel < 30) {
        mentalState = max(mentalState - 0.05, 0);
    }
    
    if (astronaut.health <= 0 || oxygenLevel <= 0 || mentalState <= 0) {
        gameOver();
    }
}

function gameOver() {
    noLoop();
    background(0);
    fill(255, 0, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text('Game Over', width/2, height/2 - 50);
    textSize(24);
    text(`Planets Visited: ${planetsVisited}`, width/2, height/2 + 50);
    text(`Final Credits: ${credits}`, width/2, height/2 + 100);
    text('Press R to Restart', width/2, height/2 + 150);
}

function restartGame() {
    astronaut = new Astronaut();
    planets = [];
    bullets = [];
    enemies = [];
    credits = 0;
    currentPlanet = null;
    inSpace = true;
    planetsVisited = 0;
    mentalState = 100;
    oxygenLevel = 100;
    cameraY = 0;
    inventory = {
        healthPacks: 0,
        speedBoosts: 0,
        mentalStimulants: 0,
        oxygenTanks: 0
    };
    shieldEnergy = 100;
    shieldActive = false;
    shieldCooldown = 0;
    dash = 100;
    isDashing = false;
    generateInitialPlanets();
    currentEvent = null;
    loop();
}

function triggerRandomEvent() {
    let events = [
        {
            title: "Asteroid Field",
            description: "You've encountered an asteroid field! Navigate carefully to avoid damage.",
            action: () => {
                astronaut.health -= 20;
                credits += 50;
            }
        },
        {
            title: "Space Station",
            description: "You've discovered an abandoned space station. Explore it for resources?",
            action: () => {
                credits += 100;
                inventory.oxygenTanks++;
            }
        },
        {
            title: "Solar Flare",
            description: "A solar flare is affecting your systems. Recalibrate quickly!",
            action: () => {
                mentalState -= 10;
                astronaut.maxSpeed *= 0.9;
            }
        }
    ];
    
    currentEvent = random(events);
}

function drawEvent() {
    push();
    fill(0, 200);
    rect(100, 100, width - 200, height - 200);
    fill(255);
    textSize(24);
    textAlign(CENTER, TOP);
    text(currentEvent.title, width/2, 150);
    textSize(18);
    text(currentEvent.description, width/2, 200, width - 250);
    
    fill(100);
    rect(width/2 - 50, height - 150, 100, 40);
    fill(255);
    textAlign(CENTER, CENTER);
    text("Continue", width/2, height - 130);
    pop();
    
    if (mouseIsPressed && mouseX > width/2 - 50 && mouseX < width/2 + 50 && mouseY > height - 150 && mouseY < height - 110) {
        currentEvent.action();
        currentEvent = null;
    }
}
