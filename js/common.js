//
// Exposition. © 2013 Aymeric Barthe
//

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:false*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Use strict header
(function() {
"use strict";

// Debugging
ph.barthe.debug = true;
// ### FIXME: Improve this (eval, stack etc...)
ph.barthe.assert = function(cond) {
    if (ph.barthe.debug) {
        if (! cond) {   // ### FIXME Need to find a better mechanism to stop executing functions/ code
            throw { message: 'Assertion failed: '+cond };
        }
    }
};

// Utilities
ph.barthe.generateId = function(path, prefix) {
    return prefix+path.replace(/\//g, '-').replace(/[^A-Za-z0-9\-\.]/g, '_');
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
ph.barthe.loadImage = function(url, on_success, on_fail, alt_text, user_data) {
    // Precondition
    ph.barthe.assert(url);
    ph.barthe.assert(on_success);

    // Create img element
    var img = $('<img>');
    if (alt_text)
        img.attr('alt', alt_text);

    // Async load
    img.load(function(response, status, xhr) {
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
    img.error(function(error) {
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

// Use strict footer
})();
