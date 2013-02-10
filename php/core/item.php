<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

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

			// Special title for root album
			if ($this->title === '') {
				$this->title = '/';
			}

			// Remove trailing extension
			$dot = $last_dot = strrpos($this->title, '.');
			while ($dot !== FALSE && $dot < strlen($this->title)) {
				$last_dot = $dot;
				$dot = strrpos($this->title, '.', $last_dot+1);
			}
			if ($last_dot)
				$this->title = substr($this->title, 0, $last_dot);
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