const config = require("./botconfig.json");

var board;
var blank = "⚪";
var purple = "🟣";
var red = "🔴";

var player1;
var player2;
var headerString;
var footerString;
var currPlayer;
var aiColor = red;
var gameMessage;
var last_i;
var last_j;
var inGame = false;
let reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

function command_c4PlayerGame(message, botUser) {
	var p1;
	var p2;
	let value = Math.floor(Math.random() * 2);
	if (value === 0) {
		p1 = message.author;
		p2 = message.mentions.users.first();
	} else {
		p1 = message.mentions.users.first();
		p2 = message.author;
	}
	if (!p2) {
		p2 = botUser;
	} else if (!p1) {
		p1 = p2;
		p2 = botUser;
	}
	if (p1.id === p2.id) {
		message.channel.send('You can\'t play with yourself...');
		return;
	}
	player1 = p1;
	player2 = p2;
	newGame(message);
}

function newGame(message) {
	// if (inGame === true) {
	// 	return message.reply('A game is already going on...');
	// }
	headerString = "**Connect 4 game between " + player1.username + " and " + player2.username + "!**";
	resetBoard();
	currPlayer = player1;
	displayBoard(message);
}

function resetBoard() {
	board = []
	for (var i = 0; i < 6; i++) {
		var row = [blank, blank, blank, blank, blank, blank, blank];
		board.push(row);
	}
	last_i = -1;
	last_j = -1;
}

async function displayBoard(message) {
	var boardMessage = headerString + '\n';
	footerString = '``' + currPlayer.username + '\'s turn``';
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
			boardMessage += board[i][j];
		}
		boardMessage += '\n';
	}
	boardMessage += '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n' + footerString;
	await message.channel.send(boardMessage).then(gameMessage => {
		reactions.reduce((promise, emoji) => promise.then(() => gameMessage.react(emoji)), Promise.resolve());
		startListening(gameMessage, message);
	});
}

async function refreshBoard(gameMessage, isPlayer1) {
	var boardMessage = headerString + '\n';
	for (var i = 0; i < board.length; i++) {
		for (var j = 0; j < board[i].length; j++) {
			if (i === last_i && j === last_j) {
				if (!isPlayer1) {
					boardMessage += '<:darkRed:1068994561210318848>';
				} else {
					boardMessage += '<:darkPurple:1068994531766309086>';
				}
			} else {
				boardMessage += board[i][j];
			}
		}
		boardMessage += '\n';
	}
	boardMessage += '1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣\n' + footerString;
	gameMessage.edit(boardMessage);
}

async function startListening(gameMessage) {
	var validMove = false;
	const filter = (reaction, user) => {
		return user.id === currPlayer.id
	};
	gameMessage.awaitReactions({
			filter,
			max: 1,
			time: 100000,
			errors: ['time']
		})
		.then(collected => {
			const reaction = collected.first();
			if (reaction.emoji.name === '1️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('1', gameMessage);
			} else if (reaction.emoji.name === '2️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('2', gameMessage);
			} else if (reaction.emoji.name === '3️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('3', gameMessage);
			} else if (reaction.emoji.name === '4️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('4', gameMessage);
			} else if (reaction.emoji.name === '5️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('5', gameMessage);
			} else if (reaction.emoji.name === '6️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('6', gameMessage);
			} else if (reaction.emoji.name === '7️⃣') {
				gameMessage.reactions.resolve(reaction.emoji.name).users.remove(currPlayer.id);
				playMove('7', gameMessage);
			}
		})
		.catch(collected => {
			footerString = '``' + currPlayer.username + ' lost due to inactivity...``';
			if (currPlayer.id === player1.id) {
				refreshBoard(gameMessage, false);
			} else refreshBoard(gameMessage, true);
			resetBoard();
			gameMessage.reactions.removeAll();
			return;
		});
}

async function nextPlayer() {
	if (currPlayer === player1)
		currPlayer = player2;
	else
		currPlayer = player1;
}

async function playMove(number, gameMessage) {
	var column = parseInt(number);
	var isPlayer1;
	isPlayer1 = (currPlayer.id === player1.id);
	column--;
	var row = getAvailableRowInColumn(column);
	if (row == -1) {
		footerString = '``' + currPlayer.username + ', play a valid column..``';
		refreshBoard(gameMessage, !isPlayer1);
		startListening(gameMessage);
	} else {
		var color = getCurrentColor(currPlayer.id);

		board[row][column] = color;
		last_i = row;
		last_j = column;

		if (detectWin(color)) {
			footerString = '``' + currPlayer.username + ' is the winner!``';
			refreshBoard(gameMessage, isPlayer1);
			gameMessage.reactions.removeAll();
			resetBoard();
			return;
		}

		if (boardFull()) {
			footerString = '``It\'s a draw...``';
			refreshBoard(gameMessage, isPlayer1);
			gameMessage.reactions.removeAll();
			resetBoard();
			return;
		}

		nextPlayer();
		footerString = '``' + currPlayer.username + '\'s turn``';
		refreshBoard(gameMessage, isPlayer1);
		if (currPlayer.id === config.clientid) {
			playMoveAI(gameMessage);
		} else {
			startListening(gameMessage);
		}
	}
}

function getAvailableRowInColumn(column) {
	//If top row is full
	if (board[0][column] !== blank)
		return -1;

	for (var i = 1; i < 6; i++) {
		if (board[i][column] !== blank)
			return i - 1;
	}
	return 5;
}

function getCurrentColor(id) {
	if (player1.id === id)
		return purple;
	return red;
}

function detectWin(color) {
	for (var row = 0; row < board.length; row++) {
		for (var column = 0; column < board[row].length; column++) {
			if (board[row][column] === color) {
				if (detectWinAroundPiece(color, row, column)) {
					return true;
				}
			}
		}
	}
}

function detectWinAroundPiece(color, row, column) {
	if (row >= 3) {
		//Detect a win down a column
		if (board[row][column] === color && board[row - 1][column] === color && board[row - 2][column] === color && board[row - 3][column] === color)
			return true;
		//Detect a win down a diagonal
		if (column >= 3) {
			if (board[row][column] === color && board[row - 1][column - 1] === color && board[row - 2][column - 2] === color && board[row - 3][column - 3] == color)
				return true;
		}
		//Detect win down other diagonal
		if (column <= 3) {
			if (board[row][column] === color && board[row - 1][column + 1] === color && board[row - 2][column + 2] === color && board[row - 3][column + 3] == color)
				return true;
		}
	}
	//Detect a win along a row
	if (column >= 3) {
		if (board[row][column] === color && board[row][column - 1] === color && board[row][column - 2] === color && board[row][column - 3] === color)
			return true;
	}
}

function boardFull() {
	for (var i = 0; i < board[0].length; i++) {
		if (board[0][i] === blank)
			return false;
	}
	return true;
}

async function playMoveAI(gameMessage) {
	playRandomMove(aiColor);

	if (detectWin(aiColor)) {
		footerString = '``' + currPlayer.username + ' is the winner!``';
		refreshBoard(gameMessage, false);
		gameMessage.reactions.removeAll();
		resetBoard();
		return;
	}

	if (boardFull()) {
		footerString = '``It\'s a draw...``';
		refreshBoard(gameMessage, false);
		gameMessage.reactions.removeAll();
		resetBoard();
		return;
	}

	nextPlayer();
	footerString = '``' + currPlayer.username + '\'s turn``';
	refreshBoard(gameMessage, false);
	startListening(gameMessage);
}

async function playRandomMove(color) {
	var possibleMoves = getPossibleMoves();
	var winningMoves = getWinningMoves(possibleMoves, color);
	if (winningMoves.length > 0) {
		var column = winningMoves[getRandomInt(0, winningMoves.length - 1)];
		var row = getAvailableRowInColumn(column);
		board[row][column] = color;
		last_i = row;
		last_j = column;
		return;
	}

	var blockingMoves = getWinningMoves(possibleMoves, getInverseColor(color));
	if (blockingMoves.length > 0)
		possibleMoves = blockingMoves;

	var column = possibleMoves[getRandomInt(0, possibleMoves.length - 1)];
	var row = getAvailableRowInColumn(column);
	board[row][column] = color;
	last_i = row;
	last_j = column;
}

function getPossibleMoves() {
	var possibleMoves = [];
	for (var i = 0; i < 7; i++) {
		if (getAvailableRowInColumn(i) > -1)
			possibleMoves.push(i);
	}
	return possibleMoves;
}

function getInverseColor(color) {
	if (color === red)
		return purple;
	return red;
}

function getWinningMoves(possibleMoves, color) {
	var winningMoves = [];
	for (var i = 0; i < possibleMoves.length; i++) {
		var backupBoard = hardCopy2DArray(board);
		board[getAvailableRowInColumn(possibleMoves[i])][possibleMoves[i]] = color;
		if (detectWin(color)) {
			winningMoves.push(possibleMoves[i]);
		}
		board = hardCopy2DArray(backupBoard);
	}
	return winningMoves;
}

function hardCopy2DArray(sourceArray) {
	var newArray = [];
	for (var i = 0; i < sourceArray.length; i++) {
		var row = [];
		for (var j = 0; j < sourceArray[i].length; j++) {
			row.push(sourceArray[i][j]);
		}
		newArray.push(row);
	}
	return newArray;
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
	command_c4PlayerGame
}