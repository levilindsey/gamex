import {isInDevMode, ModelController, StandardModelController, vec3ToString} from '../../../grafx';
import {PhysicsJob, PhysicsState} from '../../../physx';

/**
 * This class represents a non-collidable physics-based model-controller.
 *
 * It uses composition to control an instance of a ModelController along with a corresponding
 * instance of a PhysicsJob.
 *
 * @implements {ModelControllerInterface}
 * @abstract
 */
class PhysicsModelController {
  /**
   * @param {ModelController|ModelControllerConfig} modelControllerOrParams
   * @param {PhysicsJob|DynamicsConfig} physicsJobOrDynamicsParams
   * @param {RenderableShapeConfig} [shapeParams]
   * @param {Array.<ForceApplier>} [forceAppliers]
   */
  constructor(modelControllerOrParams, physicsJobOrDynamicsParams, shapeParams, forceAppliers) {
    // PhysicsModelController is an abstract class. It should not be instantiated directly.
    if (new.target === PhysicsModelController) {
      throw new TypeError('Cannot construct PhysicsModelController instances directly');
    }

    this.modelCtrl = modelControllerOrParams instanceof ModelController
        ? modelControllerOrParams
        : new StandardModelController(modelControllerOrParams, shapeParams);

    if (physicsJobOrDynamicsParams instanceof PhysicsJob) {
      this.physicsJob = physicsJobOrDynamicsParams;
    } else {
      const state = new PhysicsState(physicsJobOrDynamicsParams);
      this.physicsJob = new PhysicsJob(forceAppliers, state);
    }

    this._originalPosition = vec3.clone(this.physicsJob.currentState.position);

    this._patchModelController({
      /**
       * Patches the ModelController's updateTransforms method in order to keep it's local-transform
       * matrix in-sync with the PhysicsJob's position and orientation.
       */
      updateTransforms: (superVersion) => {
        // Update the ModelController's local-transform matrix according to the PhysicsJob's
        // current position and orientation.
        mat4.fromRotationTranslationScale(this.modelCtrl._localTransform,
            this.renderOrientation, this.renderPosition,
            this.modelCtrl.scale);
        superVersion();
      },
    });

    if (isInDevMode) {
      const controllerName = this.constructor.name.replace('Controller', '');
      console.debug(`${controllerName} created @ ${vec3ToString(this.position)}`);
    }
  }

  /**
   * Patches the given methods on the underlying ModelController.
   *
   * The patched methods are passed the original or "super" version of the method as the first
   * argument; the normal method arguments are provided after.
   *
   * @protected
   */
  _patchModelController(patches) {
    Object.keys(patches).forEach((methodName) => {
      const newMethod = patches[methodName];
      const superVersion = this.modelCtrl[methodName].bind(this.modelCtrl);
      this.modelCtrl[methodName] = newMethod.bind(this.modelCtrl, superVersion);
    });
  }

  /**
   * Registers this controller's PhysicsJob(s) with the physics engine.
   */
  reset() {
    this.modelCtrl.reset();
    this.physicsJob.position = this._originalPosition;
    this.physicsJob.finish();
    this.physicsJob.start();
  }

  /**
   * Unregisters this controller's PhysicsJob(s) with the physics engine.
   */
  destroy() {
    this.modelCtrl.destroy();
    this.physicsJob.finish();
    if (isInDevMode) {
      const controllerName = this.constructor.name.replace('Controller', '');
      console.debug(`${controllerName} destroyed @ ${vec3ToString(this.position)}`);
    }
  }

  /** @param {vec3} value */
  set position(value) {
    this.physicsJob.position = value;
  }
  /** @returns {vec3} */
  get position() {
    return this.physicsJob.currentState.position;
  }
  /** @returns {quat} */
  get orientation() {
    return this.physicsJob.currentState.orientation;
  }
  // FIXME: Can I remove this?
  /** @returns {vec3} */
  get velocity() {
    return this.physicsJob.currentState.velocity;
  }

  /** @returns {vec3} */
  get renderPosition() {
    return this.physicsJob.renderState.position;
  }
  /** @returns {quat} */
  get renderOrientation() {
    return this.physicsJob.renderState.orientation;
  }
  // FIXME: Can I remove this?
  /** @returns {vec3} */
  get renderVelocity() {
    return this.physicsJob.renderState.velocity;
  }

  /**
   * @returns {DefaultModel}
   * @protected
   */
  get _model() {
    return this.modelCtrl._model;
  }
  /**
   * @returns {vec3}
   */
  get scale() {
    return this.modelCtrl.scale;
  }
  /**
   * Returns a promise that resolves when this model controller is ready for the app to run.
   *
   * @returns {Promise}
   */
  getIsReady() {
    return this.modelCtrl.getIsReady();
  }
  /**
   * Gets the model transform matrix, in local coordinates.
   *
   * @returns {mat4}
   */
  get localTransform() {
    return this.modelCtrl.localTransform;
  }
  /**
   * Gets the model transform matrix, in world coordinates.
   *
   * @returns {mat4}
   */
  get worldTransform() {
    return this.modelCtrl.worldTransform;
  }
  /**
   * Calls update, updateTransforms, and updateChildren.
   *
   * @param {DOMHighResTimeStamp} currentTime
   * @param {DOMHighResTimeStamp} deltaTime
   */
  updateSelfAndChildren(currentTime, deltaTime) {
    this.modelCtrl.updateSelfAndChildren(currentTime, deltaTime);
  }
}

export {PhysicsModelController};
