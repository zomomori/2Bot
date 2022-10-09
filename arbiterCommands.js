const Discord = require("discord.js");
const config = require("./botconfig.json");
const Database = require("@replit/database");
const {
	dice_db
} = require("./applicationCommands");
var shop_items = [];
var wm_list = [];

function isNumeric(str) {
	return !isNaN(str) &&
		!isNaN(parseFloat(str));
}

function giveBucks(user, addBucks, isDaily, message) {
	if (!isNumeric(addBucks)) {
		throw 'not a number';
	}
	let oldBucks = 0;
	let claimed = false;
	let wm = null;
	let time = null;
	dice_db.get(user.id).then(value => {
		if (value != null) {
			oldBucks = value[1];
			claimed = value[3];
			wm = value[4];
			time = value[5];
		}
		var newBucks = +addBucks + +oldBucks;
		if (isDaily) claimed = true;
		const newValue = [false, parseInt(newBucks), user.username, claimed, wm, time];
		dice_db.set(user.id, newValue);
		message.channel.send('gave ' + message.author.username + ' **' + addBucks + '** 2bucks! wallet: ' + newBucks + ' 2bucks');
	});
}

function arbiter_give(message, messageArray) {
	try {
		const user = message.mentions.users.first();
		let addBucks = messageArray[2];
		giveBucks(user, parseInt(addBucks), false, message);
	} catch {
		message.channel.send('⚠️ Error: Contact zoe#777 to report');
	}
}

function arbiter_daily(message) {
	try {
		dice_db.get(message.author.id).then(value => {
			if (value === null || value[3] === false) {
				let addBucks = Math.floor(Math.random() * 5001);
				try {
					giveBucks(message.author, addBucks, true, message);
				} catch (err) {
					console.log(err);
					message.channel.send('⚠️ Error: Contact zoe#7777 to report');
				}
			} else {
				var today = new Date();

				var date1 = new Date(2000, 0, 1, today.getHours(), today.getMinutes());
				var date2 = new Date(2000, 0, 1, 5, 0);
				if (date2 < date1) {
					date2.setDate(date2.getDate() + 1);
				}
				var diff = date2 - date1;
				var msec = diff;
				var hh = Math.floor(msec / 1000 / 60 / 60);
				msec -= hh * 1000 * 60 * 60;
				var mm = Math.floor(msec / 1000 / 60);
				return message.channel.send('You have already claimed your daily! Come back in ' + hh + ' hours ' + mm + ' minutes');
			}
		});
	} catch {
		return message.channel.send('⚠️ Error: Contact zoe#777 to report');
	}
}

function arbiter_atm(message) {
	let flag = 0;
	var user = message.mentions.users.first();
	if (typeof user === 'undefined') {
		flag = 1;
		user = message.author;
	}
	try {
		dice_db.get(user.id).then(value => {
			if (value === null) {
				if (flag === 1) {
					return message.channel.send('You are broke...');
				} else return message.channel.send(user.username + ' is broke. Pathetic...');
			}
			let oldBucks = value[1];
			if (+oldBucks === 0) {
				if (flag === 1) return message.channel.send('You are broke. Pathetic...');
				else return message.channel.send(user.username + ' is broke. Pathetic...');
			} else {
				if (flag === 1) return message.channel.send('You have **' + oldBucks + '** 2bucks.');
				else return message.channel.send(user.username + ' has **' + oldBucks + '** 2bucks.');
			}
		});
	} catch {
		return message.channel.send('⚠️ Error: Contact zoe#777 to report');
	}
}

function arbiter_richest(message) {
	dice_db.getAll().then(data => {
		var sortable = [];
		for (var user in data) {
			if (data[user][0] === false) {
				sortable.push([user, data[user]]);
			}
		}
		if (sortable.length === 0) {
			return message.channel.send('Empty database.');
		}
		sortable.sort(function(a, b) {
			return b[1][1] - a[1][1];
		});
		let num = 0;
		let rows = '';
		let reEmbed = new Discord.MessageEmbed()
			.setColor('0099ff')
			.setTitle('Richest Users');
		for (var user of sortable) {
			num++;
			let bucks = user[1][1];
			let name = user[1][2];
			name = num + '. ' + name;
			reEmbed.addField(name, '> ' + bucks.toString(), false);
			if (num === 10) break;
		}
		reEmbed.setFooter('requested by ' + message.author.tag, message.author.displayAvatarURL());
		reEmbed.setTimestamp();
		message.channel.send({
			embeds: [reEmbed]
		})
	});
}

function arbiter_resetDaily() {
	try {
		dice_db.list().then(keys => {
			for (var key of keys) {
				resetKey(key);
			}
			console.log('Daily reset!');
		});
	} catch (err) {
		console.log('error restting daily: ' + err);
	}
}

function resetKey(key) {
	dice_db.get(key).then(value => {
		if (value[0] === false) {
			const newValue = [false, parseInt(value[1]), value[2], false, value[4], value[5]];
			setDb(key, newValue);
		}
	});
}

function setDb(key, newValue) {
	dice_db.set(key, newValue);
}

function arbiter_clear(message) {
	try {
		dice_db.empty();
		message.channel.send('DB cleared.');
	} catch {
		message.channel.send('⚠️ Error: Contact zoe#777 to report');
	}
}

function arbiter_addItem(message) {
	let string = message.content.substring(9);
	let pArgs = string.split(',');
	if (pArgs.length != 2) {
		let embedsay = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('⚠️ Error')
			.setDescription('``Format for addItem: .addItem <item>, <price>``');
		return message.channel.send({
			embeds: [embedsay]
		});
	} else {
		try {
			if (!isNumeric(pArgs[1])) {
				throw 'not a number';
			}
			dice_db.list().then(keys => {
				var i = keys.length;
				insertShop(i, pArgs[0], pArgs[1]);
			});
			let embedsay = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('Item added!')
				.setDescription('``' + pArgs[0] + ': ' + pArgs[1] + ' 2bucks``');
			message.channel.send({
				embeds: [embedsay]
			});
		} catch {
			let embedsay = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('⚠️ Error')
				.setDescription('``Format for addItem: .addItem <item>, <price>``');
			message.channel.send({
				embeds: [embedsay]
			});
		}
	}
}

function insertShop(i, name, value) {
	const newValue = [true, name, parseInt(value)];
	dice_db.set(i, newValue);
	shop_items.push([('' + i), newValue]);
	sort_shop();
}

function init_shop() {
	dice_db.getAll().then(data => {
		for (var item in data) {
			if (data[item][0] === true) {
				shop_items.push([item, data[item]]);
			}
		}
		if (shop_items.length === 0) {
			return;
		}
		shop_items.sort(function(a, b) {
			return b[1][2] - a[1][2];
		});
	});
}

function init_wm() {
	dice_db.getAll().then(data => {
		for (var item in data) {
			if (data[item][0] === false) {
				wm_list.push([item, data[item][4], data[item][5]]);
			}
		}
		console.log(wm_list);
	});
}

function sort_shop() {
	if (shop_items.length === 0) {
		return;
	}
	shop_items.sort(function(a, b) {
		return b[1][2] - a[1][2];
	});
}

function arbiter_shop(message) {
	dice_db.getAll().then(data => {
		var sortable = [];
		for (var item in data) {
			if (data[item][0] === true) {
				sortable.push([item, data[item]]);
			}
		}
		sortable.sort(function(a, b) {
			return b[1][2] - a[1][2];
		});
		let num = 0;
		let rows = '';
		let reEmbed = new Discord.MessageEmbed()
			.setColor('0099ff')
			.setTitle('Arbiter Shop');
		for (var item of sortable) {
			num++;
			let name = item[1][1];
			let bucks = item[1][2];
			name = num + '. ' + name;
			reEmbed.addField(name, '> ' + bucks.toString(), false);
		}
		if (sortable.length === 0) reEmbed.setDescription('nothing to see here... ');
		reEmbed.setFooter('requested by ' + message.author.tag, message.author.displayAvatarURL());
		reEmbed.setTimestamp();
		message.channel.send({
			embeds: [reEmbed]
		});
	});
}

function arbiter_buy(message, args) {
	try {
		if (!isNumeric(args)) {
			throw 'not a number';
		}
		args = parseInt(args) - 1;
		if (args >= shop_items.length || args < 0) {
			throw 'invalid number';
		}
		let cost = parseInt(shop_items[args][1][2]);
		try {
			dice_db.get(message.author.id).then(async value => {
				if (value === null) {
					let embedsay = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle('⚠️ Error')
						.setDescription('``Not enough money...``');
					return message.channel.send({
						embeds: [embedsay]
					});
				}
				var user_bucks = value[1];
				var claimed = value[3];
				var wm = value[4];
				var time = new Date();
				if (cost > user_bucks) {
					let embedsay = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle('⚠️ Error')
						.setDescription('``Not enough money...``');
					return message.channel.send({
						embeds: [embedsay]
					});
				}
				user_bucks -= cost;
				const userDbValue = [false, parseInt(user_bucks), message.author.username, claimed, wm, time];
				dice_db.set(message.author.id, userDbValue);
				message.channel.send('<@' + config.adminid + '>, ' + message.author.username + ' has bought ' + shop_items[args][1][1] + ' for ' + shop_items[args][1][2] + ' 2bucks!');
			});
		} catch {
			// error
		}
	} catch {
		let embedsay = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('⚠️ Error')
			.setDescription('``Invalid input``');
		return message.channel.send({
			embeds: [embedsay]
		});
	}
}

function arbiter_delItem(message, args) {
	try {
		if (!isNumeric(args)) {
			throw 'not a number';
		}
		args = parseInt(args) - 1;
		if (args >= shop_items.length || args < 0) {
			throw 'invalid number';
		}
		let key = shop_items[args][0];
		try {
			dice_db.delete(parseInt(key)).then(() => {
				shop_items.splice(args, 1);
				message.channel.send('Item deleted.');
			});
		} catch (err) {
			console.log(err);
			let embedsay = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('⚠️ Error')
				.setDescription('``Item not deleted``');
			return message.channel.send({
				embeds: [embedsay]
			});
		}
	} catch {
		let embedsay = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('⚠️ Error')
			.setDescription('``Invalid input``');
		return message.channel.send({
			embeds: [embedsay]
		});
	}
}

function arbitertc_woop(message) {
	let reEmbed = new Discord.MessageEmbed()						.setColor('#0099ff')				.setTitle('woop');
					reEmbed.setImage('https://i.imgur.com/nNJyhDr.gif').setFooter(message.author.tag, message.author.displayAvatarURL())
				.setTimestamp();
					message.channel.send({
						embeds: [reEmbed]
					});
	message.delete();
}


module.exports = {
	init_shop,
	init_wm,
	arbiter_give,
	arbiter_daily,
	arbiter_atm,
	arbiter_richest,
	arbiter_clear,
	arbiter_resetDaily,
	arbiter_shop,
	arbiter_addItem,
	arbiter_delItem,
	arbiter_buy,
	arbitertc_woop
}