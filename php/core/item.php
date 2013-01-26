<?php 
namespace Barthe\Exposition;

require_once('../core/path.php');
require_once('../core/config.php');
require_once('../core/album.php');		
require_once('../core/photo.php');

abstract class Item 
{
	// Private members
	protected $path;
	protected $realPath;
	protected $title;

	// Constructor
	protected function __construct($path, $title=NULL) 
	{		
		$this->path = $path;
		$this->realPath = joinPath(Config::PHOTO_DIR, $path);
		$this->title = $title;
		if (! $this->title) {
			$this->title = basename($this->path);
			if ($this->title === '') {
				$this->title = '/';		// Special title for root album
			}
		}
	}

	// Factory method
	// ### TODO: Add option to stop recursion
	static function createItem($path) 
	{		
		// Create album or photo depending on filesystem
		$realPath = joinPath(Config::PHOTO_DIR, $path);		
		if (is_dir($realPath)) {
			return new Album($path);
		} else if (file_exists($realPath)) {
			$ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
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