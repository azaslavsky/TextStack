var HtmlReporter = require('nightwatch-html-reporter');
var reporter = new HtmlReporter({
	openBrowser: false,
	reportsDirectory: __dirname + '../../../results/e2e/',
	reportFilename: 'chrome.html',
	themeName: 'compact'
});
module.exports = {
	reporter: reporter.fn
};