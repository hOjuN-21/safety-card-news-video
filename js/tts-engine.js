/**
 * tts-engine.js
 * In-browser Web Speech Synthesis & Web Audio BGM Generator
 */

class TTSEngine {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.audioCtx = null;
    this.bgmAudioBuffer = null;
    this.isSpeaking = false;

    this.initVoices();
  }

  initVoices() {
    if (!this.synth) {
      console.warn("SpeechSynthesis API is not supported in this browser.");
      return;
    }

    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      const voiceSelect = document.getElementById('voice-select');
      if (!voiceSelect) return;

      voiceSelect.innerHTML = '';

      // Korean voices first, then others
      const koreanVoices = this.voices.filter(v => v.lang.includes('ko') || v.lang.includes('KO') || v.name.toLowerCase().includes('korean'));
      const otherVoices = this.voices.filter(v => !v.lang.includes('ko') && !v.lang.includes('KO') && !v.name.toLowerCase().includes('korean'));

      const allOptions = [...koreanVoices, ...otherVoices];

      if (allOptions.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '기본 한국어 음성 (시스템 기본)';
        voiceSelect.appendChild(opt);
        return;
      }

      allOptions.forEach((voice, idx) => {
        const opt = document.createElement('option');
        opt.value = voice.name;
        const isKo = voice.lang.includes('ko') || voice.name.toLowerCase().includes('korean');
        opt.textContent = `${isKo ? '🇰🇷 ' : ''}${voice.name} (${voice.lang})`;
        if (isKo && !this.selectedVoice) {
          this.selectedVoice = voice;
          opt.selected = true;
        }
        voiceSelect.appendChild(opt);
      });

      if (!this.selectedVoice && allOptions.length > 0) {
        this.selectedVoice = allOptions[0];
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  setVoiceByName(name) {
    const found = this.voices.find(v => v.name === name);
    if (found) {
      this.selectedVoice = found;
    }
  }

  /**
   * Estimate Korean speech duration in seconds based on text length & speech rate
   */
  estimateDuration(text, rate = 1.0) {
    if (!text || text.trim() === '') return 2.0;
    const cleanText = text.trim();
    // In Korean, average reading rate is ~4.0 to 4.5 characters per second
    const charCount = cleanText.length;
    // Add base buffer for punctuation pauses
    const commas = (cleanText.match(/,/g) || []).length;
    const periods = (cleanText.match(/\.|\?|!/g) || []).length;

    const baseSec = (charCount / 4.2) / rate;
    const pauseSec = (commas * 0.3 + periods * 0.5) / rate;
    return Math.max(1.8, Math.round((baseSec + pauseSec) * 10) / 10);
  }

  /**
   * Speak text preview via Web Speech API
   */
  speak(text, rate = 1.0, pitch = 1.0, onEnd = null) {
    if (!this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.synth.cancel(); // cancel any active speech

    if (!text || text.trim() === '') {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.lang = 'ko-KR';

    this.isSpeaking = true;

    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("TTS playback error:", e);
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Initialize Web Audio Context for BGM mixing
   */
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Create procedural ambient safety BGM buffer
   */
  createProceduralBgm(type = 'ambient_calm', duration = 30) {
    const ctx = this.getAudioContext();
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'ambient_calm') {
      // Gentle warm safety drone (major 7th chords: C - E - G - B - D)
      const freqs = [130.81, 164.81, 196.00, 246.94, 293.66]; // C3, E3, G3, B3, D4
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        let sampleL = 0;
        let sampleR = 0;

        freqs.forEach((f, idx) => {
          const lfo = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.15 * t + idx);
          const sine = Math.sin(2 * Math.PI * f * t);
          sampleL += sine * lfo * 0.08;
          sampleR += Math.sin(2 * Math.PI * (f * 1.002) * t) * lfo * 0.08;
        });

        // Soft fade in & out
        let env = 1.0;
        if (t < 2.0) env = t / 2.0;
        if (t > duration - 3.0) env = Math.max(0, (duration - t) / 3.0);

        left[i] = sampleL * env;
        right[i] = sampleR * env;
      }
    } else if (type === 'focus_tech') {
      // Subtle rhythmic melodic pulse
      const freqs = [220, 277.18, 329.63, 440, 554.37];
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        const beat = (t * 2) % 1; // 120 bpm pulse
        const decay = Math.exp(-beat * 6);
        const fIdx = Math.floor((t * 2) % freqs.length);
        const f = freqs[fIdx];

        const pulse = Math.sin(2 * Math.PI * f * t) * decay * 0.12;
        let env = 1.0;
        if (t < 1.0) env = t;
        if (t > duration - 2.0) env = Math.max(0, (duration - t) / 2.0);

        left[i] = pulse * env;
        right[i] = pulse * env;
      }
    }

    return buffer;
  }
}

window.ttsEngine = new TTSEngine();
