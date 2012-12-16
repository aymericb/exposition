<?php
namespace Barthe\Exposition;
require_once 'barthe/exposition/config.php';
require_once 'barthe/exposition/album.php';
require_once 'barthe/exposition/photo.php';

//$photo = new Photo('/nas/media3/Exposition/Albums/france_oct_2009/albi/IMG_7841.jpg');
$album = new Album('/nas/media3/Exposition/Albums/france_oct_2009');

function printAlbum($album) 
{
	print('<ul>');
	foreach ($album->getChildren() as $item) {
		print('<li>'.$item->getTitle());
		if (Album::isAlbum($item)) {
			printAlbum($item);
		}
		print('</li>');
	}	
	print('</ul>');
}

?>

<html>
<body>
<h2>Config</h2>
<ul>
	<li><b>PhotoDir:</b> <?= Config::PHOTO_DIR ?></li>
	<li><b>CacheDir:</b> <?= Config::CACHE_DIR ?></li>
</ul>

<h2>Album</h2>
<p>Photo: <?= $album->getTitle() ?></p>
<p>ClassName: <?= get_class($album) ?></p>
<p>Content</p>
<ul>
	<?php
		printAlbum($album);
	?>
</ul>
</body>
</html>
