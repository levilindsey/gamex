import {PhysicsModelController} from './physics-model-controller';
import {CollidablePhysicsJob, PhysicsJob, PhysicsState} from '../../../physx';

/**
 * This class represents a collidable physics-based model-controller.
 *
 * @abstract
 */
class CollidablePhysicsModelController extends PhysicsModelController {
  /**
   * @param {ModelController|ModelControllerConfig} modelControllerOrParams
   * @param {CollidablePhysicsJob|DynamicsConfig} physicsJobOrDynamicsParams
   * @param {RenderableShapeConfig} [shapeParams]
   * @param {Array.<ForceApplier>} forceAppliers
   */
  constructor(modelControllerOrParams, physicsJobOrDynamicsParams, shapeParams, forceAppliers) {
    super(modelControllerOrParams, physicsJobOrDynamicsParams, shapeParams, forceAppliers);

    if (physicsJobOrDynamicsParams instanceof CollidablePhysicsJob) {
      this.physicsJob = physicsJobOrDynamicsParams;
    } else {
      const state = new PhysicsState(physicsJobOrDynamicsParams);
      this.physicsJob = new CollidablePhysicsJob(shapeParams, state, forceAppliers, this,
          collision => this.handleCollision(collision));
    }

    // CollidablePhysicsModelController is an abstract class. It should not be instantiated directly.
    if (new.target === CollidablePhysicsModelController) {
      throw new TypeError('Cannot construct CollidablePhysicsModelController instances directly');
    }
  }

  /**
   * This callback is triggered in response to a collision.
   *
   * @param {Collision} collision
   * @returns {boolean} True if this needs the standard collision restitution to proceed.
   * @abstract
   */
  handleCollision(collision) {
    // Extending classes should implement this method.
    throw new TypeError('Method not implemented');
  }
}

export {CollidablePhysicsModelController};

/**
 * @typedef {RenderableShapeConfig&CollidableShapeConfig} RenderableAndCollidableShapeConfig
 */
