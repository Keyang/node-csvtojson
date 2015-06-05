var exec = require('child_process').exec;
function madge () {
	exec('madge -x "node_modules|util|stream|os|assert|fs|http|child_process" -i graph.png ./', function (err, stdout, stderr) {
		if (err) {
			console.log('could not run madge: ' + err);
		}
	});
}
module.exports = madge;
if (!module.parent) {
	madge();
}