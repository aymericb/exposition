<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

namespace Barthe\Exposition;

require_once('../core/path.php');
require_once('../core/item.php');

class Album extends Item
{
	// Private members
	private $children;

	// Constructor
	public function __construct($path) 
	{
		// Construct superclass
		parent::__construct($path);

		// Open $path directory
		$dir = opendir($this->realPath);
		if (!$dir)
			throw new \Exception("Cannot open directory \"$this->path\"");

		// ### TODO: Parse JSON config file

		// Iterate on $path. Fill $children
		// ### TODO: Sort by filename
		$this->children = array();
		while (false !== ($entry = readdir($dir))) {
			if ($entry === '.' || $entry === '..')
				continue;
			$filepath = joinPath($this->realPath, $entry);
			$item = Item::createItem(joinPath($this->path, $entry));
			if ($item)
				array_push($this->children, $item);
		}

		// Sort array by name
		usort($this->children, function($a, $b)
			{
				return strcmp($a->getPath(), $b->getPath());
			}
		);
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