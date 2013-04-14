<?php 
//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition code base is licensed under the GNU Affero General Public 
// License 3 (GNU AGPL 3) with the following additional terms. This copyright
// notice must be preserved in all source files, including files which are 
// minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

namespace Barthe\Exposition;

class Config 
{
	const VERSION = '0.3 beta';
	const INFO = 'Exposition 0.3 beta. (c) 2013 Aymeric Barthe.';

	const GALLERY_NAME = 'Exposition';

	const PHOTO_CACHE_DURATION = 3600;	// Cache-control max-age for images (seconds)

	const PHOTO_DIR = '/nas/media3/Exposition/Albums';
	const CACHE_DIR = '/nas/unsafe/ExpositionCache';
	static public function PHOTO_EXTENSIONS() 
	{
		return array('jpg', 'jpeg', 'png');		// In lowercase.
	}
	static public function PHOTO_SIZES() 
	{
		return array(0 /* full-size */, 2560 /* iMac 27 */, 
			2048 /* iPad retina */, 1024 /* iPad classic, iPhone retina */,
			512 /* smaller phones */);
	}
	static public function THUMBMAIL_SIZES() 
	{
		// The first size is the one used for the thumnails.
		// Larger sizes are provided for devices with a pixel ratio larger than 1
		return array(160, 320 /* retina screen ratio=2*/);
	}

	// Download is only allowed for albums without sub albums and individual photos
	// This requires size '0', i.e. native size, to be enabled in PHOTO_SIZES
	const IS_DOWNLOAD_ALLOWED = TRUE;
}

?>