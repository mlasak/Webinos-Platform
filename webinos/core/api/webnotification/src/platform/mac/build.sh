#!/bin/sh

git clone git://github.com/mlasak/cocoadialog.git
cd cocoadialog &&
git checkout 2.1.1webinoschanges &&
xcodebuild -sdk macosx10.7 -project CocoaDialog.xcodeproj
