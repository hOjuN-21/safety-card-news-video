# 🛡️ 사내 안전카드뉴스 비디오 메이커 (Safety Card-to-Video)

> **사내 안전카드 뉴스 이미지에 고품질 AI 음성(TTS)과 자막, 배경음악(BGM)을 입혀 원클릭으로 MP4 동영상으로 제작하는 웹 애플리케이션**  
> 100% 브라우저 클라이언트 사이드 기반으로 동작하여 **서버 설치 없이 바로 실행** 가능하며, **GitHub Pages**를 통해 사내 임직원 누구나 웹 링크로 접속해 활용할 수 있습니다.

---

## ✨ 핵심 기능

1. **🎨 직관적인 카드뉴스 관리 (Drag & Drop)**
   - 여러 장의 안전 카드 이미지(PNG, JPG, WebP) 일괄 등록 및 순서 변경
   - 카드별 실시간 썸네일 미리보기 및 개별 대본 편집
   - **원클릭 안전 템플릿 예시 불러오기** 기능 탑재 (밀폐공간 3대 수칙, 고소작업 추락예방 등)

2. **🎙️ 고품질 한국어 AI 음성 (TTS)**
   - 브라우저 내장 신경망 음성 지원 (차분한 안내 톤, 신뢰감 있는 남성/여성 성우)
   - 나레이션 속도(0.7x ~ 1.4x) 및 카드 간 여유 간격(Pause) 정밀 제어
   - 카드별 즉시 음성 미리듣기(Preview) 지원

3. **📝 자막 & 배경음악(BGM) 스타일링**
   - 가독성 높은 한국어 자막 자동 래핑 및 오버레이 (하단 바, 플로팅 캡슐, 텍스트 섀도우 등)
   - 차분한 안전 교육용 앰비언트 BGM 내장 및 볼륨 믹싱 (1% ~ 30%)
   - 카드 간 부드러운 전환 효과 (페이드, 슬라이드, 컷)

4. **🎬 고화질 동영상(MP4/WebM) 렌더링 & 다운로드**
   - 1:1 (정사각형/메신저용), 4:5 (모바일 최적화), 16:9 (사이니지/전광판용) 비율 지원
   - 실시간 진행률(Progress Bar) 표시 및 렌더링 완료 즉시 브라우저 재생 및 파일 다운로드

5. **🔒 100% 사내 프라이버시 보호**
   - 모든 이미지와 대본은 외부 서버로 전송되지 않고 사용자의 웹 브라우저 내에서만 안전하게 처리됩니다.

6. **💾 프로젝트 저장 & 불러오기**
   - 작업 중인 카드와 대본을 `.json` 파일로 저장하고 언제든 다시 불러와 재수정 가능

---

## 🚀 사용 방법

### 방법 1. 로컬에서 바로 실행하기 (가장 간단)
1. 다운로드한 폴더의 `index.html` 파일을 더블 클릭하여 크롬(Chrome), 엣지(Edge), 웨일(Whale) 등 최신 브라우저에서 열면 즉시 실행됩니다.

### 방법 2. GitHub Pages를 통해 사내 웹 링크로 배포하기 (추천)
1. 이 프로젝트를 본인의 GitHub 저장소(Repository)에 푸시합니다.
   ```bash
   git init
   git add .
   git commit -m "feat: Safety Card-to-Video Web App initial commit"
   git remote add origin https://github.com/사용자아이디/저장소이름.git
   git branch -M main
   git push -u origin main
   ```
2. GitHub 저장소의 **Settings** 탭으로 이동합니다.
3. 좌측 메뉴에서 **Pages**를 클릭합니다.
4. **Build and deployment > Source**에서 **GitHub Actions** 또는 **Deploy from a branch (`main` / root)**를 선택합니다.
5. 1분 후 발급되는 `https://사용자아이디.github.io/저장소이름/` 링크로 접속하면 사내 어디서나 웹페이지로 이용할 수 있습니다.

---

## 📂 파일 구조

```plaintext
안전카드뉴스/
├── index.html                  # 메인 웹페이지 UI
├── css/
│   └── styles.css              # 커스텀 스타일 & 애니메이션
├── js/
│   ├── app.js                  # 메인 UI 상태 및 이벤트 컨트롤러
│   ├── tts-engine.js           # 브라우저 음성 합성(TTS) & BGM 오디오 엔진
│   ├── video-renderer.js       # 캔버스 자막/슬라이드 렌더러 & 비디오 인코더
│   └── sample-data.js          # 안전수칙 샘플 템플릿 & SVG 그래픽 생성기
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages 자동 배포 워크플로우
├── .gitignore
└── README.md                   # 프로젝트 설명서
```

---

## 💡 권장 환경
- **브라우저**: Google Chrome, Microsoft Edge, Naver Whale, Safari (최신 버전 권장)
- **카드 이미지 권장 규격**: 1080×1080 (1:1) 또는 1080×1350 (4:5)
