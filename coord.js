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

export default Coord;
