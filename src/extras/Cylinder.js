import {Geometry} from '../core/Geometry.js';
import {Vec3} from '../math/Vec3.js';

export class Cylinder extends Geometry
{
    constructor(gl, {
        radius = 0.5, 
        height = 1,
        radialSegments = 16, 
        heightSegments = 1,
        attributes = {},
    } = {}) {
        const rSegs = radialSegments;
        const hSegs = heightSegments;
        
        const num = (radialSegments + 1) * (heightSegments + 1) + 2; //2 centres: bottom and top cap
        const numTris = radialSegments * (2 + heightSegments * 2); //1 tri top, 1 tri bottom, 2 tris side face.
        const numIndices = numTris * 3; 

        const position = new Float32Array(num * 3);
        const normal = new Float32Array(num * 3);
        const uv = new Float32Array(num * 2);
        const index = (num > 65536) ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

        //attributes
        let i = 0;
        let x, y, z;
        let n = new Vec3();
        
        //bot cap centre
        x = 0;
        y = (0 - 0.5) * height;
        z = 0;
        
        position[i * 3 + 0] = x;
        position[i * 3 + 1] = y;
        position[i * 3 + 2] = z;
        
        n.set(x, y, z).normalize();
        normal[i * 3]     = n.x;
        normal[i * 3 + 1] = n.y;
        normal[i * 3 + 2] = n.z;
        
        uv[i * 2]     = 0;
        uv[i * 2 + 1] = 1;
        
        let bci = i;
        i++;
        
        //top cap centre
        x = 0;
        y = (1 - 0.5) * height;
        z = 0;
        
        position[i * 3 + 0] = x;
        position[i * 3 + 1] = y;
        position[i * 3 + 2] = z;
        
        n.set(x, y, z).normalize();
        normal[i * 3]     = n.x;
        normal[i * 3 + 1] = n.y;
        normal[i * 3 + 2] = n.z;
        
        uv[i * 2]     = 0;
        uv[i * 2 + 1] = 0;
        
        let tci = i;
        i++;
        
        for (var ir = 0; ir < rSegs + 1; ir++) { //var is faster than let in for loops.
            let u = ir / rSegs;
            
            for (var iy = 0; iy < hSegs + 1; iy++) { //+1 to get top cap vertices
                let v = iy / hSegs;
                
                x = Math.cos(u * Math.PI * 2) * radius;
                y = (v - 0.5) * height;
                z = Math.sin(u * Math.PI * 2) * radius;
                
                position[i * 3 + 0] = x; 
                position[i * 3 + 1] = y; 
                position[i * 3 + 2] = z;
                
                n.set(x, y, z).normalize();
                normal[i * 3]     = n.x;
                normal[i * 3 + 1] = n.y;
                normal[i * 3 + 2] = n.z;
                
                uv[i * 2]     = u;
                uv[i * 2 + 1] = 1 - v;
                
                i++;
            }
        }
        
        //indices
        let ii = 0;
        let hSegsAll = hSegs+1;
        for (var ir = 0; ir < rSegs; ir++) { //var is faster than let in for loops.
            let irn = ir + 1;
            //irn = irn < rSegs ? irn : 0; //wrap
            
            //all "2 +" are so that we start *after* bci & tci.
            
            //bot (1 tri: 0)
            index[ii * 3 + 0] = bci;
            index[ii * 3 + 1] = 2 + ir  * hSegsAll; //bot of this radial segment
            index[ii * 3 + 2] = 2 + irn * hSegsAll; //bot of next radial segment
            ii++;
            
            //sides (2 tris each: 1..n-1)
            for (var iy = 0; iy < hSegs; iy++) {
                index[ii * 3 + 0] = 2 + ir  * hSegsAll + (iy + 0);
                index[ii * 3 + 1] = 2 + ir  * hSegsAll + (iy + 1);
                index[ii * 3 + 2] = 2 + irn * hSegsAll + (iy + 0);
                ii++;
                index[ii * 3 + 0] = 2 + irn * hSegsAll + (iy + 0);
                index[ii * 3 + 1] = 2 + ir  * hSegsAll + (iy + 1);
                index[ii * 3 + 2] = 2 + irn * hSegsAll + (iy + 1);
                ii++;
            }
            //top (1 tri: n)
            index[ii * 3 + 0] = 2 + irn * hSegsAll + hSegs; //bot of next radial segment
            index[ii * 3 + 1] = 2 + ir  * hSegsAll + hSegs; //bot of this radial segment
            index[ii * 3 + 2] = tci; //opposite winding order vs.  bot.
            ii++;
        }

        Object.assign(attributes, {
            position: {size: 3, data: position},
            normal: {size: 3, data: normal},
            uv: {size: 2, data: uv},
            index: {data: index},
        }); 

        super(gl, attributes);
    }
}