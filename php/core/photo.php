<?php 
//
// Exposition. © 2013 Aymeric Barthe
//

namespace Barthe\Exposition;

require_once('../core/item.php');

class Photo extends Item
{
	// Constructor
	public function __construct($path, $title=NULL) 
	{
		// Construct superclass
		parent::__construct($path, $title);

		// ### TODO
		// Parse JSON config file
	}

	// Helper Method
	static function isPhoto($obj) 
	{
		return (get_class($obj) === 'Barthe\Exposition\Photo');
	}
	
}

?>