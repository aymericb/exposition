#!/bin/sh
#
# Quick and dirty script to fix permissions on my NAS development server
#

WWW_DIR=/nas/unsafe/www
DATA_DIR=/nas/media3/Exposition
CACHE_DIR=/nas/unsafe/ExpositionCache


change_permissions () 
{
	chown -R www-data $1 && \
	chgrp -R jackjeff $1 && \
	chmod -R o+rwX,g+rwX,o+rX-w $1
}

change_permissions ${WWW_DIR} && change_permissions ${DATA_DIR} && change_permissions ${CACHE_DIR}

if [ $? -ne 0 ]
then
        echo "ERROR: Could not fix all permissions" 1>&2
        exit $?
fi

