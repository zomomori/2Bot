const Discord = require("discord.js")
const config = require("./botconfig.json");
const request = require("request");

const { fetchRandomSubredditName, fetchRandomNSFWSubredditName } = require('fetch-subreddit');

const bot = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })

let waitingForRPS = false;
let showCallerEmbed = false;
var RPStimer;

//bot.on('debug', console.log);

function isImage(url) {
    return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

bot.on("ready", async() => {
	console.log(`${bot.user.username} is online`);

	bot.user.setActivity("with the power button", {type: "PLAYING"});
	var delayInMilliseconds = 5000;
	setTimeout(function () {
		bot.user.setActivity("for .h for help", {type: "WATCHING"});
	}, delayInMilliseconds);
});

bot.on("messageCreate", async message => {
	if (message.author.bot) return;
	if (message.channel.type == "dm") return;

	let prefix = config.prefix;
	let messageArray = message.content.split(" ");
	let cmd = messageArray[0];
	let args = messageArray[1];

	//if(cmd == `${prefix}q`){
	//var role = message.guild.roles.find(role => role.name === "redditFetch");
	//message.member.removeRole(role);
	//message.guild.roles.find(role => role.name === "x").delete();
	//}

  if (cmd == `${prefix}toggleEmbed` && message.author.tag == 'zoe#4444') {
    showCallerEmbed = !showCallerEmbed;
    let reEmbed = new Discord.MessageEmbed()
          .setColor('#0099ff')
	        .setTitle('⚠️ Embeds toggled!')
	        .setDescription(
							'Current Value: ' + showCallerEmbed);
					return message.channel.send({embeds: [reEmbed] });
	}

	if (cmd == `${prefix}h` || cmd == `${prefix}help`) {
		let sEmbed = new Discord.MessageEmbed()
	  .setColor('#0099ff')
	  .setAuthor({ name: '2Bot', iconURL: 'https://i.imgur.com/LegSbgM.jpg', url: 'https://discord.js.org' })
	  .setThumbnail('https://i.imgur.com/XruOKzb.jpg')
	  .addFields(
		  { name: 'Current commands: ', value: ' `.r <subreddit/empty for random> :` Random post from *top 100 of all time*' +
				'\n `.rm <subreddit> :` Random post from *top 100 of this month*' +
				'\n `.rt <subreddit> :` Top post *of all time*' +
				'\n `.pickupline :` Say a random pickup-line' +
				'\n `.joke :` Say a random joke' +
				'\n `.rps :` Start a rock-paper-scissor game' +
				'\n `.poll title, <specify emoji> option1, <specify emoji> option2... :` Create a poll' +
				'\n' +
				'\n `.h     :` Help' +
				'\n `.hh    :` Detailed help ' +
				'\n' },
		  { name: '\u200B', value: '\u200B' },
	  )
	  .setFooter('Contact zoe#4444 for any issues\n[menu requested by ' + message.author.tag + ']', message.author.displayAvatarURL());
    message.channel.send({ embeds: [sEmbed] });
	}

	if (cmd == `${prefix}hh`) {
		message.channel.send('|| https://tenor.com/view/rick-roll-rick-ashley-never-gonna-give-you-up-gif-22113173 ||');
	}

	if (cmd == `${prefix}r`) {
    let err_message = 'Either this subreddit does not exist, or it has less than 100 posts in it';
    if (args === void(0)) {
      var r = request.get('https://www.reddit.com/r/random/', function (err, res, body) {
        let sub = res.request.uri.href;
        sub = sub.substring(25);
        sub = sub.substring(0, sub.indexOf('/'));
        redditRequest('https://www.reddit.com/r/' + sub + '/top/.json?t=all&limit=100', err_message, false, sub);
      });
		} else {
      redditRequest('https://www.reddit.com/r/' + args + '/top/.json?t=all&limit=100', err_message, false, args);
    }
	}

	if (cmd == `${prefix}rm`) {
    let err_message = 'Either this subreddit does not exist, or it has had less than 100 posts posted in it this month';
    if (args === void(0)) {
      var r = request.get('https://www.reddit.com/r/random/', function (err, res, body) {
        let sub = res.request.uri.href;
        sub = sub.substring(25);
        sub = sub.substring(0, sub.indexOf('/'));
        redditRequest('https://www.reddit.com/r/' + sub + '/top/.json?t=month&limit=100', err_message, false, sub);
      });
		} else {
      redditRequest('https://www.reddit.com/r/' + args + '/top/.json?t=month&limit=100', err_message, false, args);
    }
	}

	if (cmd == `${prefix}rt`) {
    let err_message = 'Either this subreddit doe not exist, or it might be empty';
    if (args === void(0)) {
      var r = request.get('https://www.reddit.com/r/random/', function (err, res, body) {
        let sub = res.request.uri.href;
        sub = sub.substring(25);
        sub = sub.substring(0, sub.indexOf('/'));
        redditRequest('https://www.reddit.com/r/' + sub + '/top/.json?t=all&limit=1', err_message, true, sub);
      });
		} else {
      redditRequest('https://www.reddit.com/r/' + args + '/top/.json?t=all&limit=1', err_message, true, args);
    }
	}

	// if (cmd == `${prefix}rt`) {
	// 	request('https://www.reddit.com/r/' + args + '/top/.json?limit=1' + args, function (error, response, body) {}
  // }

	// if (cmd == `${prefix}rh`) {
	// 	request('https://www.reddit.com/r/' + args + '/hot/.json?limit=1' + args, function (error, response, body) {});
	// }

	// if (cmd == `${prefix}rr`) {
	// 	request('https://www.reddit.com/r/' + args + '/rising/.json?limit=1' + args, function (error, response, body) {});
	// }

	// if (cmd == `${prefix}rn`) {
	// 	request('https://www.reddit.com/r/' + args + '/new/.json?limit=1' + args, function (error, response, body) {});
	// }

  if (cmd == `${prefix}joke`) {
  	var choices = ['Jokes','dadjokes','cleanjokes'];
    var choices2 = ['month', 'all'];
	  var chosen = choices[Math.floor(Math.random()*3)];
	  var chosen2 = choices2[Math.floor(Math.random()*2)];
		request('https://www.reddit.com/r/' + chosen + '/top/.json?t=' + chosen2 + '&limit=100', function (error, response, body) {
			let json = JSON.parse(body);
			try {
					let randnum = Math.floor((Math.random() * 100) + 0);
					let selftext = json['data']['children'][randnum]['data']['selftext'];
					let title = json['data']['children'][randnum]['data']['title'];
					let redditlink = json['data']['children'][randnum]['data']['permalink'];
          // selftext = selftext.substring(0, selftext.indexOf('Edit:'));
          let jokEmbed = new Discord.MessageEmbed()
							  .setColor('#0099ff')
                .setTitle(title)
                .setDescription(selftext);
          if (showCallerEmbed) {
            jokEmbed.setFooter('[r/' + chosen + ' requested by ' + message.author.tag + ']', message.author.displayAvatarURL());
          }
					return message.channel.send({embeds: [jokEmbed]});
			} catch {
				let reEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle('⚠️ Error getting data')
					.setDescription(
						'Please contact zoe#4444 to report'
					)
				return message.channel.send({embeds: [reEmbed]});
			}
		});
	}

  if (cmd == `${prefix}pickupline`) {
    var choices = ['month', 'all'];
	  var chosen = choices[Math.floor(Math.random()*2)];
		request('https://www.reddit.com/r/pickuplines/top/.json?t=' + chosen + '&limit=100', function (error, response, body) {
			let json = JSON.parse(body);
			try {
				let randnum = Math.floor((Math.random() * 100) + 0);
				let selftext = json['data']['children'][randnum]['data']['selftext'];
				let title = json['data']['children'][randnum]['data']['title'];
				let redditlink = json['data']['children'][randnum]['data']['permalink'];
        // selftext = selftext.substring(0, selftext.toLowerCase.indexOf('edit:'));
        let pikEmbed = new Discord.MessageEmbed()
							.setColor('#0099ff')
              .setTitle(title)
              .setDescription(selftext);
        if (showCallerEmbed) {
          pikEmbed.setFooter('[r/' + chosen + ' requested by ' + message.author.tag + ']', message.author.displayAvatarURL());
        }
				return message.channel.send({embeds: [pikEmbed]});
			} catch {
				let reEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle('⚠️ Error getting data')
					.setDescription(
						'Please contact zoe#4444 to report'
					)
				return message.channel.send({embeds: [reEmbed]});
			}
		});
	}

  function redditRequest(requestLink, errorMessage, isTop, sub_reddit) {
    console.log('request link: ' + requestLink);
    request(requestLink, function (error, response, body) {
			let json = JSON.parse(body);
			try {
        let randnum;
        if (isTop) {
          randnum = 0;
        } else {
          randnum = Math.floor((Math.random() * 100) + 0);
        }
				let imgurl = json['data']['children'][randnum]['data']['url'];
				let title = json['data']['children'][randnum]['data']['title'];
				let selftext = json['data']['children'][randnum]['data']['selftext'];
				let redditlink = json['data']['children'][randnum]['data']['permalink'];
				request(imgurl, function (err, response, body) {
            console.log(imgurl  +  ' was requested');
            let finalurl
            try {
              finalurl = response.request.href
            } catch {
              finalurl = imgurl
            }
            let isImageUrl = isImage(finalurl);
            if (selftext != '' || isImageUrl) {
						  let reEmbed = new Discord.MessageEmbed()
							  .setColor('#0099ff')
                .setTitle('Posted on r/' + sub_reddit)
                .setDescription('[' + title + '](' + 'https://reddit.com' + redditlink + ')\n' + selftext);
              if (isImageUrl) {
                reEmbed.setImage(finalurl);
              }
              if (showCallerEmbed) {
                reEmbed.setFooter('[requested by ' + message.author.tag + ']', message.author.displayAvatarURL());
              }
						  return message.channel.send({embeds: [reEmbed]});
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
							'⚠️ Error getting data from ' + args
						)
					.setDescription(errorMessage);
				return message.channel.send({embeds: [reEmbed]});
			}
		});
  }

  if (cmd == `${prefix}poll`) {
    let string = message.content.substring(6);
    let pArgs = string.split(',');
    if (pArgs.length > 11) {
      let embedsay = new Discord.MessageEmbed()
                .setColor('#0099ff')
					      .setTitle('⚠️ Error generating poll')
					      .setDescription('Cannot have more than 10 options!');
            message.channel.send({embeds: [embedsay]});
    } else {
      try {
          let options = ""; let i; let counter = 0; let reactions = [];
          let emojiCharacters = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
          for (i = 1; i < pArgs.length; i++) {
            pArgs[i] = pArgs[i].trim();
            let hex = pArgs[i].codePointAt(0).toString(16);
            let emo = String.fromCodePoint("0x"+hex);
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
          let embedsay = new Discord.MessageEmbed()
            .setColor('0099ff')
            .setTitle(pArgs[0])
            .setDescription(options)
            .setFooter('poll by ' + message.author.tag,   message.author.displayAvatarURL())
            .setTimestamp();
          message.channel.send({embeds: [embedsay]}).then(embedMessage => {
            reactions.reduce((promise, emoji) => promise.then(() => embedMessage.react(emoji)), Promise.resolve());
          });
      } catch {
        let embedsay = new Discord.MessageEmbed()
          .setColor('#0099ff')
					.setTitle('⚠️ Error generating poll')
					.setDescription('``.poll title, option1, option2... `` To start a poll!');
          message.channel.send({embeds: [embedsay]});
      }
    }
  }

  if(cmd == `${prefix}rps`) {
    if (waitingForRPS === true) {
      message.channel.send('Wait for your turn.');
      return;
    }
		message.channel.send('Rock-Paper-Scissors? Bring it on.');
    waitingForRPS = true;
	  var delayInMilliseconds = 10000;
    RPStimer = setTimeout(function () { 
      if (waitingForRPS === true) {
        message.channel.send('I waited for you... are you scared?');
        waitingForRPS = false;
      }
	  }, delayInMilliseconds);
	}

  if (waitingForRPS === true) {
    if(cmd.toLowerCase() === 'rock' || cmd.toLowerCase() === 'paper' || cmd.toLowerCase() === 'scissors' || cmd.toLowerCase() === 'scissor') {
  		var choices = ['rock','paper','scissors'];
  		var userResponse = cmd.toLowerCase();
  		var userWins = false;
	  	var response = choices[Math.floor(Math.random()*3)];
	  	message.channel.send('I chose ' + response + '.');
	  	if(userResponse == 'paper') {
	  		if(response == 'rock') {
	  			message.channel.send('You won. Good for you.');
	  			userWins = true;
	  		} else if(response == 'scissors') {
	  			message.channel.send('You lost. As expected.');
	  		} else {
		  		message.channel.send('There was a tie. What a waste.');
	  		}
	  	}
		  if(userResponse == 'rock') {
		  	if(response == 'scissors') {
		  		message.channel.send('You won. Good for you.');
		  		userWins = true;
		  	} else if(response == 'paper') {
		  		message.channel.send('You lost. As expected.');
		  	} else {
		  	  message.channel.send('There was a tie. What a waste.');
		  	}
		  }
		  if(userResponse == 'scissor' || userResponse == 'scissors') {
		  	if(response == 'paper') {
	  			message.channel.send('You won. Good for you.');
  				userWins = true;
			  } else if(response == 'rock') {
			    message.channel.send('You lost. As expected.');
			  } else {
			  	message.channel.send('There was a tie. What a waste.');
			  }
		  }
      waitingForRPS = false;
      clearTimeout(RPStimer);
    }
  }
});

bot.login(process.env['TOKEN'])
