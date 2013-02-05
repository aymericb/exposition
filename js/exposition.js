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

// Application Singleton
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
        var onError = function(error) {
            onFatalError("Cannot navigate to page "+path, error?error.message:'');
        };
        $.ajax(config.pageItem()+'?'+$.param({path: path}))
            .fail( onError )
            .done( function(data) {
                try {
                    m_item = new ph.barthe.Item(data);
                    m_path = path;
                    if (m_item.isAlbum()) {
                        m_view = new ph.barthe.AlbumView(config, m_divs, m_item);
                        m_view.onLoadPath.on(loadPath);
                    } else {
                        // ### TODO: loadPhoto();
                    }
                    m_view.load();
                } catch(e) {
                    onError(e);
                    if (ph.barthe.debug)
                        throw e;
                }
            });
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
        assert(m_divs.main);
        assert(m_divs.page_handler);
        assert(m_divs.page_handler_left);
        assert(m_divs.page_handler_center);
        assert(m_divs.page_handler_right);
        m_divs.page_handler_left.click(onGoToPrev);
        m_divs.page_handler_right.click(onGoToNext);
        loadPath(m_path);
        $(window).resize(onResize);
    })();

};


// Use strict footer
})();
