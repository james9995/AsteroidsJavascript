
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const canvas = document.querySelector('canvas');
const shipPoints = [-4, 0, -6, 4, 6, 0, -6, -4, -4, 0];
const asteroidPoints = [3, 1, 1, 2, 0, 3, -2, 3, -3, -1, -1, -3, 1, -3, 1, -2, 3, -2, 3, 1];
const alienPoints = [-7, 0, 7, 0, 3, 2, 2, 4, -2, 4, -3, 2, 3, 2, -3, 2, -7, 0, -3, -3, 3, -3, 7, 0];

var windowFocused = true;
var context = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.6;
canvas.height = canvas.width * 3 / 4;
var scale = canvas.width / GAME_WIDTH;
context.lineWidth = 1.5 * scale;

window.getAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) 
    {
        window.setTimeout(callback, 10);
    };

window.onfocus = function ()
{
    windowFocused = true;
    alienSound.volume = 0.2;
}

window.onblur = function ()
{
    windowFocused = false;
    thrusterSound.volume = 0;
    alienSound.volume = 0;
    var nextAlienTime = new Date();
    nextAlienTime.setSeconds(nextAlienTime.getSeconds() + 3 + Math.random() * 5);
}

window.onresize = function () {
    if (!canvas) return;
    canvas.width = window.innerWidth * 0.6;
    canvas.height = canvas.width * 3 / 4;
    scale = canvas.width / GAME_WIDTH;
    context.lineWidth = 1.5 * scale;
    if (screen == 0)
    {
        clearScreen();
        showStartScreen();
        if (lives == 0)
        {
            var scoreDisplay = new ScoreDisplay();
            scoreDisplay.draw;
        }
    }
};

var explosionSoundNumber = 0;
var gameObjects = [];
var gameVisuals = []; // Visual => non-interactive object
var gameObjectsToRemove = [];
var gameVisualsToRemove = [];
var bulletCount = 0;
var alienBulletCount = 0;
var score = 0;
var lastShotTime = 0;
var shipDestructionTime = 0;
var lastHyperspaceTime = 0;
var lastAsteroidDestructionTime = -3000;
var nextAlienTime = new Date();
nextAlienTime.setSeconds(nextAlienTime.getSeconds() + 50000);
var screen = 0;

const thrusterSound = document.getElementById("thruster");
var thrusterSoundPlayed = false;
const laserSound = document.getElementById("laser");
const warpSound = document.getElementById("warp");
warp.volume = 0.6;
const alienSound = document.getElementById("alien"); 
alienSound.volume = 0.2;
const bloopSound = document.getElementById("bloop");
const explosionSound0 = document.getElementById("explosion0");
explosionSound0.volume = 0.3;
const explosionSound1 = document.getElementById("explosion1");
explosionSound1.volume = 0.3;
const explosionSound2 = document.getElementById("explosion2");
explosionSound2.volume = 0.3;
const spaceshipExplosionSound = document.getElementById("spaceshipExplosion");

clearScreen();
var lives = 3;
var flameShape = 0;
var keyLeft = false;
var keyThrust = false;
var keyRight = false;
var keyShoot = false;
var keyHyperspace = false;
initialiseKeyboard();
gameVisuals.push(new ScoreDisplay());
createShip();
showStartScreen();

function showStartScreen()
{
    var length = 15;
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(GAME_WIDTH * scale / 4, GAME_HEIGHT * scale / 3, GAME_WIDTH * scale / 1.8, GAME_HEIGHT * scale / 3);
    drawWord(GAME_WIDTH / 2, 3 * GAME_HEIGHT / 7, ["P", "R", "E", "S", "S", " ", "S", "P", "A", "C", "E"], length);
    if (lives == 0)
    {
        drawWord(GAME_WIDTH / 2, 4 * GAME_HEIGHT / 7, ["T", "O", " ", "R", "E", "S", "T", "A", "R", "T"], length);
    }
    else
    {
        drawWord(GAME_WIDTH / 2, 4 * GAME_HEIGHT / 7, ["T", "O", " ", "S", "T", "A", "R", "T"], length);
    }
}

function playExplosionSound()
{
    switch (explosionSoundNumber)
    {
        case 0:
            {
                explosionSound0.currentTime = 0;
                explosionSound0.play();
                break;
            }
        case 1:
            {
                explosionSound1.currentTime = 0;
                explosionSound1.play();
                break;
            }
        case 2:
            {
                explosionSound2.currentTime = 0;
                explosionSound2.play();
                break;
            }
    }

    explosionSoundNumber = (explosionSoundNumber + 1) % 3;
}

function createShip()
{
    gameObjects.unshift(new Ship());
    keyShoot = false;
    keyHyperspace = false;
}

function Ship()
{
    this.xPosition = GAME_WIDTH / 2;
    this.yPosition = GAME_HEIGHT / 2;
    this.velocityX = 0;
    this.velocityY = 0;
    this.angle = 0;
    this.type = "ship";
    this.collisionRadius = 5;

    this.update = function ()
    {
        this.xPosition += this.velocityX;
        this.yPosition += this.velocityY;

        if (keyThrust)
        {
            thrusterSound.volume = Math.min(0.9, thrusterSound.volume + 0.05);
            this.velocityX += 0.08 * Math.cos(this.angle);
            this.velocityY += 0.08 * Math.sin(this.angle);
        }
        else
        {
            this.velocityX = reduceVelocity(this.velocityX);
            this.velocityY = reduceVelocity(this.velocityY);
        }

        if (this.xPosition > GAME_WIDTH)
        {
            this.xPosition = 0;
        }
        else if (this.xPosition < 0)
        {
            this.xPosition = GAME_WIDTH;
        }

        if (this.yPosition > GAME_HEIGHT)
        {
            this.yPosition = 0;
        }
        else if (this.yPosition < 0)
        {
            this.yPosition = GAME_HEIGHT;
        }

        if (keyLeft)
        {
            if (!keyRight)
            {
                this.angle -= Math.PI / 30;
            }
        }
        else
        {
            if (keyRight)
            {
                this.angle += Math.PI / 30;
            }
        }

        if (keyShoot)
        {
            keyShoot = false;
            gameObjects.push(new Bullet(this.xPosition, this.yPosition, this.velocityX + 6 * Math.cos(this.angle), this.velocityY + 6 * Math.sin(this.angle)));
            laserSound.currentTime = 0;
            laserSound.play();
        }

        if (keyHyperspace)
        {
            keyHyperspace = false;
            warpSound.currentTime = 0;
            warpSound.play();
            locationFound = false;
            while (locationFound == false)
            {
                var newX = Math.random() * GAME_WIDTH;
                var newY = Math.random() * GAME_HEIGHT;
                var collision = checkCollision(newX, newY, this.collisionRadius * 2, "bullet");
                if (collision == null)
                {
                    this.xPosition = newX;
                    this.yPosition = newY;
                    locationFound = true;
                }
            }
        }

        destroy = false;

        var collidedWith = checkCollision(this.xPosition, this.yPosition, this.collisionRadius, this.type);

        if (collidedWith == "asteroid" || collidedWith == "alien" || collidedWith == "alienBullet" )
        {
            destroy = true;
            thrusterSound.volume = 0;
            spaceshipExplosionSound.currentTime = 0;
            spaceshipExplosionSound.play();
            shipDestructionTime = new Date();
            lives--;
            for (var ix = 0; ix < 5; ix++)
            {
                gameVisuals.push(new ShipPart(ix, this.xPosition, this.yPosition, this.angle));
            }
        }

        return destroy;
    }
	
    this.draw = function ()
    {
        drawShip(this.xPosition, this.yPosition, this.angle, keyThrust);

        var drawCopy = false;
        var copyX = this.xPosition;
        var copyY = this.yPosition;

        if (this.xPosition / GAME_WIDTH > 0.9)
        {
            copyX -= GAME_WIDTH;
            drawCopy = true;
        }
        else if (this.xPosition / GAME_WIDTH < 0.1)
        {
            copyX += GAME_WIDTH;
            drawCopy = true;
        }

        if (this.yPosition / GAME_HEIGHT > 0.9)
        {
            copyY -= GAME_HEIGHT;
            drawCopy = true;
        }
        else if (this.yPosition / GAME_HEIGHT < 0.1)
        {
            copyY += GAME_HEIGHT;
            drawCopy = true;
        }

        if (drawCopy)
        {
            drawShip(copyX, copyY, this.angle, keyThrust);
        }

        flameShape = (flameShape + 1) % 10;
    }

    function reduceVelocity(Velocity)
    {
        if (Math.abs(Velocity) > 0.1)
        {
            Velocity *= 0.98;
        }
        else
        {
            Velocity = 0;
        }

        return Velocity;
    }
}

function drawShip(X, Y, Angle, Flame)
{
    context.strokeStyle = "white";
    context.beginPath();
    moveTo(shipPoints[0], shipPoints[1], X, Y, Angle);
    lineTo(shipPoints[2], shipPoints[3], X, Y, Angle);
    lineTo(shipPoints[4], shipPoints[5], X, Y, Angle);
    lineTo(shipPoints[6], shipPoints[7], X, Y, Angle);
    lineTo(shipPoints[0], shipPoints[1], X, Y, Angle);
    context.stroke();

    if (Flame)
    {
        if (flameShape > 4)
        {
            context.beginPath();
            moveTo(-4, -1, X, Y, Angle);
            lineTo(-7, -1, X, Y, Angle);
            lineTo(-5, 0, X, Y, Angle);
            lineTo(-7, 1, X, Y, Angle);
            lineTo(-4, 1, X, Y, Angle);
            context.stroke();
        }
        else
        {
            context.beginPath();
            moveTo(-5, -2, X, Y, Angle);
            lineTo(-8, -2, X, Y, Angle);
            lineTo(-6, 0, X, Y, Angle);
            lineTo(-8, 2, X, Y, Angle);
            lineTo(-5, 2, X, Y, Angle);
            context.stroke();
        }
    }
}

function ScoreDisplay()
{
    this.xPosition = GAME_WIDTH / 80;
    this.yPosition = GAME_HEIGHT / 40;
    this.lineLength = 6;
    this.type = "score";

    this.update = function ()
    {
        return false;
    }

    this.draw = function ()
    {
        var digitsToShow = 8;
        for (var ix = 0; ix < digitsToShow; ix++)
        {
            if (score >= Math.pow(10, digitsToShow - ix - 1) || ix == digitsToShow -1)
            {
                var tempScore = score % Math.pow(10, digitsToShow - ix);
                tempScore = Math.floor(tempScore / Math.pow(10, digitsToShow - ix - 1));
                drawAlphanumeric(this.xPosition + ((this.lineLength * 2 + 2) * ix), this.yPosition, tempScore, this.lineLength);
            }
        }

        for (var ix = 0; ix < lives; ix++)
        {
            drawShip(this.xPosition + ((this.lineLength * 2 + 2) * (digitsToShow - ix - 0.75)), this.yPosition + this.lineLength * 5, 3 * Math.PI / 2, false);
        }
    }
}

function drawWord(X, Y, WordArray, Length)
{
    var spacing = Length * 2.4;
    var startX = X - (WordArray.length * spacing / 2) + Length / 2;
    for (var ix = 0; ix < WordArray.length; ix++)
    {
        drawAlphanumeric(startX + spacing * ix, Y - Length, WordArray[ix], Length);
    }
}

function drawAlphanumeric(X, Y, Digit, Length)
{
    context.strokeStyle = "white";
    context.beginPath();
    switch (Digit)
    {
        case 0:
        case "O":
            {
                moveTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                break;
            }
        case 1:
            {
                moveTo(Length / 2, 0, X, Y, 0);
                lineTo(Length / 2, Length * 2, X, Y, 0);
                break;
            }
        case 2:
            {
                moveTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                break;
            }
        case 3:
            {
                moveTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                context.stroke();

                context.beginPath();
                moveTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                break;
            }
        case 4:
            {
                moveTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                context.stroke();

                context.beginPath();
                moveTo(0, 0, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                break;
            }
        case 5:
        case "S":
            {
                moveTo(Length, 0, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                break;
            }
        case 6:
            {
                moveTo(Length, 0, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                break;
            }
        case 7:
            {
                moveTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                break;
            }
        case 8:
            {
                moveTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                context.stroke();

                context.beginPath();
                moveTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                break;
            }
        case 9:
            {
                moveTo(Length, Length, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                break;
            }
        case "P":
            {
                moveTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                break;
            }
        case "R":
            {
                moveTo(0, Length * 2, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                lineTo(0, Length, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                break;
            }
        case "E":
            {
                moveTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                context.stroke();

                context.beginPath();
                moveTo(Length, 0, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                break;
            }
        case "A":
            {
                moveTo(0, Length, X, Y, 0);
                lineTo(Length, Length, X, Y, 0);
                context.stroke();

                context.beginPath();
                moveTo(0, Length * 2, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                break;
            }
        case "C":
            {
                moveTo(Length, 0, X, Y, 0);
                lineTo(0, 0, X, Y, 0);
                lineTo(0, Length * 2, X, Y, 0);
                lineTo(Length, Length * 2, X, Y, 0);
                break;
            }
        case "T":
            {
                moveTo(0, 0, X, Y, 0);
                lineTo(Length, 0, X, Y, 0);
                context.stroke();

                context.beginPath();
                moveTo(Length / 2, 0, X, Y, 0);
                lineTo(Length / 2, Length * 2, X, Y, 0);
                break;
            }
    }

    context.stroke();
}

function moveTo(PointX, PointY, CenterX, CenterY, Angle)
{
    var rotatedX = Math.cos(Angle) * PointX - Math.sin(Angle) * PointY + CenterX;
    var rotatedY = Math.sin(Angle) * PointX + Math.cos(Angle) * PointY + CenterY;
    context.moveTo(rotatedX * scale, rotatedY * scale);
}

function lineTo(PointX, PointY, CenterX, CenterY, Angle)
{
    var rotatedX = Math.cos(Angle) * PointX - Math.sin(Angle) * PointY + CenterX;
    var rotatedY = Math.sin(Angle) * PointX + Math.cos(Angle) * PointY + CenterY;
    context.lineTo(rotatedX * scale, rotatedY * scale);
}

function createAsteroids(Number)
{
    for (var ix = 0; ix < Number; ix++)
    {
        var positionFound = false;
        var xPosition;
        var yPosition;
        while (positionFound == false)
        {
            xPosition = Math.random() * GAME_WIDTH;
            yPosition = Math.random() * GAME_HEIGHT;
            var distance = Math.sqrt(Math.pow(xPosition - gameObjects[0].xPosition, 2) + Math.pow(yPosition - gameObjects[0].yPosition, 2));
            if (distance > 100)
            {
                positionFound = true;
            }
        }

        var angle = Math.random() * 2 * Math.PI;
        var velocity = 1 + Math.random() * 2;
        gameObjects.push(new Asteroid(xPosition, yPosition, velocity * Math.cos(angle), velocity * Math.sin(angle), 9));
    }
}

function Bullet(PositionX, PositionY, VelocityX, VelocityY)
{
    this.xPosition = PositionX;
    this.yPosition = PositionY;
    this.xVelocity = VelocityX;
    this.yVelocity = VelocityY;
    this.collisionRadius = 1.5;
    this.type = "bullet";
    this.creationTime = new Date();
    bulletCount++;

    this.update = function ()
    {
        var destroy = false;
        var collidedWith = checkCollision(this.xPosition, this.yPosition, this.collisionRadius, this.type);
        var lifeSpan = new Date - this.creationTime;
        if (lifeSpan > 2000 || ((bulletCount > 4 || collidedWith != null) && lifeSpan > 50))
        {
            destroy = true;
            bulletCount--;
        }

        this.xPosition += this.xVelocity;
        this.yPosition += this.yVelocity;

        if (this.xPosition > GAME_WIDTH)
        {
            this.xPosition = 0;
        }
        else if (this.xPosition < 0)
        {
            this.xPosition = GAME_WIDTH;
        }

        if (this.yPosition > GAME_HEIGHT)
        {
            this.yPosition = 0;
        }
        else if (this.yPosition < 0)
        {
            this.yPosition = GAME_HEIGHT;
        }

        return destroy;
    }

    this.draw = function ()
    {
        context.fillStyle = "white";
        context.beginPath();
        context.moveTo(this.xPosition * scale, this.yPosition * scale)
        context.arc(this.xPosition * scale, this.yPosition * scale, context.lineWidth, 0, 2 * Math.PI);
        context.fill();
    }  
}

function AlienBullet(PositionX, PositionY, VelocityX, VelocityY)
{
    this.xPosition = PositionX;
    this.yPosition = PositionY;
    this.xVelocity = VelocityX;
    this.yVelocity = VelocityY;
    this.angle = Math.atan2(VelocityY, VelocityX);
    this.collisionRadius = 1.5;
    this.type = "alienBullet";
    this.creationTime = new Date();
    alienBulletCount++;

    this.update = function ()
    {
        var destroy = false;
        var collidedWith = checkCollision(this.xPosition, this.yPosition, this.collisionRadius, this.type);
        var lifeSpan = new Date - this.creationTime;
        if (lifeSpan > 2000 || (collidedWith != null && collidedWith != "alien"))
        {
            destroy = true;
            alienBulletCount--;
        }

        this.xPosition += this.xVelocity;
        this.yPosition += this.yVelocity;

        if (this.xPosition > GAME_WIDTH)
        {
            this.xPosition = 0;
        }
        else if (this.xPosition < 0)
        {
            this.xPosition = GAME_WIDTH;
        }

        if (this.yPosition > GAME_HEIGHT)
        {
            this.yPosition = 0;
        }
        else if (this.yPosition < 0)
        {
            this.yPosition = GAME_HEIGHT;
        }

        return destroy;
    }

    this.draw = function ()
    {
        context.fillStyle = "white";
        context.beginPath();
        moveTo(2, 0, this.xPosition, this.yPosition, this.angle);
        lineTo(0, 1, this.xPosition, this.yPosition, this.angle);
        lineTo(-2, 1, this.xPosition, this.yPosition, this.angle);
        lineTo(-2, -1, this.xPosition, this.yPosition, this.angle);
        lineTo(0, -1, this.xPosition, this.yPosition, this.angle);
        lineTo(2, 0, this.xPosition, this.yPosition, this.angle);
        context.stroke();
    }
}

function Asteroid(PositionX, PositionY, VelocityX, VelocityY, Size)
{
    this.xPosition = PositionX;
    this.yPosition = PositionY;
    this.xVelocity = VelocityX;
    this.yVelocity = VelocityY;
    this.size = Size;
    this.collisionRadius = Size * 3;
    this.type = "asteroid";
    this.angle = Math.random() * Math.PI * 2;
    this.creationTime = new Date();

    this.update = function ()
    {
        this.xPosition += this.xVelocity;
        this.yPosition += this.yVelocity;

        if (this.xPosition > GAME_WIDTH)
        {
            this.xPosition = 0;
        }
        else if (this.xPosition < 0)
        {
            this.xPosition = GAME_WIDTH;
        }

        if (this.yPosition > GAME_HEIGHT)
        {
            this.yPosition = 0;
        }
        else if (this.yPosition < 0)
        {
            this.yPosition = GAME_HEIGHT;
        }

        var destroy = false;
        var collision = checkCollision(this.xPosition, this.yPosition, this.collisionRadius, this.type);
        var lifeSpan = new Date - this.creationTime;
        if (collision == "bullet" && lifeSpan > 100)
        {
            destroy = true;
            lastAsteroidDestructionTime = new Date();
            Explosion(this.xPosition, this.yPosition);
            switch (this.size)
            {
                case 3:
                    score += 100;
                    break;

                case 6:
                    score += 50;
                    break;

                case 9:
                    score += 20;
                    break;
            }

            if (this.size > 3)
            {
                var angle = Math.atan2(this.yPosition - gameObjects[0].yPosition, this.xPosition - gameObjects[0].xPosition) + Math.PI / 2;
                angle += Math.random() - 0.5;
                var velocity = Math.random() + 2 + (9 - this.size) / 6
                gameObjects.push(new Asteroid(this.xPosition, this.yPosition, velocity * Math.cos(angle), velocity * Math.sin(angle), this.size - 3));
                angle += Math.random() - 0.5 + Math.PI;
                gameObjects.push(new Asteroid(this.xPosition, this.yPosition, velocity * Math.cos(angle), velocity * Math.sin(angle), this.size - 3));
            }
        }

        return destroy;
    }

    this.draw = function ()
    {
        drawAsteroid(this.xPosition, this.yPosition, this.angle, this.size);

        var copyX = this.xPosition;
        var copyY = this.yPosition;

        if (this.xPosition / GAME_WIDTH > 0.8)
        {
            copyX -= GAME_WIDTH;
            drawAsteroid(copyX, this.yPosition, this.angle, this.size);
        }
        else if (this.xPosition / GAME_WIDTH < 0.2)
        {
            copyX += GAME_WIDTH;
            drawAsteroid(copyX, this.yPosition, this.angle, this.size);
        }

        if (this.yPosition / GAME_HEIGHT > 0.8)
        {
            copyY -= GAME_HEIGHT;
            drawAsteroid(this.xPosition, copyY, this.angle, this.size);

        }
        else if (this.yPosition / GAME_HEIGHT < 0.2)
        {
            copyY += GAME_HEIGHT;
            drawAsteroid(this.xPosition, copyY, this.angle, this.size);
        }

        if (copyX != this.xPosition && copyY != this.yPosition)
        {
            drawAsteroid(copyX, copyY, this.angle, this.size);
        }
    }

    function drawAsteroid(X, Y, Angle, Size)
    {
        context.strokeStyle = "white";
        context.beginPath();
        moveTo(asteroidPoints[0] * Size, asteroidPoints[1] * Size, X, Y, Angle);
        for (var ix = 1; ix < asteroidPoints.length / 2; ix++)
        {
            lineTo(asteroidPoints[ix * 2] * Size, asteroidPoints[ix * 2 + 1] * Size, X, Y, Angle);
        }

        context.stroke();
    }
}

function Alien(Size)
{
    this.xPosition = GAME_WIDTH - 1;
    this.xVelocity = -3;
    this.yVelocity = 0;
    alienBulletCount = 0;
    this.creationTime = new Date();
    console.log("New alien size " + Size);

    if (Math.random() > 0.5)
    {
        this.xPosition = 1;
        this.xVelocity = 3;
    }

    var yPositionFound = false
    while (!yPositionFound)
    {
        this.yPosition = (Math.random() * 0.8 + 0.1) * GAME_HEIGHT;
        if (checkCollision(this.xPosition, this.yPosition, Size * 8, "asteroid") == null)
        {
            yPositionFound = true;
        }
    }
        
    this.size = Size;
    this.type = "alien";
    this.collisionRadius = Size * 6;
    alienSound.currentTime = 0;
    alienSound.play();

    this.update = function ()
    {
        this.xPosition += this.xVelocity;
        this.yPosition += this.yVelocity;
        var destroy = false;

        if (this.yPosition < 0.1 * GAME_HEIGHT || this.yPosition > 0.9 * GAME_HEIGHT)
        {
            this.yVelocity = 0;
            this.xVelocity = (this.xVelocity / Math.abs(this.xVelocity)) * 3;
        }

        if (Math.random() > 0.99)
        {
            if (this.yVelocity != 0)
            {
                this.yVelocity = 0;
                this.xVelocity = (this.xVelocity / Math.abs(this.xVelocity)) * 3;
            }
            else
            {
                if (this.yPosition > GAME_HEIGHT / 2)
                {
                    this.yVelocity = 1 + Math.random() * 1;
                    this.xVelocity = (this.xVelocity / Math.abs(this.xVelocity)) * Math.sqrt(9 - Math.pow(this.yVelocity, 2));
                }
                else
                {
                    this.yVelocity = -(1 + Math.random() * 1);
                    this.xVelocity = (this.xVelocity / Math.abs(this.xVelocity)) * Math.sqrt(9 - Math.pow(this.yVelocity, 2));
                }
            }
        }

        if (this.xPosition > GAME_WIDTH + this.size * 6 ||
            this.xPosition < 0 - this.size * 6 ||
            gameObjects[0].type != "ship")
        {
            destroy = true;
        }

        var collision = checkCollision(this.xPosition, this.yPosition, this.collisionRadius, this.type);
        if (collision == "bullet")
        {
            destroy = true;
            Explosion(this.xPosition, this.yPosition);
            switch (this.size)
            {
                case 3:
                    score += 200;
                    break;

                case 1.5:
                    score += 1000;
                    break;
            }
        }

        if (destroy)
        {
            alienSound.pause();
            nextAlienTime = new Date();
            nextAlienTime.setSeconds(nextAlienTime.getSeconds() + 3 + Math.random() * 5);
        }
        else
        {
            var lifeSpan = new Date - this.creationTime;
            if (alienBulletCount == 0 && lifeSpan > 350)
            {
                var angle = Math.random() * 2 * Math.PI;
                var velocity = 4;
                if (this.size == 1.5)
                {
                    angle = Math.atan2(gameObjects[0].yPosition - this.yPosition, gameObjects[0].xPosition - this.xPosition);
                }

                gameObjects.push(new AlienBullet(this.xPosition, this.yPosition, velocity * Math.cos(angle), velocity * Math.sin(angle)));
            }
        }

        return destroy;
    }

    this.draw = function ()
    {
        context.strokeStyle = "white";
        context.beginPath();
        moveTo(alienPoints[0] * this.size, alienPoints[1] * this.size, this.xPosition, this.yPosition, Math.PI);
        for (var ix = 1; ix < alienPoints.length / 2; ix++)
        {
            lineTo(alienPoints[ix * 2] * Size, alienPoints[ix * 2 + 1] * this.size, this.xPosition, this.yPosition, Math.PI);
        }

        context.stroke();
    }
}

function ShipPart(PartNumber, CenterX, CenterY, Angle)
{
    var startIndex = PartNumber * 2;
    this.x1 = shipPoints[startIndex];
    this.x2 = shipPoints[startIndex + 2];
    this.y1 = shipPoints[startIndex + 1];
    this.y2 = shipPoints[startIndex + 3];
    this.xCenter = CenterX;
    this.yCenter = CenterY;
    this.angle = Angle;
    this.explosionAngle = Math.atan2((this.y2 + this.y1) / 2, (this.x2 + this.x1) / 2);
    this.velocity = 1.5;
    this.angularVelocity = (Math.random() - 0.5) * Math.PI/40;
    this.type = "shipPart";

    this.update = function ()
    {
        var dX = this.velocity * Math.cos(this.explosionAngle);
        var dY = this.velocity * Math.sin(this.explosionAngle);
        this.x1 += dX;
        this.x2 += dX;
        this.y1 += dY;
        this.y2 += dY;
        this.velocity *= 0.95;
        this.angularVelocity *= 0.95;
        this.angle += this.angularVelocity;
        
        var destroy = false;
        if (this.velocity < 0.05)
        {
            destroy = true;
        }

        return destroy;
    }

    this.draw = function ()
    {
        context.strokeStyle = "white";
        context.beginPath();
        moveTo(this.x1, this.y1, this.xCenter, this.yCenter, this.angle);
        lineTo(this.x2, this.y2, this.xCenter, this.yCenter, this.angle);
        context.stroke();
    }
}

function Explosion(CenterX, CenterY)
{
    playExplosionSound();
    for (var ix = 0; ix < 30; ix++)
    {
        gameVisuals.push(new Particle(CenterX, CenterY));
    }
}

function Particle(CenterX, CenterY)
{
    this.xCenter = CenterX;
    this.yCenter = CenterY;
    var angle = 2 * Math.PI * Math.random();
    var velocity = 0.3 + Math.random()*0.7;
    this.xVelocity = velocity * Math.cos(angle);
    this.yVelocity = velocity * Math.sin(angle);
    this.type = "particle";
    this.life = 1;

    this.update = function ()
    {
        this.xCenter += this.xVelocity;
        this.yCenter += this.yVelocity;
        this.xvelocity *= 0.95;
        this.yvelocity *= 0.95;
        this.life *= 0.95;

        var destroy = false;
        if (this.life < 0.2)
        {
            destroy = true;
        }

        return destroy;
    }

    this.draw = function ()
    {
        context.fillStyle = "white";
        context.fillRect(this.xCenter * scale, this.yCenter * scale, 1 * scale, 1 * scale)
    }
}

function checkCollision(PositionX, PositionY, Radius, Type)
{
    var collidedWith = null;
    for (var ix = 0; ix < gameObjects.length; ix++)
    {
        if (gameObjects[ix].type != Type)
        {
            var distance = Math.sqrt(Math.pow(gameObjects[ix].xPosition - PositionX, 2) + Math.pow(gameObjects[ix].yPosition - PositionY, 2));
            if (distance < (gameObjects[ix].collisionRadius + Radius))
            {
                collidedWith = gameObjects[ix].type;
                console.log(Type + " collided with " + collidedWith);
                break;
            }
        }
    }

    return collidedWith;
}

function gameLoop()
{
    if (lives > 0 && windowFocused)
    {
        gameObjectsToRemove = [];
        gameVisualsToRemove = [];
        var asteroidCount = 0;
        var alienCount = 0;
        var oldScore = score;

        for (var ix = 0; ix < gameObjects.length; ix++)
        {
            if (gameObjects[ix].update())
            {
                gameObjectsToRemove.push(ix);
            }
            else if (gameObjects[ix].type == "asteroid")
            {
                asteroidCount++;
            }
            else if (gameObjects[ix].type == "alien")
            {
                alienCount++;
            }
        }

        for (var ix = 0; ix < gameVisuals.length; ix++)
        {
            if (gameVisuals[ix].update())
            {
                gameVisualsToRemove.push(ix);
            }
        }

        for (var ix = gameObjectsToRemove.length - 1; ix >= 0; ix--)
        {
            gameObjects.splice(gameObjectsToRemove[ix], 1);
        }

        for (var ix = gameVisualsToRemove.length - 1; ix >= 0; ix--)
        {
            gameVisuals.splice(gameVisualsToRemove[ix], 1);
        }

        if (asteroidCount == 0 && (new Date() - lastAsteroidDestructionTime) > 1000 && gameObjects.length > 0)
        {
            removeBullets();
            createAsteroids(Math.min(Math.floor(4 + score / 5000), 8));
        }

        clearScreen();

        if (Math.floor(oldScore / 10000) < Math.floor(score / 10000))
        {
            lives++;
            bloopSound.currentTime = 0;
            bloopSound.play();
        }

        for (var ix = 0; ix < gameObjects.length; ix++)
        {
            gameObjects[ix].draw();
        }

        for (var ix = 0; ix < gameVisuals.length; ix++)
        {
            gameVisuals[ix].draw();
        }

        if (!keyThrust)
        {
            thrusterSound.volume *= 0.9;
        }

        var timeSinceDestruction = new Date() - shipDestructionTime;
        if ((gameObjects.length == 0 || gameObjects[0].type != "ship") && timeSinceDestruction > 2000)
        {
            var collison = checkCollision(GAME_WIDTH / 2, GAME_HEIGHT / 2, Math.max(100 - (timeSinceDestruction - 2000) / 20, 20), "bullet");
            if (collison == null)
            {
                createShip();
            }
        }

        if (new Date() > nextAlienTime && alienCount == 0)
        {
            if (score > 10000)
            {
                gameObjects.push(new Alien(1.5));
            }
            else
            {
                gameObjects.push(new Alien(3));
            }
        }
    }
    else if (lives < 1)
    {
        screen = 0;
        alienSound.pause();
        showStartScreen();
    }

    if (screen != 0)
    {
        window.getAnimationFrame(gameLoop);
    }
}

function resetGame()
{
    lives = 3;
    score = 0;
    gameObjects = [];
    gameVisuals = [];
    lastAsteroidDestructionTime = -3000;
    nextAlienTime = new Date();
    nextAlienTime.setSeconds(nextAlienTime.getSeconds() + 5 + Math.random() * 3);
    gameVisuals.push(new ScoreDisplay());
}

function removeBullets()
{
    bulletCount = 0;
    gameObjectsToRemove = [];
    for (var ix = 0; ix < gameObjects.length; ix++)
    {
        if (gameObjects[ix].type == "bullet")
        {
            gameObjectsToRemove.push(ix);
        }
    }

    for (var ix = gameObjectsToRemove.length - 1; ix >= 0; ix--)
    {
        gameObjects.splice(gameObjectsToRemove[ix], 1);
    }
}

function clearScreen()
{
    context.clearRect(0, 0, GAME_WIDTH * scale, GAME_HEIGHT * scale);
    context.fillStyle = 'black';
    context.fillRect(0, 0, GAME_WIDTH * scale, GAME_HEIGHT * scale);
}

function initialiseKeyboard()
{
    window.onkeydown = function (e)
    {
        var timeNow = new Date();
        switch (e.keyCode)
        {
            case 37:
                e.preventDefault();
                keyLeft = true;
                break;

            case 38:
                e.preventDefault();
                if (!thrusterSoundPlayed)
                {
                    thrusterSound.volume = 0;
                    thrusterSoundPlayed = true;
                    thrusterSound.play();
                }

                keyThrust = true;
                break;

            case 39:
                e.preventDefault();
                keyRight = true;
                break;

            case 32:
                e.preventDefault();
                if (screen == 0)
                {
                    screen++;
                    resetGame();
                    gameLoop();
                }
                else
                {
                    if (timeNow - lastShotTime > 40)
                    {
                        keyShoot = true;
                    }

                    lastShotTime = timeNow;
                }
                
                break;

            case 40:
                e.preventDefault();
                if (timeNow - lastHyperspaceTime > 500)
                {
                    lastHyperspaceTime = timeNow;
                    keyHyperspace = true;
                }

                break;
        }
    }

    window.onkeyup = function (e)
    {
        switch (e.keyCode)
        {
            case 37:
                keyLeft = false;
                break;

            case 38:
                keyThrust = false;
                break;

            case 39:
                keyRight = false;
                break;
            case 13:
                keyEnter = false;
                break;
        }
    }
}