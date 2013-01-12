<?php 
namespace Barthe\Exposition;

require_once('item.php');

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
		$this->path = $path;
		$dir = opendir($this->path);
		if (!$dir)
			throw new \Exception("Cannot open directory \"$this->path\"");

		// ### TODO: Parse JSON config file

		// Iterate on $path. Fill $children
		// ### TODO: Sort by filename
		$this->children = array();
		while (false !== ($entry = readdir($dir))) {
			if ($entry === '.' || $entry === '..')
				continue;
			$filepath = $this->path . DIRECTORY_SEPARATOR . $entry;
			$item = Item::createItem($filepath);
			if ($item)
				array_push($this->children, $item);
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