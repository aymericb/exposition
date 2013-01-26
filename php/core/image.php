<?php 
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

		// Get original file timestamp
		$originalTime = filemtime($path);
		if (! $originalTime) {
			throw new \Exception("Cannot get time for \"$path\"");
		}

		// Computed cached image path
		$this->cachePath = Config::CACHE_DIR . substr($path, strlen(Config::PHOTO_DIR));
		$info = pathinfo($this->cachePath);
		$this->cachePath = joinPath(dirname($this->cachePath), basename($this->cachePath, '.'.$info['extension']). "_" . $size . ".jpg");
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
			throw new \Exception("Cannot get time for \"$path\"");
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
		$image = imagecreatefromjpeg($this->getPath());
		if (! $image)
			throw new \Exception("Cannot create image for \"" . $this->getPath() . "\"");
		header('Content-Type: image/jpeg');
		imagejpeg($image);
		@imagedestroy($image);
	}
}

?>