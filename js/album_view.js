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

// Cache shared between all AlbumView instances
ph.barthe.AlbumViewCache = {
    album_to_photo: {}     // Map album_path -> photo_path.
};

/**
 * AlbumView class
 *
 * The album view provides the mechanism for loading an album into the browser view.
 * It is reponsible for creating, loading and displaying the thumnails. It also
 * dynamically adjusts the layout to fit within the view, and creates as many pages
 * as necessary.
 *
 * Any methods (including constructor) may throw in case of error, unless otherwise
 * specified.
 *
 */
ph.barthe.AlbumView = function(config, album_div, item) {

    //
    // Redefinitions
    //
    var self = this;
    var assert = ph.barthe.assert;

    //
    // Private members
    //
    var m_album_to_photo = ph.barthe.AlbumViewCache.album_to_photo;
    var m_main_div = album_div;     // Root view
    var m_item = item;              // Root item of the album
    var m_children = [];            // Array. Child idx => {photo_path: 'str', id: 'str'}
        // CAUTION: m_children may have holes, has not all childrens may have photos
    var m_loading_div;               // Hidden div used temporarily to load assets

    //
    // Config Constants
    //
    var PAGE_IMAGE = config.pageImage();
    var THUMBNAIL_MARGIN = config.thumbnailMargin();
    var THUMBNAIL_SIZE = config.thumbnailSize();
    var THUMBNAIL_TITLE_MARGIN = config.thumbnailTitleMargin();
    var THUMBNAIL_TITLE_HEIGHT = config.thumbnailTitleHeight();

    /**
     * Constructor
     * No side effect on Main View. Use load()
     */
    (function() {

        // Preconditions
        assert(m_main_div);
        assert(m_item);
        assert(m_item.isAlbum());

        // Fill children elements with the following properties
        // - photo-path: path to a random sub-photo in the album (or sub album)
        // - id:         HTML id computed based on album path (not photo)
        var children = m_item.children();
        for (var i=0; i<children.length; ++i) {

            // Get path to photo element
            var path = children[i].path();
            if (children[i].isAlbum()) {
                path = m_album_to_photo[children[i].path()];
                if (!path) {
                    path = children[i].getRandomPhotoPath();
                    m_album_to_photo[children[i].path()] = path;
                }
            }

            // It is possible to get an empty album. Skip it.
            if (!path)
                continue;

            // Store information
            m_children[i] = {
                photo_path: path,
                id: ph.barthe.generateId(children[i].path(), 'album-thumb')
            };
        }
    })();

    /**
     * Load thumnail image asynchronously and center it.
     *
     * This function create an IMG element for url.
     * The image is centered using v_margin (extra height for title) within the parent jQuery element.
     * The div_title is positionned directly under the thumnail image (v_maring accounts for its height).
     *
     * Error handling. This function may throw or return an empty jQuery object. However the
     * image loading callback does not throw. It captures errors and provide feedback to the
     * user showing that the thumnail image could not be created.
     *
     * Design loosely inspired by
     * - http://stackoverflow.com/questions/4285042/can-jquery-ajax-load-image
     * - http://stackoverflow.com/questions/5057990/how-can-i-check-if-a-background-image-is-loaded
     */
    var loadThumnailImage = function(url, v_margin, parent, div_title) {
        var img = $('<img>').attr('src', url).attr('alt', div_title.text());
        img.load(function(response, status, xhr) {
            var has_error = false;
            if (status === 'error') {
                console.error('Download failed for image '+url+' '+xhr.status+' '+xhr.statusText);
                has_error = true;
            } else if (!this.complete || !this.naturalWidth) {
                console.error('Downloaded image is not valid: '+url);
                has_error = true;
            } else {
                try {
                    var ratio = this.naturalWidth/this.naturalHeight;
                    var parent_height = parent.height()-v_margin;
                    var top, height;
                    if (this.naturalWidth >= this.naturalHeight) {
                        height = Math.floor(parent.width()/ratio);
                        top = Math.floor( (parent_height-height)/2 );
                        img.css({
                            top: top,
                            left: 0,
                            width: parent.width(),
                            height: height
                        });
                    } else {
                        var w = Math.floor(parent_height*ratio);
                        top = 0;
                        height = parent_height;
                        img.css({
                            top: 0,
                            left: Math.floor( (parent.width()-w)/2 ),
                            width: w,
                            height: parent_height
                        });
                    }
                    div_title.css('top', top+height+v_margin-div_title.outerHeight());
                    parent.show();
                } catch (e) {
                    console.error('Cannot center image '+url+' Reason: '+e.message);
                    has_error = true;
                }
            }
            if (has_error) {
                // ### TODO Show to end user that the thumnail could not be loaded.
            }
        });
        return img;
    };

    /**
     * Load album into view
     *
     * This method clears album_div, create and layout the photo thumbails for
     * the current album. This method implictely calls updateLayout().
     *
     * Throws on error. However thumnail image loading errors are handled
     * interally as non critical errors, and display to the end-user.
     *
     */
    self.load = function() {

        // Clear divs
        m_main_div.empty();
        m_loading_div = $('<div>').attr('id', 'album-loading').hide();
        m_main_div.append(m_loading_div);

        // Load thumbnails
        var children = m_item.children();
        for (var i=0; i<m_children.length; ++i) {

            // Skip empty albums
            if (!m_children[i])
                continue;

            // Read properties
            var url = PAGE_IMAGE+'?'+$.param({path:m_children[i].photo_path, size: THUMBNAIL_SIZE});
            var id = m_children[i].id;
            var item = m_item.children()[i];
            assert(url && id && item);

            // Create elements
            var div_item = $('<div>').addClass('item').attr('id', id).hide();
            div_item.css( {
                width: THUMBNAIL_SIZE+'px',
                height: (THUMBNAIL_SIZE+THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT)+'px'
            });
            var div_title = $('<div>').addClass('title').text( children[i].title() );
                // ### FIXME: What if title too large
            //var div_thumbnail = $('<div>').addClass('thumbnail');
            var img = loadThumnailImage(url, THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT, div_item, div_title);
            img.addClass('thumbnail');
            div_item.append(img);
            div_item.append(div_title);
            m_loading_div.append(div_item);
            // ### DEBUG console.log(url);
        }

        // Update layout
        self.updateLayout();
        // m_loading_div.show(); // ### DEBUG
    };

    /**
     * Layout album into the view
     *
     * This methods should be called whenever the view size changes. It should be called
     * only after the album was loaded with load(). This methods updates the layouts
     * of the album items the items (and thumnails). It tries to display as many of them
     * as possible, and create pagination if there are too many.
     *
     */
    self.updateLayout = function() {

        // Precondition
        assert(m_main_div);
        assert(m_loading_div);
        assert( (function() {
            for (var i=0; i<m_children.length; ++i) {
                if (m_children[i] && $('#'+m_children[i].id).length === 0) {
                    return false;   // div element does not exist for child!
                }
            }
            return true;
        })() );

        // Compute sizes
        var VIEW_WIDTH  = m_main_div.width();
        var VIEW_HEIGHT = m_main_div.height();
        var WIDTH       = THUMBNAIL_MARGIN + THUMBNAIL_SIZE;
        var HEIGHT      = THUMBNAIL_MARGIN + THUMBNAIL_SIZE+THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT;
        var COL_COUNT   = Math.floor( VIEW_WIDTH/WIDTH );
        var ROW_COUNT   = Math.floor( VIEW_HEIGHT/HEIGHT );
        var H_MARGIN    = Math.floor( (VIEW_WIDTH - COL_COUNT*WIDTH + THUMBNAIL_MARGIN)/2 );
        var V_MARGIN    = Math.floor( (VIEW_HEIGHT - ROW_COUNT*HEIGHT + THUMBNAIL_MARGIN)/2 );
        if (ph.barthe.debug) {
            console.log('Resizing album. COL_COUNT: '+COL_COUNT+'  ROW_COUNT: '+ROW_COUNT);
        }

        // Helper function
        var getPageElement = function(index) {
            var id = 'album-page-'+(index+1);
            var el = $('#'+id);
            if (el.length === 0) {
                el = $('<div>').attr('id', id).hide();
                m_main_div.append(el);
            }
            return el;
        };

        // Iterate on children
        var pageIndex = 0;
        var pageElement = getPageElement(pageIndex);
        pageElement.show(); // ### DEBUG
        var x = H_MARGIN;
        var y = V_MARGIN;
        for (var i=0; i<m_children.length; ++i) {
            
            // Skip empty
            if (!m_children[i])
                continue;

            // Move item
            var item = $('#'+m_children[i].id);
            assert(item.length>0);
            item.css( {left:x, top:y} );
            pageElement.append(item);

            // Increment position
            x += WIDTH;
            if (x+WIDTH > VIEW_WIDTH) {
                x = H_MARGIN;
                y += HEIGHT;
                if (y+HEIGHT > VIEW_HEIGHT) {
                    y = V_MARGIN;
                    pageIndex += 1;
                    pageElement = getPageElement(pageIndex);
                }
            }
        }
    };
};

// Use strict footer
})();