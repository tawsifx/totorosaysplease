// js/audio/ambient.js - External Anime Ambient BGM Manager for Mini-Games Suite
// Streams compressed Ghibli / Totoro ambient soundtrack with loop, fade transitions, and volume controls.

class AmbientAudioManager {
  constructor(audioSrc = "/audio/totoro-ambient.m4a") {
    this.src = audioSrc;
    this.audio = null;
    this.targetVolume = 0.38; // Gentle level so retro arcade SFX remain crisp
    this.fadeInterval = null;
    this.isMuted = false;
    this.userUnlocked = false;
    this._initAudio();
  }

  _initAudio() {
    if (typeof window === "undefined" || typeof Audio === "undefined") return;

    this.audio = new Audio();
    this.audio.src = this.src;
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0;

    // Attach unlock listener for autoplay restrictions
    const unlock = () => {
      this.userUnlocked = true;
      ["pointerdown", "touchstart", "keydown", "click"].forEach(ev => {
        window.removeEventListener(ev, unlock, true);
      });
    };
    ["pointerdown", "touchstart", "keydown", "click"].forEach(ev => {
      window.addEventListener(ev, unlock, { once: true, capture: true });
    });
  }

  play() {
    if (!this.audio) return;
    if (this.isMuted) return;

    // Attempt playback
    const p = this.audio.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        this.fadeTo(this.targetVolume, 800);
        this._updateUI(true);
      }).catch(() => {
        // Autoplay blocked by browser policy; attach one-time unlock listener
        const resumeOnInteraction = () => {
          if (!this.isMuted && this.audio) {
            this.audio.play().then(() => {
              this.fadeTo(this.targetVolume, 800);
              this._updateUI(true);
            }).catch(() => {});
          }
          ["pointerdown", "touchstart", "keydown", "click"].forEach(ev => {
            window.removeEventListener(ev, resumeOnInteraction, true);
          });
        };
        ["pointerdown", "touchstart", "keydown", "click"].forEach(ev => {
          window.addEventListener(ev, resumeOnInteraction, { once: true, capture: true });
        });
      });
    } else {
      this.fadeTo(this.targetVolume, 800);
      this._updateUI(true);
    }
  }

  stop() {
    this.fadeTo(0, 500, () => {
      if (this.audio) {
        this.audio.pause();
        this.audio.currentTime = 0;
      }
      this._updateUI(false);
    });
  }

  pause() {
    this.fadeTo(0, 400, () => {
      if (this.audio) this.audio.pause();
      this._updateUI(false);
    });
  }

  fadeTo(target, durationMs = 600, onComplete = null) {
    if (!this.audio) return;
    clearInterval(this.fadeInterval);

    const start = this.audio.volume;
    const steps = 15;
    const interval = Math.max(16, durationMs / steps);
    let step = 0;

    this.fadeInterval = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);
      const cur = start + (target - start) * progress;
      if (this.audio) this.audio.volume = Math.max(0, Math.min(1, cur));

      if (progress >= 1) {
        clearInterval(this.fadeInterval);
        if (onComplete) onComplete();
      }
    }, interval);
  }

  toggle() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.pause();
    } else {
      this.play();
    }
    this._updateUI(!this.isMuted && !this.audio?.paused);
    return !this.isMuted;
  }

  setVolume(vol) {
    this.targetVolume = Math.max(0, Math.min(1, vol));
    if (this.audio && !this.audio.paused && !this.isMuted) {
      this.audio.volume = this.targetVolume;
    }
  }

  isPlaying() {
    return !!(this.audio && !this.audio.paused && this.audio.currentTime > 0);
  }

  _updateUI(playing) {
    if (typeof document === "undefined") return;
    const btns = document.querySelectorAll(".game-bgm-toggle");
    btns.forEach(btn => {
      if (this.isMuted) {
        btn.textContent = "🔇 BGM: Off";
        btn.classList.add("muted");
      } else if (playing) {
        btn.textContent = "🎵 Anime BGM: Playing";
        btn.classList.remove("muted");
      } else {
        btn.textContent = "🎵 Anime BGM: Paused";
        btn.classList.remove("muted");
      }
    });
  }
}

export const ambientAudio = new AmbientAudioManager("/audio/totoro-ambient.m4a");
