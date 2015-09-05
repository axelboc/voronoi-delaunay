
let count = 0;

/**
 * A vertex defined by a pair of coordinates (x, y).
 * @param {Integer} x
 * @param {Integer} y
 */
export default class Vertex {
	
	constructor(x, y) {
		this.id = count;
		count += 1;
		
		this.x = x;
		this.y = y;
	}

	draw(ctx, radius) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, radius, 0, Math.PI * 2); 
		ctx.closePath();
		ctx.fill();
	}
	
}
