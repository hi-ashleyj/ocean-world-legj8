Game.create({ width: 1920, height: 1080 });

let Terrain = {};
Terrain.Stash = [];
Terrain.stashPos = { x: 0, y: 0 }
Terrain.position = { x: 0, y: 0 }
Terrain.stashSize = { x: 160, y: 90 }
Terrain.tileSize = (Game.width / (Terrain.stashSize.x * 2));


let baseLayer = new Layer("base", { level: 0 });
let background = new GameObject({ asset: new Asset.Primitive({ type: "rectangle", fill: "#000000" }), x: 0, y: 0, w: Game.width, h: Game.height });
baseLayer.assign(background);



Terrain.populate = function() {
    Terrain.Stash = new Array(Terrain.stashSize.x * 2 + 1);
    for (let i = 0; i <= Terrain.stashSize.x * 2; i++) {
        Terrain.Stash[i] = new Array(Terrain.stashSize.y * 2 + 1)

        for (let j = 0; j <= Terrain.stashSize.y * 2; j++) {
            Terrain.Stash[i][j] = noise.perlin2((i - Terrain.stashSize.x) / 50, (j - Terrain.stashSize.y) / 50);
        }
    }
};

Terrain.shift = function(x, y) {
    if (x < 0) {
        let newStashPosX = Terrain.position.x + x;
        let oldbitch = Terrain.position.x - Terrain.stashSize.x
        let newbitch = newStashPosX - Terrain.stashSize.x;
        for (let i = newbitch; i < oldbitch; i++) {
            let green = new Array(Terrain.stashSize.y * 2 + 1);

            for (let j = 0; j <= Terrain.stashSize.y * 2; j++) {
                green[j] = noise.perlin2(i / 50, (Terrain.position.y + j - Terrain.stashSize.y) / 50);
            }

            Terrain.Stash.unshift(green);
            Terrain.Stash.pop();
        }
    } else if (x > 0) {
        let newStashPosX = Terrain.position.x + x;
        let oldbitch = Terrain.position.x + Terrain.stashSize.x
        let newbitch = newStashPosX + Terrain.stashSize.x;
        for (let i = oldbitch + 1; i <= newbitch; i++) {
            let green = new Array(Terrain.stashSize.y * 2 + 1);

            for (let j = 0; j <= Terrain.stashSize.y * 2; j++) {
                green[j] = noise.perlin2(i / 50, (Terrain.position.y + j - Terrain.stashSize.y) / 50);
            }

            Terrain.Stash.push(green);
            Terrain.Stash.shift();
        }
    }

    Terrain.position.x += x;


    if (y < 0) {
        let newStashPosY = Terrain.position.y + y;
        let oldbitch = Terrain.position.y - Terrain.stashSize.y;
        let newbitch = newStashPosY - Terrain.stashSize.y;
        for (let i = 0; i <= Terrain.stashSize.x * 2; i++) {

            for (let j = newbitch; j < oldbitch; j++) {
                Terrain.Stash[i].unshift(noise.perlin2((Terrain.position.x + i - Terrain.stashSize.x) / 50, j / 50));
                Terrain.Stash[i].pop();
                
            }
        }
    } else if (y > 0) {
        let newStashPosY = Terrain.position.y + y;
        let oldbitch = Terrain.position.y + Terrain.stashSize.y;
        let newbitch = newStashPosY + Terrain.stashSize.y;
        for (let i = 0; i <= Terrain.stashSize.x * 2; i++) {

            for (let j = oldbitch + 1; j <= newbitch; j++) {
                Terrain.Stash[i].push(noise.perlin2((Terrain.position.x + i - Terrain.stashSize.x) / 50, j / 50));
                Terrain.Stash[i].shift();
                
            }
        }
    }

    Terrain.position.y += y;
};

let MapDisplay = {
    offsetX: 0,
    offsetY: 0,
    assets: {
        dark_water: new Asset.Primitive({ type: "rectangle", fill: "#333377" }),
        plain_water: new Asset.Primitive({ type: "rectangle", fill: "#56bfff" }),
        sand: new Asset.Primitive({ type: "rectangle", fill: "#ffe4a2" }),
        dirt: new Asset.Primitive({ type: "rectangle", fill: "#542e08" }),
        grass: new Asset.Primitive({ type: "rectangle", fill: "#658918" })
    }
};

MapDisplay.draw = function(layer) {
    for (let i = 0; i <= Terrain.stashSize.x * 2; i ++) {
        for (let j = 0; j <= Terrain.stashSize.y * 2; j ++) {
            let xPos = (i * Terrain.tileSize) + MapDisplay.offsetX;
            let yPos = (j * Terrain.tileSize) + MapDisplay.offsetY;

            let val = Terrain.Stash[i][j];
            if (val > 0.25) {
                MapDisplay.assets.grass.draw(layer, xPos, yPos, Terrain.tileSize, Terrain.tileSize);
            } else if (val > 0.15) {
                MapDisplay.assets.dirt.draw(layer, xPos, yPos, Terrain.tileSize, Terrain.tileSize);
            } else if (val > 0.1) {
                MapDisplay.assets.sand.draw(layer, xPos, yPos, Terrain.tileSize, Terrain.tileSize);
            } else if (val > -0.8) {
                MapDisplay.assets.plain_water.draw(layer, xPos, yPos, Terrain.tileSize, Terrain.tileSize);
            } else {
                MapDisplay.assets.dark_water.draw(layer, xPos, yPos, Terrain.tileSize, Terrain.tileSize);
            }
        }
    }
};

baseLayer.assign(MapDisplay);

Terrain.populate();

movementDirection = "";

Game.on("loop", ({ stamp, delta }) => {
    let moveX = 0;
    let moveY = 0;

    if (movementDirection.includes("E") && Controller.isPressed("key_d")) {
        moveX = 1;
    } else if (movementDirection.includes("W") && Controller.isPressed("key_a")) {
        moveX = -1;
    } else if (Controller.isPressed("key_d") && !Controller.isPressed("key_a")) {
        moveX = 1;
    } else if (Controller.isPressed("key_a") && !Controller.isPressed("key_d")) {
        moveX = -1;
    }

    if (movementDirection.includes("N") && Controller.isPressed("key_w")) {
        moveY = -1;
    } else if (movementDirection.includes("S") && Controller.isPressed("key_s")) {
        moveY = 1;
    } else if (Controller.isPressed("key_w") && !Controller.isPressed("key_s")) {
        moveY = -1;
    } else if (Controller.isPressed("key_s") && !Controller.isPressed("key_w")) {
        moveY = 1;
    }

    movementDirection = "";

    if (moveY !== 0) {
        movementDirection += (moveY > 0) ? "S": "N";
    }
    if (moveX !== 0) {
        movementDirection += (moveX > 0) ? "E": "W";
    }

    Terrain.shift(moveX, moveY);
});

Game.start();

