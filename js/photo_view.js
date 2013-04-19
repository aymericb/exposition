//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
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
 * PhotoView class
 *
 * The photo view provides the mechanism for loading and displaying a photo
 * into the browser view, at the most appropriate size. It also loads the parent
 * album and provide paging information (next/previous photo).
 *
 * Constructor
 * - config                     -> A ph.barthe.Config object
 * - main_div                   -> The display area for the photo
 * - item                       -> A ph.barthe.Item representing the item to display
 */
ph.barthe.PhotoView = function(config, main_div, item) {

    //
    // Redefinitions
    //
    var self = this;
    var assert = ph.barthe.assert;

    //
    // Private members
    //

    // Data Model
    var m_is_loaded;            // Flag to remember is first image was loaded (m_on_ready)
    var m_item = item;          // Photo item to display
    var m_album;                // Parent item
    var m_item_index;           // Current child index for m_item within m_album

    // HTML
    var m_main_div = main_div;  // Root view
    var m_current_img;          // Currently displayed IMG element
    var m_images_ready = {};    // Map path->size(str)->IMG element. Fully loaded images.
    var m_images_loading = {};  // Map path->size(str)->IMG element. Images being loaded.

    // Signal emitters
    var m_on_path_changed = {};
    var m_on_page_update = {};
    var m_on_load_path = {};
    var m_on_ready = {};

    // Constants
    var IMAGE_SIZES = config.photoSizes().sort(function(a,b){return a-b;});

    /**
     * Constructor
     * No side effect on Main View. Use load()
     */
    (function() {

        // Preconditions
        assert(m_main_div);
        assert(m_item);
        assert(m_item.isPhoto());

        // Load parent album (for photo navigation prev/next)
        var album_path = m_item.parentPath();
        var on_album_error = function(jqXHR, textStatus, error) {
            var msg = 'Cannot load parent album "'+album_path+'"';
            if (textStatus)
                msg += '  '+textStatus;
            if (error && error.message)
                msg += '  '+error.message;
            console.error(msg);
        };
        var on_album_success  = function(item) {
            // Precondition
            m_album = item;
            assert(m_album);
            assert(m_album.children().length > 0);

            // Determine index of m_item within album
            var children = m_album.children();
            for (var i=0; i<children.length; ++i) {
                if (children[i].path() === m_item.path()) {
                    m_item_index = i;
                    break;
                }
            }
            m_on_page_update.fire(m_item_index, children.length);

            // Prefetch prev/next images
            var size = chooseSize(IMAGE_SIZES);
            prefetchImages(size);

            // Postcondition
            assert(m_item_index !== undefined);
        };
        ph.barthe.Item.Load(config, album_path, on_album_success, on_album_error);
    })();

    //
    // Image Cache (private)
    //

    /**
     * Add image to cache.
     * @param {obj} cache. Either m_images_ready or m_images_loading
     * @param {string} path. From Item.path().
     * @param {int} size. From IMAGE_SIZES.
     * @param {jQuery el} img
     */
    var setImage = function(cache, path, size, img) {
        if (!cache[path])
            cache[path] = {};
        cache[path][size] = img;
    };

    var getCacheSize = function(hash_map) {
        var count = 0;
        for (var key in hash_map) {
            if (hash_map.hasOwnProperty(key)) {
                count += 1;
            }
        }
        return count;
    };

    /**
     * Remove image from m_images_loading cache
     */
    var removeLoadingImage = function(path, size) {
        assert(m_images_loading[path]);
        assert(m_images_loading[path][size]);

        delete m_images_loading[path][size];               // Remove path+size
        if (getCacheSize(m_images_loading[path]) === 0)    // Remove path if empty
            delete m_images_loading[path];
    };

    /**
     * Get images from cache
     * @param {obj} cache. Either m_images_ready or m_images_loading
     * @param {string} path. From Item.path().
     * @return {obj} Map size(str)->jQuery IMG.
     */
    var getImages = function(cache, path) {
        if (cache[path])
            return cache[path];
        else
            return [];
    };

    //
    // Image Loading (private)
    //

    /**
     * Choose most appropriate size for image for the current view
     * @param sizes {array} Integers sorted by increasing number
     * @return the chosen size
     */
     var chooseSize = function(sizes) {
        // Precondition
        assert(ph.barthe.isArray(sizes) && sizes.length>0);

        // Get the size one step larger than view_size
        var view_size = Math.max(m_main_div.innerWidth(), m_main_div.innerHeight());
        var i = 0;
        while(i<sizes.length && sizes[i]<view_size)
            i += 1;
        if (i === sizes.length)
            i -= 1;
        var size = sizes[i];

        // Special case for '0' which means native size
        if (sizes[i]<view_size && sizes[0] === 0)
            size = 0;

        // Postcondition
        assert(size !== undefined);
        return size;
    };

    /**
     * Load the image for path and size given
     * @param path {string}    album path
     * @param size {int}       value from IMAGE_SIZES
     */
    var loadImage = function(path, size) {
        // Precondition
        assert(!(size in getImages(m_images_ready, path)), 'Image '+path+'@'+size+'px is already loaded');
        assert(!(size in getImages(m_images_loading, path)), 'Image '+path+'@'+size+'px is already being loaded');

        var url = config.makeImageUrl(size, path);
        var on_fail = function() {
            console.error('Failed to load image: '+url);
            removeLoadingImage(path, size);
            img.remove();

            // ### TODO. This is a very hacky way to provide
            // feedback by showing the caution icon instead of the image.
            // A better alternative would be to put this setting in a CSS and
            // make sure all CSS assets are pre-loaded at startup.
            // We should also display a regular div with text, rather than an image.
            img = $('<img>').hide();
            m_main_div.append(img);
            setImage(m_images_loading, path, size, img);
            img.addClass('error');
            img.attr('src', config.getCautionImageUrl());
            img.attr('alt', path);
            img.attr('title', 'Image '+path+' failed to load');
            var show_error = function() {
                //removeLoadingImage(path, size);
                setImage(m_images_ready, path, size, img);
                console.log('path: '+path+'    size: '+size+'    img:'+img);
                self.updateLayout();
                if (!m_is_loaded && m_item.path()===path) {
                    m_is_loaded = true;
                    m_on_ready.fire();
                }
            };
            img.load(show_error);
            img.error(show_error);
        };
        var on_success = function(img) {
            removeLoadingImage(path, size);
            prefetchImages(size);
            setImage(m_images_ready, path, size, img);
            self.updateLayout();
            if (!m_is_loaded && m_item.path()===path) {
                m_is_loaded = true;
                m_on_ready.fire();
            }
        };
        var img = ph.barthe.loadImage(url, on_success, on_fail, m_item.title());
        setImage(m_images_loading, path, size, img);
        img.hide();
        m_main_div.append(img);
    };

    /**
     * Prefetch the next and previous images at the current size
     */
    var prefetchImages = function(size) {
        // Check if album is loaded
        if (!m_album)
            return;

        // Check if no other image is loading
        if (getCacheSize(m_images_loading) !== 0)
            return;

        // Helper function
        var prefetch = function(index) {
            var path = children[index].path();
            if (!m_images_ready[path] && !m_images_loading[path]) {
                loadImage(path, size);
            }
        };

        // Prefetch next/previous image
        var children = m_album.children();
        if (m_item_index>0)
            prefetch(m_item_index-1);
        if (m_item_index+1<children.length)
            prefetch(m_item_index+1);
    };

    //
    // Event Handling (private)
    //

    /** 
     * Go to next or previous page. The PhotoView handles the internal navigation instead
     * of emitting a onLoadPath signal. This is an optimization that makes it possible
     * for the PhotoView to pre-fetch next or previous items. It also avoids reloading the
     * previously seen photos. The app is notified of the navigation via the onPathChanged() signal.
     * @param {int} offset. +1 go to next page. -1 go to previous page. Other values not allowed.
     */
    var gotoPage = function(offset) {
        // Preconditions
        assert(offset === 1 || offset === -1);

        // Change current state
        var children = m_album.children();
        m_item_index = m_item_index+offset;
        m_item = children[m_item_index];
        if (m_current_img)
            m_current_img.hide();
        m_current_img = null;

        // Notify application
        var path = m_item.path();
        m_on_page_update.fire(m_item_index, children.length);
        m_on_path_changed.fire(path);
        m_is_loaded = false;

        // Load best size
        var size = chooseSize(IMAGE_SIZES);
        if (size in getImages(m_images_ready, path)) {
            m_on_ready.fire();
            self.updateLayout();
        } else if (size in getImages(m_images_loading, path)) {
            // Another loadImage() is in progress.
            // Wait for image to be loaded. updateLoayout() will be called to display the photo
        } else {
            loadImage(path, size);
        }

        // Prefetch prev/next images
        prefetchImages(size);
    };

    //
    // Public API
    //

    /**
     * Load photo into view
     *
     * This method clears m_main_div and load the photo.
     *
     * Throws on error. However the internal image loading errors are handled
     * internally as non critical errors, and displayed to the end-user.
     *
     */
    self.load = function() {

        m_is_loaded = false;

        // Load best size
        var size = chooseSize(IMAGE_SIZES);
        loadImage(m_item.path(), size);
    };

    /**
     * Update layout of photo in the view
     *
     * This methods should be called whenever the view size changes. It should be called
     * only after the view was loaded with load(). This methods recenter the photo and
     * optionally triggers the download of a larger size photo.
     *
     */
    self.updateLayout = function() {

        // Find the best loaded image for the current size of the view
        var sizes = [];         // size array
        var ready_imgs = getImages(m_images_ready, m_item.path());    // Map: size => jQuery element
        for (var key in ready_imgs)
            sizes.push(parseInt(key, 10));
        var size, img;
        if (sizes.length !== 0)
        {
            size = chooseSize(sizes);
            img = ready_imgs[size];
            //console.log('sizes: '+ sizes + '  size: '+size+'  ready_imgs: '+ready_imgs);
            assert(img && img.length === 1);
        }

        // Request a better image if necessary
        var best_size = chooseSize(IMAGE_SIZES);
        var is_best_size = !(size === undefined ||
            (best_size !== 0 && best_size > size) || (size !== 0 && best_size === 0));
        if (! is_best_size) {
            var already_loading = false;
            for (key in getImages(m_images_loading, m_item.path())) {
                if (parseInt(key, 10) === best_size) {
                    already_loading = true;
                    break;
                }
            }
            if (!already_loading) {
                //console.log('load '+best_size);
                loadImage(m_item.path(), best_size);
            }
        }
        if (!img)
            return;

        // Update current image
        if (m_current_img)
            m_current_img.hide();
        m_current_img = img;

        // Get sizes
        var img_width = img[0].naturalWidth;
        var img_height = img[0].naturalHeight;
        var img_ratio = img_width/img_height;
        var view_width = m_main_div.innerWidth();
        var view_height = m_main_div.innerHeight();
        var view_ratio = view_width/view_height;

        // Read margins from CSS
        img.addClass('photo');
        var h_margin = (img.outerWidth(true) - img.innerWidth())/2;
        var v_margin = (img.outerHeight(true) - img.innerHeight())/2;

        // Adjust IMG to center of view
        if (view_ratio > img_ratio) {
            // The view is wider. Maximize img height.
            img.height(Math.floor(view_height-2*v_margin));
            img.width(Math.floor(img_ratio*img.height()));
        } else {
            // The view is heigher. Maximize img width.
            img.width(Math.floor(view_width-2*h_margin));
            img.height(Math.floor(img.width()/img_ratio));
        }

        // Make sure the image is not scaled up ... 
        // ... unless a larger is being downloaded.
        if (is_best_size) {
            if (img.width()>img[0].naturalWidth)
                img.width(img[0].naturalWidth);
            if (img.height()>img[0].naturalHeight)
                img.height(img[0].naturalHeight);
        }

        img.css({
            top:Math.floor((view_height-img.outerHeight(true))/2),
            left:Math.floor((view_width-img.outerWidth(true))/2)
        });

        // Make visible
        img.show();
    };

    /** Go to next page */
    self.goToNext = function() {
        gotoPage(+1);
    };

    /** Go to previous page */
    self.goToPrev = function() {
        gotoPage(-1);
    };

    /** Keyboard handler */
    self.onKeydown = function(ev) {
        // Check if event can be handled
        assert(ev.which);
        if (!m_album)
            return true;

        // Check for left right arrow
        var KEYCODE_LEFT = 37;
        var KEYCODE_RIGHT = 39;
        var KEYCODE_UP = 38;
        var KEYCODE_ESCAPE = 27;
        if (ev.which === KEYCODE_LEFT && m_item_index>0) {
            gotoPage(-1);
            return false;
        } else if (ev.which === KEYCODE_RIGHT && m_item_index+1<m_album.children().length) {
            gotoPage(+1);
            return false;
        } else if ((ev.which === KEYCODE_UP || ev.which === KEYCODE_ESCAPE) && m_album) {
            m_on_load_path.fire(m_album.path());
            return false;
        }
    };

    /** onLoadPath(path) -> path is a string pointing to the path to load. */
    self.onLoadPath = new ph.barthe.Signal(m_on_load_path);

    /** onPathChanged(path) -> path changed within the view. */
    self.onPathChanged = new ph.barthe.Signal(m_on_path_changed);

    /**
     * onPageUpdate(show, current_page, total_page)
     * current_page {int}   -> current page, index 0
     * total_page {int}     -> number of pages in total >= 1
     */
    self.onPageUpdate = new ph.barthe.Signal(m_on_page_update);

    /** onReady()            -> View is ready to show. */
    self.onReady = new ph.barthe.Signal(m_on_ready);
};

// Use strict footer
})();