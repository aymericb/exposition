<?php 
namespace Barthe\Exposition;

require_once('item.php');

class Photo extends Item
{
	// Constructor
	public function __construct($path, $title=NULL) 
	{
		// Construct superclass
		parent::__construct($path, $title);

		// ### TODO
	}

	// Helper Method
	static function isPhoto($obj) 
	{
		return (get_class($obj) === 'Barthe\Exposition\Photo');
	}	
	
}

?>