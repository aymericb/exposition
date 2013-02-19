<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

namespace Barthe\Exposition;

class Config 
{
	const PHOTO_CACHE_DURATION = 3600;	// Cache-control max-age for images (seconds)

	const VERSION = '0.2 alpha';
	const INFO = 'Exposition 0.2 alpha. (c) 2013 Aymeric Barthe.';

	const PHOTO_DIR = '/nas/media3/Exposition/Albums';
	const CACHE_DIR = '/nas/unsafe/ExpositionCache';
	static public function PHOTO_EXTENSIONS() 
	{
		return array('jpg', 'jpeg');		// In lowercase.
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
}

?>