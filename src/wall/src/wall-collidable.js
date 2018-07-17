import {Aabb} from '../../../../physx';

/**
 * This class represents a wall or floor.
 *
 * This is just a convenience class that extends Aabb.
 */
class Wall extends Aabb {
  /**
   * - If the x parameter is given, then a wall will be constructed along the y-z plane with its
   * surface at the x coordinate. The y and z parameters are handled similarly.
   * - Only one of the x/y/z parameters should be specified.
   * - If isOpenOnPositiveSide is true, then the wall will be open toward the positive direction.
   *
   * @param {WallParams} wallParams
   */
  constructor(wallParams) {
    let minX;
    let minY;
    let minZ;
    let maxX;
    let maxY;
    let maxZ;

    let {x, y, z, isOpenOnPositiveSide, thickness, halfSideLength} = wallParams;
    thickness = thickness || 80000;
    halfSideLength = halfSideLength || 80000;

    if (typeof x === 'number') {
      if (isOpenOnPositiveSide) {
        minX = x - thickness;
        maxX = x;
      } else {
        minX = x;
        maxX = x + thickness;
      }
      minY = -halfSideLength;
      minZ = -halfSideLength;
      maxY = halfSideLength;
      maxZ = halfSideLength;
    } else if (typeof y === 'number') {
      if (isOpenOnPositiveSide) {
        minY = y - thickness;
        maxY = y;
      } else {
        minY = y;
        maxY = y + thickness;
      }
      minX = -halfSideLength;
      minZ = -halfSideLength;
      maxX = halfSideLength;
      maxZ = halfSideLength;
    } else {
      if (isOpenOnPositiveSide) {
        minZ = z - thickness;
        maxZ = z;
      } else {
        minZ = z;
        maxZ = z + thickness;
      }
      minX = -halfSideLength;
      minY = -halfSideLength;
      maxX = halfSideLength;
      maxY = halfSideLength;
    }

    super(minX, minY, minZ, maxX, maxY, maxZ, true);
  }

  /**
   * @returns {vec3}
   * @override
   */
  get scale() {
    // Reuse the same object when this is called multiple times.
    this._scale = this._scale || vec3.create();
    vec3.set(this._scale, this.rangeX, this.rangeY, this.rangeZ);
    return this._scale;
  }
}

export {Wall};
