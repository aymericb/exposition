/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

// Use strict header
(function() {
"use strict";

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Debugging
ph.barthe.assert = function(cond) {
    if (! cond) {
        throw { message: 'Assertion failed: '+cond };
    }
};
ph.barthe.debug = true;

// Utilities
ph.barthe.generateId = function(path, prefix) {
    return prefix+path.replace(/\//g, '-').replace(/[^A-Za-z0-9\-\.]/g, '_');
};

/**
 * Item class
 *
 * This is a frontend for the JSON Item format passed by the server. This class merely
 * provides validation of the JSON data, and read-only access. Each item can either be
 * an 'Album' with children (other Items) or a 'Photo'.
 *
 * @author Aymeric Barthe
 */

ph.barthe.Item = function(json) {
    // Private members
    var self = this;
    var assert = ph.barthe.assert;
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

};

// Global State
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
    var m_main_div = main_div;      // Main div used for rendering
    var m_album_to_photo = {};      // Map album_path -> photo_path

    //
    // Constants
    //
    var PAGE_ITEM = function() { return 'item.php'; };
    var PAGE_IMAGE = function() { return 'image.php'; };
    var THUMBNAIL_SIZE = function() { return 160; };
        // ### FIXME: Should be retrieved dynamically / Missing retina support
    var THUMBNAIL_HEIGHT = function() { return THUMBNAIL_SIZE()+/*See CSS*/17+14;};
    var THUMBNAIL_WIDTH = function() { return THUMBNAIL_SIZE; };

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
     * Load current album.
     * Requires m_item and m_path to be set to point to the current album.
     * Throws on error.
     */
    var loadAlbum = function() {

        // Preconditions
        assert(m_item.isAlbum());
        assert(m_path);

        // Clear div
        m_main_div.empty();
        var loading_div = $('<div>').attr('id', 'album-loading').hide();
        m_main_div.append(loading_div);

        // Load image helper
        // See http://stackoverflow.com/questions/4285042/can-jquery-ajax-load-image
        // and http://stackoverflow.com/questions/5057990/how-can-i-check-if-a-background-image-is-loaded
        var load_image = function(div_thumbnail, url) {
            var img = $('<img>').attr('src', url).load(function() {
                if (!this.complete || !this.naturalWidth) {
                    // ### TODO: Show error in thumnail
                    console.error('Could not receive: '+url);
                } else {
                    // ### TODO: Ajust centering of the image in the div element
                    div_thumbnail.css('background-image', 'url('+url+')');
                }
            });
        };

        // Load thumbnails
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

            // Create elements
            var id = ph.barthe.generateId(path, 'thumb');
            var div_item = $('<div>').addClass('item').attr('id', id);
            var div_title = $('<div>').addClass('title').text( children[i].title() );
                // ### FIXME: What if title too large
            var url = PAGE_IMAGE()+'?'+$.param({path: path, size: THUMBNAIL_SIZE()});
            var div_thumbnail = $('<div>').addClass('thumbnail');
            load_image(div_thumbnail, url);
            div_item.append(div_thumbnail);
            div_item.append(div_title);
            loading_div.append(div_item);
            console.log(url);
        }


        loading_div.show(); // ### DEBUG

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
        $.ajax(PAGE_ITEM()+'?'+$.param({path: path}))
            .fail( onError )
            .done( function(data) {
                try {
                    m_item = new ph.barthe.Item(data);
                    m_path = path;
                    if (m_item.isAlbum()) {
                        loadAlbum();
                    } else {
                        // ### TODO: loadPhoto();
                    }
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
    loadPath(m_path);

};


// Main function
$(document).ready(function() {
    var expo = new ph.barthe.Exposition($('#main'));
   
});

// Use strict footer
})();
