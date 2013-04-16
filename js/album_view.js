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
 * Shared photo cache between all AlbumView instances. 
 * This is used so that an album using a photo from a sub album, and the sub album itself,
 * have the same thumbnail in the AlbumView.
 */
var PhotoCache = function() {
    // Private members
    var self = this;
    var m_photo_cache = {};               // Map. ph.barthe.item -> {str} path

    // Public API
    self.getPhotoPath = function(item) {
        // Precondition
        ph.barthe.assert(item.isAlbum());

        // Handle empty album case
        var children = item.children();
        if (children.length === 0)
            return '';

        // Handle cached photos
        var item_key = item.path();
        if (item_key in m_photo_cache)
            return m_photo_cache[item_key];

        // Extract items within album which are photos
        var photos = [];
        var albums = [];
        for (var i=0; i<children.length; ++i) {
            if (children[i].isPhoto())
                photos.push(children[i]);
            else
                albums.push(children[i]);
        }

        // Get random photo
        if (photos.length === 0) {
            // Recurse until we find an album with a photo
            while (albums.length > 0) {
                var r1 = Math.floor(Math.random() * albums.length);
                var recursive_photo_path = self.getPhotoPath(children[r1]);
                if (recursive_photo_path) {
                    m_photo_cache[item_key] = recursive_photo_path;
                    return recursive_photo_path;
                }
                albums.splice(r1, 1);
            }
            return '';
        } else {
            var r2 = Math.floor(Math.random() * photos.length);
            var photo_path = photos[r2].path();
            m_photo_cache[item_key] = photo_path;
            return photo_path;
        }
    };
};

// Global instance
var g_photo_cache = new PhotoCache();

/**
 * AlbumView class
 *
 * The album view provides the mechanism for loading an album into the browser view.
 * It is responsible for creating, loading and displaying the thumbnails. It also
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
    var m_item = item;              // Root item of the album
    var m_children = [];            // Array. idx => {photo_path: 'str', div: 'jQuery obj', item: 'ph.barthe.Item'}
        // CAUTION: m_item.children() may have holes but not m_children. In that case indices do not match.
    var m_selected_index = null;    // Int. Index (of m_children) of currently selected item. Null if none.

    // HTML
    var m_main_div = main_div;      // Root view
    var m_loading_div;              // Hidden div used temporarily to load assets
    var m_row_count;                // Number of rows per page
    var m_col_count;                // Number of columns per page

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
        // - div:        HTML div of class 'thumbnail'
        // - item:       underlying ph.barthe.Item object from m_item.children()
        var children = m_item.children();
        for (var i=0; i<children.length; ++i) {

            // Get path to photo element
            var path = children[i].path();
            if (children[i].isAlbum())
                path = g_photo_cache.getPhotoPath(children[i]);

            // It is possible to get an empty album. Skip it.
            if (!path)
                continue;

            // Store information
            m_children.push({
                photo_path: path,
                div: $('<div>').addClass('item').hide(),
                item: children[i]
            });
        }
    })();

    /** 
     * Load thumbnail asynchronously
     * @param {int} index     Index representing the data to load from m_children.
     * @param {obj} events    An event object that contains the event handlers that needs to be
     *                        attached to the element representing the item. This can be an IMG
     *                        element if the image loaded properly or a special div or class 'error'
     *   - events.on_mouse_click   function()
     *   - events.on_mouse_enter   function()
     *   - events.on_mouse_leave   function()
     *   - events.on_mouse_move    function(ev)  ev = jQuery event
     * @return {jQuery obj} The div representing the item whose data is being loaded.
     // ### TODO: Pass parameters as struct obj
     */
    var loadThumnail = function(index, events) {

        // Preconditions
        assert(typeof index === 'number');
        assert(events);
        assert('on_mouse_click' in events && typeof events.on_mouse_click === 'function');
        assert('on_mouse_enter' in events && typeof events.on_mouse_enter === 'function');
        assert('on_mouse_leave' in events && typeof events.on_mouse_leave === 'function');
        assert('on_mouse_move' in events  && typeof events.on_mouse_move === 'function');

        // Extract data from model
        var url = config.makeImageUrl(THUMBNAIL_SIZE, m_children[index].photo_path);
        var div_item = m_children[index].div;
        var item = m_children[index].item;
        assert(url && div_item && div_item.length === 1 && item);

        // Setup DOM
        if (item.isAlbum()) {
            div_item.addClass('album-item');
        } else {
            assert(item.isPhoto());
            div_item.addClass('photo-item');
        }
        div_item.css( {
            width: THUMBNAIL_SIZE+'px',
            height: (THUMBNAIL_SIZE+THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT)+'px'
        });
        var div_title = $('<div>').addClass('title').text( item.title() ).hide();
        div_item.append(div_title);

        // Add final img element to DOM
        var add_thumbnail_element = function(el, ratio, natural_width, natural_height) {

            // Add image and text to DOM (required to compute graphics margins)
            el.addClass('thumbnail');
            el.click(events.on_mouse_click);
            el.mouseenter(events.on_mouse_enter);
            el.mousemove(events.on_mouse_move);
            el.mouseleave(events.on_mouse_leave);
            div_item.append(el);

            // Compute position
            var v_margin = THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT;
            var h_padding = Math.floor((el.outerWidth()-el.width())/2);
            var v_padding = el.outerHeight()-el.height();
            var parent_height = div_item.height()-v_margin;
            var top, height;

            // Center element
            if (natural_width === undefined || natural_width >= natural_height) {
                height = Math.floor(div_item.width()/ratio);
                top = Math.floor( (parent_height-height)/2 );
                el.css({
                    top: top,
                    left: -h_padding,
                    width: div_item.width(),
                    height: height
                });
            } else {
                var w = Math.floor(parent_height*ratio);
                top = 0;
                height = parent_height;
                el.css({
                    top: 0,
                    left: Math.floor( (div_item.width()-w)/2 )-h_padding,
                    width: w,
                    height: parent_height
                });
            }

            // Setup title and album background element
            div_title.css('top', top+height+v_margin-div_title.outerHeight()+v_padding);
            if (item.isAlbum()) {
                var div_album_bg = $('<div>').addClass('thumbnail');
                div_album_bg.css(el.css(['top', 'left', 'width', 'height']));
                div_item.prepend(div_album_bg.addClass('album-background'));
            }
        };

        // Setup load spinner
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
            //div_item.hide();
            div_title.show();
        };
        var start_spinner = function() {
            div_item.show();
            div_title.show();
            spinner.spin(div_item[0]);
        };
        var spin_timer = setTimeout(start_spinner, 500);

        // Load image asynchronously
        var on_fail = function(img) {
            // Reset spinner
            stop_spinner();
            if (img)
                img.hide();

            // Add error placeholder
            var div_error = $('<div>');
            div_error.addClass('item thumbnail error');
            div_item.append(div_error);
            add_thumbnail_element(div_error, 1.5);
            div_item.show();
            console.error('Failed to download thumbnail: '+url);
        };
        var on_success = function(img) {
            try
            {
                // Reset spinner
                stop_spinner();
                img.show();

                // Position image
                var ratio = img.get(0).naturalWidth/img.get(0).naturalHeight;
                add_thumbnail_element(img, ratio, img.get(0).naturalWidth, img.get(0).naturalHeight);

                // Show
                img.attr('alt', item.title());
                img.attr('title', item.title());
                div_item.show();
            } catch (err) {
                if (err && err.message)
                    console.error("Error: "+err.message);
                on_fail(img);
            }
        };
        ph.barthe.loadImage(url, on_success, on_fail, div_title.text());

        // Return containing div
        return div_item;
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

    /** 
     * Change current selection. The previously selected item is automatically un-selected.
     * @param {int} index of item to select, or null if deselecting the current item.
     */
    var selectItem = function(index) {
        // Deselect current item
        var div;
        if (m_selected_index !== null) {
            // Remove CSS style
            div = m_children[m_selected_index].div;
            assert(div && div.length === 1);
            div.removeClass('selected');
        }

        // Select new current item
        m_selected_index = index;
        if (m_selected_index !== null) {
            // Add CSS style 
            div = m_children[m_selected_index].div;
            assert(div && div.length === 1);
            div.addClass('selected');

            // Change current page if necessary
            assert(m_row_count && m_col_count);
            var page_index = Math.floor(m_selected_index/(m_row_count*m_col_count));
            if (m_current_page_index !== page_index)
                setCurrentPage(page_index);
        }
    };

    //
    // Public API
    //

    /**
     * Load album into view
     *
     * This method clears album_div, create and layout the photo thumbnails for
     * the current album. This method implicitly calls updateLayout().
     *
     * Throws on error. However thumbnail image loading errors are handled
     * internally as non critical errors, and display to the end-user.
     *
     */
    self.load = function() {

        // Clear divs
        m_main_div.empty();
        m_loading_div = $('<div>').attr('id', 'album-loading').hide();
        m_main_div.append(m_loading_div);

        // Event handlers
        var on_click = function(item) {
            return function() {
                m_on_load_path.fire(item.path());
            };
        };
        var on_mouse_enter = function(index) {
            return function() {
                selectItem(index);
            };
        };
        var on_mouse_move = function(index) {
            var m_prev_x;
            var m_prev_y;
            return function(ev) {
                // We need to filter out 'fake' mousemove events which are generated
                // when keyboard shortcuts are used and the mouse does not move.
                if (ev.pageX !== m_prev_x || ev.pageY !== m_prev_y) {
                    m_prev_x = ev.pageX;
                    m_prev_y = ev.pageY;
                    selectItem(index);
                }
            };
        };
        var on_mouse_leave = function() {
            return function() {
                selectItem(null);
            };
        };

        // Load thumbnails
        for (var i=0; i<m_children.length; ++i) {
            var div_item = loadThumnail(i, {
                on_mouse_click: on_click(m_children[i].item),
                on_mouse_enter: on_mouse_enter(i),
                on_mouse_leave: on_mouse_leave(i),
                on_mouse_move:  on_mouse_move(i)
            });
            m_loading_div.append(div_item);
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
     * of the album items the items (and thumbnails). It tries to display as many of them
     * as possible, and create pagination if there are too many.
     *
     */
    self.updateLayout = function() {

        // Precondition
        assert(m_main_div);
        assert(m_loading_div);

        // Compute sizes
        var VIEW_WIDTH  = m_main_div.width();
        var VIEW_HEIGHT = m_main_div.height();
        var WIDTH       = THUMBNAIL_MARGIN + THUMBNAIL_SIZE;
        var HEIGHT      = THUMBNAIL_MARGIN + THUMBNAIL_SIZE+THUMBNAIL_TITLE_MARGIN+THUMBNAIL_TITLE_HEIGHT;
        var COL_COUNT   = Math.floor( (VIEW_WIDTH-2*THUMBNAIL_MARGIN)/WIDTH );
        var ROW_COUNT   = Math.floor( (VIEW_HEIGHT-2*THUMBNAIL_MARGIN)/HEIGHT );
        if (ROW_COUNT === 0) ROW_COUNT = 1;
        if (COL_COUNT === 0) COL_COUNT = 1;
        m_row_count = ROW_COUNT;
        m_col_count = COL_COUNT;
        var H_MARGIN    = Math.floor( (VIEW_WIDTH - COL_COUNT*WIDTH + THUMBNAIL_MARGIN)/2 );
        var V_MARGIN    = Math.floor( (VIEW_HEIGHT - ROW_COUNT*HEIGHT + THUMBNAIL_MARGIN)/2 );
        if (COL_COUNT*ROW_COUNT > m_children.length)
            V_MARGIN = THUMBNAIL_MARGIN;
        if (COL_COUNT >= m_children.length)
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
            var item = m_children[i].div;
            assert(item && item.length === 1);
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

    /** Keyboard handler */
    self.onKeydown = function(ev) {
        assert(ev.which);
        assert(m_col_count !== undefined && m_row_count !== undefined);

        // Keycode constants
        var KEYCODE_LEFT = 37;
        var KEYCODE_RIGHT = 39;
        var KEYCODE_UP = 38;
        var KEYCODE_DOWN = 40;
        var KEYCODE_ESCAPE = 27;
        var KEYCODE_ENTER = 13;

        // Handle ESC and ENTER
        if (ev.which === KEYCODE_ESCAPE) {
            if (m_selected_index === null) {
                if (m_item.path() !== '/') {
                    m_on_load_path.fire(m_item.parentPath());
                    return false;
               }
            } else {
                selectItem(null);
                return false;
            }
            return true;
        } else if (ev.which === KEYCODE_ENTER && m_selected_index !== null) {
            m_on_load_path.fire(m_children[m_selected_index].item.path());
            return false;
        }

        // Handle arrows when no selection exists
        if (m_selected_index === null) {
            if (ev.which === KEYCODE_LEFT || ev.which === KEYCODE_RIGHT || ev.which === KEYCODE_DOWN || ev.which === KEYCODE_ENTER) {
                selectItem(m_row_count*m_col_count*m_current_page_index);
                return false;
            } else if (ev.which === KEYCODE_UP) {
                if (m_item.path() !== '/') {
                    m_on_load_path.fire(m_item.parentPath());
                }
            }
        }

        // Handle arrows when a current selection exists
        if (ev.which === KEYCODE_LEFT && m_selected_index>0) {
            selectItem(m_selected_index-1);
            return false;
        } else if (ev.which === KEYCODE_RIGHT && m_selected_index+1<m_children.length) {
            selectItem(m_selected_index+1);
            return false;
        } else if (ev.which === KEYCODE_DOWN && m_selected_index+m_col_count<m_children.length) {
            selectItem(m_selected_index+m_col_count);
            return false;
        } else if (ev.which === KEYCODE_UP && m_selected_index-m_col_count>=0) {
            selectItem(m_selected_index-m_col_count);
            return false;
        }

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