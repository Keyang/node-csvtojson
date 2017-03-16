/*
	GRUNT instructions
	1. ensure you have dependencies installed run `npm install` in the root directory of the repo to get dev dependencies
	2. run `grunt` in root dir of the repo in a shell to get the watcher started
		The watcher looks at files. When a file is added or changed it passes the file through jshint
	3. run `grunt test` to execute all unit tests and get output
	4. run `grunt jshint` to pass all files through linter

	MADGE instructions
	1. run `npm install -g madge` to get madge executable
	2. Insure graphviz is installed and the bin folder is in your path.
	3. run `madge -x "node_modules|util|stream|os|assert|fs|http" -i graph.png ./` to generate graph.png
		which is the dependency graph for the current build.
*/

module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.loadTasks('./devops/grunt-wiki');
  var files = ['Gruntfile.js', 'libs/**/*.js', 'libs/**/**/*.js', 'test/*.js', 'bin/csvtojson',
    'bin/csvtojson.js', 'devops/*.js'
  ];
  grunt.initConfig({
    uglify: {
      client: {
        options: {
          mangle: true,
          banner: "/*Automatically Generated. Do not modify.*/\n"
        },
        src: "./dist/csvtojson.js",
        dest: "./dist/csvtojson.min.js",
      }
    },
    browserify: {
      dist: {
        src: "./browser_index.js",
        dest: "./dist/csvtojson.js"
      }
    },
    jshint: {
      all: {
        src: files,
        options: {
          'globals': { // false makes global variable readonly true is read/write
            'describe': false,
            'it': false
          },
          // see the docs for full list of options http://jshint.com/docs/options/
          'bitwise': true,
          'curly': true,
          'eqeqeq': true,
          'forin': true,
          'freeze': true,
          'funcscope': true,
          'futurehostile': true,
          'latedef': false,
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
      }
    },
    mochaTest: {
      test: {
        src: [files[3]]
      }
    },
    watch: {
      files: files,
      tasks: ['newer:jshint:all', 'mochaTest'],
      options: {
        spawn: false,
        event: ['changed', 'added']
      }
    },
    wiki: {},
  });
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('test', ['mochaTest']);
  grunt.registerTask("build:browser",["browserify:dist","uglify:client"]);
};
