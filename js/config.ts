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

/*jshint eqeqeq:true, browser:true, jquery:true*/

module Exposition {

    /**
     * Config class
     *
     * This class provides access to the configuration constants. Some values
     * are retrieved dynamically using the server. 
     *
     */
    export class Config {

        //
        // Private members
        //
        private json;                             // Ajax values
        private thumnbail_title_height:number;    // Computed from CSS
        private base_url:string;                  // The base URL is rewritten with HTML history

        // REST API
        static private PAGE_CONFIG = 'api/config';
        static private PAGE_ITEM = 'api/item';
        static private PAGE_IMAGE = 'api/image';
        static private PAGE_CACHE = 'api/cache';
        static private PAGE_DOWNLOAD = 'api/download';

        //
        // Public members
        //

        // PHP Ajax Pages
        public makeItemUrl(path: string): string {
            assert(path.length>0 && path.substring(0, 1) === '/');
            return this.base_url+Config.PAGE_ITEM+path;
        };
        public makeImageUrl(size:number, path:string): string {
            assert(path.length>0 && path.substring(0, 1) === '/');
            assert(size>=0);
            return this.base_url+Config.PAGE_IMAGE+'/'+size+path;
        };
        public makeCacheUrl(size:number, path:string): string {
            assert(path.length>0 && path.substring(0, 1) === '/');
            assert(size>=0);
            return this.base_url+Config.PAGE_CACHE+'/'+size+path;
        };
        public makeDownloadUrl(path:string): string {
            assert(path.length>0 && path.substring(0, 1) === '/');
            return this.base_url+Config.PAGE_DOWNLOAD+path;
        };
        public getCautionImageUrl() {
            return this.base_url+'/css/caution.png';
        };

        // Server info
        public info() {
            return this.json.info;
        };
        public version() {
            return this.json.version;
        };
        public galleryName() {
            return this.json.gallery_name;
        };

        // Thumnails
        public thumbnailSize() {
            // ### TODO: Take Retina screens into account
            return this.json.thumnail_sizes[0];
        };
        public thumbnailMargin() {
            return 30;
        };
        public thumbnailVMargin() {
            return 40;
        };
        public thumbnailTitleMargin() {
            return 10;
        };
        public thumbnailTitleHeight() {
            return this.thumnbail_title_height;
        };
        public thumbnailHeight() {
            return this.thumbnailSize() + this.thumbnailTitleHeight();
        };
        public thumbnailWidth() {
            return this.thumbnailSize();
        };

        // Photo
        public photoSizes() {
            return this.json.photo_sizes;
        };

        // Raw size info
        public allImageSizes(): number[] {
            // http://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript
            var arrayUnique = (array) => {
                var a = array.concat();
                for(var i=0; i<a.length; ++i) {
                    for(var j=i+1; j<a.length; ++j) {
                        if(a[i] === a[j])
                            a.splice(j--, 1);
                    }
                }
                return a;
            };
            return arrayUnique(this.json.photo_sizes.concat(this.json.thumnail_sizes));
        };

        // Behaviors
        public isDownloadAllowed() {
            return this.json.is_download_allowed && ($.inArray(0, this.json.photo_sizes)>=0);
        };

        /**
         * Constructor
         *
         * You need to pass a 'ready' and 'error' callback to the constructor. You must
         * wait until 'ready' has been called, to use the instance. If you receive 'error' 
         * instead, you must abort. The 'error' function takes a single and optional 
         * argument, that is the exception object that caused the error.
         */
        constructor(ready_callback: ()=>void, error_callback: (e: Error)=>void) {

            // Compute base URL
            this.base_url = document.URL;
            var query_index = this.base_url.lastIndexOf('?');
            if (query_index>0)
                this.base_url = this.base_url.substr(0, query_index);
            this.base_url = this.base_url.substr(0, this.base_url.lastIndexOf('/')+1);

            // Compute this.thumnbail_title_height
            this.thumnbail_title_height = ( () => {
                // Compute dynamically by reading CSS property of div class '.item .title'
                var item = $('<div>').addClass('item').hide();
                var title = $('<div>').addClass('title');
                item.append(title);
                $(document.body).append(item);
                var height = title.outerHeight();
                item.remove();
                return height;
            })();

            // Load ajax configuration
            $.ajax(Config.PAGE_CONFIG)
                .fail( error_callback )
                .done( (json) => {
                    try {
                        // Check string parameters
                        var checkStringAttribute = (name) => {
                            if (! json[name]) {
                                throw new Error('Missing '+name+' attribute in JSON.');
                            }
                            if (typeof json[name] !== 'string') {
                                 throw new Error('Attribute '+name+' should be a String in JSON.');
                            }
                        };
                        checkStringAttribute('version');
                        checkStringAttribute('info');
                        checkStringAttribute('gallery_name');

                        // Check array of sizes
                        var checkSizeArray = (name) => {
                            var array = json[name];
                            if (! array) {
                                throw new Error('Missing '+name+' attribute in JSON.');
                            }
                            if( Object.prototype.toString.call( array ) !== '[object Array]' ) {
                                throw new Error('Attribute '+name+' should be an Array in JSON.');
                            }
                            if ( array.length === 0) {
                                throw new Error('Attribute '+name+' should be not be an empty Array.');
                            }
                            for (var i=0; i<array.length; ++i) {
                                if (typeof array[i] !== 'number' || array[i] % 1 !== 0) {
                                    throw new Error('Attribute '+name+' should be integers.');
                                }
                            }
                        };
                        checkSizeArray('photo_sizes');
                        checkSizeArray('thumnail_sizes');

                        // Check allow_download
                        if (! ('is_download_allowed' in json))
                            throw new Error('Missing is_download_allowed attribute in JSON');
                        if (typeof json.is_download_allowed !== 'boolean')
                            throw new Error('Attribute is_download_allowed should be a boolean');

                        // Finish constructor
                        this.json = json;
                        ready_callback();

                    } catch(e) {
                        error_callback(e);
                    }
                });

        }
    }
}
