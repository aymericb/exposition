<?php 
namespace Barthe\Exposition;

class Config 
{
	const PHOTO_DIR = '/nas/media3/Exposition/Albums';
	const CACHE_DIR = '/nas/media3/Exposition/Cache';
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