var TRACKED_CONTROLS_COMPONENT = require('../constants').TRACKED_CONTROLS_COMPONENT;

AFRAME.registerSystem('motion-capture-replayer', {
  init: function () {
    var sceneEl = this.sceneEl;
    var trackedControlsComponent;
    var trackedControlsSystem;
    var trackedControlsTick;

    var trackedControlsSystem = sceneEl.systems[TRACKED_CONTROLS_COMPONENT];
    var trackedControlsTick = AFRAME.components[TRACKED_CONTROLS_COMPONENT].Component.prototype.tick;
    var trackedControlsComponent = AFRAME.components[TRACKED_CONTROLS_COMPONENT].Component.prototype;

    // Gamepad data stored in recording and added here by `motion-capture-replayer` component.
    this.gamepads = [];

    // Wrap `updateControllerList`.
    this.updateControllerListOriginal = trackedControlsSystem.updateControllerList.bind(
      trackedControlsSystem);
    this.throttledUpdateControllerListOriginal = trackedControlsSystem.throttledUpdateControllerList
    trackedControlsSystem.throttledUpdateControllerList = this.updateControllerList.bind(this);

    // Wrap `tracked-controls` tick.
    trackedControlsComponent.tick = this.trackedControlsTickWrapper;
    trackedControlsComponent.trackedControlsTick = trackedControlsTick;
  },

  remove: function () {
    // restore modified objects
    var trackedControlsComponent = AFRAME.components[TRACKED_CONTROLS_COMPONENT].Component.prototype;
    var trackedControlsSystem = this.sceneEl.systems[TRACKED_CONTROLS_COMPONENT];
    trackedControlsComponent.tick = trackedControlsComponent.trackedControlsTick;
    delete trackedControlsComponent.trackedControlsTick;
    trackedControlsSystem.throttledUpdateControllerList = this.throttledUpdateControllerListOriginal;
  },

  trackedControlsTickWrapper: function (time, delta) {
    if (this.el.components['motion-capture-replayer']) { return; }
    this.trackedControlsTick(time, delta);
  },

  /**
   * Wrap `updateControllerList` to stub in the gamepads and emit `controllersupdated`.
   */
  updateControllerList: function (gamepads) {
    var i;
    var sceneEl = this.sceneEl;
    var trackedControlsSystem = sceneEl.systems[TRACKED_CONTROLS_COMPONENT];
    gamepads = gamepads || []
    // convert from read-only GamepadList
    gamepads = Array.from(gamepads)

    this.gamepads.forEach(function (gamepad) {
      if (gamepads[gamepad.index]) { return; }
      // to pass check in updateControllerListOriginal
      gamepad.pose = true;
      gamepads[gamepad.index] = gamepad;
    });

    this.updateControllerListOriginal(gamepads);
  }
});
