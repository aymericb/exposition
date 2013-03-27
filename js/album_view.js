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
 * Constructor parameters
 * - config                     -> A ph.barthe.Config object
 * - main_div                   -> display area for the album
 * - item                       -> A ph.barthe.Item representing the album to display
 */
ph.barthe.AlbumView = function(config, main_div, item) {

    //
    // Redefinitions
    //
    var self = this;
    var assert = ph.barthe.assert;

    //
    // Private members
    //

    // Data Model
    var m_album_to_photo = ph.barthe.AlbumViewCache.album_to_photo;
    var m_item = item;              // Root item of the album

    // HTML
    var m_main_div = main_div;      // Root view
    var m_children = [];            // Array. Child idx => {photo_path: 'str', id: 'str'}
        // CAUTION: m_children may have holes, has not all childrens may have photos
    var m_children_count = 0;       // Real number of children (excluding holes)
    var m_loading_div;              // Hidden div used temporarily to load assets

    // Page Handling
    var m_page_count;
    var m_current_page_index=0;
    var m_current_page_div;

    // Event handling
    var m_on_load_path = {};
    var m_on_page_update = {};
    var m_on_ready = {};

    //
    // Config Constants
    //
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
     * image loading errors are handled internally.
     *
     * Design loosely inspired by
     * - http://stackoverflow.com/questions/4285042/can-jquery-ajax-load-image
     * - http://stackoverflow.com/questions/5057990/how-can-i-check-if-a-background-image-is-loaded
     *
     * Calls setCurrentPage() internally.
     */
    var loadThumnailImage = function(url, v_margin, parent, div_title) {
        // Preconditions
        assert(url && typeof url === 'string');
        assert(typeof v_margin === 'number');
        assert(parent.length === 1);
        assert(div_title.length === 1);

        var spin_timer;
        var spinner = new ph.barthe.Spinner({
            color:  '#fff',
            lines:  11,
            length: 3,
            width: 3,
            radius: 6,
            speed: 1.5
        });
        var stop_spinner = function() {
            if (spin_timer) {
                clearTimeout(spin_timer);
                spin_timer = null;
            }
            spinner.stop();
            parent.hide();
            div_title.show();
        };
        var center_element = function(el, ratio, natural_width, natural_height) {
            var h_padding = Math.floor((el.outerWidth()-el.width())/2);
            var v_padding = el.outerHeight()-el.height();
            var parent_height = parent.height()-v_margin;
            /*var height = Math.floor(parent.width()/ratio);
            var top = Math.floor( (parent_height-height)/2 );*/
            var top, height;
            if (natural_width === undefined || natural_width >= natural_height) {
                height = Math.floor(parent.width()/ratio);
                top = Math.floor( (parent_height-height)/2 );
                el.css({
                    top: top,
                    left: -h_padding,
                    width: parent.width(),
                    height: height
                });
            } else {
                var w = Math.floor(parent_height*ratio);
                top = 0;
                height = parent_height;
                el.css({
                    top: 0,
                    left: Math.floor( (parent.width()-w)/2 )-h_padding,
                    width: w,
                    height: parent_height
                });
            }
            div_title.css('top', top+height+v_margin-div_title.outerHeight()+v_padding);
        };
        var on_fail = function(img) {
            // Reset spinner
            stop_spinner();
            if (img)
                img.hide();

            // Add error placeholder
            var div_error = $('<div>');
            div_error.addClass('item thumbnail error');
            parent.append(div_error);
            center_element(div_error, 1.5);
            parent.show();
        };
        var on_success = function(img) {
            try
            {
                // Reset spinner
                stop_spinner();
                img.show();

                // Position image
                var ratio = img.get(0).naturalWidth/img.get(0).naturalHeight;
                center_element(img, ratio, img.get(0).naturalWidth, img.get(0).naturalHeight);

                parent.show();
            } catch (err) {
                if (err && err.message)
                    console.error("Error: "+err.message);
                on_fail(img);
            }
        };
        var start_spinner = function() {
            parent.show();
            div_title.show();
            spinner.spin(parent[0]);
        };
        spin_timer = setTimeout(start_spinner, 500);
        return ph.barthe.loadImage(url, on_success, on_fail, div_title.text());
    };

    /**
     * Set the current page of the album.
     * Hides the current page and makes the page referenced by page_index visible.
     * page_index is an integer that represent the page number. 0 <= page_index < m_page_count
     * This method updates m_current_page_div and m_current_page_index when it succeeds.
     */
    var setCurrentPage = function(page_index)
    {
        // Preconditions
        if (ph.barthe.debug)
            console.log("Showing page "+(page_index+1));
        assert(page_index >= 0);
        assert(page_index < m_page_count);

        // Hide current page
        m_on_page_update.fire(false);
        if (m_current_page_div)
            m_current_page_div.hide();

        // Get page div
        var id = 'album-page-'+(page_index+1);
        var div_page = $('#'+id);
        assert(div_page.length !== 0);

        // Make new page visible
        m_current_page_index = page_index;
        m_current_page_div = div_page;
        m_current_page_div.show();
        m_on_page_update.fire(true, page_index, m_page_count);
    };

    //
    // Public API
    //

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

        // Click handler
        var on_click = function(item) {
            return function() {
                m_on_load_path.fire(item.path());
            };
        };

        // Load thumbnails
        var children = m_item.children();
        for (var i=0; i<m_children.length; ++i) {

            // Skip empty albums
            if (!m_children[i])
                continue;
            m_children_count += 1;

            // Read properties
            var url = config.makeImageUrl(THUMBNAIL_SIZE, m_children[i].photo_path);
            var id = m_children[i].id;
            var item = m_item.children()[i];
            assert(url && id && item);

            // Create elements
            var div_item = $('<div>').addClass('item').attr('id', id).hide();
            if (item.isAlbum()) {
                div_item.addClass('album-item');
            } else {
                assert(item.isPhoto());
                div_item.addClass('photo-item');
            }
            div_item.click(on_click(item));
            div_item.css( {
                width: THUMBNAIL_SIZE+'px',
                height: (THUMBNAIL_SIZE+THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT)+'px'
            });
            var div_title = $('<div>').addClass('title').text( children[i].title() ).hide();
                // ### FIXME: What if title too large
            //var div_thumbnail = $('<div>').addClass('thumbnail');
            var img = loadThumnailImage(url, THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT, div_item, div_title).hide();
            img.addClass('thumbnail');
            div_item.append(img);
            div_item.append(div_title);
            m_loading_div.append(div_item);
            // ### DEBUG console.log(url);
        }

        // Update layout
        self.updateLayout();

        // ### FIXME:
        m_on_ready.fire();
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
                    $('#'+m_children[i].id).show();
                    console.log("No div for "+m_children[i].id);
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
        var COL_COUNT   = Math.floor( (VIEW_WIDTH-2*THUMBNAIL_MARGIN)/WIDTH );
        var ROW_COUNT   = Math.floor( (VIEW_HEIGHT-2*THUMBNAIL_MARGIN)/HEIGHT );
        if (ROW_COUNT === 0) ROW_COUNT = 1;
        if (COL_COUNT === 0) COL_COUNT = 1;
        var H_MARGIN    = Math.floor( (VIEW_WIDTH - COL_COUNT*WIDTH + THUMBNAIL_MARGIN)/2 );
        var V_MARGIN    = Math.floor( (VIEW_HEIGHT - ROW_COUNT*HEIGHT + THUMBNAIL_MARGIN)/2 );
        if (COL_COUNT*ROW_COUNT > m_children_count)
            V_MARGIN = THUMBNAIL_MARGIN;
        if (COL_COUNT >= m_children_count)
            H_MARGIN = THUMBNAIL_MARGIN;
        if (ph.barthe.debug) {
            console.log('Resizing album. Items: '+m_children.length+' COL_COUNT: '+COL_COUNT+' ROW_COUNT: '+ROW_COUNT);
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
        var x = H_MARGIN;
        var y = V_MARGIN;
        m_page_count = 1;
        for (var i=0; i<m_children.length; ++i) {

            // Skip empty
            if (!m_children[i])
                continue;

            // Move item
            var item = $('#'+m_children[i].id);
            assert(item.length === 1);
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
                    m_page_count += 1;
                }
            }
        }

        // Check if last page is empty
        if (pageElement.children().length === 0)
            m_page_count -= 1;

        // Update page handler
        if (m_current_page_index>=m_page_count)
            m_current_page_index = m_page_count-1;
        setCurrentPage(m_current_page_index);
    };

    /** Go to next page */
    self.goToNext = function() {
        setCurrentPage(m_current_page_index+1);
    };

    /** Go to previous page */
    self.goToPrev = function() {
        setCurrentPage(m_current_page_index-1);
    };

    /** onLoadPath(path)    -> path {string} the path to load. */
    self.onLoadPath = new ph.barthe.Signal(m_on_load_path);

    /**
     * onPageUpdate(show, current_page, total_page)
     * show {bool}          -> if false, hide ignore other parameters
     * current_page {int}   -> current page, index 0
     * total_page {int}     -> number of pages in total >= 1
     */
    self.onPageUpdate = new ph.barthe.Signal(m_on_page_update);

    /** onReady()            -> View is ready to show. */
    self.onReady = new ph.barthe.Signal(m_on_ready);
};

// Use strict footer
})();