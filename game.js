var Util = {
    // Create objects with set prototype
    // and call their `init()` method.
    createObject: function(prototype) {
        var object = Object.create(prototype);
        var args = [].slice.call(arguments, 1);
        object.init.apply(object, args);
        return object;
    }
};


var Player = {

    x: 0,

    y: 0,

    width: 100,

    height: 10,

    // 0 => stopped, 1 => left, 2 => right
    direction: 0,

    speed: 20,

    init: function(x, y) {
        this.x = +x;
        this.y = +y;
    },
    
    moveLeft: function() {
        this.direction = 1;
    },

    moveRight: function() {
        this.direction = 2;
    },

    stop: function() {
        this.direction = 0;
    },

    update: function() {
        
        switch (this.direction) {
            case 1:
                this.x -= this.speed;
                break;
            case 2:
                this.x += this.speed;
                break;
        }

    },

    getDrawDescription: function() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            type: "player"
        }
    }

}

var Block = {
    width: 35,

    height: 14,

    x: 0,

    y: 0,

    destroyed: false,

    colour: null,

    init: function(x, y) {
        this.x = +x;
        this.y = +y;
        
        // Each block is a random colour.
        this.colour = "rgb(" + [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)].join(",") + ")";

    },

    destroy: function() {
        this.destroyed = true;
    },

    enable: function() {
        this.destroyed = false;
    },

    isDestroyed: function() {
        return !! this.destroyed;
    },
    
    getDrawDescription: function() {
        return {
            x: this.x,
            y : this.y,
            width: this.width,
            height: this.height,
            colour: this.colour,
            type: "block",
            visible: ! this.destroyed
        }
    }
};



var Ball = {
    x: 0,

    y: 0,

    speed: 10,

    dx: 0,
    
    dy: 1,

    radius: 1,

    init: function(x, y, radius) {
        this.x = +x;
        this.y =+y;
        this.radius = +radius;
    },

    isCollidingWith: function(object) {
        var radius2 = this.radius * 2;

        return (this.x + radius2 > object.x && this.x < object.x + object.width 
                && this.y + radius2 > object.y && this.y < object.y + object.height); 
    },

    update: function() {
        
        // Move.
        if (this.dx) {
            this.x += this.speed * this.dx;
        } else {
            this.x -= this.speed * this.dx;
        }

        if (this.dy) {
            this.y += this.speed * this.dy;
        } else {
            this.y -= this.speed * this.dy;
        }

        // Is player going to lose?
        if (this.y + this.radius > World.height) {
            Game.lose();
            return;
        }
    
        // Bounce in world's bounds.
        if (this.x - this.radius < 0 || this.x + this.radius > World.width) {
            this.dx *= -1;
        }

        if (this.y - this.radius < 0 || this.y + this.radius > World.height) {
            this.dy *= -1;
        }

        // Check for collision with player and blocks.
        if (this.isCollidingWith(Player)) {
            // Make ball bounce differently dependent on where it hits the paddle.
            this.dx = (this.x - Player.x - (Player.width / 2)) / Player.width;
            this.dy *= -1;
        } else {
            
            var allDestroyed = true;

            for (var i = 0; i < Game.blocks.length; i++) {
                var thisDestroyed = Game.blocks[i].isDestroyed();

                if ( ! thisDestroyed) {
                    allDestroyed = false;
                    
                    if (this.isCollidingWith(Game.blocks[i])) {
                        Game.blocks[i].destroy();
                        Game.addToScore();
                        this.dy *= -1;
                        
                        // Stop looking for collisions,
                        // otherwise the ball can hit a
                        // gap and it's too easy for the
                        // player.
                        break;
                    }

                }
            }
            if (allDestroyed) {
                Game.win();
                return;
            }
        }



    },

    getDrawDescription: function() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            type: "ball"
        }
    }

    


}

var World = {
    width: 700,
    height: 480
};



var Renderer = {

    width: 0,

    height: 0,

    ctx: null,

    objects: [],

    init: function(width, height, canvas) {
        this.width = +width;
        this.height = +height;
        this.ctx = canvas.getContext("2d");

        canvas.width = this.width;
        canvas.height = this.height;
    },

    addObject: function(obj) {
        this.objects.push(obj);
    },

    render: function() {

        // Clear canvas.
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw objects.
        for (var i = 0, length = this.objects.length; i < length; i++) {
            
            var drawDescription = this.objects[i].getDrawDescription();

            switch (drawDescription.type) {

                case "player":
                    this.ctx.fillStyle = "red";
                    this.ctx.fillRect(drawDescription.x, drawDescription.y, drawDescription.width, drawDescription.height);
                    break;

                case "block":
                    if ( ! drawDescription.visible) {
                        continue;
                    }

                    this.ctx.fillStyle = drawDescription.colour;
                    this.ctx.fillRect(drawDescription.x, drawDescription.y, drawDescription.width, drawDescription.height);
                    break;
                   
                case "ball":
                    this.ctx.fillStyle = "blue";
                    this.ctx.beginPath();
                    this.ctx.arc(drawDescription.x, drawDescription.y, drawDescription.radius, 0, Math.PI * 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                    

            }

        }

    }

};


var Game = {

    score: 0,

    blocks: [],

    updateInterval: 40,

    active: false,

    activePanelId: "title",

    update: function () {
        Player.update();
        Ball.update();
        Renderer.render();
    },

    showPanel: function(panelId) {

        var previousPanel = document.getElementById(this.activePanelId),
            nextPanel = document.getElementById(panelId);

        previousPanel.className = (" " + previousPanel.className + " ").replace(" show ", "") + " hide";
        nextPanel.className += " show";
        
        this.activePanelId = panelId;

    },

    init: function () {
        var self = this;

        Renderer.init(World.width, World.height, document.getElementsByTagName("canvas")[0]);

        Renderer.addObject(Player);
        Renderer.addObject(Ball);

        var blockPadding = 2,
            blockGroupPadding = 40,
            blocksPerRow = Math.floor((World.width - blockGroupPadding * 2) / (Block.width + blockPadding));

        // Create blocks.
        for (var i = 0; i < 48; i++) {

            var x = blockGroupPadding + (Block.width + blockPadding) * (i % blocksPerRow),
                y = blockGroupPadding + (Block.height + blockPadding) * Math.floor(i / blocksPerRow);
           
            var block = Util.createObject(Block, x, y);

            Renderer.addObject(block);

            this.blocks.push(block);

        }

        

        if (document.body.style.hasOwnProperty("webkitTransform")) {
            document.body.className += " transform-supported";
        
            document.getElementById("game-container").addEventListener("webkitTransitionEnd", function(event) {
                event.target.className = (" " + event.target.className + " ").replace(" hide ", "");
            });

        }

        document.addEventListener("DOMContentLoaded", function () {
            
            
            var startButton = document.getElementById("button-play");

            startButton.addEventListener("click", function() {
                self.showPanel("game");
                self.start();
            });

            var replayButton = document.getElementById("lose").getElementsByTagName("button")[0];      
                    
            replayButton.addEventListener("click", function() {
                self.showPanel("game");           
                self.start();
            });

            var aboutButton = document.getElementById("button-about");
            
            aboutButton.addEventListener("click", function() {
                self.showPanel("about");
            });
            
            var backButton = document.getElementById("about").getElementsByTagName("button")[0];      
                    
            backButton.addEventListener("click", function() {
                self.showPanel("title");           
            });          

        });

        document.addEventListener("keydown", function (event) {
            
            if ( ! self.active) {
                return;
            }

            switch (event.keyCode) {
                case 39:
                case 68:
                    Player.moveRight();
                    break;
                case 37:
                case 65:
                    Player.moveLeft();
                    break;
            }
        });

        document.addEventListener("keyup", function() {
            Player.stop();
        });

        
    },

    addToScore: function() {
        document.getElementById("score").textContent = ++this.score;
    },

    start: function() {
        this.score = 0;

        this.active = true;

        Player.init((World.width - Player.width) / 2, 460);

        var ballRadius = 8;
        Ball.init((World.width / 2) - ballRadius, World.height - 100, ballRadius);


        // Re-enable all blocks.
        for (var i = 0, length = this.blocks.length; i < length; i++) {
            this.blocks[i].enable();
        }
        
        var self = this;

        (function me(game) {

            if ( ! self.active) {
                return;
            }

            self.update();
            setTimeout(me, self.updateInterval);
        })();

       
    },

    win: function() {
        this.showPanel("win");       
        this.active = false;
    },

    lose: function() {
        document.getElementById("score").textContent = 0;
        document.getElementById("final-score").getElementsByTagName("span")[0].textContent = this.score;       
        this.showPanel("lose");       
        this.active = false;
    }

};

Game.init();
