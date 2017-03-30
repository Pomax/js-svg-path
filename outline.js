const MINX = 0;
const MINY = 1;
const MAXX = 2;
const MAXY = 3;

import PointCurveShape from "./point-curve-shape.js";

class Outline {
	constructor() {
		this.curveshapes = [];
		this.current = new PointCurveShape();
		this.bounds = false;
	}

	getShapes() { return this.curveshapes; }

	getShape(index) { return this.curveshapes[index]; }

	/**
	 * Convert the point curve to an SVG path string (bidirectional conversion?
	 * You better believe it).
	 */
	toSVG() {
		let svg = "";
		this.curveshapes.forEach(s => svg += s.toSVG());
		return svg;
	}

	// start a shape group
	startGroup() { this.curveshapes = []; }

	// start a new shape in the group
	startShape(){ this.current = new PointCurveShape(); }

	// add an on-screen point
	addPoint(x, y){
		this.current.addPoint(x,y);
		var bounds = this.bounds;
		if (!bounds) { bounds = this.bounds = [x,y,x,y]; }
		if (x<bounds[MINX]) { bounds[MINX] = x; }
		if (x>bounds[MAXX]) { bounds[MAXX] = x; }
		if (y<bounds[MINY]) { bounds[MINY] = y; }
		if (y>bounds[MAXY]) { bounds[MAXY] = y; }}

	// set the x/y coordinates for the left/right control points
	setLeftControl(x, y){
		this.current.setLeft(x,y); }

	setRightControl(x, y){
		this.current.setRight(x,y); }

	// close the current shape
	closeShape() {
		this.curveshapes.push(this.current);
		this.current=null; }

	// close the group of shapes.
	closeGroup(){
		this.curveshapes.push(this.current);
		this.current=null; }
}

export default Outline;
