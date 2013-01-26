/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Use strict header
(function() {
"use strict";

// Application Singleton
ph.barthe.Exposition = function(main_div) {
    
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
    var m_main_div = main_div;      // Main div used for rendering

    //
    // Constants
    //
    var CONFIG = {
        PAGE_ITEM:              'php/ajax/item.php',
        PAGE_IMAGE:             'php/ajax/image.php',
        
        // ### FIXME: Use PHP config for all THUMBNAIL sizes
        THUMBNAIL_SIZE:          160,     // ### FIXME: Missing retina support
        THUMBNAIL_MARGIN:        20,
        THUMBNAIL_TITLE_MARGIN:  10,
        THUMBNAIL_TITLE_HEIGHT: (function() {
            // Compute dynamically by reading CSS property of div class '.item .title'
            var item = $('<div>').addClass('item').hide();
            var title = $('<div>').addClass('title');
            item.append(title);
            $(document.body).append(item);
            var height = title.outerHeight();
            item.remove();
            return height;
        })(),

        THUMBNAIL_HEIGHT: this.THUMBNAIL_SIZE+this.THUMBNAIL_TITLE_HEIGHT,
        THUMBNAIL_WIDTH:  this.THUMBNAIL_SIZE
    };

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
        m_main_div.empty();
        var onError = function(error) {
            onFatalError("Cannot navigate to page "+path, error?error.message:'');
        };
        $.ajax(CONFIG.PAGE_ITEM+'?'+$.param({path: path}))
            .fail( onError )
            .done( function(data) {
                try {
                    m_item = new ph.barthe.Item(data);
                    m_path = path;
                    if (m_item.isAlbum()) {
                        m_view = new ph.barthe.AlbumView(CONFIG, m_main_div, m_item);
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

    //
    // Constructor
    //
    (function() {
        loadPath(m_path);
        $(window).resize(onResize);
    })();

};


// Main function
$(document).ready(function() {
    var expo = new ph.barthe.Exposition($('#main'));
   
});

// Use strict footer
})();
