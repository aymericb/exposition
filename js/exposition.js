/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

// Use strict header
(function() {
"use strict";

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Debugging
ph.barthe.debug = true;
ph.barthe.assert = function(cond) {
    if (ph.barthe.debug) {
        if (! cond) {
            throw { message: 'Assertion failed: '+cond };
        }
    }
};

// Utilities
ph.barthe.generateId = function(path, prefix) {
    return prefix+path.replace(/\//g, '-').replace(/[^A-Za-z0-9\-\.]/g, '_');
};

/**
 * Item class
 *
 * This is a frontend for the JSON Item format passed by the server. This class merely
 * provides validation of the JSON data, and read-only access. Each item can either be
 * an 'Album' with children (other Item objects) or a 'Photo'.
 *
 * @author Aymeric Barthe
 */

ph.barthe.Item = function(json) {
    
    // Redefinitions
    var self = this;
    var assert = ph.barthe.assert;

    // Private members
    var m_children = [];

    // Public methods
    self.isPhoto = function() {
        return (json.type === 'photo');
    };
    self.isAlbum = function() {
        return (json.type === 'album');
    };
    self.title = function() {
        return json.title;
    };
    self.path = function() {
        return json.path;
    };
    self.children = function() {
        assert(self.isAlbum());
        return m_children;
    };
    self.getRandomPhotoPath = function() {
        assert(self.isAlbum());
        if (m_children.length === 0)
            return '';
        var photos = [];
        for (var i=0; i<m_children.length; ++i) {
            if (m_children[i].isPhoto())
                photos.push(m_children[i]);
        }
        if (photos.length === 0) {
            var r1 = Math.floor(Math.random() * m_children.length);
            return m_children[r1].getRandomPhotoPath();
        } else {
            var r2 = Math.floor(Math.random() * photos.length);
            return photos[r2].path();
        }
    };

    // Constructor: validate data
    (function() {
        var checkStringAttribute = function(name) {
            if (! json[name]) {
                throw { message: 'Missing '+name+' attribute in JSON.' };
            }
            if (typeof json[name] !== 'string') {
                 throw { message: 'Attribute '+name+' should be a String in JSON.' };
            }
        };
        checkStringAttribute('type');
        if (!self.isAlbum() && !self.isPhoto()) {
            throw { message: 'Invalid type attribute in JSON.' };
        }
        checkStringAttribute('title');
        checkStringAttribute('path');
        if (self.isAlbum()) {
            if (! json.children) {
                throw { message: 'Missing children attribute in JSON.' };
            }
            if( Object.prototype.toString.call( json.children ) !== '[object Array]' ) {
                throw { message: 'Attribute children should be an Array in JSON.' };
            }
            for (var i=0; i<json.children.length; ++i) {
                m_children.push(new ph.barthe.Item(json.children[i]));
            }
        }
    })();

};

// Cache shared between all AlbumView instances
ph.barthe.AlbumViewCache = {
    album_to_photo: {}     // Map album_path -> photo_path.
};

/**
 * AlbumView class
 *
 * The album view provides the mechanism for loading an album into the browser view.
 * It is reponsible for creating, loading and displaying the thumnails. It also
 * dynaically adjust the layout for fit in the view, and creates as many pages
 * as necessary.
 *
 * Any methods (including constructor) may throw in case of error.
 *
 * @author Aymeric Barthe
 */
ph.barthe.AlbumView = function(CONFIG, album_div, item) {

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

        // Load image helper
        // See http://stackoverflow.com/questions/4285042/can-jquery-ajax-load-image
        // and http://stackoverflow.com/questions/5057990/how-can-i-check-if-a-background-image-is-loaded
        var load_image = function(url, v_margin, parent, div_title) {
            var img = $('<img>').attr('src', url).load(function(response, status, xhr) {
                if (status === 'error') {
                    console.error('Download failed for image '+url+' '+xhr.status+' '+xhr.statusText);
                    // ### TODO: Show error in thumnail
                } else if (!this.complete || !this.naturalWidth) {
                    // ### TODO: Show error in thumnail
                    console.error('Downloaded image is not valid: '+url);
                } else {
                    // ### TODO: Ajust centering of the image in the div element
                    var ratio = this.naturalWidth/this.naturalHeight;
                    var parent_height = parent.height()-v_margin;
                    if (this.naturalWidth >= this.naturalHeight) {
                        var h = Math.floor(parent.width()/ratio);
                        var top = Math.floor( (parent_height-h)/2 );
                        img.css({
                            top: top,
                            left: 0,
                            width: parent.width(),
                            height: h
                        });
                        div_title.css('top', top+h+v_margin-div_title.height());
                    } else {
                        var w = Math.floor(parent_height*ratio);
                        img.css({
                            top: 0,
                            left: Math.floor( (parent.width()-w)/2 ),
                            width: w,
                            height: parent_height
                        });
                    }
                    //div_thumbnail.parent().width();
                    img.css('background-image', 'url('+url+')');
                    parent.show();
                }
            });
            return img;
        };

        // Load thumbnails
        var children = m_item.children();
        for (var i=0; i<m_children.length; ++i) {

            // Skip empty albums
            if (!m_children[i])
                continue;

            // Read properties
            var url = CONFIG.PAGE_IMAGE+'?'+$.param({path:m_children[i].photo_path, size: CONFIG.THUMBNAIL_SIZE});
            var id = m_children[i].id;
            var item = m_item.children()[i];
            assert(url && id && item);

            // Create elements
            var div_item = $('<div>').addClass('item').attr('id', id).hide();
            div_item.css( {
                width: CONFIG.THUMBNAIL_SIZE+'px',
                height: (CONFIG.THUMBNAIL_SIZE+CONFIG.THUMBNAIL_TITLE_MARGIN+CONFIG.THUMBNAIL_TITLE_HEIGHT)+'px'
            });
            var div_title = $('<div>').addClass('title').text( children[i].title() );
                // ### FIXME: What if title too large
            //var div_thumbnail = $('<div>').addClass('thumbnail');
            var img = load_image(url, CONFIG.THUMBNAIL_TITLE_MARGIN+CONFIG.THUMBNAIL_TITLE_HEIGHT, div_item, div_title);
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
        var WIDTH       = CONFIG.THUMBNAIL_MARGIN + CONFIG.THUMBNAIL_SIZE;
        var HEIGHT      = CONFIG.THUMBNAIL_MARGIN + CONFIG.THUMBNAIL_SIZE+CONFIG.THUMBNAIL_TITLE_MARGIN+CONFIG.THUMBNAIL_TITLE_HEIGHT;
        var COL_COUNT   = Math.floor( VIEW_WIDTH/WIDTH );
        var ROW_COUNT   = Math.floor( VIEW_HEIGHT/HEIGHT );
        var H_MARGIN    = Math.floor( (VIEW_WIDTH - COL_COUNT*WIDTH + CONFIG.THUMBNAIL_MARGIN)/2 );
        var V_MARGIN    = Math.floor( (VIEW_HEIGHT - ROW_COUNT*HEIGHT + CONFIG.THUMBNAIL_MARGIN)/2 );
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
    var m_album_to_photo = {};      // Map album_path -> photo_path

    //
    // Constants
    //
    var CONFIG = {
        PAGE_ITEM:              'item.php',
        PAGE_IMAGE:             'image.php',
        
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
     * Layout current album
     * Requires m_item and m_path to be set to point to the current album.
     * Throws on error.
     */
    var layoutAlbum = function() {
        
        // Preconditions
        var loading_div = $('#album-loading');
        assert(m_item.isAlbum());
        assert(m_path);
        assert(loading_div);

        // Move the elemts
        // ### TODO

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

    //
    // Constructor
    //
    (function() {
        loadPath(m_path);
    })();

};


// Main function
$(document).ready(function() {
    var expo = new ph.barthe.Exposition($('#main'));
   
});

// Use strict footer
})();
