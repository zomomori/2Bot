//****************** IMPORTS ******************
const Discord = require("discord.js");
const config = require("./botconfig.json");
const keepAlive = require("./server");

const commands = require('./commands.js');
const app_commands = require('./applicationCommands.js')
const game_c4 = require('./connect4Commands.js')
const game_uno = require('./unoCommands.js')

const {	MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');
const {	REST } = require('@discordjs/rest');
const {	Routes } = require('discord-api-types/v9');
const {	SlashCommandBuilder } = require('@discordjs/builders');

const rest = new REST({ version: '9' }).setToken(process.env['TOKEN']);
const bot = new Discord.Client({
	intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES", "GUILD_PRESENCES", "GUILD_MEMBERS"],
	partials: ["MESSAGE", "CHANNEL"]
});
// /"GUILD_PRESENCES", "GUILD_MEMBERS"

// ** uncomment to refresh application commands **
// rest.get(Routes.applicationGuildCommands(config.clientid, config.guildid))
//     .then(data => {
//         const promises = [];
//         for (const command of data) {
//             const deleteUrl = `${Routes.applicationGuildCommands(config.clientid, guildId)}/${command.id}`;
//             promises.push(rest.delete(deleteUrl));
//         }
//         return Promise.all(promises);
//     });

// bot.on('debug', console.log); // 443 error test


//*****************************  APPLICATION COMMANDS  **************************
(async () => {
	try {
		console.log('Started refreshing application (/) commands.');
		// guild specific
		// await rest.put(
		// 	Routes.applicationGuildCommands(config.clientid, config.guildid), {
		// 		body: app_commands.interaction_getGuildCommands()
		// 	},
		// );
		// global
		await rest.put(
			Routes.applicationCommands(config.clientid), {
				body: app_commands.interaction_getGlobalCommands()
			},
		);
		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
})();
//******************************************************************************


//*******************************  INITIALIZE  *********************************
bot.on("ready", async () => {
	console.log(`${bot.user.username} is online`);
	bot.user.setActivity("with the power button", {
		type: "PLAYING"
	});
	
	var delayInMilliseconds = 5000;
	setTimeout(function() {
		bot.user.setActivity("for .h for help", {
			type: "WATCHING"
		});
	}, delayInMilliseconds);
	
	// // show all guilds
	// let guilds = bot.guilds.cache.map(guild => guild.name);
	// console.log(guilds);
});
//*****************************************************************************




//********************* INTERACTION COMMAND CONTROL ***************************
bot.on('interactionCreate', async inter => {
	if (inter.isCommand()) {
		if (inter.commandName == 'say') {
			app_commands.interaction_say(inter);
		}
	} else if (inter.isButton()) {
		var customId = inter.customId;
		if (customId.substring(0, 3) === 'uno') {
			var num = customId.substring(3);
			if (num === 'R' || num === 'Y' || num === 'G' || num === 'B') {
				uno_game.uno_setColor(num);
			}
			else uno_game.uno_playcard(num);
   	 	}
	}
});
//*****************************************************************************


var shy_list = [];

//*********************** MESSAGE COMMAND CONTROL *****************************
bot.on("messageCreate", async message => {
	try {
		if (message.author == bot.user) {
			return;
		}
		
		if (message.channel.type === 'DM') {
			console.log(message.author.username + ': ' + message.content);
			if (!shy_list.includes(message.author.id)) {
					shy_list.push(message.author.id);
					try {
						message.author.send('c-can we not dm? i\'m very shy...>_<').catch(error => {});
					} catch(err) {
						console.log(err)
					}
			}
			return;
		}
		
		if (message.guild.me.permissionsIn(message.channel).has('SEND_MESSAGES')) {
				if (message.author.bot) return;
	
	
				let prefix = config.prefix;
				let messageArray = message.content.split(' ');
				let cmd = messageArray[0];
				let args = messageArray[1];

			
				if (messageArray[0] === ('<@' + config.clientid + '>')) {
					text = (messageArray.slice(1)).join(' ')
					commands.command_chat(text, message);
				}
				
				switch (cmd.toLowerCase()) {
					case `${prefix}h`:
					case `${prefix}help`:
						commands.command_help(message);
						break;

					case `${prefix}hh`:
						message.channel.send(
							'|| https://tenor.com/view/rick-roll-rick-ashley-never-gonna-give-you-up-gif-22113173 ||');
						break;

					case `${prefix}r`:
						commands.command_reddit(message, args);
						break;
					
					case `${prefix}rh`:
						commands.command_redditHot(message, args);
						break;

					case `${prefix}rm`:
						commands.command_redditMonth(message, args);
						break;

					case `${prefix}rt`:
						command_redditTop(message, args);
						break;

					case `${prefix}joke`:
						commands.command_joke(message);
						break;

					case `${prefix}pickupline`:
						commands.command_pickupline(message);
						break;

					case `${prefix}poll`:
						commands.command_poll(message);
						break;

					case `${prefix}8ball`:
						commands.command_8ball(message);
						break;

					case `${prefix}roll`:
						commands.command_roll(message, args);
						break;

					case `${prefix}cointoss`:
						commands.command_cointoss(message);
						break;

					case `${prefix}c4`:
						game_c4.command_c4PlayerGame(message, bot.user);
						break;

					case `${prefix}start`:
						game_uno.uno_forceStart(message);
						break;

					case `${prefix}uno`:
						game_uno.uno_start(message);
						break;

					case `${prefix}rps`:
						commands.command_rpsStart(message);
						break;

					case `rock`:
					case `paper`:
					case `scissor`:
					case `scissors`:
						commands.command_rps(message, cmd);
						break;
				}
			}
		} catch (err) {
		console.log(err);
		}
});
//*****************************************************************************

keepAlive()
bot.login(process.env['TOKEN'])

//********************************* END ***************************************