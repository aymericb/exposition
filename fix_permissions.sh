#!/bin/sh
#
# Quick and dirty script to fix permissions on my NAS development server
#

WWW_DIR=/nas/unsafe/www
DATA_DIR=/nas/media3/Exposition

chown -R www-data ${WWW_DIR} && \
chgrp -R jackjeff ${WWW_DIR} && \
chmod -R o+rwX,g+rwX,o+rX-w ${WWW_DIR} && \
chown -R www-data ${DATA_DIR} && \
chgrp -R jackjeff ${DATA_DIR} && \
chmod -R o+rwX,g+rwX,o+rX-w ${DATA_DIR} 

if [ $? -ne 0 ]
then
        echo "ERROR: Could not fix all permissions" 1>&2
        exit $?
fi

