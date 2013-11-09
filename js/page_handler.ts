//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="common.ts" />
/// <reference path="signal.ts" />
/// <reference path="../lib/jquery.d.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/


module Exposition {

    export interface PageHandlerDivs {
        page_handler: JQuery;
        page_handler_left: JQuery;
        page_handler_center: JQuery;
        page_handler_right: JQuery;
    }

    /**
     * PageHandler class
     *
     * The PageHandler class handles the display and event handling for the
     * page indicator and previous/next buttons.
     *
     * Constructor
     * divs An object containing all the necessary divs as properties
     *      - page_handler          -> display area for page handling UI
     *      - page_handler_left     -> previous page arrow
     *      - page_handler_center   -> "page x/y" display
     *      - page_handler_right    -> next page arrow
     */
    export class PageHandler {

        // Constructor
        constructor(private divs: PageHandlerDivs) {

            // Connect signals
            this.onGoToPrev = new Signal();
            this.onGoToNext = new Signal();
            this.divs.page_handler_left.click(() => { this.onGoToPrev.fire(); } );
            this.divs.page_handler_right.click(() => { this.onGoToNext.fire(); } );
        }


        //
        // Public methods
        //

        public hide() {
    		this.divs.page_handler.hide();
        };

        public show() {
    		this.divs.page_handler.show();
        };

        /**
         * Set the current page
         * text {string} The text indicator like 'Page' or 'Photo' in 'Page 1/2'
         * current_page {int} Current page start at 0
         * total_page {int} Number of pages
         */
        public setPage(text: string, current_page: number, total_page: number) {
            // Preconditions
            assert(total_page>0);
            assert(current_page>=0);
            assert(current_page<total_page);

            // Update status
            this.divs.page_handler_center.text(text+' '+(current_page+1)+"/"+total_page);
            if (current_page>0)
                this.divs.page_handler_left.show();
            else
                this.divs.page_handler_left.hide();
            if (current_page+1 < total_page)
                this.divs.page_handler_right.show();
            else
                this.divs.page_handler_right.hide();
        };

        //
        // Public signals
        //

        /** onGoToPrev() -> Go to previous page */
        public onGoToPrev;

        /** onGoToNext() -> Go to next page */
        public onGoToNext;

    };

} // module Exposition
