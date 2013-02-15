<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

namespace Barthe\Exposition;

require_once('../core/path.php');
require_once('../core/item.php');
require_once('../core/album_config.php');

class Album extends Item
{
	// Private members
	private $children;

	// Constructor
	public function __construct($path, $title=NULL) 
	{
		// Construct superclass
		parent::__construct($path, $title);

		// Open $path directory
		$dir = opendir($this->realPath);
		if (!$dir)
			throw new \Exception("Cannot open directory \"$this->path\"");

		// Initialize children using JSON or filesystem
		$this->children = array();
		if (AlbumConfig::hasAlbumConfig($path)) {
			$this->initJSONChildren($dir, $path);
		} else {
			$this->initFSChildren($dir);
		}

	}

	// Load $this->children using filesystem data only
	private function initFSChildren($dir) {
		// Iterate on $path. Fill $children
		while (false !== ($entry = readdir($dir))) {
			if ($entry === '.' || $entry === '..')
				continue;
			$filepath = joinPath($this->realPath, $entry);
			$item = Item::createItem(joinPath($this->path, $entry));
			if ($item)
				array_push($this->children, $item);
		}

		// Sort array by name
		usort($this->children, function($a, $b) {
				return strcmp($a->getPath(), $b->getPath());
			}
		);
	}

	// Load $this->children using album.json config file
	private function initJSONChildren($dir, $path) {
		$config = new AlbumConfig($path);
		$children = $config->getChildren();
		for ($i = 0; $i < count($children); ++$i) {
			$filename = $children[$i]->filename;
			$filepath = joinPath($this->realPath, $filename);				
			if (file_exists($filepath)) {
				$title = NULL;
				if (isset($children[$i]->title))
					$title = $children[$i]->title;
				$item = Item::createItem(joinPath($this->path, $filename), $title);
				if ($item)
					array_push($this->children, $item);
			}
	    }
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