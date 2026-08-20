# temari

An interactive 3D viewer for the geometry of Japanese temari (手まり) thread
balls: traditional sphere divisions and stitch patterns, rendered in the
browser with orbit and zoom. The long-term aim is a planning tool for real
temari; today it is a viewer for the pattern algorithms.

```bash
npm install
npm run dev     # open the viewer
npm test        # geometry + stitch test suite
```

## How it works

Every standard temari division is the arrangement of great circles given by
the mirror planes of a spherical reflection group:

| Division | Marking circles | Group | Centres (mentai) |
|---|---|---|---|
| Simple *n* | n/2 meridians + obi | D*n*h | 2 poles + n equator points |
| Combination 8 | 9 | Oh | 6 squares, 8 triangles, 12 diamonds |
| Combination 10 | 15 | Ih | 12 pentagons, 20 triangles, 30 diamonds |

TemariKai's hand-marking rule for the C10 — centres "1/6 of the circumference
plus 1/100" apart — is the icosahedron vertex angle 63.435° in workshop units.
The tamentai multiface markings (32, 92, 122, 272, 362) are geodesic spheres:
both published formulas reduce to 10T + 2.

`src/core` computes these as cell complexes (vertices/arcs/faces) from the
plane normals alone; the published counts above run as unit-test oracles.
`src/stitches` generates thread paths — kiku herringbone (uwagake chidori
kagari), hoshi stars with optional twist, obi bands, matsuba pine needles,
tsumu spindles — as pure functions of a division, so one motif replicates to
every symmetric centre. Each round carries a `layer` that the renderer lifts
radially, so later rounds sit over earlier ones the way real thread does.
`src/render` draws it all with three.js `LineSegments2` fat lines.

## Presets

Four designs reproduced from the NanaAkua photographs in `reference/`
(her grandmother's balls, via the collected Colossal/artbooom articles):
shion (red C10 chrysanthemum), uzumaki (blue whirlpool hexagon field),
homura (embers on black), botan (sunrise peony with obi).

## Roadmap

- thread-realistic rendering (tubes, fabric mari) on the existing layer system
- planning-tool features: save/load designs, palette editing, printable
  2D marking guides with measurements
- more stitches: uwagake variations, interlocked bands, renzoku paths

## References

- [TemariKai](https://www.temarikai.com) — division and stitch documentation
- Giuffre & Stemkoski, *Virtual Temari*, J. Humanistic Mathematics 10(2), 2020
- NanaAkua's [Flickr album](https://flickr.com/photos/31012828@N04/albums/72157617114284128/)
  — photographs © NanaAkua, [CC BY-NC-ND 2.0](https://creativecommons.org/licenses/by-nc-nd/2.0/);
  see [reference/README.md](reference/README.md) for attribution details
