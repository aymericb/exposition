//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition codebadase is licensed under the GNU Affero General Public License 3 (GNU AGPL 3)
// with the following additional terms. This copyright notice must be preserved in all source 
// files, including files which are minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/*jshint eqeqeq:true, browser:true, jquery:true*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Use strict header
(function() {
"use strict";

/**
 * PageHandler class
 *
 * The PageHandler class handles the display and event handling for the
 * page indicator and previous/next buttons.
 *
 * Constructor
 * divs An object containing all the necesessary divs as properties
 *      - page_handler          -> display area for page handling ui
 *      - page_handler_left     -> previous page arrow
 *      - page_handler_center   -> "page x/y" display
 *      - page_handler_right    -> next page arrow
 */
ph.barthe.PageHandler = function(divs) {

    // Redefinitions
    var self = this;
    var assert = ph.barthe.assert;

    // Private members
    var m_divs = divs;
    var m_on_page_prev = {};
    var m_on_page_next = {};

    // Constructor
    (function() {

		// Preconditions
        assert(m_divs.page_handler);
        assert(m_divs.page_handler_left);
        assert(m_divs.page_handler_center);
        assert(m_divs.page_handler_right);

        // Connect signals1
        m_divs.page_handler_left.click(function() { m_on_page_prev.fire(); } );
        m_divs.page_handler_right.click(function() { m_on_page_next.fire(); } );

    })();

    //
    // Public methods
    //

    self.hide = function() {
		m_divs.page_handler.hide();
    };

    self.show = function() {
		m_divs.page_handler.show();
    };

    /**
     * Set the current page
     * text {string} The text indicator like 'Page' or 'Photo' in 'Page 1/2'
     * current_page {int} Current page start at 0
     * total_page {int} Number of pages
     */
    self.setPage = function(text, current_page, total_page) {
        // Preconditions
        assert(total_page>0);
        assert(current_page>=0);
        assert(current_page<total_page);

        // Update status
        m_divs.page_handler_center.text(text+' '+(current_page+1)+"/"+total_page);
        if (current_page>0)
            m_divs.page_handler_left.show();
        else
            m_divs.page_handler_left.hide();
        if (current_page+1 < total_page)
            m_divs.page_handler_right.show();
        else
            m_divs.page_handler_right.hide();
    };

    //
    // Public signals
    //

    /** onGoToPrev() -> Go to previous page */
    self.onGoToPrev = new ph.barthe.Signal(m_on_page_prev);

    /** onGoToNext() -> Go to next page */
    self.onGoToNext = new ph.barthe.Signal(m_on_page_next);

};


// Use strict footer
})();