/**
 * app.js
 * Main UI Controller and Application State Manager
 */

class SafetyCardApp {
  constructor() {
    this.cards = [];
    this.currentPreviewIndex = 0;
    this.videoRenderer = null;
    this.isRendering = false;

    this.initElements();
    this.initEvents();
    this.initRenderer();

    // Auto load sample on first visit if empty
    setTimeout(() => {
      if (this.cards.length === 0) {
        this.loadSampleTemplate('confinedSpace');
      }
    }, 300);
  }

  initElements() {
    // DOM Elements
    this.dropZone = document.getElementById('drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.cardsContainer = document.getElementById('cards-container');
    this.cardCountBadge = document.getElementById('card-count-badge');
    this.btnClearAll = document.getElementById('btn-clear-all');

    // Controls
    this.voiceSelect = document.getElementById('voice-select');
    this.btnTestVoice = document.getElementById('btn-test-voice');
    this.speechRateInput = document.getElementById('speech-rate');
    this.rateVal = document.getElementById('rate-val');
    this.cardPauseInput = document.getElementById('card-pause');
    this.pauseVal = document.getElementById('pause-val');

    this.subtitleToggle = document.getElementById('subtitle-toggle');
    this.subtitleStyleSelect = document.getElementById('subtitle-style');
    this.aspectRatioSelect = document.getElementById('aspect-ratio');
    this.bgmSelect = document.getElementById('bgm-select');
    this.bgmVolumeInput = document.getElementById('bgm-volume');
    this.bgmVolVal = document.getElementById('bgm-vol-val');
    this.customBgmFileInput = document.getElementById('custom-bgm-file');

    // Preview & Render
    this.previewCanvas = document.getElementById('preview-canvas');
    this.resultVideo = document.getElementById('result-video');
    this.previewPlaceholder = document.getElementById('preview-placeholder');
    this.renderingOverlay = document.getElementById('rendering-overlay');
    this.renderPercent = document.getElementById('render-percent');
    this.renderStageText = document.getElementById('render-stage-text');
    this.renderDetailText = document.getElementById('render-detail-text');
    this.renderProgressBar = document.getElementById('render-progress-bar');
    this.statusTag = document.getElementById('status-tag');

    this.currentCardIndicator = document.getElementById('current-card-indicator');
    this.btnPrevCard = document.getElementById('btn-prev-card');
    this.btnNextCard = document.getElementById('btn-next-card');
    this.btnPreviewCurrentSpeech = document.getElementById('btn-preview-current-speech');
    this.btnStartRender = document.getElementById('btn-start-render');
    this.btnDownloadVideo = document.getElementById('btn-download-video');

    // Top actions
    this.btnLoadSample = document.getElementById('btn-load-sample');
    this.btnLoadSampleInline = document.getElementById('btn-load-sample-inline');
    this.btnSaveProject = document.getElementById('btn-save-project');
    this.inputLoadProject = document.getElementById('input-load-project');
    this.btnHelpModal = document.getElementById('btn-help-modal');
    this.helpModal = document.getElementById('help-modal');
    this.btnCloseHelp = document.getElementById('btn-close-help');
    this.btnConfirmHelp = document.getElementById('btn-confirm-help');
  }

  initRenderer() {
    this.videoRenderer = new VideoRenderer(this.previewCanvas);
    this.updateCanvasAspect();
  }

  initEvents() {
    // 1. File Upload & Drag-and-drop
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('border-emerald-500', 'bg-slate-900/80');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('border-emerald-500', 'bg-slate-900/80');
      });
    });

    this.dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      this.handleFiles(files);
    });

    // 2. Clear all
    this.btnClearAll.addEventListener('click', () => {
      if (confirm('모든 카드를 삭제하시겠습니까?')) {
        this.cards = [];
        this.renderCardsList();
        this.updatePreviewCanvas();
      }
    });

    // 3. Sliders & Inputs
    this.speechRateInput.addEventListener('input', (e) => {
      this.rateVal.textContent = `${parseFloat(e.target.value).toFixed(2)}x`;
      this.updateAllCardDurations();
    });

    this.cardPauseInput.addEventListener('input', (e) => {
      this.pauseVal.textContent = `${parseFloat(e.target.value).toFixed(1)}초`;
    });

    this.bgmVolumeInput.addEventListener('input', (e) => {
      const pct = Math.round(parseFloat(e.target.value) * 100);
      this.bgmVolVal.textContent = `${pct}%`;
    });

    this.voiceSelect.addEventListener('change', (e) => {
      window.ttsEngine.setVoiceByName(e.target.value);
    });

    this.btnTestVoice.addEventListener('click', () => {
      window.ttsEngine.speak('안전카드뉴스 음성 합성을 테스트합니다. 오늘도 안전한 하루 되십시오.', parseFloat(this.speechRateInput.value));
    });

    this.aspectRatioSelect.addEventListener('change', () => {
      this.updateCanvasAspect();
      this.updatePreviewCanvas();
    });

    this.subtitleToggle.addEventListener('change', () => this.updatePreviewCanvas());
    this.subtitleStyleSelect.addEventListener('change', () => this.updatePreviewCanvas());

    // 4. Slide Preview Navigation
    this.btnPrevCard.addEventListener('click', () => {
      if (this.currentPreviewIndex > 0) {
        this.currentPreviewIndex--;
        this.updatePreviewCanvas();
      }
    });

    this.btnNextCard.addEventListener('click', () => {
      if (this.currentPreviewIndex < this.cards.length - 1) {
        this.currentPreviewIndex++;
        this.updatePreviewCanvas();
      }
    });

    this.btnPreviewCurrentSpeech.addEventListener('click', () => {
      if (this.cards.length === 0) return;
      const card = this.cards[this.currentPreviewIndex];
      window.ttsEngine.speak(card.script, parseFloat(this.speechRateInput.value));
    });

    // 5. Render Video
    this.btnStartRender.addEventListener('click', () => this.startRendering());

    // 6. Download Video
    this.btnDownloadVideo.addEventListener('click', () => {
      if (!this.videoRenderer.currentUrl) return;
      const a = document.createElement('a');
      a.href = this.videoRenderer.currentUrl;
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `안전카드뉴스_동영상_${today}.${this.videoRenderer.lastExtension || 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    // 7. Sample Templates
    this.btnLoadSample.addEventListener('click', () => this.loadSampleTemplate('confinedSpace'));
    if (this.btnLoadSampleInline) {
      this.btnLoadSampleInline.addEventListener('click', () => this.loadSampleTemplate('confinedSpace'));
    }

    // 8. Project Save & Load
    this.btnSaveProject.addEventListener('click', () => this.saveProject());
    this.inputLoadProject.addEventListener('change', (e) => this.loadProject(e.target.files[0]));

    // 9. Help Modal
    this.btnHelpModal.addEventListener('click', () => this.helpModal.classList.remove('hidden'));
    this.btnCloseHelp.addEventListener('click', () => this.helpModal.classList.add('hidden'));
    this.btnConfirmHelp.addEventListener('click', () => this.helpModal.classList.add('hidden'));
  }

  updateCanvasAspect() {
    const ratio = this.aspectRatioSelect.value;
    this.videoRenderer.setDimensions(ratio);
  }

  /**
   * Handle multiple uploaded image files
   */
  async handleFiles(files) {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await this.readFileAsDataUrl(file);
      const fileName = file.name.replace(/\.[^/.]+$/, "");

      this.cards.push({
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        title: fileName,
        script: `${fileName}에 대한 안전 안내입니다. 안전수칙을 철저히 준수하십시오.`,
        imageUrl: dataUrl,
        originalFileName: file.name
      });
    }

    this.renderCardsList();
    this.updatePreviewCanvas();
  }

  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Load Pre-baked Safety Template
   */
  loadSampleTemplate(key = 'confinedSpace') {
    const tpl = SampleSafetyTemplates[key] || SampleSafetyTemplates.confinedSpace;
    this.cards = tpl.cards.map((c, idx) => ({
      id: 'card_tpl_' + idx + '_' + Date.now(),
      title: c.title,
      script: c.script,
      imageUrl: createSvgCardDataUrl(c, 1080, 1080),
      originalFileName: `sample_${idx + 1}.png`
    }));

    this.currentPreviewIndex = 0;
    this.renderCardsList();
    this.updatePreviewCanvas();
  }

  /**
   * Render the Cards List DOM
   */
  renderCardsList() {
    this.cardCountBadge.textContent = `총 ${this.cards.length}장`;

    if (this.cards.length === 0) {
      this.cardsContainer.innerHTML = `
        <div id="empty-cards-state" class="py-8 text-center text-slate-500 text-sm">
          등록된 카드가 없습니다. 상단에서 이미지를 추가하거나 
          <button id="btn-load-sample-inline" class="text-amber-400 hover:underline font-medium">안전 템플릿 예시</button>를 불러와보세요!
        </div>
      `;
      const btn = document.getElementById('btn-load-sample-inline');
      if (btn) btn.addEventListener('click', () => this.loadSampleTemplate('confinedSpace'));
      this.btnClearAll.classList.add('hidden');
      this.currentPreviewIndex = 0;
      this.previewPlaceholder.classList.remove('hidden');
      this.updateIndicators();
      return;
    }

    this.btnClearAll.classList.remove('hidden');
    this.previewPlaceholder.classList.add('hidden');

    const rate = parseFloat(this.speechRateInput.value);

    let html = '';
    this.cards.forEach((card, index) => {
      const estSec = window.ttsEngine.estimateDuration(card.script, rate);
      const isSelected = (index === this.currentPreviewIndex);

      html += `
        <div class="card-item bg-slate-950/70 border ${isSelected ? 'border-emerald-500 shadow-md shadow-emerald-500/10' : 'border-slate-800'} rounded-xl p-3.5 flex flex-col sm:flex-row gap-3.5 items-start sm:items-center relative group" data-id="${card.id}" data-index="${index}">
          
          <!-- Drag Handle & Index Badge -->
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center border border-slate-700">
              ${index + 1}
            </span>
            <div class="w-16 h-16 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0 cursor-pointer card-thumb" data-index="${index}">
              <img src="${card.imageUrl}" class="w-full h-full object-cover" alt="Card ${index + 1}">
            </div>
          </div>

          <!-- Script & Title Editor -->
          <div class="flex-1 w-full space-y-1.5">
            <div class="flex items-center justify-between">
              <input type="text" class="card-title-input text-xs font-bold text-slate-200 bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none px-1 py-0.5 w-2/3" value="${this.escapeHtml(card.title)}" placeholder="카드 제목 (예: 1. 안전수칙 준수)" data-index="${index}">
              <div class="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <i data-lucide="clock" class="w-3 h-3 text-emerald-400 inline"></i>
                <span class="card-duration-text">약 ${estSec}초</span>
              </div>
            </div>

            <!-- Narration Script Textarea -->
            <div class="relative">
              <textarea rows="2" class="card-script-input w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600 transition-colors" placeholder="이 카드가 나올 때 읽어줄 나레이션 대본을 입력하세요..." data-index="${index}">${this.escapeHtml(card.script)}</textarea>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex sm:flex-col items-center gap-1 sm:self-center">
            <button class="btn-play-card p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg border border-slate-700 transition-all" title="이 카드 음성 미리듣기" data-index="${index}">
              <i data-lucide="volume-2" class="w-4 h-4"></i>
            </button>
            <button class="btn-move-up p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}" title="위로 이동" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
              <i data-lucide="chevron-up" class="w-4 h-4"></i>
            </button>
            <button class="btn-move-down p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors ${index === this.cards.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}" title="아래로 이동" data-index="${index}" ${index === this.cards.length - 1 ? 'disabled' : ''}>
              <i data-lucide="chevron-down" class="w-4 h-4"></i>
            </button>
            <button class="btn-delete-card p-1.5 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors" title="카드 삭제" data-index="${index}">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

        </div>
      `;
    });

    this.cardsContainer.innerHTML = html;
    lucide.createIcons();

    // Bind card element events
    this.bindCardEvents();
    this.updateIndicators();
  }

  bindCardEvents() {
    // Title changes
    document.querySelectorAll('.card-title-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.cards[idx].title = e.target.value;
      });
    });

    // Script changes
    document.querySelectorAll('.card-script-input').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index);
        this.cards[idx].script = e.target.value;

        // Update duration badge
        const rate = parseFloat(this.speechRateInput.value);
        const estSec = window.ttsEngine.estimateDuration(e.target.value, rate);
        const parent = textarea.closest('.card-item');
        const durBadge = parent.querySelector('.card-duration-text');
        if (durBadge) durBadge.textContent = `약 ${estSec}초`;

        if (idx === this.currentPreviewIndex) {
          this.updatePreviewCanvas();
        }
      });
    });

    // Thumbnail click to preview
    document.querySelectorAll('.card-thumb').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        this.currentPreviewIndex = idx;
        this.renderCardsList();
        this.updatePreviewCanvas();
      });
    });

    // Play TTS per card
    document.querySelectorAll('.btn-play-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        const card = this.cards[idx];
        const rate = parseFloat(this.speechRateInput.value);
        window.ttsEngine.speak(card.script, rate);
      });
    });

    // Move Up
    document.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        if (idx > 0) {
          const temp = this.cards[idx];
          this.cards[idx] = this.cards[idx - 1];
          this.cards[idx - 1] = temp;
          this.currentPreviewIndex = idx - 1;
          this.renderCardsList();
          this.updatePreviewCanvas();
        }
      });
    });

    // Move Down
    document.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        if (idx < this.cards.length - 1) {
          const temp = this.cards[idx];
          this.cards[idx] = this.cards[idx + 1];
          this.cards[idx + 1] = temp;
          this.currentPreviewIndex = idx + 1;
          this.renderCardsList();
          this.updatePreviewCanvas();
        }
      });
    });

    // Delete Card
    document.querySelectorAll('.btn-delete-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index);
        this.cards.splice(idx, 1);
        if (this.currentPreviewIndex >= this.cards.length) {
          this.currentPreviewIndex = Math.max(0, this.cards.length - 1);
        }
        this.renderCardsList();
        this.updatePreviewCanvas();
      });
    });
  }

  updateAllCardDurations() {
    const rate = parseFloat(this.speechRateInput.value);
    document.querySelectorAll('.card-item').forEach(item => {
      const idx = parseInt(item.dataset.index);
      if (this.cards[idx]) {
        const estSec = window.ttsEngine.estimateDuration(this.cards[idx].script, rate);
        const durBadge = item.querySelector('.card-duration-text');
        if (durBadge) durBadge.textContent = `약 ${estSec}초`;
      }
    });
  }

  updateIndicators() {
    if (this.cards.length === 0) {
      this.currentCardIndicator.textContent = '카드 0 / 0';
      this.btnPrevCard.disabled = true;
      this.btnNextCard.disabled = true;
    } else {
      this.currentCardIndicator.textContent = `카드 ${this.currentPreviewIndex + 1} / ${this.cards.length}`;
      this.btnPrevCard.disabled = (this.currentPreviewIndex === 0);
      this.btnNextCard.disabled = (this.currentPreviewIndex === this.cards.length - 1);
    }
  }

  /**
   * Update the live canvas preview with current card
   */
  async updatePreviewCanvas() {
    this.updateIndicators();

    if (this.cards.length === 0) {
      this.previewPlaceholder.classList.remove('hidden');
      return;
    }

    this.previewPlaceholder.classList.add('hidden');
    const card = this.cards[this.currentPreviewIndex];

    const subtitleOpts = {
      enabled: this.subtitleToggle.checked,
      style: this.subtitleStyleSelect.value
    };

    try {
      const img = await this.videoRenderer.loadImage(card.imageUrl);
      this.videoRenderer.drawCardFrame(img, card.script, subtitleOpts, 1.0);
    } catch (err) {
      console.warn("Failed to load preview image:", err);
    }
  }

  /**
   * Start Video Rendering & Export
   */
  async startRendering() {
    if (this.cards.length === 0) {
      alert("먼저 카드 뉴스 이미지를 1장 이상 등록해주세요.");
      return;
    }

    this.isRendering = true;
    this.statusTag.textContent = "제작 중...";
    this.statusTag.className = "text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse";
    this.renderingOverlay.classList.remove('hidden');
    this.resultVideo.classList.add('hidden');
    this.btnDownloadVideo.classList.add('hidden');

    const transitionInput = document.querySelector('input[name="transition-style"]:checked');

    const settings = {
      aspectRatio: this.aspectRatioSelect.value,
      speechRate: parseFloat(this.speechRateInput.value),
      cardPause: parseFloat(this.cardPauseInput.value),
      showSubtitles: this.subtitleToggle.checked,
      subtitleStyle: this.subtitleStyleSelect.value,
      bgmType: this.bgmSelect.value,
      bgmVolume: parseFloat(this.bgmVolumeInput.value),
      transitionStyle: transitionInput ? transitionInput.value : 'fade'
    };

    try {
      const result = await this.videoRenderer.renderVideo(this.cards, settings, (percent, stage, detail) => {
        this.renderPercent.textContent = `${percent}%`;
        this.renderProgressBar.style.width = `${percent}%`;
        this.renderStageText.textContent = stage;
        this.renderDetailText.textContent = detail;
      });

      this.videoRenderer.lastExtension = result.extension;
      this.renderingOverlay.classList.add('hidden');
      this.resultVideo.src = result.url;
      this.resultVideo.classList.remove('hidden');
      this.resultVideo.play();

      this.btnDownloadVideo.classList.remove('hidden');
      this.statusTag.textContent = "완료됨";
      this.statusTag.className = "text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";

    } catch (err) {
      this.renderingOverlay.classList.add('hidden');
      this.statusTag.textContent = "오류";
      this.statusTag.className = "text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30";
      alert("동영상 제작 중 오류가 발생했습니다: " + err.message);
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Save Project as JSON
   */
  saveProject() {
    const data = {
      version: "1.0",
      createdAt: new Date().toISOString(),
      cards: this.cards,
      settings: {
        aspectRatio: this.aspectRatioSelect.value,
        speechRate: this.speechRateInput.value,
        cardPause: this.cardPauseInput.value,
        showSubtitles: this.subtitleToggle.checked,
        subtitleStyle: this.subtitleStyleSelect.value,
        bgmType: this.bgmSelect.value,
        bgmVolume: this.bgmVolumeInput.value
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `안전카드뉴스_프로젝트_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Load Project from JSON
   */
  loadProject(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.cards && Array.isArray(data.cards)) {
          this.cards = data.cards;
          if (data.settings) {
            if (data.settings.aspectRatio) this.aspectRatioSelect.value = data.settings.aspectRatio;
            if (data.settings.speechRate) {
              this.speechRateInput.value = data.settings.speechRate;
              this.rateVal.textContent = `${parseFloat(data.settings.speechRate).toFixed(2)}x`;
            }
            if (data.settings.cardPause) {
              this.cardPauseInput.value = data.settings.cardPause;
              this.pauseVal.textContent = `${parseFloat(data.settings.cardPause).toFixed(1)}초`;
            }
            if (data.settings.showSubtitles !== undefined) this.subtitleToggle.checked = data.settings.showSubtitles;
            if (data.settings.subtitleStyle) this.subtitleStyleSelect.value = data.settings.subtitleStyle;
            if (data.settings.bgmType) this.bgmSelect.value = data.settings.bgmType;
            if (data.settings.bgmVolume) {
              this.bgmVolumeInput.value = data.settings.bgmVolume;
              this.bgmVolVal.textContent = `${Math.round(parseFloat(data.settings.bgmVolume) * 100)}%`;
            }
          }
          this.currentPreviewIndex = 0;
          this.renderCardsList();
          this.updateCanvasAspect();
          this.updatePreviewCanvas();
          alert("프로젝트를 성공적으로 불러왔습니다!");
        }
      } catch (err) {
        alert("프로젝트 파일 형식이 올바르지 않습니다.");
      }
    };
    reader.readAsText(file);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.safetyApp = new SafetyCardApp();
});
