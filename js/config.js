//
// Exposition. © 2013 Aymeric Barthe
//

/*jshint eqeqeq:true, browser:true, jquery:true*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

/**
 * Config class
 *
 * This class provides access to the configuration constants. Some values
 * are retrieved dynamically using the server. You need to pass a
 * 'ready' and 'error' callback to the constructor. You must wait until
 * 'ready' has been called. If you receive 'error' instead, you must abort.
 * The 'error' function takes a single and optional argument, that is
 * the exception object that caused the error.
 *
 */
ph.barthe.Config = function(ready_callback, error_callback) {
    // Redefinitions
    "use strict";
    var self = this;
    var assert = ph.barthe.assert;

    //
    // Private members
    //
    var m_json;                             // Ajax values
    var m_thumnbail_title_height;           // Computed from CSS
    var m_base_url;                         // The base URL is rewritten with HTML history

    // REST API
    var PAGE_CONFIG = 'api/config';
    var PAGE_ITEM = 'api/item';
    var PAGE_IMAGE = 'api/image';
    var PAGE_CACHE = 'api/cache';

    //
    // Public members
    //

    // PHP Ajax Pages
    self.makeItemUrl = function(path) {
        assert(path && typeof path === 'string' && path.length>0 && path.substring(0, 1) === '/');
        return m_base_url+PAGE_ITEM+path;
    };
    self.makeImageUrl = function(size, path) {
        assert(path && typeof path === 'string' && path.length>0 && path.substring(0, 1) === '/');
        assert(typeof size === 'number' && size>=0);
        return m_base_url+PAGE_IMAGE+'/'+size+path;
    };
    self.makeCacheUrl = function(size, path) {
        assert(path && typeof path === 'string' && path.length>0 && path.substring(0, 1) === '/');
        assert(typeof size === 'number' && size>=0);
        return m_base_url+PAGE_CACHE+'/'+size+path;
    };
    self.getCautionImageUrl = function() {
        return m_base_url+'/css/caution.png';
    };

    // Server info
    self.info = function() {
        return m_json.info;
    };
    self.version = function() {
        return m_json.version;
    };
    self.galleryName = function() {
        return m_json.gallery_name;
    };

    // Thumnails
    self.thumbnailSize = function() {
        // ### TODO: Take Retina screens into account
        return m_json.thumnail_sizes[0];
    };
    self.thumbnailMargin = function() {
        return 30;
    };
    self.thumbnailTitleMargin = function() {
        return 10;
    };
    self.thumbnailTitleHeight = function() {
        return m_thumnbail_title_height;
    };
    self.thumbnailHeight = function() {
        return self.thumbnailSize() + self.thumbnailTitleHeight();
    };
    self.thumbnailWidth = function () {
        return self.thumbnailSize();
    };

    // Photo
    self.photoSizes = function() {
        return m_json.photo_sizes;
    };

    // Raw size info
    self.allImageSizes = function() {
        // http://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript
        var arrayUnique = function(array) {
            var a = array.concat();
            for(var i=0; i<a.length; ++i) {
                for(var j=i+1; j<a.length; ++j) {
                    if(a[i] === a[j])
                        a.splice(j--, 1);
                }
            }
            return a;
        };
        return arrayUnique(m_json.photo_sizes.concat(m_json.thumnail_sizes));
    };

    //
    // Constructor
    //
    (function() {

        // Preconditions
        assert(ready_callback);
        assert(error_callback);

        // Compute base URL
        m_base_url = document.URL;
        var query_index = m_base_url.lastIndexOf('?');
        if (query_index>0)
            m_base_url = m_base_url.substr(0, query_index);
        m_base_url = m_base_url.substr(0, m_base_url.lastIndexOf('/')+1);

        // Compute m_thumnbail_title_height
        m_thumnbail_title_height = (function() {
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
        $.ajax(PAGE_CONFIG)
            .fail( error_callback )
            .done( function(json) {
                try {
                    // Check string parameters
                    var checkStringAttribute = function(name) {
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
                    var checkSizeArray = function(name) {
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

                    // Finish constructor
                    m_json = json;
                    ready_callback();

                } catch(e) {
                    error_callback(e);
                }
            });

    })();

};

