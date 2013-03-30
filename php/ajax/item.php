<?php 
//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition codebadase is licensed under the GNU Affero General Public License 3 (GNU AGPL 3)
// with the following additional terms. This copyright notice must be preserved in all source 
// files, including files which are minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

namespace Barthe\Exposition;
require_once('../core/album.php');
require_once('../core/photo.php');

function createItemData($item) 
{
	$type = Photo::isPhoto($item) ? 'photo' : 'album';
	$data = array('type' => $type, 'title' => $item->getTitle(), 'path' => $item->getPath());

	if (Album::isAlbum($item)) {
		$data['children'] = array();
		foreach ($item->getChildren() as $subitem) {
			array_push($data['children'], createItemData($subitem));
		}
	}
	
	return $data;
}

try {

	// Get parameters
	$path = $_GET['path'];
	if (!$path || empty($path))
		throw new \Exception('Missing path parameter');

	// Get item path
	$item = Item::createItem($path);
	$data = createItemData($item);

	// Send JSON
	header('content-type: application/json; charset=utf-8');
	print(json_encode($data));

} catch (\Exception $e) {
	header('HTTP/1.1 500 Internal Server Error', true);
	echo('<br><br><b>ERROR: '.$e->getMessage().'</b');
}
?>