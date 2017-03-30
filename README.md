# js-svg-path

A parser that turns SVG path strings into a JS object you can mess with. Basically if you want to mess around with `svg` paths, and you want the convenience of "points" rather than "a string" where it comes to the `d` attribute, this library's got you covered.

## Installation

`npm install js-svg-path`, with optional `--save` or `--save-dev` if you need it saved in your package.json file.

## Using this thing

Use in Node.js as:

```
var library = require('js-svg-path');
```

Or use in the browser as:
```
<!-- this gives you window.PathConverter to work with after loading: -->
<script src="js-svg-path/library.js"></script>
```

Easy-peasy.

## The API(s)

There are three objects, and one utility function, exposed in this API.

### library.parse(SVGPathString)

You'll want this 99.99% of the time. This function ingests an SVG path string, and returns an `Outline` object for you to do with as you please.

### library.Outline

The `Outline` object represents a full SVG path outline (which may consist of nested subpats). It is constructed as `new library.Outline()` and has the following API:

- `getShapes()` - Gets all shapes defined in the path that the outline was built on.
- `getShape(idx)` - This gets a specific subpath in an outline. For obvious reasons, `idx` starts at 0.
- `toSVG()` - Serialize this outline to an SVG path. This will yield a path with *absolute* coordinates, but is for all intents and purposes idempotent: pushing in a path should yield an identically rendered path through `.toSVG()`

and the following API that most of the time you shouldn't care about but sometimes you will:

- `startGroup()` - on an empty outline, this essentially "starts recording an outline".
-	`startShape()` - this marks the start of a new (sub)path in the outline.
- `addPoint(x,y)` - this adds a vertex to the outline, at absolute coordinate (x/y).
- `setLeftControl(x,y)` - this modifies the current point such that it has a left-side control point.
- `setRightControl(x,y)` - this modifies the current point such that it has a right-side control point.
- `closeShape()` - this signals that we are done chronicalling the current (sub)path.
-	`closeGroup()` - this signals that we are done recording this outline entirely.

### library.PointCurveShape

This is an internal structure, but why not expose it to you? Each (sub)path in an outline is a PointCurveShape that is constructed with `new library.PointCurveShap()` and has the following API:

- `current()` - get the current point. This is relevant while an outline is being built.
- `addPoint(x,y)` - add a vertex to this shape.
- `setLeft(x,y)` - set the left control point for this vertex to (x/y).
- `setRight(x,y)` - set the right control point for this vertex to (x/y).
- `toSVG()` - serializes this "shape" (i.e. path) to SVG form.

### library.SVGParser

This is the main factory object and has very little in the way of its own API:

- `new library.SVGParser(outline)` - the SVGParser constructor takes an `Outline` object as constructor argument, which will be used to record parsing results.
- `getReceiver()` - returns the outline recorder passed into the constructor.
- `parse(path, [xoffset, yoffset])` - parses an SVG path, with an optional (xoffset/yoffset) offset to translate the entire path uniformly.

## An example:

Let's ingest an SVG's path, and then generate the SVG code that shows you where all the vectices and control points are:

```
const path1 = find("svg path")[0];
const path2 = find("svg path")[1];
const d = path1.get("d");

var outline = new Receiver();
const parser = new SVGParser(outline);
parser.parse(d);

const vertices = [`<path d="${d}"/>`];
outline.getShapes().forEach(shape => {
  shape.points.forEach(p => {
    let m = p.main, l = p.left, r = p.right;
    if (l) {
      vertices.push(`<path d="M${l.x} ${l.y} L${m.x} ${m.y}" stroke="red"/>`)
      vertices.push(`<circle cx="${l.x}" cy="${l.y}" r="1" fill="red" stroke="none"/>`)
    }
    if (r) {
      vertices.push(`<path d="M${r.x} ${r.y} L${m.x} ${m.y}" stroke="green"/>`)
      vertices.push(`<circle cx="${r.x}" cy="${r.y}" r="1" fill="green" stroke="none"/>`)
    }
    vertices.push(`<circle cx="${m.x}" cy="${m.y}" r="1" fill="blue" stroke="none"/>`)
  });
});

const svg2 = find("svg g")[1];
svg2.innerHTML = vertices.join('\n');
```

## Live demo?

Yeah alright: https://pomax.github.io/js-svg-path, and obviously to see *why* it works, view-source that.
