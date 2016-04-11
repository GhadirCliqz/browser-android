#!/bin/bash

# Inflate a snapshot of the extension, help us to run jenkins
# contiaunous integration.

# Created by Stefano Pacifici on 2016/03/21

src=$0
(
  cd "`dirname $src`"
  tar xf extension-snapshot.tar.gz
)
