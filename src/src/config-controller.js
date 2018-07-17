import {
  createHslColorString,
  debounce,
  find,
  getViewportSize,
  hslToHsv,
  hsvToHsl,
  hslToRgb,
  isInt,
} from '../../../grafx';

const _SMALL_SCREEN_WIDTH_THRESHOLD = 800;

/**
 * This top-level ConfigController class wraps the dat.GUI library and provides higher-level
 * configuration functionality.
 *
 * ## Configuring Parameters
 *
 * Consumers of this module will need to specify configuration parameters with a certain form. For
 * each property on a config object, an item will be created in the corresponding dat.GUI folder.
 * The type and specifics of the menu item depends on the value assigned to the config property:
 *
 * - Toggle item:
 *   - Created if the config property is a boolean.
 * - Trigger item:
 *   - Created if the config property is a function.
 * - Slider item:
 *   - Created if the config property is an object with 'min', 'max', and 'start' properties.
 *   - When the config object is parsed, this initial config object will be removed and replaced
 *     with only the current actual value.
 *   - The intervals of the slider are automatically determined by the dat.GUI library and depend on
 *     the type of the 'min'/'max'/'value' properties (int vs float). See the dat.GUI documentation
 *     for more info.
 * - Color item:
 *   - Created if the config property is an object with 'h'/'s'/'l' properties.
 *   - When the config object is parsed, this initial config object will be replaced with a new
 *     object that has 'h'/'s'/'v' properties and an 'hsl' property, which is an object containing
 *     'h'/'s'/'l' properties and a 'colorString' property that contains a valid color string to
 *     assign to a CSS property.
 *   - All 'h'/'s'/'l' and 'h'/'s'/'v' values should be in the range of [0,1].
 * - Text item:
 *   - Created if the config property is a String.
 */
class ConfigController {
  constructor() {
    this._datGuiWidth = 300;
    this._gui = null;
  }

  /**
   * Sets up the dat.GUI controller.
   */
  initialize() {
    // Create the dat.GUI menu.
    this._createGuiIfNotCreated(true);
    this._gui.width = this._datGuiWidth;

    // Automatically close the menu on smaller screens.
    // TODO: Check that the menu is closed initially (with no resize event) if the page loads at too small a width.
    const debouncedResize = debounce(() => this._onResize(), 300);
    window.addEventListener('resize', debouncedResize, false);
  }

  /**
   * Clears the dat.GUI menu.
   */
  destroy() {
    this._gui.destroy();
  }

  /**
   * @param {boolean} isGuiVisible
   * @private
   */
  _createGuiIfNotCreated(isGuiVisible) {
    if (this._gui) {
      if (isGuiVisible) {
        this._gui.domElement.style.display = 'block';
      }
    } else {
      this._gui = new dat.GUI();
      if (!isGuiVisible) {
        this._gui.domElement.style.display = 'none';
      }
    }
  }

  /**
   * Creates a folder with the given configuration underneath the given parent folder.
   *
   * @param {MenuFolderConfig} folderConfig
   * @param {dat.gui.GUI} [parentFolder] If not given, the folder is created at the top level.
   * @param {Object} [onChangeListeners] A map from labels to on-change handlers.
   */
  createFolder(folderConfig, parentFolder, onChangeListeners) {
    this._createGuiIfNotCreated(false);

    parentFolder = parentFolder || this._gui;

    // TODO: Copy the original config and store it somehow on the dat.GUI menu item? This is important for resetting configs later (from the other controller).
    const folder = parentFolder.addFolder(folderConfig.label);

    folderConfig.folder = folder;

    this._createItems(folderConfig);

    // Add listeners from the config file.
    this._addOnChangeListeners(folderConfig, folderConfig.onChangeListeners, true);

    // Add listeners from the caller of this method.
    this._addOnChangeListeners(folderConfig, onChangeListeners, false);

    if (folderConfig.isOpen) {
      folder.open();
    }

    // Recursively create descendant folders.
    if (folderConfig.childFolders) {
      this.createFolders(folderConfig.childFolders, folder);
    }
  }

  /**
   * @param {Array.<MenuFolderConfig>} folderConfigs
   * @param {dat.gui.GUI} parentFolder
   */
  createFolders(folderConfigs, parentFolder) {
    folderConfigs.forEach(folderConfig => this.createFolder(folderConfig, parentFolder));
  }

  /**
   * @param {MenuFolderConfig} folderConfig
   * @param {string} label
   * @param {Function} callback
   */
  addOnChangeListener(folderConfig, label, callback) {
    if (folderConfig.items[label]) {
      folderConfig.items[label].onChangeListeners.push(callback);
    } else {
      console.warn('Attempting to add on-change listener for a non-existent config', label,
          folderConfig);
    }
  }

  hideMenu() {
    console.info('Hide Menu clicked');
    document.querySelector('body > .dg').style.display = 'none';
  }

  /**
   * NOTE: This is not idempotent. This modifies the original folderConfig.config object.
   *
   * @param {MenuFolderConfig} folderConfig
   * @private
   */
  _createItems(folderConfig) {
    folderConfig.items = {};

    Object.keys(folderConfig.config).forEach((itemConfigKey) => {
      // Do not expose internal configurations to the user.
      if (itemConfigKey.substr(0, 1) === '_') return;

      const itemConfig = folderConfig.config[itemConfigKey];

      // Determine which method to use to create the menu item.
      const pair = find([
        [ConfigController.isToggleItem, ConfigController._createToggleItem],
        [ConfigController.isTriggerItem, ConfigController._createTriggerItem],
        [ConfigController.isSliderItem, ConfigController._createSliderItem],
        [ConfigController.isNumberItem, ConfigController._createNumberItem],
        [ConfigController.isHslColorItem, ConfigController._createHslColorItem],
        [ConfigController.isTextItem, ConfigController._createTextItem],
        [ConfigController.isStringSelectorItem, ConfigController._createStringSelectorItem],
        [ConfigController.isVec3NumberItem, ConfigController._createVec3NumberItems],
        [ConfigController.isVec3SliderItem, ConfigController._createVec3SliderItems],
      ], (pair) => pair[0](itemConfig));
      if (!pair) {
        console.warn('Unrecognized config type', itemConfig);
        return;
      }
      const menuItemCreator = pair[1];

      // Create the actual dat.GUI menu item and save a reference to it.
      const menuItemData = menuItemCreator.call(this, folderConfig.config,
          itemConfigKey, itemConfig, folderConfig.folder);
      if (menuItemData instanceof Array) {
        const parentMenuItemData = {onChangeListeners: []};

        // Record the individual sub-items.
        menuItemData.forEach(data => {
          folderConfig.items[data.label] = data;

          // Hook up the (parent item's) onChange listeners.
          data.menuItem.onChange(() => {
            data.onChangeListeners.forEach(callback => callback());
            parentMenuItemData.onChangeListeners.forEach(callback => callback());
          });
        });

        // Record the parent item.
        folderConfig.items[itemConfigKey] = parentMenuItemData;
      } else {
        folderConfig.items[itemConfigKey] = menuItemData;

        // Hook up the onChange listeners.
        menuItemData.menuItem.onChange(() =>
            menuItemData.onChangeListeners.forEach(callback => callback()));
      }
    });
  }

  /**
   * @param {MenuFolderConfig} folderConfig
   * @param {Object} onChangeListeners A map from labels to on-change event handlers.
   * @param {boolean} makeInitialCallToListeners
   * @private
   */
  _addOnChangeListeners(folderConfig, onChangeListeners, makeInitialCallToListeners) {
    if (onChangeListeners) {
      Object.keys(onChangeListeners).forEach(key => {
        const onChangeHandler = onChangeListeners[key];
        configController.addOnChangeListener(folderConfig, key, onChangeHandler);
        if (makeInitialCallToListeners) {
          onChangeHandler();
        }
      });
    }
  }

  /**
   * Close the menu on smaller screens.
   */
  _onResize() {
    setTimeout(() => {
      if (getViewportSize() < _SMALL_SCREEN_WIDTH_THRESHOLD) {
        this._gui.close();
      }
    }, 10);
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {ToggleMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createToggleItem(configObject, label, itemConfig, folder) {
    return {
      menuItem: folder.add(configObject, label),
      onChangeListeners: []
    };
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {TriggerMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createTriggerItem(configObject, label, itemConfig, folder) {
    return {
      menuItem: folder.add(configObject, label),
      onChangeListeners: []
    };
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {SliderMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createSliderItem(configObject, label, itemConfig, folder) {
    // Replace the original itemConfig on the configObject with the actual starting value.
    configObject[label] = itemConfig.start;

    const listeners = isInt(itemConfig.min) && isInt(itemConfig.max)
        ? [ConfigController._truncateToInt.bind(null, configObject, label)]
        : [];

    // Create the menu item.
    return {
      menuItem: folder.add(configObject, label, itemConfig.min, itemConfig.max),
      onChangeListeners: listeners
    };
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {NumberMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createNumberItem(configObject, label, itemConfig, folder) {
    // Create the menu item.
    return {
      menuItem: folder.add(configObject, label),
      onChangeListeners: []
    };
  }

  /**
   * This is used to force int sliders to only produce ints.
   *
   * This shouldn't be needed, but dat.GUI doesn't seem to be behaving consistently.
   *
   * @param configObject
   * @param label
   * @private
   */
  static _truncateToInt(configObject, label) {
    configObject[label] = parseInt(configObject[label]);
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {HslColorMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createHslColorItem(configObject, label, itemConfig, folder) {
    // Create the property that the menu item will use.
    itemConfig = hslToHsv(itemConfig);
    configObject[label] = itemConfig;

    // Set up a listener that will keep derived HSL values in sync with the native HSV values used
    // by the dat.GUI menu item.
    const calculateHslValues = () => {
      const hsl = hsvToHsl(configObject[label]);
      const rgb = hslToRgb(hsl);
      itemConfig.hsl = hsl;
      itemConfig.rgb = rgb;
      itemConfig.rgbVec = vec3.fromValues(rgb.r, rgb.g, rgb.b);
      itemConfig.hsl.colorString = createHslColorString(hsl);
    };
    calculateHslValues();

    // Create the menu item.
    return {
      menuItem: folder.addColor(configObject, label),
      onChangeListeners: [calculateHslValues]
    };
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {TextMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createTextItem(configObject, label, itemConfig, folder) {
    return {
      menuItem: folder.add(configObject, label),
      onChangeListeners: []
    };
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {Vec3NumberMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {Array.<MenuItemData>}
   * @private
   */
  static _createVec3NumberItems(configObject, label, itemConfig, folder) {
    const xLabel = `${label}X`;
    const yLabel = `${label}Y`;
    const zLabel = `${label}Z`;

    // Set up a listener that will keep the derived vec3 in sync with its individual coordinates.
    const _updateVec3 = () => vec3.set(itemConfig, configObject[xLabel], configObject[yLabel],
        configObject[zLabel]);

    return [
      [0, xLabel],
      [1, yLabel],
      [2, zLabel]
    ].map(indexAndLabel => {
      const index = indexAndLabel[0];
      const label = indexAndLabel[1];

      // Create the individual vec3 coordinate property and initial value.
      configObject[label] = itemConfig[index];

      // Create the individual vec3 coordinate menu item.
      return {
        menuItem: folder.add(configObject, label),
        onChangeListeners: [_updateVec3],
        label: label
      };
    });
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {Vec3SliderMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {Array.<MenuItemData>}
   * @private
   */
  static _createVec3SliderItems(configObject, label, itemConfig, folder) {
    // Replace the original itemConfig on the configObject with the actual starting value.
    configObject[label] = itemConfig.start;

    const xLabel = `${label}X`;
    const yLabel = `${label}Y`;
    const zLabel = `${label}Z`;

    // Set up a listener that will keep the derived vec3 in sync with its individual coordinates.
    const _updateVec3 = () => vec3.set(configObject[label], configObject[xLabel],
        configObject[yLabel], configObject[zLabel]);

    return [
      [0, xLabel],
      [1, yLabel],
      [2, zLabel]
    ].map(indexAndLabel => {
      const index = indexAndLabel[0];
      const label = indexAndLabel[1];
      const start = itemConfig.start[index];
      const min = itemConfig.min[index];
      const max = itemConfig.max[index];

      // Create the individual vec3 coordinate property and initial value.
      configObject[label] = start;

      // Create the individual vec3 coordinate menu item.
      return {
        menuItem: folder.add(configObject, label, min, max),
        onChangeListeners: [_updateVec3],
        label: label
      };
    });
  }

  /**
   * @param {Object} configObject
   * @param {string} label
   * @param {StringSelectorMenuItemConfig} itemConfig
   * @param {dat.gui.GUI} folder
   * @returns {MenuItemData}
   * @private
   */
  static _createStringSelectorItem(configObject, label, itemConfig, folder) {
    // Replace the original itemConfig on the configObject with the actual starting value.
    configObject[label] = itemConfig.start;

    return {
      menuItem: folder.add(configObject, label, itemConfig.options),
      onChangeListeners: []
    };
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isToggleItem(itemConfig) {
    return typeof itemConfig === 'boolean';
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isTriggerItem(itemConfig) {
    return typeof itemConfig === 'function';
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isSliderItem(itemConfig) {
    return typeof itemConfig === 'object' &&
        typeof itemConfig.start === 'number' &&
        typeof itemConfig.min === 'number' &&
        typeof itemConfig.max === 'number';
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isNumberItem(itemConfig) {
    return typeof itemConfig === 'number';
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isHslColorItem(itemConfig) {
    return typeof itemConfig === 'object' &&
        typeof itemConfig.h === 'number' &&
        typeof itemConfig.s === 'number' &&
        typeof itemConfig.l === 'number';
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isTextItem(itemConfig) {
    return typeof itemConfig === 'string';
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isStringSelectorItem(itemConfig) {
    return typeof itemConfig === 'object' &&
        typeof itemConfig.start === 'string' &&
        itemConfig.options instanceof Array;
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isVec3NumberItem(itemConfig) {
    return (itemConfig instanceof Float32Array || itemConfig instanceof Array) &&
        itemConfig.length === 3;
  }

  /**
   * @param {MenuItemConfig} itemConfig
   * @returns {boolean}
   */
  static isVec3SliderItem(itemConfig) {
    return typeof itemConfig === 'object' &&
        ConfigController.isVec3NumberItem(itemConfig.start) &&
        ConfigController.isVec3NumberItem(itemConfig.min) &&
        ConfigController.isVec3NumberItem(itemConfig.max);
  }
}

const configController = new ConfigController();

export {configController};

/**
 * @typedef {Object} MenuItemData
 * @property {dat.gui.controller} menuItem The actual dat.GUI menu item.
 * @property {Array.<Function>} onChangeListeners onChange listeners for the menu item.
 * @property {string} [label] The label used for the menu item.
 */

/**
 * @typedef {Object} MenuFolderConfig
 * @property {string} label
 * @property {Object} config A map from labels to MenuItemConfigs. Any config item whose label
 * starts with '_' will be treated as internal and will not be exposed to the user.
 * @property {boolean} [isOpen=false]
 * @property {Object} [onChangeListeners] A map from labels to on-change event handlers.
 * @property {Array.<MenuFolderConfig>} [childFolders]
 * @property {Object} [items] A map from labels to MenuItemDatas.
 * @property {dat.gui.GUI} [folder] Created and added by the ConfigController after registering the
 * folder.
 */

/**
 * @typedef {ToggleMenuItemConfig|TriggerMenuItemConfig|SliderMenuItemConfig|NumberMenuItemConfig|HslColorMenuItemConfig|TextMenuItemConfig|StringSelectorMenuItemConfig|Vec3NumberMenuItemConfig|Vec3SliderMenuItemConfig} MenuItemConfig
 */

/**
 * @typedef {boolean} ToggleMenuItemConfig
 */

/**
 * @typedef {Function} TriggerMenuItemConfig
 */

/**
 * @typedef {Object} SliderMenuItemConfig
 * @property {number} start
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {number} NumberMenuItemConfig
 */

/**
 * @typedef {Object} HslColorMenuItemConfig
 * @property {number} h A value from 0 to 1.
 * @property {number} s A value from 0 to 1.
 * @property {number} l A value from 0 to 1.
 */

/**
 * @typedef {string} TextMenuItemConfig
 */

/**
 * @typedef {Object} StringSelectorMenuItemConfig
 * @property {string} start
 * @property {Array.<String>} options
 */

/**
 * @typedef {vec3} Vec3NumberMenuItemConfig
 */

/**
 * @typedef {Object} Vec3SliderMenuItemConfig
 * @property {vec3} start
 * @property {vec3} min
 * @property {vec3} max
 */
