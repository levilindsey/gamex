import {FollowCamera} from '../../../grafx';

// TODO: Ideally, this would use the built-in physics engine; however, we I tried integrating it
// before, I noticed some instability when moving at high speeds. This probably had something to do
// with accessing different versions of the target position (previousState vs currentState vs
// renderState)for force/position calculations

/**
 * This class defines a spring-based follow camera.
 *
 * This camera is positioned at a relative, flexible distance and rotation from the observed target
 * and follows the target's position and orientation with a spring force tying the camera to the
 * desired position.
 *
 * A follow camera rotates in all three dimensions; it does not have a fixed roll.
 */
class SpringFollowCamera extends FollowCamera {
  /**
   * If oldCamera is given, then the state of the new camera will be initialized to match that of
   * the old camera. This enables a smooth transition when changing cameras.
   *
   * @param {CameraTarget} cameraTarget
   * @param {FollowCameraConfig} followCameraParams
   * @param {CameraConfig} cameraParams
   * @param {Camera} [oldCamera]
   */
  constructor(cameraTarget, followCameraParams, cameraParams, oldCamera) {
    super(cameraTarget, followCameraParams, cameraParams, oldCamera);
    // These could have been set in _matchOldCamera.
    this._velocity = this._velocity || vec3.create();
    this._acceleration = this._acceleration || vec3.create();
  }

  reset() {
    super.reset();
    vec3.copy(this._position, this._followCameraParams._intendedTranslationFromTarget);
  }

  /**
   * @param {DOMHighResTimeStamp} currentTime
   * @param {DOMHighResTimeStamp} deltaTime
   */
  update(currentTime, deltaTime) {
    this._updateAccelerationVelocityAndPosition(deltaTime);
    this._updateOrientation();
  }

  /**
   * @param {DOMHighResTimeStamp} deltaTime
   * @private
   */
  _updateAccelerationVelocityAndPosition(deltaTime) {
    this._updateAcceleration();
    this._updatePosition(deltaTime);
    this._updateVelocity(deltaTime);
  }

  /**
   * Update the camera's acceleration using Hooke's law and drag.
   *
   * @private
   */
  _updateAcceleration() {
    this._applySpringAcceleration();
    this._applySpringDamping();
  }

  /**
   * Update the camera's acceleration using Hooke's law.
   *
   * acceleration = displacement * coefficient
   *
   * @private
   */
  _applySpringAcceleration() {
    const displacement = vec3.create();
    vec3.subtract(displacement, this._getIntendedPosition(), this._position);
    vec3.scale(this._acceleration, displacement, this._followCameraParams.springCoefficient);
  }

  /**
   * @private
   */
  _applySpringDamping() {
    const damping = vec3.create();
    vec3.scale(damping, this._velocity, -this._followCameraParams.dampingCoefficient);
    vec3.add(this._acceleration, this._acceleration, damping);
  }

  /**
   * Update the camera's velocity according to its current acceleration.
   *
   * @param {DOMHighResTimeStamp} deltaTime
   * @private
   */
  _updateVelocity(deltaTime) {
    vec3.scaleAndAdd(this._velocity, this._velocity, this._acceleration, deltaTime);
  }

  /**
   * Update the camera's position according to its current velocity.
   *
   * @param {DOMHighResTimeStamp} deltaTime
   * @private
   */
  _updatePosition(deltaTime) {
    vec3.scaleAndAdd(this._position, this._position, this._velocity, deltaTime);
  }

  /**
   * @param {Camera} oldCamera
   * @protected
   */
  _matchOldCamera(oldCamera) {
    super._matchOldCamera(oldCamera);
    if (oldCamera instanceof SpringFollowCamera) {
      this._velocity = this._velocity || vec3.create();
      this._acceleration = this._acceleration || vec3.create();
      vec3.copy(this._velocity, oldCamera._velocity);
      vec3.copy(this._acceleration, oldCamera._acceleration);
    }
  }
}

export {SpringFollowCamera};
