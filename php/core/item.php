<?php 
//
// Exposition. Copyright (c) 2013 Aymeric Barthe.
// The Exposition codebadase is licensed under the GNU Affero General Public License 3 (GNU AGPL 3)
// with the following additional terms. This copyright notice must be preserved in all source 
// files, including files which are minified or otherwise processed automatically.
// For further details, see http://exposition.barthe.ph/
//

namespace Barthe\Exposition;

require_once('../core/path.php');
require_once('../core/config.php');
require_once('../core/album.php');		
require_once('../core/photo.php');

/**
 * Item is an abstract class that describes a member of an album, which can be a 
 * Photo or an Album object. Items are normally created with the static 
 * Item::createItem() helper functions which returns an Item or the right type.
 * An item contains a path and title properties.
 * @see Album, Photo
 */
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
				// It is possible to not find the item in the album but we allow
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

	/** 
	 * Factory method. Create an item based on a path
	 * @param string $path 	      Virtual path representing the item to load.
	 * @param string $title       (optional) Override the default title (computed from basename).
	 * @param bool $loadChildren  (optional) Allow to load children items for Albums until they contain photo items (not recursive).
	 * @return The created Item (either a Photo or Album), or NULL if no item exists at the given path.
	 * @throws \Exception on errors
	 */
	static public function createItem($path, $title=NULL, $loadChildren=TRUE)
	{		
		// Create album or photo depending on filesystem
		$realPath = joinPath(Config::PHOTO_DIR, $path);
		if (is_dir($realPath)) {
			return new Album($path, $title, $loadChildren);
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