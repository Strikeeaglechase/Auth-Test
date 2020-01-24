const db = new(require('./simple-db.js'))();
const puppeteer = require('puppeteer');
const Discord = require('discord.js');
const config = require('dotenv').config().parsed
db.init({
	users: [],
	waitingCodes: []
});

const client = new Discord.Client();

const PREFIX = 'c!'
const TOKEN = config.TOKEN;
const USERNAME = config.USERNAME;
const PASSWORD = config.PASSWORD;
const allowedRate = 1000 * 60 * 30;
const CODE_TIMEOUT = 1000 * 60 * 30;
const CODE_LEN = 10;

function genCode() {
	const charList = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');
	var code = '';
	while (code.length < CODE_LEN) {
		code += charList[Math.floor(Math.random() * charList.length)];
	}
	return code;
}

async function loginUser(page, user, pass) {
	await page.waitForSelector('#signedOutHeaderBar');
	var btn = await page.evaluate(() => {
		var elms = document.getElementsByClassName('button lgn');
		elms[0].click();
	});

	await page.waitForSelector('#accName');
	const userBox = await page.$('#accName');
	const passBox = await page.$('#accPass');
	await userBox.click();
	await page.keyboard.type(user);
	await passBox.click();
	await page.keyboard.type(pass);
	var btn = await page.evaluate(() => {
		var elms = document.getElementsByClassName('accountButton');
		elms[1].click();
	});

	await page.waitForFunction((u) => {
		var elm = document.getElementById('menuAccountUsername');
		if (elm && elm.innerText) {
			return elm.innerText.toLowerCase() == u.toLowerCase();
		}
		return false;
	}, {}, user);
}

async function runGameLoginTest() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://krunker.io/');
	await loginUser(page, USERNAME, PASSWORD);
	await browser.close();
};

async function loginSocial(page, user, pass) {
	await page.screenshot({
		path: 'example2.png'
	});
	await page.waitForSelector('#profileLogin');
	var loginBtn = await page.$('#profileLogin');
	await loginBtn.click();

	await page.waitForSelector('#accName');
	const userBox = await page.$('#accName');
	const passBox = await page.$('#accPass');
	await userBox.click();
	await page.keyboard.type(user);
	await passBox.click();
	await page.keyboard.type(pass);

	await page.evaluate(() => {
		var elms = document.getElementsByClassName('accountButton');
		elms[0].click();
	});

	await page.waitForFunction((u) => {
		var elm = document.getElementById('profileName');
		if (elm && elm.innerText) {
			return elm.innerText.split('\n')[0].toLowerCase() == u.toLowerCase();
		}
		return false;
	}, {}, user);
}

async function sendUserMsg(user, msg) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://krunker.io/social.html?p=profile&q=' + user);
	await loginSocial(page, USERNAME, PASSWORD);

	await page.evaluate(() => {
		var elms = document.getElementsByClassName('giftButton');
		elms[0].click();
	});
	const giftFeild = await page.$('#giftIn');
	const msgFeild = await page.$('#giftMsg');
	const giftBtn = await page.$('#postSaleBtn');

	await giftFeild.click();
	await page.keyboard.type('10');
	await msgFeild.click();
	await page.keyboard.type(msg);
	await new Promise(res => setTimeout(res, 3000));
	await page.screenshot({
		path: 'example.png'
	});

	await browser.close();
};

async function bindAccount(message, kAccount) {
	db.read();
	var dbUser = db.get('users', 'id', message.author.id);
	if (!dbUser) {
		dbUser = {
			id: message.author.id,
			lastRanCommand: 0,
			krunkerAccount: undefined
		}
		db.data.users.push(dbUser);
		db.write();
	}
	if (Date.now() - dbUser.lastRanCommand < allowedRate) {
		var minLeft = (allowedRate - (Date.now() - dbUser.lastRanCommand)) / (1000 * 60);
		message.reply('You have ran that command too many times. Try again in ' + Math.ceil(minLeft) + ' mins');
		return;
	}
	const confirmMsg = await message.channel.send('Please confirm ``' + kAccount + '`` is the correct krunker account (You can only do this once every thirty mins)');
	await Promise.all([
		confirmMsg.react('✔'),
		confirmMsg.react("❌")
	]);
	var confirmed = false;
	try {
		const filter = (m, user) => user.id == message.author.id;
		const collected = await confirmMsg.awaitReactions(filter, {
			max: 1,
			time: 30000
		});
		const reaction = collected.first();
		if (reaction) {
			confirmed = reaction.emoji.name == '✔';
		}
	} catch (e) {
		console.log(e);
	}
	if (confirmed) {
		db.read();
		var u = db.get('users', 'id', message.author.id);
		var d = Date.now();
		u.lastRanCommand = d;
		var code = genCode();
		db.data.waitingCodes.push({
			code: code,
			t: d,
			account: kAccount,
			valid: true
		});
		db.write();
		message.reply('Please check your krunker account for the code (This may take a minute to send. The code will expire in 30min)');
		sendUserMsg(kAccount, code);
		console.log('Sent %s the code %s', kAccount, code);
	}
}

function finishBind(message, code) {
	db.read();
	var c = db.get('waitingCodes', 'code', code);
	var user = db.get('users', 'id', message.author.id, true);
	if (c && user && c.valid) {
		user.krunkerAccount = c.account;
		c.valid = false;
		db.write();
		message.reply('Your account has been linked to ``' + c.account + '``');
	} else {
		message.reply('Invalid code');
	}
}

client.on('ready', () => {
	console.log('Logged');
});

client.on('message', message => {
	if (!message.content.startsWith(PREFIX)) {
		return;
	}
	var args = message.content.substring(PREFIX.length).split(' ');
	if (args[0] == 'bindAccount') {
		bindAccount(message, args[1]);
	}
	if (args[0] == 'code') {
		finishBind(message, args[1]);
	}
});

client.login(TOKEN);

setInterval(() => {
	db.read();
	db.data.waitingCodes = db.data.waitingCodes.filter(c => Date.now() - c.t < CODE_TIMEOUT && c.valid);
	db.write();
}, 60 * 1000);
// run('Strikeeaglekid');