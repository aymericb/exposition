//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="../lib/jquery.d.ts" />
/// <reference path="../lib/spin.d.ts" />
/// <reference path="common.ts" />
/// <reference path="config.ts" />
/// <reference path="item.ts" />
/// <reference path="photo_controller.ts" />
/// <reference path="album_controller.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/


module Exposition {

    export interface ApplicationDivs {
        main: JQuery;
        breadcrumb: JQuery;
        page_handler: JQuery;
        page_handler_left: JQuery;
        page_handler_center: JQuery;
        page_handler_right: JQuery;
        btn_download: JQuery;
    }

    /**
     * Application Singleton
     *
     * Constructor parameters
     * - divs An object containing all the necessary divs as properties
     *      - main                  -> main display area
     *      - breadcrumb            -> breadcrumb section
     *      - page_handler          -> display area for page handling ui
     *      - page_handler_left     -> previous page arrow
     *      - page_handler_center   -> "page x/y" display
     *      - page_handler_right    -> next page arrow
     */
    export class Application {


        //
        // Private members
        //
        private config: Config;

        private path: string;                           // Current album or item path
        private item: Item;                             // Current item (class Item)
        private loading_timer;                          // Timer use to delay showing the loading box
        private loading_spinner;                        // ph.barthe.Spinner object

        private divs;                                   // Divs used for display
        private main_div;                               // Main div used for rendering

        private view;                                   // Current view
        private page_handler: PageHandler;
        private breadcrumb_handler: BreadcrumbHandler;
        private first_push_state=true;                  // HTML 5 history

        //
        // Private Functions
        //

        /**
         * Notify the user of a global failure
         * @param _friendly_message {string}  Message shown to the end user
         * @param error {Error}               Exception object
         */
        private onFatalError(_friendly_message: string, error) {
            // Extract error information
            var friendly_message = friendly_message || 'An unexpected error has occurred';
            var log = friendly_message;
            if (error && ('message' in error))
                log += " Reason: " + error.message;
            console.error(log);

            // Show GUI
            this.hideLoading();
            var error_div = $('#error');
            if (error_div.length === 0) {
                error_div = $('<div>');
                error_div.attr('id', 'error');
                this.main_div.append(error_div);
            }
            error_div.html('<p>Error</p><p>'+_friendly_message+'</p>');
        };

        /** 
         * Create a success callback for loadPath().
         *
         * The callback is responsible for creating the internal view this.view, updating 
         * the page handler, breadcrumb and toolbar.
         *
         * @param {string} path           The virtual path of the item to display (album or photo)
         * @param {bool} push_state       Optional. Default true. Whether the state should be
         *   be pushed to the browser history. Typically false when handling popstate event.
         * 
         * @return A callback function({Item} path)
         *
         * Does not throw
         */
        private onPathLoaded(path: string, push_state: bool) : (item: Item) => void {
            // Precondition
            assert(path);

            return (item: Item) => {
                // Precondition
                assert(item);

                // Handle internal errors.
                try {

                    // Set internal status
                    this.item = item;
                    this.path = path;

                    // Update HTML5 History
                    if (push_state === true || push_state === undefined) {
                        if (this.first_push_state) {
                            this.first_push_state = false;
                            history.replaceState(this.path, this.item.title(), this.path);
                        } else {
                            history.pushState(this.path, this.item.title(), this.path);
                        }
                    }

                    // Create view and update page handler
                    if (this.item.isAlbum()) {
                        this.view = new AlbumController(this.config, this.main_div, this.item);
                        this.view.onPageUpdate.on( (show: bool, current_page: number, total_page: number) => {
                            if (!show) {
                                this.page_handler.hide();
                                return;
                            }
                            this.page_handler.show();
                            this.page_handler.setPage("Page", current_page, total_page);
                        });
                    } else {
                        assert(this.item.isPhoto());
                        this.page_handler.hide();
                        this.view = new PhotoController(this.config, this.main_div, this.item);
                        this.view.onPageUpdate.on( (current_photo: number, total_photo: number) => {
                            this.page_handler.show();
                            this.page_handler.setPage("Photo", current_photo, total_photo);
                        });
                        this.view.onPathChanged.on( (path: string) => {
                            this.path = path;
                            this.hideLoading();
                            this.showDelayedLoading();
                            this.breadcrumb_handler.setPath(this.path);
                            history.pushState(this.path, this.item.title(), this.path);
                        });
                    }

                    // Connect view callbacks and load item
                    this.view.onLoadPath.on((path: string) => { this.loadPath(path, true); }); // ### FIXME. See goToNext/goToPrev in PhotoView
                    this.view.onReady.on(() => { this.hideLoading(); });
                    this.view.load();

                    // Update toolbar
                    var can_download = () => {
                        if (!this.config.isDownloadAllowed())
                            return false;
                        if (item.isPhoto())
                            return true;
                        assert(item.isAlbum());
                        var children = item.children();
                        for (var i=0; i<children.length; ++i) {
                            if (children[i].isAlbum())
                                return false;
                        }
                        return true;
                    };
                    if (can_download()) {
                        this.divs.btn_download.show();
                        this.divs.btn_download.attr('href', this.config.makeDownloadUrl(this.path));
                    } else {
                        this.divs.btn_download.hide();
                    }
                } catch(e) {
                    this.onFatalError("Cannot navigate to page "+path, e);
                }
            };
        };

        /**
         * Load photo or album at path
         * @param {string} path           The virtual path of the item to display (album or photo)
         * @param {bool} push_state       Optional. Default true. Whether the state should be
         *   be pushed to the browser history. Typically false when handling popstate event.
         * @param {bool} delayed_loading  Optional. Default true. Whether the showDelayedLoading() is called
         * Calls onFatalError on errors.
         */
        private loadPath(path: string, push_state: bool, delayed_loading?: bool) {
            if (Exposition.debug)
                console.log("Loading: "+path);
            this.main_div.empty();
            this.page_handler.hide();
            this.breadcrumb_handler.setPath(path);

            // At startup we avoid showing/hiding the loading spin twice.
            if (delayed_loading === undefined || delayed_loading === true) {
                this.hideLoading();
                this.showDelayedLoading();
            }

            // Trigger async load of the item
            var on_error = (jqXHR, textStatus, error) => {
                this.onFatalError("Cannot navigate to page "+path, error);
            };
            Item.Load(this.config, path, this.onPathLoaded(path, push_state), on_error);
        };

        /** 
         * Show loading box in main view.
         * The loading box is not shown right away, this after some delay, and should
         * be visible on slow connections only
         */
        private showDelayedLoading() {
            // Preconditions
            assert(!this.loading_timer);

            // Create delayed loading
            var show_loading_hox = () => {
                assert($('#loading').length === 0);
                var loading_div = $('<div>').attr('id', 'loading');
                var spinner_div = $('<div>').addClass('spinner');
                loading_div.append(spinner_div);
                var loading_title = $('<p>').text('Loading...');
                loading_div.append(loading_title);
                this.main_div.append(loading_div);
                this.loading_spinner = new Spinner({
                    color:'#fff',
                    length: 4,
                    width: 3,
                    radius: 9
                });
                this.loading_spinner.spin($('#loading .spinner')[0]);
            };
            this.loading_timer = setTimeout(show_loading_hox, 500);

            // Postcondition
            assert(this.loading_timer);
        };

        /** Hide the loading box, or make sure it will not show (if it has not shown yet) */
        private hideLoading() {
            if (this.loading_spinner)
                this.loading_spinner.stop();
            $('#loading').remove();
            if (this.loading_timer) {
                clearTimeout(this.loading_timer);
                this.loading_timer = null;
            }
        };

        /**
         * Resize current view
         * Calls onFatalError on errors.
         */
        private onResize() {
            if (!this.view)
                return;

            try {
                this.view.updateLayout();
            } catch(e) {
                this.onFatalError("Resized failed.", e);
            }
        };

        /** Global keyboard events */
        private onKeydown(ev) {
            if (this.view)
                return this.view.onKeydown(ev);
        };

        /** Event handler for this.divs.page_handler_left */
        private onGoToPrev() {
            this.view.goToPrev();
        };

        /** Event handler for this.divs.page_handler_right */
        private onGoToNext() {
            this.view.goToNext();
        };

        /** Configuration loaded. Initialize object. Called by constructor */
        private init() {

            // Initialize page handler
            this.page_handler = new PageHandler(this.divs);
            this.page_handler.onGoToPrev.on(() => { this.onGoToPrev(); } );
            this.page_handler.onGoToNext.on(() => { this.onGoToNext(); } );

            // Initialize breadcrumb handler
            this.breadcrumb_handler = new BreadcrumbHandler(this.divs.breadcrumb, this.config);
            this.breadcrumb_handler.onLoadPath.on( (path: string) => { this.loadPath(path, true); });

            // Set default path
            this.path = '/';
            var query_index = document.URL.lastIndexOf('?');
            if (query_index>0) {
                var query = document.URL.substr(query_index+1);
                if (query.indexOf('path=') === 0 && query.indexOf('&') === -1) {
                    // We only accept ?path as a query string... otherwise, we'll need smarter parsing
                    this.path=query.substr('path='.length);
                }
            }

            // Initialize HTML5 history change event handler
            $(window).on('popstate', (ev) => {
                var path = ev.originalEvent.state;
                if (path && typeof path === 'string' && path.length>0); 
                    this.loadPath(path, false);
            });

            // Initialize key shortcuts handler
            $(document).keydown( (ev) => { return this.onKeydown(ev); } );

            // Initialize view
            this.loadPath(this.path, true, false);
            $(window).resize( () => { this.onResize(); } );
        };

        //
        // Constructor
        //
        constructor(divs: ApplicationDivs) {

            try {
                // Set members
                this.divs = divs;
                this.main_div = divs.main;

                // Loading box
                this.showDelayedLoading();

                // Load configuration
                var config;
                var on_fail = (err) => {
                    this.hideLoading();
                    this.onFatalError('Cannot load configuration.', err);
                };
                var on_success = () => {
                    // NOT hideLoading(); Loading is not finished. More in init(). 
                    this.config = config;      // Make sure this.config is undefined, unless fully loaded
                    this.init();
                };
                config = new Config(on_success, on_fail);
            } catch (err) {
                this.onFatalError('Failed to initialize gallery', err);
            }
        }

    };
} // module Exposition

