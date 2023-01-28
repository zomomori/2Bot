const Discord = require("discord.js");
const config = require("./botconfig.json");
const {
	getUnoDeck
} = require("./unoDeck");

const {
	MessageActionRow,
	MessageButton
} = require('discord.js');
let reactions = ['✅', '<a:20timer:1066117966132953108>'];
let game_timer = ['<a:20timer:1066117966132953108>'];


var inGame = false;
var isWaiting = false;
var waitingTimeout;
var player_list = [];
var iter;
var turn;
var current_deck;
var used_cards = [];
var game_channel;
var turnMessage;
var current_dm;
var top_effect = true;
var top_card;
var isSkipShowing = false;
var isReverse = false;
var drawnMessage = null;
var plus4played = false;
var isUNO = false;
var unoDM;
var unoPlayer;
var gameMessageGlobal;

async function waitingComplete() {
	const reaction = gameMessageGlobal.reactions.cache.get(reactions[0]);
			reactList = await reaction.users.fetch();
			reactList.delete(config.clientid);
			reactList = Array.from(reactList.entries());
			gameMessageGlobal.reactions.removeAll();
			if (reactList.length === 0) {
			inGame = false;
				return gameMessageGlobal.edit('No one joined... don\'t waste my time.');
			}
			else if (reactList.length === 1) {
				inGame = false;
				return gameMessageGlobal.edit('You can\'t play by yourself baka...');
			}
			gameMessageGlobal.edit('Players joined: ' + reactList.length + ', starting... ');
			setTimeout(async function() {
				gameMessageGlobal.delete();
			}, 2000);
			populate_players(reactList);
			start_game();
}

function getRandomCard() {
	if (current_deck.length === 0) {
		for (let i = 0; i < used_cards.length; ++i) {
			current_deck.push(used_cards[i]);
		}
		used_cards = [];
	}
	const randomIndex = Math.floor(Math.random() * current_deck.length);
	const randomElement = current_deck[randomIndex];
	current_deck.splice(randomIndex, 1); // remove card from deck
	return randomElement;
}

async function uno_forceStart(message) {
	if (isWaiting) {
		isWaiting = false;
		waitingComplete();
		clearTimeout(waitingTimeout);
	} else {
		return message.reply('No UNO game in play...');
	}
}

async function uno_start(message) {
	if (inGame) {
		return message.reply('A game of UNO is already going on...');
	} else {
		inGame = true;
	}
	game_channel = message.channel;
	current_deck = getUnoDeck();
	reactList = [];
	await game_channel.send('UNO game about to start.. react to join, or not idc.').then(gameMessage => {
		gameMessageGlobal = gameMessage;
		const filter = (reaction, user) => {
			return user.id === config.adminid
		};
		reactions.reduce((promise, emoji) => promise.then(() => gameMessageGlobal.react(emoji)), Promise.resolve());
		isWaiting = true;
		waitingTimeout = setTimeout(async function() {
			waitingComplete();
		}, 20550);
	});
}

async function populate_players(reactList) {
	iter = 0;
	while (iter != reactList.length) {
		const curplayer = new UNOplayer(reactList[iter][1]);
		player_list.push(curplayer);
		++iter;
	}
}

async function start_game() {
	iter = 0;
	turn = 0;
	top_card = getRandomCard();
	while (top_card[0] === '⚫') {
		current_deck.push(top_card);
		top_card = getRandomCard();
	}
	used_cards.push(top_card);
	nextTurn();
}

async function nextTurn() {
	++turn;
	if (!isReverse) {
		iter = Math.abs((iter + 1) % player_list.length);
	} else {
		iter = Math.abs((iter - 1 + player_list.length) % player_list.length);
	}
	var curplayer = player_list[iter];
	if (top_card[1] === '+2' && top_effect) {
		curplayer.cards.push(getRandomCard());
		curplayer.cards.push(getRandomCard());
		curplayer.cards = card_sort(curplayer.cards);
		await game_channel.send('**' + curplayer.user.username + '** was forced to draw 2 cards...');
		top_effect = false;
		nextTurn();
	} else if (top_card[1] === 'any' && top_effect && plus4played) {
		curplayer.cards.push(getRandomCard());
		curplayer.cards.push(getRandomCard());
		curplayer.cards.push(getRandomCard());
		curplayer.cards.push(getRandomCard());
		curplayer.cards = card_sort(curplayer.cards);
		await game_channel.send('**' + curplayer.user.username + '** was forced to draw 4 cards...');
		top_effect = false;
		plus4played = false;
		nextTurn();
	} else if (top_card[1] === '🚫' && top_effect) {
		await game_channel.send('**' + curplayer.user.username + '**\'s turn was skipped...');
		top_effect = false;
		nextTurn();
	} else {
		let top = '``' + top_card[0] + ' ' + top_card[1] + '``';
		turnMessage = await game_channel.send('Top card: ' + top + ', **' + curplayer.user.username + '**\'s turn... cards: ' + getAllPlayer());
		if (player_list.length === 1) {
		++turn;
			inGame = false;
		return await turnMessage.edit('**' + curplayer.user.username + '** is the ✨ winner ✨');
		}
		show_hand(curplayer, turn, false, false);
	}
}

async function show_hand(player, playTurn, showSkip, isWrongInput) {
	var rows = [];
	var rows2 = [];
	for (let i = 0; i < 5; ++i) {
		rows[i] = new MessageActionRow();
	}
	for (let i = 0; i < 5; ++i) {
		rows2[i] = new MessageActionRow();
	}
	for (let i = 0; i < player.cards.length; i++) {
		var idString = 'uno' + i;
		const color = player.cards[i][0];
		const val = player.cards[i][1];
		var label = color + ' ' + val;
		let rownum = Math.floor(i / 5);
		rows[rownum].addComponents(
			new MessageButton()
			.setCustomId(idString)
			.setLabel(label)
			.setStyle('SECONDARY'),
		);
	}
	let skiprow = player.cards.length + 1;
	skiprow = Math.floor(skiprow / 5);
	if (showSkip) {
		rows[skiprow].addComponents(
			new MessageButton()
			.setCustomId('unoS')
			.setLabel('Skip Turn')
			.setStyle('PRIMARY'),
		);
	} else {
		rows[skiprow].addComponents(
			new MessageButton()
			.setCustomId('unoD')
			.setLabel('Draw Card')
			.setStyle('PRIMARY'),
		);
	}
	var components = [];
	for (let i = 0; i <= skiprow; ++i) {
		components.push(rows[i]);
	}
	let top = '``' + top_card[0] + ' ' + top_card[1] + '``';
	var message = 'Top card: ' + top + ', play a card!';
	if (isWrongInput) {
		message = 'Top card: ' + top + ', play a card of the same face/color!';
	}
	current_dm = await player.user.send({
		content: message,
		components: components
	}).catch((err) => dq_player(false));
	// game_timer.reduce((promise, emoji) => promise.then(() => current_dm.react(emoji)), Promise.resolve());
	setTimeout(async function() {
			if (playTurn === turn) {
				current_dm.delete();
				await player.user.send('You\'ve been dq\'d... skill issue.');
				dq_player(true);
			}
	}, '35000');
}

async function dq_player(isTimeout) {
	var curplayer = player_list[iter];
	player_list.splice(iter, 1);
	if (isTimeout) {
		turnMessage.edit('**' + curplayer.user.username + '** doesn\'t seem to value our time together... moving on.');
	} else {
		turnMessage.edit('**' + curplayer.user.username + '** has their dms blocked... get over yourself.');
	}
	nextTurn();
}

async function uno_playcard(id) {
	if (drawnMessage !== null) {
		drawnMessage.delete();
		drawnMessage = null;
	}
	if (id === 'U') {
		isUNO = false;
		game_channel.send('**' + unoPlayer.user.username + '** says UNO!');
		unoDM.delete();
		return;
	}
	var curplayer = player_list[iter];
	if (id === 'D') {
		if (isUNO) {
			unoPenalty();
		}
		var drawn = getRandomCard();
		curplayer.cards.push(drawn);
		curplayer.cards = card_sort(curplayer.cards);
		drawnMessage = await curplayer.user.send('Drawn card: ``' + drawn[0] + ' ' + drawn[1] + '``');
		current_dm.delete();
		await turnMessage.edit('**' + curplayer.user.username + '** has drawn a card!');
		show_hand(curplayer, turn, true, false);
		return;
	} else if (id === 'S') {
		turnMessage.edit('**' + curplayer.user.username + '** has passed..');
		current_dm.delete();
		nextTurn();
		return;
	}
	var played_card = curplayer.cards[id];
	if (top_card[1] === 'any' && played_card[0] !== '⚫' && played_card[0] !== top_card[0]) {
		current_dm.delete();
		show_hand(curplayer, turn, isSkipShowing, true);
		return;
	}
	if (played_card[0] !== '⚫' && played_card[0] !== top_card[0] && played_card[1] !== top_card[1]) {
		current_dm.delete();
		show_hand(curplayer, turn, isSkipShowing, true);
		return;
	}
	current_dm.delete();
	if (isUNO) {
		unoPenalty();
	}
	// await curplayer.user.send('You played: ``' + played_card[0] + ' ' + played_card[1] + '``');
	var curCards = curplayer.cards;
	curCards.splice(id, 1); // remove card from user cards
	curplayer.cards = card_sort(curCards);
	top_card = played_card;
	if (played_card[1] === '🔄') {
		if (player_list.length === 2) {
			++iter;
		} else {
			isReverse = !isReverse;
		}
	}
	if (played_card[1] === '+2' || played_card[1] === '🚫') {
		top_effect = true;
	}
	used_cards.push(top_card);
	if (curplayer.cards.length === 0) {
		++turn;
		inGame = false;
		return await turnMessage.edit('**' + curplayer.user.username + '** is the ✨ winner ✨');
	} else if (curplayer.cards.length === 1) {
		isUNO = true;
		unoPlayer = curplayer;
		showUNO(curplayer);
	}
	curplayer.cards = card_sort(curplayer.cards);
	await turnMessage.edit('**' + curplayer.user.username + '** played: ``' + played_card[0] + ' ' + played_card[1] + '``');
	if (played_card[0] === '⚫') {
		if (played_card[1] === '+4') {
			plus4played = true;
			top_effect = true;
		}
		chooseColor(curplayer);
	} else {
		nextTurn();
	}
}

async function showUNO(player) {
	var row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
		.setCustomId('unoU')
		.setLabel('UNO!')
		.setStyle('DANGER'),
	);
	var messageArray = ['almost there..', 'only one card left..', 'end this game already.', 'look at you winning..', 'don\'t forget to press it!'];
	const randomIndex = Math.floor(Math.random() * messageArray.length);
	unoDM = await player.user.send({
		content: messageArray[randomIndex],
		components: [row]
	}).catch((err) => dq_player(false));
}

async function unoPenalty() {
	isUNO = false;
	unoPlayer.cards.push(getRandomCard());
	unoPlayer.cards.push(getRandomCard());
	unoPlayer.cards = card_sort(unoPlayer.cards);
	unoDM.delete();
	await game_channel.send('**' + unoPlayer.user.username + '** forgot to say UNO and was forced to draw 2 cards...');
}

async function chooseColor(player) {
	var row = new MessageActionRow();
	row.addComponents(
		new MessageButton()
		.setCustomId('unoR')
		.setLabel('🔴')
		.setStyle('SECONDARY'),
	);
	row.addComponents(
		new MessageButton()
		.setCustomId('unoY')
		.setLabel('🟡')
		.setStyle('SECONDARY'),
	);
	row.addComponents(
		new MessageButton()
		.setCustomId('unoG')
		.setLabel('🟢')
		.setStyle('SECONDARY'),
	);
	row.addComponents(
		new MessageButton()
		.setCustomId('unoB')
		.setLabel('🔵')
		.setStyle('SECONDARY'),
	);
	current_dm = await player.user.send({
		content: 'Choose a color!',
		components: [row]
	}).catch((err) => dq_player(false));
}

function card_sort(cards) {
	var red = [];
	var yellow = [];
	var green = [];
	var blue = [];
	var black = [];
	var sorted = [];
	for (let i = 0; i < cards.length; i++) {
		if (cards[i][0] == '🔴') {
			red.push(cards[i]);
		}
	}
	for (let i = 0; i < cards.length; i++) {
		if (cards[i][0] == '🟡') {
			yellow.push(cards[i]);
		}
	}
	for (let i = 0; i < cards.length; i++) {
		if (cards[i][0] == '🟢') {
			green.push(cards[i]);
		}
	}
	for (let i = 0; i < cards.length; i++) {
		if (cards[i][0] == '🔵') {
			blue.push(cards[i]);
		}
	}
	for (let i = 0; i < cards.length; i++) {
		if (cards[i][0] == '⚫') {
			black.push(cards[i]);
		}
	}
	sort_color(red);
	sort_color(yellow);
	sort_color(green);
	sort_color(blue);
	sort_color(black);
	for (let i = 0; i < red.length; i++) {
		sorted.push(red[i]);
	}
	for (let i = 0; i < yellow.length; i++) {
		sorted.push(yellow[i]);
	}
	for (let i = 0; i < green.length; i++) {
		sorted.push(green[i]);
	}
	for (let i = 0; i < blue.length; i++) {
		sorted.push(blue[i]);
	}
	for (let i = 0; i < black.length; i++) {
		sorted.push(black[i]);
	}
	return sorted;
}

async function uno_setColor(value) {
	var curplayer = player_list[iter];
	if (value === 'R') {
		top_card[0] = '🔴';
	} else if (value === 'Y') {
		top_card[0] = '🟡';
	} else if (value === 'G') {
		top_card[0] = '🟢';
	} else {
		top_card[0] = '🔵';
	}
	top_card[1] = 'any';
	current_dm.delete();
	await turnMessage.edit(turnMessage.content + ', selected color: ``' + top_card[0] + '``');
	nextTurn();
}

function getAllPlayer() {
	var str = '';
	for (let i = 0; i < player_list.length; ++i) {
		str = str + ', **' + player_list[i].user.username + '**: ' + player_list[i].cards.length;
	}
	return str;
}

function sort_color(list) {
	list.sort(function(a, b) {
		var value_a;
		var value_b;
		if (a[1] === '🔄') {
			value_a = '10';
		} else if (a[1] === '🚫') {
			value_a = '11';
		} else if (a[1] === '+2') {
			value_a = '12';
		} else if (b[1] === '🌈') {
			value_b = '13';
		} else if (b[1] === '+4') {
			value_b = '14';
		} else {
			value_a = a[1];
		}
		if (b[1] === '🔄') {
			value_b = '10';
		} else if (b[1] === '🚫') {
			value_b = '11';
		} else if (b[1] === '+2') {
			value_b = '12';
		} else if (b[1] === '🌈') {
			value_b = '13';
		} else if (b[1] === '+4') {
			value_b = '14';
		} else {
			value_b = b[1];
		}
		return parseInt(value_a) - parseInt(value_b);
	});
}

class UNOplayer {
	constructor(user) {
		this.user = user;
		var cards = [];
		for (let i = 0; i < 7; i++) {
			cards.push(getRandomCard());
		}
		cards = card_sort(cards);
		this.cards = cards;
	}

	sayHi() {
		alert(this.name);
	}

}



module.exports = {
	uno_start,
	uno_forceStart,
	uno_setColor,
	uno_playcard
}