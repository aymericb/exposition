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

ph.barthe.UpdateCache = function(el_progress, el_progress_label, el_errors) {

    // Redefinitions
    var self = this;
    var assert = ph.barthe.assert;

    // Private Members
    var m_el_progress = el_progress;
    var m_el_progress_label = el_progress_label;
    var m_el_errors = el_errors;
    var m_config;
    var m_item;
    var m_count = 0;
    var m_total = 0;

    // Private Methods
    var onConfigSuccess = function() {
        $.ajax(m_config.pageItem()+'?'+$.param({path: '/'}))
            .fail( function() {
                onFailed({message: 'Failed to load root album'});
            })
            .done( function(data) {
                try {
                    // Count photos
                    m_item = new ph.barthe.Item(data);
                    var countPhotos = function(item) {
                        if (item.isAlbum()) {
                            var children = item.children();
                            var count = 0;
                            for (var i=0; i<children.length; ++i) {
                                if (children[i])
                                    count += countPhotos(children[i]);
                            }
                            return count;
                        } else {
                            return 1;
                        }
                    };
                    m_total = countPhotos(m_item);
                    // ### FIXME: Compute number of images
                    // image_count = photo_count * (thumnail_sizes.length+photo_sizes.length)
                    console.log('Total: '+m_total+' photos');

                    // Update progress bar
                    m_el_progress.progressbar( "option", {
                        value: 0,
                        max: m_total
                    });

                    // Start caching
                    cacheItem(m_item);

                } catch(e) {
                    onFailed(e);
                    if (ph.barthe.debug)
                        throw e;
                }
            });
    };

    var onFailed = function(err) {
        m_el_progress.progressbar( "option", {
            value: 0,
            max: 100
        });
        m_el_progress_label.text('Failed');
        if (err && err.message) {
            console.error("Error: "+err.message);
        }
    };

    var cacheItem = function(item) {
        // Precondition
        assert(item);
        assert(m_el_progress);

        // Cache album
        //console.log("Item: "+item.title());
        if (item.isAlbum()) {
            var children = item.children();
            for (var i=0; i<children.length; ++i) {
                if (children[i])
                    cacheItem(children[i]);
            }
            return;
        }

        // ### FIXME: The size is fixed but should be read from the config
        var size = m_config.thumbnailSize();

        // Cache photo
        assert(item.isPhoto());
        var update_progress = function() {
            m_count += 1;
            m_el_progress.progressbar("option", "value", m_count);
            if ( m_count === m_total ) {
                m_el_progress_label.text("Done");
            } else {
                m_el_progress_label.text(item.title());
            }
        };
        var on_success = function() {
            update_progress();
        };
        var on_fail = function(img, msg) {
            m_count += 1;
            m_el_progress.progressbar("option", "value", m_count);
            m_el_progress_label.text(item.title());
            var html = m_el_errors.html();
            html += '<p>' + "Failed " + item.path() + '@' + size + 'px ';
            if (msg)
                html += msg;
            html += '</p>';
            m_el_errors.html(html);
        };
        var url = m_config.pageImage()+'?'+$.param({path:item.path(), size: size});
        ph.barthe.loadImage(url, on_success, on_fail, item.title());
    };

    //
    // Constructor
    //
    (function() {

        // Precondition
        assert(m_el_progress);
        assert(m_el_progress);
        assert(m_el_errors);

        // Init progress bar
        m_el_progress.progressbar({value: false});

        // Load config
        m_config = new ph.barthe.Config(onConfigSuccess, onFailed);
        
    })();

};

// Use strict footer
})();
