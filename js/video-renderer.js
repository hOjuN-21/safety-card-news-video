/**
 * video-renderer.js
 * In-browser HTML5 Canvas Slide & Subtitle Renderer + MediaRecorder Video Exporter
 */

class VideoRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRendering = false;
    this.currentBlob = null;
    this.currentUrl = null;
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
   * Preload an image from URL or dataURL
   */
  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
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

    // 1. Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Image (Contain with letterbox or Fill)
    if (img) {
      // Blurred backdrop if aspect ratio differs
      ctx.save();
      ctx.filter = 'blur(20px) brightness(0.4)';
      ctx.drawImage(img, -20, -20, w + 40, h + 40);
      ctx.restore();

      // Sharp main image centered
      const imgRatio = img.width / img.height;
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

    const fontSize = Math.round(w * 0.038); // Responsive font size ~40px on 1080p
    const lineHeight = fontSize * 1.45;
    ctx.font = `700 ${fontSize}px Pretendard, 'Noto Sans KR', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text into lines
    const maxTextWidth = w * 0.82;
    const lines = this.wrapKoreanText(text, maxTextWidth, ctx);
    const totalBoxHeight = lines.length * lineHeight + fontSize * 1.2;

    let boxY = h - totalBoxHeight - (h * 0.05); // 5% from bottom

    if (style === 'top-bar') {
      boxY = h * 0.05;
    }

    if (style === 'bottom-bar' || style === 'top-bar') {
      // Full/Semi wide dark bar
      ctx.fillStyle = 'rgba(10, 15, 29, 0.82)';
      ctx.fillRect(w * 0.05, boxY, w * 0.9, totalBoxHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.05, boxY, w * 0.9, totalBoxHeight);
    } else if (style === 'floating-pill') {
      // Rounded pill
      const pillRadius = totalBoxHeight / 2;
      this.roundRect(ctx, w * 0.08, boxY, w * 0.84, totalBoxHeight, 20);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Render Text Lines
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

  /**
   * Helper: Wrap Korean text by words cleanly
   */
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
   * Main Video Render Pipeline
   */
  async renderVideo(cards, settings, progressCallback) {
    if (this.isRendering) return null;
    this.isRendering = true;

    try {
      this.setDimensions(settings.aspectRatio);

      if (progressCallback) progressCallback(5, "카드 이미지 리소스 로딩 중...", "이미지 디코딩 및 검증");

      // 1. Preload all card images
      const loadedImages = [];
      for (let i = 0; i < cards.length; i++) {
        const img = await this.loadImage(cards[i].imageUrl);
        loadedImages.push(img);
      }

      // 2. Setup Audio Engine & Web Audio Destination
      const audioCtx = window.ttsEngine.getAudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      // Setup BGM
      let bgmNode = null;
      let totalEstimatedDuration = 0;

      // Calculate timeline for each card
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
        const bgmBuffer = window.ttsEngine.createProceduralBgm(settings.bgmType, Math.ceil(totalEstimatedDuration + 3));
        bgmNode = audioCtx.createBufferSource();
        bgmNode.buffer = bgmBuffer;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = settings.bgmVolume || 0.12;
        bgmNode.connect(gainNode);
        gainNode.connect(dest);
      }

      // 3. Setup Canvas Capture Stream & MediaRecorder
      const fps = 30;
      const videoStream = this.canvas.captureStream(fps);
      const combinedStream = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      // Choose supported mimeType
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
        mimeType = 'video/webm;codecs=h264,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      const recordedChunks = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 6000000 // 6 Mbps high quality
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const renderPromise = new Promise((resolve, reject) => {
        recorder.onstop = () => {
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const blob = new Blob(recordedChunks, { type: mimeType });
          this.currentBlob = blob;
          if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
          this.currentUrl = URL.createObjectURL(blob);
          resolve({ blob, url: this.currentUrl, extension });
        };
        recorder.onerror = (e) => reject(e);
      });

      // Start Recording
      recorder.start(100);
      if (bgmNode) {
        bgmNode.start();
      }

      // 4. Play through timeline & render frames
      const subtitleOpts = {
        enabled: settings.showSubtitles !== false,
        style: settings.subtitleStyle || 'bottom-bar'
      };

      let currentTimelineIdx = 0;
      const startTime = performance.now();

      const runRenderLoop = async () => {
        for (let i = 0; i < timeline.length; i++) {
          const segment = timeline[i];
          const card = segment.card;
          const nextSegment = (i + 1 < timeline.length) ? timeline[i + 1] : null;

          if (progressCallback) {
            const pct = Math.round(((i) / timeline.length) * 85) + 10;
            progressCallback(pct, `카드 ${i + 1}/${timeline.length} 렌더링 중`, card.title || card.script.slice(0, 20));
          }

          // Trigger speech in parallel
          window.ttsEngine.speak(card.script, rate);

          // Render card frames across duration
          const segmentStartTime = performance.now();
          const targetDurationMs = segment.totalDuration * 1000;
          const transitionDurMs = settings.transitionStyle === 'cut' ? 0 : 400; // 0.4s transition

          while (performance.now() - segmentStartTime < targetDurationMs) {
            const elapsed = performance.now() - segmentStartTime;
            const remaining = targetDurationMs - elapsed;

            if (remaining < transitionDurMs && nextSegment && settings.transitionStyle === 'fade') {
              // Cross fade
              const t = 1.0 - (remaining / transitionDurMs);
              this.drawCardFrame(segment.image, card.script, subtitleOpts, 1.0);
              this.drawCardFrame(nextSegment.image, nextSegment.card.script, subtitleOpts, t);
            } else if (remaining < transitionDurMs && nextSegment && settings.transitionStyle === 'slide') {
              // Slide transition
              const t = 1.0 - (remaining / transitionDurMs);
              const offset = -t * this.canvas.width;
              this.drawCardFrame(segment.image, card.script, subtitleOpts, 1.0, offset);
              this.drawCardFrame(nextSegment.image, nextSegment.card.script, subtitleOpts, 1.0, offset + this.canvas.width);
            } else {
              // Normal static display
              this.drawCardFrame(segment.image, card.script, subtitleOpts, 1.0);
            }

            // Wait 1 frame (approx 33ms)
            await new Promise(r => setTimeout(r, 33));
          }
        }

        // Finish
        if (progressCallback) progressCallback(96, "동영상 파일 인코딩 마무리 중...", "MP4 파일 생성 중");
        
        // Stop audio & recorder
        window.ttsEngine.stop();
        if (bgmNode) {
          try { bgmNode.stop(); } catch(e) {}
        }
        
        await new Promise(r => setTimeout(r, 500));
        recorder.stop();
      };

      await runRenderLoop();
      const result = await renderPromise;
      this.isRendering = false;
      return result;

    } catch (err) {
      this.isRendering = false;
      window.ttsEngine.stop();
      console.error("Rendering error:", err);
      throw err;
    }
  }
}
