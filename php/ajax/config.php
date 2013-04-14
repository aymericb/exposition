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
require_once('../core/config.php');

try {

	// Create data
	$data = array(
		'version' => Config::VERSION, 
		'info' => Config::INFO, 
		'gallery_name' => Config::GALLERY_NAME,
		'photo_sizes' => Config::PHOTO_SIZES(), 
		'thumnail_sizes' => Config::THUMBMAIL_SIZES(),
		'is_download_allowed' => Config::IS_DOWNLOAD_ALLOWED
	);	

	// Send JSON
	header('content-type: application/json; charset=utf-8');
	print(json_encode($data));

} catch (\Exception $e) {
	header('HTTP/1.1 500 Internal Server Error', true);
	echo('<br><br><b>ERROR: '.$e->getMessage().'</b');
}
?>