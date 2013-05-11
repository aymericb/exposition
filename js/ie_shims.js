//
// Internet Explorer compatibility 
//

/*jshint eqeqeq:true, browser:true, jquery:true*/
/*global console:true, history:true*/

(function() {
"use strict";

    if (! ('console' in window))
        console = window.console || {
            log: function() {},
            error: function() {},
            warn: function() {},
            info: function() {}
        };
    if (! ('history' in window))
        history = window.history || { };
    if (! ('replaceState' in history))
        history.replaceState = function() {};
    if (! ('pushState' in history))
        history.pushState = function() {};
        
})();