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
ph.barthe.Exposition = function(config, main_div) {
    
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
        $.ajax(config.pageItem()+'?'+$.param({path: path}))
            .fail( onError )
            .done( function(data) {
                try {
                    m_item = new ph.barthe.Item(data);
                    m_path = path;
                    if (m_item.isAlbum()) {
                        m_view = new ph.barthe.AlbumView(config, m_main_div, m_item);
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
    var config = new ph.barthe.Config(function(){
        console.log(config.info());
        var expo = new ph.barthe.Exposition(config, $('#main'));
    }, function(err) {
        // ### FIXME: Improve error handling
        console.error('Failed '+err.message);

    });
   
});

// Use strict footer
})();
