
# Build Instructions

The server side code of Exposition is written in PHP and requires no processing. It can be copied to the web server directly. However the client side code, which is composed of HTML, CSS and Javascript, needs to be processed by the following [Grunt](http://gruntjs.com) toolchain.

To produce an Exposition package from the source:

1. Install [node.js](http://nodejs.org) and [NPM](https://npmjs.org).

  There are many ways to achieve this. Personally I use [MacPorts](http://www.macports.org) to install all external packages on MacOS X. 

        sudo port install nodejs
        sudo port install npm

2. Install [Grunt](http://gruntjs.com)  globally with NPM.

  Beware the current version of the package is **grunt-cli** and not **grunt**.

        sudo npm install -g grunt-cli

3. Get the source code of Exposition.

  You may either download a tarball from the  [github page](https://github.com/aymericb/exposition) or use GIT directly. You should consider the **master** as branch stable, and **develop** as unstable but usually working. The **develop** branch will be rebased often, so it is not a good idea to fork it.

        git clone https://github.com/aymericb/exposition.git Exposition
        cd Exposition

4. Install local Grunt dependencies.

  Your local directory must be the root directory of the source package containing the **package.json** file.

        sudo npm install

5. Run Grunt.

  * `grunt release` produces a production ready tar.gz package. The javascript and CSS are minified.
  * `grunt` performs an incremental build. Javascript files are not minified. Best for development and debugging.
  * `grunt clean` cleans the *build* directory. Used by *grunt release*.
  * `grunt watch` watches for source files and automatically trigger the default grunt build, when changes are detected.



