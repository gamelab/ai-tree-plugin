module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig( {
		pkg: grunt.file.readJSON( "package.json" ),

		BASE_PATH: "",
		DEVELOPMENT_PATH: "",

		yuidoc: {
			compile: {
				name: "<%= pkg.name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",
				options: {
					extension: ".js",
					paths: "<%= DEVELOPMENT_PATH %>" + "src/",
					outdir: "<%= BASE_PATH %>" + "docs/"
				}
			}
		},

		uglify: {
			build: {
				files: {
				"src/<%= pkg.name %>-<%= pkg.version %>.min.js":
					[ "<%= pkg.main %>" ]
				}
			}
		},
 
		copy: {
			whole: {
				src: ["src/**", "examples/**", "docs/**", "README.md"],
				dest: "dist/<%= pkg.name %>-<%= pkg.version %>/"
			}
		},

		jshint: {
			src: "src/<%= pkg.name %>-<%= pkg.version %>.js",
			options: {
				camelcase: true,
				curly: true,
				eqeqeq: true,
				eqnull: true,
				newcap: true,
				quotmark: "double"
			}
		}

	});

	grunt.loadNpmTasks( "grunt-contrib-uglify" );
	grunt.loadNpmTasks( "grunt-contrib-yuidoc" );
	grunt.loadNpmTasks( "grunt-contrib-copy" );
	grunt.loadNpmTasks( "grunt-contrib-jshint" );

	grunt.registerTask( "default", [ "jshint", "uglify:build" ] );
	grunt.registerTask( "full", [ "jshint", "uglify:build",
		"yuidoc:compile", "copy:whole" ] );
};
