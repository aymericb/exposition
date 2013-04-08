//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/*global module:false, require:false, process:false */
module.exports = function(grunt) {

    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        html: { /* Custom task, see below */
            build: {
                options: {
                    templateData: {
                        scripts: grunt.file.expand('js/*.js'),
                        stylesheet: 'css/exposition-<%= pkg.version %>.css'
                    }
                },
                files: [
                    {src: ['*.html'], dest: 'build/'}
                ]
            },
            release: {
                options: {
                    templateData: {
                        stylesheet: 'css/exposition-<%= pkg.version %>.min.css',
                        scripts: [
                            'js/<%= pkg.name %>-<%= pkg.version %>.min.js'
                        ]
                    }
                },
                files: [
                    {src: ['*.html'], dest: 'build/'}
                ]
            }
        },
        concat: {
            options: {
                separator: ';'
            },
            release: {
                src: ['js/*.js'],
                dest: 'build/js/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        uglify: {
            options: {
                banner: '<%= pkg.copyright_notice %>'
            },
            release: {
                src: 'build/js/<%= pkg.name %>-<%= pkg.version %>.js',
                dest: 'build/js/<%= pkg.name %>-<%= pkg.version %>.min.js'
            }
        },
        jshint: {
            files: ['gruntfile.js', 'js/*.js', 'build/*.js', '!*/spin.js'],
            options: {
                eqeqeq: true,
                browser: true,
                jquery: true,
                globals: {
                    console: false
                }
            }
        },
        copy: {
            build: {
                files: [
                    {src: ['js/**'], dest: 'build/'}
                ]
            },
            release: {
                files: [
                    {src: ['php/**'], dest: 'build/'},
                    {src: ['css/**', '!**/*.less'], dest: 'build/'},
                    {src: ['doc/**'], dest: 'build/'},
                    {src: 'readme.md', dest: 'build/'},
                    {src: 'htaccess', dest: 'build/.htaccess'}
                ]
            }
        },
        clean: {
            // Avoid deleting the 'build' directory, which is an SSHFS mount point on my dev machine
            build: ['build/**', '!build', 'release']
        },
        watch: {
            files: ['js/*.js', 'php/**/*.php', 'css/*.less', '*.html'],
            tasks: ['default']
        },
        compress: {
            release: {
                options: {
                    archive: 'release/<%= pkg.name %>-<%= pkg.version %>.tar.gz',
                    mode: 'tgz'
                },
                files: [
                    {expand: true, cwd: 'build/', src: ['**', '.htaccess'] }
                ]
            }
        },
        cssmin: {
            release: {
                options: {
                    banner: '<%= pkg.copyright_notice %>'
                },
                files: [
                    {src: 'build/css/exposition-<%= pkg.version %>.css', dest: 'build/css/exposition-<%= pkg.version %>.min.css'}
                ]
            }
        },
        less: {
            build: {
                files: [
                    {src: 'css/exposition.less', dest: 'build/css/exposition-<%= pkg.version %>.css'}
                ]
            }
        }
    });

    // Custom task
    // Generate HTML from Handlebar template. Dynamically add <script> statements.
    // Code adapted from grunt-contrib-copy
    grunt.registerMultiTask('html', 'Generate HTML files based on Handlebar templates.', function() {
        var Handlebars = require('handlebars');
        var path = require('path');
        var options = this.options();
        var templateData = options.templateData || {};
        //grunt.log.writeln(this.target + ': ' + JSON.stringify(this.data));

        var unixifyPath = function(filepath) {
            if (process.platform === 'win32') {
                return filepath.replace(/\\/g, '/');
            } else {
                return filepath;
            }
        };
        this.files.forEach(function(filePair) {

            var isExpandedPair = filePair.orig.expand || false;
            filePair.src.forEach(function(src) {
                var dest;
                if (grunt.util._.endsWith(filePair.dest, '/')) {
                    dest = (isExpandedPair) ? filePair.dest : unixifyPath(path.join(filePair.dest, src));
                } else {
                    dest = filePair.dest;
                }
                grunt.log.writeln('Generating: "'+dest+'"');
                var template = Handlebars.compile(grunt.file.read(src));
                grunt.file.write(dest, template(templateData));
            });
        });
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');

    // Default tasks
    grunt.registerTask('default', ['html:build', 'jshint', 'less', 'copy']);
    grunt.registerTask('release', ['clean', 'html:release', 'concat', 'uglify', 'jshint', 'copy:release', 'less', 'cssmin', 'compress']);

};