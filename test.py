#! /usr/bin/python
import sys, tempfile, os
from subprocess import call

EDITOR = os.environ.get('EDITOR','vim') #that easy!

initial_message = "" # if you want to set up the file somehow

with tempfile.NamedTemporaryFile(suffix=".tmp") as tempfile:
	tempfile.write(initial_message)
	tempfile.flush()
	call([EDITOR, tempfile.name])
	# do the parsing with `tempfile` using regular File operations
