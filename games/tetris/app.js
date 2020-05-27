// started with this:
// https://www.youtube.com/watch?v=rAUn1Lom6dw
/* document.addEventListener("DOMContentLoaded", () => {
	everythingElse();
}); */

// feature ideas from video:
// levels
// line count
// music
// style


// features missing:
// sliding before freezing
// cannot flip into a wrap


const grid = document.querySelector('.grid');
const width = 10;
const scoreDisplay = document.querySelector("#score");
const startButton = document.querySelector("#start");
let nextRandom = 0;
let timerId;
let score = 0;

let squares = Array.from(document.querySelectorAll('.grid div'));

const shapeClassNames = [
	"tetromino-l",
	"tetromino-z",
	"tetromino-t",
	"tetromino-o",
	"tetromino-i"
];

const lTetromino = [
	[1, width + 1, width*2+1, 2],
	[width, width+1, width+2, width*2+2],
	[1, width+1, width*2+1, width*2],
	[width, width*2, width*2+1, width*2+2],
];

const zTetromino = [
	[ width + 1, width + 2, width*2, width*2+1],
	[0, width, width + 1, width*2+1],
	[ width + 1, width + 2, width*2, width*2+1],
	[0, width, width + 1, width*2+1]
];
const tTetromino = [
	[1, width, width + 1, width + 2],
	[1, width + 1, width + 2, width*2+1],
	[ width, width + 1, width + 2, width*2+1],
	[ 1, width, width + 1, width*2+1]
];

const oTetromino = [
	[0, 1, width, width + 1],
	[0, 1, width, width + 1],
	[0, 1, width, width + 1],
	[0, 1, width, width + 1]
];

const iTetromino = [
	[1, width+1, width*2+1, width*3+1],
	[width, width+1, width + 2, width + 3],
	[1, width+1, width*2+1, width*3+1],
	[width, width+1, width + 2, width + 3]
];

const theTetrominoes = [ lTetromino, zTetromino, tTetromino, oTetromino, iTetromino ];

let currentPosition = 4;
let currentRotation = 0;

let tetOffset = Math.floor(Math.random()*theTetrominoes.length);
let current = theTetrominoes[tetOffset][currentRotation];


function draw() {
	current.forEach(index => {
		squares[currentPosition + index].classList.add("tetromino");
		squares[currentPosition + index].classList.add(shapeClassNames[tetOffset]);
	});
};

function undraw() {
	current.forEach(index => {
		squares[currentPosition + index].classList.remove("tetromino");
		squares[currentPosition + index].classList.remove(shapeClassNames[tetOffset]);
	});
};

// timerId = setInterval(moveDown, 1000);

function moveDown() {
	undraw();
	currentPosition += width;
	draw();
	freeze();
};

function freeze() {
	if (current.some(index => squares[currentPosition + index + width].classList.contains("taken"))) {
		current.forEach(index => squares[currentPosition + index].classList.add("taken"));
		tetOffset = nextRandom;
		nextRandom = Math.floor(Math.random()*theTetrominoes.length);
		current = theTetrominoes[tetOffset][currentRotation];
		currentPosition = 4;
		draw();
		displayShape();
		addScore();
		gameOver();
	}
};

function moveLeft() {
	undraw();
	const isAtLeftEdge = current.some(index => (currentPosition + index) % width === 0);
	if (isAtLeftEdge === false) {
		currentPosition -= 1;
	}

	if (current.some(index => squares[currentPosition + index].classList.contains("taken"))) {
		currentPosition += 1;
	}

	draw();
};

function moveRight() {
	undraw();
	const isAtRightEdge = current.some(index => (currentPosition + index) % width === width - 1);
	if (isAtRightEdge === false) {
		currentPosition += 1;
	}

	if (current.some(index => squares[currentPosition + index].classList.contains("taken"))) {
		currentPosition -= 1;
	}

	draw();
};

function rotate() {
	undraw();
	currentRotation += 1;
	if (currentRotation === current.length) { currentRotation = 0;}
	current = theTetrominoes[tetOffset][currentRotation];
	draw();
}

// keycode.info gives you keycodes
function control(e) {
	if (e.keyCode === 37) {
		moveLeft();
	}
	if (e.keyCode === 38) {
		rotate();
	}
	if (e.keyCode === 39) {
		moveRight();
	}
	if (e.keyCode === 40) {
		moveDown();
	}
};

document.addEventListener("keyup", control);

const displaySquares = document.querySelectorAll(".mini-grid div");
const displayWidth = 4;
const displayIndex = 0;

const upNextTetrominoes = [
	// doesn't work because width is different
	// theTetrominoes[0][0], theTetrominoes[1][0], theTetrominoes[2][0], theTetrominoes[3][0], theTetrominoes[4][0]
	[1, displayWidth + 1, displayWidth*2+1, 2],
	[ displayWidth + 1, displayWidth + 2, displayWidth*2, displayWidth*2+1],
	[1, displayWidth, displayWidth + 1, displayWidth + 2],
	[0, 1, displayWidth, displayWidth + 1],
	[1, displayWidth+1, displayWidth*2+1, displayWidth*3+1]
];

function displayShape() {
	// clear grid
	displaySquares.forEach(square => {
		square.classList.remove("tetromino");
		square.classList.remove(shapeClassNames[nextRandom]);
	});
	upNextTetrominoes[nextRandom].forEach(index => {
		displaySquares[displayIndex + index].classList.add("tetromino");
		displaySquares[displayIndex + index].classList.add(shapeClassNames[nextRandom]);
	});
};

startButton.addEventListener("click", () => {
	if (timerId) {
		clearInterval(timerId);
		timerId = null;
	} else {
		draw();
		timerId = setInterval(moveDown, 1000);
		nextRandom = Math.floor(Math.random()*theTetrominoes.length);
		displayShape();
	}
});

function addScore() {
	for(let i = 0; i < 199; i += width) {
		const row = [ i, i+1, i+2, i+3, i+4, i+5, i+6, i+7, i+8, i+9 ];
		if (row.every(index => { return squares[index].classList.contains("taken"); })) {
			score += 10;
			scoreDisplay.innerHTML = score;
			row.forEach(index => { squares[index].className = ''; });
			const squaresRemoved = squares.splice(i, width);
			squares = squaresRemoved.concat(squares);
			squares.forEach(cell => grid.appendChild(cell));
		}
	}
};

function gameOver() {
	if(current.some(index => squares[currentPosition + index].classList.contains("taken"))) {
		scoreDisplay.innerHTML = "end";
		clearInterval(timerId);
	}
}
