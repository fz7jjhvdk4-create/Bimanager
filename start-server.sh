#!/bin/bash
export PATH="/Users/claeshansen/.nvm/versions/node/v24.12.0/bin:$PATH"
cd ~/bimanager
npm run dev > /tmp/bimanager.log 2>&1 &
echo $!
