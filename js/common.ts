//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

/// <reference path="../lib/jquery.d.ts" />

/*jshint eqeqeq:true, browser:true, jquery:true, debug:true*/
/*global console:true, history:true*/

// Namespace declarations

module Exposition {

    // Debugging
    var debug = false;

    /**
     * Assert that throws.
     *
     * @param cond boolean expression. Throws if false. Trigger debugger if ph.barthe.debug is true,
     * @message optional. A string, or exception object. Used for logging. Otherwise 'assertion failed'.
     *
     * Remark. There is a console.assert() but it does not throw, it just log errors.
     */
    export var assert = function(cond, message?: any) {
        if (! cond) {
            // Log error
            var str_msg = '';
            if (typeof message === 'string')
                str_msg = message;
            else if (message === undefined || typeof message !== 'object')
                str_msg = 'Assertion Failed';
            else /*typeof message === 'object' */
                str_msg = message.error || message; // default to toString()
            console.error(str_msg);

            // Trigger debugger
            if (debug)
                debugger;

            // Throw Error
            if (typeof message === 'object')
                throw message;
            else
                throw new Error(str_msg);
        }
    };

    /** Check if object is an array */
    // ### FIXME: Use Array.isArray() instead!
    export var isArray = function(object) {
        return Object.prototype.toString.call(object) === '[object Array]' ;
    };

    // ### TODO: Define HTML5 History API for backward compatibility?

    /**
     * Helps implementing the design pattern Observer.
     *
     * Usage.
     *
     * The class that emits the signal creates the Signal object passing the emitter object
     * to the constructor. A fire function is added to the emitter object, that can be
     * used to send the signal optionally with parameters. TThe Signal object should be
     * left accessible as a public property. Listeners can be added or removed with the
     * public 'on' and 'off' methods.
     *
     */
    export var Signal = function(emitter) {
        // Private
        var self = this;
        var m_list = [];

        /** Add listener */
        self.on = function(listener) {
            assert(m_list.indexOf(listener) === -1);
            assert(typeof listener === 'function');
            m_list.push(listener);
        };

        /** Remove listener */
        self.off = function(listener) {
            assert(typeof listener === 'function');
            var index = m_list.indexOf(listener);
            assert(index !== -1);
            m_list.splice(index, 1);
        };

        /**
         * Fire the signal. It is possible to provide optional arguments to pass to the
         * listener functions, using the regular function syntax.
         */
        emitter.fire = function() {
            for (var i=0; i<m_list.length; ++i) {
                assert(arguments.length<=m_list[i].length);
                m_list[i].apply(/*this object*/null , arguments);
            }
        };
    };

    /**
     * Load image asynchronously
     *
     * Creates an IMG element for the givern URL and returns it (as a JQuery element).
     *
     * Error handling. The function may throw or return an empty jQuery object. However the
     * image loading callback does not throw, and call the on_fail handler instead. On success
     * the on_success handler is called. The jQuery element is also passed to both handlers.
     *
     * Design loosely inspired by (CSS backgrond not working for dynamic PHP pages)
     * - http://stackoverflow.com/questions/4285042/can-jquery-ajax-load-image
     * - http://stackoverflow.com/questions/5057990/how-can-i-check-if-a-background-image-is-loaded
     */
    export var loadImage = function(url, on_success, on_fail, alt_text, user_data) {
        // Precondition
        assert(url);
        assert(on_success);

        // Create img element
        var img = $('<img>');
        if (alt_text)
            img.attr('alt', alt_text);

        // Async load
        img.on('load', function() {
            var msg;
            if (!this.complete || !this.naturalWidth) {
                msg = 'Downloaded image is not valid: '+url;
                console.error(msg);
                if (on_fail)
                    on_fail(img, msg, user_data);
            } else {
                on_success(img, user_data);
            }
        });
        img.on('error', function(error) {
            // Apparently no way to get HTTP errors from IMG elements
            // http://stackoverflow.com/questions/8108636/how-to-get-http-status-code-of-img-tags
            // ### FIXME: As a workaround we could make an AJAX request on the URL and see what happens
            if (on_fail)
                on_fail(img, error.message, user_data);
        });
        img.attr('src', url);

        // Return jQuery IMG element
        return img;
    };

}

// Javascript compatibility
var ph = ph || {};
ph.barthe = ph.barthe || {};
ph.barthe.assert = Exposition.assert;
ph.barthe.Signal = Exposition.Signal;
ph.barthe.loadImage = Exposition.loadImage;
ph.barthe.isArray = Exposition.isArray;



