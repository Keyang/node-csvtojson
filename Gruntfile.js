module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.initConfig({
		jshint: {
			files: ['Gruntfile.js', 'libs/**/*.js', 'test/data/*.js', 'bin/csvtojson', 'bin/csvtojson.js'],
			options: {
				'globals': {
					// Add things that are global but not defined by js nativly. Note that standard node globals are already defined.
				},
				// see the docs for full list of options http://jshint.com/docs/options/
				'bitwise': true,
				'curly': true,
				'eqeqeq': true,
				'forin': true,
				'freeze': true,
				'funcscope': true,
				'futurehostile': true,
				'latedef': true,
				'maxcomplexity': 10, // arbitrary but anything over 10 quickly becomes hard to think about
				'maxdepth': 3, // also arbitrary. Deeply nested functions should be refactored to use helper functions.
				'maxparams': 4, // arbitrary. Consider using an object literal instead of list of params.
				'nocomma': true,
				//'nonew': true, // In the future when all objects are refactored to avoid new.
				//'strict': true, // in the future when all functions are closer to adhering to strict.
				'notypeof': true,
				'undef': true,
				'unused': true,
				'node': true // defines node globals
			}
		},
    mochaTest:{
      src:["test/test*.js"]
    }
	});
	grunt.registerTask('default', ['jshint']);
	grunt.registerTask('test:unit', ['mochaTest']);
	grunt.registerTask('test', ['test:unit']);
};
