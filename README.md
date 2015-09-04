# jamdora
Your personal Pandora server!

## Install
```bash
# add `sudo` if needed
npm install -g jamdora
```

## First-time configuration
```bash
# add `sudo` if needed
jamdora adduser username password
```
Replace `username` and `password` with your values.

## Usage
```bash
# add `sudo` if needed, because the
# default is to listen on port 80 (HTTP)
# or port 443 (HTTPS)
#
# -w is to serve a web front end at "/"

# http
jamdora serve http -P path_to_playlist [-w]

# https
jamdora serve https -P path_to_playlist -k key -c cert [-w]
```
Replace `path_to_playlist` with the (full or relative) path to the playlist.
For HTTPS, replace `key` with the path to your key file, and `cert` with the path to your certificate file.

## Generating a Playlist
A playlist can be generated from a folder with the `jamdora generate` command:
```bash
jamdora generate path_to_folder [output_filename]
```
Replace `path_to_folder` with the path to the folder containing the music you want to be in the playlist,
and replace `output_filename` with the output filename you want.
By default, the output filename is "playlist.json".
