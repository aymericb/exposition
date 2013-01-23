<?php 
namespace Barthe\Exposition;
require_once('barthe/exposition/item.php');
require_once('barthe/exposition/album.php');
require_once('barthe/exposition/photo.php');

function createItemData($item) 
{
	$type = Photo::isPhoto($item) ? 'photo' : 'album';
	
	// ### FIXME: The class should use relative paths internally
	$path = substr_replace($item->getPath(), '', 0, strlen(Config::PHOTO_DIR)+1);
	if ($path === '') 
		$path = '/';
	
	$data = array('type' => $type, 'title' => $item->getTitle(), 'path' => $path);

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
	$path = Config::PHOTO_DIR . $path;
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