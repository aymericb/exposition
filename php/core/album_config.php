<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

namespace Barthe\Exposition;

require_once('../core/config.php');
require_once('../core/path.php');

class AlbumConfig
{
	// Private members
	private $json;

	// Constructor
	public function __construct($album_path) 
	{
		// Preconditions
		assert($album_path && substr($album_path, 0, 1) === '/');
		$realPath = AlbumConfig::getAlbumRealPath($album_path);
		assert(is_file($realPath));

		// Read JSON file
		$content = file_get_contents($realPath);
		if (! $content)
			throw new \Exception("Cannot read JSON file \"$realPath\"");
		$this->json = json_decode($content);
		if (! $this->json)
			throw new \Exception("Cannot parse JSON file \"$realPath\"");

		// Check version
		if (! isset($this->json->version))
			throw new \Exception("Missing 'version' attribute in \"$realPath\"");
		if ($this->json->version !== 1)
			throw new \Exception("Invalid 'version' attribute in \"$realPath\"");

		// Check children
		if (! isset($this->json->children))
			throw new \Exception("Missing 'children' attribute in \"$realPath\"");		
		if (! is_array($this->json->children))
			throw new \Exception("Unsupported 'children' attribute in \"$realPath\"");
	    for ($i = 0; $i < count($this->json->children); ++$i) {
	    	
	    	// Check filename
	    	if (! isset($this->json->children[$i]->filename))
	    		throw new \Exception("Missing 'filename' attribute in #$i child of \"$realPath\"");
	    	$filename = $this->json->children[$i]->filename;
	    	if (! is_string($filename) || !$filename)
	    		throw new \Exception("Invalid 'filename' attribute in #$i child of \"$realPath\"");

	    	// Check title
	    	if (isset($this->json->children[$i]->title)) {
	    		$title = $this->json->children[$i]->title;
	    		if (! is_string($title) || !$title)
	    			throw new \Exception("Invalid 'title' attribute in #$i child of \"$realPath\"");	    			
	    	}
	    }
	}

	// Accessors
	public function getChildren() {
		return $this->json->children;
	}
	
	// Helper Method
	public static function getAlbumRealPath($album_path) {
		$realPath = joinPath(Config::PHOTO_DIR, $album_path);
		$realPath = joinPath($realPath, 'album.json');
		return $realPath;
	}

	public static function hasAlbumConfig($album_path) {
		return is_file(AlbumConfig::getAlbumRealPath($album_path));		
	}
}

?>
