<?php 
namespace Barthe\Exposition;

require_once('config.php');
require_once('album.php');
require_once('photo.php');

abstract class Item 
{
	// Private members
	protected $path;
	protected $title;

	// Constructor
	protected function __construct($path, $title=NULL) 
	{		
		$this->path = $path;
		$this->title = $title;
		if (! $this->title)
			$this->title = basename($this->path);
	}

	// Factory method
	// ### TODO: Add option to stop recursion
	static function createItem($path) 
	{
		// Create album or photo depending on filesystem
		if (is_dir($path)) {
			return new Album($path);
		} else if (file_exists($path)) {
			$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
			if (in_array($ext, Config::PHOTO_EXTENSIONS())) {
				return new Photo($path);
			}
		}

		// Nothing was created
		return NULL;
	}

	// Accessors
	public function getPath() 
	{
		return $this->path;
	}

	public function getTitle() 
	{
		return $this->title;
	}
}

?>