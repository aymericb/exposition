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