#!/bin/sh

gcc -Wall notify-send-alternative.c -o notify-send-alternative `pkg-config --cflags gtk+-2.0` `pkg-config --libs gtk+-2.0`
