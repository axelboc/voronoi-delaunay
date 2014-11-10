Voronoi - Delaunay
==================

This JavaScript program positions a set of vertices (the *shops*) randomly on an HTML5 canvas (the *city*), then computes and draws their [**Voronoi diagram**](http://en.wikipedia.org/wiki/Voronoi_diagram).

The script first computes the [Delaunay triangulation](http://en.wikipedia.org/wiki/Delaunay_triangulation) of the vertices using the [Bowyer-Watson algorithm](http://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm). It then deduces the Voronoi diagram from the triangulation. The Bowyer-Watson algorithm is an insertion algorithm; it builds the Delaunay triangulation one vertex at a time.

This program is written in vanilla JavaScript and has no dependencies.


Usage
-----

Start by simply opening `index.htm` in any recent browser with [HTML5 Canvas support](http://caniuse.com/#feat=canvas).

The object `VoronoiSettings` in file `js/voronoi.js` contains some basic configuration options:
- the number of source vertices, and
- the grid spacing, in pixels.

The grid spacing setting is used to position the source vertices in a grid: a value of 10 means that their coordinates will be multiples of 10.
Note that, depending on the number of vertices, choosing a spacing that is too large may result in the script running an infinite loop, as it will not find enough valid positions to place the vertices.

The script also implements a mode that shows the construction of the Delaunay triangulation step by step.
In this mode, 3 canvases are used, that show:
1. the triangles that are about to be deleted;
2. the perimeter of the cavity formed by the deleted triangles; and
3. the triangles that were just added to the triangulation.
