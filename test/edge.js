
import {expect} from 'chai';
import Vertex from '../app/lib/vertex';
import Edge from '../app/lib/edge';


describe('Edge', function () {

	describe('constructor', function () {

		it('should accept two vertices', function () {
			const v1 = new Vertex(0, 0), v2 = new Vertex(1, 1);
			const edge = new Edge(v1, v2);

			expect(edge.v1).to.equal(v1);
			expect(edge.v2).to.equal(v2);
		});

	});

});
