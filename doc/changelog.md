# Exposition Change History

## 0.3 (2013-04-18)
* New Features
  * Added keyboard shortcuts in AlbumView and PhotoView (arrows, enter, esc)
  * Added different style for album thumnails. It is now possible to distinguish them from photos.
  * Added download button to download album and images.
  * Added build system using [grunt](http://gruntjs.com). You know get a downloadable package with minified javascript and css.
  * Added build system documentation.
* Minor Changes
  * Added tooltips on thumbnails.
  * Removed console debug messages.
  * Using [Less](http://lesscss.org) instead of CSS.
  * Enabled PNG images by default.
  * Added SVG icons for forward/backward arrow.
  * Performance improvement on server side. Replaced call to fileatime() by filemtime()
  * Improved error handling on server, making sure 'Content-Type' is not specified in case of errors.
  * Enabled GZIP compression of bundled JS and CSS file, with far future HTTP expire date.
* Bug Fixes
  * Fixed pre-fetching algorithm in PhotoView, which was working only half the time.
  * Fixed issue with the initial spinner, that could have been shown/hidden twice at startup.
  * Fixed issues with error place holder in PhotoView. It is now shown properly.
  * Fixed bug with symlink handling in image caching. The PHP code was failing to update symlinks when the original image was changed.
  * Fixed missing highlight for title element of a photo. It worked fine for albums only.
  * Added ellipsis when the title of a thumbnail is too long.
  * Fixed typos in documentation.

## 0.2 (2013-03-30)

* First public release.
* Visible end user changes:
  * Added loading feedback with [spin.js](http://fgnass.github.com/spin.js/).
  * Added individual URLs for photo and album items using HTML5 History API.
  * Stopped using webkit brightness filter for thumbnail hover state.
  * Made sure only the thumbnail image is clickable in album view.
  * Added prefetching of next/previous photo in photo view.
* Internal robustness changes:
  * RESTFul API with HTTP Image Caching support. This requires Apache mod_rewrite.
  * Prevented scaling up of small images in photo view.
  * Added error handling support (fatal errors, album thumbnails, photos, noscript).

## 0.1 (2013-02-16)

* Never released publically.