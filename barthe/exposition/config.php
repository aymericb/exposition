<?php 
namespace Barthe\Exposition;

class Config 
{
	const PHOTO_DIR = '/nas/media3/Exposition/Albums';
	const CACHE_DIR = '/nas/media3/Exposition/Cache';
	static public function PHOTO_EXTENSIONS() {
		return array('jpg', 'jpeg');		// In lowercase.
	}
}

?>