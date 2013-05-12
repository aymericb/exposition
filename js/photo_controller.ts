//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="../lib/jquery.d.ts" />
/// <reference path="common.ts" />
/// <reference path="config.ts" />
/// <reference path="item.ts" />
/// <reference path="controller.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {

    // Map size:string ->IMG element. 
    export interface SizeToImgElementMap {
        [size: string]: JQuery;
    }

    // Map path->size:string->IMG element. 
    export interface PathToSizeToImgElementMap {
        [path: string]: SizeToImgElementMap;
    }

    /**
     * PhotoController class
     *
     * The photo view provides the mechanism for loading and displaying a photo
     * into the browser view, at the most appropriate size. It also loads the parent
     * album and provide paging information (next/previous photo).
     *
     */
    export class PhotoController implements Controller {



        //
        // Private members
        //

        // Data Model
        private config: Config;
        private is_loaded: bool;                                // Flag to remember is first image was loaded (m_on_ready)
        private item: Item;                                     // Photo item to display
        private album: Item;                                    // Parent item
        private item_index: number;                             // Current child index for this.item within this.album

        // HTML
        private main_div: JQuery;                               // Root view
        private current_img: JQuery;                            // Currently displayed IMG element
        private images_ready: PathToSizeToImgElementMap = {};      // Fully loaded images.
        private images_loading: PathToSizeToImgElementMap = {};    // Images being loaded.

        // Constants
        private IMAGE_SIZES;

        /**
         * Constructor
         * No side effect on Main View. Use load()
         */
        constructor(config: Config, main_div: JQuery, item: Item) {

            // Preconditions
            assert(main_div);
            assert(item);
            assert(item.isPhoto());

            // Prepare IMAGE_SIZES
            this.config = config;
            this.main_div = main_div;
            this.item = item;
            this.IMAGE_SIZES = config.photoSizes().sort((a,b) => {return a-b;});

            // Load parent album (for photo navigation prev/next)
            var album_path = this.item.parentPath();
            var on_album_error = (jqXHR, textStatus, error) => {
                var msg = 'Cannot load parent album "'+album_path+'"';
                if (textStatus)
                    msg += '  '+textStatus;
                if (error && error.message)
                    msg += '  '+error.message;
                console.error(msg);
            };
            var on_album_success = (item) => {
                // Precondition
                this.album = item;
                assert(this.album);
                assert(this.album.children().length > 0);

                // Determine index of this.item within album
                var children = this.album.children();
                for (var i=0; i<children.length; ++i) {
                    if (children[i].path() === this.item.path()) {
                        this.item_index = i;
                        break;
                    }
                }
                this.onPageUpdate.fire(this.item_index, children.length);

                // Prefetch prev/next images
                var size = this.chooseSize(this.IMAGE_SIZES);
                this.prefetchImages(size);

                // Postcondition
                assert(this.item_index !== undefined);
            };
            Exposition.Item.Load(config, album_path, on_album_success, on_album_error);

            // Signals 
            this.onLoadPath = new Signal();
            this.onPathChanged = new Signal();
            this.onPageUpdate = new Signal();
            this.onReady = new Signal();
        }

        //
        // Image Cache (private)
        //

        /**
         * Add image to cache.
         * @param cache. Either this.images_ready or this.images_loading
         * @param path. From Item.path().
         * @param size. From IMAGE_SIZES.
         * @param el. IMG element
         */
        private setImage(cache: PathToSizeToImgElementMap, path: string, size: number, img: JQuery) {
            if (!cache[path])
                cache[path] = {};
            cache[path][size.toString()] = img;
        };

        private getCacheSize(hash_map) {
            var count = 0;
            for (var key in hash_map) {
                if (hash_map.hasOwnProperty(key)) {
                    count += 1;
                }
            }
            return count;
        };

        /**
         * Remove image from this.images_loading cache
         */
        private removeLoadingImage(path: string, size: number) {
            assert(this.images_loading[path]);
            assert(this.images_loading[path][size.toString()]);

            delete this.images_loading[path][size.toString()];               // Remove path+size
            if (this.getCacheSize(this.images_loading[path]) === 0)    // Remove path if empty
                delete this.images_loading[path];
        };

        /**
         * Get images from cache
         * @param cache param Either this.images_ready or this.images_loading
         * @param path  from Item.path().
         * @return The map containing the sizes and assets.
         */
        private getImages(cache: PathToSizeToImgElementMap, path: string): SizeToImgElementMap {
            if (cache[path])
                return cache[path];
            else
                return {};
        };

        //
        // Image Loading (private)
        //

        /**
         * Choose most appropriate size for image for the current view
         * @param sizes {array} Integers sorted by increasing number
         * @return the chosen size
         */
        private chooseSize(sizes: number[]) {
            // Precondition
            assert(Array.isArray(sizes) && sizes.length>0);

            // Get the size one step larger than view_size
            var view_size = Math.max(this.main_div.innerWidth(), this.main_div.innerHeight());
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
         * @param path 
         * @param size value from IMAGE_SIZES
         */
        private loadImage(path: string, size: number) {
            // Precondition
            assert(!(size.toString() in this.getImages(this.images_ready, path)), 'Image '+path+'@'+size+'px is already loaded');
            assert(!(size.toString() in this.getImages(this.images_loading, path)), 'Image '+path+'@'+size+'px is already being loaded');

            var url = this.config.makeImageUrl(size, path);
            var on_fail = () => {
                console.error('Failed to load image: '+url);
                this.removeLoadingImage(path, size);
                img.remove();

                // ### TODO. This is a very hacky way to provide
                // feedback by showing the caution icon instead of the image.
                // A better alternative would be to put this setting in a CSS and
                // make sure all CSS assets are pre-loaded at startup.
                // We should also display a regular div with text, rather than an image.
                img = $('<img>').hide();
                this.main_div.append(img);
                this.setImage(this.images_loading, path, size, img);
                img.addClass('error');
                img.attr('src', this.config.getCautionImageUrl());
                img.attr('alt', path);
                img.attr('title', 'Image '+path+' failed to load');
                var show_error = () => {
                    //removeLoadingImage(path, size);
                    this.setImage(this.images_ready, path, size, img);
                    console.log('path: '+path+'    size: '+size+'    img:'+img);
                    this.updateLayout();
                    if (!this.is_loaded && this.item.path()===path) {
                        this.is_loaded = true;
                        this.onReady.fire();
                    }
                };
                img.load(show_error);
                img.error(show_error);
            };
            var on_success = () => {
                this.removeLoadingImage(path, size);
                this.prefetchImages(size);
                this.setImage(this.images_ready, path, size, img);
                this.updateLayout();
                if (!this.is_loaded && this.item.path()===path) {
                    this.is_loaded = true;
                    this.onReady.fire();
                }
            };
            var img = Exposition.loadImage(url, on_success, on_fail, this.item.title());
            this.setImage(this.images_loading, path, size, img);
            img.hide();
            this.main_div.append(img);
        };

        /**
         * Prefetch the next and previous images at the current size
         */
        private prefetchImages(size: number) {
            // Check if album is loaded
            if (!this.album)
                return;

            // Check if no other image is loading
            if (this.getCacheSize(this.images_loading) !== 0)
                return;

            // Helper function
            var prefetch = (index) => {
                var path = children[index].path();
                if (!this.images_ready[path] && !this.images_loading[path]) {
                    this.loadImage(path, size);
                }
            };

            // Prefetch next/previous image
            var children = this.album.children();
            if (this.item_index>0)
                prefetch(this.item_index-1);
            if (this.item_index+1<children.length)
                prefetch(this.item_index+1);
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
        private gotoPage(offset: number) {
            // Preconditions
            assert(offset === 1 || offset === -1);

            // Change current state
            var children = this.album.children();
            this.item_index = this.item_index+offset;
            this.item = children[this.item_index];
            if (this.current_img)
                this.current_img.hide();
            this.current_img = null;

            // Notify application
            var path = this.item.path();
            this.onPageUpdate.fire(this.item_index, children.length);
            this.onPathChanged.fire(path);
            this.is_loaded = false;

            // Load best size
            var size = this.chooseSize(this.IMAGE_SIZES);
            if (size.toString() in this.getImages(this.images_ready, path)) {
                this.onReady.fire();
                this.updateLayout();
            } else if (size.toString() in this.getImages(this.images_loading, path)) {
                // Another loadImage() is in progress.
                // Wait for image to be loaded. updateLoayout() will be called to display the photo
            } else {
                this.loadImage(path, size);
            }

            // Prefetch prev/next images
            this.prefetchImages(size);
        };

        //
        // Public API
        //

        /**
         * Load photo into view
         *
         * This method clears this.main_div and load the photo.
         *
         * Throws on error. However the internal image loading errors are handled
         * internally as non critical errors, and displayed to the end-user.
         *
         */
        public load() {

            this.is_loaded = false;

            // Load best size
            var size = this.chooseSize(this.IMAGE_SIZES);
            this.loadImage(this.item.path(), size);
        };

        /**
         * Update layout of photo in the view
         *
         * This methods should be called whenever the view size changes. It should be called
         * only after the view was loaded with load(). This methods recenter the photo and
         * optionally triggers the download of a larger size photo.
         *
         */
        public updateLayout() {

            // Find the best loaded image for the current size of the view
            var sizes = [];         // size array
            var ready_imgs = this.getImages(this.images_ready, this.item.path());    // Map: size => jQuery element
            for (var key in ready_imgs)
                sizes.push(parseInt(key, 10));
            var size, img;
            if (sizes.length !== 0)
            {
                size = this.chooseSize(sizes);
                img = ready_imgs[size];
                //console.log('sizes: '+ sizes + '  size: '+size+'  ready_imgs: '+ready_imgs);
                assert(img && img.length === 1);
            }

            // Request a better image if necessary
            var best_size = this.chooseSize(this.IMAGE_SIZES);
            var is_best_size = !(size === undefined ||
                (best_size !== 0 && best_size > size) || (size !== 0 && best_size === 0));
            if (! is_best_size) {
                var already_loading = false;
                for (key in this.getImages(this.images_loading, this.item.path())) {
                    if (parseInt(key, 10) === best_size) {
                        already_loading = true;
                        break;
                    }
                }
                if (!already_loading) {
                    //console.log('load '+best_size);
                    this.loadImage(this.item.path(), best_size);
                }
            }
            if (!img)
                return;

            // Update current image
            if (this.current_img)
                this.current_img.hide();
            this.current_img = img;

            // Get sizes
            var img_width = img[0].naturalWidth;
            var img_height = img[0].naturalHeight;
            var img_ratio = img_width/img_height;
            var view_width = this.main_div.innerWidth();
            var view_height = this.main_div.innerHeight();
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
        public goToNext() {
            this.gotoPage(+1);
        };

        /** Go to previous page */
        public goToPrev() {
            this.gotoPage(-1);
        };

        /** Keyboard handler */
        public onKeydown(ev) {
            // Check if event can be handled
            assert(ev.which);
            if (!this.album)
                return true;

            // Check for left right arrow
            var KEYCODE_LEFT = 37;
            var KEYCODE_RIGHT = 39;
            var KEYCODE_UP = 38;
            var KEYCODE_ESCAPE = 27;
            if (ev.which === KEYCODE_LEFT && this.item_index>0) {
                this.gotoPage(-1);
                return false;
            } else if (ev.which === KEYCODE_RIGHT && this.item_index+1<this.album.children().length) {
                this.gotoPage(+1);
                return false;
            } else if ((ev.which === KEYCODE_UP || ev.which === KEYCODE_ESCAPE) && this.album) {
                this.onLoadPath.fire(this.album.path());
                return false;
            }
        };

        /** onLoadPath(path) -> path is a string pointing to the path to load. */
        public onLoadPath: Signal;

        /** onPathChanged(path) -> path changed within the view. */
        public onPathChanged: Signal;

        /**
         * onPageUpdate(show, current_page, total_page)
         * current_page {int}   -> current page, index 0
         * total_page {int}     -> number of pages in total >= 1
         */
        public onPageUpdate: Signal;

        /** onReady()            -> View is ready to show. */
        public onReady: Signal;
    };

}

