import { animator } from '../../../animatex';
import {
  GrafxController,
  handlePageFocusChange,
}
from '../../../grafx';
import { configController } from './config-controller';
import { InputController } from './input-controller';

/**
 * This top-level Controller class initializes and runs the rest of the app.
 */
class GameController extends GrafxController {
  constructor() {
    super();

    this.isGameOver = true;
    this._inputCtrl = null;
  }

  /**
   * Initializes the app. After this completes successfully, call run to actually start the app.
   *
   * @param {HTMLCanvasElement} canvas
   * @param {Array.<ProgramWrapperConfig>} programConfigs Configurations for program wrappers that
   * should be pre-cached before starting the rest of the app.
   * @param {Array.<String>} texturePaths Texture images that should be pre-cached before
   * starting the rest of the app.
   * @param {Function.<Scene>} SceneImpl A class that extends GameScene.
   * @returns {Promise}
   */
  initialize(canvas, programConfigs, texturePaths, SceneImpl) {
    this._canvas = canvas;

    configController.initialize();
    this._setUpInput();

    return super.initialize(canvas, programConfigs, texturePaths, SceneImpl);
  }

  destroy() {
    this._inputCtrl.destroy();
  }

  /**
   * Runs the app. This should be called after initialize.
   *
   * A few things happen if this is run in dev mode:
   * - The draw and update steps of each frame are wrapped in a try/catch block.
   * - This method returns a Promise that rejects if an error is throw during any update or draw
   *   step and resolves when this controller has finished (currently never)
   */
  run() {
    handlePageFocusChange(hasFocus => this._onPageFocusChange(hasFocus));
    super.run();
  }

  pause() {
    animator.pause();
  }

  unpause() {
    animator.unpause();
  }

  /**
   * @returns {boolean}
   */
  get isPaused() {
    return animator.isPaused;
  }

  /**
   * @param {boolean} hasFocus
   * @private
   */
  _onPageFocusChange(hasFocus) {
    if (!hasFocus) {
      this.pause();
    }
  }

  /**
   * @private
   */
  _setUpInput() {
    this._inputCtrl = new InputController();
    this._inputCtrl.preventDefaultBrowserBehaviorForKey('SPACE');
  }

  /**
   * Initializes the scene.
   *
   * @param {Function.<Scene>} SceneImpl A class that extends GameScene.
   * @returns {Promise}
   * @protected
   */
  _setUpScene(SceneImpl) {
    this._scene = new SceneImpl({
      gl: this._gl,
      getViewMatrix: () => this._getViewMatrix(),
      getProjectionMatrix: () => this._getProjectionMatrix(),
    }, this, this._inputCtrl);
    return this._scene.getIsReady().then(() => {
      this._scene.reset();
      this._updateAspectRatio(); // TODO: This should NOT happen here or using the glUtil globals.
    });
  }
}

export { GameController };
