//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="config.ts" />
/// <reference path="common.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true*/


module Exposition {


    /**
     * Item class
     *
     * This is a frontend for the JSON Item format passed by the server. This class merely
     * provides validation of the JSON data, and read-only access. Each item can either be
     * an 'Album' with children (other Item objects) or a 'Photo'.
     *
     */

    export class Item {

        // Private members
        private m_children:Item[] = [];
        private json;
        static private cache = {};

        // Public methods
        parentPath() : string {
            var parent_path = this.path().substring(0, this.path().lastIndexOf('/'));
            if (parent_path === '')
                parent_path = '/';
            return parent_path;
        };
        isPhoto() : bool {
            return (this.json.type === 'photo');
        };
        isAlbum() : bool {
            return (this.json.type === 'album');
        };
        title() : string {
            return this.json.title;
        };
        path() : string {
            return this.json.path;
        };
        children() : Item[] {
            assert(this.isAlbum());
            return this.m_children;
        };

        // Constructor: validate data
        constructor(json) {
            this.json = json;
            var checkStringAttribute = function(name) {
                if (! json[name]) {
                    throw new Error('Missing '+name+' attribute in JSON.');
                }
                if (typeof json[name] !== 'string') {
                     throw new Error('Attribute '+name+' should be a String in JSON.');
                }
            };
            checkStringAttribute('type');
            if (!this.isAlbum() && !this.isPhoto()) {
                throw new Error('Invalid type attribute in JSON.');
            }
            checkStringAttribute('title');
            checkStringAttribute('path');
            if (this.isAlbum()) {
                if (! json.children) {
                    throw new Error('Missing children attribute in JSON.');
                }
                if( !Array.isArray(json.children) ) {
                    throw new Error('Attribute children should be an Array in JSON.');
                }
                for (var i=0; i<json.children.length; ++i) {
                    this.m_children.push(new Item(json.children[i]));
                }
            }
        }

        static Load(config:Config, path:string, on_success, on_fail) {

            // Precondition
            assert(path && typeof path === 'string' && path.length>0 && path.substring(0, 1) === '/');

            // Avoid making functions in loops
            var immediate_success = function(item) {
                setTimeout(function() { on_success(item); }, 0);
            };

            // Check cache for same item
            if (cache[path]) {
                immediate_success(cache[path]);
                return;
            }

            // Check cache for parent item.
            // If item is a photo in parent item, no need to contact the server.
            if (path.length>1) {
                var album_path  = path.substring(0, path.lastIndexOf('/'));
                var album_item = cache[album_path];
                if (album_item) {
                    var children = album_item.children();
                    for (var i=0; i<children.length; ++i) {
                        var child_item = children[i];
                        if (child_item.path() === path) {
                            if (child_item.isPhoto()) {
                                immediate_success(child_item);
                                return;
                            } else {
                                break;  // The found item is an Album, so we need to load it
                                        // from the server, to get its children
                            }
                        }
                    }
                }
            }

            // Download item
            $.ajax(config.makeItemUrl(path))
                .fail( on_fail )
                .done( function(data) {
                    try {
                        var item = new Item(data);
                        cache[path] = item;
                        on_success(item);
                    } catch(e) {
                        on_fail(undefined, undefined, e);
                    }
            });

        }
    };

}

// Javascript compatibility
ph.barthe.Item = Exposition.Item;
ph.barthe.Item.Load = Exposition.Item.Load;

