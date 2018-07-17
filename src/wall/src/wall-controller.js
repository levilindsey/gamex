import {StandardModelController} from '../../../../grafx';
import {collidableStore} from '../../../../physx';

import {Wall} from './wall-collidable';

/**
 * This class defines a wall-controller.
 */
class WallController extends StandardModelController {
  /**
   * @param {ModelControllerConfig} modelControllerParams
   * @param {WallParams} wallParams
   */
  constructor(modelControllerParams, wallParams) {
    const shapeParams = {
      shapeId: 'CUBE',
      isUsingSphericalNormals: wallParams.useSmoothShading,
      textureSpan: wallParams.textureSpan
    };

    super(modelControllerParams, shapeParams);

    this._collidable = new Wall(wallParams);
    collidableStore.registerCollidable(this._collidable);
  }

  reset() {
    // Re-size and re-position the wall.
    mat4.fromTranslation(this._localTransform, this._collidable.centerOfVolume);
    mat4.scale(this._localTransform, this._localTransform, this._collidable.scale);

    super.reset();
  }

  /**
   * Called when this is done being used, and is being destroyed from memory.
   */
  destroy() {
    super.destroy();
    collidableStore.unregisterCollidable(this._collidable);
  }

  /**
   * @param {DOMHighResTimeStamp} currentTime
   * @param {DOMHighResTimeStamp} deltaTime
   * @protected
   */
  update(currentTime, deltaTime) {}
}

export {WallController};

/**
 * @typedef {Object} WallParams
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {boolean} isOpenOnPositiveSide
 * @property {number} thickness
 * @property {number} halfSideLength
 * @property {boolean} useSmoothShading
 * @property {TextureSpan} textureSpan
 */
