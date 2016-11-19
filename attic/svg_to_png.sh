#!/bin/sh
#
# Convert to PNG
# Imagemagick and librsvg does not work, because I used 'symbol' and other advanced stuff
# qlmanage -t -s 200 -o . buttons.svg ... Works but there is no well to control the output
#
# Inkscape is slow, but it's the only thing that actually works

INKSCAPE=/Volumes/Inkscape/Inkscape.app/Contents/Resources/bin/inkscape
$INKSCAPE --export-png css/buttons.png -w 200 -h 200 css/buttons.svg

