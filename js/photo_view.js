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

    // HTML
    var m_main_div = main_div;  // Root view
    var m_img;                  // Image element

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

        // ### TODO. Load parent album

    })();

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

        // Clear div
        m_main_div.empty();

        // Choose most appropriate size
        var view_size = Math.max(m_main_div.innerWidth(), m_main_div.innerHeight());
        var i = 0;
        while(i<IMAGE_SIZES.length && IMAGE_SIZES[i]<view_size)
            i += 1;
        var size = IMAGE_SIZES[i];
        //console.log("All sizes: "+IMAGE_SIZES);
        //console.log("View size: "+view_size);
        if (IMAGE_SIZES[i]<view_size && IMAGE_SIZES[0] === 0)
            size = 0;   // 0 means 'native size'
        //console.log("Chose size: "+size);

        // Load image
        var url = PAGE_IMAGE+'?'+$.param({path:m_item.path(), size: size});
        var on_fail = function() {
            // ### TODO
        };
        var on_success = function(img) {
            // ###  TODO

            // Get sizes
            var img_width = img[0].naturalWidth;
            var img_height = img[0].naturalHeight;
            var img_ratio = img_width/img_height;
            var view_width = m_main_div.innerWidth();
            var view_height = m_main_div.innerHeight();
            var view_ratio = view_width/view_height;

            // Adjust
            // ### FIXME. Use CSS style. Compute margins/padding/borders etc...
            if (view_ratio > img_ratio) {
                // The view is wider. Maximize img height.
                img.height(view_height);
                img.width(img_ratio*img.height());
                img.css({top:0, left:(view_width-img.width())/2, position:"absolute" });
            } else {
                // The view is heigher. Maximize img width.
                img.width(view_width);
                img.height(img.width()/img_ratio);
                img.css({top:(view_height-img.height())/2, left:0, position:"absolute"});
            }

            // Show image
            img.show();
        };
        var img = ph.barthe.loadImage(url, on_success, on_fail, m_item.title());
        img.hide();
        m_main_div.append(img);

        // m_loading_div = $('<div>').attr('id', 'album-loading').hide();
        // m_main_div.append(m_loading_div);

    };

};

// Use strict footer
})();