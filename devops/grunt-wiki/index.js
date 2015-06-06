var fs = require('fs');
var madge = require('../runMadge.js');
var upload = require('../uploadImage.js');
var compile = require('../compileDependencies.js');
module.exports = function (grunt) {
	grunt.registerTask('wiki', 'Add a new dependency image to the wiki', function () {
		var done = this.async();
		if (!fs.existsSync('../node-csvtojson/')) {
			grunt.log.writeln('Wiki repo is not in the parent of the main repository');
			grunt.log.error('The structure should be');
			grunt.log.writeln('/.../repoParent/');
			grunt.log.writeln('/.../repoParent/node-csvtojson/');
			grunt.log.writeln('/.../repoParent/node-csvtojson.wiki/   # this is missing');
			grunt.fail.warn('Cannot update the wiki if its not there. Go up to repoParent and clone the wiki');
			done(false);
		}
		madge(function (err) {
			if (err) {
				grunt.log.error('2 possible issues');
				grunt.log.error('npm install -g madge');
				grunt.log.error('install graphviz and ensure it is in the $PATH or %PATH% env var. http://www.graphviz.org/');
				done(false);
			} else {
				upload(function (link) {
					if (!link) {
						grunt.log.error('Could not upload image. Check connection and try again.\n' +
										'If issue persists contact a maintainer. The imgur key is likely to be out of date.');
						done(false);
					}
					grunt.log.ok('Image has been uploaded to: ' + link);
					compile(link); // updated wiki repo
					grunt.log.ok('Go to the other repository to push the new file.');
					done(true);
				});
			}
		});
	});
};