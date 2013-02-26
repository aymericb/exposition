<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

namespace Barthe\Exposition;
require_once('../core/image.php');

try {

	// Get parameters
	$cacheOnly = isset($_GET['cache']);

	$path = $_GET['path'];
	if (!isset($path) || !$path || empty($path))
		throw new \Exception('Missing path parameter');

	$size = $_GET['size'];
	if (!isset($size))
		throw new \Exception('Missing size parameter');
	if ($size === '0') {
		$size = 0;
	} else {
		$size = intval($size);
		if (!$size)
			throw new \Exception('Invalid size parameter');
	}

	// Get cached image
	$image = new Image($path, $size);
	if (!$cacheOnly)
		$image->writeImage();

} catch (\Exception $e) {
	header('HTTP/1.1 500 Internal Server Error', true);
	echo('<br><br><b>ERROR: '.$e->getMessage().'</b');
}
?>