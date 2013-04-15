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
require_once('../core/item.php');
require_once('../core/photo.php');
require_once('../core/image.php');
require_once('../core/archive.php');

try {

	// Get parameters
	$path = $_GET['path'];
	if (!isset($path) || !$path || empty($path))
		throw new \Exception('Missing path parameter');

	// Check if download is allowed
	if (!Config::IS_DOWNLOAD_ALLOWED)
		throw new \Exception('Download is not allowed');

	// Load item
	$item = Item::createItem($path);
	if (!$item)
		throw new \Exception("Item \"$path\" cannot be not found");

	// Send content
	if (Photo::isPhoto($item)) {
		header('Content-Disposition: attachment; filename=' . basename($path), true); 
		$image = new Image($path, 0);
		$image->writeImage();		
	} else {
		$archive = new Archive($item);
		$archive->writeArchive();
	}

} catch (\Exception $e) {
	header_remove('Content-Disposition');
	header_remove('Content-Type');
	header('HTTP/1.1 500 Internal Server Error', true);
	echo('<br><br><b>ERROR: '.$e->getMessage().'</b');
}
?>