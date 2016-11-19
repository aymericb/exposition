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
use ZipArchive;	// new \ZipArchive() is not working... 

require_once('../core/path.php');
require_once('../core/config.php');
require_once('../core/album.php');

class Archive 
{
	// Private Members
	private $item;
	private $archivePath;

	// Constructor
	public function __construct($item) 
	{
		// Check if download is allowed
		if (!in_array(0, Config::PHOTO_SIZES()))
			throw new \Exception('Full size download is not allowed. Edit Config::PHOTO_SIZES.');
		if (!Config::IS_DOWNLOAD_ALLOWED)
			throw new \Exception('Downloads are not allowed. Edit Config::IS_DOWNLOAD_ALLOWED');
		if (!Album::isAlbum($item))
			throw new \Exceptions('Archive not supported because item is not an album: "'.$item->getPath().'
				"');
		foreach ($item->getChildren() as $subitem) {
			if (Album::isAlbum($subitem))
				throw new \Exception('Cannot create archive because the album contains at least one sub-album: "'.$item->getPath().'"');
		}

		// Compute archive path
		$this->archivePath = joinPath(Config::CACHE_DIR, 'zip', $item->getPath().'.zip');

		// Check if cache is up to date
		$cached = false;
		if (file_exists($this->archivePath)) {
			$cacheTime = @filemtime($this->archivePath);
			$originalTime = 0;
			foreach ($item->getChildren() as $subitem) {
				$photoTime = @filemtime(joinPath(Config::PHOTO_DIR, $subitem->getPath()));
				if (!$photoTime)
					throw new \Exception('Cannot read timestamp for photo: "'.$subitem->getPath().'"');
				if ($photoTime>$originalTime)
					$originalTime=$photoTime;
			}
			$cached = $cacheTime && ($cacheTime > $originalTime);
		}

		// Cache if necessary
		if (! $cached) {
			$this->cache($item);
		}
	}

	// Create cache asset
	private function cache($item) {

		// Erase existing file if necessary
		if (file_exists($this->archivePath)) {
			if (! unlink($this->archivePath))
				throw new \Exception("Cannot delete \"$path\" from cache");
		}

		// Create parent directory
		@mkdir(dirname($this->archivePath), 0700, true);		

		// Create archive
		$zip = new ZipArchive;
		if ($zip->open($this->archivePath, ZIPARCHIVE::CREATE|ZIPARCHIVE::OVERWRITE) !== TRUE)
			throw new \Exception('Cannot create ZIP archive: "'.$this->archivePath.'"');

		// Add photos
		foreach ($item->getChildren() as $subitem) {
			$photo = joinPath(Config::PHOTO_DIR, $subitem->getPath());
			if (!$zip->addFile($photo, basename($photo)))
				throw new \Exception("Failed to compress file: \"$photo\"");
		}

		// Close archive
		if (!$zip->close())
			throw new \Exception('Failed to close ZIP archive: "'.$this->archivePath.'"');
	}

	public function writeArchive() {	

		// ### TODO: Refactor. This code is 'copied' from image.php

		// Set common header to all requests
		// We keep on setting Last-Modified, Expires, etc... because some browsers are
		// supposed to be dump. http://stackoverflow.com/questions/1587667/should-http-304-not-modified-responses-contain-cache-control-headers	
		$filepath = $this->archivePath;		
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
			// ### header('Content-Type: image/jpeg', true);
			header('Content-Type: application/zip, application/octet-stream', true);
			header("Content-Length: " . filesize($filepath), true);
			if (! @readfile($filepath))
				throw new \Exception("Cannot read image file \"$filepath\"");
		}
	}
}

?>