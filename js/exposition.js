//
// Exposition. © 2013 Aymeric Barthe
//

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Use strict header
(function() {
"use strict";

/**
 * Application Singleton
 *
 * Constructor parameters
 * - config                     -> A ph.barthe.Config object
 * - divs An object containing all the necesessary divs as properties
 *      - main                  -> main display area
 *      - breadcrumb            -> breadcrumb section
 *      - page_handler          -> display area for page handling ui
 *      - page_handler_left     -> previous page arrow
 *      - page_handler_center   -> "page x/y" display
 *      - page_handler_right    -> next page arrow
 */
ph.barthe.Exposition = function(config, divs) {

    //
    // Redefinitions
    //
    var self = this;
    var assert = ph.barthe.assert;

    //
    // Private members
    //
    var m_path;                     // Current album or item path
    var m_item;                     // Current item (class Item)
    var m_view;                     // Current view
    var m_divs = divs;              // Divs used for display
    var m_main_div = divs.main;     // Main div used for rendering
    var m_page_handler;             // ph.barthe.PageHandler
    var m_breadcrumb_handler;       // ph.barthe.BreadcrumbHandler
    var m_first_push_state=true;    // HTML 5 history

    //
    // Private Functions
    //

    /**
     * Notify the user of a global failure
     * @param _friendly_message {string}  Message shown to the end user
     * @param error {Error}               Exception object
     */
    var onFatalError = function(_friendly_message, error) {
        // ### TODO: Add HTML element to page
        var friendly_message = friendly_message || 'An error has occurred';
        var log = friendly_message;
        if (error && ('message' in error))
            log += " Reason: " + error.message;
        console.error(log);
    };

    /**
     * Load photo or album at path
     * @param {string} path      The virtual path of the item to display (album or photo)
     * @param {bool} push_state  Optional. Default true. Whether the state should be
     * be pushed to the browser history. Typically false when handling popstate event.
     * Calls onFatalError on errors.
     */
    var loadPath = function(path, push_state) {
        console.log("Loading: "+path);
        m_main_div.empty();
        m_page_handler.hide();
        m_breadcrumb_handler.setPath(path);

        var on_error = function(jqXHR, textStatus, error) {
            onFatalError("Cannot navigate to page "+path, error);
        };
        var on_success = function(item) {
            try {
                m_item = item;
                m_path = path;
                if (push_state === true || push_state === undefined) {
                    if (m_first_push_state) {
                        m_first_push_state = false;
                        history.replaceState(m_path, m_item.title(), m_path);
                    } else {
                        history.pushState(m_path, m_item.title(), m_path);
                    }
                }
                if (m_item.isAlbum()) {
                    m_view = new ph.barthe.AlbumView(config, m_main_div, m_item);
                    m_view.onLoadPath.on(loadPath);
                    m_view.onPageUpdate.on(function(show, current_page, total_page) {
                        if (!show) {
                            m_page_handler.hide();
                            return;
                        }
                        m_page_handler.show();
                        m_page_handler.setPage("Page", current_page, total_page);
                    });
                } else {
                    assert(m_item.isPhoto());
                    m_page_handler.hide();
                    m_view = new ph.barthe.PhotoView(config, m_main_div, m_item);
                    m_view.onLoadPath.on(loadPath); // ### FIXME. See goToNext/goToPrev in PhotoView
                    m_view.onPageUpdate.on(function(current_photo, total_photo) {
                        m_page_handler.show();
                        m_page_handler.setPage("Photo", current_photo, total_photo);
                    });
                }
                m_view.load();
            } catch(e) {
                on_error(e);
            }
        };
        ph.barthe.Item.Load(config, path, on_success, on_error);
    };

    /**
     * Resize current view
     * Calls onFatalError on errors.
     */
    var onResize = function() {
        if (!m_view)
            return;

        try {
            m_view.updateLayout();
        } catch(e) {
            onFatalError("Resized failed.", e);
        }
    };

    /** Event handler for m_divs.page_handler_left */
    var onGoToPrev = function() {
        m_view.goToPrev();
    };

    /** Event handler for m_divs.page_handler_right */
    var onGoToNext = function() {
        m_view.goToNext();
    };

    /** Configuration loaded */

    //
    // Constructor
    //
    (function() {

        // Preconditions
        assert(m_divs.main && m_divs.main.length>0);
        assert(m_divs.breadcrumb && m_divs.breadcrumb.length>0);
        assert(m_divs.page_handler && m_divs.page_handler.length>0);
        assert(m_divs.page_handler_left && m_divs.page_handler_left.length>0);
        assert(m_divs.page_handler_center && m_divs.page_handler_center.length>0);
        assert(m_divs.page_handler_right && m_divs.page_handler_right.length>0);

        // Initialize page handler
        m_page_handler = new ph.barthe.PageHandler(m_divs);
        m_page_handler.onGoToPrev.on(onGoToPrev);
        m_page_handler.onGoToNext.on(onGoToNext);

        // Initialize breadcrumb handler
        m_breadcrumb_handler = new ph.barthe.BreadcrumbHandler(m_divs.breadcrumb, config);
        m_breadcrumb_handler.onLoadPath.on(loadPath);

        // Set default path
        m_path = '/';
        var query_index = document.URL.lastIndexOf('?');
        if (query_index>0) {
            var query = document.URL.substr(query_index+1);
            if (query.indexOf('path=') === 0 && query.indexOf('&') === -1) {
                // We only accept ?path as a query string... otherwise, we'll need smarter parsing
                m_path=query.substr('path='.length);
            }
        }

        // Initialize HTML5 history change event handler
        $(window).on('popstate', function(ev) {
            var path = ev.originalEvent.state;
            if (path && typeof path === 'string' && path.length>0);
                loadPath(path, false);
        });

        // Initialize view
        loadPath(m_path);
        $(window).resize(onResize);
    })();

};


// Use strict footer
})();
