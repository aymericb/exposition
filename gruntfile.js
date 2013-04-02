module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        html: {
            options: {
                templateData: {
                    scripts: [
                        'js/<%= pkg.name %>.min.js'
                    ]
                }
            },
            index: {
                src: 'index.html',
                dest: 'build/index.html'
            },
            update: {
                src: 'update.html',
                dest: 'build/update.html'
            }
        },
        concat: {
            options: {
                // define a string to put between each file in the concatenated output
                separator: ';'
            },
            build: {
                // the files to concatenate
                src: ['js/*.js'],
                // the location of the resulting JS file
                dest: 'build/js/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'build/js/<%= pkg.name %>.js',
                dest: 'build/js/<%= pkg.name %>.min.js'
            }
        },
        copy: {
            build: {
                files: [
                    {src: ['php/**'], dest: 'build/'},
                    {src: ['css/**'], dest: 'build/'},
                    {src: ['doc/**'], dest: 'build/'},
                    {src: 'readme.md', dest: 'build/'}
                ]
            }
        }
    });

    grunt.registerMultiTask('html', 'Generate HTML files based on Handlebar templates.', function() {
        var Handlebars = require('handlebars');
        var options = this.options();
        var templateData = options.templateData || {};
        //grunt.log.writeln(this.target + ': ' + JSON.stringify(this.data));
        this.files.forEach(function(f) {
            grunt.log.writeln('Source file "' + f.src + '"');
            grunt.log.writeln('Dest file "' + f.dest + '"');
            var template = Handlebars.compile(grunt.file.read(f.src));
            grunt.file.write(f.dest, template(templateData));
        });
    });

    // Load plugins
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-copy');

    // Default task(s).
    grunt.registerTask('default', ['html', 'concat', 'uglify', 'copy']);

};