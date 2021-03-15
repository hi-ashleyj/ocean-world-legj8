let Game = {};

let Controller = {};
Controller.events = [];
Controller.lasts = {};
Controller.pressed = {};
Controller.mouse = {};
Controller.mouse.location = {};

/**
 * @callback controllerevent
 * @param {string} action 
 * @param {string} target 
 * @param {object} data 
 * @returns 
 */

/**
 * Event Actions
 * @typedef {("press"|"release"|"click"|"hold")} eventactions
 */

/**
 * Creates an event handler for a keyboard or mouse event
 * @param  {eventactions} action 
 * @param  {string} target
 * @param  {controllerevent} call
 */
Controller.on = function(action, target, call) {
    Controller.events.push({ action, target, call });
    return;
};
/**
 * @param  {eventactions} action
 * @param  {string} target
 * @param  {?object} data
 */
Controller.fire = function(action, target, data) {
    for (let i in Controller.events) {
        if ((!Controller.events[i].target || Controller.events[i].target == target) && (!Controller.events[i].action || Controller.events[i].action == action)) {
            Controller.events[i].call(action, target, (data) ? data : null);
        }
    }
    return;
};
/**
 * @param  {string} code
 */
Controller.isPressed = function(code) {
    return Controller.pressed[code];
}

Controller.handleKeyboard = function(e) {
    let target = "key_" + e.key.toLowerCase();
    if (e.type == "keydown") {
        if (!Controller.pressed[target]) {
            Controller.pressed[target] = true;
            Controller.lasts[target] = e.timeStamp;
            Controller.fire("press", target);
        }
    } else if (e.type == "keyup") {
        if (Controller.pressed[target]) {
            Controller.pressed[target] = false;
            let diff = e.timeStamp - Controller.lasts[target];

            if (diff <= 150) {
                Controller.fire("click", target);
            } else {
                Controller.fire("hold", target, diff);
            }

            Controller.lasts[target] = e.timeStamp;
            Controller.fire("release", target);
        }
    }
};

Controller.handleMouse = function(e) {
    let target = "mouse_" + ((e.button) ? ["left", "middle", "right", "back", "forward"][e.button] : "moose");
    if (e.type == "mousedown") {
        if (!Controller.pressed[target]) {
            Controller.pressed[target] = true;
            Controller.lasts[target] = e.timeStamp;
            Controller.fire("press", target);
        }
    } else if (e.type == "mouseup") {
        if (Controller.pressed[target]) {
            Controller.pressed[target] = false;
            let diff = e.timeStamp - Controller.lasts[target];

            if (diff <= 150) {
                Controller.fire("click", target);
            } else {
                Controller.fire("hold", target, diff);
            }

            Controller.lasts[target] = e.timeStamp;
            Controller.fire("release", target);
        }
    }
    if (e.clientX && e.clientY) {
        let deltaX = e.clientX - Controller.mouse.location.x;
        let deltaY = e.clientY - Controller.mouse.location.y;

        Controller.fire("move", "mouse_location", { x: e.clientX, y: e.clientY, deltaX, deltaY });

        Controller.mouse.location.x = e.clientX;
        Controller.mouse.location.y = e.clientY;
    }
    if (e.type == "wheel") {
        let direction = "";
        if (e.deltaY < 0) {
            direction += "N";
        } else if (e.deltaY > 0) {
            direction += "S";
        }

        if (e.deltaX < 0) {
            direction += "W";
        } else if (e.deltaX > 0) {
            direction += "E";
        }

        Controller.fire("move", "mouse_wheel", { direction, deltaX: e.deltaX, deltaY: e.deltaY });
    }
};
/**
 * Prepares the Controller (keyboard/mouse) to handle events
 */
Controller.setup = function() {
    document.addEventListener("mousedown", Controller.handleMouse, false);
    document.addEventListener("mouseup", Controller.handleMouse, false);
    document.addEventListener("mousemove", Controller.handleMouse, false);
    document.addEventListener("wheel", Controller.handleMouse, false);

    document.addEventListener("keydown", Controller.handleKeyboard, false);
    document.addEventListener("keyup", Controller.handleKeyboard, false);
};

/**
 * Asset
 * @typedef {object} Asset
 */

/**
 * Loads and prepares an image
 * @constructor
 * @param {object} options
 * @param {string} options.image - URL/URI to image resource
 * @param {object=} options.crop - Pre-crop image
 * @param {number} options.crop.x - X co-ordinate of crop
 * @param {number} options.crop.y - Y co-ordinate of crop
 * @param {number} options.crop.w - width co-ordinate of crop
 * @param {number} options.crop.h - height co-ordinate of crop
 * @returns {Asset}
 */
let Asset = function(options) {
    if (options.image) {
        this.type = "image";
        this.location = options.image;
        if (Asset.locations[this.location]) {
            this.resource = Asset.locations[this.location];
        } else {
            let u = this;
            this.resource = document.createElement("img");
            Asset.locations[this.location] = this.resource;
            Asset.loading.push(this.location);
            this.resource.addEventListener("load", () => {
                for (let i = Asset.loading.length - 1; i >= 0; i--) {
                    if (Asset.loading[i] == u.location) {
                        Asset.loading.splice(i, 1);
                    }
                }
            });
            this.resource.src = this.location;
            Asset.dumpspace.append(this.resource);
        }
        if (options.crop) {
            this.crop = [options.crop.x, options.crop.y, options.crop.w, options.crop.h];
        }
    }

    return this;
};

/**
 * Asset that is a primitive shape
 * @constructor
 * @param {object} options 
 * @param {("rectangle"|"circle"|"arc")} options.type
 * @param {string=} options.fill
 * @param {string=} options.stroke
 * @param {number=} options.angleTo
 * @param {number=} options.angleFrom
 * @returns {Asset}
 */
Asset.Primitive = function(options) {
    if (options.type) {
        if (options.type == "rectangle") {
            this.type = "rect";
        } else if (options.type == "circle") {
            this.type = "arc";
            this.angleFrom = 0;
            this.angleTo = 360;
        } else if (options.type == "arc") {
            this.type = "arc";
            this.angleFrom = options.angleFrom;
            this.angleTo = options.angleTo;
        }

        this.fill = (options.fill) ? options.fill : null;
        this.stroke = (options.stroke) ? options.stroke : null;
    }

    return this;
};

/**
 * Loads a font using the FontFace API
 * @param {string} fontname 
 * @param {string} loc 
 * @param {object=} features 
 * @param {string=} features.family
 * @param {string=} features.style
 * @param {string=} features.weight
 * @param {string=} features.stretch
 * @param {string=} features.unicodeRange
 * @param {string=} features.variant
 * @param {string=} features.featureSettings
 * @returns {Object}
 */
Asset.Font = function(fontname, loc, features) {
    this.font = fontname;
    this.loc = loc;
    this.features = (features) ? features : null;

    if (Asset.locations[this.loc]) {
        return this;
    }

    Asset.locations[this.loc] = true;

    if (this.features) {
        this.face = new FontFace(this.font, "url(" + this.loc + ")", this.features);
    } else {
        this.face = new FontFace(this.font, "url(" + this.loc + ")");
    }

    Asset.loading.push(this.loc);

    this.face.load().then((face) => {
        document.fonts.add(face);
        for (let i = Asset.loading.length - 1; i >= 0; i--) {
            if (Asset.loading[i] == this.loc) {
                Asset.loading.splice(i, 1);
            }
        }
    });

    return this;
};

Asset.loading = [];
Asset.locations = {};
Asset.dumpspace = document.querySelector("div.image-dumpspace");


/**
 * Returns co-ordinates centered
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 * @returns {number[]=[x, y, w, h]} 
 */
Asset.center = function(x, y, w, h) {
    return [x - (w / 2), y - (h / 2), w, h];
};

/**
 * Draws the asset on the layer
 * @param {Layer} layer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 */
Asset.prototype.draw = function(layer, x, y, w, h) {
    switch (this.type) {
        case ("image"): {
            if (this.crop) {
                layer.ctx.drawImage(this.resource, ...this.crop, x, y, w, h);
            } else {
                layer.ctx.drawImage(this.resource, x, y, w, h);
            }
            break;
        }
    }
};

/**
 * Draws the asset on the layer
 * @param {Layer} layer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 */
Asset.Primitive.prototype.draw = function(layer, x, y, w, h) {
    switch (this.type) {
        case ("rect"): {
            if (this.fill) {
                layer.ctx.fillStyle = this.fill;
                layer.ctx.fillRect(x, y, w, h);
            }
            if (this.stroke) {
                layer.ctx.fillStyle = this.stroke;
                layer.ctx.strokeRect(x, y, w, h);
            }
            break;
        }
        case ("arc"): {
            let r = (w + h) / 4;
            layer.ctx.beginPath();
            layer.ctx.arc(x, y, r, ((this.angleFrom - 90) * Math.PI / 180), ((this.angleTo - 90) * Math.PI / 180));
            layer.ctx.lineTo(x, y);
            layer.ctx.closePath();
            if (this.fill) {
                layer.ctx.fillStyle = this.fill;
                layer.ctx.fill();
            }
            if (this.stroke) {
                layer.ctx.fillStyle = this.stroke;
                layer.ctx.stroke();
            }
            break;
        }
    }
};

let Sound = function(layer, description, asset) {
    // TODO: do sounds
};

/**
 * @typedef {object} Layer
 */

/** This is a layer lol
 * @constructor
 * @param {string} id 
 * @param {object} options 
 * @param {number} options.level - height of the later
 * @returns {Layer}
 */
let Layer = function(id, options) {
    if (!Game.width || !Game.height) {
        throw "Game not created yet";
    }
    let john = document.createElement("canvas");
    john.className = "game-canvas";
    john.style.zIndex = options.level;
    document.querySelector("div#game").append(john);
    john.width = Game.width;
    john.height = Game.height;

    this.id = id;
    this.level = options.level;
    this.canvas = john;
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.targets = [];

    Layer.list[id] = this;
    return this;
};

Layer.list = {};

/**
 * Draws all known layers
 */
Layer.drawAll = function() {
    let layers = Object.keys(Layer.list).sort((a, b) => { return Layer.list[a].level - Layer.list[b].level;});

    for (let i = 0; i < layers.length; i++) {
        Layer.list[layers[i]].draw();
    }
};

/**
 * Purges assets for all known layers
 */
Layer.purgeAll = function() {
    for (let i in Layer.list) {
        Layer.list[i].purge();
    }
};

/**
 * Adds GameObjects to the layer
 * @param  {...GameObject} gameObjects 
 * @returns {Layer}
 */
Layer.prototype.assign = function(...gameObjects) {
    for (let thing of gameObjects) {
        this.targets.push(thing);
    }

    return this;
};

/**
 * Removes GameObjects from the layer
 * @param  {...GameObject} gameObjects 
 */
Layer.prototype.remove = function(...gameObjects) {
    for (let i = this.targets.length - 1; i >= 0; i--) {
        if (gameObjects.includes(this.targets[i])) {
            this.targets.splice(i, 1);
        }
    }
}
/**
 * Removes all GameObjects from the layer
 */
Layer.prototype.purge = function() {
    this.targets = [];
};

/**
 * Draws all assets on this layer.
 */
Layer.prototype.draw = function() {
    this.ctx.clearRect(0, 0, Game.width, Game.height);
    for (let i = 0; i < this.targets.length; i++) {
        this.targets[i].draw(this);
    }
};

let Animate = {};
Animate.stamp = -1;
Animate.targets = [];

Animate.tick = function(stamp) {
    Animate.stamp = stamp;
};

/**
 * @typedef {object} AnimateProperty
 */

/**
 * Animate Property for time-linked 
 * @constructor
 * @param {number} time - time in milliseconds to complete one loops
 * @param {object} steps - steps to take ({ amount: value, amount: value })
 * @param {number=} count - amount of times to repeat
 * @returns {AnimateProperty}
 */
Animate.property = function(time, steps, count) {
    this.time = time;
    this.steps = steps;
    this.points = Object.keys(this.steps).map((val) => { return parseFloat(val); }).sort((a, b) => { return a - b });
    this.count = (count) ? count : Infinity;
    this.once = true;
    this.offset = 0;

    Animate.targets.push(this);
    return this;
};

/**
 * Gets value for animate property at the current point in time
 * @returns {number}
 */

Animate.property.prototype.value = function() {
    if (this.once) {
        this.offset = Animate.stamp;
        this.once = false;
    }
    let factor = ((Animate.stamp - this.offset) % this.time) / this.time;
    if (Math.floor(((Animate.stamp - this.offset) / this.time)) >= this.count) { return null; }
    if (this.points < 2) {
        return;
    }
    let to;
    let from;
    for (let i = 0; i < this.points.length; i++) {
        if (this.points[i] >= factor && !(factor == this.points[i] && factor == 0)) {
            to = this.points[i];
            from = this.points[i - 1];
            break;
        }
    }

    let value = this.steps[from] + ((this.steps[to] - this.steps[from]) * ((factor - from) / (to - from)));
    return value; 
};

/**
 * @typedef {object} TileMap
 * @property {Asset[]} map - 0-indexed list of pre-cropped assets.
 */

/**
 * TileMap
 * @constructor
 * @param {object} options 
 * @param {string} options.image - URL/URI to image resource
 * @param {number} options.scaleX - width of one tile
 * @param {number} options.scaleY - height of one tile
 * @param {number} options.size - number of tiles
 * @returns {TileMap}
 */
let TileMap = function(options) {
    this.scaleX = options.scaleX;
    this.scaleY = options.scaleY;
    this.size = options.size;
    this.map = new Array(this.size);

    for (let i = 0; i < this.size; i ++) {
        this.map[i] = new Asset(Object.assign({ crop: { x: i * this.scaleX, y: 0, w: this.scaleX, h: this.scaleY } }, options));
    }

    return this;
};

/**
 * @typedef {object} AnimateSequence
 */

/**
 * @typedef {object} AnimateSequenceAnimations
 * @property {number} duration - duration of animation
 * @property {Asset[]} sequence - array of Assets to cycle through
 */

/**
 * @constructor
 * @param {AnimateSequenceAnimations{}} animations 
 * @param {string} def - default sequence 
 * @returns {AnimateSequence}
 */
Animate.Sequence = function(animations, def) {
    this.animations = animations;
    this.default = def;
    this.using = def;
    this.timing = new Animate.property(this.animations[this.using].duration, {0: 0, 1: this.animations[this.using].sequence.length}, Infinity);
    return this;
};


/**
 * Lethal animation switching.
 * @param {string} thing - name of sequence to switch to
 */
Animate.Sequence.prototype.switch = function(thing) {
    if (this.animations[thing]) {
        this.using = thing;
        this.timing = new Animate.property(this.animations[this.using].duration, {0: 0, 1: this.animations[this.using].sequence.length}, Infinity);
    }
};

/**
 * Non-lethal animation switching.
 * @param {string} thing - name of sequence to use / switch to if required
 */

Animate.Sequence.prototype.use = function(thing) {
    if (this.using !== thing) {
        this.switch(thing);
    }
};

/**
 * Draws the asset for the animation in use on the layer
 * @param {Layer} layer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} w 
 * @param {number} h 
 */
Animate.Sequence.prototype.draw = function(layer, x, y, w, h) {
    let thing = Math.floor(this.timing.value());
    this.animations[this.using].sequence[thing].draw(layer, x, y, w, h);
};

/**
 * @typedef {object} GameObject
 */

/**
 * @constructor
 * @param {object} options 
 * @param {Asset} options.asset
 * @param {number} options.x
 * @param {number} options.y
 * @param {number} options.w
 * @param {number} options.h
 * @returns {GameObject}
 */
let GameObject = function(options) {
    this.asset = options.asset;
    this.x = (options.x) ? options.x : 0;
    this.y = (options.y) ? options.y : 0;
    this.w = (options.w) ? options.w : 100;
    this.h = (options.h) ? options.h : 100;

    return this;
};

/**
 * Draws the asset on the layer passed in
 * @param {Layer} layer 
 */
GameObject.prototype.draw = function(layer) {
    this.asset.draw(layer, this.x, this.y, this.w, this.h);
};

/**
 * Moves/resizes the game object by the amounts given
 * @param {number|null} x 
 * @param {number|null} y 
 * @param {number|null} w 
 * @param {number|null} h 
 */
GameObject.prototype.move = function(x, y, w, h) {
    if (typeof x == "number") { this.x += x; };
    if (typeof y == "number") { this.y += y; };
    if (typeof w == "number") { this.w += w; };
    if (typeof h == "number") { this.h += h; };
};

/**
 * Sets the position/scale of the game object to the values given
 * @param {number|null} x 
 * @param {number|null} y 
 * @param {number|null} w 
 * @param {number|null} h 
 */
GameObject.prototype.position = function(x, y, w, h) {
    if (typeof x == "number") { this.x = x; };
    if (typeof y == "number") { this.y = y; };
    if (typeof w == "number") { this.w = w; };
    if (typeof h == "number") { this.h = h; };
};

/**
 * @typedef {object} Text
 */

/**
 * Text
 * @constructor
 * @param {object} options 
 * @param {string} options.text - text content
 * @param {number} options.size - font size
 * @param {string} options.font - font name
 * @param {string=} options.style - style information
 * @param {string=} options.fill - fill style
 * @param {string=} options.stroke - stroke style
 * @param {("left"|"center"|"right")="left"} options.alignH - horizontal alignment
 * @param {("top"|"middle"|"bottom"|"alphabetic")="alphabetic"} options.alignV - vertical alignment
 * @returns {Text}
 */
let Text = function(options) {
    this.text = options.text;
    this.size = options.size;
    this.font = options.font;
    this.style = (options.style) ? options.style : "";
    this.fill = (options.fill) ? options.fill : null;
    this.stroke = (options.stroke) ? options.stroke : null;
    this.alignH = (["left", "center", "right"].includes(options.alignH)) ? options.alignH : "left";
    this.alignV = (["top", "middle", "bottom", "alphabetic"].includes(options.alignV)) ? options.alignV : "alphabetic";

    return this;
};

/**
 * Draws the asset for the animation in use on the layer
 * @param {Layer} layer 
 * @param {number} x 
 * @param {number} y 
 * @param {number} _w - unused
 * @param {number} _h - unused
 */
Text.prototype.draw = function(layer, x, y, _w, _h) {
    layer.ctx.textAlign = this.alignH;
    layer.ctx.textBaseline = this.alignV;
    layer.ctx.font = ((this.style) ? this.style + " ": "") + this.size + "px " + this.font;
    if (this.fill) {
        layer.ctx.fillStyle = this.fill;
        layer.ctx.fillText(this.text, x, y);
    }
    if (this.stroke) {
        layer.ctx.strokeStyle = this.stroke;
        layer.ctx.strokeText(this.text, x, y);
    }
};

Game.timeouts = [];
Game.last = -1;

Game.wait = function(callback, delay) {
    Game.timeouts.push({ callback, delay });
};

Game.events = [];

Game.on = function(type, call) {
    Game.events.push({ type, call });
};

Game.fire = function(type, data) {
    for (let e of Game.events) {
        if (e.type == type) {
            e.call((data) ? data : null);
        }
    }
};


Game.loop = function(time) {
    if (Game.last < 0) {
        Game.last = time;
    }
    let delta = (time - Game.last);
    Animate.tick(time);

    for (let i = Game.timeouts.length - 1; i >= 0; i--) {
        if (Game.timeouts[i].start) {
            if (time >= Game.timeouts[i].start + Game.timeouts[i].delay) {
                Game.timeouts[i].callback(time - (Game.timeouts[i].start + Game.timeouts[i].delay));
                Game.timeouts.splice(i, 1);
            }
        } else {
            Game.timeouts[i].start = time;
        }
    }

    Game.fire("loop", { stamp: time, delta: delta });

    Layer.drawAll();

    Game.fire("postdraw", { stamp: time, delta: delta });

    window.requestAnimationFrame(Game.loop);
    Game.last = time;
};

/**
 * Creates and Prepares the game handler
 * @param {object} options 
 * @param {number} options.width - canvas width
 * @param {number} options.heigh - canvas height
 */
Game.create = function(options) {
    Game.width = options.width;
    Game.height = options.height;

    Controller.setup();
}

/**
 * Starts the main game loop
 */
Game.start = function() {
    window.requestAnimationFrame(Game.loop);
};