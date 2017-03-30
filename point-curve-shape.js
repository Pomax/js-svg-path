import Point from "./point.js";

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

export default PointCurveShape;
