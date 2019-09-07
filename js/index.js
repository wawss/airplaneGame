//外部资源
var res = [{ key: 'airplaneImg', src: 'img/airplane.png', type: 'img', obj: null },
{ key: 'monsterImg', src: 'img/monster.png', type: 'img', obj: null }
];

var getPixelRatio = function (context) {
    var backingStore = context.backingStorePixelRatio ||
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;
    return (window.devicePixelRatio || 1) / backingStore;
};

var ratio = 0;
window.onload = function () {
    var width = document.body.clientWidth,
        height = document.body.clientHeight;
    var testCanvas = document.getElementById('testCanvas');
    var ctx = testCanvas.getContext('2d');
    ratio = getPixelRatio(ctx);
    testCanvas.style.width = width + 'px';
    testCanvas.style.height = height + 'px';
    testCanvas.width = width * ratio;
    testCanvas.height = height * ratio;
    var game = null;
    loadres(function () {
        game = new Game(ctx, testCanvas.width, testCanvas.height);
        game.init();
        testCanvas.addEventListener('touchstart', function (e) {
            var x = e.touches[0].clientX * ratio;
            var y = e.touches[0].clientY * ratio;
            if (!game) {
                game.start(x, y);
            } else {
                game.continue(x, y);
            }
        });
        testCanvas.addEventListener('touchend', function (e) {
            //game.stop();
        });
        testCanvas.addEventListener('touchmove', function (e) {
            var x = e.touches[0].clientX * ratio;
            var y = e.touches[0].clientY * ratio;
            game.update(x, y);
            event.preventDefault();
        });
    });
}

function Game(ctx, canvasWidth, canvasHeight) {
    var _airplane = new airplane(ctx, canvasWidth, canvasHeight);
    var _monster = new monsters(ctx, canvasWidth, canvasHeight);

    var timer = null;
    this.isStop = true;
    var draw = function () {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        _airplane.run(this.x, this.y, this.isStop);
        _monster.create();
    }
    this.init = function () {
        _airplane.init();
        _monster.init();
        var self = this;
        timer = requestAnimationFrame(function cb() {
            draw.call(self);
            timer = requestAnimationFrame(cb);
        });
    }
    this.start = function (x, y) {
        this.x = x;
        this.y = y;
        this.isStop = false;
        _airplane.setMovePrev(this.x, this.y);
    }
    this.stop = function () {
        this.isStop = true;
    }
    this.update = function (x, y) {
        this.x = x;
        this.y = y;
        this.isStop = false;
    }
    this.continue = function (x, y) {
        this.start();
    }
    this.end = function () { }

}


function airplane(ctx, canvasWidth, canvasHeight) {
    var width = 50 * ratio, height = 50 * ratio, halfWidth = width * 0.64;

    this.maxOutWidth = canvasWidth - width * 0.40;
    this.minOutWidth = 0 - width * 0.60;
    this.minOutHeight = 0;
    this.maxOutHeight = canvasHeight - height * 0.70;

    this.x = 0, this.y = 0, this.prevX = 0, this.prevY = 0;
    this.bulletList = [];
    this.spacing = 0;

    this.init = function () {
        let i = 0;
        while (i < 60) {
            this.bulletList.push(new bullet(ctx, canvasHeight));
            i += 1;
        }
        this.x = (canvasWidth - width) / 2;
        this.y = (canvasHeight - height) * 0.9;
        draw.call(this);
    }
    this.setMovePrev = function (x, y) {
        this.prevX = x;
        this.prevY = y;
    }
    this.move = function (x, y) {
        if (x === true) {
            this.prevX = 0;
            this.prevY = 0;
            return;
        }
        if (this.prevX && this.prevY) {
            this.x += (x - this.prevX);
            this.y += (y - this.prevY);
            if (this.x <= this.minOutWidth) { this.x = this.minOutWidth; }
            if (this.x >= this.maxOutWidth) { this.x = this.maxOutWidth; }
            if (this.y <= this.minOutHeight) { this.y = this.minOutHeight; }
            if (this.y >= this.maxOutHeight) { this.y = this.maxOutHeight; }
        }
        draw.call(this);
        this.prevX = x;
        this.prevY = y;
    }
    function draw() {
        var imgObj = getRes('airplaneImg');
        ctx.drawImage(imgObj, this.x, this.y, width, height);
    }
    this.run = function (x, y, isStop) {
        if (!isStop) {
            this.move(x, y);
            this.fire();
        } else {
            draw.call(this);
        }
    }
    this.fire = function () {
        var visibleBulletArr = this.bulletList.filter(function (item) { return item.visible === true; });
        if (visibleBulletArr && visibleBulletArr.length > 0) {
            visibleBulletArr.forEach(function (item) {
                item.run();
            });
        }
        if (this.spacing % 5 === 0) {
            var p1 = this.bulletList.find(function (item) { return !item.visible; });
            var p2 = this.bulletList.find(function (item) { return !item.visible && item !== p1; });
            if (p1) {
                p1.visible = true;
                p1.run(this.x, this.y);
            }
            if (p2) {
                p2.visible = true;
                p2.run(this.x + halfWidth, this.y);
            }
        }
        this.spacing += 1;
        if (this.spacing >= 100000) {
            this.spacing = 0;
        }
    }
}


function bullet(ctx, canvasHeight) {
    var width = 50; height = 50;
    this.x = 0,
        this.y = 0,
        this.t = 0,
        this.b = 0,
        this.c = -canvasHeight,
        this.d = 10,
        this.speed = 0.2,
        this.i = 0,
        this.visible = false;
    this.run = function (x, y) {
        if (!this.x) { this.x = x; }
        if (!this.y) { this.y = y; }
        if (!this.b) {
            this.b = this.y;
        }
        this.y = Tween.linear(this.t, this.b, this.c, this.d);
        if (this.t < this.d) {
            this.t += this.speed;
            this.draw(this.x, this.y);
        } else {
            this.t = 0;
            this.x = 0;
            this.y = 0;
            this.b = 0;
            this.visible = false;
        }
    }
    this.draw = function (x, y) {
        var imgObj = getRes('airplaneImg');
        ctx.drawImage(imgObj, x, y, width, height);
    }
}


function monsters(ctx, canvasWdith, canvasHeight) {
    this.viruses = [];
    this.init = function () {
        let i = 0;
        while (i < 30) {
            this.viruses.push(new virus(ctx, canvasWdith, canvasHeight));
            i += 1;
        }
    }
    this.create = function () {
        this.viruses.forEach(function (item) {
            item.run();
        });
    }
}


function virus(ctx, canvasWdith, canvasHeight) {
    this.width = 60 * ratio;
    this.height = 60 * ratio;
    this.maxX = canvasWdith - this.width;
    this.maxY = canvasHeight;
    this.x_reverse = false;
    this.x = 0;
    this.y = 0;
    this.x_t = 0, this.y_t = 0;
    this.x_b = random(0, canvasWdith), this.y_b = random(-500, -this.width);
    this.x_c = random(100, 300), this.y_c = random(0, 100);
    this.x_d = random(10, 100), this.y_d = random(10, 50);
    this.x_speed = 1, this.y_speed = 1;

    this.run = function () {
        this.y = Tween.linear(this.y_t, this.y_b, this.y_c, this.y_d);
        this.y_t += this.y_speed;
        if (this.y > this.maxY) {
            this.x_b = random(0, canvasWdith), this.y_b = random(-500, -this.width);
            this.x_c = random(100, 300), this.y_c = random(0, 100);
            this.x_d = random(10, 50), this.y_d = random(10, 20);
            this.x_t = 0;
            this.y_t = 0;
            this.visible = false;
        } else {
            this.x = Tween.linear(this.x_t, this.x_b, this.x_c, this.x_d);
            if (this.x >= this.maxX) {
                this.x_reverse = true;
            } else if (this.x <= 0) {
                this.x_reverse = false;
            }
            if (!this.x_reverse) {
                this.x_t += this.x_speed;

            } else {
                this.x_t -= this.x_speed;
            }
            this.draw();
        }
    }
    this.draw = function () {
        var imgObj = getRes('monsterImg');
        ctx.drawImage(imgObj, this.x, this.y, this.width, this.height);

    }
}

function loadres(cb) {
    if (res) {
        var count = res.length, curLoadCount = 0;
        function success(key, obj) {
            curLoadCount += 1;
            var item = res.find(function (findItem) { return findItem.key === key; });
            item.obj = obj;
            if (curLoadCount == count) {
                cb();
            }
        }
        res.forEach(function (eachItem) {
            switch (eachItem.type) {
                case 'img':
                    (function () {
                        var img = new Image();
                        img.onload = function () { success(eachItem.key, img); }
                        img.src = eachItem.src;
                    })();
                    break
            }
        });
    }
}


function random(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRes(key) {
    var item = res.find(function (findItem) { return findItem.key === key; });
    if (item)
        return item.obj;
    else
        return null;
}