var fs = require('fs');
var imgur = require('imgur');
imgur.setClientId('cd05c9c57e5fbec');
function uploadImage(cb, file) {
	file = file || 'graph.png';
	if (fs.existsSync(file)) {
		imgur.uploadFile(file).then(function (json) {
			cb(json.data.link);
		}).catch(function () {
			console.err('Error upload graph.png make sure you run the madge command from the wiki');
			process.exit(1);
		});
	} else {
		cb(null);
	}
}
module.exports = uploadImage;

if (!module.parent) {
	uploadImage(function (link) {
		console.log(link || 'cannot find file');
	});
}