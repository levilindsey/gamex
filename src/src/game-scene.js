import { Scene } from '../../../grafx';
import { Aabb } from '../../../physx';

/**
 * This class handles the overall scene.
 *
 * @abstract
 */
class GameScene extends Scene {
  /**
   * @param {ModelGroupControllerConfig} modelControllerParams
   * @param {GameController} gameCtrl
   * @param {InputController} inputCtrl
   * @param {number} renderDistance
   */
  constructor(modelControllerParams, gameCtrl, inputCtrl, renderDistance) {
    super(modelControllerParams);

    // GameScene is an abstract class. It should not be instantiated directly.
    if (new.target === GameScene) {
      throw new TypeError('Cannot construct GameScene instances directly');
    }

    this._gameCtrl = gameCtrl;
    this._inputCtrl = inputCtrl;
    this._renderDistance = renderDistance;
    this._bounds = Aabb.createAsUniformAroundCenter(
      vec3.fromValues(0, 0, 0), this._renderDistance);
  }

  reset() {
    this.centerOfVolume = vec3.fromValues(0, 0, 0);
    super.reset();
  }

  /** @returns {Aabb} */
  get bounds() {
    return this._bounds;
  }
  /** @returns {vec3} */
  get centerOfVolume() {
    return this._bounds.centerOfVolume;
  }
  /** @param {vec3} value */
  set centerOfVolume(value) {
    this._bounds.setAsUniformAroundCenter(value, this._renderDistance);
  }
}

export { GameScene };
