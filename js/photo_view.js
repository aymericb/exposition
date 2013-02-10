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
 * PhotoView class
 *
 * The photo view provides the mechanism for loading and displaying a photo
 * into the browser view, at the most appropriate size. It also loads the parent
 * album and provide paging information (next/previous photo).
 *
 * Constructor
 * - config                     -> A ph.barthe.Config object
 * - main_div                   -> display area for the photo
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
	var m_item = item;			// Photo item to display
	var m_album;				// Parent item
    var m_item_index;           // Current child index for m_item within m_album

    // HTML
    var m_main_div = main_div;  // Root view
    var m_current_img;          // Currently displayed IMG element
    var m_loading_div;          // Contains IMG elements being loaded
    var m_ready_div;            // Contains IMG elements ready to display

    // Signal emitters
    var m_on_page_update = {};
    var m_on_load_path = {};

    // Constants
    var PAGE_IMAGE = config.pageImage();
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

        // Create laoding and ready divs
        m_loading_div = $('<div>').attr('id', 'photo-loading').hide();
        m_ready_div = $('<div>').attr('id', 'photo-ready');
        m_main_div.append(m_loading_div);
        m_main_div.append(m_ready_div);

        // Load parent album (for photo navigation prev/next)
        var album_path = m_item.path().substring(0, m_item.path().lastIndexOf('/'));
        if (album_path === '')
            album_path = '/';
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
            m_on_page_update.fire([m_item_index, children.length]);

            // Postcondition
            assert(m_item_index !== undefined);
        };
        ph.barthe.Item.Load(config.pageItem(), album_path, on_album_success, on_album_error);
    })();

    var generateId = function(path) {
        assert(path);
        return ph.barthe.generateId(path, 'photo');
    };

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
        var url = PAGE_IMAGE+'?'+$.param({path:m_item.path(), size: size});
        var on_fail = function() {
            // ### TODO
        };
        var on_success = function(img) {
            m_ready_div.append(img);
            self.updateLayout();
        };
        var img = ph.barthe.loadImage(url, on_success, on_fail, m_item.title());
        img.addClass(generateId(path));
        img.attr('data-size', size);
        img.hide();
        m_loading_div.append(img);
    };

    /**
     * Load photo into view
     *
     * This method clears m_main_div and load the photo.
     *
     * Throws on error. However the internal image loading errors are handled
     * interally as non critical errors, and displayed to the end-user.
     *
     */
    self.load = function() {

        // Clear main view
        // ### m_main_div.empty();

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

        // Helper function
        var get_size = function(img) {
            var size = img.attr('data-size');
            assert(size);
            size = parseInt(size, 10);
            assert(!isNaN(size));
            return size;
        };

        // Find the best loaded image for the current size of the view
        var sizes = [];         // size array
        var ready_imgs = {};    // Map: size => jQuery element
        m_ready_div.find('.'+generateId(m_item.path())).each(function() {
            var size = get_size( $(this) );
            ready_imgs[size] = $(this);
            sizes.push(size);
        });
        var size, img;
        if (sizes.length !== 0)
        {
            size = chooseSize(sizes);
            img = ready_imgs[size];
            //console.log('sizes: '+ sizes + '  size: '+size+'  ready_imgs: '+ready_imgs);
            assert(img && img.length > 0);
        }

        // Request a better image if necessary
        var best_size = chooseSize(IMAGE_SIZES);
        if (size === undefined || (best_size !== 0 && best_size > size) ||
                                  (size !== 0 && best_size === 0)) {
            var already_loading = false;
            m_loading_div.find('.'+generateId(m_item.path())).each(function() {
                if (get_size($(this)) === best_size)
                    already_loading = true;
            });
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
        img.css({
            top:Math.floor((view_height-img.outerHeight(true))/2),
            left:Math.floor((view_width-img.outerWidth(true))/2)
        });

        // Make visible
        img.show();
    };

    // ### FIXME. Currently we force a re-loading of the next photo
    // This is stupid. We should keep the current AlbumView and update
    // the status of Exposition. Additionally, we can modify AlbumView to
    // prefetch previous/next images.

    /** Go to next page */
    self.goToNext = function() {
        m_on_load_path.fire([m_album.children()[m_item_index+1].path()]);
    };

    /** Go to previous page */
    self.goToPrev = function() {
        m_on_load_path.fire([m_album.children()[m_item_index-1].path()]);
    };

    /** onLoadPath(path) -> path is a string pointing to the path to load. */
    self.onLoadPath = new ph.barthe.Signal(m_on_load_path);

    /**
     * onPageUpdate(show, current_page, total_page)
     * current_page {int}   -> current page, index 0
     * total_page {int}     -> number of pages in total >= 1
     */
    self.onPageUpdate = new ph.barthe.Signal(m_on_page_update);

};

// Use strict footer
})();