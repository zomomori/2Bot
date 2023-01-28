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



// DEPRECATED APPLICATION COMMANDS

function interaction_dice(inter) {
	if (waitingForDICE === true) {
		return inter.reply({
			content: 'a dice game already exists..',
			ephemeral: true
		});
	}
	var dice_value = inter.options.getString('bucks');
	var reply = '';
	if (!isNumeric(dice_value)) {
		return inter.reply({
			content: 'enter a number silly..',
			ephemeral: true
		});
	}
	dice_value = parseInt(dice_value);
	if (dice_value < 1 || dice_value > 1000000000) {
		return inter.reply({
			content: 'enter a valid number silly..',
			ephemeral: true
		});
	}
	var delayInMilliseconds = 30000;
	waitingForDICE = true;
	current_access = null;
	DICEtimer = setTimeout(function() {
		if (waitingForDICE === true) {
			waitingForDICE = false;
			inter.editReply({
				content: 'no one joined..',
				components: []
			});
		}
	}, delayInMilliseconds);
	try {
		dice_db.get(inter.user.id).then(async value => {
			if (value === null) {
				waitingForDICE = false;
				return inter.reply({
					content: 'not enough money..',
					ephemeral: true
				});
			}
			var user_bucks = value[1];
			var user_claim = value[3];
			var userwm = value[4];
			var usertime = value[5];
			if (dice_value > user_bucks) {
				waitingForDICE = false;
				return inter.reply({
					content: 'not enough money..',
					ephemeral: true
				});
			}
			const row = new MessageActionRow()
				.addComponents(new MessageButton().setCustomId('dice_id')
					.setLabel('Join')
					.setStyle('PRIMARY'),
				);
			let reply = inter.member.user.username + ' has started a dice game for **' +
				dice_value + '** bucks!';
			const filter = i => i.customId === 'dice_id';
			const collector = inter.channel
				.createMessageComponentCollector({
					filter,
					time: 30000
				});
			collector.on("collect", async collected => {
				if (current_access != null) {
					collected.reply({
						content: `someone else joined before you..!`,
						ephemeral: true
					});
					return;
				}

				current_access = collected.user;
				if (current_access.id === inter.user.id) {
					collected.reply({
						content: `you can't join your own game dummy..`,
						ephemeral: true
					});
					current_access = null;
					return;
				} else {
					dice_db.get(current_access.id).then(async value2 => {
						if (value2 === null || typeof value2 === 'undefined') {
							collected.reply({
								content: `not enough money..`,
								ephemeral: true
							});
							current_access = null;
							return;
						}
						var enemy_bucks = value2[1];
						var enemy_claim = value2[3];
						var enemywm = value2[4];
						var enemytime = value2[5];
						if (dice_value > enemy_bucks) {
							collected.reply({
								content: `not enough money..`,
								ephemeral: true
							});
							current_access = null;
							return;
						}
						let roll = Math.floor(Math.random() * 2);
						var winner = '';
						var loser = '';
						if (roll === 0) {
							winner = inter.user.username;
							loser = current_access.username;
							user_bucks += dice_value;
							enemy_bucks -= dice_value;
						} else {
							winner = current_access.username;
							loser = inter.user.username;
							enemy_bucks += dice_value;
							user_bucks -= dice_value;
						}
						const userDbValue = [false, parseInt(user_bucks), inter.user.username, user_claim, userwm, usertime];
						dice_db.set(inter.user.id, userDbValue);
						const enemyDbValue = [false, parseInt(enemy_bucks),
							current_access.username, enemy_claim, enemywm, enemytime
						];
						dice_db.set(current_access.id, enemyDbValue);
						try {
							let reply2 = '**' + winner + '** has won the dice game! Sorry **' + loser + '** ✨';
							waitingForDICE = false;
							clearTimeout(DICEtimer);
							await collected.update({
								content: reply2,
								components: []
							});
							current_access = null;
							return;
						} catch (ere) {
							current_access = null;
							console.log(ere);
						}
					});
				}
			});
			return inter.reply({
				content: reply,
				components: [row]
			});
		});
	} catch (err) {
		console.log(err);
		waitingForDICE = false;
		return inter.editReply({
			content: 'Error⚠️ Please report to zoe#7777',
			ephemeral: false
		});
	}
}

function interaction_slot(inter) {
	if (waitingForSLOT === true) {
		return inter.reply({
			content: 'a slot game already exists..',
			ephemeral: true
		});
	}
	var slot_value = inter.options.getString('bucks');
	var reply = '';
	if (!isNumeric(slot_value)) {
		return inter.reply({
			content: 'enter a number silly..',
			ephemeral: true
		});
	}
	slot_value = parseInt(slot_value);
	if (slot_value != 10 && slot_value != 100 && slot_value != 1000 && slot_value != 10000) {
		return inter.reply({
			content: 'enter a valid number silly..',
			ephemeral: true
		});
	}
	try {
		dice_db.get(inter.user.id).then(async value => {
			if (value === null) {
				waitingForSLOT = false;
				return inter.reply({
					content: 'not enough money..',
					ephemeral: true
				});
			}
			var user_bucks = value[1];
			var user_claim = value[3];
			var userwm = value[4];
			var usertime = value[5];
			if (slot_value > user_bucks) {
				waitingForSLOT = false;
				return inter.reply({
					content: 'not enough money..',
					ephemeral: true
				});
			}
			inter.reply({
				content: 'starting game...'
			});
			waitingForSLOT = true;
			user_bucks -= slot_value;
			var delayInMilliseconds = 900;
			setTimeout(function() {
				var slot_array = ['<:sus:963124546431483954>', '<:reverse:963124520028344370>', '🕹️', '🎮', '💵', '💰', '<:heads:960129338844516373>', '7️⃣'];
				var count = 0;
				var checkthe_interval = 500;
				var slot_string;
				var win_amount = 0;
				var slot_interval = setInterval(function() {
					if (++count === 12) {
						var ans = Math.random() * 100;
						if (ans < 25) {
							while (allEqual(slot_string)) {
								let value = Math.floor(Math.random() * 8);
								slot_string += slot_array[value];
								value = Math.floor(Math.random() * 8);
								slot_string += slot_array[value];
								value = Math.floor(Math.random() * 8);
								slot_string += slot_array[value];
							}
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\nbetter luck next time...✨',
								ephemeral: false
							});
						} else if (ans < 55) {
							slot_string = '<:sus:963124546431483954><:sus:963124546431483954><:sus:963124546431483954>';
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\nyou are sus, no 2bucks for you...',
								ephemeral: false
							});
						} else if (ans < 70) {
							win_amount = slot_value;
							slot_string = '<:reverse:963124520028344370><:reverse:963124520028344370><:reverse:963124520028344370>';
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\ngo again! or not idrc.',
								ephemeral: false
							});
						} else if (ans < 80) {
							win_amount = (2 * slot_value);
							let value = Math.floor(Math.random() * 2);
							if (value === 0) {
								slot_string = '🕹️🕹️🕹️';
							} else {
								slot_string = '🎮🎮🎮';
							}
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\ngamer moment!!! poggers\nyou win ``' + win_amount + '`` 2bucks ✨',
								ephemeral: false
							});
						} else if (ans < 90) {
							win_amount = (3 * slot_value);
							let value = Math.floor(Math.random() * 2);
							if (value === 0) {
								slot_string = '💵💵💵';
							} else {
								slot_string = '💰💰💰';
							}
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\nyou have secured the bag 😎\nyou win ``' + win_amount + '`` 2bucks ✨',
								ephemeral: false
							});
						} else if (ans < 97) {
							win_amount = (5 * slot_value);
							slot_string = '<:heads:960129338844516373><:heads:960129338844516373><:heads:960129338844516373>';
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\nOH SHITTTT\nyou win ``' + win_amount + '`` 2bucks ✨',
								ephemeral: false
							});
						} else {
							win_amount = (10 * slot_value);
							slot_string = '7️⃣7️⃣7️⃣';
							inter.editReply({
								content: 'rolled: \n' + slot_string + '\n✨JACKPOT!!!✨ say gg\nyou win ``' + win_amount + '`` 2bucks!!!!',
								ephemeral: false
							});
						}
						waitingForSLOT = false;
						user_bucks += win_amount;
						const userDbValue = [false, parseInt(user_bucks), inter.user.username, user_claim, userwm, usertime];
						dice_db.set(inter.user.id, userDbValue);
						clearInterval(slot_interval);
					} else {
						slot_string = '';
						let value = Math.floor(Math.random() * 8);
						slot_string += slot_array[value];
						value = Math.floor(Math.random() * 8);
						slot_string += slot_array[value];
						value = Math.floor(Math.random() * 8);
						slot_string += slot_array[value];
						inter.editReply({
							content: 'rolling...\n' + slot_string,
							ephemeral: false
						});
					}
				}, checkthe_interval);
			}, delayInMilliseconds);
		});
	} catch {
		waitingForDICE = false;
		return inter.editReply({
			content: 'Error⚠️ Please report to zoe#7777',
			ephemeral: false
		});
	}
}