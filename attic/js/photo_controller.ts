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
/// <reference path="signal.ts" />
/// <reference path="config.ts" />
/// <reference path="item.ts" />
/// <reference path="controller.ts" />
/// <reference path="photo_view.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {


    export class PhotoController implements Controller {

        // Model
        private album_item: Item;
        private item: Item;
        private item_index: number;     // Current index of this.item within this.album_item

        // View
        private view: PhotoView;

        //
        // Public API
        // 
        constructor(config: Config, main_div: JQuery, item: Item) {

            // Preconditions
            assert(item.isPhoto());

            // Initialize view
            this.view = new PhotoView(config, main_div);
            this.view.onReady.on( () => { this.on_ready(); } );
            this.item = item;

            // Initialize album item
            var album_path = item.parentPath();
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
                this.album_item = item;
                assert(this.album_item.isAlbum());
                assert(this.album_item.children().length > 0);

                // Determine index of this.item within album
                var children = this.album_item.children();
                for (var i=0; i<children.length; ++i) {
                    if (children[i].path() === this.item.path()) {
                        this.item_index = i;
                        break;
                    }
                }
                this.onPageUpdate.fire(true,this.item_index, children.length);

                // Prefetch prev/next images
                this.prefetch();

                // Postcondition
                assert(this.item_index !== undefined);
            };
            Exposition.Item.Load(config, album_path, on_album_success, on_album_error);            
        }

        public load(): void {
            this.view.display(this.item);
        }

        public updateLayout(): void {
            this.view.updateLayout();
        }

        public goToNext(): void {
            this.gotoPage(this.item_index+1);
        }

        public goToPrev(): void {
            this.gotoPage(this.item_index-1);
        }

        private gotoPage(page: number) {
            // Preconditions
            assert(this.album_item && this.album_item.isAlbum());
            assert(page>=0 && page<this.album_item.children().length);

            // Set status            
            this.item_index = page;
            this.item = this.album_item.children()[this.item_index];

            // Notify application
            var path = this.item.path();
            this.onPageUpdate.fire(true, this.item_index, this.album_item.children().length);
            this.onPathChanged.fire(path);

            // Load
            this.view.display(this.item);
        }

        public onKeydown(ev): boolean {
            // Check if event can be handled
            assert(ev.which);
            if (!this.album_item)
                return true;

            // Check for left right arrow
            var KEYCODE_LEFT = 37;
            var KEYCODE_RIGHT = 39;
            var KEYCODE_UP = 38;
            var KEYCODE_ESCAPE = 27;
            if (ev.which === KEYCODE_LEFT && this.item_index>0) {
                this.goToPrev();
                return false;
            } else if (ev.which === KEYCODE_RIGHT && this.item_index+1<this.album_item.children().length) {
                this.goToNext();
                return false;
            } else if ((ev.which === KEYCODE_UP || ev.which === KEYCODE_ESCAPE) && this.album_item) {
                this.onLoadPath.fire(this.album_item.path());
                return false;
            }
        }

        private prefetch() {
            if (!this.album_item)
                return;
            var children = this.album_item.children();
            if (this.item_index>0)
                this.view.load(children[this.item_index-1]);
            if (this.item_index+1<children.length)
                this.view.load(children[this.item_index+1]);
        }

        private on_ready() {
            this.onReady.fire();
            this.prefetch();
        }

        //
        // Signals
        //

        /** onLoadPath(path)    -> path {string} the path to load. */
        onLoadPath: Signal< (path: string) => void > = new Signal();

        /**
         * onPageUpdate(show, current_page, total_page)
         * show {bool}          -> if false, hide ignore other parameters
         * current_page {int}   -> current page, index 0
         * total_page {int}     -> number of pages in total >= 1
         */
        onPageUpdate: Signal< (show:boolean, current_page?: number, total_page?: number) => void > = new Signal();

        /** onReady()            -> View is ready to show. */
        onReady: Signal< ()=>void > = new Signal();

        /** onPathChanged(path) -> path changed within the view. */
        public onPathChanged: Signal< (path: string) => void > = new Signal();

        //
        // Album Management
        //
        
        private loadItem(item: Item) {
            // Precondition
            assert(item.isPhoto());
        }

    }
 
}

