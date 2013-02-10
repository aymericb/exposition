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
    var m_path = '/';               // Current album or item path
    var m_item;                     // Current item (class Item)
    var m_view;                     // Current view
    var m_divs = divs;              // Divs used for display
    var m_main_div = divs.main;     // Main div used for rendering
    var m_page_handler;             // ph.barthe.PageHandler

    //
    // Private Functions
    //

    // Notify the user of a global failure
    var onFatalError = function(_description, _reason) {
        // ### TODO: Add HTML element to page
        var description = _description || 'An error has occurred';
        var reason = _reason || '';
        var log = description;
        if (reason !== '')
            log += " Reason: " + reason;
        console.error(log);
    };

    /**
     * Load photo or album at path
     * Calls onFatalError on errors.
     */
    var loadPath = function(path) {
        console.log("Loading: "+path);
        m_main_div.empty();

        var on_error = function(jqXHR, textStatus, error) {
            onFatalError("Cannot navigate to page "+path, error?error.message:'');
        };
        var on_success = function(item) {
            try {
                m_item = item;
                m_path = path;
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
                if (ph.barthe.debug)
                    throw e;
            }
        };
        ph.barthe.Item.Load(config.pageItem(), path, on_success, on_error);
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
            onFatalError("Resized failed. Reason: "+e.message);
            if (ph.barthe.debug)
                throw e;
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

    //
    // Constructor
    //
    (function() {

        // Preconditions
        assert(m_divs.main);
        assert(m_divs.page_handler);
        assert(m_divs.page_handler_left);
        assert(m_divs.page_handler_center);
        assert(m_divs.page_handler_right);

        // Initialize page handler
        m_page_handler = new ph.barthe.PageHandler(m_divs);
        m_page_handler.onGoToPrev.on(onGoToPrev);
        m_page_handler.onGoToNext.on(onGoToNext);

        // Initialize view
        loadPath(m_path);
        $(window).resize(onResize);
    })();

};


// Use strict footer
})();
