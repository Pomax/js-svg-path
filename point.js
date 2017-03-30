import Coord from "./coord.js";

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

export default Point;
