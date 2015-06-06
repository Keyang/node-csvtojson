var exec = require('child_process').exec;
function madge (cb) {
	exec('madge -x "node_modules|util|stream|os|assert|fs|http|child_process" -i graph.png ./', function (err) {
		if (err) {
			console.log('could not run madge: ' + err);
		}
		cb(err);
	});
}
module.exports = madge;
if (!module.parent) {
	madge();
}