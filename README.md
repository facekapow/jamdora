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

# http
jamdora serve http -P path_to_playlist

# https
jamdora serve https -P path_to_playlist -k key -c cert
```
Replace `path_to_playlist` with the (full or relative) path to the playlist.
For HTTPS, replace `key` with the path to your key file, and `cert` with the path to your certificate file.
