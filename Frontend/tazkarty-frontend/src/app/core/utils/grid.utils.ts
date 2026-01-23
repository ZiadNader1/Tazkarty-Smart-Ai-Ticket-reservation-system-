export const GridUtils = {
    snapToGrid(value: number, gridSize: number): number {
        return Math.round(value / gridSize) * gridSize;
    },

    snapPoint(point: { x: number, y: number }, gridSize: number): { x: number, y: number } {
        return {
            x: this.snapToGrid(point.x, gridSize),
            y: this.snapToGrid(point.y, gridSize)
        };
    }
};
