# Exposition Change History

## 0.2 (2013-03-30)

* First public release.
* Visible end user changes:
  * Added loading feedback with [spin.js](http://fgnass.github.com/spin.js/).
  * Added individual URLs for photo and album items using HTML5 History API.
  * Stopped using webkit brightness filter for thumnail hover state.
  * Made sure only the thumnail image is clickable in album view.
  * Added prefetching of next/previous photo in photo view.
* Internal robustness changes:
  * RESTFul API with HTTP Image Caching support. This requires Apache mod_rewrite.
  * Prevented scaling up of small images in photo view.
  * Added error handling support (fatal errors, album thumnails, photos, noscript).

## 0.1 (2013-02-16)

* Never released publically.