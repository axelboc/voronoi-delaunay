Voronoi - Delaunay
==================

This JavaScript program positions a set of vertices (or shops) randomly on an HTML5 canvas (the city), then computes and draws their [**Voronoi diagram**](http://en.wikipedia.org/wiki/Voronoi_diagram).

The script first computes the [Delaunay triangulation](http://en.wikipedia.org/wiki/Delaunay_triangulation) of the vertices using the [Bowyer-Watson algorithm](http://en.wikipedia.org/wiki/Bowyer%E2%80%93Watson_algorithm), then deduces the Voronoi diagram from the triangulation.
The Bowyer-Watson algorithm is an insertion algorithm that builds the Delaunay triangulation one vertex at a time.

This program does not use any JavaScript library.


Latest Fixes
------------

**2013/03/09**
- Improved JS implementation of Bowyer-Watson algorithm.
- Fixed bugs with creating vertical edges.
- Prevented creation of two source vertices at the same position.
- Implemented grid spacing setting (see below).


Usage
-----

The script is run by simply opening `index.htm` in any recent browser that supports HTML5 Canvas. 

The object `VoronoiSettings` in file `js/voronoi.js` contains some basic configuration options:
- the number of source vertices, and
- the grid spacing, in pixels.

The grid spacing setting is used to position the source vertices in a grid: a value of 10 means that their coordinates will be multiples of 10.
Note that, depending on the number of vertices, choosing a spacing that is too large may result in the script running a infinite loop, as it will not find enough valid positions to place the vertices.

The script also implements a mode that shows the construction of the Delaunay triangulation step by step.

In step-by-step mode, 3 canvases are used, that show:
1. the triangles that are about to be deleted;
2. the outline of the cavity formed by the deleted triangles; and
3. the triangles that were just added to the triangulation.


Remaining Work
--------------

- Improve algorithm for deleting initial Delaunay vertices.
- Improve algorithm for building Voronoi edges from Delaunay triangulation.
- Prevent infinite loop when minimum spacing is too high for chosen number of source vertices.
- Add more features (new settings for graphics parameters and canvas size; let user insert vertices, draw boundaries of diagram, move vertices, etc.)