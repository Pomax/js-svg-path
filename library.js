(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.PathConverter = factory());
}(this, (function () { 'use strict';

/**
 * Trivial coordinate class
 */
class Coord {
	constructor(x,y) {
		if (isNaN(x) || isNaN(y)) {
			throw new Error(`NaN encountered: ${x}/${y}`);
		}
		this.x=x;
		this.y=y;
	}
}

/**
 * Simple point curve Point class
 *   - plain points only have "main" set
 *   - bezier points have "left" and "right" set as control points
 * A bezier curve from p1 to p2 will consist of {p1, p1.right, p2.left, p2}
 */
class Point {
	constructor(x, y) { this.main = new Coord(x,y); this.left = null; this.right = null; this.isplain = true; }
	setLeft(x, y) { this.isplain=false; this.left = new Coord(x,y); }
	setRight(x, y) { this.isplain=false; this.right = new Coord(x,y); }
	isPlain() { return this.isplain; }
	getPoint() { return this.main; }
	getLeft() { return this.isplain ? this.main : this.left==null? this.main : this.left; }
	getRight() { return this.isplain ? this.main : this.right==null? this.main : this.right; }
}

/**
 * A shape defined in terms of curve points
 */
class PointCurveShape {
	constructor() { this.points = []; }
	current() { return this.points.slice(-1)[0]; }
	addPoint(x, y) { this.points.push(new Point(x,y)); }
	setLeft(x, y) { this.current().setLeft(x,y); }
	setRight(x, y) { this.current().setRight(x,y); }

	/**
	 * Convert the point curve to an SVG path string
	 * (bidirectional conversion? You better believe it).
	 * This code is very similar to the draw method,
	 * since it effectively does the same thing.
	 */
	toSVG() {
		// first vertex
		let points = this.points;
		let first = points[0].getPoint();
		let x = first.x;
		let y = first.y;
		let svg = "M" + x + (y<0? y : " " + y);
		// rest of the shape
		for(let p=1; p<points.length; p++) {
			// since we have to work with point pairs, get "prev" and "current"
			let prev = points[p-1];
			let curr = points[p];
			// if both are plain, LineTo. Otherwise, Cubic bezier.
			if(curr.isPlain() && prev.isPlain()) {
				let lx = curr.getPoint().x; let ly = curr.getPoint().y;
				svg += "L" + lx + (ly<0? ly : " " + ly); }
			else {
				let cx1 = prev.getRight().x; let cy1 = prev.getRight().y;
				let cx2 = curr.getLeft().x;  let cy2 = curr.getLeft().y;
				let x2 = curr.getPoint().x;  let y2 = curr.getPoint().y;
				svg += "C" + cx1 + (cy1<0? cy1 : " " + cy1) +
						(cx2<0? cx2 : " " + cx2) + (cy2<0? cy2 : " " + cy2) +
						(x2<0? x2 : " " + x2) + (y2<0? y2 : " " + y2); }}
		return svg + "Z"; }
}

const MINX = 0;
const MINY = 1;
const MAXX = 2;
const MAXY = 3;

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

class SVGParser {
	constructor(receiver) {
		this.receiver = receiver;
	}

	getReceiver() { return receiver; }

	parse(path, xoffset, yoffset) {
		xoffset = xoffset || 0;
		yoffset = yoffset || 0;

		// normalize the path
		path = path.replace(/\s*([mlvhqczMLVHQCZ])\s*/g,"\n$1 ")
				.replace(/,/g," ")
				.replace(/-/g," -")
				.replace(/ +/g," ");

		// step one: split the path in individual pathing instructions
		var strings = path.split("\n");
		let x = xoffset;
		let y = yoffset;

		// step two: process each instruction
		let receiver = this.receiver;
		receiver.startGroup();
		for(let s=1; s<strings.length; s++)
		{
			let instruction = strings[s].trim();
			let op = instruction.substring(0,1);
			let terms = (instruction.length>1 ? instruction.substring(2).trim().split(" ") : []);

			// move instruction
			if(op === "m" || op === "M") {
				if(op === "m") { x += parseFloat(terms[0]); y += parseFloat(terms[1]); }
				else if(op === "M") { x = parseFloat(terms[0]) + xoffset; y = parseFloat(terms[1]) + yoffset; }
				// add a point only if the next operation is not another move operation, or a close operation
				if(s<strings.length-1) {
					let nextstring = strings[s+1].trim();
					let nextop = nextstring.substring(0,1);
					if (!(nextop === "m" || nextop === "M" || nextop === "z" || nextop === "Z")) {
						if(s>1) { receiver.closeShape(); }
						receiver.startShape();
						receiver.addPoint(x, y); }}}

			// line instructions
			else if(op === "l" || op === "L") {
				// this operation take a series of [x2 y2] coordinates
				for(let t=0; t<terms.length; t+=2) {
					if(op === "l") { x += parseFloat(terms[t+0]); y += parseFloat(terms[t+1]); }
					else if(op === "L" ){ x = parseFloat(terms[t+0]) + xoffset; y = parseFloat(terms[t+1]) + yoffset; }
					receiver.addPoint(x, y); }}

			// vertical line shorthand
			else if(op === "v" || op === "V") {
				terms.forEach( y2 => {
					if(op === "v") { y += parseFloat(y2); }
					else if(op === "V" ){ y = parseFloat(y2) + yoffset; }
					receiver.addPoint(x, y);
				});}


			// horizontal line shorthand
			else if(op === "h" || op === "H") {
				terms.forEach( x2 => {
					if(op === "h") { x += parseFloat(x2); }
					else if(op === "H" ){ x = parseFloat(x2) + yoffset; }
					receiver.addPoint(x, y);
				});}


			// quadratic curve instruction
			else if(op === "q" || op === "Q") {
				// this operation takes a series of [cx cy x2 y2] coordinates
				for(let q = 0; q<terms.length; q+=4) {
					let cx=0; let cy=0;
					if(op === "q") { cx = x + parseFloat(terms[q]); cy = y + parseFloat(terms[q+1]); }
					else if(op === "Q") { cx = parseFloat(terms[q]) + xoffset; cy = parseFloat(terms[q+1]) + yoffset; }

					// processing has no quadratic curves, so we have to derive the cubic control points
					let cx1 = (x + cx + cx)/3;
					let cy1 = (y + cy + cy)/3;

					// make start point bezier if it differs from the control point
					if(x !=cx1 || y !=cy1) {
						receiver.setRightControl(cx1, cy1);
					}

					// NOTE: the relative quadratic instruction does not count control points as "real"
					// points, so the curve's on-curve coordinate is relative to the last on-curve one.
					if(op === "q") { x += parseFloat(terms[q+2]); y += parseFloat(terms[q+3]); }
					else if(op === "Q") { x = parseFloat(terms[q+2]) + xoffset; y = parseFloat(terms[q+3]) + yoffset; }

					// derive cubic control point 2
					let cx2 = (x + cx + cx)/3;
					let cy2 = (y + cy + cy)/3;

					receiver.addPoint(x, y);
					if(x!=cx2 || y !=cy2) { receiver.setLeftControl(cx2, cy2); }}}

			// cubic curve instruction
			else if(op === "c" || op === "C") {
				// this operation takes a series of [cx1 cy1 cx2 cy2 x2 y2] coordinates
				for(let c = 0; c<terms.length; c+=6) {

					// get first control point
					let cx1=0; let cy1=0;
					if(op === "c") { cx1 = x + parseFloat(terms[c]); cy1 = y + parseFloat(terms[c+1]); }
					else if(op === "C") { cx1 = parseFloat(terms[c]) + xoffset; cy1 = parseFloat(terms[c+1]) + yoffset; }

					// make start point bezier if it differs from the control point
					if(x!=cx1 || y !=cy1) {
						receiver.setRightControl(cx1, cy1);
					}

					// get second control point. NOTE: this is not relative to the first control point, but
					// relative to the on-curve start coordinate
					let cx2=0; let cy2=0;
					if(op === "c") { cx2 = x + parseFloat(terms[c+2]); cy2 = y + parseFloat(terms[c+3]); }
					else if(op === "C") { cx2 = parseFloat(terms[c+2]) + xoffset; cy2 = parseFloat(terms[c+3]) + yoffset; }

					// NOTE: the relative cubic instruction does not count control points as "real"
					// points, so the curve's on-curve coordinate is relative to the last on-curve one.
					if(op === "c") { x += parseFloat(terms[c+4]); y += parseFloat(terms[c+5]); }
					else if(op === "C") { x = parseFloat(terms[c+4]) + xoffset; y = parseFloat(terms[c+5]) + yoffset; }

					// add end point, make bezier if the on-curve and control point differ
					receiver.addPoint(x, y);
					if(x!=cx2 || y !=cy2) { receiver.setLeftControl(cx2,cy2); }}}

			// close shape instruction
			else if(op === "z" || op === "Z") { receiver.closeGroup(); }
		}
	}
}

const API = { SVGParser, Outline, PointCurveShape, parse: function(pathString) {
  	const outline = new API.Outline();
    const parser = new API.SVGParser(outline);
    parser.parse(pathString);
    return outline;
}};

return API;

})));
