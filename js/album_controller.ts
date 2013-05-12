//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="common.ts" />
/// <reference path="item.ts" />
/// <reference path="config.ts" />
/// <reference path="controller.ts" />
/// <reference path="album_view.ts" />
/// <reference path="../lib/spin.d.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {

    /**
     * Shared photo cache between all AlbumView instances. 
     * This is used so that an album using a photo from a sub album, and the sub album itself,
     * have the same thumbnail in the AlbumView.
     */
    class PhotoCache {
        // Private members
        private photo_cache: {[path: string]: Item;} = {};               // Map. Item -> {str} path

        // Public API 
        public getPhotoPath(item) {
            // Precondition
            assert(item.isAlbum());

            // Handle empty album case
            var children = item.children();
            if (children.length === 0)
                return '';

            // Handle cached photos
            var item_key = item.path();
            if (item_key in this.photo_cache)
                return this.photo_cache[item_key];

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
                    var recursive_photo_path = this.getPhotoPath(children[r1]);
                    if (recursive_photo_path) {
                        this.photo_cache[item_key] = recursive_photo_path;
                        return recursive_photo_path;
                    }
                    albums.splice(r1, 1);
                }
                return '';
            } else {
                var r2 = Math.floor(Math.random() * photos.length);
                var photo_path = photos[r2].path();
                this.photo_cache[item_key] = photo_path;
                return photo_path;
            }
        };
    };

    // Global instance
    var g_photo_cache = new PhotoCache();


    /**
     * AlbumController class
     *
     * The AlbumController creates the AlbumView and loads into the DOM with the 
     * appropriate data. The controller is in charge of the photo cache so that albums have 
     * a consistent thumbnail. It also interacts with the application controller with
     * via unified Controller interface.
     *
     * Any methods (including constructor) may throw in case of error, unless otherwise
     * specified.
     *
     */
    export class AlbumController implements Controller {


        //
        // Private members
        //

        // View
        private view: AlbumView;


        /**
         * Constructor 
         * No side effect on Main View. Use load()
         */
        constructor(config: Config, main_div: JQuery, item: Item) {

            // Preconditions
            assert(item.isAlbum());

            // Fill children elements with the following properties
            // - photo-path: path to a random sub-photo in the album (or sub album)
            // - div:        HTML div of class 'thumbnail'
            // - item:       underlying Item object from this.item.children()
            var children = item.children();
            var items: AlbumViewData[] = [];
            for (var i=0; i<children.length; ++i) {

                // Get path to photo element
                var path = children[i].path();
                if (children[i].isAlbum())
                    path = g_photo_cache.getPhotoPath(children[i]);

                // It is possible to get an empty album. Skip it.
                if (!path)
                    continue;

                // Store information
                items.push({
                    photo_path: path,
                    item: children[i]
                });
            }

            // Initialize view
            this.view = new AlbumView(config, main_div, item, items);

            // Initialize signals
            this.onLoadPath = this.view.onLoadPath;
            this.onReady = this.view.onReady;
            this.onPageUpdate = this.view.onPageUpdate;
        }

  
        //
        // Public API
        //

        /** Load item */
        public load(): void {
            this.view.load();
        };

        public updateLayout(): void {
            this.view.updateLayout();
        };

        /** Go to next page */
        public goToNext(): void {
            this.view.goToNext();
        };

        /** Go to previous page */
        public goToPrev(): void {
            this.view.goToPrev();
        };

        /** Keyboard handler */
        public onKeydown(ev): bool {
            return this.view.onKeydown(ev);
        };

        /** onLoadPath(path)    -> path {string} the path to load. */
        public onLoadPath: Signal;

        /**
         * onPageUpdate(show, current_page, total_page)
         * show {bool}          -> if false, hide ignore other parameters
         * current_page {int}   -> current page, index 0
         * total_page {int}     -> number of pages in total >= 1
         */
        public onPageUpdate: Signal;

        /** onReady()            -> View is ready to show. */
        public onReady: Signal;
    };
}
