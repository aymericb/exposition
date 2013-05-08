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
/// <reference path="item.ts" />
/// <reference path="config.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

module Exposition {

    export class UpdateCache {

        // Private Members
        private config: Config;
        private item: Item;
        private sizes: number[];
        private count: number = 0;
        private total: number = 0;
        private download_queue = [];
        private PARALLEL_DOWNLOAD = 6;

        // Private Methods
        private onConfigSuccess() {
            $.ajax(this.config.makeItemUrl('/'))
                .fail( () => {
                    this.onFailed(new Error('Failed to load root album'));
                })
                .done( (data) => {
                    try {
                        // Store sizes
                        this.sizes = this.config.allImageSizes();
                        this.sizes = this.sizes.sort((a,b) => {return a-b;});
                        if (this.sizes[0] === 0)
                            this.sizes = this.sizes.splice(1, this.sizes.length-1);

                        console.log('Sizes: '+this.sizes);

                        // Count photos
                        this.item = new Item(data);
                        var countPhotos = (item) => {
                            if (item.isAlbum()) {
                                var children = item.children();
                                var count = 0;
                                for (var i=0; i<children.length; ++i) {
                                    if (children[i])
                                        count += countPhotos(children[i]);
                                }
                                return count;
                            } else {
                                return 1;
                            }
                        };
                        var photo_count = countPhotos(this.item);
                        this.total = photo_count*this.sizes.length;
                        console.log('Total: '+photo_count+' photos, '+this.total+' images.');

                        // Update progress bar
                        this.el_progress.progressbar( "option", {
                            value: 0,
                            max: this.total
                        });

                        // Start caching
                        this.cacheItem(this.item);
                        for (var k=0; k<this.PARALLEL_DOWNLOAD; ++k) {
                            this.popDownload();
                        }

                    } catch(e) {
                        this.onFailed(e);
                    }
                });
        };

        private onFailed(err: Error) {
            debugger;
            this.el_progress.progressbar( "option", {
                value: 0,
                max: 100
            });
            this.el_progress_label.text('Failed');
            if (err && err.message) {
                console.error("Error: "+err.message);
            }
        };

        private updateDownloadProgress(download) {
            this.count += 1;
            this.el_progress.progressbar("option", "value", this.count);
            if ( this.count === this.total ) {
                this.el_progress_label.text("Done");
            } else {
                this.el_progress_label.text(download.title + '@' + download.size + 'px');
            }
        };

        private popDownload() {
            if (this.download_queue.length === 0)
                return;
            var download = this.download_queue.pop();
            $.ajax(download.url)
                .fail( (jqXHR, textStatus, errorThrown) => {
                    this.onDownloadFailed(errorThrown?('HTTP '+jqXHR.status+' '+errorThrown):textStatus, download);
                })
                .done( () => {
                    this.onDownloadSuccess(download);
                });
        };

        private onDownloadSuccess(download) {
            this.updateDownloadProgress(download);
            this.popDownload();
        };

        private onDownloadFailed(msg, download) {
            this.updateDownloadProgress(download);
            var html = this.el_errors.html();
            html += '<p>' + 'Failed ' + download.url + ' ' + msg + '</p>';
            this.el_errors.html(html);
            this.popDownload();
        };

        private cacheItem(item) {
            // Precondition
            assert(item);
            assert(this.el_progress);

            // Cache album
            //console.log("Item: "+item.title());
            if (item.isAlbum()) {
                var children = item.children();
                for (var i=0; i<children.length; ++i) {
                    if (children[i])
                        this.cacheItem(children[i]);
                }
                return;
            }

            // Cache photo
            assert(item.isPhoto());
            for (var j=0; j<this.sizes.length; ++j) {
                var url = this.config.makeCacheUrl(this.sizes[j], item.path());
                this.download_queue.push(Object.freeze({
                    url: url,
                    size: this.sizes[j],
                    title: item.title()
                }));
            }

        };

        //
        // Constructor
        //
        constructor(private el_progress, private el_progress_label: JQuery, private el_errors: JQuery) {
            // Init progress bar
            this.el_progress.progressbar({value: false});

            // Load config
            this.config = new Config( () => { this.onConfigSuccess(); }, 
                                      (e) => { this.onFailed(e)} );
        }


    };

} // module Exposition

// JavaScript compatibility
ph.barthe.UpdateCache = Exposition.UpdateCache;