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

    // Load callback
    export interface PhotoLoadCallback {
        (success: bool): void;
    }

    // Map path -> array of load callbacks
    export interface PathToPhotoLoadCallback {
        [path: string]: PhotoLoadCallback[];
    }


    /**
     * PhotoController class
     *
     * The photo view provides the mechanism for loading and displaying a photo
     * into the browser view, at the most appropriate size. It also loads the parent
     * album and provide paging information (next/previous photo).
     *
     */
    export class PhotoView {


        //
        // Private members
        //

        // Data Model
        private config: Config;
        private is_loaded: bool;                                // Flag to remember is first image was loaded (m_on_ready)
        private item: Item;                                     // Photo item to display

        // HTML        
        private main_div: JQuery;                                  // Root view
        private cache_div: JQuery;                                 // Cache DIV (invisible)
        private current_img: JQuery;                               // Currently displayed IMG element
        private images_ready: PathToSizeToImgElementMap = {};      // Fully loaded images.
        private images_loading: PathToSizeToImgElementMap = {};    // Images being loaded.
        private callbacks_loading: PathToPhotoLoadCallback = {};   // Callbacks of the images being loaded.
        private fade_duration: number;                             // In ms. Set by fadeTo().

        // Constants
        private IMAGE_SIZES;

        /**
         * Constructor
         * No side effect on Main View. Use load()
         */
        constructor(config: Config, main_div: JQuery) {

            // Preconditions
            assert(main_div);

            // Create cache_div
            this.main_div = main_div;
            this.cache_div = $('<div>').attr('id', 'cache').hide();
            this.cache_div.appendTo(this.main_div);

            // Prepare IMAGE_SIZES
            this.config = config;
            this.IMAGE_SIZES = config.photoSizes().sort((a,b) => {return a-b;});

            // Signals 
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

        /** Check if image exists in cache for given size */
        private hasImage(cache: PathToSizeToImgElementMap, path: string, size: number): bool {
            if (cache[path]) {
                if (cache[path][size.toString()])
                    return true;
                else
                    return false;
            } else {
                return false;
            }
        }

        private addLoadingCallback(path: string, callback: PhotoLoadCallback) {
            if (!(path in this.callbacks_loading))
                this.callbacks_loading[path] = [];
            this.callbacks_loading[path].push(callback);
        }

        //
        // Image Loading (private)
        //

        /**
         * Choose most appropriate size for image for the current view
         * @param sizes {array} Integers sorted by increasing number
         * @return the chosen size
         */
        private chooseSize(sizes: number[]): number {
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
            var trigger_callbacks = (success: bool) => {
                if (path in this.callbacks_loading) {
                    var callbacks = this.callbacks_loading[path]
                    for (var i=0; i<callbacks.length; ++i)
                        callbacks[i](success);
                    delete this.callbacks_loading[path];
                }                
            };
            var on_fail = () => {
                console.error('Failed to load image: '+url);
                this.removeLoadingImage(path, size);
                img.remove();

                // ### TODO. This is a very hacky way to provide
                // feedback by showing the caution icon instead of the image.
                // A better alternative would be to put this setting in a CSS and
                // make sure all CSS assets are pre-loaded at startup.
                // We should also display a regular div with text, rather than an image.
                img = $('<img>');
                this.cache_div.append(img);
                this.setImage(this.images_loading, path, size, img);
                img.addClass('error');
                img.attr('src', this.config.getCautionImageUrl());
                img.attr('alt', path);
                img.attr('title', 'Image '+path+' failed to load');
                var show_error = () => {
                    //removeLoadingImage(path, size);
                    this.setImage(this.images_ready, path, size, img);
                    //console.log('path: '+path+'    size: '+size+'    img:'+img);
                    this.updateLayout();
                    if (!this.is_loaded && this.item && this.item.path()===path) {
                        this.is_loaded = true;
                        this.onReady.fire();
                    }
                };
                (<any>img).load(show_error);
                (<any>img).error(show_error);
                trigger_callbacks(false);
            };
            var on_success = () => {
                this.removeLoadingImage(path, size);
                // ### FIXME this.prefetchImages(size);
                this.setImage(this.images_ready, path, size, img);
                this.updateLayout();
                if (!this.is_loaded && this.item && this.item.path()===path) {
                    this.is_loaded = true;
                    this.onReady.fire();
                }
                trigger_callbacks(true);
            };
            var img: JQuery = Exposition.loadImage(url, on_success, on_fail, path);
            this.setImage(this.images_loading, path, size, img);
            //img.hide();
            this.cache_div.append(img);
        };

        //
        // Public API
        //

        /**
         * Display photo into view. If the photo is already loaded then this method
         * achieves a fadeIn/fadeOut effect. Otherwise it only does a fadeOut for the
         * current image and behaves mostly like display().
         * 
         */
        public fadeTo(item: Item, duration: number) {
            // Preconditions
            assert(item && item.isPhoto());
            assert(duration>0);

            // If no current image, no effect
            if (!this.item) {
                this.display(item);
                return;
            }

            // If image is not loaded, do a normal load
            // ### FIXME. Missing fadeOut.
            var path = this.item.path();
            var size = this.chooseSize(this.IMAGE_SIZES);            
            if (!(size.toString() in this.getImages(this.images_ready, path))) {
                this.display(item);
                return;
            }

            // Fade effect
            this.fade_duration = duration;
            this.item = item;
            this.updateLayout(true);
        }

        /**
         * Display photo into view. The photo is loaded if necessary.
         *
         * Throws on error. However the internal image loading errors are handled
         * internally as non critical errors, and displayed to the end-user.
         *
         */
        public display(item: Item) {

            // Preconditions
            assert(item && item.isPhoto());

            // Set status
            this.is_loaded = false;
            this.item = item;
            if (this.current_img)
                this.current_img.appendTo(this.cache_div);
            this.current_img = null;

            // Load best size
            var path = this.item.path();
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

        };

        /**
         * Load into view, but does not immediately show it.
         * 
         * This method fetches the photo associated to the item at the most suitable resolution.
         * It is used to prefetch images and avoid loading delays that happen on slow networks
         * when using display() directly.
         *
         * May throw on error
         */
        public load(item: Item, callback?: PhotoLoadCallback) {

            // Preconditions
            assert(item && item.isPhoto());

            // Get best size
            var path = item.path();
            var size = this.chooseSize(this.IMAGE_SIZES);

            // Check if image is already loading or loaded
            if (this.hasImage(this.images_ready, path, size)) {
                if (callback)
                    callback(true);
                return;
            }
            if (callback)
                this.addLoadingCallback(path, callback);
            if (this.hasImage(this.images_loading, path, size))
                return;

            // Load image
            this.loadImage(path, size);
        }

        /**
         * Update layout of photo in the view
         *
         * This methods should be called whenever the view size changes. It should be called
         * only after the view was loaded with load(). This methods recenter the photo and
         * optionally triggers the download of a larger size photo.
         *
         */
        public updateLayout(fade?: bool) {

            // Preconditions
            assert(fade !== true || this.fade_duration>0);

            // Check if view has a current item
            if (!this.item)
                return;

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
            if (this.current_img) {
                if (fade === true) {
                    var current_img = this.current_img;
                    this.current_img.fadeOut(this.fade_duration, () => {
                        current_img.appendTo(this.cache_div);    
                    });
                } else {
                    this.current_img.appendTo(this.cache_div);
                }
            }                
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
            if (fade) {
                img.hide();
                img.prependTo(this.main_div);
                img.fadeIn(this.fade_duration);
            } else {
                img.appendTo(this.main_div);
            }
        };


        /** onReady()            -> View is ready to show. */
        public onReady: Signal;
    };


} // module Exposition