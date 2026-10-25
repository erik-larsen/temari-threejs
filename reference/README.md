# Reference material

## Photographs — © NanaAkua, CC BY-NC-ND 2.0

The temari photographs here (`3623371881_f1d840c9d3_o.jpg`,
`3624333878_b61104f03b_o.jpg`, and the `temari-*.jpg` images inside the saved
Colossal article) are by **NanaAkua**, photographing temari made by her
grandmother. They are licensed
[CC BY-NC-ND 2.0](https://creativecommons.org/licenses/by-nc-nd/2.0/)
(Attribution / NonCommercial / NoDerivatives) and are included unmodified.

- Source album: https://flickr.com/photos/31012828@N04/albums/72157617114284128/
- Photographer: https://www.flickr.com/photos/nanaakua/

`nanaakua-temari-album/` (gitignored, ~1 GB) holds the full 468-photo album
at original resolution under the same license, as `flickr_{id}.jpg` with a
`.json` sidecar carrying Flickr's title, upload date, dimensions, and source
URL.

Re-fetching is a two-step job. `gallery-dl` handles the Flickr API fine
(listing every photo's original URL and metadata), but its own downloader
gets HTTP 429 from Flickr's image CDN on every request — regardless of
User-Agent, cookies, or HTTP version — while `curl` fetches the same URLs
without complaint, so the transfers go through `curl`:

```bash
gallery-dl -j "https://www.flickr.com/photos/31012828@N04/albums/72157617114284128/" > /tmp/album.json
```

```bash
python3 reference/fetch-album.py /tmp/album.json reference/nanaakua-temari-album
```

The script skips files already on disk, paces requests, retries with backoff,
and writes the sidecars in gallery-dl's own layout.

Per the NoDerivatives term, do not publish cropped, recolored, or otherwise
modified versions of these images. The viewer's presets are original designs
made after studying the photographs; the photos themselves are never bundled
into the app build (`reference/` is not part of the Vite source tree).

## Articles

- Colossal (Christopher Jobson, 2013) — saved HTML + PDF, © Colossal
- artbooom.com (2014) — saved PDF, © artbooom
- Giuffre & Stemkoski, *Virtual Temari: Artistically Inspired Mathematics*,
  Journal of Humanistic Mathematics 10(2), 2020 — open access

These are personal research copies; check each source before republishing.
