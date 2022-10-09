const Discord = require("discord.js");
const config = require("./botconfig.json");
const keepAlive = require("./server");
const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {
	command_help,
	command_joke,
	command_8ball,
	command_roll,
	command_cointoss,
	command_reddit,
	command_redditHot,
	command_redditMonth,
	command_redditTop,
	command_pickupline,
	command_poll,
	command_rpsStart,
	command_rps
} = require("./commands");
const {
	interaction_getGlobalCommands,
	interaction_getGuildCommands,
	interaction_say,
	interaction_dice,
	interaction_slot
} = require("./applicationCommands");
const {
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
	arbitertc_woop,
	arbiter_buy
} = require("./arbiterCommands");
const {
	command_c4PlayerGame
} = require("./connect4Commands");
const {
	uno_start,
	uno_forceStart,
	uno_setColor,
	uno_playcard
} = require("./unoCommands");
const {
	MessageActionRow,
	MessageButton,
	MessageEmbed
} = require('discord.js');
const {
	REST
} = require('@discordjs/rest');
const {
	Routes
} = require('discord-api-types/v9');
const bot = new Discord.Client({
	intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES", "GUILD_PRESENCES", "GUILD_MEMBERS"],
	partials: ["MESSAGE", "CHANNEL"]
});
// /"GUILD_PRESENCES", "GUILD_MEMBERS"

let alreadyReset = false;
var sami_time = null;
var sami_count = 0;
var shy_list = [];


const rest = new REST({
	version: '9'
}).setToken(process.env['TOKEN']);


//** uncomment to refresh guild commands **
// rest.get(Routes.applicationGuildCommands(config.clientid, guildId))
//     .then(data => {
//         const promises = [];
//         for (const command of data) {
//             const deleteUrl = `${Routes.applicationGuildCommands(config.clientid, guildId)}/${command.id}`;
//             promises.push(rest.delete(deleteUrl));
//         }
//         return Promise.all(promises);
//     });


//bot.on('debug', console.log); // 443 error test



//*********  set up application commands  *********
(async () => {
	try {
		console.log('Started refreshing application (/) commands.');
		await rest.put(
			Routes.applicationGuildCommands(config.clientid, config.guildid), {
				body: interaction_getGuildCommands()
			},
		);
		await rest.put(
			Routes.applicationCommands(config.clientid), {
				body: interaction_getGlobalCommands()
			},
		);
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
//*********+++++++++++++++++++++++++++++**********

function isTimeToGreet() {
	var current = new Date();
	if (sami_time === null) {
		return false;
	}
	var diff = current - sami_time;
	var msec = diff;
	var hh = Math.floor(msec / 1000 / 60 / 60);
	// msec -= hh * 1000 * 60 * 60;
	// var mm = Math.floor(msec / 1000 / 60);
	// msec -= mm * 1000 * 60;
	// var ss = Math.floor(msec / 1000);
	// msec -= ss * 1000;
	if (hh >= 2) {
		return false;
	}
	return false;
}


//*******************  on READY  *********************
bot.on("ready", async () => {
	console.log(`${bot.user.username} is online`);
	bot.user.setActivity("with the power button", {
		type: "PLAYING"
	});
	// To show ALL GUILDS
	let guilds = bot.guilds.cache.map(guild => guild.name);
	console.log(guilds);
	init_shop();
	init_wm();
	// TO SHOW GUILD MEMBERS
	// const Guild = bot.guilds.cache.get(guildId);
	// await Guild.members.fetch().then(list => {
	// 	for (var i of list) {
	// 		console.log(i[1].user.username);
	// 	}
	// }).catch(console.error);
	var delayInMilliseconds = 5000;
	setTimeout(function() {
		bot.user.setActivity("for .h for help", {
			type: "WATCHING"
		});
	}, delayInMilliseconds);
	var checkminutes = 1,
		checkthe_interval = checkminutes * 60 * 1000;
	setInterval(function() {
		var today = new Date();
		if ((today.getHours() === 5) && !alreadyReset) {
			arbiter_resetDaily();
			alreadyReset = true;
		} else if ((today.getHours() === 6)) {
			alreadyReset = false;
		}
	}, checkthe_interval);
});
//*************+++++++++++++++++++++++++++++*********




//************* Interactions commands ****************
bot.on('interactionCreate', async inter => {
	if (inter.isCommand()) {
		if (inter.commandName == 'say') {
			interaction_say(inter);
		} else if (inter.commandName == 'dice') {
			interaction_dice(inter);
		} else if (inter.commandName == 'slot') {
			interaction_slot(inter);
		} 
	} else if (inter.isButton()) {
		var customId = inter.customId;
		if (customId.substring(0, 3) === 'uno') {
			var num = customId.substring(3);
			if (num === 'R' || num === 'Y' || num === 'G' || num === 'B') {
				uno_setColor(num);
			}
			else uno_playcard(num);
   	 	}
	}
});
//************+++++++++++++++++++++++++++++**********



//****************** message commands ***************
bot.on("messageCreate", async message => {
	try {
		if (message.author == bot.user) {
			return;
		}
		if (message.channel.type === 'DM') {
			console.log(message.author.username + ': ' + message.content);
			let messageArray = message.content.split(" ");
			let cmd = messageArray[0];
			if (cmd == `${config.prefix}confess`) {
				let string = message.content.substring(9);
				var lastIndex = string.lastIndexOf(",");
				console.log(lastIndex);
				if (lastIndex === -1) {
					return message.channel.send('``Invalid syntax ⚠️ use: .confess <confession>, <showname: yes/no>``')
				}
				var s1 = string.substring(0, lastIndex); //after this s1="Text1, Text2, Text"
				var s2 = string.substring(lastIndex + 1); //after this s2="true"
				let user = 'anon';
				let isName = s2.trim();
				console.log(isName);
				if (isName.toLowerCase() === 'yes' || isName.toLowerCase() === 'y') {
					user = message.author.username
				} else if (isName.toLowerCase() === 'no' || isName.toLowerCase() === 'n') { //do nothing
				} else {
					return message.channel.send('``Invalid syntax ⚠️ use: .confess <confession>, <showname: yes/no>``')
				}
				let reEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle('from ' + user)
					.setDescription(s1)
				return bot.channels.cache.get('962132881164103740').send({
					embeds: [reEmbed]
				});
			} 
			// else {
			// 	if (!shy_list.includes(message.author.id)) {
			// 		shy_list.push(message.author.id);
			// 		try {
			// 			message.author.send('c-can we not dm? i\'m very shy...>_<').catch(error => {});
			// 		} catch {
			// 			// idk
			// 		}
			// 	}
			// }
			return;
		}
		if (message.guild.me.permissionsIn(message.channel).has('SEND_MESSAGES')) {
			if (message.author.bot) return;


			let prefix = config.prefix;
			let messageArray = message.content.split(" ");
			let cmd = messageArray[0];
			let args = messageArray[1];

			if (cmd == `${prefix}h` || cmd == `${prefix}help`) {
				command_help(message);
			}

			if (cmd == `${prefix}hh`) {
				message.channel.send('|| https://tenor.com/view/rick-roll-rick-ashley-never-gonna-give-you-up-gif-22113173 ||');
			}

			if (cmd == `${prefix}r`) {
				command_reddit(message, args);
			}

			if (cmd == `${prefix}rh`) {
				command_redditHot(message, args);
			}

			if (cmd == `${prefix}rm`) {
				command_redditMonth(message, args);
			}

			if (cmd == `${prefix}rt`) {
				command_redditTop(message, args);
			}

			if (cmd == `${prefix}joke`) {
				command_joke(message);
			}

			if (cmd == `${prefix}pickupline`) {
				command_pickupline(message);
			}

			if (cmd == `${prefix}poll`) {
				command_poll(message);
			}

			if (cmd == `${prefix}8ball`) {
				command_8ball(message);
			}

			if (cmd == `${prefix}roll`) {
				command_roll(message, args);
			}

			if (cmd == `${prefix}cointoss`) {
				command_cointoss(message);
			}

			if (cmd == `${prefix}rps`) {
				command_rpsStart(message);
			}

			if (cmd == `${prefix}c4`) {
				command_c4PlayerGame(message, bot.user);
			}

			if (cmd == `${prefix}start`) {
				uno_forceStart(message);
			}

			if (cmd == `${prefix}uno`) {
				uno_start(message);
			}

			if (cmd.toLowerCase() === 'rock' || cmd.toLowerCase() === 'paper' || cmd.toLowerCase() === 'scissors' || cmd.toLowerCase() === 'scissor') {
				command_rps(message, cmd);
			}

			if (message.guild.id === config.guildid) {

				// general channel
				if (cmd === `${prefix}test`) {
					message.channel.messages.fetch()
						.then(messages => {
							console.log(messages);
						});
				}

				// confessions channel
				if (message.channel.id === '962132881164103740') {
					return message.delete(1000);
				}
				if (message.channel.id === '962135808041697300') {
					// pics channel
					if (message.attachments.size <= 0) {
						return message.delete(1000);
					}
				}
				if (message.author.id === config.adminid) {
					if (cmd === `${prefix}give`) {
						arbiter_give(message, messageArray);
					} else if (cmd === `${prefix}clear`) {
						arbiter_clear(message);
					} else if (cmd === `${prefix}resetdaily`) {
						arbiter_resetDaily();
					} else if (cmd === `${prefix}additem`) {
						arbiter_addItem(message);
					} else if (cmd === `${prefix}delitem`) {
						arbiter_delItem(message, args);
					}
				}

				if (cmd === `${prefix}atm`) {
					arbiter_atm(message);
				}

				if (cmd === `${prefix}richestusers` || cmd === `${prefix}richest`) {
					arbiter_richest(message);
				}

				if (cmd === `${prefix}daily`) {
					arbiter_daily(message);
				}
				if (cmd === `${prefix}shop`) {
					arbiter_shop(message);
				} else if (cmd === `${prefix}buy`) {
					arbiter_buy(message, args);
				} else if (cmd === `${prefix}woop`) {
arbitertc_woop(message);}



				// if(cmd === `${prefix}transfer`) {
				//   const user = message.mentions.users.first();
				//   if (user === null || typeof user === 'undefined') {
				//       return message.channel.send('⚠️ Error: Please tag a user');
				//   }
				//   if (user.id === message.author.id) {
				//       return message.channel.send('don\'t waste my time..');
				//   }
				//   let addBucks = messageArray[2];
				//   try {

				//       let addBucks = messageArray[2];
				//       giveBucks(user, addBucks);
				//       message.channel.send('gave ' + user.username + ' **' + addBucks + '** bucks!');  
				//     }
				//     catch {
				//       message.channel.send('⚠️ Error: Contact zoe#777 to report');
				//     }
				// }
			}
		}
	} catch (err) {
		console.log(err);
	}
});
//************+++++++++++++++++++++++++++++*********

//keepAlive()
bot.login(process.env['TOKEN'])