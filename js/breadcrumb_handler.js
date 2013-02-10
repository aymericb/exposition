//
// Exposition. © 2013 Aymeric Barthe
//

/*jshint eqeqeq:true, browser:true, jquery:true*/

// Namespace declarations
var ph = ph || {};
ph.barthe = ph.barthe || {};

// Use strict header
(function() {
"use strict";

/**
 * BreadcrumbHandler class
 *
 * The BreadcrumbHandler class handles the display and event handling for the
 * navigation breadcrumb.
 *
 * Constructor
 * @param div    {jQuery}            Breadcrumb div
 * @param config {ph.barthe.Config}  Config object used to read the gallery name
 */
ph.barthe.BreadcrumbHandler = function(div, config) {

    // Redefinitions
    var self = this;
    var assert = ph.barthe.assert;

    // Private members
    var TITLE = "Salingkit Gallery";    // ### FIXME. Use config
    var m_div = div;
    var m_on_load_path = {};

    // Constructor
    (function() {

		// Preconditions
        assert(m_div && m_div.length>0);

    })();

    //
    // Public methods
    //

    /** Update the breadcrumb with current path */
    self.setPath = function(path) {
        
        // Preconditions
        assert(path);
        assert(path.charAt(0) === '/');

        // Create root element
        m_div.empty();
        var root_el = $('<div>').addClass('title').addClass('subpath').text(TITLE);
        root_el.click(function() { m_on_load_path.fire(['/']); });
        m_div.append(root_el);

        // Helper (do not create functions in loop)
        var click_handler = function(clicked_path) {
            return function() {
                m_on_load_path.fire([clicked_path]);
            };
        };

        // Iterate on subpaths
        // ### FIXME: Use titles instead of path components for display
        if (path === '/')
            return;
        var components = path.substr(1).split('/');
        var current_path = '';
        for (var i=0; i<components.length; ++i) {
            var el_separator = $('<div>').addClass('separator');
            current_path += '/' + components[i];
            var el_component = $('<div>').addClass('subpath').text(/* FIXME */components[i]);
            el_component.click(click_handler(current_path));
            m_div.append(el_separator);
            m_div.append(el_component);
        }

    };

    //
    // Public signals
    //

    /** onLoadPath(path)    -> path {string} the path to load. */
    self.onLoadPath = new ph.barthe.Signal(m_on_load_path);

};


// Use strict footer
})();