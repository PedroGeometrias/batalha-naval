export type Viewport = { left: number; top: number; right: number; bottom: number };
export type VisibleTile = { id: number; x: number; y: number };

// Invert the isometric projection at the viewport corners, then check tile rectangles.
export function visibleTiles(width: number, height: number, view: Viewport): VisibleTile[] {
  const firstCol = Math.max(0, Math.floor((view.left/32 + view.top/16)/2) - 2);
  const lastCol = Math.min(width-1, Math.ceil((view.right/32 + view.bottom/16)/2) + 1);
  const firstRow = Math.max(0, Math.floor((view.top/16 - view.right/32)/2) - 2);
  const lastRow = Math.min(height-1, Math.ceil((view.bottom/16 - view.left/32)/2) + 1);
  const tiles: VisibleTile[] = [];
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      const x = (col-row)*32, y = (col+row)*16;
      if (x < view.right && x+64 > view.left && y < view.bottom && y+32 > view.top) {
        tiles.push({ id: row*width+col, x, y });
      }
    }
  }
  return tiles;
}
