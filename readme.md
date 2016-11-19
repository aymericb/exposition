# Exposition

Exposition is a modern HTML 5 photo gallery software for the Web. 

* **Maximize the use of the window** by dynamically adjusting the number of thumbnails and the size of pictures.
* **Easy deployment**. Use Docker to abstract the complexities of deployment.
* **No Database**. No SQL. The filesystem is your database. An album is a directory. A photo is an image within.
* **No complex administration console** to upload and manage photos. Just upload files to the right place to add new photos.
* **Designed with modern browsers in mind**. The absence of compatibility with old versions of Internet Explorer is a feature not a bug.

## License

Exposition. Copyright (c) 2013-2016 Aymeric Barthe.

The software is covered by the **GNU Affero General Public License version 3**, with an additional restriction that forces a small copyright notice to be preserved in minified javascript code. You are free to distribute and use this software freely, but if modify it, you need to make your changes available with the same license. Check [the license](doc/license.txt) for more details.

If you want to acquire the software under a proprietary license more suitable for business needs, please [contact me](mailto:aymeric@barthe.ph) directly. I own all the intellectual property and can release this software with a [different license](http://en.wikipedia.org/wiki/Multi-licensing).

## Download and Installation

*TODO  ALL SECTIONS BELOW  NEED TO BE UPDATED*

* Get an Apache web server supporting PHP 5.3 with [GD](http://php.net/manual/en/book.image.php).
* Download [the latest release](http://exposition.barthe.ph/download/exposition-0.3.0.tar.gz) of Exposition.
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
* Optionally, you can navigate to **update.html** to force your web server to cache your photos at all configured sizes.
* You can also deploy Exposition with [NGINX](http://wiki.nginx.org/Main) and [PHP-FPM](http://php-fpm.org) instead of Apache. You will need to edit the site's rules based on the configuration given in the file ``nginx.conf`` inside the release package. This is how the demo site is deployed.

## Futher Information 
* [Download Exposition 0.4.0](http://exposition.barthe.ph/download/exposition-0.4.0.tar.gz)
* [License](doc/license.txt)
* Live Demo. **TODO**
* [Changelog](doc/changelog.md)
* [Build from Source](doc/build.md)

