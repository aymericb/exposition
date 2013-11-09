//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

// Type definitions for jQuery Fullscreen Plugin version 1.1.4
// http://plugins.jquery.com/fullscreen/
// https://github.com/kayahr/jquery-fullscreen-plugin

/// <reference path="jquery.d.ts" />

interface JQuery {
	fullScreen(): bool;
	fullScreen(enable: bool): void;
}