# https://grtwa123-cmyk.github.io/science-experiment-physics-/ 링크
  누를시 즉시 실행 
  단일 html 이 아닌 여러 파일 연결로 충돌회피 하였습니다 그래서 찌그러짐 현상이 없고 다른 안정성도 챙겼습니다.




  
## 📦 포함된 시뮬레이터 (6종)

| 시뮬레이터 | 핵심 개념 | 단원 |
|-----------|----------|------|
| 다이오드 | PN 접합, 문턱 전압, 정류 작용 | Ⅳ. 신소재와 반도체 |
| 발광 다이오드(LED) | 전자-양공 결합, 광자 방출, 색상별 문턱 전압 | Ⅳ. 신소재와 반도체 |
| NPN 트랜지스터 | 전류 증폭(β), 차단·활성·포화 영역 | Ⅳ. 신소재와 반도체 |
| 옴의 법칙 | V = IR, 전력, 줄 열 | Ⅲ. 전기와 자기 |
| 직렬·병렬 저항 | 합성 저항 | Ⅲ. 전기와 자기 |
| 축전기 충·방전 | 전하 저장, 시간 상수 τ = RC | Ⅲ. 전기와 자기 |

## 🔬 물리 모델

- **다이오드 / LED**: 다이오드 방정식의 지수적 무릎과 보호저항에 의한 선형 제한을 합친
  소프트플러스 모델 `I(V) = (Vₜ/Rₚ)·ln(1 + e^((V−Vₜₕ)/Vₜ))` 사용.
- **NPN 트랜지스터**: 교과서 표준 모델 `Iᴮ = (Vᴮ−0.7)/Rᴮ`, `Iᴄ = β·Iᴮ` (β=100),
  포화 시 `Iᴄ = (Vcc−Vce_sat)/Rᴄ`. 베이스-이미터 접합 전압 Vᴮᴱ는 도통 시 약 0.7V로 표시.
- **옴의 법칙**: `I = V/R`, `P = VI`.
- **직렬·병렬**: 직렬 `R = R₁+R₂`, 병렬 `R = (R₁R₂)/(R₁+R₂)`.
- **축전기**: `τ = RC`, 충전 `V(t) = V₀(1−e^(−t/τ))`, 방전 `V(t) = V₀·e^(−t/τ)`.

## 📁 파일 구조

```
circuit-simulator/
├── index.html              메인 메뉴 (6개 시뮬레이터로 이동)
├── diode.html              다이오드
├── led.html                발광 다이오드
├── transistor.html         NPN 트랜지스터
├── ohm.html                옴의 법칙
├── series-parallel.html    직렬·병렬 저항
├── capacitor.html          축전기 충·방전
├── css/
│   └── styles.css          공통 스타일
└── js/
    ├── common.js           공통 유틸리티(캔버스·수학·UI 헬퍼)
    ├── diode.js
    ├── led.js
    ├── transistor.js
    ├── ohm.js
    ├── series-parallel.js
    └── capacitor.js
```

## 🚀 실행 방법

`index.html`을 브라우저로 열기만 하면 됩니다. 빌드나 설치가 필요 없습니다.


## 🛠 기술 스택

- HTML5 Canvas (회로 애니메이션)
- [Chart.js](https://www.chartjs.org/) 4.4.1 (그래프, CDN 로드)
- 의존성 없는 순수 JavaScript

## 📄 라이선스

MIT License — 자유롭게 사용·수정·배포할 수 있습니다. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.
