module.exports = {
	tags: ['sample'],
	'Sample test': function(client) {
		client
			.url('https://google.com')
			.verify.title('Google')
			.end()
	}
};