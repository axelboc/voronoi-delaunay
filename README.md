Voronoi - Delaunay
==================

This JavaScript program positions a set of vertices (the *seeds*) randomly on an HTML5 canvas (the *plane*), then computes and draws their [**Voronoi diagram**](http://en.wikipedia.org/wiki/Voronoi_diagram).

The script first computes the [Delaunay triangulation](http://en.wikipedia.org/wiki/Delaunay_triangulation) of the vertices using the [Bowyer-Watson algorithm](http://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm). It then deduces the Voronoi diagram from the triangulation. The Bowyer-Watson algorithm is an insertion algorithm; it builds the Delaunay triangulation one vertex at a time.

This program is written in vanilla ES2015 JavaScript. It has no dependencies and runs locally in any modern browser.


Demo
----

Visit http://bit.ly/voronoi-delaunay-v21 - a new diagram should be generated automatically. Then, use the controls in the sidebar to:

- generate a new diagram,
- change the size of the diagram (i.e. the number of seeds),
- show or hide parts of the diagram (the seeds, the Delaunay triangulation, and the Voronoi diagram itself), or
- switch to *manual* mode.

In *manual* mode, the construction of the Delaunay triangulation is performed step by step. Use the *Next* button to show the next step, and the *Reset* button to start the construction again with the same seeds.

The state of the sidebar controls (or more precisely, the `settings` array in `app.js`) is persited to `localStorage`&mdash;if supported&mdash;and restored on page load. In IE11, this feature doesn't work when `index.htm` is opened from the file system.

