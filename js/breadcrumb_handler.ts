//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="item.ts" />
/// <reference path="common.ts" />
/// <reference path="config.ts" />
/// <reference path="../lib/jquery.d.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {

    /**
     * BreadcrumbHandler class
     *
     * The BreadcrumbHandler class handles the display and event handling for the
     * navigation breadcrumb.
     *
     *
     */
    export class BreadcrumbHandler {

        // Private members
        private TITLE;
        private config;
        private div;

        /** 
         * Constructor
         * @param div       Breadcrumb div
         * @param config    Config object used to read the gallery name        
         */
        constructor(div: JQuery, config: Config) {
    		// Preconditions
            assert(div && div.length===1);

            this.TITLE = config.galleryName();
            this.div = div;
            this.config = config;

            this.onLoadPath = new Signal();
        }

        //
        // Public methods
        //

        /** Update the breadcrumb with current path */
        public setPath(path: string) {

            // Preconditions
            assert(path);
            assert(path.charAt(0) === '/');

            // Create root element
            this.div.empty();
            var root_el = $('<div>').addClass('title').addClass('subpath').text(this.TITLE);
            root_el.click(() => { this.onLoadPath.fire('/'); });
            this.div.append(root_el);

            // Helper (do not create functions in loop)
            var click_handler = (clicked_path: string) => {
                return () => {
                    this.onLoadPath.fire(clicked_path);
                };
            };
            var on_title_failed = (path: string) => {
                return (jqXHR: JQueryXHR, textStatus: string, error) => {
                    var msg = 'Cannot determine title for "'+path+'"';
                    if (textStatus)
                        msg += '  '+textStatus;
                    if (error && error.message)
                        msg += '  '+error.message;
                    console.error(msg);
                };
            };
            var on_title_success = (el: JQuery) => {
                return (item: Item) => {
                    el.text(item.title());
                };
            };

            // Iterate on subpaths
            if (path === '/')
                return;
            var components = path.substr(1).split('/');
            var current_path = '';
            for (var i=0; i<components.length; ++i) {
                var el_separator = $('<div>').addClass('separator');
                current_path += '/' + components[i];
                var el_component = $('<div>').addClass('subpath'); //.text(components[i]);
                el_component.click(click_handler(current_path));
                Item.Load(this.config, current_path,
                    on_title_success(el_component), on_title_failed(current_path));
                this.div.append(el_separator);
                this.div.append(el_component);
            }


        };

        //
        // Public signals
        //

        /** onLoadPath(path)    -> path {string} the path to load. */
        public onLoadPath;

    };

} // module Exposition

// JavasScript compatibility
ph.barthe.BreadcrumbHandler = Exposition.BreadcrumbHandler;