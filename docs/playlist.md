# playlist

Basic outline:
```json
{
  "songs": [
    "full_paths_to_files"
  ]
}
```
A playlist can be generated from a folder with the `jamdora generate` command:
```bash
jamdora generate path_to_folder [output_filename]
```
By default, the filename is "playlist.json".
