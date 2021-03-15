Game.create({ width: 1920, height: 1080 });

let Terrain = {};
Terrain.Stash = [];
Terrain.stashPos = { x: 0, y: 0 }
Terrain.position = { x: 0, y: 0 }
Terrain.stashSize = { x: 160, y: 90 }


let baseLayer = new Layer("base", { level: 0 });
let background = new GameObject({ asset: new Asset.Primitive({ type: "rectangle", fill: "#ffffff" }), x: 0, y: 0, w: Game.width, h: Game.height });
baseLayer.assign(background);

let pixelSize = (Game.width / (Terrain.stashSize.x * 2));

Terrain.populate = function() {
    Terrain.Stash = new Array(Terrain.stashSize.x * 2 + 1);
    for (let i = Terrain.stashSize.x * -1; i <= Terrain.stashSize.x; i++) {
        Terrain.Stash[i] = new Array(Terrain.stashSize.y * 2 + 1)
        for (let j = Terrain.stashSize.y * -1; j <= Terrain.stashSize.y; j++) {
            let val = noise.perlin2(i / 50, j / 50);
            Terrain.Stash[i][j] = val

            let xPos = (i + Terrain.stashSize.x) * (Game.width / (Terrain.stashSize.x * 2));
            let yPos = (j + Terrain.stashSize.y) * (Game.height / (Terrain.stashSize.y * 2));

            let col = Math.floor((val + 1) * 50);

            baseLayer.assign(new GameObject({ asset: new Asset.Primitive({ type: "rectangle", fill: "hsl(210, 20%, " + col + "%)" }), x: xPos, y: yPos, w: pixelSize, h: pixelSize}));
        }
    }
};

Terrain.move = function() {

};

Terrain.populate();

Layer.drawAll();



