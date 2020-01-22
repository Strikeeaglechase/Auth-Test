const puppeteer = require('puppeteer');
const USERNAME = 'Strikeeagle2';
const PASSWORD = '1329043';

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
	await page.screenshot({
		path: 'example.png'
	});
}

async function runGameLoginTest() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://krunker.io/');
	await loginUser(page, USERNAME, PASSWORD);
	await browser.close();
};

async function loginSocial(page, user, pass) {
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

	var btn = await page.evaluate(() => {
		var elms = document.getElementsByClassName('accountButton');
		elms[0].click();
	});

	await page.waitForSelector('#popupHolder', {
		visible: true
	});
	await page.screenshot({
		path: 'example.png'
	});
}

async function run(user) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://krunker.io/social.html?p=profile&q=' + user);
	await loginSocial(page, USERNAME, PASSWORD);
	await browser.close();
};


run('Strikeeaglekid');