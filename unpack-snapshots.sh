#!/bin/bash

# Inflate a snapshot of netcipher and the extension, help us to run jenkins
# contiaunous integration.

# Created by Stefano Pacifici on 2016/03/21

src=$0
(
  cd "`dirname $src`"
  tar xf netcipher-snapshot.tar.gz
  tar xf extension-snapshot.tar.gz
)
