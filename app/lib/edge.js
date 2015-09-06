
let count = 0;

/**
 * An edge between two vertices.
 * @param {Shop} v1
 * @param {Shop} v2
 */
export default class Edge {
	
	constructor(v1, v2) {
		this.id = count;
		count += 1;
		
		this.v1 = v1;
		this.v2 = v2;
	}

	/**
	 * Draw the edge.
	 * @param {CanvasRenderingContext2D} ctx - the context in which to draw the edge
	 */
	draw(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.v1.x, this.v1.y);
		ctx.lineTo(this.v2.x, this.v2.y);
		ctx.stroke();
	}
	
}
