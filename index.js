const puppeteer = require('puppeteer');
const USERNAME = 'Strikeeagle2';
const PASSWORD = '1329043';

async function loginUser(page, user, pass) {
	await page.screenshot({
		path: 'example.png'
	});
	await page.waitForSelector('#signedOutHeaderBar');
	var btn = await page.evaluate(() => {
		var elms = document.getElementsByClassName('button lgn');
		elms[0].click();
	});
	await page.waitForSelector('#menuWindow');
	await page.screenshot({
		path: 'example.png'
	});
}

async function run() {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto('https://krunker.io/');
	await loginUser(page, USERNAME, PASSWORD);
	await browser.close();
};

run();