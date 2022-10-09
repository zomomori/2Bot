const Discord = require("discord.js");
const request = require("request");
const config = require("./botconfig.json");
var waitingForRPS = false;
var RPStimer;

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isImage(url) {
	return (url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

function allLetter(inputtxt) {
	return true;
}

function isNumeric(str) {
	return !isNaN(str) &&
		!isNaN(parseFloat(str));
}

function command_help(message) {

	let value = ' `.r <subreddit/empty for random> :` Random post from *top 100 of all time*' +
		'\n `.rh <subreddit> :` Random hot post' +
		'\n `.rm <subreddit> :` Random post from *top 100 of this month*' +
		'\n `.rt <subreddit> :` Top post *of all time*' +
		'\n `.pickupline :` Say a random pickup-line' +
		'\n `.joke :` Say a random joke' +
		'\n `.rps :` Start a rock-paper-scissor game' +
		'\n `.poll title, <specify emoji> option1, <specify emoji> option2... :` Create a poll' +
		'\n `.8ball <question> :` Let magic 8-ball decide your fortune ' +
		'\n `.roll <number> :` Roll a random number between 1 and said number ' +
		'\n `.cointoss :` wonder what this could be...' +
		'\n' +
		'\n `.h     :` Help' +
		'\n `.hh    :` Detailed help ' +
		'\n';

	if (message.guild.id === config.guildid) {
		value = value +
			'\n `.confess <confession>, <showname: yes/no> [in DM]     :` send a confession in #confessions' +
			'\n `/dice <value>    :` Start a dice game ' +
			'\n `.atm    :` Show wallet ' +
			'\n';
	}

	let sEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setAuthor({
			name: '2Bot',
			iconURL: 'https://i.imgur.com/LegSbgM.jpg',
			url: 'https://discord.js.org'
		})
		.setThumbnail('https://i.imgur.com/XruOKzb.jpg')
		.addFields({
			name: 'Current commands: ',
			value: value
		}, {
			name: '\u200B',
			value: '\u200B'
		}, )
		.setFooter('Contact zoe#7777 for any issues\n[menu requested by ' + message.author.tag + ']', message.author.displayAvatarURL());
	message.channel.send({
		embeds: [sEmbed]
	});
}


//joke
function command_joke(message) {
	var choices = ['Jokes', 'dadjokes', 'cleanjokes'];
	var chosen = choices[Math.floor(Math.random() * 3)];
	request('https://www.reddit.com/r/' + chosen + '/top/.json?t=all&limit=100', function(error, response, body) {
		let json = JSON.parse(body);
		try {
			let randnum = Math.floor((Math.random() * 100) + 0);
			let selftext = json['data']['children'][randnum]['data']['selftext'];
			if (selftext.length > 1000) {
				selftext = selftext.substring(0, 1000);
				selftext = selftext + '.... read the full post from the link!';
			}
			let title = json['data']['children'][randnum]['data']['title'];
			let redditlink = json['data']['children'][randnum]['data']['permalink'];
			let jokEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(title)
				.setDescription(selftext);
			return message.channel.send({
				embeds: [jokEmbed]
			});
		} catch {
			let reEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('⚠️ Error getting data')
				.setDescription(
					'Please contact zoe#7777 to report'
				)
			return message.channel.send({
				embeds: [reEmbed]
			});
		}
	});
}

//8ball
function command_8ball(message) {
	let string = message.content.substring(7);
	if (string === "") {
		message.channel.send('You didn\'t ask a question... ');
	} else {
		var choices = ['DUDE, 100%', 'Yeah sure, whatever.', 'Maybe-IDK.', 'Don\'t count on it.', 'Mhm.', 'Most likely.', 'Don\'t bother me rn.', 'No way LMAO.', 'Without a doubt.', 'Yeah, looks like it.', 'Ugh, don\'t bring me into this..', 'My totally credible sources say no.', 'Yes.', 'Yes for sureeeeeeee.', 'UMM I wish I knew too.', 'Nah.', 'Yeah dude dw.', 'Signs point to yes.', 'Can\'t tell honestly.', 'Very doubtful.'];
		var response = choices[Math.floor(Math.random() * 20)];
		message.channel.send('``' + response + '``');
	}
}

//roll
function command_roll(message, args) {
	if (args === void(0) || !isNumeric(args) || args <= 0) {
		message.channel.send('Enter a valid number dummy.');
	} else {
		message.channel.send('``rolled: ' + getRandomInt(1, args) + '``');
	}
}

//cointoss
function command_cointoss(message) {
	let value = Math.floor(Math.random() * 2);
	var coin_value = 'heads';
	var emoji = '<:heads:960129338844516373>';
	if (value === 0) {
		coin_value = 'tails';
		emoji = '<:tails:960129260117450783>';
	}
	message.channel.send('you landed **' + coin_value + '** ' + emoji);
}



function redditRequest(requestLink, errorMessage, isTop, sub_reddit, isNSFWChannel, message) {
	if (!allLetter(sub_reddit)) {
		let reEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(
				'⚠️ Error getting data from r/' + sub_reddit
			)
			.setDescription(errorMessage);
		return message.channel.send({
			embeds: [reEmbed]
		});
	}
	//console.log('request link: ' + requestLink);
	request(requestLink, function(error, response, body) {
		try {
			let json = JSON.parse(body);
			let randnum;
			if (isTop) {
				randnum = 0;
			} else {
				randnum = Math.floor((Math.random() * 100) + 0);
			}
			let nsfwPost = json['data']['children'][randnum]['data']['over_18'];
			if (!isNSFWChannel && nsfwPost) {
				let reEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(
						'⚠️ Error getting data from r/' + sub_reddit
					)
					.setDescription('Post is NSFW, please view in an NSFW channel!');
				return message.channel.send({
					embeds: [reEmbed]
				});
			}
			let imgurl = json['data']['children'][randnum]['data']['url'];
			let title = json['data']['children'][randnum]['data']['title'];
			let selftext = json['data']['children'][randnum]['data']['selftext'];
			let redditlink = json['data']['children'][randnum]['data']['permalink'];
			request(imgurl, function(err, response, body) {
				//console.log(imgurl + ' was requested');
				let finalurl
				try {
					finalurl = response.request.href
				} catch {
					finalurl = imgurl
				}
				let isImageUrl = isImage(finalurl);
				if (isImageUrl) {
					let reEmbed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle('Posted on r/' + sub_reddit)
						.setDescription('[' + title + '](' + 'https://reddit.com' + redditlink + ')\n' + selftext);
					reEmbed.setImage(finalurl);
					return message.channel.send({
						embeds: [reEmbed]
					});
				} else if (selftext != '') {
					let flag = 0;
					while (selftext.length > 0) {
						let index = selftext.indexOf(' ', 2000);
						if (index === -1) index = 2000;
						let temptext = selftext.substring(0, index);
						selftext = selftext.substring(index);
						let reEmbed = new Discord.MessageEmbed()
							.setColor('#0099ff');
						if (flag === 0) {
							reEmbed.setTitle('Posted on r/' + sub_reddit);
							reEmbed.setDescription('[' + title + '](' + 'https://reddit.com' + redditlink + ')\n' + temptext);
							flag = 1;
						} else {
							reEmbed.setDescription(temptext);
						}
						message.channel.send({
							embeds: [reEmbed]
						});
					}
					return;
				} else {
					message.channel.send('``Posted on r/' + sub_reddit + '``');
					message.channel.send('**' + title + '**');
					return message.channel.send(finalurl);
				}
			});
		} catch {
			let reEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(
					'⚠️ Error getting data from r/' + sub_reddit
				)
				.setDescription(errorMessage);
			return message.channel.send({
				embeds: [reEmbed]
			});
		}
	});
}

function command_reddit(message, args) {
	let err_message = 'Either this subreddit does not exist, or it has less than 100 posts in it';
	if (args === void(0)) {
		var r = request.get('https://www.reddit.com/r/random/', function(err, res, body) {
			let sub = res.request.uri.href;
			sub = sub.substring(25);
			sub = sub.substring(0, sub.indexOf('/'));
			redditRequest('https://www.reddit.com/r/' + sub + '/top/.json?t=all&limit=100', err_message, false, sub, message.channel.nsfw, message);
		});
	} else {
		redditRequest('https://www.reddit.com/r/' + args + '/top/.json?t=all&limit=100', err_message, false, args, message.channel.nsfw, message);
	}
}

function command_redditHot(message, args) {
	let err_message = 'Either this subreddit does not exist, or it has less than 100 posts in it';
	if (args === void(0)) {
		var r = request.get('https://www.reddit.com/r/random/', function(err, res, body) {
			let sub = res.request.uri.href;
			sub = sub.substring(25);
			sub = sub.substring(0, sub.indexOf('/'));
			redditRequest('https://www.reddit.com/r/' + sub + '/hot/.json?limit=100', err_message, false, sub, message.channel.nsfw, message);
		});
	} else {
		redditRequest('https://www.reddit.com/r/' + args + '/hot/.json?limit=100', err_message, false, args, message.channel.nsfw, message);
	}
}

function command_redditMonth(message, args) {

	let err_message = 'Either this subreddit does not exist, or it has had less than 100 posts posted in it this month';
	if (args === void(0)) {
		var r = request.get('https://www.reddit.com/r/random/', function(err, res, body) {
			let sub = res.request.uri.href;
			sub = sub.substring(25);
			sub = sub.substring(0, sub.indexOf('/'));
			redditRequest('https://www.reddit.com/r/' + sub + '/top/.json?t=month&limit=100', err_message, false, sub, message.channel.nsfw, message);
		});
	} else {
		redditRequest('https://www.reddit.com/r/' + args + '/top/.json?t=month&limit=100', err_message, false, args, message.channel.nsfw, message);
	}
}

function command_redditTop(message, args) {

	let err_message = 'Either this subreddit doe not exist, or it might be empty';
	if (args === void(0)) {
		var r = request.get('https://www.reddit.com/r/random/', function(err, res, body) {
			let sub = res.request.uri.href;
			sub = sub.substring(25);
			sub = sub.substring(0, sub.indexOf('/'));
			redditRequest('https://www.reddit.com/r/' + sub + '/top/.json?t=all&limit=1', err_message, true, sub, message.channel.nsfw, message);
		});
	} else {
		redditRequest('https://www.reddit.com/r/' + args + '/top/.json?t=all&limit=1', err_message, true, args, message.channel.nsfw, message);
	}
}

function command_pickupline(message) {
	request('https://www.reddit.com/r/pickuplines/top/.json?t=all&limit=100', function(error, response, body) {
		let json = JSON.parse(body);
		try {
			let randnum = Math.floor((Math.random() * 100) + 0);
			let selftext = json['data']['children'][randnum]['data']['selftext'];
			let title = json['data']['children'][randnum]['data']['title'];
			let redditlink = json['data']['children'][randnum]['data']['permalink'];
			let pikEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle(title)
				.setDescription(selftext);
			return message.channel.send({
				embeds: [pikEmbed]
			});
		} catch {
			let reEmbed = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('⚠️ Error getting data')
				.setDescription(
					'Please contact zoe#7777 to report'
				)
			return message.channel.send({
				embeds: [reEmbed]
			});
		}
	});
}


function command_poll(message) {
	let string = message.content.substring(6);
	let pArgs = string.split(',');
	if (pArgs.length > 11) {
		let embedsay = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('⚠️ Error generating poll')
			.setDescription('Cannot have more than 10 options!');
		message.channel.send({
			embeds: [embedsay]
		});
	} else {
		try {
			let options = "";
			let i;
			let counter = 0;
			let reactions = [];
			let emojiCharacters = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
			for (i = 1; i < pArgs.length; i++) {
				pArgs[i] = pArgs[i].trim();
				let hex = pArgs[i].codePointAt(0).toString(16);
				let emo = String.fromCodePoint("0x" + hex);
				let emojiRegexExp = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/gi;
				if (emojiRegexExp.test(emo)) {
					emojiCharacters[counter] = emo;
					pArgs[i] = pArgs[i].substring(1);
					pArgs[i] = pArgs[i].trim();
				}
				options = options + '\n' + emojiCharacters[counter] + '  ' + pArgs[i] + '\n';
				//options.push(emojiCharacters[counter]+ ' ' + pArgs[i] + '   \t');
				reactions.push(emojiCharacters[counter++]);
			}
			options += '<:blank:960175340620247061>';
			let embedsay = new Discord.MessageEmbed()
				.setColor('0099ff')
				.setTitle(pArgs[0])
				.setDescription(options)
				.setFooter('poll by ' + message.author.tag, message.author.displayAvatarURL())
				.setTimestamp();
			message.channel.send({
				embeds: [embedsay]
			}).then(embedMessage => {
				reactions.reduce((promise, emoji) => promise.then(() => embedMessage.react(emoji)), Promise.resolve());
			});
			message.delete();
		} catch {
			let embedsay = new Discord.MessageEmbed()
				.setColor('#0099ff')
				.setTitle('⚠️ Error generating poll')
				.setDescription('``.poll title, option1, option2... `` To start a poll!');
			message.channel.send({
				embeds: [embedsay]
			});
		}
	}
}

function command_rpsStart(message) {
	if (waitingForRPS === true) {
		message.channel.send('Wait for your turn.');
		return;
	}
	message.channel.send('Rock-Paper-Scissors? Bring it on.');
	waitingForRPS = true;
	var delayInMilliseconds = 10000;
	RPStimer = setTimeout(function() {
		if (waitingForRPS === true) {
			message.channel.send('I waited for you... are you scared?');
			waitingForRPS = false;
		}
	}, delayInMilliseconds);
}

function command_rps(message, cmd) {
	if (waitingForRPS === true) {
		var choices = ['rock', 'paper', 'scissors'];
		var userResponse = cmd.toLowerCase();
		var userWins = false;
		var response = choices[Math.floor(Math.random() * 3)];
		message.channel.send('I chose ' + response + '.');
		if (userResponse == 'paper') {
			if (response == 'rock') {
				message.channel.send('You won. Good for you.');
				userWins = true;
			} else if (response == 'scissors') {
				message.channel.send('You lost. As expected.');
			} else {
				message.channel.send('There was a tie. What a waste.');
			}
		}
		if (userResponse == 'rock') {
			if (response == 'scissors') {
				message.channel.send('You won. Good for you.');
				userWins = true;
			} else if (response == 'paper') {
				message.channel.send('You lost. As expected.');
			} else {
				message.channel.send('There was a tie. What a waste.');
			}
		}
		if (userResponse == 'scissor' || userResponse == 'scissors') {
			if (response == 'paper') {
				message.channel.send('You won. Good for you.');
				userWins = true;
			} else if (response == 'rock') {
				message.channel.send('You lost. As expected.');
			} else {
				message.channel.send('There was a tie. What a waste.');
			}
		}
		waitingForRPS = false;
		clearTimeout(RPStimer);
	}
}


module.exports = {
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
}