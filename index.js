import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import '@playwright/browser-firefox';
import { firefox } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;
const FLAG = process.env.FLAG;

let users = new Map();

app.use(cors());
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	if(!req.cookies.sessiontoken) {
		let id = `user-${Math.random().toString(36).slice(2)}`;
		users.set(id, null);
		res.cookie('sessiontoken', id);
	}

	if(req.cookies.sessiontoken === FLAG) {
		res.send('you win! :)');
		return;
	}

	res.sendFile(__dirname + '/public/index.html');
});

app.use('/', express.static(__dirname + '/public'));

app.post('/submit_link', (req, res) => {
	if(req.body.link) {
		if(req.body.link.length > 255) return res.json({error: 'too long (less than 255 characters allowed)'});
		if(!req.cookies.sessiontoken) return res.json({error: 'invalid user session token cookie'});

		users.set(req.cookies.sessiontoken, req.body.link);

		console.log(users);

		res.json({ success: true });
	}
});

async function clickUserLinks() {
	const browser = await firefox.launch();

	for (const [token, link] of users) {
		if(!link) continue;

		const page = await browser.newPage();
		console.log('created page');
		await page.goto('http://localhost:' + port + '/');
		console.log('at page', );
		await page.evaluate(({link, FLAG}) => {
			document.cookie = 'sessiontoken=' + FLAG;
			location.href = link;
		}, {link, FLAG});

		await sleep(1000);

		console.log('ran code');
		await page.close();
	}

	users = new Map();

	await browser.close();
}

async function startReviewingLinks() {
	console.log('Reviewing new links....', users);
	await clickUserLinks();
	console.log('Finished reviewing links.');
	setTimeout(() => startReviewingLinks(), 10000);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

startReviewingLinks();

app.listen(port, () => {
	console.log('listening on port ' + port);
});