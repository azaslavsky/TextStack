module.exports = {
	tags: ['sample'],
	'Sample test': function(client) {
		client
			.url('https://google.com')
			.assert.title('Google')
			.pause(1000)
			.end()
	}
};