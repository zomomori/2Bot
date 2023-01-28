const config = require("./botconfig.json");
const {
	SlashCommandBuilder
} = require('@discordjs/builders');
const {	MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

const global_commands = [];
const guild_commands = [];

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
	// init guild specific commands here
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

module.exports = {
	interaction_getGlobalCommands,
	interaction_getGuildCommands,
	interaction_say,
}