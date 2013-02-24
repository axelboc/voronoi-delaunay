Voronoi - Delaunay
================

This JavaScript program positions a set of vertices (or shops) randomly on an HTML5 canvas (the city), then computes and draws their [**Voronoi diagram**](http://en.wikipedia.org/wiki/Voronoi_diagram).

The script first computes the [Delaunay triangulation](http://en.wikipedia.org/wiki/Delaunay_triangulation) of the vertices using the [Bowyer-Watson algorithm](http://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm), then deduces the Voronoi diagram from the triangulation.
The Bowyer-Watson algorithm is an insertion algorithm taht builds the Delaunay triangulation one vertex at a time.

This program does not use any JavaScript library. 


Usage
-----

The script is run by simply opening `index.htm` in any recent browser that supports HTML5 Canvas. 

The object `VoronoiSettings` in file `js/voronoi.js` contains some basic configuration options, especially the number of source vertices to the Voronoi diagram.
The script also implements a mode that shows the construction of the Delaunay triangulation step by step.

In step-by-step mode, 3 canvases are used, that show:
1. the triangles that are about to be deleted;
2. the outline of the cavity formed by the deleted triangles; and
3. the triangles that were just added to the triangulation.

