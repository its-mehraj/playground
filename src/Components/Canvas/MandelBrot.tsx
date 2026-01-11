import './MandelBrot.less';

import * as React from 'react';
// import { MandelbrotCanvas2 } from './Utils';
import { MandelbrotCanvas } from './Utils';

const blockClass = 'mandelbrot';

export const MandelBrot = () => {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    let mandelbrot: MandelbrotCanvas | null = null;
    if (canvas != null) {
      mandelbrot = new MandelbrotCanvas(canvas);
      // new MandelbrotCanvas2(canvas);
    }

    return () => {
      mandelbrot?.dispose();
    };
  }, [canvas]);

  return <canvas className={blockClass} ref={setCanvas} />;
};
