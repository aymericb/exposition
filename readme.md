# Exposition

Exposition is a modern HTML 5 photo gallery software for the Web. 

* **Maximize the use of the window** by dynamically adjusting the number of thumbnails and the size of pictures.
* **Easy deployment**. Rely on common web technologies. Apache with PHP and GD.
* **No Database**. No SQL. The filesystem is your database. An album is a directory. A photo an an image within.
* **No complex administration console** to upload and manage photos. Just upload files to the right place to add new photos.
* **Designed with modern browser in mind**. The absence of compatibility with IE 6 is a feature, not a bug.

## License

Exposition. Copyright (c) 2013 Aymeric Barthe.

The software is covered by the **GNU Affero General Public License version 3**, with an additional restriction that forces a small copyright notice to be preserved in minified javascript code. You are free to distribute and use this software freely, but if modify it, you need to make your changes available with the same license. Check [the license](doc/license.txt) for more details.

## Download and Installation

* Get an Apache web server supporting PHP 5.3 with [GD](http://php.net/manual/en/book.image.php).
* Download [the latest release](https://github.com/aymericb/exposition/archive/master.zip) of Exposition or clone the **master** branch. 
* Upload the Exposition files to your web server.
* Edit the **php/core/config.php** file, in particular 
  * **PHOTO\_DIR** must point to the directory containing album and photos
  * **CACHE\_DIR** must point to a writable, cache directory, which will contain the thumbnails and photos generated at smaller sizes
* Upload albums and photos to **PHOTO\_DIR**
  * Each directory represents an album and each image file represents a photo. 
  * Albums can have sub-albums and/or photos.
  * By default file names are used as titles, and items are sorted by alphabetical order.
  * It is possible to modify the default behavior on for each album, by adding an **album.json** file, with the following syntax:

  ```javascript
{
  "version": 1,		/* Mandatory. Integer. Must be 1 */
	"children": 		/* Mandatory. Children of the album will be shown
		in the same order as appear in this array. Files which are not listed
		will not be displayed, but could still be accessed with a direct
		link (hidden album) */
	  [	
		{				/* Item config */
			"filename": "filename",		/* Mandatory. File or directory name within the album */
			"title": "custom_title"		/* Optional. Use this title instead of basename */
		}
	  ]
}
```
* Navigate to the **index.html** page. Exposition should now be working and displaying your photos and albums.
* Optionally,  you can navigate to **update.html** to force your web server to cache your photos at all configured sizes.

## Futher Information 
* [License](doc/license.txt)
* Live Demo. **TODO**
* [Changelog](doc/changelog.md)
* [Build from Source](doc/build.md)

