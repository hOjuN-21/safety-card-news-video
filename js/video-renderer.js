/**
 * video-renderer.js
 * Robust HTML5 Canvas Slide & Subtitle Renderer + MediaRecorder Video Exporter
 */

class VideoRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRendering = false;
    this.currentBlob = null;
    this.currentUrl = null;
    this.lastExtension = 'mp4';
  }

  setDimensions(aspectRatio = '1:1') {
    let width = 1080;
    let height = 1080;

    switch (aspectRatio) {
      case '4:5':
        width = 1080;
        height = 1350;
        break;
      case '16:9':
        width = 1920;
        height = 1080;
        break;
      case '9:16':
        width = 1080;
        height = 1920;
        break;
      case '1:1':
      default:
        width = 1080;
        height = 1080;
        break;
    }

    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * Preload an image from URL or dataURL safely without tainting canvas
   */
  async loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        return reject(new Error("이미지 경로가 비어 있습니다."));
      }

      const img = new Image();
      // ONLY set crossOrigin on external HTTP/HTTPS URLs
      if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("카드 이미지를 불러오는 데 실패했습니다."));
      img.src = src;
    });
  }

  /**
   * Draw a card frame onto canvas
   */
  drawCardFrame(img, subtitleText, subtitleOptions = {}, opacity = 1.0, offsetX = 0) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    if (offsetX !== 0) {
      ctx.translate(offsetX, 0);
    }

    // 1. Base dark background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Image (Contain with letterbox or subtle blur backdrop)
    if (img) {
      try {
        // Blurred backdrop
        ctx.save();
        ctx.filter = 'blur(24px) brightness(0.35)';
        ctx.drawImage(img, -20, -20, w + 40, h + 40);
        ctx.restore();

        // Sharp main image centered
        const imgRatio = (img.width || 1) / (img.height || 1);
        const canvasRatio = w / h;
        let drawW, drawH, drawX, drawY;

        if (imgRatio > canvasRatio) {
          drawW = w;
          drawH = w / imgRatio;
          drawX = 0;
          drawY = (h - drawH) / 2;
        } else {
          drawH = h;
          drawW = h * imgRatio;
          drawX = (w - drawW) / 2;
          drawY = 0;
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } catch (err) {
        console.warn("Frame draw image warning:", err);
      }
    }

    // 3. Draw Subtitles if enabled
    if (subtitleOptions.enabled && subtitleText && subtitleText.trim() !== '') {
      this.drawSubtitles(subtitleText, subtitleOptions);
    }

    ctx.restore();
  }

  /**
   * Draw styled Korean Subtitles with automatic line wrapping
   */
  drawSubtitles(text, options = {}) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    const style = options.style || 'bottom-bar';

    const fontSize = Math.round(w * 0.038); // Responsive font size
    const lineHeight = fontSize * 1.45;
    ctx.font = `700 ${fontSize}px Pretendard, 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxTextWidth = w * 0.82;
    const lines = this.wrapKoreanText(text, maxTextWidth, ctx);
    const totalBoxHeight = lines.length * lineHeight + fontSize * 1.2;

    let boxY = h - totalBoxHeight - (h * 0.05); // 5% from bottom

    if (style === 'top-bar') {
      boxY = h * 0.05;
    }

    if (style === 'bottom-bar' || style === 'top-bar') {
      // Semi-transparent bar
      ctx.fillStyle = 'rgba(10, 15, 29, 0.84)';
      ctx.fillRect(w * 0.05, boxY, w * 0.9, totalBoxHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.05, boxY, w * 0.9, totalBoxHeight);
    } else if (style === 'floating-pill') {
      this.roundRect(ctx, w * 0.08, boxY, w * 0.84, totalBoxHeight, 20);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    lines.forEach((line, idx) => {
      const lineY = boxY + (fontSize * 0.9) + (idx * lineHeight) + (fontSize * 0.2);

      if (style === 'text-shadow') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 3;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 6;
        ctx.strokeText(line, w / 2, lineY);
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, w / 2, lineY);
    });

    ctx.shadowBlur = 0;
  }

  wrapKoreanText(text, maxWidth, ctx) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Determine best supported MediaRecorder MIME type
   */
  getBestMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4;codecs=avc1,mp4a',
      'video/mp4'
    ];

    if (typeof MediaRecorder === 'undefined') {
      throw new Error("현재 브라우저는 MediaRecorder API를 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.");
    }

    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  /**
   * Main Video Render Pipeline
   */
  async renderVideo(cards, settings, progressCallback) {
    if (this.isRendering) return null;
    this.isRendering = true;

    try {
      this.setDimensions(settings.aspectRatio);

      if (progressCallback) progressCallback(5, "카드 이미지 리소스 로딩 중...", "이미지 유효성 검사");

      // 1. Preload all card images
      const loadedImages = [];
      for (let i = 0; i < cards.length; i++) {
        try {
          const img = await this.loadImage(cards[i].imageUrl);
          loadedImages.push(img);
        } catch (imgErr) {
          console.error(`카드 ${i + 1} 이미지 로드 실패:`, imgErr);
          throw new Error(`카드 ${i + 1}번 이미지를 로드할 수 없습니다: ${cards[i].title || '이미지 오류'}`);
        }
      }

      // 2. Setup Audio Engine & Web Audio Destination
      const audioCtx = window.ttsEngine.getAudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const dest = audioCtx.createMediaStreamDestination();

      // Keep audio stream active with continuous silence carrier node
      const silenceOsc = audioCtx.createOscillator();
      const silenceGain = audioCtx.createGain();
      silenceGain.gain.value = 0.0001; // virtually silent carrier
      silenceOsc.connect(silenceGain);
      silenceGain.connect(dest);
      silenceOsc.start();

      // Setup BGM
      let bgmNode = null;
      let totalEstimatedDuration = 0;

      const timeline = [];
      const pauseDuration = settings.cardPause || 0.8;
      const rate = settings.speechRate || 1.0;

      cards.forEach((card, idx) => {
        const speechDur = window.ttsEngine.estimateDuration(card.script, rate);
        const cardTotalDur = speechDur + pauseDuration;
        timeline.push({
          cardIndex: idx,
          card: card,
          image: loadedImages[idx],
          speechDuration: speechDur,
          totalDuration: cardTotalDur,
          startTime: totalEstimatedDuration,
          endTime: totalEstimatedDuration + cardTotalDur
        });
        totalEstimatedDuration += cardTotalDur;
      });

      if (settings.bgmType && settings.bgmType !== 'none') {
        const bgmBuffer = window.ttsEngine.createProceduralBgm(settings.bgmType, Math.ceil(totalEstimatedDuration + 4));
        bgmNode = audioCtx.createBufferSource();
        bgmNode.buffer = bgmBuffer;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = settings.bgmVolume || 0.12;
        bgmNode.connect(gainNode);
        gainNode.connect(dest);
      }

      // 3. Setup Canvas Capture Stream & MediaRecorder
      const fps = 30;
      let videoStream;
      try {
        videoStream = this.canvas.captureStream(fps);
      } catch (streamErr) {
        throw new Error("캔버스 화면 캡처에 실패했습니다 (CORS 보안 제약): " + streamErr.message);
      }

      const audioTracks = dest.stream.getAudioTracks();
      const tracks = [...videoStream.getVideoTracks()];
      if (audioTracks.length > 0) {
        tracks.push(audioTracks[0]);
      }

      const combinedStream = new MediaStream(tracks);

      // Safe MediaRecorder Initialization with MIME fallback
      const chosenMime = this.getBestMimeType();
      const recordedChunks = [];
      let recorder;

      const recorderOptions = chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 5000000 } : {};

      try {
        recorder = new MediaRecorder(combinedStream, recorderOptions);
      } catch (recInitErr) {
        console.warn("Preferred mimeType failed, falling back to default:", recInitErr);
        recorder = new MediaRecorder(combinedStream);
      }

      const actualMime = recorder.mimeType || chosenMime || 'video/webm';

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const renderPromise = new Promise((resolve, reject) => {
        recorder.onstop = () => {
          try {
            const isMp4 = actualMime.toLowerCase().includes('mp4');
            const extension = isMp4 ? 'mp4' : 'webm';
            const blob = new Blob(recordedChunks, { type: actualMime });
            this.currentBlob = blob;
            if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
            this.currentUrl = URL.createObjectURL(blob);
            this.lastExtension = extension;
            resolve({ blob, url: this.currentUrl, extension });
          } catch (blobErr) {
            reject(new Error("동영상 파일 변환 실패: " + blobErr.message));
          }
        };

        recorder.onerror = (e) => {
          const errObj = e.error || new Error(e.message || "동영상 녹화 장치(MediaRecorder) 오류가 발생했습니다.");
          reject(errObj);
        };
      });

      // Start Recording
      recorder.start(100);
      if (bgmNode) {
        try { bgmNode.start(); } catch (e) {}
      }

      // 4. Render timeline loop
      const subtitleOpts = {
        enabled: settings.showSubtitles !== false,
        style: settings.subtitleStyle || 'bottom-bar'
      };

      const runRenderLoop = async () => {
        for (let i = 0; i < timeline.length; i++) {
          const segment = timeline[i];
          const card = segment.card;
          const nextSegment = (i + 1 < timeline.length) ? timeline[i + 1] : null;

          if (progressCallback) {
            const pct = Math.round((i / timeline.length) * 85) + 10;
            progressCallback(pct, `카드 ${i + 1}/${timeline.length} 렌더링 중`, card.title || card.script.slice(0, 25));
          }

          // Trigger speech preview concurrently
          window.ttsEngine.speak(card.script, rate);

          // Play transition chime tone on card change
          window.ttsEngine.playChime(dest);

          // Frame animation loop
          const segmentStartTime = performance.now();
          const targetDurationMs = segment.totalDuration * 1000;
          const transitionDurMs = settings.transitionStyle === 'cut' ? 0 : 400;

          while (performance.now() - segmentStartTime < targetDurationMs) {
            const elapsed = performance.now() - segmentStartTime;
            const remaining = targetDurationMs - elapsed;

            if (remaining < transitionDurMs && nextSegment && settings.transitionStyle === 'fade') {
              const t = 1.0 - (remaining / transitionDurMs);
              this.drawCardFrame(segment.image, card.script, subtitleOpts, 1.0);
              this.drawCardFrame(nextSegment.image, nextSegment.card.script, subtitleOpts, t);
            } else if (remaining < transitionDurMs && nextSegment && settings.transitionStyle === 'slide') {
              const t = 1.0 - (remaining / transitionDurMs);
              const offset = -t * this.canvas.width;
              this.drawCardFrame(segment.image, card.script, subtitleOpts, 1.0, offset);
              this.drawCardFrame(nextSegment.image, nextSegment.card.script, subtitleOpts, 1.0, offset + this.canvas.width);
            } else {
              this.drawCardFrame(segment.image, card.script, subtitleOpts, 1.0);
            }

            await new Promise(r => setTimeout(r, 33));
          }
        }

        if (progressCallback) progressCallback(96, "동영상 파일 패키징 중...", "고화질 비디오 완성");

        window.ttsEngine.stop();
        if (bgmNode) {
          try { bgmNode.stop(); } catch (e) {}
        }
        try { silenceOsc.stop(); } catch (e) {}

        await new Promise(r => setTimeout(r, 400));
        recorder.stop();
      };

      await runRenderLoop();
      const result = await renderPromise;
      this.isRendering = false;
      return result;

    } catch (err) {
      this.isRendering = false;
      window.ttsEngine.stop();
      console.error("Video Render Error:", err);
      throw err;
    }
  }
}
