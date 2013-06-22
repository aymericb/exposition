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

        // Model
        private album_paths_to_load: string[];  // Queue of album items to load (init)
        private item: Item;                     // Root item
        private photos: Item[];                 // Array of photos in display order
        //private current_photo: number;          // Current photo shown

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
            //this.current_photo = 0;
            this.view = new PhotoView(config, main_div);            

            // Create signals
            this.onLoadPath = new Signal();
            this.onPageUpdate = new Signal();
            this.onReady = new Signal();
        }

        public load() {
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
            // ### TODO
        }

        public goToPrev() {
            // ### TODO
        }

        public onKeydown(ev): bool {
            // ### TODO
            return true;
        }

        public onLoadPath: Signal;
        public onPageUpdate: Signal;
        public onReady: Signal;

        //
        // Init
        //

        private loadNextAlbum() {
            // Precondition
            assert(this.album_paths_to_load && this.album_paths_to_load.length>0);

            // Load next album
            var path = this.album_paths_to_load.pop();
            var on_fail = () => {
                console.error("Failed to load album "+path);
                // ### TODO show error in view              
            }
            Item.Load(this.config, path, (item)=>this.onAlbumLoaded(item), on_fail); 
        }

        private onAlbumLoaded(item: Item) {
            // Precondition
            assert(item.isAlbum());

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
                // ### FIXME. Empty albums are not supported.
                this.showPhoto(0);
                this.onReady.fire();
                return;
            }

            // Load other sub_items
            this.loadNextAlbum();
        }

        //
        // Slideshow
        //

        // ### FIXME Wait until the photo is fetched
        private showPhoto(photo_index: number) {
            // Precondition
            assert(photo_index>=0 && photo_index<this.photos.length);

            // Show the photo
            this.view.load(this.photos[photo_index])

            // Show next photo
            setTimeout( () => { 
                this.showPhoto( (photo_index+1)%this.photos.length ); 
            }, this.SLIDE_TIMEOUT);

        }

    }

}