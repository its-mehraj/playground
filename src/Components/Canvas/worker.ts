type Work = {
  tile: { x: number; y: number; width: number; height: number };
  x0: number;
  y0: number;
  perPixel: number;
  maxIterations: number;
};

self.onmessage = (message: MessageEvent<Work>) => {
  const { tile, x0, y0, perPixel, maxIterations } = message.data;
  const { height, width } = tile;

  // create ImageData and a view to look at the ImageData
  const imageData = new ImageData(width, height);
  const iterations = new Uint32Array(imageData.data.buffer);

  let index = 0,
    max = 0,
    min = maxIterations;

  // 2 outer loops iterate over each column of each row
  // the inner loop does the mandelbrot iteration
  for (let row = 0, y = y0; row < height; row++, y += perPixel) {
    for (let column = 0, x = x0; column < width; column++, x += perPixel) {
      let n: number;
      let r = x,
        i = y0;
      for (n = 0; n < maxIterations; n++) {
        const rr = r * r,
          ii = i * i;
        if (rr + ii > 3) {
          break;
        }
        i = 2 * r * i + y0;
        r = rr - ii + x;
      }
      iterations[index++] = n;
      // iterations[index + 1] = 22; // 0x00ff00; // green channel
      // iterations[index + 2] = 123; // blue channel
      // index++; // skip alpha channel
      if (n > max) max = n;
      if (n < min) min = n;
    }
  }

  postMessage({ tile, imageData, min, max });
};
