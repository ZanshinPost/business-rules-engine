// Generated on 2014-06-22 using generator-nodejs 2.0.0
module.exports = function (grunt) {
  grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      complexity: {
          generic: {
              src: ['src/**/*.js'],
              options: {
                  errorsOnly: false,
                  cyclometric: 6,       // default is 3
                  halstead: 16,         // default is 8
                  maintainability: 100,  // default is 100
                  breakOnErrors:false
              }
          }
      },
      jshint: {
          all: [
              'Gruntfile.js',
              'src/**/*.js'
          ],
          options: {
              jshintrc: '.jshintrc',
              force:false
          }
      },
      mochacli: {
          all: ['test/**/*.js'],
          options: {
              reporter: 'spec',
              ui: 'bdd'
          }
      },
      watch: {
          js: {
              files: ['**/*.js', '!node_modules/**/*.js'],
              tasks: ['default'],
              options: {
                  nospawn: true
              }
          }
      },
      ngdocs: {
          options: {
              dest: 'docs',
              //scripts: ['../app.min.js'],
              html5Mode: true,
              startPage: '/api',
              title: "Validation engine",
              //image: "path/to/my/image.png",
              imageLink: "http://my-domain.com",
              titleLink: "/api",
              bestMatch: true,
              analytics: {
                  account: 'UA-08150815-0',
                  domainName: 'my-domain.com'
              },
              discussions: {
                  shortName: 'my',
                  url: 'http://my-domain.com',
                  dev: false
              }
          },
          tutorial: {
              src: ['content/tutorial/*.ngdoc'],
              title: 'Tutorial'
          },
          api: {
              src: ['validation/**/*.js'],
              title: 'API Documentation'
          }
      },
      typedoc: {
          build: {
              options: {
                  module: 'commonjs',
                  out: './docs',
                  name: 'ValidationEngine',
                  target: 'es5'
              },
              src: ['src/validation/*','src/customValidators/*']
          }
      },
      typescript: {
          amd: {
              src: ['src/validation/*.ts'],
              dest: 'dist/amd',
              options: {
                  basePath: 'src/validation',
                  module: 'amd',
                  target: 'es5',
                  comments:false
              }
          },
          commonjs: {
              src: ['src/validation/*.ts'],
              dest: 'dist/commonjs',
              options: {
                  basePath: 'src/validation',
                  module: 'commonjs',
                  target: 'es5',
                  comments:false
              }
          },
          customValidatorsCommonjs: {
              src: ['src/customValidators/*.ts'],
              dest: 'dist/commonjs',
              options: {
                  basePath: 'src/customValidators',
                  module: 'commonjs',
                  target: 'es5',
                  comments:false
              }
          },
          customValidatorsAmd: {
              src: ['src/customValidators/*.ts'],
              dest: 'dist/amd',
              options: {
                  basePath: 'src/customValidators',
                  module: 'amd',
                  target: 'es5',
                  comments:false
              }
          },
          typings:{
              src: ['src/validation/Validation.ts','src/validation/Utils.ts'],
              dest: 'typings/node-form',
              options: {
                  basePath: 'src/validation',
                  module: 'commonjs',
                  target: 'es5',
                  declaration: true,
                  comments:false
              }
          },
          otherTypings: {
              src: ['src/validation/BasicValidators.ts'],
              dest: 'typings/node-form',
              options: {
                  basePath: 'src/validation',
                  module: 'commonjs',
                  target: 'es5',
                  declaration: true,
                  comments:false
              }
          },
          customValidatorsTypings: {
              src: ['src/customValidators/*.ts'],
              dest: 'typings/node-form',
              options: {
                  basePath: 'src/customValidators',
                  module: 'commonjs',
                  target: 'es5',
                  declaration: true,
                  comments:false
              }
          },
          src:{
              src: ['src/**/*.ts'],
              dest: '',
              options: {
                  module: 'commonjs',
                  target: 'es5',
                  declaration: false,
                  comments:false
//                  noImplicitAny:false,
//                  ignoreError:true
              }
          },
          test:{
              src: ['test/**/*.ts'],
              dest: '',
              options: {
                  module: 'commonjs',
                  target: 'es5',
                  declaration: false,
                  comments:false
//                  noImplicitAny:false,
//                  ignoreError:true
              }
          }
      },
      uglify: {
          options: {
              // the banner is inserted at the top of the output
              banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
          },
          dist: {
              files: {
                  'dist/<%= pkg.name %>.min.js': ['<%= typescript.base.dest %>'],
                  'dist/node-<%= pkg.name %>.min.js': ['dist/node-<%= pkg.name %>.js']
              }
          }
      },
      copy: {
          main: {
              files: [
                  // includes files within path
                  {expand: true, src: ['src/localization/*.js'], dest: 'dist/i18n', filter: 'isFile',flatten:true},
                  {expand: true, src: ['dist/commonjs/*.js'], dest: 'dist/module', filter: 'isFile',flatten:true}
                  //{expand: true, src: ['src/customValidators/*.js'], dest: 'dist/customValidators', filter: 'isFile',flatten:true}
              ],
              options: {
                  process: function (content, srcpath) {
                      content = content.replace(/.*require.*/g,"");
                      return content.replace(/module.exports.*/g,"");
                  }
              }
          }
      },
      concat: {
        typings:{

              options:{
                  banner: '// Type definitions for node-<%= pkg.name %> - v<%= pkg.version %>\n' +
                      '// Project: https://github.com/rsamec/form\n' +
                      '// Definitions by: Roman Samec <https://github.com/rsamec>\n' +
                      '// Definitions: https://github.com/borisyankov/DefinitelyTyped\n\n',
                  process: function(src, filepath) {
                      return '// Source: ' + filepath + '\n' +
                          src.replace(/[ \t]*export = (\w*);?/g, 'declare module "node-form" {export = $1;}');
                  }
              },
              files: {
                  'typings/node-form/node-form.d.ts': ['typings/node-form/Validation.d.ts']
              }
          },
          otherTypings:{

              options:{
                  process: function(src, filepath) {
                      return '// Source: ' + filepath + '\n' +
                          src.replace(/[ \t]*export = (\w*);?/g, 'declare module "node-$1" {export = $1;}');
                  }
              },
              files: {
                  'typings/node-form/BasicValidators.d.ts': ['typings/node-form/BasicValidators.d.ts'],
                  'typings/node-form/Utils.d.ts': ['typings/node-form/Utils.d.ts']

              }
          }
      }
  });

  grunt.loadNpmTasks('grunt-complexity');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-ngdocs');
  grunt.loadNpmTasks('grunt-typedoc');
  grunt.loadNpmTasks('grunt-typescript');
  grunt.loadNpmTasks('grunt-contrib-commands');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-run');


  grunt.registerTask('test', ['typescript:src','typescript:test', 'mochacli', 'watch']);
  grunt.registerTask('ci', ['complexity', 'jshint', 'mochacli']);
  grunt.registerTask('dist', ['typescript:commonjs','typescript:amd','typescript:customValidatorsCommonjs','typescript:customValidatorsAmd','copy']);
  grunt.registerTask('typings',['typescript:typings','concat:typings','typescript:otherTypings','typescript:otherTypings']);
  grunt.registerTask('document', ['typedoc']);
};