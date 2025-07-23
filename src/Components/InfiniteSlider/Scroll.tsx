/* eslint-disable no-unused-vars */
import * as React from 'react';

const blockClass = 'tt-slider';
interface ScrollProps {
  onChange: (_delta: number) => void;
  barConfig: { height: number; gap: number };
  overscan: number;
  referenceIndex?: number;
  index?: number;
}

const initialCenterIndex = 0;

export const Scroll = ({
  onChange,
  barConfig,
  overscan,
  index: indexProp,
}: ScrollProps) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const barRefs = React.useRef<Array<HTMLDivElement | null>>([]);

  const itemsInViewport = React.useMemo(() => {
    if (container == null) {
      return 0;
    }

    const itemHeight = barConfig.height + barConfig.gap;
    const containerHeight = container.clientHeight;
    return Math.ceil(containerHeight / itemHeight);
  }, [barConfig.gap, barConfig.height, container]);

  const halfItemsInViewport = React.useMemo(() => {
    return Math.ceil(itemsInViewport / 2);
  }, [itemsInViewport]);

  const [overflow, setOverflow] = React.useState(0);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const scrollPositionRef = React.useRef(scrollPosition);
  scrollPositionRef.current = scrollPosition;

  const getRenderedIndices = React.useCallback(() => {
    const center =
      initialCenterIndex -
      Math.round(
        scrollPositionRef.current / (barConfig.gap + barConfig.height),
      );
    const start =
      initialCenterIndex - overscan * overflow - halfItemsInViewport;
    const end = start + itemsInViewport;

    const startWithOverscan = start - overscan;
    const endWithOverscan = end + overscan;

    return { startWithOverscan, center, endWithOverscan };
  }, [
    barConfig.gap,
    barConfig.height,
    overscan,
    overflow,
    halfItemsInViewport,
    itemsInViewport,
  ]);

  const renderedIndices = getRenderedIndices();

  const stepSize = 5;

  const getRealIndex = React.useCallback(
    (barIndex: number) => {
      const realIndex = renderedIndices.startWithOverscan + barIndex;

      return { realIndex, isCenter: realIndex === renderedIndices.center };
    },
    [renderedIndices.center, renderedIndices.startWithOverscan],
  );

  const animateScroll = React.useCallback(
    (deltaY: number) => {
      const y = deltaY + scrollPositionRef.current;
      const newCenterIndex =
        initialCenterIndex - Math.round(y / (barConfig.gap + barConfig.height));
      barRefs.current.forEach((bar, index) => {
        const { realIndex } = getRealIndex(index);
        if (bar) {
          const transform = `translateY(${y}px)`;

          bar.style.transform = transform;
          if (realIndex > (indexProp ?? 0)) {
            bar.classList.add('marked');
          } else {
            bar.classList.remove('marked');
          }
          if (realIndex === newCenterIndex) {
            bar.classList.add('animate');
          } else {
            bar.classList.remove('animate');
          }
        }
      });
    },
    [barConfig.gap, barConfig.height, getRealIndex, indexProp],
  );

  //   const currentCenterIndex = React.useRef(0);

  const handleWheel = React.useCallback(
    (event: WheelEvent) => {
      event.preventDefault();
      //   const delta = Math.sign(event.deltaY);

      const deltaY = Math.max(Math.min(event.deltaY, 5), -5);
      const steps = Math.min(2, Math.round(deltaY / stepSize));

      animateScroll(deltaY);
      console.log('steps:', steps, deltaY);
      onChange(steps);

      const newScrollPosition = scrollPositionRef.current + deltaY;
      const threshold = overscan * (barConfig.gap + barConfig.height);
      const t =
        newScrollPosition > 0
          ? Math.floor(newScrollPosition / threshold)
          : Math.ceil(newScrollPosition / threshold);

      setOverflow(t);

      setScrollPosition(newScrollPosition);

      console.log('Scroll event:', {
        event,
        deltaY,
        itemsInViewport,
        overflow: t,
      });
    },
    [
      animateScroll,
      barConfig.gap,
      barConfig.height,
      itemsInViewport,
      onChange,
      overscan,
    ],
  );

  React.useEffect(() => {
    if (container == null) {
      return;
    }
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [container, handleWheel]);

  const totalItems = React.useMemo(() => {
    const indices = getRenderedIndices();
    return indices.endWithOverscan - indices.startWithOverscan;
  }, [getRenderedIndices]);

  const bars = React.useMemo(() => {
    if (container == null) {
      return null;
    }

    const containerHeight = container.clientHeight;
    const offsetToCenter = Math.ceil(containerHeight / 2);
    return Array.from({ length: totalItems }).map((_, index) => {
      const { realIndex } = getRealIndex(index);
      return (
        <div
          key={realIndex}
          ref={(e) => {
            barRefs.current[index] = e;
          }}
          className={`${blockClass}__bar ${index} real-${realIndex}`}
          style={{
            height: barConfig.height,
            top:
              realIndex * (barConfig.height + barConfig.gap) + offsetToCenter,
            background:
              renderedIndices.center === realIndex
                ? 'green'
                : realIndex % 5 === 0
                  ? 'blue'
                  : undefined,
          }}
        >
          <span>{realIndex}</span>
        </div>
      );
    });
  }, [
    barConfig.gap,
    barConfig.height,
    container,
    getRealIndex,
    renderedIndices.center,
    totalItems,
  ]);

  return (
    <>
      <div ref={setContainer} className={`${blockClass}__scroll`}>
        {bars}
      </div>

      <div className={`${blockClass}__values`}>
        <div className={`${blockClass}__value`}>
          Items in Viewport: {itemsInViewport}
        </div>
        <div className={`${blockClass}__value`}>
          halfItemsInViewport: {halfItemsInViewport}
        </div>
        <div className={`${blockClass}__value`}>overscan: {overscan}</div>
        <div className={`${blockClass}__value`}>total items: {totalItems}</div>
        <div className={`${blockClass}__value`}>
          scrollPosition: {scrollPosition}
        </div>
        <div className={`${blockClass}__value`}>
          startWithOverscan: {renderedIndices.startWithOverscan}
        </div>

        <div className={`${blockClass}__value`}>
          center: {renderedIndices.center}
        </div>
        <div className={`${blockClass}__value`}>
          endWithOverscan: {renderedIndices.endWithOverscan}
        </div>
        <div className={`${blockClass}__value`}>overflow: {overflow}</div>
        {/* <div className={`${blockClass}__value`}>{bars}</div> */}
      </div>
    </>
  );
};
