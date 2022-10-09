const config = require("./botconfig.json");
const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const Database = require("@replit/database");
const {
	MessageActionRow,
	MessageButton,
	MessageEmbed
} = require('discord.js');

const global_commands = [];
const guild_commands = [];
var current_access = null;
var waitingForDICE = false;
var waitingForSLOT = false;
var DICEtimer;

var probability = function(n) {
	return !!n && Math.random() <= n;
};

function allEqual(input) {
	return input.split('').every(char => char === input[0]);
}

const dice_db = new Database();

function isNumeric(str) {
	return !isNaN(str) &&
		!isNaN(parseFloat(str));
}

function interaction_getGlobalCommands() {
	const say_command = new SlashCommandBuilder()
		.setName('say')
		.setDescription('make 2Bot say something! (owner 🔒)')
		.addStringOption(option =>
			option.setName('text')
			.setDescription('the text to echo back')
			.setRequired(true));

	global_commands.push(say_command.toJSON());
	return global_commands;
}

function interaction_getGuildCommands() {
	const dice_command = new SlashCommandBuilder()
		.setName('dice')
		.setDescription('🎲 start a dice game! 🎲')
		.addStringOption(option =>
			option.setName('bucks')
			.setDescription('money on the line')
			.setRequired(true));
	guild_commands.push(dice_command.toJSON());

	const slot_command = new SlashCommandBuilder()
		.setName('slot')
		.setDescription('🎰 start a slot game! 🎰')
		.addStringOption(option =>
			option.setName('bucks')
			.setDescription('money on the line (10 / 100 / 1000 / 10,000)')
			.setRequired(true));
	guild_commands.push(slot_command.toJSON());
	return guild_commands;
}

function interaction_say(inter) {
	if (inter.member.user.id === config.adminid || inter.member.user.id === config.fernoid) {
		const str = inter.options.getString('text');
		return inter.reply({
			content: str
		});
	} else {
		return inter.reply({
			content: 'You must be owner to use this command!',
			ephemeral: true
		});
	}
}

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

module.exports = {
	interaction_getGlobalCommands,
	interaction_getGuildCommands,
	interaction_say,
	interaction_dice,
	interaction_slot,
	dice_db
}