function getNeighboringPixels(canvas, point, radius = 1) {
    const ctx = canvas.getContext('2d');
    const neighbors = [];
    const {x,y}=point;
    // Loop through the specified radius
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const nx = x + dx;
            const ny = y + dy;

            // Ensure the coordinates are within the canvas bounds
            if (nx >= 0 && ny >= 0 && nx < canvas.width && ny < canvas.height) {
                const pixelData = getPixelData(canvas, nx, ny);
                if (pixelData) {
                    neighbors.push({ x: nx, y: ny, ...pixelData });
                }
            }
        }
    }

    return neighbors;
}

// Reuse the previously defined getPixelData function
function getPixelData(canvas, x, y) {
    const ctx = canvas.getContext('2d');
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        console.error('Coordinates are out of canvas bounds.');
        return null;
    }
    const imageData = ctx.getImageData(x, y, 1, 1);
    const data = imageData.data;
    return {
        r: data[0],
        g: data[1],
        b: data[2],
        a: data[3]
    };
}

function getEdges(canvas,startPoint){

    return getNeighboringPixels(canvas,startPoint,50).filter(e=>getNeighboringPixels(canvas,e).fill(p=>p.a<=0).length>0);
}