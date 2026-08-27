import { Flex } from '@invoke-ai/ui-library';
import { DndImage } from 'features/dnd/DndImage';
import type { MouseEvent, Touch, TouchEvent, WheelEvent } from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import type { ImageDTO } from 'services/api/types';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2;

/**
 * Returns true when the event target is an editable text control (or lives inside one). Zoom and
 * pan gestures must ignore these so interacting with prompt/metadata text fields does not move or
 * scale the image.
 */
const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  return !!target.closest('input, textarea, [contenteditable="true"]');
};

type ZoomState = {
  scale: number;
  x: number;
  y: number;
};

type Props = {
  imageDTO: ImageDTO;
  onLoad?: () => void;
};

/**
 * Wraps the image preview with pinch-to-zoom (touch) and wheel/ctrl-wheel zoom (desktop) plus
 * double-click to toggle. Panning follows a single finger/pointer (touch) or a left-button drag
 * (desktop mouse) while zoomed in. All gesture handlers bail out when the interaction starts on a
 * text field so editing text never triggers zoom.
 */
export const ZoomableImage = memo(({ imageDTO, onLoad }: Props) => {
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [isMousePanning, setIsMousePanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the active pinch so move/end handlers can read the latest distance.
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const mousePanRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const clampScale = useCallback((scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)), []);

  const reset = useCallback(() => setZoom({ scale: 1, x: 0, y: 0 }), []);

  const getDistance = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      if (e.touches.length === 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        if (!a || !b) {
          return;
        }
        const dist = getDistance(a, b);
        pinchRef.current = { startDist: dist, startScale: zoom.scale };
      } else if (e.touches.length === 1 && zoom.scale > 1) {
        const touch = e.touches[0];
        if (!touch) {
          return;
        }
        panRef.current = { startX: touch.clientX, startY: touch.clientY, originX: zoom.x, originY: zoom.y };
      }
    },
    [zoom.scale, zoom.x, zoom.y]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const a = e.touches[0];
        const b = e.touches[1];
        if (!a || !b) {
          return;
        }
        const dist = getDistance(a, b);
        const nextScale = clampScale((dist / pinchRef.current.startDist) * pinchRef.current.startScale);
        setZoom((prev) => ({ ...prev, scale: nextScale }));
      } else if (e.touches.length === 1 && panRef.current && zoom.scale > 1) {
        e.preventDefault();
        const touch = e.touches[0];
        if (!touch) {
          return;
        }
        // Capture the origin synchronously — the panRef can be nulled by a touch-end before the
        // setState updater runs, which would otherwise dereference a null ref and throw.
        const pan = panRef.current;
        const dx = touch.clientX - pan.startX;
        const dy = touch.clientY - pan.startY;
        setZoom((prev) => ({ ...prev, x: pan.originX + dx, y: pan.originY + dy }));
      }
    },
    [clampScale, zoom.scale]
  );

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      pinchRef.current = null;
    }
    if (e.touches.length === 0) {
      panRef.current = null;
    }
  }, []);

  const onDoubleClick = useCallback((e: MouseEvent) => {
    if (isEditableTarget(e.target)) {
      return;
    }
    setZoom((prev) => (prev.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: DOUBLE_TAP_SCALE, x: 0, y: 0 }));
  }, []);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      // Wheel zooms on both desktop (mouse wheel / trackpad) and mobile. Ctrl/meta+wheel is the
      // standard trackpad pinch-zoom; plain wheel also zooms for convenience.
      e.preventDefault();
      setZoom((prev) => {
        const delta = -e.deltaY * 0.01;
        const nextScale = clampScale(prev.scale * (1 + delta));
        if (nextScale === 1) {
          return { scale: 1, x: 0, y: 0 };
        }
        return { ...prev, scale: nextScale };
      });
    },
    [clampScale]
  );

  // Desktop: drag with the left mouse button to pan when zoomed in.
  const onMouseDown = useCallback(
    (e: MouseEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      if (e.button !== 0 || zoom.scale <= 1) {
        return;
      }
      e.preventDefault();
      mousePanRef.current = { startX: e.clientX, startY: e.clientY, originX: zoom.x, originY: zoom.y };
      setIsMousePanning(true);
    },
    [zoom.scale, zoom.x, zoom.y]
  );

  const onMouseMove = useCallback((e: MouseEvent) => {
    const pan = mousePanRef.current;
    if (!pan) {
      return;
    }
    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;
    setZoom((prev) => ({ ...prev, x: pan.originX + dx, y: pan.originY + dy }));
  }, []);

  const endMousePan = useCallback(() => {
    mousePanRef.current = null;
    setIsMousePanning(false);
  }, []);

  return (
    <Flex
      ref={containerRef}
      w="full"
      h="full"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDoubleClick={onDoubleClick}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endMousePan}
      onMouseLeave={endMousePan}
      style={{ cursor: zoom.scale > 1 ? (isMousePanning ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
    >
      <Flex
        w="full"
        h="full"
        alignItems="center"
        justifyContent="center"
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
          transition: pinchRef.current || panRef.current || mousePanRef.current ? 'none' : 'transform 0.15s ease-out',
          transformOrigin: 'center',
        }}
      >
        <DndImage
          imageDTO={imageDTO}
          borderRadius="base"
          disableDrag={zoom.scale > 1}
          onLoad={() => {
            reset();
            onLoad?.();
          }}
        />
      </Flex>
    </Flex>
  );
});

ZoomableImage.displayName = 'ZoomableImage';
