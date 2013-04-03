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
require_once('../core/config.php');

class Image 
{
	// Private Members
	private $cachePath;

	// Constructor
	public function __construct($path, $size) 
	{
		// Add implied root directory
		$path = joinPath(Config::PHOTO_DIR, $path);

		// Check if size is authorized
		if (!in_array($size, Config::PHOTO_SIZES()) &&
			!in_array($size, Config::THUMBMAIL_SIZES()) )
		{
			throw new \Exception("Invalid size for image: $size");
		}

		// Check if native size (magic value '0')
		if ($size === 0)
		{
			$this->cachePath = $path;
			return;
		}

		// Get original file timestamp
		$originalTime = filemtime($path);
		if (! $originalTime) {
			throw new \Exception("Cannot get time for \"$path\"");
		}

		// Computed cached image path
		$this->cachePath = joinPath(Config::CACHE_DIR, $size);
		$this->cachePath = joinPath($this->cachePath, substr($path, strlen(Config::PHOTO_DIR)));
		//$info = pathinfo($this->cachePath);
		$this->cachePath = joinPath(dirname($this->cachePath), basename($this->cachePath) );
		//$this->cachePath = joinPath(dirname($this->cachePath), basename($this->cachePath, '.'.$info['extension']). "_" . $size . ".jpg");
		@mkdir(dirname($this->cachePath), 0700, true);

		// Check if image is really cached
		$cached = false;
		if (file_exists($this->cachePath)) {
			$cacheTime = @fileatime($this->cachePath);
			$cached = $cacheTime && ($cacheTime > $originalTime);
		}

		// Cache if necessary
		if (! $cached) {
			$this->cache($path, $size);
		}
	}

	// Create cache asset
	private function cache($path, $size) {

		// Read asset size
		$image_size = getimagesize($path);
		if (! $image_size)
			throw new \Exception("Cannot get size for \"$path\"");
		list($width, $height, $type) = $image_size;

		// Compute asset new size
		$ratio = $width / $height;
		$cacheWidth = $cacheHeight = 0;
		if ($width>$height) {
			$cacheWidth = $size;
			$cacheHeight = $cacheWidth / $ratio;
		} else {
			$cacheHeight = $size;
			$cacheWidth = $cacheHeight * $ratio;
		}

		// Check if original image is smaller than requested image
		if ($cacheHeight*$cacheWidth > $width*$height) {
			//if (! copy($path, $this->cachePath))
			if (! symlink($path, $this->cachePath))
				throw new \Exception("Cannot copy \"$path\" to cache");
			return;
		}

		// Read original image
		$image = NULL;
		switch ($type) {
			case IMAGETYPE_GIF:
				$image = imagecreatefromgif($path);
				break;
			case IMAGETYPE_JPEG:
				$image = imagecreatefromjpeg($path);
				break;
			case IMAGETYPE_PNG:
				$image = imagecreatefrompng($path);
				break;
			case IMAGETYPE_BMP:
				$image = imagecreatefromwbmp($path);
				break;
		}
		if (! $image) 
			throw new \Exception("Unknown image type for \"$path\"");

		// Create cached image
		$cacheImage = imagecreatetruecolor($cacheWidth, $cacheHeight);
		if (!$cacheImage)
			throw new \Exception('imagecreatetruecolor() failed');
		if (!imagecopyresampled($cacheImage, $image, 0, 0, 0, 0, $cacheWidth, $cacheHeight, $width, $height))
			throw new \Exception('imagecopyresampled() failed');
		if (!imagejpeg($cacheImage, $this->cachePath))
			throw new \Exception('imagejpeg() failed');

		// Free resources
		@imagedestroy($image);
		@imagedestroy($cacheImage);
	}

	// Getter
	public function getPath() {
		return $this->cachePath;
	}

	public function writeImage() {	

		// Set common header to all requests
		// We keep on setting Last-Modified, Expires, etc... because some browsers are
		// supposed to be dump. http://stackoverflow.com/questions/1587667/should-http-304-not-modified-responses-contain-cache-control-headers	
		$filepath = $this->getPath();		
	    header("Cache-Control: max-age=".Config::PHOTO_CACHE_DURATION, true);
	    	// 'must-revalidate' is broken as of Safari 6.0.2 (8536.26.17)
	    	// If it is added, the browser will *always* request for the image
	    	// even if max-age has not been reached, if Safari was restarted.
	    	// This is claimed fixed https://bugs.webkit.org/show_bug.cgi?id=13128 
	    	// but seems to work only as long as Safari is running... Similarly 
	        // Safari will *always* reload any images after restart, rather than issue
	        // a 'if-modified-since'...
	    $last_modified = filemtime($filepath);
	    header("Last-Modified: ".gmdate("D, d M Y H:i:s", $last_modified)." GMT", true);
	    header('Expires: ' . gmdate('D, d M Y H:i:s', time()+Config::PHOTO_CACHE_DURATION) . ' GMT',  true);

	    // Handle 'if-modified-since'	
		if (isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) >= $last_modified) {
			header('HTTP/1.0 304 Not Modified', true);
		} else {
		// Send data normally
			header('Content-Type: image/jpeg', true);
			header("Content-Length: " . filesize($filepath), true);
			if (! @readfile($this->getPath()))
				throw new \Exception("Cannot read image file \"" . $filepath . "\"");
		}
	}
}

?>