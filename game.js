// Utilities.
var Util = {
    // Create objects with set prototype
    // and call their `init()` method.
    createObject: function (prototype) {
        var object = Object.create(prototype);
        var args = [].slice.call(arguments, 1);
        object.init.apply(object, args);
        return object;
    },

    // Turn an array of 3 items into a "rgb(n,n,n)"
    // string.
    makeRgb: function (rgb) {
        return "rgb(" + rgb.join(",") + ")";
    }
};

// The PieceFactory is used for making
// new piece objects.
var PieceFactory = {

    // Definitions of each Tetris piece.
    // Cell = 1
    // Origin = 2 (optional)
    definitions: [
    // S
    [
        [0, 0, 0, 0],
        [0, 2, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [1, 0, 0, 0],
        [1, 2, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // L
    [
        [0, 0, 1, 0],
        [1, 2, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // Z
    [
        [1, 2, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // I
    [
        [0, 0, 0, 0],
        [1, 2, 2, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // O
    [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // T
    [
        [0, 1, 0, 0],
        [0, 2, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ]

    ],

    // The calculated rotations are cached.
    cache: [],

    makeCache: function (id) {

        var rotations = [
                []
            ],
            definition = this.definitions[id],
            origin = null;

        // Build nicer format to work with.
        for (var y = 0, yLength = definition.length; y < yLength; y++) {
            for (var x = 0, xLength = definition[y].length; x < xLength; x++) {

                var coords = {
                    x: x,
                    y: y,
                    value: definition[y][x]
                };

                switch (definition[y][x]) {
                case 2:
                    origin = {
                        x: coords.x,
                        y: coords.y
                    };
                case 1:
                    rotations[0].push(coords);
                }
            }

        }

        // Build rotations.
        for (var rotation = 0; rotation < 3; rotation++) {
            var set = [];
            rotations.push(set);

            for (var i = 0, iLength = rotations[rotation].length; i < iLength; i++) {

                var x = rotations[rotation][i].x,
                    y = rotations[rotation][i].y;

                // Some shapes don't have an origin, such as the block.
                if (origin) {

                    // Transpose to Cartesian system (minus the origin's offset).
                    x -= origin.x;
                    y -= origin.y;

                    // Flip the y's sign (Cartesian's y goes up, our implementation's y goes down).
                    y = -y;

                    // Apply transformation.
                    // x' = x * cos(PI/2) - y * sin(PI/2)
                    // y' = x * sin(PI/2) + y * cos(PI/2)
                    // These formulas translate to more simple equations
                    // as we are only rotation 90 degree chunks.
                    // x' = -y
                    // y' = x;
                    var temp = x;
                    x = -y;
                    y = temp;

                    // Flip the y's sign back to origin.
                    y = -y;

                    // Add origin offset back to coords.
                    x += origin.x;
                    y += origin.y;

                }

                set.push({
                    x: x,
                    y: y,
                    value: rotations[rotation][i].value
                });
            }

            this.cache[id] = rotations;

        }

    },

    // Get list of pieces in all rotations.
    getPieceDefinition: function (id) {

        if (!this.definitions[id]) {
            return;
        }

        if (!this.cache[id]) {
            this.makeCache(id);
        }

        return this.cache[id];

    },

    getRandomPiece: function () {
        var randomIndex = Math.floor(Math.random() * this.definitions.length);
        return Util.createObject(Piece, this.getPieceDefinition(randomIndex));
    }

};


// Tetris Piece
var Piece = {

    x: 0,

    y: 0,

    speed: 1,

    dropSpeed: 1,

    isFallingFast: false,

    rotation: 0,

    direction: null,

    destroyed: false,

    init: function (type) {
        this.type = type;
        this.color = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];

    },

    getCells: function () {

        if (this.destroyed) {
            return [];
        }

        return this.type[this.rotation];
    },

    getCellsByRotation: function (rotation) {
        return this.type[rotation] && this.type[rotation];
    },

    destroy: function () {
        this.destroyed = true;
    },

    rotate: function () {

        var newRotation = (this.rotation + 1) % 4;

        // Some blocks can not rotate when against
        // an edge, otherwise cells will appear
        // out of bounds.
        if (!Board.canMoveToX(this.getCellsByRotation(newRotation), this.x, this.y)) {
            return;
        }

        this.rotation = newRotation;
    },

    moveLeft: function () {
        this.direction = "left";
    },

    moveRight: function () {
        this.direction = "right";
    },

    fall: function () {
        this.isFallingFast = true;

    },

    stop: function () {
        this.isFallingFast = false;
        this.direction = null;
    },

    update: function (index) {

        var y = this.y,
            x = this.x;

        if (this.destroyed) {
            return;
        }

        // Move piece down.
        if (!(index % (this.isFallingFast ? 0 : 4))) {
            y += 1;
        }

        switch (this.direction) {
        case "left":
            x -= this.speed;
            break;
        case "right":
            x += this.speed;
            break;
        }

        if (Board.canMoveToX(this.getCells(), x, y)) {
            this.x = x;
        }

        if (Board.checkCollisionAt(this, this.x, y)) {

            if (this.y <= 0) {
                Game.lose();
                return;
            }

            // 10 points for placing a piece.
            Game.updateScore(10);

            Board.mergeIntoStack(this);

            this.destroy();

            var linesCleared = Board.clearLines();

            // 100 * lines score for clearing a line.
            Game.updateScore(100 * linesCleared);
            Board.add();
            return;

        }

        this.y = y;

    }

};

var Board = {

    width: 16,

    height: 24,

    cellSize: 16,

    cells: [],

    activePiece: null,

    direction: null,

    init: function () {

        for (var y = 0; y < this.height; y++) {
            this.cells[y] = [];
            for (var x = 0; x < this.width; x++) {
                // No piece occupying any cells.
                this.cells[y][x] = null;
            }
        }

        this.add();

    },

    canMoveToX: function (cells, x, y) {
        for (var i = 0, length = cells.length; i < length; i++) {

            var cell = cells[i];

            // Check left and right boundaries.
            if (x + cell.x < 0 || x + cell.x >= this.width) {
                return false;
            }

            if (this.getCellAt(x + cell.x, y + cell.y)) {
                return false;
            }

        }

        return true;

    },


    checkCollisionAt: function (item, x, y) {

        var cells = item.getCells();

        var boardCells = this.cells;

        for (var i = 0, length = cells.length; i < length; i++) {

            var cell = cells[i];

            // Check to see if we've collided with the bottom.
            if (cell.y + y >= Board.height) {
                return true;
            }

            if (this.getCellAt(cell.x + x, cell.y + y)) {
                return true;
            }

        }

        return false;

    },

    mergeIntoStack: function (piece, x, y) {
        var cells = piece.getCells();

        for (var i = 0, length = cells.length; i < length; i++) {
            var cell = cells[i];

            this.setCellAt(piece.x + cell.x, piece.y + cell.y, {
                    color: piece.color
                });

        }

    },

    reflowStack: function (row) {

        for (var y = row; y > 0; y--) {
            for (var x = 0; x < this.width; x++) {
                this.cells[y][x] = this.cells[y - 1][x];
            }
        }

    },

    clearLines: function () {

        var linesCleared = 0;

        for (var y = this.height - 1; y >= 0; y--) {

            for (var x = 0; x < this.width; x++) {
                var cell = this.getCellAt(x, y);

                if (cell && x == this.width - 1) {
                    // Full row, clear 'em.
                    this.reflowStack(y);
                    linesCleared++;
                    x = 0;
                } else if (!cell) {
                    // This can't be a whole row, try new one.
                    break;
                }

            }

        }

        return linesCleared;
    },

    getCellAt: function (x, y) {
        return this.cells[y] && this.cells[y][x];
    },

    setCellAt: function (x, y, block) {
        this.cells[y][x] = block;
    },

    getActivePiece: function () {
        return this.activePiece;
    },

    add: function () {

        this.activePiece = PieceFactory.getRandomPiece();

        this.activePiece.x = Math.floor((this.width - 4) / 2);
        this.activePiece.y = -2;

    }
};

var Renderer = {

    ctx: null,

    init: function () {
        var canvas = document.getElementById("game");
        this.ctx = canvas.getContext("2d");
        canvas.width = Board.width * Board.cellSize;
        canvas.height = Board.height * Board.cellSize;
    },

    render: function () {

        // Clear game board.
        this.ctx.clearRect(0, 0, Board.width * Board.cellSize, Board.height * Board.cellSize);

        // Draw pool.
        for (var y = 0; y < Board.height; y++) {
            for (var x = 0; x < Board.width; x++) {

                var cell = Board.getCellAt(x, y);

                if (!cell) {
                    continue;
                }

                this.ctx.fillStyle = Util.makeRgb(cell.color);

                this.ctx.fillRect(x * Board.cellSize, y * Board.cellSize, Board.cellSize, Board.cellSize);

            }
        }

        // Draw active piece.
        var currentPiece = Board.getActivePiece();
        var cells = currentPiece.getCells();

        this.ctx.fillStyle = Util.makeRgb(currentPiece.color);

        for (var i = 0, length = cells.length; i < length; i++) {
            this.ctx.fillRect((currentPiece.x + cells[i].x) * Board.cellSize, (currentPiece.y + cells[i].y) * Board.cellSize, Board.cellSize, Board.cellSize);
        }

    }
}

var Game = {

    active: true,

    interval: 100,

    frameIndex: 0,

    score: 0,

    init: function () {

        Board.init();

        Renderer.init();

        this.start();

        var self = this;
        document.addEventListener("keydown", function (event) {

            if (!self.active) {
                return;
            }

            switch (event.keyCode) {
            case 38:
            case 87:
                Board.getActivePiece().rotate();
                break;
            case 39:
            case 68:
                Board.getActivePiece().moveRight();
                break;
            case 37:
            case 65:
                Board.getActivePiece().moveLeft();
                break;
            case 40:
            case 68:
                Board.getActivePiece().fall();
            }

        });

        document.addEventListener("keyup", function (event) {
            Board.getActivePiece().stop();

        });

    },

    update: function () {
        Board.getActivePiece().update(this.frameIndex);
        Renderer.render();
        this.frameIndex++;
    },

    start: function () {

        this.active = true;

        var self = this;

        (function me() {

            if (!self.active) {
                return;
            }

            self.update();
            setTimeout(me, self.interval);
        })();

    },

    lose: function () {
        this.active = false;
        alert("You lose!");
    },

    updateScore: function (points) {
        this.score += points;
        document.getElementById("score").textContent = this.score;
    }
};

Game.init();
