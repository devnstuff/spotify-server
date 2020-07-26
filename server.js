const express = require('express');
const request = require('request');
const querystring = require('querystring');
require('dotenv').config();
const app = express();

if (process.env.NODE_ENV === 'development') {
	const frontend_uri = process.env.FRONTEND_URI || 'http://localhost:8080';

	app.get('/login', (req, res) => {
		res.redirect(
			'https://accounts.spotify.com/authorize?' +
				querystring.stringify({
					response_type: 'code',
					client_id: process.env.CLIENT_ID,
					scope: process.env.SCOPES,
					redirect_uri: process.env.REDIRECT_URI,
				})
		);
	});

	app.get('/callback', (req, res) => {
		const code = req.query.code || null;
		const authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code,
				redirect_uri: process.env.REDIRECT_URI,
				grant_type: 'authorization_code',
			},
			headers: {
				Authorization: `Basic ${new Buffer.from(
					`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
				).toString('base64')}`,
			},
			json: true,
		};
		request.post(authOptions, (error, response, body) => {
			if (!error && response.statusCode === 200) {
				const access_token = body.access_token;
				const refresh_token = body.refresh_token;

				res.redirect(
					frontend_uri + '?access_token=' + access_token + '&refresh_token=' + refresh_token
				);
			} else {
				console.log('Error, invalid token');
			}
		});
	});
}

app.get('/refresh_token', (req, res) => {
	const refresh_token = req.query.refresh_token;
	const authOptions = {
		url: 'https://accounts.spotify.com/api/token',
		headers: {
			Authorization: `Basic ${new Buffer.from(
				`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
			).toString('base64')}`,
		},
		form: {
			grant_type: 'refresh_token',
			refresh_token,
		},
		json: true,
	};
});

app.listen(process.env.PORT, () =>
	console.log(`Server is up and running on PORT: ${process.env.PORT}`)
);
