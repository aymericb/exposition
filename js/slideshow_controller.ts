//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="common.ts" />
/// <reference path="controller.ts" />
/// <reference path="config.ts" />
/// <reference path="photo_view.ts" />

module Exposition {

    export class SlideshowController implements Controller {

        //
        // Private members
        //

        // Config
        private config: Config;
        private SLIDE_TIMEOUT: number = 2000;   // 2 seconds ### TODO: Add to config object
        private MAX_PREFETCH_COUNT = 2;         // Max number of photos to load in advance

        // Model
        private album_paths_to_load: string[];  // Queue of album items to load (init)
        private item: Item;                     // Root item
        private photos: Item[];                 // Array of photos in display order

        // Controller state
        private current_index: number;          // Index of currently displayed photo or -1
        private next_index: number;             // Index of currently displayed photo
        private is_running: bool;               // True if the slideshow is active
        private has_tick_elapsed: bool;         // True if SLIDE_TIMEOUT has expired since last photo was shown
        private is_ready: bool;                 // True if this.onReady has fired
        private loading_status: bool[];         // Photo Index -> { true=loaded, false=failed, null=not-loaded}
        private timer: number;

        // View
        private main_div: JQuery;
        private view: PhotoView;

        //
        // Public API
        //
        
        constructor(config: Config, main_div: JQuery, item: Item) {
            // Store parameters
            this.config = config;
            this.main_div = main_div;
            this.item = item;

            // Init state
            this.album_paths_to_load = [];
            this.photos = [];
            this.view = new PhotoView(config, main_div);            
            this.is_running = false;
            this.is_ready = false;
            this.loading_status = [];
            this.current_index = -1;
            this.next_index = 0;

            // Create signals
            this.onLoadPath = new Signal();
            this.onPageUpdate = new Signal();
            this.onReady = new Signal();
            this.onFinished = new Signal();
        }

        public load() {

            // Fullscreen support
            // This need to be done within the event handler, because of security concerns 
            // We cannot wait for the image to be ready            
            if ($(document).fullScreen() != null) {
                $(document).fullScreen(true);
                $(document).on("fullscreenchange", () => {
                    if ($(document).fullScreen() === false)
                        this.stopSlideshow();
                });
            } else {
                // ### TODO: Show message in view about ESC can be used to exit slideshow
                // ### TODO: Implement tap/click to iPad
            }

            // Load resources
            this.is_running = true;
            if (this.item.isPhoto()) {
                this.album_paths_to_load.push(this.item.parentPath());
                this.loadNextAlbum();
                // ### TODO. Mark starting point for the slideshow?
            } else {
                this.onAlbumLoaded(this.item);
            }
        }

        public updateLayout() {
            this.view.updateLayout();
        }

        public goToNext() {
            // ### TODO Not implemented
        }

        public goToPrev() {
            // ### TODO Not implemented
        }

        public onKeydown(ev): bool {
            var KEYCODE_ESCAPE = 27;
            if (ev.which === KEYCODE_ESCAPE) {
                this.stopSlideshow();
                return false;
            }
            return true;
        }

        public onLoadPath: Signal;
        public onPageUpdate: Signal;
        public onReady: Signal;

        // Only for slideshow
        public onFinished: Signal;

        //
        // Failure
        //

        private onFail(err) {            
            console.error(err);
            // ### TODO: Show error in view. Check is_running
        }

        //
        // Init
        //

        private loadNextAlbum() {
            // Precondition
            assert(this.album_paths_to_load && this.album_paths_to_load.length>0);

            // Check if slideshow is running
            if (!this.is_running)
                return;

            // Load next album
            var path = this.album_paths_to_load.pop();
            var on_fail = () => {
                this.onFail( new Error("Failed to load album "+path));
            }
            Item.Load(this.config, path, (item)=>this.onAlbumLoaded(item), ()=>on_fail); 
        }

        private onAlbumLoaded(item: Item) {
            // Precondition
            assert(item.isAlbum());

            try {
                // Push sub albums to load
                var children = item.children();
                for (var i=0; i<children.length; ++i) {
                    var subitem = children[i];
                    if (subitem.isAlbum()) {
                        this.album_paths_to_load.push(subitem.path());
                    } else {
                        this.photos.push(subitem);
                    }
                }

                // Check if all items are loaded
                if (this.album_paths_to_load.length === 0) {
                    this.photos = this.photos.reverse();
                    //this.showNextPhoto(0);
                    this.loadNextPhoto()
                    this.setNextTimer();
                    return;
                }

                // Load other sub_items
                this.loadNextAlbum();                
            } catch (err) {
                this.onFail(err);
            }

        }

        //
        // Slideshow
        //

        private stopSlideshow() {
            clearTimeout(this.timer);
            this.is_running = false;
            this.onFinished.fire();
        }

        private loadNextPhoto() {

            // Check if slideshow is running
            if (!this.is_running)
                return;

            // Load next photo
            var index = this.next_index;
            this.next_index  = (this.next_index+1)%this.photos.length;
            var callback = (success: bool) => {
                if (!success)
                    console.error('Failed to load '+this.photos[index].path());
                this.loading_status[index] = success;
                this.showNextPhoto();
            }
            if (this.loading_status[index] !== true)
                this.view.load(this.photos[index], callback);
        }

        private setNextTimer() {
            this.has_tick_elapsed = false;
            this.timer = setTimeout( () => {
                this.has_tick_elapsed = true;
                this.showNextPhoto();
            }, this.SLIDE_TIMEOUT );
        }

        private showNextPhoto() {

            // Check if slideshow is running
            if (!this.is_running)
                return;

            // Compute index of next item to display, load more items
            var next_index: number = -1;
            var success_count: number = 0;
            for (var i=(this.current_index+1)%this.photos.length; i<this.loading_status.length; ++i) {
                if (this.loading_status[i] === true) {
                    success_count += 1;
                    if (next_index<0)                    
                        next_index = i;
                }

            }
            if (next_index < 0)
                return;
            if (success_count < this.MAX_PREFETCH_COUNT)
                this.loadNextPhoto();

            // Check if timer has elapsed
            if (!this.has_tick_elapsed)
                return;
            this.setNextTimer();

            // Change photo
            this.current_index = next_index;
            if (!this.is_ready) {
                this.is_ready = true;
                this.onReady.fire();
            }
            this.view.display(this.photos[this.current_index]);
        }

    }

}