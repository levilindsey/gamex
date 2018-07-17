import {keyCodes} from '../../../grafx';

// TODO: Figure out how to capture: tab, space, escape, enter; prevent their default behaviors when
// listeners have been registered for them.

/**
 * This class handles user input.
 */
class InputController {
  constructor() {
    this._keyDownListeners = {};
    this._keyUpListeners = {};
    this._currentlyPressedKeys = {};
    this._keysToPreventDefaultBrowserBehaviorFor = {};

    this._mainKeyDownListener = event => this._handleKeyDown(event);
    this._mainKeyUpListener = event => this._handleKeyUp(event);
    this._mainKeyPressListener = event => this._handleKeyPress(event);

    window.addEventListener('keydown', this._mainKeyDownListener, false);
    window.addEventListener('keyup', this._mainKeyUpListener, false);
    window.addEventListener('keypress', this._mainKeyPressListener, false);
  }

  destroy() {
    window.removeEventListener('keydown', this._mainKeyDownListener);
    window.removeEventListener('keyup', this._mainKeyUpListener);
    window.removeEventListener('keypress', this._mainKeyPressListener);
  }

  /**
   * Registers a callback to be called whenever the given key is pressed.
   *
   * @param {string} key
   * @param {Function} callback
   */
  addKeyDownListener(key, callback) {
    let listenersForKey = this._keyDownListeners[keyCodes[key]];

    // Make sure the listener list is initialized for this key.
    if (!listenersForKey) {
      listenersForKey = new Set();
      this._keyDownListeners[keyCodes[key]] = listenersForKey;
    }

    listenersForKey.add(callback);
  }

  /**
   * Registers a callback to be called whenever the given key is lifted.
   *
   * @param {string} key
   * @param {Function} callback
   */
  addKeyUpListener(key, callback) {
    let listenersForKey = this._keyUpListeners[keyCodes[key]];

    // Make sure the listener list is initialized for this key.
    if (!listenersForKey) {
      listenersForKey = new Set();
      this._keyUpListeners[keyCodes[key]] = listenersForKey;
    }

    listenersForKey.add(callback);
  }

  /**
   * Un-registers a callback to be called whenever the given key is pressed.
   *
   * @param {string} key
   * @param {Function} callback
   */
  removeKeyDownListener(key, callback) {
    this._keyDownListeners[keyCodes[key]].delete(callback);
  }

  /**
   * Un-registers a callback to be called whenever the given key is lifted.
   *
   * @param {string} key
   * @param {Function} callback
   */
  removeKeyUpListener(key, callback) {
    this._keyUpListeners[keyCodes[key]].delete(callback);
  }

  /**
   * Registers the given key to prevent the default browser behavior when it is pressed.
   *
   * @param {string} key
   */
  preventDefaultBrowserBehaviorForKey(key) {
    this._keysToPreventDefaultBrowserBehaviorFor[keyCodes[key]] = true;
  }

  /**
   * Un-registers the given key to prevent the default browser behavior when it is pressed.
   *
   * @param {string} key
   */
  allowDefaultBrowserBehaviorForKey(key) {
    delete this._keysToPreventDefaultBrowserBehaviorFor[keyCodes[key]];
  }

  /**
   * Determines whether the given key is currently pressed down.
   *
   * @param {string} key
   * @returns {boolean}
   */
  isKeyCurrentlyPressed(key) {
    return !!this._currentlyPressedKeys[keyCodes[key]];
  }

  /**
   * Saves the given key as being pressed.
   *
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyDown(event) {
    // If this key was already being pressed down, then do nothing (when a key is held down, many
    // keydown events are actually triggered).
    if (this._currentlyPressedKeys[event.keyCode]) {
      return;
    }

    // Mark this key as being pressed down.
    this._currentlyPressedKeys[event.keyCode] = true;

    // Call any registered key-down listeners for this key.
    const listeners = this._keyDownListeners[event.keyCode];
    if (listeners) {
      listeners.forEach(listener => listener());
    }
  }

  /**
   * Calls all key-up listeners that have been registered for the given key.
   *
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyUp(event) {
    // Mark this key as no longer being pressed down.
    delete this._currentlyPressedKeys[event.keyCode];

    // Call any registered key-up listeners for this key.
    const listeners = this._keyUpListeners[event.keyCode];
    if (listeners) {
      listeners.forEach(listener => listener());
    }
  }

  /**
   * Prevents the default browser behavior for keys that have been registered to prevent.
   *
   * @param {KeyboardEvent} event
   * @private
   */
  _handleKeyPress(event) {
    if (this._keysToPreventDefaultBrowserBehaviorFor[event.keyCode]) {
      event.preventDefault();
    }
  }
}

export {InputController};
