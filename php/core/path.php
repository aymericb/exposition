<?php 
namespace Barthe\Exposition;

// ### FIXME: Use DIRECTORY_SEPARATOR for OS seprators

// From http://stackoverflow.com/questions/1091107/how-to-join-filesystem-path-strings-in-php
function joinPath() {
    $args = func_get_args();
    $paths = array();

    foreach($args as $arg) {
        $paths = array_merge($paths, (array)$arg);
    }

    foreach($paths as &$path) {
        $path = trim($path, '/');
    }

    if (substr($args[0], 0, 1) == '/') {
        $paths[0] = '/' . $paths[0];
    }

    $value = join('/', $paths);
    
    if (!strncmp($value, '//', strlen('//'))) {
        return substr($value, 1);
    } else {
        return $value;
    }
}

?>