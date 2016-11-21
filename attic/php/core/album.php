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

require_once('../core/path.php');
require_once('../core/item.php');
require_once('../core/album_config.php');

/** 
 * Create an Album item.
 * An album is a regular item, whith an extra property 'children', which is an array of 
 * other Item instances. Classic composite design pattern.
 * @param string $path 	      Virtual path representing the item to load.
 * @param string $title       (optional) Override the default title (computed from basename).
 * @param bool $loadChildren  (optional) Allow to load children items. If it is false, the Album is
 * created with an empty children array. If it is true, the Album will load the children. If it
 * encounters at least one Photo item, children Albums will be loaded with $loadChildren=FALSE.
 * Otherwise, their children will be loaded recursively, until a Photo item is found.
 * @return The created Item (either a Photo or Album), or NULL if no item exists at the given path.
 * @throws \Exception on errors
 */
class Album extends Item
{
	// Private members
	private $children;

	// Constructor
	public function __construct($path, $title=NULL, $loadChildren=TRUE) 
	{
		// Construct superclass
		parent::__construct($path, $title);

		// Load children
		$this->children = array();
		if ($loadChildren)
			$this->loadChildren();
	}

	// Load children using JSON or filesystem data
	// Children albums are loaded recursively, until at least one Photo item is found.
	// Delayed loading is used, for album child items (i.e. loadChildren() is used after construction).
	private function loadChildren() {
		// Open $path directory
		$dir = opendir($this->realPath);
		if (!$dir)
			throw new \Exception("Cannot open directory \"$this->path\"");

		// Load items
		$loadAlbums = NULL;
		if (AlbumConfig::hasAlbumConfig($this->path)) {
			$loadAlbums = $this->initJSONChildren($dir, $this->path);
		} else {
			$loadAlbums = $this->initFSChildren($dir);
		}

		// Delayed load of children of album items (not Photo item found)
		if ($loadAlbums) {
			for ($i = 0; $i < count($loadAlbums); ++$i) {
				$loadAlbums[$i]->loadChildren();
			}
		}
	}

	// Load $this->children using filesystem data only
	private function initFSChildren($dir) {
		// Array of children albums, for delayed loading
		$foundPhoto = FALSE;
		$albumChildren = array();		

		// Iterate on $path. Fill $children
		while (false !== ($entry = readdir($dir))) {
			if ($entry === '.' || $entry === '..')
				continue;
			$filepath = joinPath($this->realPath, $entry);
			$item = Item::createItem(joinPath($this->path, $entry), NULL, FALSE);
			if ($item) {
				array_push($this->children, $item);
				if (Album::isAlbum($item))
					array_push($albumChildren, $item);
				else if (!$foundPhoto && Photo::isPhoto($item))
					$foundPhoto = TRUE;
			}
		}

		// Sort array by name
		usort($this->children, function($a, $b) {
				return strcmp($a->getPath(), $b->getPath());
			}
		);

		// Return array of albums to load
		if ($foundPhoto)
			return NULL;
		else
			return $albumChildren;
	}

	// Load $this->children using album.json config file
	private function initJSONChildren($dir, $path) {
		// Array of children albums, for delayed loading
		$foundPhoto = FALSE;
		$albumChildren = array();

		// Load items from album.json
		$config = new AlbumConfig($path);
		$children = $config->getChildren();
		for ($i = 0; $i < count($children); ++$i) {
			$filename = $children[$i]->filename;
			$filepath = joinPath($this->realPath, $filename);				
			if (file_exists($filepath)) {
				$title = NULL;
				if (isset($children[$i]->title))
					$title = $children[$i]->title;
				$item = Item::createItem(joinPath($this->path, $filename), $title, FALSE);
				if ($item) {
					array_push($this->children, $item);
					if (Album::isAlbum($item))
						array_push($albumChildren, $item);
					else if (!$foundPhoto && Photo::isPhoto($item))
						$foundPhoto = TRUE;
				}
			}
		}

		// Return array of albums to load
		if ($foundPhoto)
			return NULL;
		else
			return $albumChildren;
	}

	// Helper Method
	static function isAlbum($obj) 
	{
		return (get_class($obj) === 'Barthe\Exposition\Album');
	}

	// Accessors
	public function getChildren() 
	{
		return $this->children;
	}

}

?>