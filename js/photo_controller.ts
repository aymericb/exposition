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
/// <reference path="photo_view.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {


    export class PhotoController implements Controller {

        private view;

        constructor(config: Config, main_div: JQuery, item: Item) {
            this.view = new PhotoView(config, main_div, item);

            this.onLoadPath = this.view.onLoadPath;
            this.onPageUpdate = this.view.onPageUpdate;
            this.onReady = this.view.onReady;
            this.onPathChanged = this.view.onPathChanged;
        }

        public load(): void {
            this.view.load();
        }

        public updateLayout(): void {
            this.view.updateLayout();
        }

        public goToNext(): void {
            this.view.goToNext();
        }

        public goToPrev(): void {
            this.view.goToPrev();
        }

        public onKeydown(ev): bool {
            return this.view.onKeydown(ev);
        }




        /** onLoadPath(path)    -> path {string} the path to load. */
        onLoadPath: Signal;

        /**
         * onPageUpdate(show, current_page, total_page)
         * show {bool}          -> if false, hide ignore other parameters
         * current_page {int}   -> current page, index 0
         * total_page {int}     -> number of pages in total >= 1
         */
        onPageUpdate: Signal;

        /** onReady()            -> View is ready to show. */
        onReady: Signal;

        /** onPathChanged(path) -> path changed within the view. */
        public onPathChanged: Signal;
    }
 
}

