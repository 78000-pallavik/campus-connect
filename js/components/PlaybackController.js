/**
 * CampusConnect - Playback Controller for Graph Algorithmic Visualizations
 * Provides Play, Pause, Step Next, Step Prev, Reset, and Variable Speed (0.5x to 3.5x)
 */

export class PlaybackController {
  /**
   * @param {Object} options
   * @param {Function} options.onStepChange callback(step, stepIndex, totalSteps)
   * @param {Function} options.onFinished callback()
   */
  constructor(options = {}) {
    this.steps = [];
    this.currentIndex = -1;
    this.isPlaying = false;
    this.speed = 1.0; // 0.5x to 3.5x
    this.timer = null;
    this.onStepChange = options.onStepChange || (() => {});
    this.onFinished = options.onFinished || (() => {});
    this.baseDelayMs = 600;
  }

  /**
   * Load a new sequence of trace steps
   * @param {Array} steps 
   */
  loadSteps(steps) {
    this.stop();
    this.steps = Array.isArray(steps) ? steps : [];
    this.currentIndex = -1;
    if (this.steps.length > 0) {
      this.stepNext();
    }
  }

  getDelay() {
    return Math.max(80, Math.floor(this.baseDelayMs / this.speed));
  }

  setSpeed(multiplier) {
    this.speed = Math.max(0.5, Math.min(3.5, Number(multiplier) || 1.0));
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  play() {
    if (this.steps.length === 0) return;
    if (this.currentIndex >= this.steps.length - 1) {
      this.currentIndex = -1;
    }

    this.isPlaying = true;
    this.scheduleNextTick();
  }

  scheduleNextTick() {
    if (!this.isPlaying) return;

    this.timer = setTimeout(() => {
      const hasMore = this.stepNext();
      if (hasMore && this.isPlaying) {
        this.scheduleNextTick();
      } else {
        this.pause();
        this.onFinished();
      }
    }, this.getDelay());
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  stepNext() {
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.emitCurrentStep();
      return this.currentIndex < this.steps.length - 1;
    }
    return false;
  }

  stepPrev() {
    this.pause();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.emitCurrentStep();
      return true;
    }
    return false;
  }

  reset() {
    this.pause();
    if (this.steps.length > 0) {
      this.currentIndex = 0;
      this.emitCurrentStep();
    } else {
      this.currentIndex = -1;
    }
  }

  finish() {
    this.pause();
    if (this.steps.length > 0) {
      this.currentIndex = this.steps.length - 1;
      this.emitCurrentStep();
      this.onFinished();
    }
  }

  stop() {
    this.pause();
    this.steps = [];
    this.currentIndex = -1;
  }

  emitCurrentStep() {
    if (this.currentIndex >= 0 && this.currentIndex < this.steps.length) {
      const step = this.steps[this.currentIndex];
      this.onStepChange(step, this.currentIndex, this.steps.length);
    }
  }

  getCurrentStep() {
    if (this.currentIndex >= 0 && this.currentIndex < this.steps.length) {
      return this.steps[this.currentIndex];
    }
    return null;
  }
}
