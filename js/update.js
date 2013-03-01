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
    var m_sizes;
    var m_count = 0;
    var m_total = 0;
    var m_download_queue = [];
    var PARALLEL_DOWNLOAD = 6;

    // Private Methods
    var onConfigSuccess = function() {
        $.ajax(m_config.makeItemUrl('/'))
            .fail( function() {
                onFailed(new Error('Failed to load root album'));
            })
            .done( function(data) {
                try {
                    // Store sizes
                    m_sizes = m_config.allImageSizes();
                    m_sizes = m_sizes.sort(function(a,b){return a-b;});
                    if (m_sizes[0] === 0)
                        m_sizes = m_sizes.splice(1, m_sizes.length-1);

                    console.log('Sizes: '+m_sizes);

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
                    var photo_count = countPhotos(m_item);
                    m_total = photo_count*m_sizes.length;
                    console.log('Total: '+photo_count+' photos, '+m_total+' images.');

                    // Update progress bar
                    m_el_progress.progressbar( "option", {
                        value: 0,
                        max: m_total
                    });

                    // Start caching
                    cacheItem(m_item);
                    for (var k=0; k<PARALLEL_DOWNLOAD; ++k) {
                        popDownload();
                    }

                } catch(e) {
                    onFailed(e);
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

    var updateDownloadProgress = function(download) {
        m_count += 1;
        m_el_progress.progressbar("option", "value", m_count);
        if ( m_count === m_total ) {
            m_el_progress_label.text("Done");
        } else {
            m_el_progress_label.text(download.title + '@' + download.size + 'px');
        }
    };

    var popDownload = function() {
        if (m_download_queue.length === 0)
            return;
        var download = m_download_queue.pop();
        $.ajax(download.url)
            .fail( function(jqXHR, textStatus, errorThrown) {
                onDownloadFailed(errorThrown?('HTTP '+jqXHR.status+' '+errorThrown):textStatus, download);
            })
            .done( function() {
                onDownloadSuccess(download);
            });
    };

    var onDownloadSuccess = function(download) {
        updateDownloadProgress(download);
        popDownload();
    };

    var onDownloadFailed = function(msg, download) {
        updateDownloadProgress(download);
        var html = m_el_errors.html();
        html += '<p>' + 'Failed ' + download.url + ' ' + msg + '</p>';
        m_el_errors.html(html);
        popDownload();
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

        // Cache photo
        assert(item.isPhoto());
        for (var j=0; j<m_sizes.length; ++j) {
            var url = m_config.makeCacheUrl(m_sizes[j], item.path());
            m_download_queue.push(Object.freeze({
                url: url,
                size: m_sizes[j],
                title: item.title()
            }));
        }

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
