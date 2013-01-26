/*jshint eqeqeq:true, browser:true, jquery:true*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Use strict header
(function() {
"use strict";

// Debugging
ph.barthe.debug = true;
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

// Use strict footer
})();
