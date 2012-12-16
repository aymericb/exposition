<?php 
namespace Barthe\Exposition;

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

	// Accessors
	/* ### TODO
	public function getPhoto() 
	{

	}
	*/

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