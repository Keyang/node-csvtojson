var fs = require('fs');
function fileToString (file) {
	return fs.existsSync(file) ? fs.readFileSync(file).toString() : '';
}
function overwriteFile (file, data) {
	if (fs.existsSync(file)) {
		fs.unlinkSync(file);
	}
	fs.writeFileSync(file, data);
}
function prependFile (file, data) {
	overwriteFile(file, data + fileToString(file));
}
function appendFile (file, data) {
	overwriteFile(file, fileToString(file) + data);
}
function prependLink (link) {
	prependFile('../node-csvtojson.wiki/links.txt', '![dependencies](' + link + ')\r\n');
}
function createFile (file) {
	overwriteFile(file, '');
}
module.exports = function (link) {
	var file = '../node-csvtojson.wiki/dependencies.md';
	if (link) {
		prependLink(link);
	}
	createFile(file);
	appendFile(file, fileToString('../node-csvtojson.wiki/dependencyHeader.txt'));
	appendFile(file, fileToString('../node-csvtojson.wiki/links.txt'));
};
