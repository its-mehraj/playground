type Work = {
  tile: Tile;
  x0: number;
  y0: number;
  perPixel: number;
  maxIterations: number;
};

type Result = {
  imageData: ImageData;
  min: number;
  max: number;
  tile: Tile;
};

export class Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // this generator yields all tiles in a grid
  static *tiles(
    width: number,
    height: number,
    numRows: number,
    numCols: number,
  ) {
    const columnWidth = Math.ceil(width / numCols);
    const rowHeight = Math.ceil(height / numRows);

    for (let row = 0; row < numRows; row++) {
      const tileHeight =
        row < numRows - 1 ? rowHeight : height - rowHeight * (numRows - 1);

      for (let col = 0; col < numCols; col++) {
        const tileWidth =
          col < numCols - 1 ? columnWidth : width - columnWidth * (numCols - 1);
        yield new Tile(
          col * columnWidth,
          row * rowHeight,
          tileWidth,
          tileHeight,
        );
      }
    }
  }
}

export class WorkerPool {
  idleWorkers: Array<{ worker: Worker; id: string }>;
  workQueue: Array<
    [
      Work,
      ((_value: Result | PromiseLike<Result>) => void) | undefined,
      ((_error: ErrorEvent | null) => void) | undefined,
    ]
  >;
  workerMap: Map<
    string,
    [
      ((_value: Result | PromiseLike<Result>) => void) | undefined,
      ((_error: ErrorEvent | null) => void) | undefined,
    ]
  >;
  constructor(numWorkers: number, workerSource: string) {
    this.idleWorkers = [];
    this.workQueue = [];
    this.workerMap = new Map();
    // const worker = new Worker(new URL('./test.ts', import.meta.url), {
    //   type: 'module',
    // });
    // worker.onmessage = (message) => {
    //   console.log('Message from worker: ', { data: message.data });
    // };
    // worker.postMessage({ data: 'satdsdas' });
    for (let i = 0; i < numWorkers; i++) {
      // const worker = new Worker(workerSource, { type: 'module' });
      const workerUrl = new URL(workerSource, import.meta.url);
      console.log({ workerUrl });

      // web worker must be loaded from a server NOT from local file system!!!
      const worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module', // keep if your worker uses ESM imports
      });
      const workerId = 'worker' + i.toString();
      worker.onmessage = (message) => {
        this._workerDone({ worker, id: workerId }, null, message.data);
        // console.log('message from worker: ', { data: message.data });
      };

      worker.onerror = (error) => {
        this._workerDone({ worker, id: workerId }, error, null);
      };

      this.idleWorkers[i] = { worker, id: workerId };
    }

    // window.setInterval(() => {
    //   this.idleWorkers.forEach((worker, idx) => {
    //     worker?.postMessage({ data: 'this is some data' + idx });
    //   });
    // }, 1000);
  }
  _workerDone(
    worker: { worker: Worker; id: string },
    error: ErrorEvent | null,
    response: Result | null,
  ) {
    const workerName = worker.id;
    const w = this.workerMap.get(workerName);
    const resolver = w?.[0];
    const rejector = w?.[1];

    this.workerMap.delete(workerName);
    console.log('Mehraj worker done: ', {
      worker: worker,
      w,
      error,
      response,
      workerName,
    });
    if (this.workQueue.length === 0) {
      console.log('Mehraj: idleWorkers push', { worker });
      this.idleWorkers.push(worker);
    } else {
      const w = this.workQueue.shift();
      const work = w?.[0];
      const resolver = w?.[1];
      const rejector = w?.[2];

      this.workerMap.set(worker.id, [resolver, rejector]);
      worker.worker.postMessage(work);
    }
    response != null ? resolver?.(response) : rejector?.(error);
  }

  addWork(work: Work): Promise<Result> {
    return new Promise((resolve, reject) => {
      if (this.idleWorkers.length > 0) {
        const worker = this.idleWorkers.pop();

        this.workerMap.set(worker?.id ?? '', [resolve, reject]);
        worker?.worker.postMessage(work);
      } else {
        this.workQueue.push([work, resolve, reject]);
      }
    });
  }
}

type PageStateArgs = {
  cx: number;
  cy: number;
  perPixel: number;
  maxIterations: number;
};

export class PageState {
  cx: number;
  cy: number;
  perPixel: number;
  maxIterations: number;

  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.perPixel = 0;
    this.maxIterations = 0;
  }

  static initialState() {
    const s = new PageState();
    s.cx = -0.5;
    s.cy = 0;
    s.perPixel = 3 / window.innerHeight;
    s.maxIterations = 1000;
    return s;
  }

  static fromURL(url: string) {
    const s = new PageState();
    const u = new URL(url);
    s.cx = parseFloat(u.searchParams.get('cx') ?? '');
    s.cy = parseFloat(u.searchParams.get('cy') ?? '');
    s.perPixel = parseFloat(u.searchParams.get('pp') ?? '');
    s.maxIterations = parseInt(u.searchParams.get('it') ?? '');

    return Number.isNaN(s.cx) ||
      Number.isNaN(s.cy) ||
      Number.isNaN(s.perPixel) ||
      Number.isNaN(s.maxIterations)
      ? null
      : s;
  }

  toURL() {
    const u = new URL(window.location.href);
    u.searchParams.set('cx', this.cx.toString());
    u.searchParams.set('cy', this.cy.toString());
    u.searchParams.set('pp', this.perPixel.toString());
    u.searchParams.set('it', this.maxIterations.toString());
    return u.href;
  }
}

// Some required constants
export const ROWS = 500;
export const COLS = 1;
export const NUMWORKERS = navigator.hardwareConcurrency || 2;

export class MandelbrotCanvas {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  workerPool: WorkerPool;
  tiles: Array<Tile> | null;
  pendingRender: null | Promise<void>;
  wantsReRender: boolean;
  resizeTimer: null | ReturnType<typeof setTimeout>;
  colorTable: null | Uint32Array;
  state: PageState;
  width: number;
  height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.workerPool = new WorkerPool(NUMWORKERS, './test.ts');
    // const workerSource = './test.ts';
    // const worker = new Worker(new URL('./test.ts', import.meta.url), {
    //   type: 'module',
    // });

    // worker.onmessage = (message) => {
    //   console.log('Message from worker: ', { data: message.data });
    // };

    // worker.onerror = (e) => {
    //   console.error('Worker error:', {
    //     message: e.message,
    //     filename: e.filename,
    //     lineno: e.lineno,
    //     colno: e.colno,
    //     error: e.error, // may include stack
    //   });
    // };

    // worker.onmessageerror = (e) => {
    //   console.error('Worker messageerror (failed to deserialize):', e);
    // };

    // // this.workerPool = new WorkerPool(NUMWORKERS, './mandelbrot.js');
    // window.setInterval(() => {
    //   console.log('Mehraj: Sending message to worker');
    //   worker.postMessage({ data: 'this is some data sadfas' });
    // }, 1000);

    this.tiles = null;
    this.pendingRender = null;

    this.wantsReRender = false;
    this.resizeTimer = null;
    this.colorTable = null;
    this.width = 0;
    this.height = 0;

    this.canvas.addEventListener('pointerdown', (e: PointerEvent) =>
      this.handlePointerEvent(e),
    );

    window.addEventListener('keydown', (e: KeyboardEvent) =>
      this.handleKeyEvent(e),
    );
    window.addEventListener('resize', (e: UIEvent) =>
      this.handleResizeEvent(e),
    );
    window.addEventListener('popstate', (e: PopStateEvent) =>
      this.setState(e.state, false),
    );

    this.state =
      PageState.fromURL(window.location.href) || PageState.initialState();

    history.replaceState(this.state, '', this.state.toURL());

    this.setSize();
    this.render();
  }

  handlePointerEvent(e: PointerEvent) {
    const x0 = e.clientX;
    const y0 = e.clientY;
    const t0 = Date.now();

    const pointerMoveHandler = (e: PointerEvent) => {
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      const dt = Date.now() - t0;

      if (dx > 10 || dy > 10 || dt > 500) {
        // this.canvas.style.transform = `translate(${dx}px, ${dy}px)`;
        this.setState((s) => {
          {
            s.cx += (dx / 10) * s.perPixel;
            s.cy += (dy / 10) * s.perPixel;
            s.perPixel;
          }
        });
      }
    };

    const pointerUpHandler = (e: PointerEvent) => {
      this.canvas.removeEventListener('pointermove', pointerMoveHandler);
      this.canvas.removeEventListener('pointerup', pointerUpHandler);

      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      const dt = Date.now() - t0;

      const { cx, cy, perPixel } = this.state;

      if (dx > 10 || dy > 10 || dt > 500) {
        this.setState({
          cx: cx - dx * perPixel,
          cy: cy - dy * perPixel,
          perPixel,
          maxIterations: this.state.maxIterations,
        });
      } else {
        const cdx = x0 - this.width;
        const cdy = y0 - this.height;
        // this.canvas.style.transform = `translate(${-cdx * 2}px, ${-cdy * 2}px) scale(2)`;

        this.setState((s) => {
          s.cx += cdx * s.perPixel;
          s.cy += cdy * s.perPixel;
          s.perPixel /= 2;
        });
      }
    };

    this.canvas.addEventListener('pointermove', pointerMoveHandler);
    this.canvas.addEventListener('pointerup', pointerUpHandler);
  }

  handleKeyEvent(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        this.setState(PageState.initialState());
        break;
      case '+':
        this.setState((s) => {
          s.maxIterations = Math.round(s.maxIterations * 1.5);
        });
        break;
      case '-':
        this.setState((s) => {
          s.maxIterations = Math.round(s.maxIterations / 1.5);
          if (s.maxIterations < 1) {
            s.maxIterations = 1;
          }
        });
        break;
      case 'o':
        this.setState((s) => {
          s.perPixel *= 1.2;
        });
        break;
      case 'i':
        this.setState((s) => {
          s.perPixel /= 1.2;
        });
        break;
      case 'ArrowUp':
        this.setState((s) => {
          s.cy -= (this.height / 20) * s.perPixel;
        });
        break;
      case 'ArrowDown':
        this.setState((s) => {
          s.cy += (this.height / 20) * s.perPixel;
        });
        break;
      case 'ArrowLeft':
        this.setState((s) => {
          s.cx -= (this.width / 20) * s.perPixel;
        });
        break;
      case 'ArrowRight':
        this.setState((s) => {
          s.cx += (this.width / 20) * s.perPixel;
        });
        break;
      default:
        break;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleResizeEvent(_e?: UIEvent) {
    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      this.setSize();
      this.render();
    }, 200);
  }

  setSize() {
    this.width = this.canvas.width = 500; //window.innerWidth;
    this.height = this.canvas.height = 500; //window.innerHeight;
    this.tiles = [...Tile.tiles(this.width, this.height, ROWS, COLS)];
    console.log('Mehraj: setSize', { tiles: this.tiles });
  }

  setState(f: ((_: PageState) => void) | PageStateArgs, save = true) {
    if (typeof f === 'function') {
      f(this.state);
    } else {
      this.state.cx = f.cx;
      this.state.cy = f.cy;
      this.state.perPixel = f.perPixel;
      this.state.maxIterations = f.maxIterations;
    }

    this.render();
    if (save) {
      history.pushState(this.state, '', this.state.toURL());
    }
  }

  render() {
    if (this.pendingRender) {
      this.wantsReRender = true;
      return;
    }

    const { cx, cy, perPixel, maxIterations } = this.state;
    const x0 = cx - perPixel * (this.width / 2);
    const y0 = cy - perPixel * (this.height / 2);

    const promises =
      this.tiles?.map((tile) => {
        return this.workerPool.addWork({
          tile: tile,
          x0: x0 + tile.x * perPixel,
          y0: y0 + tile.y * perPixel,
          perPixel,
          maxIterations,
        });
      }) ?? [];

    console.log('Mehraj: render', { context: this.context, promises });
    this.pendingRender = Promise.all(promises)
      .then((responsesProps) => {
        const responses = responsesProps;
        console.log('Mehraj asdasbd', { responses });

        // responses.forEach()
        let min = maxIterations,
          max = 0;
        for (const r of responses) {
          if (r.min < min) {
            min = r.min;
          }
          if (r.max > max) {
            max = r.max;
          }
        }

        if (!this.colorTable || this.colorTable.length !== maxIterations + 1) {
          this.colorTable = new Uint32Array(maxIterations + 1);
        }

        if (min === max) {
          if (min === maxIterations) {
            this.colorTable[min] = 0x2ffbe0;
          } else {
            this.colorTable[min] = 0;
          }
        } else {
          const maxlog = Math.log(max);
          for (let i = min; i <= max; i++) {
            this.colorTable[i] =
              Math.ceil((Math.log(1 + i - min) / maxlog) * 255) << 24;
          }
        }
        console.log('Mehraj: inside', { responses });

        for (const r of responses) {
          const itertations = new Uint32Array(r.imageData.data.buffer);
          for (let i = 0; i < itertations.length; i++) {
            itertations[i] = this.colorTable![itertations[i]];
          }
        }

        this.canvas.style.transform = '';
        for (const r of responses) {
          this.context.putImageData(r.imageData, r.tile.x, r.tile.y);
        }
      })
      .catch((reason) => {
        console.error('Error during render:', reason);
      })
      .finally(() => {
        this.pendingRender = null;
        if (this.wantsReRender) {
          this.wantsReRender = false;
          this.render();
        }
      });
  }

  dispose() {
    this.workerPool.idleWorkers.forEach(({ worker }) => worker.terminate());
  }
}

export class MandelbrotCanvas2 {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  // workerPool: WorkerPool;
  tiles: Array<Tile> | null;
  pendingRender: null | Promise<void>;
  wantsReRender: boolean;
  resizeTimer: null | ReturnType<typeof setTimeout>;
  colorTable: null | Uint32Array;
  state: PageState;
  width: number;
  height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;

    const worker = new Worker(new URL('./test.ts', import.meta.url), {
      type: 'module', // keep if your worker uses ESM imports
    });

    console.log('Worker: ', { worker: worker });

    worker.onmessage = (message) => {
      console.log('Message from worker: ', { data: message.data });
    };

    worker.onerror = (e) => {
      console.error('Worker error:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        error: e.error, // may include stack
      });
    };

    worker.onmessageerror = (e) => {
      console.error('Worker messageerror (failed to deserialize):', e);
    };

    // this.workerPool = new WorkerPool(NUMWORKERS, './mandelbrot.js');
    window.setInterval(() => {
      console.log('Mehraj: Sending message to worker');
      worker.postMessage({ data: 'this is some data sadfas' });
    }, 1000);
    this.tiles = null;
    this.pendingRender = null;

    this.wantsReRender = false;
    this.resizeTimer = null;
    this.colorTable = null;
    this.width = 0;
    this.height = 0;

    // this.canvas.addEventListener('pointerdown', (e: PointerEvent) =>
    //   this.handlePointerEvent(e),
    // );

    // window.addEventListener('keydown', (e: KeyboardEvent) =>
    //   this.handleKeyEvent(e),
    // );
    // window.addEventListener('resize', (e: UIEvent) =>
    //   this.handleResizeEvent(e),
    // );
    // window.addEventListener('popstate', (e: PopStateEvent) =>
    //   this.setState(e.state, false),
    // );

    this.state =
      PageState.fromURL(window.location.href) || PageState.initialState();

    // history.replaceState(this.state, '', this.state.toURL());

    // this.setSize();
    // this.render();
  }

  handlePointerEvent(e: PointerEvent) {
    const x0 = e.clientX;
    const y0 = e.clientY;
    const t0 = Date.now();

    const pointerMoveHandler = (e: PointerEvent) => {
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      const dt = Date.now() - t0;

      if (dx > 10 || dy > 10 || dt > 500) {
        this.canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    const pointerUpHandler = (e: PointerEvent) => {
      this.canvas.removeEventListener('pointermove', pointerMoveHandler);
      this.canvas.removeEventListener('pointerup', pointerUpHandler);

      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      const dt = Date.now() - t0;

      const { cx, cy, perPixel } = this.state;

      if (dx > 10 || dy > 10 || dt > 500) {
        this.setState({
          cx: cx - dx * perPixel,
          cy: cy - dy * perPixel,
          perPixel,
          maxIterations: this.state.maxIterations,
        });
      } else {
        const cdx = x0 - this.width / 2;
        const cdy = y0 - this.height / 2;
        this.canvas.style.transform = `translate(${-cdx * 2}px, ${-cdy * 2}px) scale(2)`;

        this.setState((s) => {
          s.cx += cdx * s.perPixel;
          s.cy += cdy * s.perPixel;
          s.perPixel /= 2;
        });
      }
    };

    this.canvas.addEventListener('pointermove', pointerMoveHandler);
    this.canvas.addEventListener('pointerup', pointerUpHandler);
  }

  handleKeyEvent(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        this.setState(PageState.initialState());
        break;
      case '+':
        this.setState((s) => {
          s.maxIterations = Math.round(s.maxIterations * 1.5);
        });
        break;
      case '-':
        this.setState((s) => {
          s.maxIterations = Math.round(s.maxIterations / 1.5);
          if (s.maxIterations < 1) {
            s.maxIterations = 1;
          }
        });
        break;
      case 'o':
        this.setState((s) => {
          s.perPixel *= 2;
        });
        break;
      case 'ArrowUp':
        this.setState((s) => {
          s.cy -= (this.height / 10) * s.perPixel;
        });
        break;
      case 'ArrowDown':
        this.setState((s) => {
          s.cy += (this.height / 10) * s.perPixel;
        });
        break;
      case 'ArrowLeft':
        this.setState((s) => {
          s.cx -= (this.width / 10) * s.perPixel;
        });
        break;
      case 'ArrowRight':
        this.setState((s) => {
          s.cx += (this.width / 10) * s.perPixel;
        });
        break;
      default:
        break;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleResizeEvent(_e?: UIEvent) {
    if (this.resizeTimer !== null) {
      clearTimeout(this.resizeTimer);
    }

    this.resizeTimer = setTimeout(() => {
      this.resizeTimer = null;
      this.setSize();
      // this.render();
    }, 200);
  }

  setSize() {
    this.width = this.canvas.width = 250; //window.innerWidth;
    this.height = this.canvas.height = 250; //window.innerHeight;
    this.tiles = [...Tile.tiles(this.width, this.height, ROWS, COLS)];
    console.log('Mehraj: setSize', { tiles: this.tiles });
  }

  setState(f: ((_: PageState) => void) | PageStateArgs, save = true) {
    if (typeof f === 'function') {
      f(this.state);
    } else {
      this.state.cx = f.cx;
      this.state.cy = f.cy;
      this.state.perPixel = f.perPixel;
      this.state.maxIterations = f.maxIterations;
    }

    // this.render();
    if (save) {
      history.pushState(this.setState, '', this.state.toURL());
    }
  }

  // render() {
  //   if (this.pendingRender) {
  //     this.wantsReRender = true;
  //     return;
  //   }

  //   const { maxIterations } = this.state;
  //   // const x0 = cx - perPixel * (this.width / 2);
  //   // const y0 = cy - perPixel * (this.height / 2);

  //   const promises =
  //     this.tiles?.map((tile) => {
  //       return new Promise((res) => {
  //         return res({
  //           min: 0,
  //           max: 0,
  //           imageData: new ImageData(tile.width, tile.height),
  //           tile,
  //         });
  //       });
  //     }) ?? [];

  //   this.pendingRender = Promise.all(promises)
  //     .then((responses) => {
  //       let min = maxIterations,
  //         max = 0;
  //       for (const r of responses) {
  //         if (r.min < min) {
  //           min = r.min;
  //         }
  //         if (r.max > max) {
  //           max = r.max;
  //         }
  //       }

  //       if (!this.colorTable || this.colorTable.length !== maxIterations + 1) {
  //         this.colorTable = new Uint32Array(maxIterations + 1);
  //       }

  //       if (min === max) {
  //         if (min === maxIterations) {
  //           this.colorTable[min] = 0xff000000;
  //         } else {
  //           this.colorTable[min] = 0;
  //         }
  //       } else {
  //         const maxlog = Math.log(max);
  //         for (let i = min; i <= max; i++) {
  //           this.colorTable[i] =
  //             Math.ceil((Math.log(1 + i - min) / maxlog) * 255) << 24;
  //         }
  //       }

  //       for (const r of responses) {
  //         const itertations = new Uint32Array(r.imageData.data.buffer);
  //         for (let i = 0; i < itertations.length; i++) {
  //           itertations[i] = this.colorTable![itertations[i]];
  //         }
  //       }

  //       this.canvas.style.transform = '';
  //       for (const r of responses) {
  //         this.context.putImageData(r.imageData, r.tile.x, r.tile.y);
  //       }
  //     })
  //     .catch((reason) => {
  //       console.error('Error during render:', reason);
  //     })
  //     .finally(() => {
  //       this.pendingRender = null;
  //       if (this.wantsReRender) {
  //         this.wantsReRender = false;
  //         this.render();
  //       }
  //     });
  // }
}
