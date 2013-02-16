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
		// Precondition
		assert($path && substr($path, 0, 1) === '/');

		// Set members
		$this->path = $path;
		$this->realPath = joinPath(Config::PHOTO_DIR, $path);
		$this->title = $title;

		// Attempt to determine title from JSON config file
		if (! $this->title && $this->title !== '/') {
			$parent_path = substr($this->path, 0, Item::lastIndexOf($this->path, '/')+1);
			if (AlbumConfig::hasAlbumConfig($parent_path)) {
				$filename = basename($this->path);
				$config = new AlbumConfig($parent_path);
				$children = $config->getChildren();
				for ($i = 0; $i < count($children); ++$i) {
					if ($children[$i]->filename === $filename) {
						if (isset($children[$i]->title))
							$this->title = $children[$i]->title;
						break;
					}
				}
				// It's possible to not find the item in the album but we allow
				// it to be accessed. These are 'secret' items. 
			}
		}

		// Determine title from filesystem
		if (! $this->title) {
			$this->title = basename($this->path);

			// Special title for root album
			if ($this->title === '') {
				$this->title = '/';
			}

			// Remove trailing extension
			$dot_idx = Item::lastIndexOf($this->title, '.');
			if ($dot_idx)
				$this->title = substr($this->title, 0, $dot_idx);
		}
	}

	// Helper method
	static private function lastIndexOf($haystack, $needle) {
		$idx = $last_idx = strrpos($haystack, $needle);
		while ($idx !== FALSE && $idx < strlen($haystack)) {
			$last_idx = $idx;
			$idx = strrpos($haystack, $needle, $last_idx+1);
		}
		return $last_idx;
	}

	// Factory method
	// ### TODO: Add option to stop recursion
	static public function createItem($path, $title=NULL)
	{		
		// Create album or photo depending on filesystem
		$realPath = joinPath(Config::PHOTO_DIR, $path);		
		if (is_dir($realPath)) {
			return new Album($path, $title);
		} else if (file_exists($realPath)) {
			$ext = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
			if (in_array($ext, Config::PHOTO_EXTENSIONS())) {
				return new Photo($path, $title);
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