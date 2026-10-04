// ===== [모바일] 화면 배율 / 카메라 =====
// 모바일에서는 무대(#render-stage) 전체를 CSS zoom으로 축소해서 보여줌.
// 무대 좌표(START_X 등)는 그대로 두고, 화면↔무대 좌표 변환이 필요한 곳만 VIEW_ZOOM으로 나눔.
window.VIEW_ZOOM = 1;
window.CAMERA_TOP_INSET = 0;    // 상단 바에 가려지는 높이(px) — app.js가 채움
window.CAMERA_BOTTOM_INSET = 0; // 하단 자판/입력창에 가려지는 높이(px) — app.js가 채움
let cameraLocked = false;       // 정원 보기에서 개체를 한꺼번에 심는 동안 카메라가 따라다니지 않게

const IMAGE_CONFIG = {
  A: { scale: 0.65, offsetY: 0 }, B: { scale: 1.7, offsetY: 0 }, C: { scale: 1.2, offsetY: 0 },
  D: { scale: 1.3, offsetY: 0 }, E: { scale: 1.7, offsetY: 0 }, F: { scale: 1.74, offsetY: 0 },
  G: { scale: 1.6, offsetY: 0 }, H: { scale: 1.9, offsetY: 0 }, I: { scale: 1.5, offsetY: 0 },
  J: { scale: 1.5, offsetY: 0 }, K: { scale: 2.3, offsetY: 0 }, L: { scale: 1.5, offsetY: 0 },
  M: { scale: 1.28, offsetY: 0 }, N: { scale: 2.0, offsetY: 0 }, O: { scale: 1.3, offsetY: 0 },
  P: { scale: 1.5, offsetY: 0 }, Q: { scale: 1.4, offsetY: 0 }, R: { scale: 1.7, offsetY: 0 },
  S: { scale: 1.95, offsetY: 0 }, T: { scale: 1.7, offsetY: 0 }, U: { scale: 1.3, offsetY: 0 },
  V: { scale: 1.2, offsetY: 0 }, W: { scale: 1.7, offsetY: 0 }, X: { scale: 1.7, offsetY: 0 },
  Y: { scale: 1.05, offsetY: 0 }, Z: { scale: 1.0, offsetY: 0 },
  A1: { scale: 0.9, isMutant: true }, A2: { scale: 1.0, isMutant: true }, A3: { scale: 1.2, isMutant: true },
  A4: { scale: 1.3, isMutant: true }, A5: { scale: 1.4, isMutant: true }, A6: { scale: 1.6, isMutant: true },
  A7: { scale: 1.7, isMutant: true }, A8: { scale: 1.9, isMutant: true },
  A_STACK1: { scale: 0.6, isMutant: true }, A_STACK2: { scale: 0.6, isMutant: true },
  A_STACK3: { scale: 0.6, isMutant: true }, A_STACK4: { scale: 0.6, isMutant: true },
  A_STACK5: { scale: 0.6, isMutant: true }, Q1: { scale: 0.8, isMutant: true },
  IC_INTER: { scale: 1.3, isMutant: true }, AK_INTER: { scale: 1.3, isMutant: true },
  AK_INTER1: { scale: 1.9, offsetY: -50, isMutant: true }, AB_INTER: { scale: 1.3, offsetY: -10, isMutant: true },
  AC_COMBO: { scale: 1.0, isMutant: true }, AC_INTER1: { scale: 1.0, offsetY: -60, isMutant: true },
  RANDOM_CHAR: { scale: 0.93, isMutant: true }, DT_INTER: { scale: 1.4, offsetY: -5, isMutant: true },
  HT_INTER: { scale: 0.7, isMutant: true }, DT_DELAYED: { scale: 1.8, offsetY: -90, isMutant: true },
  K_INTER1: { scale: 0.9, isMutant: true }, K_INTER2: { scale: 1.3, isMutant: true }, K_INTER3: { scale: 1.9, isMutant: true },
  W1: { scale: 1.0, isMutant: true }, W2: { scale: 1.1, isMutant: true }, W3: { scale: 1.0, isMutant: true },
  W4: { scale: 0.9, isMutant: true }, W5: { scale: 1.2, isMutant: true }, W6: { scale: 1.0, isMutant: true },
  W7: { scale: 1.3, isMutant: true }, W8: { scale: 1.7, isMutant: true }, W9: { scale: 3.0, isMutant: true },
  Z2: { scale: 1.0, isMutant: true }, ECHEVERIA_MASTER: { scale: 2.8, isMutant: true },
  "CG_INTER": { scale: 1.4, offsetY: -10, isMutant: true },
  "U_INTER": { scale: 1.7, isMutant: true },
  "Y_INTER1": { scale: 2.0, isMutant: true }, "Y_INTER2": { scale: 2.0, isMutant: true },
  "DOT_MARK": { scale: 1.5, isMutant: true }, "BANG_RANDOM": { scale: 0.9, isMutant: true }
};

// Z는 조각 파일이 없고 완성 이미지(Z.png)도 폴더에 없으므로, 같은 계열인 Z2(parts)로 대체해서 보여줌
const IMAGE_FALLBACK_MAP = { AC_INTER1: "AC_COMBO", W5: "W4", Z2: "Z", DT_DELAYED: "DT_INTER", Z: "Z2" };

// 변이(mutant) 이미지들 중 images/parts/ 폴더에 새로 올라간 것들 - 이 목록에 있으면
// ./images/ 대신 ./images/parts/ 에서 불러옴 (없는 이름은 그대로 ./images/ 사용,
// 예: 단일 알파벳 A~Z 완성 이미지는 계속 ./images/ 그대로)
const PARTS_FOLDER_NAMES = new Set([
  "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8",
  "AB_INTER", "AC_COMBO", "AC_INTER1", "AK_INTER", "AK_INTER1",
  "A_STACK1", "A_STACK2", "A_STACK3", "A_STACK4", "A_STACK5",
  "BANG_RANDOM", "DOT_MARK", "DT_DELAYED", "DT_INTER",
  "ECHEVERIA_MASTER", "HT_INTER", "IC_INTER",
  "K_INTER1", "K_INTER2", "K_INTER3",
  "Q1", "RANDOM_CHAR", "U_INTER",
  "W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9",
  "Y_INTER1", "Y_INTER2", "Z2"
]);

function resolveImagePath(name) {
  return PARTS_FOLDER_NAMES.has(name)
    ? `${SPLIT_LAYER_PATH_PREFIX}${name}.webp`
    : `./images/${name}.png`;
}

// ===== 다육이 알파벳 - 조각 분리 이미지 시스템 =====
// 기존에는 한 글자당 완성된 합성 이미지 1장(A.png, B.png ...)이었지만,
// 그 합성 이미지를 이루던 개별 다육이 조각들을 낱장 PNG로 분리해서
// (images/parts/ 폴더) 같은 위치·같은 캔버스 크기로 겹쳐 쌓으면 기존 이미지와
// 동일하게 보이도록 구성함. 여기 등록되지 않은 글자(Z)는 조각 파일이 없으므로
// 기존 방식대로 완성된 이미지(Z.png)를 그대로 사용.
const SPLIT_LAYER_MAP = {
  A: ["a"],
  B: ["b-0", "b-1", "b-2"],
  C: ["c-0", "c-1", "c-2"],
  D: ["d-0", "d-1", "d-2"],
  E: ["e-0", "e-1", "e-2", "e-3", "e-4"],
  F: ["f-0", "f-1", "f-2", "f-3"],
  G: ["g-0", "g-1", "g-2"],
  H: ["h-0", "h-1", "h-2"],
  I: ["i-0", "i-1", "i-2", "i-3"],
  J: ["j-0", "j-1", "j-2", "j-3"],
  K: ["k-0", "k-1", "k-2", "k-3"],
  L: ["l-0", "l-1", "l-2", "l-3", "l-4"],
  M: ["m-0", "m-1", "m-2", "m-3"],
  N: ["n-0", "n-1", "n-2", "n-3", "n-4"],
  O: ["o-0", "o-1", "o-2"],
  P: ["p-0", "p-1", "p-2", "p-3"],
  Q: ["q-0", "q-1", "q-2"],
  R: ["r-0", "r-1", "r-2"],
  S: ["s-0", "s-1", "s-3"], // 원본 조각 파일 중 s-2가 누락되어 있음
  T: ["t-0", "t-1", "t-2"],
  U: ["u-0"],
  V: ["v-0", "v-1", "v-2", "v-3"],
  W: ["w-0", "w-1", "w-2"],
  X: ["x-0", "x-1", "x-2", "x-3"],
  Y: ["y-1"] // 원본 조각 파일 중 y-0이 누락되어 있음
  // Z: 분리된 조각 파일이 없어 기존 Z.png(완성 이미지)를 그대로 사용
};

// 글자별 분리 조각들의 공통 캔버스 세로/가로 비율 — 조각들을 겹쳐 쌓았을 때
// 기존 합성 이미지와 동일한 배치가 되도록 함 (조각마다 캔버스 크기가 서로 동일함)
const SPLIT_LAYER_RATIO = {
  A: 1030 / 967,
  B: 983 / 2200,
  C: 2949 / 1788,
  D: 3542 / 2049,
  E: 2988 / 2059,
  F: 3281 / 2178,
  G: 2806 / 1980,
  H: 2324 / 2591,
  I: 4051 / 2186,
  J: 4051 / 2186,
  K: 3318 / 3343,
  L: 3589 / 1971,
  M: 3357 / 1955,
  N: 3019 / 3928,
  O: 3009 / 2462,
  P: 3165 / 1633,
  Q: 3743 / 1857,
  R: 3728 / 2023,
  S: 4052 / 2470,
  T: 2653 / 2520,
  U: 1947 / 2196,
  V: 2939 / 1826,
  W: 2651 / 2464,
  X: 3286 / 2800,
  Y: 2609 / 1614
};

const SPLIT_LAYER_PATH_PREFIX = "./images/parts/";

// 조각 이미지 하나를 로드하는 공용 함수. 이미 캐시에 있으면 즉시 반환하고,
// 이미 로딩 중이면 그 로딩 중인 요청을 그대로 재사용(진행 중인 Promise 공유)해서
// 같은 글자를 빠르게 여러 번 타이핑해도 같은 이미지를 중복으로 다시 받아오지 않게 함.
const splitLayerLoading = {};
function loadSplitLayerImage(layerName) {
  const cacheKey = `parts/${layerName}`;
  if (imageCache[cacheKey]) return Promise.resolve(imageCache[cacheKey]);
  if (splitLayerLoading[cacheKey]) return splitLayerLoading[cacheKey];

  const promise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.fetchPriority = "high";
    img.onload = async () => {
      try {
        if (img.decode) await img.decode();
      } catch (e) {}
      imageCache[cacheKey] = img;
      delete splitLayerLoading[cacheKey];
      resolve(img);
    };
    img.onerror = () => {
      console.warn("이미지 로드 실패:", cacheKey);
      delete splitLayerLoading[cacheKey];
      resolve(null);
    };
    img.src = `${SPLIT_LAYER_PATH_PREFIX}${layerName}.webp`;
  });

  splitLayerLoading[cacheKey] = promise;
  return promise;
}

// ===== 숫자 타이핑 시스템 (다육이 성장 로직과 완전히 분리된 독립 레이어) =====
// 1~9는 각각 01.png ~ 09.png (가볍고 작을수록 작은 숫자에 배당된 이미지)
// 0은 연속으로 누를수록 0 -> 00 -> 000 순으로 순환 (더 크고 무거운 알갱이)
const NUMBER_IMAGE_CONFIG = {
  "1": "01", "2": "02", "3": "03", "4": "04", "5": "05",
  "6": "06", "7": "07", "8": "08", "9": "09"
};
const NUMBER_ZERO_VARIANTS = ["0", "00", "000"];
const NUMBER_FILE_LIST = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "0", "00", "000"];
const NUMBER_ONE_SCATTER_MIN = 5;
const NUMBER_ONE_SCATTER_MAX = 7;

// ===== 기호 타이핑 시스템 =====
// 이미지 파일명이 기호 그대로임 (".png, @.png, *.png, &.png, %.png)
const SYMBOL_IMAGE_CONFIG = {
  "\"": "\"", "@": "@", "*": "*", "&": "&", "%": "%"
};
const SYMBOL_FILE_LIST = ["\"", "@", "*", "&", "%"];

// 이미지별 상대적 크기 비율 (숫자 + 기호 공통, 참고 이미지 속 실제 원본 크기 차이를 반영)
// 작은 보석/구슬류는 작게, 돌멩이류로 갈수록 훨씬 크게
const STONE_SCALE_CONFIG = {
  "01": 0.6, "02": 0.85, "03": 1.05, "04": 1.1, "05": 1.8,
  "06": 1.85, "07": 2.8, "08": 2.85, "09": 2.9,
  "0": 0.75, "00": 0.8, "000": 0.85,
  // 기호 - 각각 대응하는 숫자 이미지와 같은 종류라 동일한 비율 사용
  "\"": 0.6, "@": 1.05, "*": 0.85, "&": 1.85, "%": 1.1
};
const NUMBER_BASE_WIDTH = 70; // 가장 작은 숫자 기준 픽셀 크기 (다육이와 확실히 섞이도록 큼직하게)
const NUMBER_OVERLAP = 14; // 숫자끼리 겹치는 정도 (px)

// 타이핑할 때마다 전체 시퀀스를 처음부터 다시 그리는 구조라서, 여기서 Math.random()을 쓰면
// 매 키 입력마다 이미 놓인 돌들의 위치/회전이 계속 바뀌어 깜빡이는 것처럼 보임.
// 그래서 "몇 번째로 생성된 돌인지"를 시드로 쓰는 결정론적 의사난수를 사용 -> 같은 시퀀스는 항상 같은 결과
let stoneSeedCounter = 0;
function nextStoneSeed() {
  stoneSeedCounter += 1;
  return stoneSeedCounter;
}
function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}


const SPECIES_MAP = {
  A: "에케베리아 아가보이데스 크리스마스 / Echeveria agavoides Christmas", B: "홍포도 / Graptoveria Amethorum", C: "황금세덤 / Sedum acre",
  D: "천탑 / Crassula capitella", E: "수련 / Echeveria Suryeon", F: "러블리 로즈 / Graptoveria Lovely Rose",
  G: "루비틴트 / Sedum Ruby Tint", H: "비스코사 / Haworthiopsis viscosa", I: "옵투사 / Haworthia cymbiformis var. obtusa",
  J: "트리코디아데마 덴섬 / Trichodiadema densum", K: "황금사 / Mammillaria elongata", L: "하월시아 교배종 / Haworthia hyb.",
  M: "십이지권 / Haworthiopsis attenuata", N: "백화기린 / Euphorbia mammillaris cv. variegata", O: "가스테리아 백복륜금 / Gasteria White Variegated",
  P: "에케베리아 환엽 버밀리언", Q: "가스테리아 그라실리스 / Gasteria armstrongii", R: "원종 프리티금 / Echeveria cv. Rezry",
  S: "아미산 / Euphorbia gabizan", T: "오층탑 / Haworthia hyb. Manda", U: "리톱스 / Lithops", V: "리톱스 / Lithops",
  W: "리톱스 군생", X: "왕서각 꽃 / Stapelia", Y: "왕서각 / Stapelia", Z: "왕서각 군생",
  A1: "A sequence mutant", A2: "A sequence mutant", A3: "A sequence mutant", A4: "A sequence mutant",
  A5: "A sequence mutant", A6: "A sequence mutant", A7: "A sequence mutant", A8: "A sequence mutant",
  A_STACK1: "A vertical stack mutant", A_STACK2: "A vertical stack mutant", A_STACK3: "A vertical stack mutant",
  A_STACK4: "A vertical stack mutant", A_STACK5: "A vertical stack mutant", AB_INTER: "에케베리아 홍포도 변이종 / Echeveria chihuahuensis mut.",
  AC_COMBO: "A-C hybridized mutant", AC_INTER1: "A-C derived mutant", AK_INTER: "A-K intermediate mutant",
  AK_INTER1: "A-K derived mutant", IC_INTER: "I-C intermediate mutant", DT_INTER: "D-T intermediate mutant",
  HT_INTER: "H-T intermediate mutant", DT_DELAYED: "D-T delayed mutant", Q1: "Q derived mutant",
  RANDOM_CHAR: "random generated mutant", K_INTER1: "K diagonal mutant", K_INTER2: "K diagonal mutant", K_INTER3: "K diagonal mutant",
  W1: "W derived cluster", W2: "W derived cluster", W3: "W derived cluster", W4: "W derived cluster",
  W5: "W derived cluster", W6: "W derived cluster", W7: "W derived cluster", W8: "W derived cluster",
  W9: "W derived cluster", Z2: "Z derived cluster", ECHEVERIA_MASTER: "Echeveria master cluster",
  "CG_INTER": "C-G intermediate mutant", "U_INTER": "U sequence mutant", "Y_INTER1": "Y sequence mutant", "Y_INTER2": "Y sequence mutant",
  "DOT_MARK": "period mark mutant", "BANG_RANDOM": "exclamation mark mutant"
};

const GENETIC_MAP = {
  A: { x: 190, y: -200 }, B: { x: 220, y: -170 }, C: { x: 70, y: -80 }, D: { x: 30, y: -50 }, E: { x: 160, y: -220 },
  F: { x: 240, y: -190 }, G: { x: 100, y: -60 }, H: { x: 140, y: -40 }, I: { x: 160, y: -20 }, J: { x: -70, y: 120 },
  K: { x: 300, y: 200 }, L: { x: 190, y: 100 }, M: { x: 70, y: 150 }, N: { x: -150, y: 150 }, O: { x: 210, y: 70 },
  P: { x: 280, y: -160 }, Q: { x: 180, y: 120 }, R: { x: 200, y: -230 }, S: { x: -110, y: 180 }, T: { x: 230, y: 90 },
  U: { x: -170, y: 220 }, V: { x: 110, y: -20 }, W: { x: -200, y: 240 }, X: { x: -250, y: 180 }, Y: { x: -270, y: 160 }, Z: { x: -230, y: 200 }
};

const GROWTH_STRUCTURE = {
  A: "rosette", B: "rosette", C: "creeping", D: "tower", E: "rosette", F: "rosette", G: "creeping", H: "radial-short",
  I: "radial-short", J: "branching", K: "cactus-column", L: "radial-short", M: "tower", N: "euphorbia-column",
  O: "fan-radial", P: "rosette", Q: "fan-radial", R: "rosette", S: "euphorbia-branch", T: "tower", U: "lithops",
  V: "lithops", W: "cluster", X: "stapelia-flower", Y: "stapelia-column", Z: "stapelia-cluster"
};

// 같은 생장 타입(=같은 "속")에 속하는 다육이들은 등장 모션과 X-ray 색상 톤을 공유함.
// motion: 타이핑 시 재생되는 CSS 진입 애니메이션 종류 (style.css의 .motion-* 클래스와 대응)
// hue: X-ray 뷰에서 초록색 베이스를 이 각도만큼 색상환을 돌려서 속(genus)별로 구분되게 함
// X-ray는 모든 식물을 같은 초록으로 통일 (속별 색조 구분 없음 — hue 전부 0)
const GENUS_STYLE = {
  rosette: { motion: "bloom", hue: 0 },
  "fan-radial": { motion: "bloom", hue: 0 },
  tower: { motion: "rise", hue: 0 },
  "cactus-column": { motion: "rise", hue: 0 },
  "euphorbia-column": { motion: "rise", hue: 0 },
  creeping: { motion: "creep", hue: 0 },
  branching: { motion: "creep", hue: 0 },
  "euphorbia-branch": { motion: "creep", hue: 0 },
  "radial-short": { motion: "pop", hue: 0 },
  cluster: { motion: "pop", hue: 0 },
  lithops: { motion: "squish", hue: 0 },
  "stapelia-flower": { motion: "sway", hue: 0 },
  "stapelia-column": { motion: "sway", hue: 0 },
  "stapelia-cluster": { motion: "sway", hue: 0 }
};

function getGenusStyle(sourceInput, imgName) {
  const baseChar = getSkeletonBaseChar(sourceInput, imgName);
  const type = GROWTH_STRUCTURE[baseChar] || "branching";
  return GENUS_STYLE[type] || GENUS_STYLE.branching;
}

const COMPOSITE_GROWTH_STRUCTURE = {
  A: [
    { type: "echeveria-rosette", role: "dominant-apical", x: 0, y: 0, size: 1.0, rotation: 0, leafDensity: 34, curvature: 0.72 },
    { type: "inner-growth-core", role: "meristem", x: 0.06, y: -0.04, size: 0.28, rotation: 0.22, leafDensity: 10 },
    { type: "outer-aging-ring", role: "mature-leaf-band", x: 0, y: 0, size: 1.18, rotation: -0.08, leafDensity: 18, asymmetry: 0.12 }
  ],
  B: [{ type: "branch-rosette-cluster", role: "main-branch", x: 0, y: 0, size: 1.0, growth: "branching-rosette-colony", nodeCount: 5, curvature: 0.68 }],
  C: [
    { type: "sedum-mat-cluster", role: "dominant-mass", x: 0, y: 0, size: 1.0, branchDensity: 92, repetition: 0.88 },
    { type: "sedum-bean-rosette", role: "upper-branch", x: 0.42, y: -0.58, size: 0.42, rotation: 0.3 },
    { type: "sedum-bean-rosette", role: "upper-terminal", x: 0.52, y: -1.02, size: 0.38, rotation: 0.18 },
    { type: "echeveria-compact", role: "lower-anchor", x: -0.2, y: 0.95, size: 0.46, rotation: -0.12 }
  ],
  D: [
    { type: "crassula-column", role: "main-axis", x: 0, y: 0, size: 1.0, nodeCount: 34 },
    { type: "crassula-column", role: "secondary-column", x: -0.52, y: 0.74, size: 0.72, rotation: -0.22 },
    { type: "fan-petal-cluster", role: "upper-flower", x: 0.68, y: -0.82, size: 0.52 },
    { type: "fan-star-rosette", role: "terminal-geometry", x: 0.52, y: 0.32, size: 0.66, rotation: 0.2 },
    { type: "fan-star-rosette", role: "lower-terminal", x: -0.22, y: 1.22, size: 0.7, rotation: -0.16 }
  ],
  E: [
    { type: "hybrid-chain", role: "main-growth-line", x: 0, y: 0, size: 1.0, curvature: 0.82 },
    { type: "echeveria-rosette", role: "base-anchor", x: -0.32, y: 1.08, size: 0.72 },
    { type: "echeveria-red-core", role: "center-node", x: 0.18, y: 0.22, size: 0.42 },
    { type: "cup-succulent", role: "mid-structure", x: -0.08, y: -0.32, size: 0.54 },
    { type: "sedum-bean-rosette", role: "top-branch", x: 0.42, y: -0.82, size: 0.48 }
  ],
  F: [
    { type: "echeveria-chain", role: "main-branch", x: 0, y: 0, size: 1.0, curvature: -0.62 },
    { type: "echeveria-tight-rosette", role: "upper-terminal", x: 0.22, y: -1.08, size: 0.44 },
    { type: "echeveria-tight-rosette", role: "mid-node", x: -0.42, y: -0.32, size: 0.42 },
    { type: "echeveria-open-rosette", role: "lower-node", x: 0.22, y: 0.44, size: 0.52 },
    { type: "sedum-bean", role: "base-terminal", x: -0.12, y: 1.08, size: 0.58 }
  ],
  G: [
    { type: "sedum-branch-network", role: "main-structure", x: 0, y: 0, size: 1.0, density: 0.82 },
    { type: "yellow-sedum-mat", role: "core-mass", x: -0.42, y: 0.18, size: 0.94 },
    { type: "terminal-jelly-rosette", role: "outer-nodes", x: 0.68, y: -0.62, size: 0.34 },
    { type: "terminal-jelly-rosette", role: "upper-node", x: -0.22, y: -0.82, size: 0.28 }
  ],
  H: [
    { type: "haworthia-column", role: "main-spiral-axis", x: 0, y: 0, size: 1.0 },
    { type: "root-system", role: "base-network", x: 0, y: 1.18, size: 0.92, branchingDensity: 72 },
    { type: "haworthia-window", role: "mid-node", x: -0.42, y: -0.22, size: 0.46 },
    { type: "sedum-terminal", role: "lower-terminal", x: 0.62, y: 1.02, size: 0.34 }
  ],
  I: [
    { type: "haworthia-window-rosette", role: "main-core", x: 0, y: 0, size: 1.0 },
    { type: "haworthia-window-rosette", role: "upper-offset", x: 0.42, y: -0.92, size: 0.58 },
    { type: "haworthia-column", role: "base-support", x: -0.22, y: 0.82, size: 0.72 },
    { type: "root-system", role: "root-anchor", x: -0.22, y: 1.28, size: 0.94, branchingDensity: 84 }
  ],
  J: [
    { type: "cylindrical-cactus", role: "main-axis", x: 0, y: 0, size: 1.0, segmentCount: 18, curvature: 0.42 },
    { type: "root-system", role: "base-fractal", x: 0, y: 1.42, size: 1.12, branchingDensity: 124 },
    { type: "cactus-rosette-node", role: "upper-node", x: 0.18, y: -0.82, size: 0.42 },
    { type: "cactus-rosette-node", role: "mid-node", x: -0.28, y: -0.18, size: 0.38 }
  ],
  K: [
    { type: "hybrid-cactus-column", role: "main-body", x: 0, y: 0, size: 1.0, curvature: -0.42 },
    { type: "flower-node", role: "upper-red-node", x: -0.52, y: -0.72, size: 0.44 },
    { type: "rose-node", role: "terminal-red-rosette", x: 0.28, y: -1.12, size: 0.42 },
    { type: "haworthia-star", role: "right-node", x: 0.82, y: 0.12, size: 0.52 },
    { type: "green-star", role: "center-node", x: 0.12, y: 0.42, size: 0.48 },
    { type: "gold-cactus-base", role: "lower-anchor", x: 0.18, y: 1.08, size: 0.62 }
  ],
  L: [
    { type: "haworthia-window", role: "left-window-node", x: -0.82, y: 0.18, size: 0.58 },
    { type: "green-star-rosette", role: "center-core", x: -0.12, y: 0.42, size: 0.72 },
    { type: "gasteria-cluster", role: "right-branch", x: 0.84, y: -0.18, size: 0.82 },
    { type: "haworthia-window", role: "lower-node", x: -1.02, y: 1.02, size: 0.54 }
  ],
  M: [
    { type: "hybrid-column-cactus", role: "main-axis", x: 0, y: 0, size: 1.0, curvature: -0.38, segmentCount: 14 },
    { type: "flower-cup", role: "left-red-node", x: -0.72, y: -0.82, size: 0.42 },
    { type: "rose-terminal", role: "top-node", x: 0.22, y: -1.12, size: 0.38 },
    { type: "haworthia-zebra", role: "right-node", x: 0.92, y: 0.18, size: 0.54 },
    { type: "green-star", role: "center-node", x: 0.12, y: 0.62, size: 0.48 },
    { type: "gold-cactus", role: "base-node", x: 0.28, y: 1.08, size: 0.72 }
  ],
  N: [
    { type: "hybrid-cactus-column", role: "main-axis", x: 0, y: 0, size: 1.0, curvature: -0.22 },
    { type: "stacked-crassula", role: "left-spine", x: -0.82, y: -0.62, size: 0.72 },
    { type: "pink-geometry-rosette", role: "top-terminal", x: 0.18, y: -1.18, size: 0.62 },
    { type: "star-flower", role: "center-flower", x: -0.12, y: -0.08, size: 0.52 },
    { type: "gold-cactus-node", role: "lower-anchor", x: 0.18, y: 1.02, size: 0.72 },
    { type: "caudex-star-cluster", role: "right-graft", x: 1.02, y: 0.22, size: 0.64 }
  ],
  O: [
    { type: "gasteria-chain", role: "main-spline", x: 0, y: 0, size: 1.0, curvature: 0.58, segmentCount: 6 },
    { type: "star-node", role: "upper-node", x: 0.42, y: -1.02, size: 0.48 },
    { type: "broad-leaf-node", role: "middle-node", x: 0.28, y: -0.22, size: 0.62 },
    { type: "pale-leaf-terminal", role: "lower-tail", x: -0.12, y: 1.02, size: 0.72 }
  ],
  P: [
    { type: "pastel-rosette-chain", role: "main-flow", x: 0, y: 0, size: 1.0, curvature: 0.72, nodeCount: 5 },
    { type: "purple-rosette", role: "left-anchor", x: -1.12, y: 0.82, size: 0.62 },
    { type: "cream-rosette", role: "upper-terminal", x: 0.72, y: -0.82, size: 0.54 }
  ],
  Q: [
    { type: "gasteria-tower", role: "main-column", x: 0, y: 0, size: 1.0, segmentCount: 5, curvature: -0.18 },
    { type: "broad-leaf-node", role: "horizontal-interrupt", x: 0.42, y: -0.18, size: 0.58 },
    { type: "root-system", role: "base-root", x: -0.08, y: 1.28, size: 0.82 }
  ],
  R: [
    { type: "succulent-tree", role: "main-spline", x: 0, y: 0, size: 1.0, curvature: 0.84 },
    { type: "white-node", role: "mid-node", x: -0.12, y: -0.18, size: 0.48 },
    { type: "red-rosette", role: "upper-node", x: 0.52, y: -0.42, size: 0.54 },
    { type: "echeveria-terminal", role: "top-terminal", x: 1.02, y: -1.02, size: 0.58 }
  ],
  S: [
    { type: "caudex-body", role: "main-core", x: 0, y: 0, size: 1.0 },
    { type: "root-network", role: "extended-root", x: -0.42, y: 1.18, size: 1.12 },
    { type: "euphorbia-head", role: "upper-node", x: 0.52, y: -0.72, size: 0.52 },
    { type: "crystal-cluster", role: "right-node", x: 0.92, y: 0.22, size: 0.48 }
  ],
  T: [
    { type: "green-star-rosette", role: "upper-pair", x: 0, y: -0.82, size: 0.62, repeat: 2 },
    { type: "compact-rosette", role: "middle-node", x: 0, y: 0, size: 0.54 },
    { type: "rooted-star-node", role: "lower-pair", x: 0, y: 0.82, size: 0.58, repeat: 2 },
    { type: "window-leaf", role: "bottom-anchor", x: -0.12, y: 1.72, size: 0.52 }
  ],
  U: [
    { type: "split-leaf-succulent", role: "main-duality", x: 0, y: 0, size: 1.0 },
    { type: "red-column", role: "left-pole", x: -0.42, y: 0, size: 0.62 },
    { type: "green-column", role: "right-pole", x: 0.42, y: 0, size: 0.62 },
    { type: "root-base", role: "shared-anchor", x: 0, y: 0.92, size: 0.72 }
  ],
  V: [
    { type: "hybrid-cactus-column", role: "main-axis", x: 0, y: 0, size: 1.0, curvature: 0.28, segmentCount: 12 },
    { type: "lime-succulent", role: "upper-terminal", x: 0.42, y: -1.02, size: 0.52 },
    { type: "star-flower", role: "upper-flower", x: 0.92, y: -1.12, size: 0.42 },
    { type: "droplet-succulent", role: "side-node", x: 0.72, y: 0.42, size: 0.44 },
    { type: "banana-leaf-node", role: "lower-node", x: 0.22, y: 1.02, size: 0.48 }
  ],
  W: [
    { type: "lithops-colony", role: "main-cluster", x: 0, y: 0, size: 1.0, clusterDensity: 0.88 },
    { type: "star-flower", role: "upper-flower", x: 0.82, y: -0.72, size: 0.42 },
    { type: "cactus-node", role: "left-graft", x: -0.92, y: -0.08, size: 0.48 }
  ],
  X: [
    { type: "stapelia-column", role: "paired-column-body", x: 0, y: 0, size: 1.0, segmentCount: 2 },
    { type: "root-system", role: "base-root", x: 0, y: 0.92, size: 0.48 }
  ],
  Y: [{ type: "stapelia-radial-star", role: "main-body", x: 0, y: 0, size: 1.0, armCount: 18 }],
  Z: [
    { type: "stapelia-radial-star", role: "main-body", x: 0, y: 0, size: 1.0, armCount: 18 },
    { type: "star-flower", role: "surface-flower-group", x: -0.32, y: -0.08, size: 0.58, repeat: 4 }
  ],
  RANDOM_CHAR: [
    { type: "star-cactus-cluster", role: "main-radial", x: 0, y: 0, size: 1.0, armCount: 16 },
    { type: "star-flower", role: "flower-nodes", x: 0.42, y: -0.52, size: 0.42, repeat: 4 }
  ],
  Q1: [
    { type: "gasteria-rosette", role: "main-body", x: 0, y: 0, size: 1.0 },
    { type: "inner-core", role: "central-kernel", x: 0, y: 0, size: 0.42 },
    { type: "offset-clusters", role: "side-growth", x: -0.62, y: 0.18, size: 0.54 }
  ],
  K_INTER1: [
    { type: "mammillaria-network", role: "main-body", x: 0, y: 0, size: 1.0, armCount: 7 },
    { type: "central-rosette-cactus", role: "core", x: 0, y: 0, size: 0.52 },
    { type: "branch-arm", role: "radial-extensions", x: 0.62, y: 0.18, size: 0.74 }
  ],
  K_INTER2: [
    { type: "mammillaria-hybrid", role: "central-core", x: 0, y: 0, size: 1.0, armCount: 5 },
    { type: "arm-extension", role: "left-arm", x: -0.82, y: 0.22, size: 0.62 },
    { type: "arm-extension", role: "right-arm", x: 0.72, y: -0.12, size: 0.58 }
  ],
  K_INTER3: [
    { type: "white-cactus-chain", role: "main-axis", x: 0, y: 0, size: 1.0, segmentCount: 16 },
    { type: "gold-cactus-node", role: "right-cluster", x: 0.84, y: -0.18, size: 0.52 },
    { type: "gold-cactus-node", role: "lower-node", x: 0.22, y: 0.82, size: 0.62 },
    { type: "root-system", role: "base-root", x: 0.18, y: 1.22, size: 0.82 }
  ],
  CG_INTER: [
    { type: "sedum-mat-cluster", role: "hybrid-core", x: 0, y: 0, size: 1.0, density: 0.7 },
    { type: "terminal-jelly-rosette", role: "graft-node", x: 0.32, y: -0.32, size: 0.42 }
  ],
  U_INTER: [
    { type: "lithops-colony", role: "companion-cluster", x: 0, y: 0, size: 0.9, clusterDensity: 0.6 }
  ],
  Y_INTER1: [
    { type: "stapelia-column", role: "vine-segment-1", x: 0, y: 0, size: 1.0, segmentCount: 2 },
    { type: "root-system", role: "base-root", x: 0, y: 0.92, size: 0.5 }
  ],
  Y_INTER2: [
    { type: "stapelia-column", role: "vine-segment-2", x: 0, y: 0, size: 1.0, segmentCount: 2 }
  ],
  DOT_MARK: [
    { type: "flower-node", role: "mark-point", x: 0, y: 0, size: 0.3 }
  ],
  BANG_RANDOM: [
    { type: "stapelia-radial-star", role: "burst", x: 0, y: 0, size: 0.8, armCount: 10 }
  ]
};

const REQUIRED_FOR_MASTER = ["A", "AB_INTER", "AC_COMBO", "DT_INTER", "B", "R", "P", "E", "F"];

const START_X = 25000;
const START_Y = 25000;
const LINE_GAP_X = 260;
const STAGE_SIZE = 50000;
const XRAY_COLOR = { r: 52, g: 42, b: 36 };

const imageCache = {};
let stage;
let input;
let distLog;
let angleLog;
let growthBranchLayer;

let lastNumberChar = null;
let numberZeroCounter = 0;

let collectedSet = new Set();
let masterSpawned = false;
let lastKey = null;
let lastPos = { x: START_X, y: START_Y };
let growthAngle = -90;

let wCounter = 0;
let aCounter = 0;
let zCounter = 0;
let firstASequenceSpawned = false;

let receiptRecords = [];
let typedHistory = [];

let committedSequence = "";
let currentInputSnapshot = "";
let activeTimers = [];

let currentLineIndex = 0;
let currentLineStartX = START_X;

let rebuildFrameId = null;
let lastVisualSequence = "";
let animatedTokenIndex = -1;
let renderCycle = 0;
// true = 지금 그려지는 건 이미 입력했던 히스토리를 다시 그리는 중
// false = 방금 새로 타이핑한 글자 (등장은 즉시 - 잠깐 최상단 z-index만 부여됨)
let currentInstant = false;
// X-ray 뷰에서 지금 그려지고 있는 개체의 SVG <g> 그룹 (속/genus별 색상 구분용)
let currentBranchGroup = null;

// 방금 막 타이핑되어 돋아나는 노드가 잠시 동안 기존 개체들에게 가려지지 않도록
// 임시로 부여하는 높은 z-index. 단, 화면에 고정된 입력창/버튼들(#ui-layer 등)은
// z-index 10,000,000 이상을 쓰고 있으므로, 절대 그보다 커지지 않도록
// 여유 있게 낮은 값으로 잡음 (이 값이 UI보다 커지면 타이핑 바를 다육이가 가려버림)
const ENTRANCE_Z_INDEX = 500000;
// 위 임시 z-index를 유지하는 시간(ms) - 자라나는 애니메이션이 끝나고도
// 잠깐 더 앞에 보이다가 자연스럽게 원래 깊이로 안착함
const ENTRANCE_SETTLE_MS = 700;

// ===== 성장 배경음 (낮게 깔리는 화이트/핑크 노이즈, 마이크를 켜놓은 듯한 느낌) =====
// 다육이가 자라날(글자가 추가될) 때마다 볼륨이 살짝 올라갔다가
// 타이핑을 멈추면 다시 은은하게 가라앉는 방식으로 "성장 속도"에 반응함.
const AMBIENT_AUDIO_SRC = "./growth_noise.mp3";
const AMBIENT_BASE_GAIN = 0.16;
const AMBIENT_MAX_GAIN = 0.42;

// 타이핑할 때마다 나는 소리 (하나의 스프라이트 파일에 6가지 변형이 들어있음).
// 딱딱한 "클릭"음이 아니라, 여린 줄기가 살짝 스치며 늘어나는 듯한 유기적 질감.
const TICK_AUDIO_SRC = "./growth_ticks.mp3";
const TICK_VARIANTS = [
  { offset: 0.0, duration: 0.3 },
  { offset: 0.34, duration: 0.3 },
  { offset: 0.68, duration: 0.3 },
  { offset: 1.02, duration: 0.3 },
  { offset: 1.36, duration: 0.3 },
  { offset: 1.7, duration: 0.3 },
];
const TICK_BASE_GAIN = 0.55;
let tickBuffer = null;
let tickGainNode = null;
let lastTickVariant = -1;

let audioCtx = null;
let ambientGainNode = null;
let ambientBuffer = null;
let ambientSourceNode = null;
let audioStarted = false;
let audioLoading = false;
let recentTypeTimes = [];
let audioSettleTimer = null;

// base64 문자열 -> ArrayBuffer
function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// 오디오 파일을 ArrayBuffer로 불러옴.
// 1순위: audio-data.js에 내장된 base64 (file://로 열어도 동작)
// 2순위: 같은 폴더의 mp3를 fetch (로컬 서버 / 깃허브 페이지에서 동작)
async function loadAudioArrayBuffer(src, embeddedKey) {
  const embedded = window.GROWTH_AUDIO_DATA && window.GROWTH_AUDIO_DATA[embeddedKey];
  if (embedded) return base64ToArrayBuffer(embedded);

  const res = await fetch(src);
  if (!res.ok) throw new Error(`오디오 파일을 찾을 수 없음: ${src} (${res.status})`);
  return res.arrayBuffer();
}

// 브라우저 자동재생 정책 때문에 AudioContext가 잠겨(suspended) 있으면 풀어줌.
// 반드시 사용자 입력(키/클릭) 이벤트 안에서 동기적으로 호출되어야 효과가 있음.
function unlockAudioContext() {
  if (window.SOUND_MUTED) return;
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
}

async function ensureAudioStarted() {
  if (window.SOUND_MUTED) return;
  unlockAudioContext();
  if (audioStarted || audioLoading) return;
  audioLoading = true;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // await 이전에 호출해야 사용자 제스처로 인정됨
    unlockAudioContext();

    const [ambientArrayBuffer, tickArrayBuffer] = await Promise.all([
      loadAudioArrayBuffer(AMBIENT_AUDIO_SRC, "noise"),
      loadAudioArrayBuffer(TICK_AUDIO_SRC, "ticks"),
    ]);
    const [decodedAmbient, decodedTick] = await Promise.all([
      audioCtx.decodeAudioData(ambientArrayBuffer),
      audioCtx.decodeAudioData(tickArrayBuffer),
    ]);
    ambientBuffer = decodedAmbient;
    tickBuffer = decodedTick;

    ambientGainNode = audioCtx.createGain();
    ambientGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    ambientGainNode.connect(audioCtx.destination);

    ambientSourceNode = audioCtx.createBufferSource();
    ambientSourceNode.buffer = ambientBuffer;
    ambientSourceNode.loop = true;
    ambientSourceNode.connect(ambientGainNode);
    ambientSourceNode.start(0);

    ambientGainNode.gain.linearRampToValueAtTime(AMBIENT_BASE_GAIN, audioCtx.currentTime + 2.5);

    tickGainNode = audioCtx.createGain();
    tickGainNode.gain.value = TICK_BASE_GAIN;
    tickGainNode.connect(audioCtx.destination);

    audioStarted = true;
    scheduleAmbientLifeTick();
  } catch (e) {
    console.warn("배경음 로드/재생 실패:", e);
    // 실패하면 다음 입력 때 다시 시도할 수 있도록 컨텍스트를 정리
    if (audioCtx && !audioStarted) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  } finally {
    audioLoading = false;
  }
}

// 첫 클릭/키 입력 순간에 오디오를 미리 깨워서 불러둠 -> 첫 글자부터 소리가 남.
// 탭을 다른 데 갔다 오면 다시 잠기는 경우가 있어 매번 unlock도 시도함.
["pointerdown", "keydown", "touchstart", "touchend", "click"].forEach((evt) => {
  window.addEventListener(evt, () => ensureAudioStarted(), { passive: true });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) unlockAudioContext();
});

// 글자 하나가 자라날 때마다 여린 줄기가 스치듯 늘어나는 유기적인 소리를 하나 재생
// (매번 같은 변형이 반복되지 않도록 직전과 다른 것을 무작위로 고름)
function playTypeTick() {
  if (!audioCtx || !tickBuffer || !tickGainNode) return;

  let idx = Math.floor(Math.random() * TICK_VARIANTS.length);
  if (idx === lastTickVariant) {
    idx = (idx + 1) % TICK_VARIANTS.length;
  }
  lastTickVariant = idx;
  const variant = TICK_VARIANTS[idx];

  const source = audioCtx.createBufferSource();
  source.buffer = tickBuffer;
  source.playbackRate.value = 0.94 + Math.random() * 0.12;

  const hitGain = audioCtx.createGain();
  hitGain.gain.value = 0.75 + Math.random() * 0.25;

  source.connect(hitGain);
  hitGain.connect(tickGainNode);
  source.start(0, variant.offset, variant.duration);
}

// 타이핑 속도(최근 3초간 입력 횟수)에 맞춰 배경 노이즈 볼륨을 살짝 밀어올리고,
// 손을 멈추면 다시 부드럽게 기본 볼륨으로 가라앉힘
function pulseGrowthAudio() {
  if (!audioCtx || !ambientGainNode) return;

  const now = performance.now();
  recentTypeTimes.push(now);
  recentTypeTimes = recentTypeTimes.filter((t) => now - t < 3000);

  const rate = recentTypeTimes.length;
  const targetGain = Math.min(AMBIENT_MAX_GAIN, AMBIENT_BASE_GAIN + rate * 0.018);

  const t = audioCtx.currentTime;
  ambientGainNode.gain.cancelScheduledValues(t);
  ambientGainNode.gain.setTargetAtTime(targetGain, t, 0.35);

  clearTimeout(audioSettleTimer);
  audioSettleTimer = setTimeout(() => {
    if (!audioCtx || !ambientGainNode) return;
    ambientGainNode.gain.setTargetAtTime(AMBIENT_BASE_GAIN, audioCtx.currentTime, 1.8);
  }, 700);
}

// ============================================================
// 살아있는 반응 1 — 타이핑을 멈춰도 완전히 정적이지 않도록, 아주 가끔
// (8~22초 간격) 아주 낮은 볼륨으로 스스로 부스럭거리는 소리를 냄.
// 전시장에서 사람이 손을 떼고 지켜보기만 해도 "숨 쉬고 있다"는 느낌을
// 주기 위한 것 — 타이핑 틱(기본 볼륨 0.55)보다 훨씬 조용하고 느리게 재생.
// ============================================================
const AMBIENT_LIFE_MIN_MS = 8000;
const AMBIENT_LIFE_MAX_MS = 22000;
const AMBIENT_LIFE_GAIN = 0.16;
let ambientLifeTimer = null;

function scheduleAmbientLifeTick() {
  clearTimeout(ambientLifeTimer);
  if (!audioStarted) return;
  const wait = AMBIENT_LIFE_MIN_MS + Math.random() * (AMBIENT_LIFE_MAX_MS - AMBIENT_LIFE_MIN_MS);
  ambientLifeTimer = setTimeout(() => {
    if (collectedSet.size > 0 || typedHistory.length > 0) {
      playAmbientLifeTick();
    }
    scheduleAmbientLifeTick();
  }, wait);
}

function playAmbientLifeTick() {
  if (!audioCtx || !tickBuffer) return;
  const variant = TICK_VARIANTS[Math.floor(Math.random() * TICK_VARIANTS.length)];

  const source = audioCtx.createBufferSource();
  source.buffer = tickBuffer;
  // 타이핑 틱보다 느리고 낮은 재생 속도 -> 또렷한 "딸깍"이 아니라 먼 곳의 부스럭거림처럼 들림
  source.playbackRate.value = 0.68 + Math.random() * 0.22;

  const g = audioCtx.createGain();
  g.gain.value = AMBIENT_LIFE_GAIN * (0.6 + Math.random() * 0.4);

  source.connect(g);
  g.connect(audioCtx.destination);
  source.start(0, variant.offset, variant.duration);
}

// ============================================================
// 살아있는 반응 2 — 커서에 대한 아주 미세한 굴광성(빛을 향해 살짝 기우는 것
// 같은 반응). 기존 idle 흔들림은 img에 걸려 있고 이 반응은 node(부모)에
// 걸리므로 서로 방해하지 않고 자연스럽게 겹쳐진다. 커서 반경 밖의 개체는
// 전혀 건드리지 않으므로(비용 없음) 개체 수가 많아져도 가볍다.
// prefers-reduced-motion 사용자에게는 아예 걸지 않음.
// ============================================================
const LEAN_RADIUS = 620; // 이 거리(px, 스테이지 좌표) 안의 개체만 반응
const LEAN_MAX_DEG = 4.5; // 최대 추가 회전각
const LEAN_MAX_PX = 7; // 최대 추가 이동량
let livingNodes = []; // { node, cx, cy, baseRot }
let activeLeanNodes = new Set();
let pointerStageX = null;
let pointerStageY = null;
let leanRafId = null;
const prefersReducedMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function registerLivingNode(node, cx, cy, baseRot) {
  node.dataset.baseRot = baseRot;
  livingNodes.push({ node, cx, cy, baseRot });
}

function clearLivingNodes() {
  livingNodes = [];
  activeLeanNodes.clear();
}

function initCursorLean() {
  if (prefersReducedMotion) return;

  window.addEventListener(
    "pointermove",
    (e) => {
      pointerStageX = e.clientX + window.scrollX;
      pointerStageY = e.clientY + window.scrollY;
      scheduleLeanFrame();
    },
    { passive: true }
  );

  // 스크롤(카메라 이동)만으로도 커서-개체 간 실제 거리가 바뀌므로 다시 계산
  window.addEventListener("scroll", scheduleLeanFrame, { passive: true });
}

function scheduleLeanFrame() {
  if (leanRafId !== null) return;
  leanRafId = requestAnimationFrame(updateCursorLean);
}

function updateCursorLean() {
  leanRafId = null;
  if (pointerStageX === null) return;

  const nextActive = new Set();

  for (let i = 0; i < livingNodes.length; i++) {
    const entry = livingNodes[i];
    const dx = entry.cx - pointerStageX;
    const dy = entry.cy - pointerStageY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= LEAN_RADIUS) continue;

    const influence = 1 - dist / LEAN_RADIUS;
    const eased = influence * influence; // 가까울수록 훨씬 크게 반응(완만한 감쇠 곡선)
    const dirX = dist > 0.001 ? -dx / dist : 0;
    const dirY = dist > 0.001 ? -dy / dist : 0;

    const leanX = dirX * LEAN_MAX_PX * eased;
    const leanY = dirY * LEAN_MAX_PX * eased;
    const leanRotate = dirX * LEAN_MAX_DEG * eased;

    entry.node.style.transform =
      `translate(${leanX.toFixed(2)}px, ${leanY.toFixed(2)}px) rotate(${(entry.baseRot + leanRotate).toFixed(2)}deg)`;
    nextActive.add(entry.node);
  }

  activeLeanNodes.forEach((node) => {
    if (!nextActive.has(node)) {
      node.style.transform = `rotate(${node.dataset.baseRot || 0}deg)`;
    }
  });
  activeLeanNodes = nextActive;
}

window.addEventListener("DOMContentLoaded", init);

async function init() {
  stage = document.getElementById("render-stage");
  input = document.getElementById("succulent-input");
  distLog = document.getElementById("dist-val");
  angleLog = document.getElementById("angle-val");

  if (!stage || !input) {
    console.error("필수 요소를 찾지 못했습니다.");
    return;
  }

  ensureGrowthBranchLayer();
  ensureXrayButton();

  input.disabled = true;
  input.placeholder = "LOADING PLANTS...";

  document.getElementById("save-btn")?.addEventListener("click", captureFullStage);
  document.getElementById("decode-btn")?.addEventListener("click", toggleMutantOnly);
  document.getElementById("receipt-btn")?.addEventListener("click", toggleReceipt);
  document.getElementById("receipt-close")?.addEventListener("click", closeReceipt);
  document.getElementById("receipt-download")?.addEventListener("click", downloadReceipt);
  document.getElementById("coord-toggle")?.addEventListener("click", toggleCoordinateLayer);
  document.getElementById("growth-map-btn")?.addEventListener("click", toggleGrowthMapPanel);
  document.getElementById("growth-map-close")?.addEventListener("click", closeGrowthMapPanel);
  document.getElementById("growth-xray-btn")?.addEventListener("click", toggleGrowthXray);

  createCoordinateLayer();
  drawGrowthMapPanel();

  // 이미지는 기다리지 않고 바로 타이핑 가능하게 함 (백그라운드에서 계속 로드됨).
  // 아직 못 받아온 조각 이미지가 있으면 해당 글자만 자기 로드가 끝나는 대로 자연스럽게 나타남.
  preloadImages();

  input.disabled = false;
  input.placeholder = "TYPE A-Z / 0-9 (SPACE = NEW LINE)";

  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("input", handleInput);
  input.addEventListener("compositionstart", () => { inputComposing = true; });
  input.addEventListener("compositionend", (e) => {
    inputComposing = false;
    handleInput({ target: input, isComposing: false });
  });
  if (!window.TOUCH_UI) input.focus({ preventScroll: true });
  // 버그 수정: X-ray/영수증/저장 같은 버튼을 누르면 포커스가 버튼으로 옮겨가서
  // 그 뒤 타이핑이 입력창에 들어가지 않던 문제 → 버튼을 누른 뒤 입력창으로 포커스를 되돌림
  document.addEventListener("click", (e) => {
    // 모바일(화면 자판)에서는 포커스를 돌려줄 필요가 없고, 팝업/메뉴 안 버튼도 제외
    if (window.TOUCH_UI || document.body.classList.contains("overlay-open")) return;
    if (e.target.closest && e.target.closest(".app-overlay")) return;
    if (e.target.closest && e.target.closest("button")) setTimeout(() => input.focus({ preventScroll: true }), 0);
  });

  // initCursorLean(); // 마우스에 반응해 기울어지는 효과가 식물스럽지 않고 어색하다는 피드백으로 비활성화함
  hideIntroVeil();

  moveCamera(START_X, START_Y + window.innerHeight * 0.2, "auto");
 console.log("Cluster System ready");
}

// 로딩 중 살짝 흰 화면으로 덮어뒀다가, 준비가 끝나면 부드럽게 걷어냄
// (입력창이 갑자기 "뿅" 나타나지 않고, 전시장에서 조명이 서서히 들어오듯)
function hideIntroVeil() {
  const veil = document.getElementById("intro-veil");
  if (!veil) return;
  requestAnimationFrame(() => {
    setTimeout(() => {
      veil.classList.add("veil-hidden");
      setTimeout(() => veil.remove(), 1400);
    }, 200);
  });
}

function ensureGrowthBranchLayer() {
  growthBranchLayer = document.getElementById("growth-branch-layer");

  if (!growthBranchLayer) {
    growthBranchLayer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    growthBranchLayer.setAttribute("id", "growth-branch-layer");
    growthBranchLayer.setAttribute("width", STAGE_SIZE);
    growthBranchLayer.setAttribute("height", STAGE_SIZE);
    growthBranchLayer.setAttribute("viewBox", `0 0 ${STAGE_SIZE} ${STAGE_SIZE}`);
    growthBranchLayer.style.position = "absolute";
    growthBranchLayer.style.left = "0";
    growthBranchLayer.style.top = "0";
    growthBranchLayer.style.width = `${STAGE_SIZE}px`;
    growthBranchLayer.style.height = `${STAGE_SIZE}px`;
    growthBranchLayer.style.pointerEvents = "none";
    growthBranchLayer.style.zIndex = "999999";
    growthBranchLayer.style.display = "none";
    stage.appendChild(growthBranchLayer);
  }
}

function ensureXrayButton() {
  if (document.getElementById("growth-xray-btn")) return;

  const layer = document.getElementById("utility-layer") || document.body;
  const btn = document.createElement("button");
  btn.id = "growth-xray-btn";
  btn.type = "button";
  btn.title = "Growth X-ray";
  btn.textContent = "⌁";
  layer.appendChild(btn);
}

function preloadImages() {
  // 모든 이미지를 백그라운드에서 로드하되, "먼저 필요한 것부터" 순서대로 받음.
  // 예전: 150여 장을 한꺼번에 동시에 요청 → 서로 대역폭을 나눠 먹어서 첫 글자가 늦게 뜸
  // 지금: 한 번에 10장씩, 우선순위 순서로 받음
  //   0) 알파벳 조각(parts) — 모든 기본 타이핑에 쓰임
  //   1) 추가 식물 몸통 + 떨어지는 꽃
  //   2) INTER/조합 변이 이미지
  //   3) 나머지 시퀀스 이미지 → 4) 숫자/기호(폴더에 없을 수 있음)
  // 타이핑한 글자의 이미지가 아직 대기열에 있으면, 그 글자는 대기열을 건너뛰고 즉시 따로 요청됨
  // (loadSplitLayerImage / createSucculentElement가 직접 요청하므로 기다리지 않음)
  const MAX_PARALLEL = 10;
  const queue = [];
  const hasSplit = (name) => !!SPLIT_LAYER_MAP[name];
  const replacedByBase = new Set(
    Object.entries(typeof JUNGLE_SPECIES !== "undefined" ? JUNGLE_SPECIES : {})
      .filter(([, sp]) => sp.baseImage)
      .map(([name]) => name)
  );

  Object.values(SPLIT_LAYER_MAP).forEach((layerNames) => {
    layerNames.forEach((layerName) => queue.push({ rank: 0, kind: "layer", name: layerName }));
  });

  const rankOf = (name) => {
    if (/^N-\d\d/.test(name)) return 1;
    if (/^[A-Z]$/.test(name)) return 1; // Z 등 조각이 없는 단일 글자
    if (name.includes("INTER") || name === "AC_COMBO" || name === "DT_DELAYED") return 2;
    return 3;
  };
  Object.keys(IMAGE_CONFIG).forEach((name) => {
    if (hasSplit(name)) return;            // 조각으로 그려지는 글자는 완성 이미지 파일이 없음 (404 방지)
    if (replacedByBase.has(name)) return;  // 꽃을 뺀 몸통 이미지로 대체된 원본은 쓰지 않음
    queue.push({ rank: rankOf(name), kind: "image", name });
  });
  if (typeof PETAL_UNITS !== "undefined") {
    Object.keys(PETAL_UNITS).forEach((name) => queue.push({ rank: 1, kind: "petal", name }));
  }
  [...NUMBER_FILE_LIST, ...SYMBOL_FILE_LIST].forEach((name) => queue.push({ rank: 4, kind: "image", name }));
  queue.sort((x, y) => x.rank - y.rank);

  const loadOne = (name) => new Promise((resolve) => {
    if (imageCache[name]) return resolve();
    const img = new Image();
    img.decoding = "async";
    img.onload = async () => {
      try { if (img.decode) await img.decode(); } catch (e) {}
      imageCache[name] = img;
      resolve();
    };
    img.onerror = () => {
      const fallbackName = IMAGE_FALLBACK_MAP[name];
      if (fallbackName) {
        const fallback = new Image();
        fallback.decoding = "async";
        fallback.onload = async () => {
          try { if (fallback.decode) await fallback.decode(); } catch (e) {}
          imageCache[name] = fallback;
          resolve();
        };
        fallback.onerror = () => { imageCache[name] = img; resolve(); };
        fallback.src = resolveImagePath(fallbackName);
      } else {
        imageCache[name] = img;
        resolve();
      }
    };
    img.src = resolveImagePath(name);
  });

  const loadPetal = (name) => new Promise((resolve) => {
    const im = (typeof petalSprites !== "undefined" && petalSprites[name]) || new Image();
    if (im.complete && im.naturalWidth) return resolve();
    im.decoding = "async";
    im.onload = () => resolve();
    im.onerror = () => resolve();
    if (typeof petalSprites !== "undefined") petalSprites[name] = im;
    if (!im.src) im.src = `${PETAL_PATH}${name}.webp`;
  });

  const corePromises = [];
  let cursor = 0;
  const next = () => {
    if (cursor >= queue.length) return Promise.resolve();
    const job = queue[cursor++];
    const p = job.kind === "layer" ? loadSplitLayerImage(job.name)
      : job.kind === "petal" ? loadPetal(job.name)
      : loadOne(job.name);
    if (job.rank === 0) corePromises.push(p);
    return p.then(next);
  };
  for (let i = 0; i < MAX_PARALLEL; i++) next();
  return Promise.all(corePromises);
}

function handleKeydown(e) {
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();
    const normalizedCurrent = normalizeInput(input.value);
    if (input.value !== normalizedCurrent) input.value = normalizedCurrent;
    // 이번 줄(마지막 커밋 이후)에 새로 입력된 부분만 잘라내서 확정
    currentInputSnapshot = normalizedCurrent.slice(committedSequence.replace(/\n/g, "").length);
    committedSequence += currentInputSnapshot + "\n";
    currentInputSnapshot = "";
    // 입력창은 절대 비우지 않음 -> 기존에 타이핑된 문장이 그대로 남고 이어서 타이핑됨
    requestRebuild();
    updateDataLog(0, 90, false);
   return;
  }

  if (e.key === "Backspace") {
    // "커밋된 부분까지 지웠을 때(이번 줄에 아직 새로 친 글자가 없을 때)"만
    // 커밋된 시퀀스(줄바꿈 포함) 쪽을 한 글자 되돌림
    const committedVisibleLen = committedSequence.replace(/\n/g, "").length;
    const normalizedNow = normalizeInput(input.value);
    if (normalizedNow.length === committedVisibleLen && committedSequence.length > 0) {
      e.preventDefault();
      committedSequence = committedSequence.slice(0, -1);
      currentInputSnapshot = normalizedNow.slice(committedSequence.replace(/\n/g, "").length);
      requestRebuild();
      updateDataLog(0, 90, false);
    }
  }
}

let inputComposing = false;

function handleInput(e) {
  const raw = e.target.value;
  const normalized = normalizeInput(raw);
  // [모바일] 키보드가 단어를 조합(밑줄)하는 중에 값을 바꿔 쓰면 글자가 두 번 찍히는 버그가 생김
  // → 조합 중에는 화면 값은 건드리지 않고(대문자 표시는 CSS), 조합이 끝난 뒤에만 정리
  const composing = (e && e.isComposing) || inputComposing;
  if (!composing && raw !== normalized) e.target.value = normalized;
  if (/[^\x00-\x7F]/.test(raw) && typeof window.onNonLatinInput === "function") window.onNonLatinInput();

  // [모바일] 휴대폰 키보드는 Backspace keydown을 보내지 않는 경우가 많음
  // → 입력값이 이미 확정된(줄바꿈된) 부분보다 짧아졌으면 확정 시퀀스도 같이 잘라냄
  const committedVisible = committedSequence.replace(/\n/g, "");
  if (!normalized.startsWith(committedVisible)) reconcileCommitted(normalized);

  // 입력창 전체 값이 아니라, 마지막 커밋 이후에 새로 추가된 부분만 "현재 줄"로 취급
  currentInputSnapshot = normalized.slice(committedSequence.replace(/\n/g, "").length);
  requestRebuild();
}

function reconcileCommitted(normalized) {
  let out = "";
  let vis = 0;
  for (const ch of committedSequence) {
    if (ch === "\n") { out += ch; continue; }
    if (vis < normalized.length && normalized[vis] === ch) { out += ch; vis++; } else break;
  }
  committedSequence = out;
}

function normalizeInput(value) {
  return value.toUpperCase().replace(/[^A-Z0-9?+!."@*&%]/g, "");
}

function requestRebuild() {
  const nextSequence = committedSequence + currentInputSnapshot;
  if (typeof window.onSequenceChange === "function") window.onSequenceChange(nextSequence);

  // 글자 하나가 "뒤에 추가"된 경우인지 확인 (일반 타이핑, 엔터 모두 여기 해당)
  const isPureAppend =
    nextSequence.length === lastVisualSequence.length + 1 && nextSequence.startsWith(lastVisualSequence);

  if (rebuildFrameId !== null) cancelAnimationFrame(rebuildFrameId);
  clearTimeout(window.rebuildDelay);

  if (isPureAppend) {
    // ── 핵심 수정 ──────────────────────────────────────────────
    // 예전에는 키를 누를 때마다 화면에 그려둔 모든 다육이를 통째로 지우고
    // 처음부터 전체 시퀀스를 다시 재생했음 (rebuildFromSequence).
    // 타이핑한 글자 수가 늘어날수록 이 작업량이 계속 커져서(O(n²)),
    // 글자가 많아지면 타이핑할 때마다 화면이 버벅이거나 순간적으로
    // 비었다가 다시 채워지며 "글자가 사라지는" 것처럼 보이고,
    // 데이터가 커지면 아예 화면이 깨지는 원인이 되었음.
    //
    // 지금은 "글자 하나가 끝에 추가된 경우"에는 기존에 그려진 것을
    // 절대 건드리지 않고 새 글자 하나만 이어서 그림. O(1)로 동작하므로
    // 아무리 많이 타이핑해도 매 입력마다의 비용이 늘어나지 않음.
    // 이어붙이기는 비용이 거의 없으므로(글자 1개만 그림) 디바운스 없이 바로 처리.
    // setTimeout으로 미뤘다가 바로 다음 키 입력이 그 타이머를 취소해버리면
    // 방금 누른 글자가 통째로 씹히는(그려지지 않는) 문제가 생기기 때문에,
    // 여기서는 반드시 동기적으로 즉시 처리한다.
    const newToken = nextSequence[nextSequence.length - 1];
    lastVisualSequence = nextSequence;
    animatedTokenIndex = -1;
    rebuildFrameId = null;
    appendSingleToken(newToken);
    return;
  }

  // 백스페이스로 지우거나, 붙여넣기 등으로 시퀀스가 앞에서부터 달라진 경우에만
  // (자주 일어나지 않는 경우) 안전하게 전체를 다시 계산해서 그림
  animatedTokenIndex = -1;
  lastVisualSequence = nextSequence;

  window.rebuildDelay = setTimeout(() => {
    rebuildFrameId = null;
    rebuildFromSequence(nextSequence);
  }, 0);
}

// 시퀀스 끝에 글자(또는 줄바꿈) 하나가 추가되었을 때, 기존 화면은 그대로 둔 채
// 새 글자에 해당하는 다육이/숫자 노드만 이어서 그려 넣는다.
function appendSingleToken(token) {
  if (token === "\n") {
    processLineBreak(false);
  } else {
    processCharacter(token, false);
  }

  // X-Ray(성장 골격) 뷰가 켜져 있을 때만 골격 레이어를 갱신 (평소엔 비용 없음)
  // 전체를 지우고 다시 그리지 않고, 새로 생긴 기록만 다음 프레임에 한 번에 이어 그림
  if (document.body.classList.contains("xray-active")) {
    requestXrayDraw();
  }

  // 다육이가 자라날 때마다 배경 노이즈가 살짝 반응하고, 여린 성장음이 남
  ensureAudioStarted();
  pulseGrowthAudio();
  playTypeTick();
}

function clearActiveTimers() {
  activeTimers.forEach((id) => clearTimeout(id));
  activeTimers = [];
}

function scheduleNode(callback, delay, instant = false) {
  if (instant) {
    callback();
    return;
  }

  const cycle = renderCycle;
  const timerId = setTimeout(() => {
    if (cycle !== renderCycle) return;
    callback();
    activeTimers = activeTimers.filter((id) => id !== timerId);
  }, delay);

  activeTimers.push(timerId);
}

function resetRuntimeState() {
  renderCycle += 1;
  clearActiveTimers();

  currentLineIndex = 0;
  currentLineStartX = START_X;
  lastKey = null;
  lastPos = { x: START_X, y: START_Y };
  growthAngle = -90;
  wCounter = 0;
  aCounter = 0;
  zCounter = 0;
 firstASequenceSpawned = false;
  collectedSet.clear();
  masterSpawned = false;
    receiptRecords = [];
  typedHistory = [];

  if (stage) {
    stage.querySelectorAll(".succulent-node").forEach((node) => node.remove());
    stage.querySelectorAll(".number-node").forEach((node) => node.remove());
  }
  clearGlobalGrowthBranch();
  clearLivingNodes();
  resetJungleState();

  lastNumberChar = null;
  numberZeroCounter = 0;
  stoneSeedCounter = 0;
}

function rebuildFromSequence(sequence) {
  resetRuntimeState();
  if (typeof petalOnRewind === "function") petalOnRewind(sequence);

  for (let i = 0; i < sequence.length; i++) {
    const token = sequence[i];
    if (token === "\n") {
      processLineBreak(true);
    } else {
      const shouldAnimate = i === animatedTokenIndex;
      processCharacter(token, !shouldAnimate);
    }
  }
  drawGlobalGrowthBranch();
}

function processLineBreak(isRebuild = false) {
  typedHistory.push("\n");
  if (!isRebuild && typeof petalOnLineBreak === "function") petalOnLineBreak();
  currentLineIndex += 1;
  currentLineStartX = START_X + currentLineIndex * LINE_GAP_X;
  lastPos = { x: currentLineStartX, y: START_Y };
  lastKey = null;
  growthAngle = -90;
  wCounter = 0;
  aCounter = 0;
  zCounter = 0;
  // firstASequenceSpawned는 여기서 리셋하지 않음: 이걸 리셋하면 줄이 바뀔 때마다
  // 그 줄의 첫 "A"에서 A1~A8 가로 시퀀스가 매번 다시 통째로 스폰되어
  // 같은 이미지들이 여러 번 나타나는 원인이 됨. 세션 전체에서 한 번만 나오게 하려면
  // resetRuntimeState()에서만 리셋되어야 함(전체 재시작/백스페이스로 인한 전체 재계산 시).

  if (!isRebuild) moveCamera(currentLineStartX, START_Y, "auto");
}

function processCharacter(char, instant = false) {
  currentInstant = instant;
  typedHistory.push(char);

  if (char === "?") {
    renderRandomNode("RANDOM_CHAR", char);
    checkMasterLogic("RANDOM_CHAR");
    lastKey = "?";
    wCounter = 0;
    aCounter = 0;
    zCounter = 0;
    return;
  }

  if (char === "!") {
    renderRandomNode("BANG_RANDOM", char);
    if (!instant && typeof petalOnBang === "function") petalOnBang();
    checkMasterLogic("BANG_RANDOM");
    lastKey = "!";
    wCounter = 0;
    aCounter = 0;
    zCounter = 0;
    return;
  }

  if (char === ".") {
    renderIntermediateNode("DOT_MARK", char, instant);
    checkMasterLogic("DOT_MARK");
    return;
  }

  if (/[0-9]/.test(char)) {
    renderNumberChar(char);
    return;
  }

  if (SYMBOL_IMAGE_CONFIG[char]) {
    renderSymbolChar(char);
    return;
  }

  if (GENETIC_MAP[char] || char === "+") {
    if ((lastKey === "D" && char === "T") || (lastKey === "T" && char === "D")) {
      renderDTSequence(char, instant);
      checkMasterLogic("DT_INTER");
    }
   if ((lastKey === "H" && char === "T") || (lastKey === "T" && char === "H")) {
      renderIntermediateNode("HT_INTER", char, instant);
      checkMasterLogic("HT_INTER");
    }
   if ((lastKey === "I" && char === "C") || (lastKey === "C" && char === "I")) {
      renderIntermediateNode("IC_INTER", char, instant);
      checkMasterLogic("IC_INTER");
    }
   if ((lastKey === "A" && char === "C") || (lastKey === "C" && char === "A")) {
      renderACSequence(char, instant);
      checkMasterLogic("AC_COMBO");
    }
  if ((lastKey === "A" && char === "K") || (lastKey === "K" && char === "A")) {
      renderAKSequence(char, instant);
      checkMasterLogic("AK_INTER");
    }
   if ((lastKey === "A" && char === "B") || (lastKey === "B" && char === "A")) {
      renderIntermediateNode("AB_INTER", char, instant);
      checkMasterLogic("AB_INTER");
    }
   if ((lastKey === "C" && char === "G") || (lastKey === "G" && char === "C")) {
      renderIntermediateNode("CG_INTER", char, instant);
      checkMasterLogic("CG_INTER");
    }

    if (char === "W") {
      handleWVariant(char);
    } else if (char === "Z" && lastKey === "Z") {
      handleZVariant(char);
    } else if (char === "A" && lastKey === "A") {
      handleAVariant(char, instant);
      checkMasterLogic("A");
    } else {
      if (char === "Y") {
        // Y 글자 자체가 먼저 확실히 뜬 뒤에만 Y_INTER 시퀀스가 시작되도록 체이닝
        processTyping(char, () => renderYSequence(char, instant));
      } else {
        processTyping(char);
      }
      if (char === "A" && !firstASequenceSpawned) {
        firstASequenceSpawned = true;
        renderAHorizontalSequence(lastPos.x, lastPos.y, char, instant);
      }
     if (char === "K") renderKDiagonalSequence(char, instant);
    if (char === "Q") renderQSequence(lastPos.x, lastPos.y, char, instant);
    if (char === "U") renderUSequence(char, instant);
     checkMasterLogic(char);
      if (char !== "A") aCounter = 0;
      if (char !== "W") wCounter = 0;
      if (char !== "Z") zCounter = 0;
    }
  }
}

function getDistanceAndAngle(prevChar, currentChar) {
  let distance = 0;
  let angle = 90;

  if (prevChar && GENETIC_MAP[prevChar] && GENETIC_MAP[currentChar] && currentChar !== prevChar) {
    const p1 = GENETIC_MAP[prevChar];
   const p2 = GENETIC_MAP[currentChar];
    distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
   if (distance < 60) angle = 90;
    else if (distance < 140) angle = 75;
    else if (distance < 240) angle = 60;
    else if (distance < 350) angle = 45;
    else if (distance < 500) angle = 30;
    else angle = 15;
  }

  return { distance, angle };
}

function processTyping(char, onReady = null) {
  const prevChar = lastKey;
  const { distance, angle } = getDistanceAndAngle(prevChar, char);
  prevDistanceForPetal = distance;
  lineStartLetterFlag = prevChar === null;
 const { nX, nY, rot } = calculateCoords(distance, angle, char === lastKey);
 createSucculentElement(char, nX, nY, rot, char, prevChar, distance, angle, onReady);
  lastPos = { x: nX, y: nY };
  moveCamera(nX, nY, "auto");
  updateDataLog(distance, angle, char === lastKey);
  const isRepeat = char === lastKey;
  lastKey = char;
  // 밀림 레이어: 생장점에서 동반종 접목 + 주기적 번식 (글자 성장 로직 자체는 건드리지 않음)
  growJungleAfterLetter(char, nX, nY, rot, isRepeat);
}

function renderAHorizontalSequence(baseX, baseY, sourceInput = "A", instant = false) {
  const spacing = 230;
  const aImages = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"];

  for (let i = 0; i < aImages.length; i++) {
    scheduleNode(() => {
      createSucculentElement(aImages[i], baseX + spacing * (i + 1), baseY, 0, sourceInput, "A", null, null);
    }, 120 * (i + 1), instant);
  }
}

function handleAVariant(sourceInput = "A", instant = false) {
  aCounter = (aCounter % 5) + 1;
  const imgName = `A_STACK${aCounter}`;
  const nX = lastPos.x;
  const nY = lastPos.y - 95;

  scheduleNode(() => {
    createSucculentElement(imgName, nX, nY, 0, sourceInput, "A", 0, 90);
  }, 180, instant);

  lastPos = { x: nX, y: nY };
  moveCamera(nX, nY, "auto");
  lastKey = "A";
  wCounter = 0;
  zCounter = 0;
}

function handleZVariant(sourceInput = "Z") {
  zCounter = (zCounter % 2) + 1;
  const imgName = zCounter === 1 ? "Z2" : "Z";
  const nX = lastPos.x + 120;
const nY = lastPos.y + 20;
 createSucculentElement(imgName, nX, nY, 0, sourceInput, "Z", 0, 90);
  lastPos = { x: nX, y: nY };
moveCamera(nX, nY, "auto");
  lastKey = "Z";
  wCounter = 0;
  aCounter = 0;
}

function renderACSequence(sourceInput = "C", instant = false) {
  renderIntermediateNode("AC_COMBO", sourceInput, instant, () => {
    scheduleNode(() => {
      createSucculentElement("AC_INTER1", lastPos.x, lastPos.y - 120, 0, sourceInput, "A/C", null, null);
    }, 220, instant);
  });
}

function renderAKSequence(sourceInput = "K", instant = false) {
  createSucculentElement("AK_INTER", lastPos.x, lastPos.y - 70, 0, sourceInput, "A/K", null, null, () => {
    scheduleNode(() => {
      createSucculentElement("AK_INTER1", lastPos.x, lastPos.y - 140, 0, sourceInput, "A/K", null, null);
    }, 220, instant);
  });
}

function renderQSequence(baseX, baseY, sourceInput = "Q", instant = false) {
  scheduleNode(() => {
    createSucculentElement("Q1", baseX + 180, baseY, 0, sourceInput, "Q", null, null);
  }, 250, instant);
}

function renderUSequence(sourceInput = "U", instant = false) {
  const baseX = lastPos.x;
  const baseY = lastPos.y;

  scheduleNode(() => {
    createSucculentElement("U_INTER", baseX + 160, baseY, 0, sourceInput, "U", null, null);
  }, 200, instant);
}

function renderDTSequence(sourceInput = "T", instant = false) {
  createSucculentElement("DT_INTER", lastPos.x, lastPos.y - 70, 0, sourceInput, "D/T", null, null, () => {
    scheduleNode(() => {
      createSucculentElement("DT_DELAYED", lastPos.x, lastPos.y - 90, 0, sourceInput, "D/T", null, null);
      checkMasterLogic("DT_DELAYED");
    }, 300, instant);
  });
}

function renderKDiagonalSequence(sourceInput = "K", instant = false) {
  const angle = Math.atan2(GENETIC_MAP.K.y, GENETIC_MAP.K.x);
  const kImages = ["K_INTER1", "K_INTER2", "K_INTER3"];
  const stepDist = 195;

  // 각 단계는 이전 이미지가 "실제로 화면에 뜬 뒤"에만 다음 단계를 예약함
  // → 큰 이미지라 로드가 느려져도 순서가 뒤바뀌거나 여러 개가 한꺼번에 튀어나오지 않음
  function spawnStep(i) {
    if (i >= kImages.length) return;
    const nX = lastPos.x + Math.cos(angle) * stepDist * (i + 1);
    const nY = lastPos.y + Math.sin(angle) * stepDist * (i + 1);
    createSucculentElement(kImages[i], nX, nY, 0, sourceInput, "K", null, null, () => {
      scheduleNode(() => spawnStep(i + 1), 120, instant);
    });
  }

  scheduleNode(() => spawnStep(0), 120, instant);
}

function renderYSequence(sourceInput = "Y", instant = false) {
  const angle = Math.atan2(GENETIC_MAP.Y.y, GENETIC_MAP.Y.x);

  // Y_INTER1을 Y와 정확히 같은 자리가 아니라 Y의 생장 방향으로 살짝 떨어뜨려서 배치
  // (같은 자리에 두면 큰 이미지가 Y를 거의 덮어버림) — 안 맞으면 이 거리값만 조절
  const yToInter1Dist = 300;
  const startX = lastPos.x + Math.cos(angle) * yToInter1Dist;
  const startY = lastPos.y + Math.sin(angle) * yToInter1Dist;

  // Y_INTER1의 뿌리(하단) 지점에서 Y_INTER2가 이어 붙도록 세로로 겹쳐서 배치
  // 딱 맞게 안 붙으면 이 숫자만 조절하면 됨 (양수 = 아래로 이어짐, 음수 = 위로 이어짐)
  const rootChainOffsetY = 320;
  // 등장 사이 리듬 간격 (ms) — 두 구간을 따로 조절 가능
  const paceYToInter1 = 300;   // Y 등장 → Y_INTER1 등장까지 간격
  const paceInter1ToInter2 = 300; // Y_INTER1 등장 → Y_INTER2 등장까지 간격

  // 이 함수는 Y 글자 자체가 이미 화면에 뜬 뒤에만 호출됨 (processCharacter에서 체이닝)
  // Y_INTER1, Y_INTER2 모두 "실제로 화면에 뜬 뒤(onReady) + 리듬 간격"에만 다음 단계가 생성됨
  // → 로드 속도가 달라도 순서가 절대 뒤바뀌지 않으면서, 박자감 있게 등장함
  scheduleNode(() => {
    createSucculentElement("Y_INTER1", startX, startY, 0, sourceInput, "Y", null, null, () => {
      scheduleNode(() => {
        createSucculentElement("Y_INTER2", startX, startY + rootChainOffsetY, 0, sourceInput, "Y", null, null);
      }, paceInter1ToInter2, instant);
    });
  }, paceYToInter1, instant);
}

function handleWVariant(sourceInput = "W") {
  let imgName;
  let nX;
  let nY;

  if (lastKey !== "W") {
    wCounter = 0;
    imgName = "W";
    const coords = calculateCoords(0, 90, false);
    nX = coords.nX;
    nY = coords.nY;
  } else {
    wCounter = (wCounter % 9) + 1;
    imgName = `W${wCounter}`;
    nX = lastPos.x;
    nY = lastPos.y - 80;
  }

  createSucculentElement(imgName, nX, nY, 0, sourceInput, lastKey, 0, 90);
  
  lastPos = { x: nX, y: nY };
  moveCamera(nX, nY, "auto");
 
  lastKey = "W";
  checkMasterLogic("W");
  aCounter = 0;
  zCounter = 0;
}

function renderIntermediateNode(imgName, sourceInput = "-", instant = false, onReady = null) {
  const x = lastPos.x + Math.random() * 60 - 30;
  const y = lastPos.y - 70;
  const prev = lastKey;
  scheduleNode(() => {
    createSucculentElement(imgName, x, y, 0, sourceInput, prev, null, null, onReady);
  }, 160, instant);
}

function renderRandomNode(imgName, sourceInput = "?") {
  createSucculentElement(
    imgName,
    (window.scrollX + Math.random() * window.innerWidth) / (window.VIEW_ZOOM || 1),
    (window.scrollY + Math.random() * window.innerHeight) / (window.VIEW_ZOOM || 1),
    Math.random() * 360,
    sourceInput,
    lastKey,
    null,
    null
  );
}

// 다육이 성장 로직(위치/각도/유전자맵) 자체에는 관여하지 않지만,
// 타이핑되는 다육이 근처 땅바닥에 눌러 놓인 것처럼 숫자를 배치함
// (lastPos만 "읽어서" 위치를 잡을 뿐, lastKey/lastPos/growthAngle 등은 건드리지 않음)
function renderNumberChar(char) {
  const anchorX = lastPos.x;
  const anchorY = lastPos.y;

  if (char === "0") {
    numberZeroCounter = lastNumberChar === "0" ? (numberZeroCounter % NUMBER_ZERO_VARIANTS.length) + 1 : 1;
    createGroundStone([NUMBER_ZERO_VARIANTS[numberZeroCounter - 1]], anchorX, anchorY, false);
  } else if (char === "1") {
    // 숫자 1은 항상 모래가 흩뿌려지듯 여러 개가 한번에, 겹치듯 타이핑됨
    numberZeroCounter = 0;
    const count = NUMBER_ONE_SCATTER_MIN + Math.floor(seededRandom(nextStoneSeed()) * (NUMBER_ONE_SCATTER_MAX - NUMBER_ONE_SCATTER_MIN + 1));
    const scatterImages = Array.from({ length: count }, () => "01");
    createGroundStone(scatterImages, anchorX, anchorY, true);
  } else {
    numberZeroCounter = 0;
    createGroundStone([NUMBER_IMAGE_CONFIG[char]], anchorX, anchorY, false);
  }

  lastNumberChar = char;
}

// 기호(", @, *, &, %)도 숫자와 똑같은 방식으로 다육이 근처에 섞여서 배치됨
function renderSymbolChar(char) {
  const anchorX = lastPos.x;
  const anchorY = lastPos.y;
  createGroundStone([SYMBOL_IMAGE_CONFIG[char]], anchorX, anchorY, false);
}

function createGroundStone(imgNames, anchorX, anchorY, isScatter = false) {
  if (!stage) return;

  const node = document.createElement("div");
  node.className = "number-node";
  node.style.position = "absolute";
  node.style.pointerEvents = "none";

  // 다육이 바로 옆/위에 겹치듯 붙어서, 하나의 덩어리처럼 섞여 보이도록 배치
  // (완전히 가려도 괜찮음 - 다육이 성장 좌표계와 같은 깊이 규칙으로 z-index를 계산해서
  //  다육이보다 앞에 오기도, 뒤에 깔리기도 함)
  const jitterX = (seededRandom(nextStoneSeed()) - 0.5) * 80;
  const jitterY = -25 + seededRandom(nextStoneSeed()) * 55;
  const cx = anchorX + jitterX;
  const cy = anchorY + jitterY;
  const rot = seededRandom(nextStoneSeed()) * 34 - 17;

  const depthZ = Math.floor(5000 - (cy - START_Y)) + Math.floor(seededRandom(nextStoneSeed()) * 60 - 20);
  const shouldFade = !currentInstant;
  // 등장은 즉시(깜빡임 없이), z-index만 잠시 최상단으로 올렸다가 조용히 원래 깊이로 되돌림
  node.style.zIndex = shouldFade ? String(ENTRANCE_Z_INDEX) : String(depthZ);
  node.style.opacity = "1";
  node.style.transform = `rotate(${rot}deg)`;

  if (isScatter) {
    const grainWidth = NUMBER_BASE_WIDTH * STONE_SCALE_CONFIG["01"] * 0.55;
    const spread = grainWidth * 3.2;
    node.style.width = `${spread}px`;
    node.style.height = `${spread}px`;
    node.style.left = `${cx - spread / 2}px`;
    node.style.top = `${cy - spread / 2}px`;
    imgNames.forEach((name) => {
      appendNumberImage(node, name, grainWidth, true);
    });
  } else {
    const name = imgNames[0];
    const width = NUMBER_BASE_WIDTH * (STONE_SCALE_CONFIG[name] || 1);
    node.style.width = `${width}px`;
    node.style.height = `${width}px`;
    node.style.left = `${cx - width / 2}px`;
    node.style.top = `${cy - width / 2}px`;
    appendNumberImage(node, name, width, false);
  }

  stage.appendChild(node);

  if (shouldFade) {
    setTimeout(() => {
      node.style.zIndex = String(depthZ);
    }, ENTRANCE_SETTLE_MS);
  }
}

function appendNumberImage(container, name, widthPx, isScatterGrain) {
  const cached = imageCache[name];
  const img = cached ? cached.cloneNode(false) : new Image();
  // 숫자/기호 이미지가 폴더에 없으면 깨진 아이콘 대신 아무것도 표시하지 않음
  img.onerror = () => img.remove();
  img.decoding = "async";
  img.loading = "eager";
  img.draggable = false;
  img.style.width = `${widthPx}px`;
  img.style.height = "auto";

  if (isScatterGrain) {
    const angleDeg = seededRandom(nextStoneSeed()) * 360;
    const dist = seededRandom(nextStoneSeed()) * widthPx * 0.9;
    const offsetX = Math.cos((angleDeg * Math.PI) / 180) * dist;
    const offsetY = Math.sin((angleDeg * Math.PI) / 180) * dist;
    img.style.position = "absolute";
    img.style.left = `calc(50% + ${offsetX}px)`;
    img.style.top = `calc(50% + ${offsetY}px)`;
    img.style.transform = `translate(-50%, -50%) rotate(${seededRandom(nextStoneSeed()) * 360}deg)`;
  } else {
    img.style.display = "block";
  }

  if (!cached) img.src = `./images/${name}.png`;
  container.appendChild(img);
}

function createSucculentElement(imgName, x, y, rot, sourceInput = "-", prevInput = "-", distance = null, angle = null, onReady = null) {
  if (!stage) return;

  const node = document.createElement("div");
  node.className = "succulent-node";

  const config = IMAGE_CONFIG[imgName] || { scale: 1.0, offsetY: 0, isMutant: false };
  node.classList.add(config.isMutant ? "mutant-type" : "normal-type");

  // 이 노드가 최종적으로 안착할 깊이(z-index). 다른 다육이들과의 앞뒤 관계를 결정함.
  const depthZ =
    imgName === "DOT_MARK"
      ? 999999
      : imgName.includes("INTER") || imgName === "DT_DELAYED"
      ? 9000
      : Math.floor(5000 - (y - START_Y));

  recordReceipt(imgName, x, y, rot, sourceInput, prevInput, distance, angle, config);

  const baseWidth = 320 * config.scale;

  node.style.left = `${x - baseWidth / 2}px`;
  node.style.top = `${y - baseWidth / 2 + (config.offsetY || 0)}px`;

  const restingTransform = `rotate(${rot}deg)`;

  // 이미지를 로드 완료 후에 DOM에 추가하는 함수
  const shouldFade = !currentInstant;
  // 타이핑되는 순간의 등장 자체는 원래대로 담백하게(즉시) — 대신 이미 자리 잡은 모든 개체에게
  // 지속적으로 은은한 "살아있는" 흔들림(idle drift)을 부여함. 같은 속(genus)은 같은 리듬 계열을 공유하되,
  // 개체마다 위상(딜레이)이 달라서 다 같이 맞춰 움직이지 않고 제각각 미세하게 일렁임 → 더 기괴하고 신비로운 느낌
  const genusMotion = getGenusStyle(sourceInput, imgName).motion;
  const animDuration = `${(7 + Math.random() * 5).toFixed(2)}s`;
  const animDelay = `-${(Math.random() * 9).toFixed(2)}s`;

  const addToStage = () => {
    node.style.opacity = "1";
    node.style.transform = restingTransform;
    registerLivingNode(node, x, y, rot);

    // 갓 돋아난 노드는 잠시 동안 주변의 기존 개체들보다 앞에 보이도록
    // (타이핑한 게 바로 가려지지 않게) 임시로 깊이를 최상단으로 올려두고,
    // 자리 잡을 시간이 지나면 원래의 깊이 규칙으로 조용히 돌려놓음
    // (등장 자체는 페이드/스케일 없이 즉시 - 깜빡이는 팝업 느낌을 없애기 위해
    //  z-index만 바뀔 뿐, 화면상 티가 나지 않음)
    node.style.zIndex = shouldFade ? String(ENTRANCE_Z_INDEX) : String(depthZ);

    stage.appendChild(node);
    if (shouldFade) {
      setTimeout(() => {
        node.style.zIndex = String(depthZ);
      }, ENTRANCE_SETTLE_MS);
    }
    if (typeof onReady === "function") onReady();
  };

  // ===== 분리된 조각 이미지들을 같은 위치에 겹쳐 쌓아 기존 합성 이미지처럼 재구성 =====
  // (SPLIT_LAYER_MAP에 등록된 글자만 해당 — 등록되지 않은 글자(Z 등)는 아래 기존 방식 그대로)
  const layerNames = SPLIT_LAYER_MAP[imgName];
  if (layerNames && layerNames.length) {
    const ratio = SPLIT_LAYER_RATIO[imgName] || 1;
    const wrap = document.createElement("div");
    wrap.className = "succulent-layer-wrap";
    wrap.style.position = "relative";
    wrap.style.width = `${baseWidth}px`;
    wrap.style.height = `${baseWidth * ratio}px`;
    node.appendChild(wrap);

    // 조각 이미지들이 전부 로드될 때까지 기다리지 않고 노드를 즉시 무대에 올림
    // → 타이핑 자체는 렉 없이 바로 반응하고, 조각들은 이 아래에서 순서대로
    //   "자라나듯" 하나씩 나타남 (한번에 합쳐져서 등장하지 않음)
    addToStage();

    const GROWTH_STEP_MS = 260; // 조각이 하나씩 자라나는 간격

    layerNames.forEach((layerName, index) => {
      scheduleNode(() => {
        const cacheKey = `parts/${layerName}`;
        const cachedLayer = imageCache[cacheKey];
        const layerImg = cachedLayer ? cachedLayer.cloneNode(false) : new Image();
        layerImg.decoding = "async";
        layerImg.loading = "eager";
        layerImg.fetchPriority = "high";
        layerImg.draggable = false;
        layerImg.style.position = "absolute";
        layerImg.style.left = "0";
        layerImg.style.top = "0";
        layerImg.style.width = "100%";
        layerImg.style.height = "100%";
        layerImg.classList.add(`idle-${genusMotion}`);
        layerImg.style.animationDuration = animDuration;
        layerImg.style.animationDelay = animDelay;
        wrap.appendChild(layerImg);

        if (!cachedLayer) {
          // 이미 로딩 중(다른 곳에서 먼저 요청)이면 그 요청을 그대로 재사용하고,
          // 아니면 여기서 새로 요청 - 어느 쪽이든 실제 네트워크 요청은 한 번만 발생
          loadSplitLayerImage(layerName).then((loadedImg) => {
            if (loadedImg) {
              layerImg.src = loadedImg.src;
            } else {
              console.warn("Missing split-layer image:", cacheKey);
            }
          });
        }
      }, GROWTH_STEP_MS * index, currentInstant);
    });
    return;
  }

  // ===== 기존 방식: 완성된 합성 이미지 1장을 그대로 사용 =====
  const cachedImg = imageCache[imgName];
  const img = cachedImg ? cachedImg.cloneNode(false) : new Image();

  img.decoding = "async";
  img.loading = "eager";
  img.fetchPriority = "high";
  img.style.width = `${baseWidth}px`;
  img.style.height = "auto";
  img.draggable = false;
  img.classList.add(`idle-${genusMotion}`);
  img.style.animationDuration = animDuration;
  img.style.animationDelay = animDelay;

  img.onerror = () => {
    const fallbackName = IMAGE_FALLBACK_MAP[imgName] || "A";
    if (img.dataset.fallbackTried === "true") {
      img.style.display = "none";
      node.innerHTML = `<span style="color:#000; font-size:10px; background:#fff; border:1px solid red;">Missing: ${imgName}</span>`;
      console.warn("Missing image:", imgName);
      addToStage();
      return;
    }

    img.dataset.fallbackTried = "true";

    // 실패한 이미지가 아니라 대체(fallback) 이미지 자체의 스케일 기준으로 크기/위치를 다시 계산
    // (예: ECHEVERIA_MASTER처럼 큰 이미지가 실패해서 A로 대체될 때, A가 거대하게 보이는 버그 방지)
    const fallbackConfig = IMAGE_CONFIG[fallbackName] || { scale: 1.0, offsetY: 0 };
    const fallbackWidth = 320 * fallbackConfig.scale;
    img.style.width = `${fallbackWidth}px`;
    node.style.left = `${x - fallbackWidth / 2}px`;
    node.style.top = `${y - fallbackWidth / 2 + (fallbackConfig.offsetY || 0)}px`;

    img.src = imageCache[fallbackName]?.src || resolveImagePath(fallbackName);
    console.warn(`Missing image: ${imgName}. Fallback to ${fallbackName}.`);
  };

  if (cachedImg) {
    // 캐시가 있으면 이미 로드됨 → 바로 DOM 추가
    node.appendChild(img);
    addToStage();
  } else {
    // 캐시가 없으면 로드 완료 후 DOM 추가
    img.onload = () => {
      node.appendChild(img);
      addToStage();
    };
    img.src = resolveImagePath(imgName);
  }
}

function recordReceipt(imgName, x, y, rot, sourceInput, prevInput, distance, angle, config) {
  const genetic = GENETIC_MAP[sourceInput] || GENETIC_MAP[imgName] || null;

  receiptRecords.push({
    no: receiptRecords.length + 1,
    input: sourceInput,
    previous: prevInput || "-",
    image: imgName,
    species: SPECIES_MAP[imgName] || SPECIES_MAP[sourceInput] || imgName,
    type: config.isMutant ? "MUTANT / HYBRIDIZED" : "BASE",
    geneticX: genetic ? genetic.x : "-",
    geneticY: genetic ? genetic.y : "-",
    distance: distance === null ? "-" : Math.round(distance),
    angle: angle === null ? "-" : `${angle}°`,
    stageX: Math.round(x - START_X),
    stageY: Math.round(START_Y - y),
    rotation: `${Math.round(rot)}°`
  });

  updateReceiptIfOpen();
}

function buildReceiptText() {
  const lines = [];
  
  const inputSequence = typedHistory.join("").replace(/\n/g, " ↵ ");
  lines.push("==========================================");
  lines.push("        SUCCULENT GENETIC RECEIPT");
  lines.push("==========================================");
  lines.push(`INPUT SEQUENCE : ${inputSequence || "-"}`);
  lines.push(`TOTAL RECORDS  : ${receiptRecords.length}`);
  lines.push(`DATE           : ${new Date().toLocaleString()}`);
  lines.push("------------------------------------------");

  receiptRecords.forEach((item) => {
    lines.push(`#${String(item.no).padStart(3, "0")}`);
    lines.push(`TYPE      : ${item.type}`);
    lines.push(`INPUT     : ${item.input}`);
    lines.push(`PREVIOUS  : ${item.previous}`);
    lines.push(`IMAGE     : ${item.image}`);
    lines.push(`SPECIES   : ${item.species}`);
    lines.push(`GENETIC   : x ${item.geneticX}, y ${item.geneticY}`);
    lines.push(`DISTANCE  : ${item.distance}`);
    lines.push(`ANGLE     : ${item.angle}`);
    lines.push(`POSITION  : x ${item.stageX}, y ${item.stageY}`);
    lines.push(`ROTATION  : ${item.rotation}`);
    lines.push("------------------------------------------");
  });

  lines.push("          END OF GERMINATION");
  lines.push("==========================================");
 
  return lines.join("\n");
}

function updateReceiptIfOpen() {
  requestXrayDraw(); // 시간차로 늦게 생기는 기록(시퀀스 변이 등)도 X-ray에 이어 그림
  const panel = document.getElementById("receipt-panel");
 
  const content = document.getElementById("receipt-content");
  if (!panel || !content) return;
 
  if (panel.classList.contains("show")) {
    content.textContent = buildReceiptText();
    content.scrollTop = content.scrollHeight;
  }
}

function toggleReceipt() {
  
  const panel = document.getElementById("receipt-panel");
  const content = document.getElementById("receipt-content");
 
  if (!panel || !content) return;

  if (panel.classList.contains("show")) {
    panel.classList.remove("show");
  } else {
    content.textContent = buildReceiptText();
    panel.classList.add("show");
    content.scrollTop = content.scrollHeight;
  }
}

function closeReceipt() {
  const panel = document.getElementById("receipt-panel");
  if (panel) panel.classList.remove("show");
}

function downloadReceipt() {
  const text = buildReceiptText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `succulent_genetic_receipt_${Date.now()}.txt`;
  link.click();
 
  URL.revokeObjectURL(link.href);
}

function calculateCoords(dist, angle, isSame) {
  const step = 108;
  const sameStep = 72;

  if (lastKey === null) {
    growthAngle = -90;
    return { nX: lastPos.x, nY: lastPos.y, rot: 0 };
  }

  if (isSame) {
    const side = Math.sin(typedHistory.length * 1.7) > 0 ? 1 : -1;
    const curve = Math.sin(typedHistory.length * 0.9) * 14;
    return { nX: lastPos.x + side * sameStep, nY: lastPos.y - 26 + curve * 0.15, rot: side * 7 };
  }

  const geneticInfluence = Math.max(8, Math.min(42, angle * 0.42));
  const wave = Math.sin(typedHistory.length * 0.82) * 9;
  const side = Math.cos(typedHistory.length * 1.13) > 0 ? 1 : -1;
  growthAngle += side * geneticInfluence * 0.18 + wave * 0.35;
  growthAngle = Math.max(-128, Math.min(-52, growthAngle));
  const rad = (growthAngle * Math.PI) / 180;

  return {
    nX: lastPos.x + Math.cos(rad) * step,
    nY: lastPos.y + Math.sin(rad) * step,
    rot: growthAngle + 90
  };
}

function moveCamera(x, y, behavior = "auto") {
  if (cameraLocked) return;
  const z = window.VIEW_ZOOM || 1;
  const vh = window.innerHeight;
  const top = window.CAMERA_TOP_INSET || 0;
  const bottom = window.CAMERA_BOTTOM_INSET || 0;
  // 가려지지 않은 영역 안에서 성장점이 보이도록 (데스크톱은 기존과 같이 화면 위 35% 지점)
  const fy = bottom || top ? top + Math.max(120, vh - top - bottom) * 0.55 : vh * 0.35;
  window.scrollTo({ left: x * z - window.innerWidth / 2, top: y * z - fy, behavior });
}

function updateDataLog(dist, angle, isSame) {
  
  if (!distLog || !angleLog) return;
  distLog.innerText = isSame ? "CLUSTER" : `${Math.round(dist)}mm`;
  angleLog.innerText = isSame ? "GROWTH" : `${angle}°`;
}

async function captureFullStage() {

  console.time("SAVE");

  // X-Ray 모드면 초록 골격(SVG) 레이어를 따로 저장
  if (document.body.classList.contains("xray-active")) {
    await captureXrayStage();
    console.timeEnd("SAVE");
    return;
  }

  const nodes = [...document.querySelectorAll(".succulent-node")];
  const MAX_SAVE_NODES = 250;

if (nodes.length > MAX_SAVE_NODES) {
  nodes.splice(0, nodes.length - MAX_SAVE_NODES);
}
  if (nodes.length === 0) return;

 
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "...";
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    const left = parseFloat(node.style.left);
    const top = parseFloat(node.style.top);
   
    const img = node.querySelector("img");
    const width = img ? img.offsetWidth : 600;
  
    const height = img ? img.offsetHeight : 600;
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, left + width);
    maxY = Math.max(maxY, top + height);
  });

  const padding = 300;
  
  const captureWidth = Math.ceil(maxX - minX + padding * 2);

  const captureHeight = Math.ceil(maxY - minY + padding * 2);
  
  
  const captureBox = document.createElement("div");
  captureBox.style.position = "fixed";
  captureBox.style.left = "-99999px";
  captureBox.style.top = "0";
  captureBox.style.width = `${captureWidth}px`;
  captureBox.style.height = `${captureHeight}px`;
  captureBox.style.background = "#ffffff";
  captureBox.style.overflow = "hidden";

  nodes.forEach((node) => {
  
    const clone = node.cloneNode(true);
    const originalLeft = parseFloat(node.style.left);    const originalTop = parseFloat(node.style.top);
    clone.style.left = `${originalLeft - minX + padding}px`;    clone.style.top = `${originalTop - minY + padding}px`;
    captureBox.appendChild(clone);
  });

  document.body.appendChild(captureBox);

await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    if (typeof html2canvas === "undefined") {
      // 첫 화면 로딩을 막지 않도록 저장 버튼을 누를 때만 불러옴
      await new Promise((resolve) => {
        const sc = document.createElement("script");
        sc.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        sc.onload = resolve;
        sc.onerror = resolve;
        document.head.appendChild(sc);
      });
    }
    if (typeof html2canvas === "undefined") {
      console.error("html2canvas가 로드되지 않았습니다.");
      return;
    }

   const canvas = await html2canvas(
  captureBox,
  {
      backgroundColor:"#ffffff",
      useCORS:true,
      scale:1
  }
);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `succulent_${Date.now()}.png`;
    link.click();
  } catch (err) {
    console.error("Save failed:", err);
  } finally {
    console.timeEnd("SAVE");
    captureBox.remove();
   if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "↓";
    }
  }
}

async function captureXrayStage() {
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "...";
  }

  try {
    if (!growthBranchLayer || receiptRecords.length === 0) return;

    // 식물이 그려진 좌표 범위 계산 (SVG는 화면 전체 좌표 기준)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    receiptRecords.forEach((item) => {
      const x = START_X + item.stageX;
      const y = START_Y - item.stageY;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    const padding = 300;
    const boxX = minX - padding;
    const boxY = minY - padding;
    const boxW = Math.ceil(maxX - minX + padding * 2);
    const boxH = Math.ceil(maxY - minY + padding * 2);

    // 골격 SVG 내용을 복제해 딱 맞는 크기의 새 SVG로 감쌈
    const svgNS = "http://www.w3.org/2000/svg";
    const exportSvg = document.createElementNS(svgNS, "svg");
    exportSvg.setAttribute("xmlns", svgNS);
    exportSvg.setAttribute("width", boxW);
    exportSvg.setAttribute("height", boxH);
    exportSvg.setAttribute("viewBox", `${boxX} ${boxY} ${boxW} ${boxH}`);

    // 흰 배경
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("x", boxX);
    bg.setAttribute("y", boxY);
    bg.setAttribute("width", boxW);
    bg.setAttribute("height", boxH);
    bg.setAttribute("fill", "#ffffff");
    exportSvg.appendChild(bg);

    // 골격 선들을 복제 + 초록색 스타일을 인라인으로 직접 지정
    [...growthBranchLayer.childNodes].forEach((child) => {
      if (child.nodeType !== 1) return;
      const c = child.cloneNode(true);
      applyXrayInlineStyle(c);
      exportSvg.appendChild(c);
    });

    // SVG → 이미지 → 캔버스 → PNG
    const svgString = new XMLSerializer().serializeToString(exportSvg);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = boxW;
        canvas.height = boxH;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, boxW, boxH);
        ctx.drawImage(image, 0, 0);
        URL.revokeObjectURL(url);

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `succulent_xray_${Date.now()}.png`;
        link.click();
        resolve();
      };
      image.onerror = reject;
      image.src = url;
    });
  } catch (err) {
    console.error("X-Ray save failed:", err);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "↓";
    }
  }
}

// 골격 요소에 초록색 스타일을 인라인으로 적용 (CSS가 안 따라오므로 직접 지정)
function applyXrayInlineStyle(el) {
  if (el.nodeType !== 1) return;
  const tag = el.tagName.toLowerCase();
  if (tag === "g" && el.classList && el.classList.contains("xray-genus")) {
    // 속(genus)별 색조 필터는 style.css의 클래스 규칙으로 적용되는데,
    // 내보내기용 SVG는 외부 스타일시트가 없는 별도 문서라 클래스만으로는 적용 안 됨.
    // 클래스명에 이미 색상각(hue)이 들어있으니 그걸 그대로 읽어서 인라인으로 직접 지정
    const hueClass = [...el.classList].find((c) => c.startsWith("xray-hue-"));
    const hue = hueClass ? hueClass.replace("xray-hue-", "") : null;
    if (hue && hue !== "0") el.setAttribute("style", `filter:hue-rotate(${hue}deg)`);
  }
  if (["path", "line", "ellipse", "circle"].includes(tag)) {
    const isDot = el.classList && el.classList.contains("growth-dot");
    if (isDot) {
      el.setAttribute("fill", "rgb(60, 150, 80)");
      el.setAttribute("stroke", "none");
    } else {
      el.setAttribute("fill", "none");
      el.setAttribute("stroke", "rgb(60, 150, 80)");
      el.setAttribute("stroke-width", el.getAttribute("data-sw") || "1.5");
    }
  }
  [...el.childNodes].forEach(applyXrayInlineStyle);
}

function toggleMutantOnly() {
  stage.classList.toggle("only-mutant-view");
 const btn = document.getElementById("decode-btn");
  if (!btn) return;
  btn.textContent = stage.classList.contains("only-mutant-view") ? "[NORMAL VIEW]" : "[MUTANT VIEW]";
}

function checkMasterLogic(name) {
  collectedSet.add(name);
 if (masterSpawned) return;
  const ready = REQUIRED_FOR_MASTER.every((item) => collectedSet.has(item));

  if (ready) {
    masterSpawned = true;
    createSucculentElement("ECHEVERIA_MASTER", lastPos.x, lastPos.y - 240, 0, "MASTER", "SYSTEM", null, null);
  }
}

function toggleCoordinateLayer() {
  const coordLayer = document.getElementById("coord-layer");
  const btn = document.getElementById("coord-toggle");
 if (!coordLayer || !btn) return;
  coordLayer.classList.toggle("show");
  btn.classList.toggle("active");
}

function createCoordinateLayer() {
  const coordLayer = document.getElementById("coord-layer");
    if (!coordLayer) return;
    coordLayer.innerHTML = "";

  const spacing = 220;
const labelSpacing = 1000;

  for (let x = 0; x <= STAGE_SIZE; x += spacing) {
    const line = document.createElement("div");
    line.className = "coord-line vertical";
    if (x === START_X) line.classList.add("coord-axis");
    line.style.left = `${x}px`;
    line.style.top = "0px";
    coordLayer.appendChild(line);

    if (x % labelSpacing === 0) {
      const label = document.createElement("div");
      label.className = "coord-label";
      label.style.left = `${x + 5}px`;
      label.style.top = `${START_Y + 8}px`;
      label.innerText = `x ${x - START_X}`;
      coordLayer.appendChild(label);
    }
  }

  for (let y = 0; y <= STAGE_SIZE; y += spacing) {
    const line = document.createElement("div");
    line.className = "coord-line horizontal";
    if (y === START_Y) line.classList.add("coord-axis");
    line.style.left = "0px";
    line.style.top = `${y}px`;
    coordLayer.appendChild(line);

    if (y % labelSpacing === 0) {
      const label = document.createElement("div");
      label.className = "coord-label";
      label.style.left = `${START_X + 8}px`;
      label.style.top = `${y + 5}px`;
      label.innerText = `y ${START_Y - y}`;
      coordLayer.appendChild(label);
    }
  }
}

function toggleGrowthMapPanel() {
  const panel = document.getElementById("growth-map-panel");
  const btn = document.getElementById("growth-map-btn");
  if (!panel || !btn) return;
  panel.classList.toggle("show");
  btn.classList.toggle("active", panel.classList.contains("show"));
  drawGrowthMapPanel();
  updateGrowthMapTypedPath();
}

function closeGrowthMapPanel() {
  const panel = document.getElementById("growth-map-panel");
  const btn = document.getElementById("growth-map-btn");
  if (panel) panel.classList.remove("show");
  if (btn) btn.classList.remove("active");
}

function drawGrowthMapPanel() {
  const svg = document.getElementById("growth-map-svg");
  if (!svg) return;
  svg.innerHTML = "";
  const centerX = 260;
  const centerY = 260;
  const scale = 0.78;
  addMapLine(svg, 30, centerY, 490, centerY, 0.22);
  addMapLine(svg, centerX, 30, centerX, 490, 0.22);

  Object.keys(GENETIC_MAP).forEach((key) => {
    const p = GENETIC_MAP[key];
    const x = centerX + p.x * scale;
    const y = centerY - p.y * scale;
    addMapCircle(svg, x, y, 4, key);
    addMapText(svg, key, x + 8, y + 4);
  });
}

function updateGrowthMapTypedPath() {
  const svg = document.getElementById("growth-map-svg");
  if (!svg) return;
  svg.querySelectorAll(".typed-path").forEach((el) => el.remove());
  const centerX = 260;
  const centerY = 260;
  const scale = 0.78;
  const typedLetters = typedHistory.filter((v) => GENETIC_MAP[v]);

  for (let i = 1; i < typedLetters.length; i++) {
    const prev = GENETIC_MAP[typedLetters[i - 1]];
    const curr = GENETIC_MAP[typedLetters[i]];
    addMapLine(svg, centerX + prev.x * scale, centerY - prev.y * scale, centerX + curr.x * scale, centerY - curr.y * scale, 0.62, "typed-path");
  }
}

function addMapLine(svg, x1, y1, x2, y2, opacity = 0.35, className = "") {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", `rgba(${XRAY_COLOR.r},${XRAY_COLOR.g},${XRAY_COLOR.b},${opacity})`);
  line.setAttribute("stroke-width", className === "typed-path" ? "1.8" : "1.1");
  if (className) line.setAttribute("class", className);
  svg.insertBefore(line, svg.firstChild);
}

function addMapCircle(svg, x, y, r, key) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", y);
  circle.setAttribute("r", r);
  circle.setAttribute("data-key", key);
  svg.appendChild(circle);
}

function addMapText(svg, text, x, y) {
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", x);
  label.setAttribute("y", y);
  label.textContent = text;
  svg.appendChild(label);
}

function toggleGrowthXray() {
  const btn = document.getElementById("growth-xray-btn");
  document.body.classList.toggle("xray-active");
  if (btn) btn.classList.toggle("active", document.body.classList.contains("xray-active"));
  if (growthBranchLayer) growthBranchLayer.style.display = document.body.classList.contains("xray-active") ? "block" : "none";
  drawGlobalGrowthBranch();
}

function getSkeletonBaseChar(sourceInput, imgName) {
  if (GENETIC_MAP[sourceInput]) return sourceInput;
  const fromImage = String(imgName || "").charAt(0);
  if (GENETIC_MAP[fromImage]) return fromImage;
  return "A";
}

function clearGlobalGrowthBranch() {
  if (!growthBranchLayer) return;
  growthBranchLayer.innerHTML = "";
  if (receiptRecords.length > 250) return;
}

// X-ray 렌더링 상태 — 이미 그린 기록은 다시 그리지 않음
// (예전엔 글자 하나마다 SVG 전체를 지우고 수천 개 요소를 다시 만들어서, 빨리 치면 렉이 걸렸음)
let xrayDrawn = 0;          // 그려진 receiptRecords 개수
let xrayMainCount = 0;      // 주 성장선에 올라간 글자 수
let xrayCompanionCount = 0;
let xrayLastMain = null;
let xrayGroups = null;      // { companion, branch, nodes } — 원래 그리는 순서(겹침 순서) 유지용
let xrayRaf = null;

function requestXrayDraw() {
  if (!growthBranchLayer || !document.body.classList.contains("xray-active")) return;
  if (xrayRaf !== null) return;
  xrayRaf = requestAnimationFrame(() => {
    xrayRaf = null;
    xrayAppendNew();
  });
}

// 전체 다시 그리기 (X-ray 켤 때, 백스페이스 등으로 전체 재계산할 때만)
function drawGlobalGrowthBranch() {
  if (!growthBranchLayer) return;
  if (xrayRaf !== null) { cancelAnimationFrame(xrayRaf); xrayRaf = null; }
  growthBranchLayer.innerHTML = "";
  xrayDrawn = 0;
  xrayMainCount = 0;
  xrayCompanionCount = 0;
  xrayLastMain = null;
  xrayGroups = null;

  if (!document.body.classList.contains("xray-active")) {
    growthBranchLayer.style.display = "none";
    return;
  }
  growthBranchLayer.style.display = "block";

  const mk = () => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    growthBranchLayer.appendChild(g);
    return g;
  };
  xrayGroups = { companion: mk(), branch: mk(), nodes: mk() };
  xrayAppendNew();
}

function xrayAppendNew() {
  if (!growthBranchLayer || !document.body.classList.contains("xray-active")) return;
  if (!xrayGroups || !xrayGroups.nodes.isConnected || receiptRecords.length < xrayDrawn) {
    drawGlobalGrowthBranch();
    return;
  }
  const prevGroup = currentBranchGroup;

  for (let index = xrayDrawn; index < receiptRecords.length; index++) {
    const item = receiptRecords[index];
    const p = {
      x: START_X + item.stageX,
      y: START_Y - item.stageY,
      input: item.companion ? item.baseLetter : item.input,
      image: item.image,
      companion: !!item.companion,
      parentX: item.parentX,
      parentY: item.parentY,
      drawWidth: item.drawWidth,
      rotDeg: item.rotDeg || 0,
      index
    };

    if (p.companion) {
      // 동반종은 주 성장선에 끼어들지 않고, 부모 생장점에서 뻗은 덩굴손으로만 연결
      if (xrayCompanionCount >= 200) continue;
      xrayCompanionCount++;
      currentBranchGroup = xrayGroups.companion;
      const mx = (p.parentX + p.x) / 2 + Math.sin(p.index) * 40;
      const my = Math.min(p.parentY, p.y) - 46;
      branchPath(`M ${p.parentX} ${p.parentY} Q ${mx} ${my} ${p.x} ${p.y}`, 0.3, 1.05);
      drawCompanionSkeleton(p);
      continue;
    }

    if (xrayMainCount >= 500) continue;
    const i = xrayMainCount;
    xrayMainCount++;

    if (i === 0) {
      currentBranchGroup = xrayGroups.nodes;
      branchCircle(p.x, p.y, 5.2, true);
    } else {
      const prev = xrayLastMain;
      const curr = p;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const cx1 = prev.x + Math.cos(angle - 0.55) * dist * 0.35 + Math.sin(i * 0.8) * 34;
      const cy1 = prev.y + Math.sin(angle - 0.55) * dist * 0.35 - 64;
      const cx2 = prev.x + Math.cos(angle + 0.35) * dist * 0.72 + Math.cos(i * 0.5) * 48;
      const cy2 = prev.y + Math.sin(angle + 0.35) * dist * 0.72 - 78;
      currentBranchGroup = xrayGroups.branch;
      branchPath(`M ${prev.x} ${prev.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`, 0.42, 1.65);
      if (i < 120) drawGrowthAlongBranch(prev, curr, i);
    }

    currentBranchGroup = xrayGroups.nodes;
    branchCircle(p.x, p.y, 4.8, true);
    drawCompositePlantAtNode(p.input, p.image, p.x, p.y, p.index * 0.34, p.index);
    xrayLastMain = p;
  }

  xrayDrawn = receiptRecords.length;
  currentBranchGroup = prevGroup;
}

function drawGrowthAlongBranch(prev, curr, index) {
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const count = Math.max(3, Math.min(10, Math.floor(dist / 58)));

  for (let j = 1; j <= count; j++) {
    const t = j / (count + 1);
    const bx = prev.x + dx * t;
    const by = prev.y + dy * t - Math.sin(t * Math.PI) * 38;
    const side = j % 2 === 0 ? 1 : -1;
    const len = 42 + Math.sin(index + j) * 18;
    const a = angle + side * (0.78 + j * 0.04);
    const ex = bx + Math.cos(a) * len;
    const ey = by + Math.sin(a) * len;

    branchPath(`M ${bx} ${by} Q ${(bx + ex) / 2} ${by - 18} ${ex} ${ey}`, 0.28, 0.95);
    branchCircle(ex, ey, 1.8, true);
  }
}

function drawCompositePlantAtNode(input, imageName, x, y, angle = 0, index = 0) {
  const genusHue = getGenusStyle(input, imageName).hue;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", `xray-genus xray-hue-${genusHue}`);
  (currentBranchGroup || growthBranchLayer).appendChild(group);
  const prevGroup = currentBranchGroup;
  currentBranchGroup = group;

  const key = COMPOSITE_GROWTH_STRUCTURE[imageName]
    ? imageName
    : COMPOSITE_GROWTH_STRUCTURE[input]
      ? input
      : null;

  if (!key) {
    const baseChar = getSkeletonBaseChar(input, imageName);
    const fallbackType = GROWTH_STRUCTURE[baseChar] || "branching";
    drawPlantPartByType(fallbackType, x, y, getGlobalPlantSize(fallbackType, imageName) * 1.25, angle, {}, index);
    currentBranchGroup = prevGroup;
    return;
  }

  const structures = COMPOSITE_GROWTH_STRUCTURE[key];
  const baseSize = getCompositeBaseSize(imageName, key);
  const origin = { x, y };
  let previousPoint = origin;

  structures.forEach((part, i) => {
    const repeat = Math.max(1, part.repeat || 1);

    for (let r = 0; r < repeat; r++) {
      const repeatAngle = repeat > 1 ? (Math.PI * 2 * r) / repeat : 0;
      const spread = repeat > 1 ? 0.18 + r * 0.02 : 0;
      const px = x + (part.x + Math.cos(repeatAngle) * spread) * baseSize;
      const py = y + (part.y + Math.sin(repeatAngle) * spread) * baseSize;
      const pSize = baseSize * (part.size || 1) * 0.78;
      const pAngle = angle + (part.rotation || 0) + i * 0.17 + repeatAngle * 0.2;

      if (i > 0 || r > 0) {
        const midX = (previousPoint.x + px) / 2 + Math.sin(index + i + r) * 18;
        const midY = (previousPoint.y + py) / 2 - 34;
        branchPath(`M ${previousPoint.x} ${previousPoint.y} Q ${midX} ${midY} ${px} ${py}`, 0.32, 1.1);
      }

      drawPlantPartByType(part.type, px, py, pSize, pAngle, part, index + i + r);
      previousPoint = { x: px, y: py };
    }
  });

  currentBranchGroup = prevGroup;
}

function getCompositeBaseSize(imageName, key) {
  const config = IMAGE_CONFIG[imageName] || IMAGE_CONFIG[key] || { scale: 1 };
  return Math.max(90, Math.min(210, 118 * (config.scale || 1)));
}

function drawPlantPartByType(type, x, y, size, angle = 0, part = {}, seed = 0) {
  if (["echeveria-rosette", "echeveria-compact", "echeveria-tight-rosette", "echeveria-open-rosette", "purple-rosette", "cream-rosette", "red-rosette", "echeveria-terminal", "inner-growth-core", "outer-aging-ring", "echeveria-red-core", "pastel-rosette-chain", "succulent-tree", "branch-rosette-cluster", "sedum-bean-rosette", "terminal-jelly-rosette", "lime-succulent", "droplet-succulent"].includes(type)) {
    drawEcheveriaRosette(x, y, size, angle, part.leafDensity || 26);
    return;
  }

  if (["sedum-mat-cluster", "yellow-sedum-mat", "sedum-branch-network", "mammillaria-network", "mammillaria-hybrid", "star-cactus-cluster", "caudex-star-cluster"].includes(type)) {
    drawGlobalFractalCluster(x, y, size, angle);
    return;
  }

  if (["crassula-column", "stacked-crassula", "haworthia-column", "gasteria-tower", "white-cactus-chain", "hybrid-chain", "echeveria-chain", "gasteria-chain"].includes(type)) {
    drawOrganicStemChain(x, y, size, angle, part.segmentCount || part.nodeCount || 8);
    return;
  }

  if (["root-system", "root-network", "root-base"].includes(type)) {
    drawRootNetwork(x, y, size, seed);
    return;
  }

  if (["lithops-colony", "split-leaf-succulent", "lithops-radial-colony", "gasteria-rosette", "smooth-lithops-cluster", "mixed-lithops-colony", "pink-conophytum-colony"].includes(type)) {
    drawLithopsColony(x, y, size, seed, part.clusterDensity || 0.8);
    return;
  }

  if (["star-flower", "flower-node", "flower-cup", "rose-terminal", "stapelia-flower"].includes(type)) {
    drawGlobalStapeliaFlower(x, y, size, angle);
    return;
  }

  if (["hybrid-cactus-column", "hybrid-column-cactus", "cylindrical-cactus", "stapelia-column", "cactus-node", "gold-cactus-node", "gold-cactus-base", "gold-cactus", "cactus-rosette-node", "central-rosette-cactus"].includes(type)) {
    drawCactusStructure(x, y, size, angle, part.segmentCount || 10);
    return;
  }

  if (["haworthia-window", "haworthia-window-rosette", "green-star", "green-star-rosette", "haworthia-star", "haworthia-zebra", "compact-rosette", "rooted-star-node", "pink-geometry-rosette", "fan-star-rosette", "star-node"].includes(type)) {
    drawSpikyRadialRosette(x, y, size, angle, part.armCount || 12);
    return;
  }

  if (["gasteria-cluster", "broad-leaf-node", "pale-leaf-terminal", "fan-petal-cluster", "cup-succulent", "banana-leaf-node", "window-leaf"].includes(type)) {
    drawGlobalFan(x, y, size, angle);
    return;
  }

  if (["stapelia-radial-star", "branch-arm", "arm-extension"].includes(type)) {
    drawGlobalRadial(x, y, size, part.armCount || 18, angle);
    return;
  }

  drawGlobalBranching(x, y, size);
}

function branchEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  (currentBranchGroup || growthBranchLayer).appendChild(el);
  return el;
}

function xrayStroke(opacity) {
  return `rgba(${XRAY_COLOR.r},${XRAY_COLOR.g},${XRAY_COLOR.b},${opacity})`;
}

function branchPath(d, opacity = 0.72, width = 1.25) {
  branchEl("path", {
    d,
    fill: "none",
    stroke: xrayStroke(opacity),
    "stroke-width": width,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke"
  });
}

function branchLine(x1, y1, x2, y2, opacity = 0.72, width = 1.25) {
  branchEl("line", {
    x1,
    y1,
    x2,
    y2,
    stroke: xrayStroke(opacity),
    "stroke-width": width,
    "stroke-linecap": "round",
    "vector-effect": "non-scaling-stroke"
  });
}

function branchCircle(x, y, r = 3, filled = false) {
  branchEl("circle", {
    cx: x,
    cy: y,
    r,
    class: filled ? "growth-dot" : "",
    fill: filled ? xrayStroke(0.9) : "none",
    stroke: filled ? "none" : xrayStroke(0.45),
    "stroke-width": 1.2
  });
}

function branchEllipse(x, y, rx, ry, rot = 0, opacity = 0.72) {
  branchEl("ellipse", {
    cx: x,
    cy: y,
    rx,
    ry,
    transform: `rotate(${rot} ${x} ${y})`,
    fill: "none",
    stroke: xrayStroke(opacity),
    "stroke-width": 1.15,
    "stroke-linecap": "round",
    "vector-effect": "non-scaling-stroke"
  });
}

function getGlobalPlantSize(type, imageName) {
  if (String(imageName).includes("INTER")) return 96;
  if (type === "rosette") return 130;
  if (type === "cluster" || type === "stapelia-cluster") return 125;
  if (type === "creeping") return 110;
  if (type === "tower") return 118;
  if (type === "cactus-column" || type === "euphorbia-column" || type === "stapelia-column") return 128;
  return 112;
}

function drawEcheveriaRosette(x, y, size, rotation = 0, leaves = 28) {
  const golden = 137.5 * (Math.PI / 180);
  for (let i = 0; i < leaves; i++) {
    const a = i * golden + rotation;
    const r = size * 0.08 + i * size * 0.012;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    const leafLength = size * (0.12 + i * 0.0055);
    const ex = px + Math.cos(a) * leafLength;
    const ey = py + Math.sin(a) * leafLength;
    const cx = px + Math.cos(a + 0.22) * leafLength * 0.44;
    const cy = py + Math.sin(a + 0.22) * leafLength * 0.44;

    branchPath(`M ${x} ${y} Q ${cx} ${cy} ${ex} ${ey}`, 0.42, 0.95);
    branchEllipse(px, py, leafLength * 0.16, leafLength * 0.46, (a * 180) / Math.PI + 90, 0.26);
  }
  branchCircle(x, y, 3.2, true);
}

function drawSpikyRadialRosette(x, y, size, rotation = 0, count = 12) {
  for (let i = 0; i < count; i++) {
    const a = rotation + (Math.PI * 2 * i) / count;
    const len = size * (0.58 + 0.16 * Math.sin(i * 1.7));
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    branchPath(`M ${x} ${y} Q ${x + Math.cos(a + 0.12) * len * 0.42} ${y + Math.sin(a + 0.12) * len * 0.42} ${ex} ${ey}`, 0.44, 1.1);
    branchLine(ex, ey, ex + Math.cos(a) * 10, ey + Math.sin(a) * 10, 0.38, 0.8);
  }
  branchCircle(x, y, 3, true);
}

function drawOrganicStemChain(x, y, size, rotation = 0, count = 8) {
  let px = x;
  let py = y;
  const mainAngle = rotation - Math.PI / 2;

  for (let i = 1; i <= count; i++) {
    const t = i / count;
    const wave = Math.sin(i * 0.9 + rotation) * size * 0.13;
    const nx = x + Math.cos(mainAngle) * size * t + Math.cos(mainAngle + Math.PI / 2) * wave;
    const ny = y + Math.sin(mainAngle) * size * t + Math.sin(mainAngle + Math.PI / 2) * wave;
    branchPath(`M ${px} ${py} Q ${(px + nx) / 2 + wave * 0.2} ${(py + ny) / 2 - 18} ${nx} ${ny}`, 0.4, 1.2);

    const side = i % 2 === 0 ? 1 : -1;
    const la = mainAngle + side * 1.2;
    branchEllipse(nx + Math.cos(la) * size * 0.16, ny + Math.sin(la) * size * 0.16, size * 0.045, size * 0.16, (la * 180) / Math.PI + 90, 0.28);
    px = nx;
    py = ny;
  }
}

function drawLithopsColony(x, y, size, seed = 0, density = 0.8) {
  const count = Math.round(7 + density * 10);
  for (let i = 0; i < count; i++) {
    const a = seed + i * 2.399;
    const r = Math.sqrt(i + 1) * size * 0.09;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    const s = size * (0.12 + (i % 4) * 0.012);
    branchEllipse(px - s * 0.18, py, s * 0.18, s * 0.32, (a * 180) / Math.PI - 10, 0.34);
    branchEllipse(px + s * 0.18, py, s * 0.18, s * 0.32, (a * 180) / Math.PI + 10, 0.34);
    branchLine(px, py - s * 0.26, px, py + s * 0.26, 0.22, 0.8);
    branchPath(`M ${x} ${y} Q ${(x + px) / 2} ${(y + py) / 2 - 18} ${px} ${py}`, 0.16, 0.75);
  }
  branchCircle(x, y, 3, true);
}

function drawCactusStructure(x, y, size, rotation = 0, segmentCount = 10) {
  drawGlobalColumn(x, y, size * 0.76);
  for (let i = 0; i < segmentCount; i++) {
    const a = rotation + (Math.PI * 2 * i) / segmentCount;
    const px = x + Math.cos(a) * size * 0.22;
    const py = y + Math.sin(a) * size * 0.44;
    for (let k = 0; k < 5; k++) {
      const sa = a + (Math.PI * 2 * k) / 5;
      branchLine(px, py, px + Math.cos(sa) * size * 0.08, py + Math.sin(sa) * size * 0.08, 0.26, 0.65);
    }
  }
}

function drawRootNetwork(x, y, size, seed = 0) {
  function recur(px, py, len, angle, depth) {
    if (depth <= 0 || len < 4) return;
    const nx = px + Math.cos(angle) * len;
    const ny = py + Math.sin(angle) * len;
    branchPath(`M ${px} ${py} Q ${(px + nx) / 2 + Math.sin(seed + depth) * 12} ${(py + ny) / 2 + 12} ${nx} ${ny}`, 0.28, 0.8);
    recur(nx, ny, len * 0.62, angle + 0.55 + Math.sin(seed) * 0.2, depth - 1);
    recur(nx, ny, len * 0.58, angle - 0.62 + Math.cos(seed) * 0.2, depth - 1);
  }

  for (let i = 0; i < 7; i++) {
    recur(x, y, size * (0.24 + i * 0.015), Math.PI / 2 + (i - 3) * 0.28, 4);
  }
}

function drawGlobalRadial(x, y, size, count = 10, rotation = 0) {
  for (let i = 0; i < count; i++) {
    const a = rotation + (Math.PI * 2 * i) / count;
    const ex = x + Math.cos(a) * size;
    const ey = y + Math.sin(a) * size;
    branchLine(x, y, ex, ey, 0.3, 1.05);
    branchEllipse(ex, ey, size * 0.045, size * 0.12, (a * 180) / Math.PI + 90, 0.22);
  }
}

function drawGlobalFan(x, y, size, rotation = 0) {
  for (let i = 0; i < 9; i++) {
    const a = rotation - Math.PI * 0.82 + (Math.PI * 1.64 * i) / 8;
    const ex = x + Math.cos(a) * size * 0.78;
    const ey = y + Math.sin(a) * size * 0.56;
    const cx = x + Math.cos(a) * size * 0.32;
    const cy = y + Math.sin(a) * size * 0.16;
    branchPath(`M ${x} ${y} Q ${cx} ${cy} ${ex} ${ey}`, 0.34, 1.05);
    branchEllipse(ex, ey, size * 0.06, size * 0.18, (a * 180) / Math.PI + 90, 0.25);
  }
}

function drawGlobalColumn(x, y, size) {
  branchPath(
    `M ${x} ${y + size * 0.65}
     C ${x - size * 0.17} ${y + size * 0.16}, ${x - size * 0.1} ${y - size * 0.55}, ${x} ${y - size * 0.92}
     C ${x + size * 0.1} ${y - size * 0.55}, ${x + size * 0.17} ${y + size * 0.16}, ${x} ${y + size * 0.65}`,
    0.38,
    1.25
  );
  branchLine(x, y + size * 0.55, x, y - size * 0.82, 0.24, 0.9);
}

function drawGlobalStapeliaFlower(x, y, size, rotation = 0) {
  for (let i = 0; i < 5; i++) {
    const a = rotation + (Math.PI * 2 * i) / 5;
    const tx = x + Math.cos(a) * size * 0.74;
    const ty = y + Math.sin(a) * size * 0.74;
    branchLine(x, y, tx, ty, 0.38, 1.05);
    branchPath(`M ${x} ${y} Q ${x + Math.cos(a + 0.35) * size * 0.38} ${y + Math.sin(a + 0.35) * size * 0.38} ${tx} ${ty}`, 0.28, 1);
  }
  branchCircle(x, y, 2.6, true);
}

function drawGlobalBranching(x, y, size) {
  branchLine(x, y + size * 0.42, x, y - size * 0.78, 0.35, 1.2);
  const branches = [[-0.62, -0.1], [0.7, -0.28], [-0.48, -0.48], [0.42, -0.64], [-0.25, -0.78]];
  branches.forEach(([dir, h]) => {
    const sx = x;
    const sy = y + size * h;
    const ex = x + size * dir;
    const ey = y + size * (h - 0.32);
    branchPath(`M ${sx} ${sy} Q ${x + size * dir * 0.28} ${y + size * (h - 0.14)} ${ex} ${ey}`, 0.34, 1);
    branchEllipse(ex, ey, size * 0.045, size * 0.12, dir > 0 ? 45 : -45, 0.24);
  });
}

function drawGlobalFractalCluster(x, y, size, rotation = 0) {
  const starts = [[-0.45, -0.12], [0.48, -0.18], [-0.25, 0.34], [0.32, 0.28], [0.05, -0.48], [-0.05, 0.05]];
  starts.forEach(([dx, dy], idx) => {
    const ex = x + dx * size;
    const ey = y + dy * size;
    branchPath(`M ${x} ${y} Q ${(x + ex) / 2} ${y - 28} ${ex} ${ey}`, 0.28, 1.05);
    drawMiniFractal(ex, ey, size * 0.26, rotation + idx);
  });
}

function drawMiniFractal(x, y, size, seed = 0) {
  function recur(px, py, len, angle, depth) {
    if (depth <= 0 || len < 3) return;
    const nx = px + Math.cos(angle) * len;
    const ny = py + Math.sin(angle) * len;
    branchLine(px, py, nx, ny, 0.28, 0.8);
    recur(nx, ny, len * 0.58, angle + 0.85 + Math.sin(seed) * 0.12, depth - 1);
    recur(nx, ny, len * 0.58, angle - 0.85 + Math.cos(seed) * 0.12, depth - 1);
  }
  recur(x, y, size, -Math.PI / 2 + seed * 0.17, 4);
}// ================================================================
// JUNGLE LAYER — 동반종(companion) 접목 + 과잉 번식(overgrowth)
// ----------------------------------------------------------------
// 1) 특정 글자를 치면, 그 글자 이미지의 초록 생장점(●)에서 연관 종이
//    "접목되듯" 함께 돋아남. 동반종의 생장점(●)이 부모의 생장점 근처에
//    정확히 맞물리도록 배치됨 (모든 이미지의 ● 위치를 비율 좌표로 저장).
// 2) 한 번이라도 등장한 동반종은 "해금"되어, 이후 OVERGROWTH_EVERY 글자마다
//    최근에 자란 개체들 사이 어딘가에서 작게, 뒤쪽 깊이로 스스로 번식함
//    → 타이핑이 길어질수록 틈이 메워지며 밀림처럼 빽빽해짐.
// 3) 늘어지는 종(hang)은 위에서 아래로 풀려 내려오고, 서는 종(rise)은
//    바닥에서 솟고, 덤불 종(bush)은 옆으로 부풀어 오름.
// 모든 난수는 시드 기반이라, 백스페이스로 전체 재계산해도 같은 숲이 다시 그려짐.
// ================================================================

// 각 이미지 안 초록 생장점(●)의 위치 (가로 비율, 세로 비율[, 세로/가로 비])
// 알파벳은 images/parts/ 조각들 중 ●가 들어 있는 조각에서 찾은 값이고,
// 세로/가로 비는 SPLIT_LAYER_RATIO를 그대로 씀 (Z는 조각이 없어 중앙 기준)
const GROWTH_POINTS = {
  A: [0.5541, 0.526], B: [0.79, 0.4939], C: [0.3893, 0.808], D: [0.278, 0.3205], E: [0.8107, 0.5093],
  F: [0.7993, 0.4547], G: [0.7407, 0.8229], H: [0.7055, 0.5156], I: [0.5228, 0.2543], J: [0.4655, 0.7408],
  K: [0.3315, 0.2252], L: [0.5105, 0.8196], M: [0.4483, 0.8217], N: [0.6701, 0.4223], O: [0.4725, 0.6824],
  P: [0.7379, 0.1669], Q: [0.4488, 0.3311], R: [0.5136, 0.6545], S: [0.6612, 0.3006], T: [0.6483, 0.6033],
  U: [0.5464, 0.5141], V: [0.6158, 0.2147], W: [0.484, 0.458], X: [0.851, 0.1519], Y: [0.5486, 0.0974],
  "N-04": [0.5596, 0.1311, 1.6824], "N-05": [0.3741, 0.771, 1.5936], "N-07": [0.5255, 0.449, 1.1544],
  "N-08": [0.5956, 0.9175, 1.6719], "N-10": [0.2294, 0.3339, 1.1628], "N-13": [0.3809, 0.2148, 1.4939]
};

// 동반종 정의 — 어떤 글자와 함께 나오는지(letter), 자라는 습성(habit), 크기(scale)
// habit: "hang" = 생장점이 위, 아래로 늘어짐 / "rise" = 생장점이 아래, 위로 솟음 / "bush" = 옆으로 부풂
// offset: 부모 생장점에서 동반종 생장점까지의 거리 (x는 좌우 교대로 뒤집힘)
// ※ 종명은 이미지 기준 추정 — 틀리면 name만 고치면 영수증/목록에 반영됨
const JUNGLE_SPECIES = {
  "N-07": { letter: "C", habit: "bush", scale: 0.6,  offset: [0.42, 0.08],  name: "웅동자 / Cotyledon tomentosa" },
  "N-13": { letter: "J", habit: "hang", scale: 0.8, offset: [0.08, 0], name: "늘어지는 에케베리아 / Echeveria sp. (pendant)" },
  "N-05": { letter: "D", habit: "rise", scale: 0.71, offset: [0.36, 0.12],  name: "에케베리아 금(錦) 개화 개체 / Echeveria cv. variegata" },
  "N-10": { letter: "Q", habit: "bush", scale: 1.1,  offset: [0.4, 0.06],  name: "그랍토세덤 계열 / Graptosedum cv." },
  "N-04": { letter: "S", extraLetters: ["R", "E", "V"], extraChance: 0.35, habit: "hang", scale: 1.25, offset: [0.08, 0], name: "원숭이꼬리 선인장 / Hildewintera colademononis", baseImage: "N-04_BASE", blossoms: true, overgrowthWeight: 3 },
  "N-08": { letter: "X", habit: "rise", scale: 0.8,  offset: [0.34, 0.1],  name: "에디스콜레아 그란디스 / Edithcolea grandis" }
};
// 한 종이 여러 글자에 연결될 수 있음 (extraLetters) — N-04는 S 외에 R·E·V(털/선인장 계열)에서도 돋아남
const LETTER_TO_COMPANION = {};
Object.entries(JUNGLE_SPECIES).forEach(([img, s]) => {
  [s.letter, ...(s.extraLetters || [])].forEach((L) => { LETTER_TO_COMPANION[L] = img; });
});

// 몇 글자마다 한 번 스스로 번식할지. 0 = 끔 (기본값: 꺼짐 — "한 글자 = 그 글자의 이미지" 구조를 유지)
// 켜면 타이핑과 무관한 번식체가 사이사이 생겨 더 빽빽한 밀림이 됨 (예: 5)
const OVERGROWTH_EVERY = 0;
const OVERGROWTH_MAX = 60;        // 번식체 최대 개수 (성능 보호)
const OVERGROWTH_HOST_WINDOW = 14; // 최근 몇 개의 개체 주변에서 번식할지 (화면 안에서 보이도록)
const SPROUT_MS = 0;              // 등장 연출 없음 (바로 나타남)

let jungleSeed = 0;
let prevDistanceForPetal = 0;
let lineStartLetterFlag = false;
let jungleLetterCount = 0;
let jungleOvergrowthCount = 0;
let jungleHosts = [];             // 생장점을 가진, 이미 자리 잡은 개체들 {gx, gy, depth}
let jungleUnlocked = [];          // 한 번이라도 등장한 동반종 이미지 이름
let jungleSide = 1;

function jr() {
  jungleSeed += 1;
  return seededRandom(jungleSeed * 7.31 + 3.7);
}

function resetJungleState() {
  jungleSeed = 0;
  jungleLetterCount = 0;
  jungleOvergrowthCount = 0;
  jungleHosts = [];
  jungleUnlocked = [];
  jungleSide = 1;
  if (typeof petalResetPlants === "function") petalResetPlants();
}

// 이미지 설정/종명 등록 — 기존 시스템(프리로드, 영수증, X-ray)이 그대로 인식하도록
Object.entries(JUNGLE_SPECIES).forEach(([img, s]) => {
  IMAGE_CONFIG[img] = { scale: s.scale, offsetY: 0, isMutant: false };
  PARTS_FOLDER_NAMES.add(img); // images/parts/N-xx.webp 에서 불러옴
  if (s.baseImage) {
    IMAGE_CONFIG[s.baseImage] = { scale: s.scale, offsetY: 0, isMutant: false };
    PARTS_FOLDER_NAMES.add(s.baseImage);
  }
  SPECIES_MAP[img] = s.name;
});

// X-ray용 골격 — 원본 이미지와 같은 생장 문법으로 대응
Object.assign(COMPOSITE_GROWTH_STRUCTURE, {
  "N-07": [
    { type: "fan-petal-cluster", role: "paw-cluster", x: 0, y: 0, size: 1.0 },
    { type: "broad-leaf-node", role: "upper-paws", x: 0.35, y: -0.9, size: 0.62 },
    { type: "broad-leaf-node", role: "left-paws", x: -0.85, y: 0.05, size: 0.56 },
    { type: "broad-leaf-node", role: "right-paws", x: 0.9, y: 0.2, size: 0.54 },
    { type: "broad-leaf-node", role: "lower-paws", x: 0.1, y: 0.95, size: 0.6 }
  ],
  "N-04": [
    { type: "cylindrical-cactus", role: "hanging-tail-1", x: -0.5, y: 1.1, size: 1.0, segmentCount: 16 },
    { type: "cylindrical-cactus", role: "hanging-tail-2", x: 0.15, y: 1.5, size: 1.1, segmentCount: 18 },
    { type: "cylindrical-cactus", role: "hanging-tail-3", x: 0.7, y: 1.2, size: 0.95, segmentCount: 16 },
    { type: "star-flower", role: "tail-flowers", x: 0.1, y: 0.9, size: 0.36, repeat: 5 }
  ],
  "N-05": [
    { type: "echeveria-rosette", role: "mother-rosette", x: 0, y: 0, size: 1.0, leafDensity: 30 },
    { type: "echeveria-chain", role: "flower-stalk", x: 0.35, y: -1.2, size: 0.9, curvature: 0.3 },
    { type: "sedum-bean-rosette", role: "bud-head", x: 0.65, y: -2.0, size: 0.34 },
    { type: "echeveria-compact", role: "pup", x: 1.1, y: -0.05, size: 0.55 }
  ],
  "N-08": [
    { type: "hybrid-cactus-column", role: "toothed-stem", x: 0, y: -0.8, size: 1.0, segmentCount: 14 },
    { type: "branch-arm", role: "side-arms", x: 0, y: -0.6, size: 0.9, armCount: 6 },
    { type: "stapelia-flower", role: "carpet-flower", x: -0.5, y: -1.9, size: 0.72 }
  ],
  "N-10": [
    { type: "echeveria-tight-rosette", role: "lead-rosette", x: 0, y: 0, size: 0.72 },
    { type: "echeveria-tight-rosette", role: "right-rosette", x: 1.2, y: 0.45, size: 0.72 },
    { type: "echeveria-tight-rosette", role: "low-rosette", x: 0.75, y: 1.45, size: 0.7 },
    { type: "sedum-bean-rosette", role: "offsets", x: 0.55, y: 0.6, size: 0.3, repeat: 4 }
  ],
  "N-13": [
    { type: "echeveria-chain", role: "pendant-stem-1", x: -0.35, y: 1.2, size: 1.0, curvature: 0.2 },
    { type: "echeveria-chain", role: "pendant-stem-2", x: 0.9, y: 1.4, size: 1.0, curvature: -0.2 },
    { type: "flower-cup", role: "bell-flowers", x: 0.1, y: 0.35, size: 0.34, repeat: 4 }
  ]
});

// 부모 노드 안 생장점(●)의 실제 스테이지 좌표 계산 (노드 회전까지 반영)
function getWorldGrowthPoint(imgName, cx, cy, rot) {
  const gp = GROWTH_POINTS[imgName];
  const config = IMAGE_CONFIG[imgName] || { scale: 1, offsetY: 0 };
  const w = 320 * config.scale;
  if (!gp) return { x: cx, y: cy };
  const ratio = gp[2] || SPLIT_LAYER_RATIO[imgName] || 1;
  const h = w * ratio;
  const left = cx - w / 2;
  const top = cy - w / 2 + (config.offsetY || 0);
  const px = left + gp[0] * w;
  const py = top + gp[1] * h;
  const ox = left + w / 2;
  const oy = top + h / 2;
  const r = (rot * Math.PI) / 180;
  const dx = px - ox;
  const dy = py - oy;
  return { x: ox + dx * Math.cos(r) - dy * Math.sin(r), y: oy + dx * Math.sin(r) + dy * Math.cos(r) };
}

// processTyping 직후 호출 — 방금 자리 잡은 글자 기준으로 숲을 키움
function growJungleAfterLetter(char, x, y, rot, isRepeat) {
  const gp = getWorldGrowthPoint(char, x, y, rot);
  const depth = Math.floor(5000 - (y - START_Y));
  jungleHosts.push({ gx: gp.x, gy: gp.y, depth });
  if (jungleHosts.length > 400) jungleHosts.shift();

  jungleLetterCount += 1;
  if (lineStartLetterFlag) petalUpdateGround(char, x, y);
  if (!currentInstant) {
    petalOnType(char, prevDistanceForPetal);
    plantSoundOnGrow(prevDistanceForPetal, char);
  }

  let companion = LETTER_TO_COMPANION[char];
  // 보조 글자(extraLetters)로 연결된 종은 확률로만 등장 — N-04: S는 항상, R·E·V는 35%
  // (시드 기반이라 같은 문장은 항상 같은 결과. 확률은 JUNGLE_SPECIES의 extraChance로 조절)
  if (companion) {
    const sp = JUNGLE_SPECIES[companion];
    if (sp.letter !== char && seededRandom(jungleLetterCount * 3.17 + char.charCodeAt(0)) >= (sp.extraChance ?? 1)) {
      companion = null;
    }
  }
  if (companion && !isRepeat) {
    jungleSide = -jungleSide;
    const spc = JUNGLE_SPECIES[companion];
    if (spc.habit === "hang") {
      // 늘어지는 종은 부모 글자 몸통 뒤에 묻히지 않도록, 부모 실루엣의 바깥 가장자리에 매달려
      // 아래로 드리우고, 부모보다 앞 층에 놓임
      const pw = 320 * ((IMAGE_CONFIG[char] || {}).scale || 1);
      const hx = x + jungleSide * pw * 0.5;
      const hy = Math.min(gp.y, y) - pw * 0.05;
      spawnCompanion(companion, hx, hy, depth + 1, rot, jungleSide, char, false, char);
    } else {
      spawnCompanion(companion, gp.x, gp.y, depth - 1, rot, jungleSide, char, false, char);
    }
    if (!jungleUnlocked.includes(companion)) jungleUnlocked.push(companion);
  }

  if (OVERGROWTH_EVERY > 0 && jungleUnlocked.length > 0 && jungleLetterCount % OVERGROWTH_EVERY === 0 && jungleOvergrowthCount < OVERGROWTH_MAX) {
    spawnOvergrowth();
  }
}

function spawnOvergrowth() {
  // 가중치 추첨 — N-04처럼 overgrowthWeight가 큰 종이 더 자주 번식함
  const pool = [];
  jungleUnlocked.forEach((name) => {
    const wgt = JUNGLE_SPECIES[name].overgrowthWeight || 1;
    for (let k = 0; k < wgt; k++) pool.push(name);
  });
  const species = pool[Math.floor(jr() * pool.length)];
  const windowStart = Math.max(0, jungleHosts.length - OVERGROWTH_HOST_WINDOW);
  const host = jungleHosts[windowStart + Math.floor(jr() * (jungleHosts.length - windowStart))];
  if (!host) return;
  const side = jr() > 0.5 ? 1 : -1;
  jungleOvergrowthCount += 1;
  // 번식체는 모든 글자보다 한참 뒤(깊은 층)에 깔려서 글자 판독을 방해하지 않음
  spawnCompanion(species, host.gx, host.gy, host.depth - 2600, 0, side, "~", true);
}

function spawnCompanion(imgName, parentGX, parentGY, depthZ, parentRot, side, sourceInput, isOvergrowth, parentLetter = null) {
  if (!stage) return;
  const spec = JUNGLE_SPECIES[imgName];
  const gp = GROWTH_POINTS[imgName];
  if (!spec || !gp) return;

  const sizeJitter = isOvergrowth ? 0.55 + jr() * 0.3 : 0.88 + jr() * 0.26;
  const w = 320 * spec.scale * sizeJitter;
  const h = w * gp[2];
  const reach = isOvergrowth ? 0.6 + jr() * 0.9 : 0.85 + jr() * 0.3;
  // offset은 동반종 자신의 폭에 대한 비율 — 크기가 바뀌어도 부모와의 간격이 같은 비례로 유지됨
  const ax = parentGX + side * spec.offset[0] * w * reach;
  const ay = parentGY + spec.offset[1] * w * reach + (isOvergrowth ? (jr() - 0.5) * 80 : 0);

  let rot;
  // 식물은 중력 방향으로 곧게 — 기울기는 아주 조금만 (글자 조각들과 같은 자세)
  if (spec.habit === "hang") rot = (jr() - 0.5) * 6;
  else rot = side * (1.5 + jr() * 3.5);
  void parentRot;

  const instant = currentInstant;
  const node = document.createElement("div");
  node.className = `succulent-node normal-type jungle-node jungle-${spec.habit}${isOvergrowth ? " jungle-overgrowth" : ""}`;
  node.style.width = `${w}px`;
  node.style.height = `${h}px`;
  node.style.left = `${ax - gp[0] * w}px`;
  node.style.top = `${ay - gp[1] * h}px`;
  node.style.transformOrigin = `${gp[0] * 100}% ${gp[1] * 100}%`;
  node.style.transform = `rotate(${rot}deg)`;
  node.style.zIndex = String(depthZ);
  if (spec.habit === "hang" && !isOvergrowth) node.classList.add("jungle-canopy");

  // node(회전·커서 굴광성) > sprout(돋아남) > img(idle 일렁임) 3단 구조 — 서로 transform이 안 부딪힘
  const sprout = document.createElement("div");
  sprout.className = "jungle-sprout";
  sprout.style.transformOrigin = `${gp[0] * 100}% ${gp[1] * 100}%`;

  // 꽃이 떨어지는 종(N-04)은 꽃을 지운 몸통 이미지 + 떼어낼 수 있는 꽃 조각들로 따로 구성
  const bodyImgName = spec.baseImage || imgName;
  const cached = imageCache[bodyImgName];
  const img = cached ? cached.cloneNode(false) : new Image();
  img.decoding = "async";
  img.draggable = false;
  img.style.width = "100%";
  img.style.height = "auto";
  img.style.display = "block";

  // node(회전) > sprout(돋아남) > body(idle 일렁임 — 몸통과 꽃이 함께 흔들림) > img + 꽃들
  const body = document.createElement("div");
  body.className = "jungle-body";
  body.style.width = `${w}px`;
  body.style.height = `${h}px`;
  body.style.transformOrigin = `${gp[0] * 100}% ${gp[1] * 100}%`;
  const idle = spec.habit === "hang" ? "hang" : spec.habit === "rise" ? "sway" : "creep";
  body.classList.add(`idle-${idle}`);
  body.style.animationDuration = `${(8 + Math.random() * 6).toFixed(2)}s`;
  body.style.animationDelay = `-${(Math.random() * 9).toFixed(2)}s`;
  body.appendChild(img);

  const blossomEls = spec.blossoms ? attachBlossoms(body) : null;

  sprout.appendChild(body);
  node.appendChild(sprout);

  recordCompanionReceipt(imgName, ax, ay, rot, sourceInput, parentGX, parentGY, isOvergrowth, spec, w);

  const place = () => {
    // 등장 연출 없이 타이핑과 동시에 바로 자리 잡음
    stage.appendChild(node);
    registerLivingNode(node, ax, ay, rot);
    if (blossomEls) petalRegisterPlant(node, blossomEls, isOvergrowth, instant);
  };

  // 부모 글자의 조각들이 순서대로 다 자라난 뒤에 이어서 돋아나도록 (재계산 중엔 즉시)
  const parentLayers = parentLetter && SPLIT_LAYER_MAP[parentLetter] ? SPLIT_LAYER_MAP[parentLetter].length : 1;
  // 부모 글자의 조각들이 원래 방식대로 순서대로 붙은 뒤, 같은 박자로 이어서 붙음 (별도 등장 연출 없음)
  const delay = isOvergrowth ? 0 : 260 * parentLayers;
  const go = () => {
    if (imageCache[bodyImgName] || img.complete) place();
    else {
      img.onload = place;
      img.onerror = () => console.warn("동반종 이미지 로드 실패:", imgName);
      if (!img.src) img.src = resolveImagePath(bodyImgName);
    }
  };
  if (!cached) img.src = resolveImagePath(bodyImgName);
  scheduleNode(go, delay, instant);
}

function recordCompanionReceipt(imgName, x, y, rot, sourceInput, parentX, parentY, isOvergrowth, spec, drawWidth) {
  const genetic = GENETIC_MAP[spec.letter] || null;
  receiptRecords.push({
    no: receiptRecords.length + 1,
    input: isOvergrowth ? "~" : sourceInput,
    previous: spec.letter,
    image: imgName,
    species: spec.name,
    type: isOvergrowth ? "OVERGROWTH / SELF-SEEDED" : `COMPANION / ${spec.habit.toUpperCase()}`,
    geneticX: genetic ? genetic.x : "-",
    geneticY: genetic ? genetic.y : "-",
    distance: "-",
    angle: "-",
    stageX: Math.round(x - START_X),
    stageY: Math.round(START_Y - y),
    rotation: `${Math.round(rot)}°`,
    companion: true,
    parentX,
    parentY,
    baseLetter: spec.letter,
    drawWidth,
    rotDeg: rot
  });
  updateReceiptIfOpen();
}


// ================================================================
// PETAL FALL — 원숭이꼬리 선인장(N-04)의 꽃이 시스템에 반응해 떨어짐
// ----------------------------------------------------------------
// · N-04가 한 번이라도 나타난 뒤부터 작동 (S·R·E·V 입력 또는 번식으로 등장)
// · 꽃(m-01~m-06)은 몸통 위에 따로 붙어 있고, 떨어지면 그 자리는 빈 줄기가 됨.
//   24~42초 뒤 같은 자리에 다시 붙음 (등장 연출 없이 바로)
// · 떨어진 꽃은 원본 이미지 비율 그대로(찌그러짐 없음) 회전·좌우 흔들림만으로 날림
// · 꽃은 "화면"이 아니라 무대(월드) 좌표에서 떨어짐 → 타이핑이 시작된 가장 아래
//   바닥(첫 글자들의 밑단)까지 내려가 쌓임. 쌓인 꽃을 보려면 아래로 스크롤해야 함.
//   (Enter를 치면 카메라가 시작점으로 돌아가므로 바닥 더미가 보임)
//
// 반응 규칙
// · 글자 타이핑 = 바람 한 줄기. 유전적 거리(DIST)가 멀수록 강하고, 성장선이 기운 쪽으로 불며,
//   빠르게 칠수록 꽃이 더 잘 떨어짐
// · S를 다시 치면 = 모체가 흔들려 꽃이 우수수
// · Enter = 돌풍. 여러 송이가 지고, 바닥에 쌓인 꽃 일부가 다시 날아오름
// · ! = 위로 치솟는 회오리
// · 백스페이스(되감기) = 바람이 반대로
// · 가만히 두면 = 약한 바람, 7~15초마다 한 송이씩 저절로 짐
// ================================================================

const PETAL_UNITS = {"m-01":{"x":0.26895,"y":0.20212,"w":0.09116,"h":0.07166,"ar":1.3232},"m-02":{"x":0.71896,"y":0.33648,"w":0.1103,"h":0.07136,"ar":1.089},"m-03":{"x":0.77764,"y":0.50269,"w":0.14656,"h":0.07421,"ar":0.8522},"m-04":{"x":0.65601,"y":0.57735,"w":0.20448,"h":0.0784,"ar":0.6453},"m-05":{"x":0.59078,"y":0.82525,"w":0.12239,"h":0.08692,"ar":1.1955},"m-06":{"x":0.17124,"y":0.33333,"w":0.13523,"h":0.05177,"ar":0.6443}};
const PETAL_PATH = "./images/parts/petals/";
const PETAL_REGROW_MIN_MS = 24000;
const PETAL_REGROW_MAX_MS = 42000;
const PETAL_MATURE_MS = 1200;          // 막 나타난 식물은 잠깐 동안 꽃을 떨구지 않음
const PETAL_MAX_AIRBORNE = 140;
const PETAL_MAX_LANDED = 900;
const PETAL_PILE_MAX_H = 260;          // 바닥 더미 최대 높이(px)
const PETAL_IDLE_MIN_MS = 7000;
const PETAL_IDLE_MAX_MS = 15000;
const PETAL_GROUND_DEFAULT = START_Y + 320;
const PILE_X0 = START_X - 4000;        // 바닥 캔버스가 덮는 가로 범위 (무대 좌표)
const PILE_W = 12000;

const petalSprites = {};
let petalPlants = [];
let petalAir = [];
let petalLanded = [];
let petalHeight = new Float32Array(Math.ceil(PILE_W / 4) + 2);
let petalGroundY = PETAL_GROUND_DEFAULT;
let petalAirCanvas, petalAirCtx, petalPileCanvas, petalPileCtx;
let petalVW = 0, petalVH = 0, petalDpr = 1;
let petalRaf = null;
let petalLastT = 0;
let petalWind = 0, petalGust = 0, petalLift = 0, petalClock = 0;
let petalIdleTimer = null;

function petalInit() {
  // 공중 꽃: 화면에 고정된 캔버스에 "무대 좌표 - 스크롤"로 그림
  petalAirCanvas = document.createElement("canvas");
  petalAirCanvas.id = "petal-air";
  petalAirCanvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(petalAirCanvas);
  petalAirCtx = petalAirCanvas.getContext("2d");

  // 바닥 더미: 무대(#render-stage) 안, 시작점 바닥에 붙어 있는 캔버스 → 카메라와 함께 움직임
  petalPileCanvas = document.createElement("canvas");
  petalPileCanvas.id = "petal-pile";
  petalPileCanvas.setAttribute("aria-hidden", "true");
  stage.appendChild(petalPileCanvas);
  petalPileCtx = petalPileCanvas.getContext("2d");

  petalResize();
  petalPlacePile();
  window.addEventListener("resize", petalResize);
  window.addEventListener("scroll", () => { if (petalAir.length) petalKick(); }, { passive: true });

  // 꽃 스프라이트는 preloadImages 대기열이 순서대로 받음 (여기서 따로 요청하지 않음)
  Object.keys(PETAL_UNITS).forEach((name) => {
    if (!petalSprites[name]) petalSprites[name] = new Image();
  });
}

function petalResize() {
  petalDpr = Math.min(2, window.devicePixelRatio || 1);
  petalVW = window.innerWidth;
  petalVH = window.innerHeight;
  petalAirCanvas.width = Math.round(petalVW * petalDpr);
  petalAirCanvas.height = Math.round(petalVH * petalDpr);
  petalAirCanvas.style.width = `${petalVW}px`;
  petalAirCanvas.style.height = `${petalVH}px`;
}

function petalPlacePile() {
  const pad = 80; // 바닥선 아래로 살짝 걸쳐 그려질 여유
  petalPileCanvas.width = PILE_W;
  petalPileCanvas.height = PETAL_PILE_MAX_H + pad * 2;
  petalPileCanvas.style.left = `${PILE_X0}px`;
  petalPileCanvas.style.top = `${petalGroundY - PETAL_PILE_MAX_H - pad}px`;
  petalPileCanvas.style.width = `${PILE_W}px`;
  petalPileCanvas.style.height = `${PETAL_PILE_MAX_H + pad * 2}px`;
  petalPileCanvas.dataset.pad = pad;
  petalRebuildPile();
}

// 각 줄의 첫 글자 밑단을 바닥으로 삼음 (가장 아래 것 기준)
function petalUpdateGround(char, cx, cy) {
  const config = IMAGE_CONFIG[char] || { scale: 1, offsetY: 0 };
  const w = 320 * config.scale;
  const ratio = (typeof SPLIT_LAYER_RATIO !== "undefined" && SPLIT_LAYER_RATIO[char]) || (GROWTH_POINTS[char] && GROWTH_POINTS[char][2]) || 1;
  const bottom = cy - w / 2 + (config.offsetY || 0) + w * ratio;
  const ground = Math.max(PETAL_GROUND_DEFAULT, bottom - 20);
  if (ground > petalGroundY + 1) {
    petalGroundY = ground;
    if (petalPileCanvas) petalPlacePile();
  }
}

// ---------- 식물 쪽 ----------

function attachBlossoms(body) {
  return Object.entries(PETAL_UNITS).map(([name, u]) => {
    const el = document.createElement("img");
    el.className = "jungle-blossom";
    el.src = `${PETAL_PATH}${name}.webp`;
    el.draggable = false;
    el.style.left = `${u.x * 100}%`;
    el.style.top = `${u.y * 100}%`;
    el.style.width = `${u.w * 100}%`;
    el.style.height = "auto";
    body.appendChild(el);
    return { el, name };
  });
}

function petalRegisterPlant(node, blossomEls, isOvergrowth, instant) {
  petalPlants.push({
    node,
    overgrowth: isOvergrowth,
    born: performance.now() - (instant ? PETAL_MATURE_MS : 0),
    units: blossomEls.map((b) => ({ el: b.el, name: b.name, attached: true, timer: null }))
  });
  scheduleIdleFall();
}

function petalResetPlants() {
  petalPlants.forEach((pl) => pl.units.forEach((u) => clearTimeout(u.timer)));
  petalPlants = [];
}

function petalVisibleUnits() {
  if (document.body.classList.contains("xray-active")) return [];
  if (document.body.classList.contains("only-mutant-view")) return [];
  const now = performance.now();
  const out = [];
  petalPlants.forEach((pl) => {
    if (!pl.node.isConnected || now - pl.born < PETAL_MATURE_MS) return;
    pl.units.forEach((u) => {
      if (!u.attached) return;
      const r = u.el.getBoundingClientRect();
      if (r.width < 2 || r.bottom < -60 || r.top > petalVH + 60 || r.right < -60 || r.left > petalVW + 60) return;
      out.push({ unit: u, rect: r });
    });
  });
  return out;
}

function petalDetach(entry, kick = 1) {
  const { unit, rect } = entry;
  const meta = PETAL_UNITS[unit.name];
  unit.attached = false;
  unit.el.classList.add("fallen");
  // 화면상 크기 그대로, 원본 비율 그대로
  const PZ = window.VIEW_ZOOM || 1;
  const w = rect.width / PZ;
  const h = w * meta.ar;
  petalSpawn({
    sprite: unit.name,
    x: (rect.left + window.scrollX + rect.width / 2) / PZ,
    y: (rect.top + window.scrollY + rect.height / 2) / PZ,
    w, h,
    vx: 0,
    vy: 0,
    release: true
  });
  void kick;
  plantSoundRustle(0.6 + Math.random() * 0.4);

  const wait = PETAL_REGROW_MIN_MS + Math.random() * (PETAL_REGROW_MAX_MS - PETAL_REGROW_MIN_MS);
  unit.timer = setTimeout(() => {
    if (!unit.el.isConnected) return;
    unit.el.classList.remove("fallen");
    unit.attached = true;
  }, wait);
}

function petalDetachSome(prob, maxCount, kick) {
  const list = petalVisibleUnits();
  list.sort((a, b) => a.rect.top - b.rect.top + (Math.random() - 0.5) * 200);
  let n = 0;
  for (const e of list) {
    if (n >= maxCount) break;
    if (Math.random() < prob) { petalDetach(e, kick); n++; }
  }
  return n;
}

// ---------- 반응 규칙 ----------

function clampGust(g) {
  return Math.max(-60, Math.min(60, g));
}

function petalActive() {
  return petalPlants.length > 0 || petalAir.length > 0;
}

function currentLeanSign() {
  const lean = Math.cos((growthAngle * Math.PI) / 180);
  if (Math.abs(lean) < 0.04) return Math.random() < 0.5 ? -1 : 1;
  return lean > 0 ? 1 : -1;
}

function petalOnType(char, distance) {
  if (!petalActive()) return;
  // 꽃 위치 측정(getBoundingClientRect)은 레이아웃 계산을 강제하므로, 타이핑 처리 중이 아니라
  // 다음 프레임으로 미룸 → 빠르게 쳐도 입력이 밀리지 않음
  requestAnimationFrame(() => petalOnTypeNow(char, distance));
}

function petalOnTypeNow(char, distance) {
  const rate = recentTypeTimes ? recentTypeTimes.length : 0;
  // 바람은 약하게 — 타이핑 한 번에 최대 초속 40px 정도의 산들바람
  petalGust = clampGust(petalGust + currentLeanSign() * (8 + Math.min(420, distance) * 0.06 + rate * 1.2));
  let prob = 0.04 + Math.min(0.18, distance / 1400) + Math.min(0.12, rate * 0.012);
  let max = 1;
  if (char === "S") { prob += 0.25; }
  petalDetachSome(prob, max, 1 + distance / 400);
  petalKick();
}

function petalOnLineBreak() {
  plantSoundDroplet();
  if (!petalActive()) return;
  petalGust = clampGust(petalGust + currentLeanSign() * 55);
  petalLift += 18;
  petalDetachSome(0.5, 2, 1);
  petalStir(5, 1);
  petalKick();
}

function petalOnBang() {
  if (!petalActive()) return;
  petalGust = clampGust(petalGust + (Math.random() < 0.5 ? -1 : 1) * 70);
  petalLift += 45;
  petalDetachSome(0.4, 2, 1);
  petalStir(10, 1.4);
  petalKick();
}

function petalOnRewind() {
  if (!petalActive()) return;
  petalGust = clampGust(-petalGust * 0.8 - Math.sign(petalWind || 1) * 30);
  petalKick();
}

function scheduleIdleFall() {
  if (petalIdleTimer) return;
  const wait = PETAL_IDLE_MIN_MS + Math.random() * (PETAL_IDLE_MAX_MS - PETAL_IDLE_MIN_MS);
  petalIdleTimer = setTimeout(() => {
    petalIdleTimer = null;
    if (!petalPlants.length) return;
    petalGust = clampGust(petalGust + (Math.random() - 0.5) * 16);
    if (petalDetachSome(1, 1, 0.6)) petalKick();
    scheduleIdleFall();
  }, wait);
}

// 바닥 더미의 맨 위(최근) 꽃 몇 개를 다시 띄움
function petalStir(count, power) {
  if (!petalLanded.length) return;
  const n = Math.min(count, petalLanded.length);
  const lifted = petalLanded.splice(petalLanded.length - n, n);
  lifted.forEach((l) => {
    petalSpawn({
      sprite: l.sprite,
      x: l.x, y: l.y - l.h * 0.3,
      w: l.w, h: l.h,
      vx: petalWind * 0.4 + (Math.random() - 0.5) * 30 * power,
      vy: -(70 + Math.random() * 60) * power,
      rot: l.rot
    });
  });
  petalRebuildPile();
}

// ---------- 입자 (무대 좌표) ----------

function petalSpawn(o) {
  if (petalAir.length >= PETAL_MAX_AIRBORNE) petalAir.shift();
  // 꽃송이는 꽃잎 한 장보다 무거움 → 크게 펄럭이지 않고, 약간 흔들리며 곧게 내려앉음
  petalAir.push({
    sprite: o.sprite,
    x: o.x, y: o.y, w: o.w, h: o.h,
    vx: o.vx || 0, vy: o.vy || 0,
    age: 0,
    release: !!o.release,                 // 가지에서 막 떨어지는 중 (처음 0.4초: 꼭지 기준으로 살짝 기울며 떨어짐)
    rot: o.rot || 0,
    tiltDir: Math.random() < 0.5 ? -1 : 1,
    drift: (Math.random() - 0.5) * 0.12,  // 아주 느린 회전 (rad/s)
    swayA: 6 + Math.random() * 10,        // 좌우 흔들림 폭(px) — 작게
    swayW: 1.4 + Math.random() * 1.0,     // 흔들림 빠르기(rad/s)
    swayP: Math.random() * Math.PI * 2,
    tiltA: 0.06 + Math.random() * 0.08,   // 흔들림에 따라 기우는 각도(rad) — 진자처럼
    fall: 125 + Math.random() * 45,       // 종단 낙하 속도(px/s)
    sail: 0.35 + Math.random() * 0.25,    // 바람을 타는 정도 — 무거워서 조금만
    offX: 0
  });
}

function petalKick() {
  if (petalRaf === null) {
    petalLastT = performance.now();
    petalRaf = requestAnimationFrame(petalFrame);
  }
}

function petalFloorAt(x) {
  const i = Math.floor((x - PILE_X0) / 4);
  if (i < 0 || i >= petalHeight.length) return 0;
  return petalHeight[i];
}

function petalFrame(t) {
  const dt = Math.min(0.05, (t - petalLastT) / 1000);
  petalLastT = t;
  petalClock += dt;

  const breath = Math.sin(petalClock * 0.23) * 5 + Math.sin(petalClock * 0.61 + 1.3) * 3;
  petalGust *= Math.pow(0.5, dt);
  petalLift *= Math.pow(0.3, dt);
  petalWind = breath + petalGust;
  plantSoundWind(petalWind, petalLift);

  const PZ = window.VIEW_ZOOM || 1;
  const sx = window.scrollX / PZ, sy = window.scrollY / PZ;
  const pvw = petalVW / PZ, pvh = petalVH / PZ;
  const ctx = petalAirCtx;
  ctx.setTransform(petalDpr * PZ, 0, 0, petalDpr * PZ, 0, 0);
  ctx.clearRect(0, 0, pvw, pvh);

  const next = [];
  for (const p of petalAir) {
    p.age += dt;
    // 중력으로 가속 → 공기 저항으로 종단 속도에 수렴 (위로 떠오른 경우도 자연스럽게 다시 떨어짐)
    const term = p.fall - petalLift * p.sail;
    p.vy = Math.min(term, p.vy + 420 * dt);
    if (p.vy > term) p.vy += (term - p.vy) * Math.min(1, dt * 3);

    // 약한 바람 + 위치마다 조금 다른 공기 흐름
    const turb = Math.sin(p.y * 0.008 + petalClock * 0.5 + p.swayP) * 5;
    p.vx += ((petalWind + turb) * p.sail - p.vx) * Math.min(1, dt * 1.2);

    // 좌우 흔들림은 "위치"에 작게 더함 (속도로 쌓이지 않음) — 떨어지기 시작한 뒤 서서히 커짐
    const ramp = Math.min(1, p.age / 1.2);
    const s1 = Math.sin(p.age * p.swayW + p.swayP);
    const newOff = s1 * p.swayA * ramp;
    p.x += p.vx * dt + (newOff - p.offX);
    p.offX = newOff;
    p.y += p.vy * dt;

    // 기울기: 흔들리는 방향으로 진자처럼 살짝 + 아주 느린 회전 / 막 떨어질 땐 꼭지 쪽으로 한 번 기욺
    const releaseTilt = p.release ? p.tiltDir * 0.22 * Math.sin(Math.min(1, p.age / 0.45) * Math.PI) : 0;
    p.rot += p.drift * dt;
    p.drawRot = p.rot + Math.cos(p.age * p.swayW + p.swayP) * p.tiltA * ramp + releaseTilt;

    const floor = petalGroundY - petalFloorAt(p.x);
    if (p.y + p.h * 0.3 >= floor && p.vy > 0) {
      p.rot = p.drawRot;
      petalLand(p, floor);
      continue;
    }
    next.push(p);

    // 화면 안에 있을 때만 그림
    const px = p.x - sx, py = p.y - sy;
    const r = Math.max(p.w, p.h);
    if (px < -r || px > pvw + r || py < -r || py > pvh + r) continue;
    const src = petalSprites[p.sprite];
    if (!src || !src.naturalWidth) continue;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(p.drawRot || p.rot);
    ctx.drawImage(src, -p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
  petalAir = next;

  if (petalAir.length > 0 || Math.abs(petalGust) > 2 || petalLift > 2) {
    petalRaf = requestAnimationFrame(petalFrame);
  } else {
    ctx.clearRect(0, 0, pvw, pvh);
    plantSoundWind(0, 0);
    petalRaf = null;
  }
}

function petalLand(p, floor) {
  if (p.x < PILE_X0 || p.x > PILE_X0 + PILE_W) return; // 바닥 범위 밖은 사라짐
  const land = {
    sprite: p.sprite,
    x: p.x, y: floor - p.h * 0.18,
    w: p.w, h: p.h,
    rot: p.rot + (Math.random() - 0.5) * 0.15   // 떨어지던 자세 그대로 내려앉음
  };
  petalLanded.push(land);
  if (petalLanded.length > PETAL_MAX_LANDED) {
    petalLanded.splice(0, petalLanded.length - PETAL_MAX_LANDED);
    petalRebuildPile();
    return;
  }
  petalRaiseFloor(land);
  petalStamp(land);
}

function petalRaiseFloor(l) {
  const half = Math.max(10, l.w * 0.45);
  const bump = l.h * 0.14;
  const i0 = Math.max(0, Math.floor((l.x - half - PILE_X0) / 4));
  const i1 = Math.min(petalHeight.length - 1, Math.ceil((l.x + half - PILE_X0) / 4));
  for (let i = i0; i <= i1; i++) {
    const d = (PILE_X0 + i * 4 - l.x) / half;
    petalHeight[i] = Math.min(PETAL_PILE_MAX_H, petalHeight[i] + bump * Math.max(0, 1 - d * d));
  }
}

function petalStamp(l) {
  const src = petalSprites[l.sprite];
  if (!src || !src.naturalWidth) {
    if (src) src.addEventListener("load", () => petalStamp(l), { once: true });
    return;
  }
  const pad = Number(petalPileCanvas.dataset.pad || 0);
  const topWorld = petalGroundY - PETAL_PILE_MAX_H - pad;
  const ctx = petalPileCtx;
  ctx.save();
  ctx.translate(l.x - PILE_X0, l.y - topWorld);
  ctx.rotate(l.rot);
  ctx.drawImage(src, -l.w / 2, -l.h / 2, l.w, l.h); // 원본 비율 그대로 (눌림 없음)
  ctx.restore();
}

function petalRebuildPile() {
  if (!petalPileCtx) return;
  petalHeight = new Float32Array(Math.ceil(PILE_W / 4) + 2);
  petalPileCtx.setTransform(1, 0, 0, 1, 0, 0);
  petalPileCtx.clearRect(0, 0, petalPileCanvas.width, petalPileCanvas.height);
  petalLanded.forEach((l) => {
    // 바닥 높이가 바뀌었을 수 있으니 순서대로 다시 쌓음
    const floor = petalGroundY - petalFloorAt(l.x);
    l.y = floor - l.h * 0.18;
    petalRaiseFloor(l);
    petalStamp(l);
  });
}

// ================================================================
// PLANT SOUND LAYER — 기존 노이즈/틱 위에 얹는 식물적인 소리 한 겹 (전부 실시간 합성)
// · 줄기가 늘어나는 소리: 타이핑마다 낮게 "끼익" 하고 휘는 섬유질 소리 (유전적 거리가 멀수록 길고 낮음)
// · 물관 기포 소리: 식물이 수분을 끌어올릴 때 나는 아주 작은 딸깍임(캐비테이션 클릭) 몇 개
// · 잎이 스치는 바람: 꽃을 날리는 바람 세기에 맞춰 잎사귀 스치는 소리가 커졌다 작아짐
// · 꽃이 떨어질 때: 짧게 사각거림 / Enter: 물방울 하나
// 볼륨은 PLANT_SOUND_GAIN 하나로 전체 조절
// ================================================================
const PLANT_SOUND_GAIN = 0.9;
let plantSnd = null;

function plantSoundReady() {
  if (!audioStarted || !audioCtx) return false;
  if (plantSnd) return true;
  const ctx = audioCtx;
  const master = ctx.createGain();
  master.gain.value = PLANT_SOUND_GAIN;
  master.connect(ctx.destination);

  const len = ctx.sampleRate * 2;
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noise.getChannelData(0);
  let pink = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    pink = pink * 0.97 + w * 0.03;      // 살짝 둥근(핑크 쪽) 질감
    d[i] = w * 0.55 + pink * 3.2;
  }

  // 잎 스치는 바람 (계속 돌지만 평소엔 거의 무음)
  const windSrc = ctx.createBufferSource();
  windSrc.buffer = noise;
  windSrc.loop = true;
  const windBand = ctx.createBiquadFilter();
  windBand.type = "bandpass";
  windBand.frequency.value = 900;
  windBand.Q.value = 0.7;
  const windHigh = ctx.createBiquadFilter();
  windHigh.type = "highpass";
  windHigh.frequency.value = 400;
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  windSrc.connect(windBand);
  windBand.connect(windHigh);
  windHigh.connect(windGain);
  windGain.connect(master);
  windSrc.start();

  plantSnd = { ctx, master, noise, windBand, windGain };
  return true;
}

function plantNoiseBurst(dur, setup, when = 0) {
  const s = plantSnd;
  const src = s.ctx.createBufferSource();
  src.buffer = s.noise;
  const out = setup(src);
  out.connect(s.master);
  const t = s.ctx.currentTime + when;
  src.start(t, Math.random() * 1.5, dur + 0.05);
  return t;
}

// 줄기가 늘어나며 휘는 소리 + 물관 기포 딸깍임
function plantSoundOnGrow(distance, char) {
  if (!plantSoundReady()) return;
  const ctx = plantSnd.ctx;
  const strength = Math.min(1, 0.35 + distance / 450);
  const dur = 0.22 + strength * 0.35;
  const f0 = 320 - strength * 120 + Math.random() * 40;

  plantNoiseBurst(dur, (src) => {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 16;
    const t = ctx.currentTime;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16 * strength, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g);
    return g;
  });

  const clicks = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < clicks; i++) {
    plantNoiseBurst(0.012, (src) => {
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 2600 + Math.random() * 2400;
      const g = ctx.createGain();
      const t = ctx.currentTime + 0.05 + Math.random() * 0.5;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.setValueAtTime(0.05 + Math.random() * 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.01);
      src.connect(hp); hp.connect(g);
      return g;
    }, 0);
  }
  void char;
}

// 바람 세기 → 잎 스치는 소리
function plantSoundWind(wind, lift) {
  if (!plantSnd) return;
  const a = Math.min(1, (Math.abs(wind) + lift * 0.6) / 90);
  const t = plantSnd.ctx.currentTime;
  plantSnd.windGain.gain.setTargetAtTime(0.004 + a * 0.11, t, 0.25);
  plantSnd.windBand.frequency.setTargetAtTime(700 + a * 1600, t, 0.3);
}

// 꽃이 떨어질 때 사각거림
function plantSoundRustle(amount = 1) {
  if (!plantSoundReady()) return;
  const ctx = plantSnd.ctx;
  plantNoiseBurst(0.3, (src) => {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3200 + Math.random() * 1500;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * amount, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    src.connect(bp); bp.connect(g);
    return g;
  });
}

// Enter: 물방울 하나
function plantSoundDroplet() {
  if (!plantSoundReady()) return;
  const ctx = plantSnd.ctx;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  const f = 1100 + Math.random() * 300;
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(f * 0.38, t + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.08, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(g); g.connect(plantSnd.master);
  osc.start(t); osc.stop(t + 0.25);
}

window.addEventListener("DOMContentLoaded", () => {
  // init()이 무대를 잡은 뒤에 붙도록 한 박자 뒤에 실행
  setTimeout(petalInit, 0);
});


// ================================================================
// COMPANION X-RAY — 추가된 식물(N-xx)의 실제 생장 골격
// 각 이미지의 형태(알파)를 골격화(skeletonize)해서 뽑은 선들이라, 컬러 이미지와 같은 자리·같은
// 크기·같은 회전으로 정확히 겹쳐짐. 선 = 줄기/잎의 축, 채운 점 = 분기점(생장 결절), 빈 점 = 끝눈.
// 좌표는 이미지 가로폭 기준 비율 (x: 0~1, y: 0~세로/가로 비)
// ================================================================
const COMPANION_SKELETON = {"N-04":{"s":[{"pts":[0.6129,0.7467,0.6,0.7595,0.5876,0.7738,0.5814,0.7881,0.5786,0.8024,0.5762,0.8167,0.5762,0.831,0.5738,0.8452,0.5738,0.859,0.5738,0.8605],"r":0.2504},{"pts":[0.6157,0.6367,0.6114,0.6238,0.6086,0.6095,0.6062,0.5952,0.6029,0.581,0.599,0.5667,0.5952,0.5524,0.59,0.5381,0.5829,0.5238,0.5767,0.5095,0.569,0.4952,0.5595,0.481,0.5467,0.4738],"r":0.3114},{"pts":[0.5429,0.47,0.5429,0.4571,0.5457,0.4429,0.5529,0.4286,0.5614,0.4143,0.5667,0.4,0.5667,0.3857,0.5571,0.3738,0.5429,0.3595,0.5319,0.3452,0.5286,0.331,0.5262,0.3167,0.519,0.3043,0.5048,0.2905,0.4905,0.2762,0.4762,0.2619,0.4619,0.2476,0.4476,0.2333,0.4333,0.219,0.419,0.2048,0.4048,0.1905,0.3905,0.1762,0.3762,0.1671,0.3619,0.1614,0.3476,0.1571,0.3333,0.1529,0.319,0.15,0.3048,0.15,0.2905,0.151,0.2762,0.1533,0.2619,0.16,0.2586,0.1614],"r":0.1393},{"pts":[0.5681,0.38,0.581,0.369,0.5952,0.3548,0.6095,0.3405,0.6238,0.3262,0.6381,0.3119,0.6524,0.2976,0.6667,0.2833,0.681,0.269,0.6952,0.2548,0.7095,0.2405,0.7238,0.2262,0.7381,0.2119,0.75,0.1981,0.7643,0.1905,0.7786,0.1881,0.7929,0.1905,0.8071,0.1933,0.821,0.1967,0.8224,0.1971],"r":0.0965},{"pts":[0.7452,0.861,0.7548,0.8738,0.769,0.8881,0.7833,0.9024,0.7976,0.9167,0.8119,0.931,0.8262,0.9452,0.8405,0.9595,0.8548,0.9738,0.869,0.9881,0.8786,1.0024,0.881,1.0167,0.8814,1.031,0.881,1.0452,0.8795,1.0595,0.8767,1.0738,0.8762,1.0867],"r":0.0703},{"pts":[0.1395,0.4348,0.1524,0.4448,0.1667,0.4514,0.181,0.4576,0.1952,0.469,0.2095,0.4833,0.2238,0.4976,0.2371,0.5119,0.2395,0.5152],"r":0.0539},{"pts":[0.2224,1.0105,0.229,0.9976,0.2343,0.9833,0.239,0.969,0.2429,0.9548,0.2452,0.9405,0.2476,0.9262,0.2486,0.9119,0.25,0.8976,0.2514,0.8833,0.2524,0.869,0.2543,0.8548,0.2548,0.8405,0.2571,0.8262,0.2576,0.8119,0.2605,0.7976,0.2619,0.7833,0.2624,0.769,0.2643,0.7548,0.2643,0.7405,0.2662,0.7262,0.2667,0.7119,0.2667,0.6976,0.2667,0.6833,0.2714,0.669,0.2857,0.6548,0.3,0.6405,0.3143,0.6262,0.3286,0.6119,0.3429,0.5976,0.3571,0.5833,0.3714,0.569,0.3857,0.5548,0.4,0.5405,0.4143,0.5262,0.4271,0.5119,0.4405,0.5038,0.4548,0.4986,0.469,0.4929,0.4833,0.4881,0.4976,0.4833,0.5119,0.4795,0.5262,0.4752,0.539,0.4738],"r":0.1047},{"pts":[0.6167,0.7414,0.6167,0.7286,0.6167,0.7143,0.6167,0.7,0.6167,0.6857,0.6167,0.6714,0.6167,0.6571,0.6167,0.6433,0.6167,0.6419],"r":0.285},{"pts":[0.57,0.8657,0.5571,0.8786,0.5429,0.8929,0.5286,0.9071,0.5143,0.9214,0.5,0.9357,0.4905,0.9495,0.4905,0.951],"r":0.1942},{"pts":[0.7595,1.451,0.759,1.4381,0.7571,1.4238,0.7562,1.4095,0.7548,1.3952,0.7548,1.381,0.7524,1.3667,0.7524,1.3524,0.7524,1.3381,0.75,1.3238,0.75,1.3095,0.75,1.2952,0.749,1.281,0.7476,1.2667,0.7443,1.2524,0.7395,1.2381,0.7343,1.2238,0.729,1.2095,0.719,1.1952,0.7048,1.181,0.6905,1.1667,0.6871,1.1633],"r":0.0497},{"pts":[0.2881,1.5962,0.2857,1.5833,0.2871,1.569,0.2905,1.5548,0.2929,1.5405,0.2952,1.5262,0.3029,1.5119,0.3086,1.4976,0.3138,1.4833,0.3186,1.469,0.3224,1.4548,0.3267,1.4405,0.3314,1.4262,0.3333,1.4119,0.3338,1.3976,0.3371,1.3833,0.3381,1.369,0.3381,1.3548,0.3381,1.3405,0.3381,1.3262,0.3405,1.3119,0.3405,1.2976,0.3405,1.2833,0.3405,1.269,0.3405,1.2548,0.3405,1.2405,0.3405,1.2262,0.3405,1.2119,0.3405,1.1976,0.341,1.1833,0.3471,1.169,0.35,1.1548,0.3524,1.1405,0.3543,1.1262,0.3548,1.1119,0.3571,1.0976,0.3586,1.0833,0.361,1.069,0.3667,1.0548,0.381,1.0429,0.3952,1.0319,0.4095,1.0205,0.4238,1.01,0.4381,0.999,0.4524,0.9857,0.4667,0.9714,0.481,0.9576,0.4867,0.9548],"r":0.0539},{"pts":[0.2443,0.519,0.2571,0.519,0.2714,0.5181,0.2857,0.5133,0.3,0.5062,0.3143,0.4967,0.3286,0.4881,0.3429,0.4805,0.3571,0.4743,0.3714,0.4714,0.3857,0.4714,0.4,0.4762,0.4143,0.4905,0.4281,0.5043,0.4295,0.5057],"r":0.1715},{"pts":[0.5276,0.3086,0.5405,0.2976,0.5495,0.2833,0.55,0.269,0.5486,0.2548,0.5476,0.2405,0.5443,0.2262,0.539,0.2119,0.5381,0.1976,0.5381,0.1833,0.54,0.169,0.5419,0.1657],"r":0.1588},{"pts":[0.6795,1.1633,0.6667,1.1762,0.6524,1.1905,0.6381,1.2048,0.6243,1.219,0.6214,1.2333,0.6214,1.2476,0.6214,1.2619,0.6214,1.2762,0.6219,1.2905,0.6229,1.3048,0.6214,1.319,0.6238,1.3333,0.6238,1.3476,0.6267,1.3619,0.63,1.3762,0.6319,1.3905,0.6333,1.4048,0.6352,1.419,0.6452,1.4319,0.6519,1.4452,0.6524,1.4595,0.6524,1.4738,0.6538,1.4867],"r":0.0429},{"pts":[0.6205,0.7467,0.6333,0.7595,0.6476,0.7738,0.6619,0.7881,0.6762,0.8024,0.6905,0.8167,0.7048,0.831,0.719,0.8452,0.7333,0.8548,0.7414,0.8571],"r":0.2318},{"pts":[0.5276,1.1438,0.5229,1.131,0.5162,1.1167,0.5052,1.1024,0.4981,1.0881,0.4952,1.0738,0.4933,1.0595,0.491,1.0452,0.4905,1.031,0.4905,1.0167,0.4905,1.0024,0.4905,0.9881,0.4905,0.9738,0.4905,0.96,0.4905,0.9586],"r":0.0897},{"pts":[0.6833,1.1581,0.6857,1.1452,0.6881,1.131,0.6881,1.1167,0.6895,1.1024,0.6905,1.0881,0.6905,1.0738,0.6929,1.0595,0.6929,1.0452,0.6929,1.031,0.6929,1.0167,0.6929,1.0024,0.6905,0.9881,0.6852,0.9738,0.6714,0.9595,0.6571,0.9452,0.6429,0.931,0.6286,0.9167,0.6143,0.9024,0.6,0.8881,0.5857,0.8738,0.5776,0.8657],"r":0.1516},{"pts":[0.9271,0.7619,0.9143,0.7619,0.9,0.7629,0.8857,0.7643,0.8714,0.7667,0.8571,0.7705,0.8429,0.7762,0.8286,0.7881,0.8143,0.8024,0.8,0.8167,0.7857,0.831,0.7714,0.8448,0.7571,0.8514,0.7467,0.8562],"r":0.0864},{"pts":[0.2395,0.5205,0.2286,0.5333,0.2143,0.5476,0.2,0.5619,0.1857,0.5695,0.1714,0.5757,0.1571,0.5843,0.1433,0.5976,0.131,0.61,0.1167,0.619,0.1081,0.6333,0.1029,0.6476,0.0981,0.6619,0.0952,0.6762,0.0929,0.6905,0.0905,0.7048,0.0876,0.719,0.0857,0.7333,0.0857,0.7476,0.0857,0.7619,0.0857,0.7762,0.0857,0.7905,0.0857,0.801],"r":0.0359},{"pts":[0.9248,0.5438,0.9119,0.5452,0.8976,0.5452,0.8833,0.5429,0.869,0.5405,0.8548,0.5381,0.8405,0.5262,0.8262,0.5148,0.8119,0.5033,0.7976,0.4957,0.7833,0.4929,0.769,0.4933,0.7548,0.5048,0.7405,0.519,0.7262,0.5333,0.7119,0.5476,0.6976,0.5619,0.6833,0.5762,0.669,0.5905,0.6548,0.6048,0.6405,0.619,0.6262,0.6329,0.6205,0.6371],"r":0.1427}],"j":[0.4881,0.9548,0.6833,1.1619,0.619,0.6381,0.431,0.5071,0.6143,0.7452,0.5429,0.4714,0.7429,0.8571,0.5667,0.381,0.5738,0.8619,0.2405,0.5167,0.5262,0.3095],"t":[0.8238,0.1976,0.2571,0.1619,0.9262,0.5429,0.2881,1.5976,0.8762,1.0881,0.5429,0.1643,0.2214,1.0119,0.7595,1.4524,0.9286,0.7619,0.0857,0.8024,0.6548,1.4881,0.1381,0.4333,0.5286,1.1452]},"N-05":{"s":[{"pts":[0.1476,0.5538,0.1462,0.5667,0.1414,0.581,0.1405,0.5952,0.1405,0.6095,0.1381,0.6238,0.1381,0.6381,0.1357,0.6524,0.1357,0.6667,0.1333,0.681,0.1338,0.6952,0.1376,0.7095,0.1381,0.7238,0.1395,0.7319],"r":0.0303},{"pts":[0.1476,1.4367,0.15,1.4238,0.1538,1.4095,0.1576,1.3952,0.1605,1.381,0.1576,1.3667,0.1538,1.361],"r":0.0395},{"pts":[0.52,0.9952,0.5071,1.0048,0.4929,1.019,0.4786,1.0333,0.4643,1.0476,0.45,1.0619,0.4357,1.0762,0.4214,1.0905,0.4071,1.1048,0.399,1.111],"r":0.1341},{"pts":[0.6905,1.4057,0.6905,1.3929,0.6905,1.3786,0.6895,1.3643,0.681,1.35,0.6695,1.3357,0.6629,1.3214,0.65,1.3071,0.6357,1.2929,0.6214,1.2786,0.6071,1.2643,0.5929,1.25,0.5786,1.2357,0.5643,1.2214,0.561,1.2181],"r":0.077},{"pts":[0.3224,1.4062,0.3071,1.4214,0.2905,1.4357,0.2738,1.4481,0.2581,1.4619,0.2467,1.4724],"r":0.0543},{"pts":[0.6605,0.9405,0.6476,0.9467,0.6333,0.9581,0.619,0.9667,0.6048,0.9724,0.5905,0.9771,0.5762,0.9819,0.5619,0.9867,0.5476,0.991,0.5333,0.9948,0.5276,0.9952],"r":0.0421},{"pts":[0.4262,1.239,0.4219,1.2262,0.419,1.2119,0.419,1.1976,0.4148,1.1833,0.4029,1.1695,0.4014,1.1681],"r":0.208},{"pts":[0.4276,1.23,0.4405,1.2195,0.4548,1.2143,0.469,1.2143,0.4833,1.2143,0.4976,1.2143,0.5119,1.2143,0.5262,1.2143,0.5405,1.2143,0.5543,1.2143,0.5557,1.2143],"r":0.1874},{"pts":[0.5238,0.9914,0.5333,0.9786,0.5476,0.9643,0.5567,0.95,0.5619,0.9357,0.5648,0.9214,0.5676,0.9071,0.5724,0.8933,0.5729,0.8919],"r":0.0399},{"pts":[0.2943,1.0557,0.2857,1.0429,0.2714,1.0286,0.2571,1.0143,0.2429,1.0,0.2319,0.9857,0.2281,0.9729,0.2143,0.9619,0.2005,0.949,0.199,0.9481],"r":0.1074},{"pts":[0.2324,0.9729,0.2452,0.9619,0.2595,0.9476,0.2738,0.9333,0.2871,0.919,0.2929,0.9048,0.2929,0.9014],"r":0.0512},{"pts":[0.3943,1.0181,0.4071,1.0095,0.4214,0.9952,0.4357,0.981,0.45,0.9667,0.4643,0.9524,0.4786,0.9381,0.4876,0.9238,0.4938,0.9095,0.4986,0.8952,0.5,0.881,0.5029,0.8667,0.5048,0.8524,0.5057,0.8381,0.5086,0.8238,0.5138,0.8095,0.5119,0.7952,0.5029,0.781,0.499,0.7667,0.4981,0.7524,0.5038,0.7381,0.5062,0.7243,0.519,0.7143,0.5281,0.7,0.5324,0.6857,0.5367,0.6714,0.5429,0.6576,0.5438,0.6562],"r":0.042},{"pts":[0.6367,0.2819,0.6238,0.2867,0.61,0.2929,0.6071,0.3071,0.6071,0.3214,0.6071,0.3357,0.6071,0.35,0.6133,0.3643,0.609,0.3786,0.6,0.3929,0.591,0.4071,0.5814,0.419,0.581,0.4333,0.581,0.4476,0.581,0.4619,0.589,0.4762,0.5857,0.4905,0.5771,0.5048,0.569,0.519,0.5571,0.529,0.5429,0.53,0.5286,0.5233,0.5171,0.5095,0.51,0.4967],"r":0.0219},{"pts":[0.3262,1.401,0.3281,1.3881,0.3286,1.3738,0.3286,1.3595,0.33,1.3452,0.3429,1.331,0.3571,1.3167,0.3605,1.3133],"r":0.09},{"pts":[0.33,1.4062,0.3429,1.419,0.3571,1.4333,0.3667,1.4476,0.369,1.4619,0.371,1.4762,0.3714,1.4867],"r":0.0493},{"pts":[0.9605,1.179,0.9476,1.1895,0.9333,1.1981,0.919,1.2048,0.9048,1.2095,0.8905,1.2133,0.8762,1.2157,0.8619,1.2133,0.8476,1.2024,0.8333,1.1881,0.8229,1.1776],"r":0.0304},{"pts":[0.7,0.1062,0.699,0.119,0.6943,0.1333,0.6929,0.1476,0.689,0.1619,0.6762,0.1705,0.6667,0.1833,0.6605,0.1976,0.6543,0.211,0.6443,0.2238,0.6429,0.2381,0.6429,0.2524,0.6414,0.2667,0.6405,0.2771],"r":0.03},{"pts":[0.7986,1.201,0.8052,1.1881,0.8024,1.1738,0.7976,1.1595,0.7976,1.1452,0.8005,1.131,0.8014,1.1167,0.7938,1.1024,0.79,1.0881,0.7862,1.0738,0.7876,1.0595,0.7943,1.0452,0.7952,1.031,0.7952,1.0167,0.7952,1.0024,0.7967,0.9881,0.7976,0.9738,0.8,0.9595,0.8052,0.9452,0.8052,0.931,0.8005,0.9229],"r":0.0504},{"pts":[0.5452,0.6486,0.5452,0.6357,0.5452,0.6214,0.5452,0.6071,0.5471,0.5929,0.55,0.5786,0.55,0.5643,0.551,0.55,0.55,0.5362,0.55,0.5348],"r":0.0222},{"pts":[0.0729,1.0243,0.0857,1.0324,0.1,1.0438,0.1143,1.051,0.1286,1.0557,0.1429,1.0605,0.1571,1.0643,0.1714,1.0719,0.1857,1.0857,0.2,1.1,0.2119,1.1143,0.2133,1.1176],"r":0.0485},{"pts":[0.8229,1.1724,0.8357,1.1595,0.85,1.1457,0.8643,1.1376,0.8786,1.1314,0.8914,1.1214,0.9024,1.1071,0.9057,1.1038],"r":0.0394},{"pts":[0.3557,1.0571,0.3429,1.0571,0.3286,1.0571,0.3143,1.0571,0.3,1.0571,0.2876,1.0667,0.2738,1.081,0.2595,1.0952,0.2452,1.1095,0.231,1.1176,0.2167,1.1195,0.2048,1.131,0.1905,1.1452,0.1762,1.1595,0.1619,1.169,0.1476,1.169,0.1333,1.169,0.119,1.169,0.1048,1.169,0.0905,1.169,0.0776,1.1676],"r":0.0951},{"pts":[0.3976,1.1629,0.3976,1.15,0.3976,1.1357,0.3976,1.1214,0.3929,1.1071,0.3786,1.0929,0.3648,1.0786,0.36,1.0643,0.3595,1.061],"r":0.1968},{"pts":[0.549,0.6519,0.5643,0.649,0.581,0.6443,0.5976,0.6348,0.6143,0.6219,0.6271,0.611],"r":0.0197},{"pts":[0.1938,0.949,0.181,0.9614,0.1667,0.9681,0.1524,0.9657,0.1381,0.9633,0.1238,0.9605,0.1095,0.9548,0.0952,0.9448,0.0895,0.941],"r":0.0287},{"pts":[0.6438,1.049,0.6367,1.0619,0.6333,1.0762,0.6333,1.0905,0.6333,1.1048,0.6333,1.119,0.6333,1.1295],"r":0.0466},{"pts":[0.5595,1.2143,0.5643,1.2095,0.569,1.2048,0.5738,1.2048],"r":0.1553},{"pts":[0.6371,1.1324,0.65,1.1238,0.6643,1.1095,0.6786,1.0952,0.6919,1.081,0.6995,1.0667,0.7048,1.0524,0.7062,1.0419],"r":0.0421},{"pts":[0.799,1.2062,0.8119,1.219,0.8262,1.2333,0.8405,1.2476,0.8548,1.2619,0.869,1.2714,0.8833,1.2738,0.8976,1.2719,0.9119,1.27,0.9262,1.269,0.9319,1.269],"r":0.0404},{"pts":[0.5033,0.7229,0.4914,0.7119,0.4857,0.6976,0.481,0.6833,0.4743,0.669,0.4667,0.6548,0.459,0.6405,0.4576,0.6371],"r":0.0228},{"pts":[0.5157,0.3657,0.531,0.381,0.5476,0.3976,0.5643,0.4086,0.5795,0.4157],"r":0.0127},{"pts":[0.3895,1.0205,0.3838,1.031,0.3738,1.0429,0.3624,1.0543,0.361,1.0557],"r":0.1477},{"pts":[0.8071,1.1786,0.8119,1.1762,0.8167,1.1738,0.819,1.1738],"r":0.0807},{"pts":[0.1986,0.71,0.1857,0.719,0.1714,0.7262,0.1571,0.7305,0.1443,0.7333],"r":0.0162},{"pts":[0.711,1.2319,0.7238,1.219,0.7381,1.2062,0.7524,1.2048,0.7667,1.2048,0.781,1.2048,0.7938,1.2048],"r":0.0997},{"pts":[0.4276,1.2443,0.4405,1.2571,0.4548,1.2714,0.469,1.2857,0.4833,1.3,0.4976,1.3143,0.5119,1.3286,0.5262,1.3429,0.5405,1.3571,0.5481,1.3714,0.5538,1.3857,0.56,1.4,0.5671,1.4143,0.5724,1.4224],"r":0.0977},{"pts":[0.1538,1.3533,0.1667,1.3405,0.1776,1.3262,0.1905,1.3124,0.2048,1.3043,0.219,1.3,0.2333,1.2976,0.2476,1.2952,0.2619,1.2919,0.2762,1.2852,0.2905,1.2714,0.3048,1.2571,0.319,1.2429,0.3333,1.2286,0.3476,1.2143,0.3619,1.2,0.3762,1.1857,0.3905,1.1714,0.3938,1.1681],"r":0.0999},{"pts":[0.711,1.2371,0.7238,1.25,0.7381,1.2643,0.7524,1.2786,0.7667,1.2929,0.7738,1.3071,0.7833,1.3214,0.7976,1.3314,0.8114,1.3405,0.82,1.3548,0.8233,1.3605],"r":0.0606},{"pts":[0.1486,1.3571,0.1333,1.36,0.1167,1.3638,0.1,1.3686,0.0833,1.3771,0.0705,1.3867],"r":0.0513},{"pts":[0.5843,0.7657,0.5729,0.7786,0.5595,0.7867,0.5452,0.7914,0.531,0.7952,0.5181,0.799],"r":0.0292},{"pts":[0.3881,0.8657,0.3881,0.8786,0.3895,0.8929,0.3895,0.9071,0.3881,0.9214,0.3881,0.9357,0.3881,0.95,0.3895,0.9643,0.3905,0.9786,0.3905,0.9929,0.3905,1.0071,0.3905,1.0152],"r":0.0775},{"pts":[0.5776,1.201,0.5929,1.1857,0.6095,1.169,0.6252,1.1524,0.6329,1.1371],"r":0.1167},{"pts":[0.1405,0.7371,0.1405,0.75,0.14,0.7643,0.1381,0.7786,0.1438,0.7929,0.1452,0.8071,0.1452,0.8214,0.1452,0.8357,0.1424,0.85,0.1376,0.8643,0.15,0.8719,0.1638,0.881,0.1705,0.8952,0.1786,0.9095,0.189,0.9238,0.1938,0.9381,0.1952,0.9438],"r":0.0312},{"pts":[0.3681,1.3133,0.381,1.3262,0.3952,1.3405,0.4095,1.3548,0.4238,1.369,0.4381,1.3833,0.4486,1.3938],"r":0.0782},{"pts":[0.7057,1.2333,0.6929,1.2333,0.6786,1.2333,0.6643,1.2333,0.65,1.2333,0.6357,1.2333,0.6214,1.2333,0.6071,1.231,0.5929,1.2214,0.579,1.2076,0.5776,1.2062],"r":0.1387},{"pts":[0.4224,1.2443,0.4071,1.2595,0.3905,1.2762,0.3738,1.2929,0.3643,1.3081],"r":0.1552}],"j":[0.8214,1.1762,0.6405,0.2786,0.5762,1.2024,0.7071,1.2333,0.1952,0.9476,0.6357,1.1333,0.3643,1.3119,0.4,1.1667,0.3262,1.4024,0.7952,1.2048,0.1524,1.3548,0.581,0.4167,0.2952,1.0571,0.4238,1.2429,0.5214,0.9952,0.1405,0.7333,0.3905,1.019,0.5048,0.7238,0.3595,1.0595,0.2143,1.119,0.231,0.9738,0.3976,1.1119,0.5452,0.6548,0.5167,0.8,0.55,0.5333],"t":[0.0714,1.0238,0.9333,1.269,0.069,1.3881,0.1476,0.5524,0.6286,0.6095,0.6905,1.4071,0.5095,0.4952,0.2,0.7095,0.7071,1.0405,0.9619,1.1786,0.7,0.1048,0.6452,1.0476,0.9071,1.1024,0.3881,0.8643,0.45,1.3952,0.5738,1.4238,0.8238,1.3619,0.5143,0.3643,0.4571,0.6357,0.2452,1.4738,0.5857,0.7643,0.6619,0.9405,0.2929,0.9,0.1476,1.4381,0.5738,0.8905,0.3714,1.4881,0.8,0.9214,0.0762,1.1667,0.0881,0.9405]},"N-07":{"s":[{"pts":[0.5371,0.1467,0.5362,0.1595,0.5476,0.1738,0.5619,0.1881,0.5762,0.2024,0.5905,0.2167,0.6048,0.2305,0.6105,0.2348],"r":0.0583},{"pts":[0.0729,0.6548,0.0857,0.6576,0.1,0.6614,0.1143,0.6657,0.1286,0.6614,0.1429,0.6476,0.1571,0.6333,0.1714,0.619,0.1857,0.6067,0.1938,0.6048],"r":0.0718},{"pts":[0.5071,0.7367,0.5071,0.7238,0.5071,0.7095,0.5062,0.6952,0.5014,0.6848],"r":0.2465},{"pts":[0.2095,0.92,0.2124,0.9071,0.2152,0.8929,0.2181,0.8786,0.2238,0.8648,0.2381,0.8548,0.2524,0.8448,0.2667,0.84,0.281,0.8381,0.2952,0.8338,0.3095,0.8214,0.3238,0.8071,0.3381,0.7929,0.3524,0.7786,0.3667,0.7643,0.381,0.75,0.3952,0.7357,0.4095,0.7214,0.4238,0.7071,0.43,0.699],"r":0.1055},{"pts":[0.3157,0.4171,0.3286,0.4262,0.3429,0.4405,0.3571,0.4548,0.3714,0.469,0.3857,0.4833,0.4,0.4976,0.4143,0.5119,0.4286,0.5262,0.4429,0.5405,0.4571,0.5548,0.4714,0.569,0.4857,0.5833,0.4986,0.5943],"r":0.1472},{"pts":[0.6586,0.9462,0.6538,0.9333,0.651,0.919,0.6457,0.9048,0.6333,0.8905,0.6205,0.8776],"r":0.0937},{"pts":[0.4938,0.6848,0.481,0.6952,0.4667,0.6976,0.4524,0.6976,0.4381,0.6976,0.4348,0.6976],"r":0.2464},{"pts":[0.5086,0.5848,0.5214,0.5738,0.5357,0.5595,0.55,0.5452,0.5638,0.531,0.5714,0.5167,0.5738,0.5024,0.5738,0.4881,0.5738,0.4738,0.5738,0.4595,0.5738,0.4452,0.5738,0.431,0.5738,0.4167,0.5738,0.4024,0.5738,0.3881,0.5786,0.3738,0.5929,0.3595,0.6048,0.3452,0.6148,0.331,0.6214,0.3167,0.6333,0.3048,0.6476,0.2952,0.6619,0.2962,0.6762,0.3005,0.6905,0.3095,0.7048,0.3133,0.719,0.311,0.7333,0.3057,0.7476,0.3,0.7619,0.2933,0.7762,0.2862,0.7895,0.2738,0.7962,0.2657],"r":0.1353},{"pts":[0.3914,0.8633,0.3786,0.8762,0.3643,0.8905,0.35,0.9048,0.3357,0.919,0.3214,0.9333,0.3114,0.9476,0.3071,0.9581],"r":0.0609},{"pts":[0.7462,0.6214,0.7333,0.6224,0.719,0.6243,0.7048,0.6276,0.6905,0.63,0.6762,0.6381,0.6619,0.6524,0.6476,0.6667,0.6371,0.6771],"r":0.1509},{"pts":[0.3952,0.8581,0.4005,0.8452,0.4143,0.831,0.4286,0.8167,0.4429,0.8024,0.4571,0.7881,0.4714,0.7738,0.4857,0.7595,0.5,0.7452,0.5033,0.7419],"r":0.1697},{"pts":[0.511,0.7419,0.5238,0.7548,0.5381,0.769,0.5524,0.7833,0.5667,0.7976,0.581,0.8119,0.5952,0.8262,0.6095,0.8405,0.6181,0.8548,0.619,0.869,0.619,0.8724],"r":0.158},{"pts":[0.6157,0.2348,0.6286,0.2238,0.6386,0.2095,0.6433,0.1952,0.6419,0.181,0.6405,0.1667,0.6419,0.1524,0.6476,0.1381,0.6619,0.1238,0.6748,0.1095,0.6795,0.1038],"r":0.0665},{"pts":[0.6371,0.6824,0.65,0.6952,0.6643,0.7095,0.6786,0.7238,0.6929,0.7381,0.7071,0.7524,0.7214,0.7667,0.7357,0.781,0.75,0.7952,0.7643,0.809,0.7786,0.8176,0.7929,0.8271,0.8071,0.8405,0.8152,0.8471],"r":0.0973},{"pts":[0.62,0.3129,0.6167,0.3,0.6167,0.2857,0.6133,0.2714,0.6119,0.2571,0.6124,0.2429,0.6133,0.2395],"r":0.1387},{"pts":[0.4976,0.6795,0.4976,0.6667,0.4976,0.6524,0.499,0.6419],"r":0.2839},{"pts":[0.7514,0.6176,0.7643,0.6048,0.7786,0.5905,0.7929,0.5762,0.8033,0.5633],"r":0.0984},{"pts":[0.5024,0.6343,0.5024,0.6238,0.5024,0.6119,0.5024,0.6005,0.5024,0.599],"r":0.2654},{"pts":[0.4286,0.9176,0.4262,0.9048,0.4224,0.8905,0.4119,0.8762,0.399,0.8633],"r":0.1053},{"pts":[0.5062,0.6386,0.519,0.65,0.5333,0.6643,0.5476,0.6776,0.5619,0.6829,0.5762,0.6833,0.5905,0.6833,0.6048,0.6814,0.619,0.6805,0.6319,0.6786],"r":0.2449},{"pts":[0.8819,0.6214,0.869,0.6243,0.8548,0.631,0.8405,0.6362,0.8262,0.6419,0.8119,0.6452,0.7976,0.6452,0.7833,0.6452,0.769,0.6367,0.7548,0.6262,0.7514,0.6229],"r":0.1034},{"pts":[0.1714,0.5443,0.1733,0.5571,0.1743,0.5714,0.1857,0.5857,0.1967,0.5995,0.1971,0.601],"r":0.1097},{"pts":[0.5033,0.5848,0.4905,0.5738,0.4762,0.5595,0.4619,0.5452,0.4476,0.531,0.4333,0.5167,0.419,0.5024,0.4048,0.4881,0.3905,0.4738,0.3762,0.4595,0.3619,0.4452,0.3476,0.431,0.3348,0.4167,0.3362,0.4024,0.35,0.3881,0.3614,0.3738,0.3643,0.361],"r":0.1218},{"pts":[0.6152,0.8776,0.6024,0.8905,0.5881,0.9048,0.5738,0.919,0.5595,0.9333,0.5452,0.9476,0.5324,0.9619,0.5324,0.97],"r":0.0641},{"pts":[0.43,0.6938,0.419,0.681,0.4048,0.6667,0.3905,0.6524,0.3762,0.6381,0.3619,0.6238,0.3476,0.6114,0.3333,0.6095,0.319,0.6095,0.3048,0.6095,0.2905,0.6095,0.2762,0.6095,0.2619,0.6095,0.2476,0.609,0.2333,0.6071,0.219,0.6052,0.2048,0.6048,0.2014,0.6048],"r":0.153}],"j":[0.619,0.8762,0.2,0.6048,0.6143,0.2381,0.5048,0.7405,0.4952,0.6833,0.3952,0.8595,0.4333,0.6976,0.5024,0.5952,0.6357,0.681,0.6214,0.3143,0.75,0.619,0.5024,0.6357],"t":[0.3071,0.9595,0.8048,0.5619,0.681,0.1024,0.7976,0.2643,0.5333,0.9714,0.3643,0.3595,0.8167,0.8476,0.8833,0.6214,0.5381,0.1452,0.2095,0.9214,0.1714,0.5429,0.4286,0.919,0.6595,0.9476,0.0714,0.6548,0.3143,0.4167]},"N-08":{"s":[{"pts":[0.4343,1.1443,0.4214,1.1429,0.409,1.1357,0.3952,1.1229,0.3848,1.1095,0.3833,1.099],"r":0.051},{"pts":[0.611,0.4271,0.6262,0.4148,0.6429,0.4076,0.6514,0.3943],"r":0.0423},{"pts":[0.7086,1.1595,0.7214,1.1576,0.7357,1.1538,0.75,1.151,0.7643,1.1462,0.7776,1.1376,0.7881,1.1238,0.7986,1.1119,0.809,1.099,0.8162,1.0857,0.8267,1.0714,0.8329,1.0571,0.8424,1.0429,0.8505,1.0286,0.8614,1.0143,0.87,1.0038],"r":0.0252},{"pts":[0.4129,0.3705,0.4,0.3833,0.3857,0.3976,0.3714,0.4119,0.3586,0.4262,0.3571,0.4405,0.3571,0.4548,0.3581,0.469,0.3571,0.4833,0.3552,0.4976,0.351,0.5119,0.3471,0.5262,0.3419,0.5405,0.3386,0.5548,0.3352,0.569,0.3319,0.5833,0.3295,0.5976,0.3262,0.6119,0.3238,0.6262,0.3238,0.6405,0.3238,0.6438],"r":0.0795},{"pts":[0.4167,0.3652,0.4167,0.3548,0.4167,0.3429,0.4167,0.3348],"r":0.1619},{"pts":[0.611,0.4324,0.6262,0.4476,0.6429,0.4624,0.659,0.4643,0.6605,0.4643],"r":0.0261},{"pts":[0.0824,0.44,0.0952,0.4357,0.1095,0.4324,0.1238,0.4295,0.1381,0.4257,0.1524,0.4219,0.1667,0.4176,0.181,0.4129,0.1952,0.4067,0.2095,0.4005,0.2238,0.3938,0.2381,0.3886,0.2524,0.3857,0.2667,0.3857,0.281,0.3857,0.2952,0.3857,0.3095,0.3833,0.3238,0.3738,0.3381,0.3595,0.3524,0.3462,0.3667,0.3386,0.3724,0.3348],"r":0.0809},{"pts":[0.9343,0.6829,0.9214,0.6776,0.9086,0.6881,0.8967,0.7024,0.8857,0.7138,0.8724,0.7262,0.8638,0.74,0.85,0.75,0.8357,0.7624,0.8214,0.7714,0.8071,0.781,0.7929,0.7871,0.7786,0.7919,0.7643,0.7967,0.75,0.8014,0.7357,0.8024,0.7214,0.8038,0.7071,0.8048,0.6929,0.8048,0.68,0.8048],"r":0.0207},{"pts":[0.4205,0.3705,0.4333,0.3833,0.4476,0.3976,0.4619,0.4119,0.4762,0.4262,0.4905,0.4367,0.5048,0.4414,0.519,0.4476,0.5333,0.4529,0.5476,0.4619,0.551,0.4652],"r":0.1136},{"pts":[0.3776,0.331,0.3905,0.331,0.4048,0.331,0.419,0.331,0.4333,0.319,0.4476,0.3048,0.4619,0.2905,0.4762,0.2762,0.4905,0.2619,0.5048,0.251,0.519,0.2433,0.5333,0.231,0.5476,0.2167,0.5619,0.2024,0.5762,0.1881,0.5905,0.1757,0.601,0.1657],"r":0.0941},{"pts":[0.5343,1.2071,0.5214,1.2071,0.5071,1.2071,0.4929,1.2067,0.481,1.1952,0.4676,1.181,0.4548,1.17,0.441,1.1614,0.4381,1.149],"r":0.078},{"pts":[0.489,1.2086,0.4786,1.2214,0.4643,1.2357,0.45,1.25,0.4357,1.2624,0.4214,1.2667,0.4071,1.2657,0.3929,1.2643,0.3786,1.2633,0.3643,1.2595,0.35,1.2576,0.3357,1.2538,0.3214,1.2476,0.3071,1.2405,0.2929,1.2305,0.2871,1.2305],"r":0.0307},{"pts":[0.5381,1.211,0.5381,1.219,0.5381,1.2286,0.5381,1.2367],"r":0.0983},{"pts":[0.5381,0.6105,0.54,0.5976,0.5429,0.5833,0.5452,0.569,0.5452,0.5548,0.5457,0.5405,0.549,0.5262,0.55,0.5119,0.55,0.4976,0.55,0.4833,0.5529,0.469,0.5643,0.4586,0.57,0.4571],"r":0.085},{"pts":[0.5752,0.461,0.5881,0.4738,0.6024,0.4881,0.6167,0.5024,0.631,0.5119,0.6452,0.5105,0.6557,0.5095],"r":0.0378},{"pts":[0.7914,0.9667,0.7786,0.9648,0.7662,0.9762,0.76,0.9905,0.7533,1.0048,0.75,1.019,0.7486,1.0333,0.7424,1.0476,0.739,1.0619,0.7343,1.0762,0.729,1.0905,0.7238,1.1048,0.7214,1.119,0.7171,1.1333,0.7095,1.1467,0.7048,1.1557],"r":0.0255},{"pts":[0.3848,1.0943,0.3938,1.0833,0.3986,1.069,0.4024,1.0548,0.4024,1.0405,0.4024,1.0262,0.4057,1.0119,0.4052,0.9976,0.4048,0.9895],"r":0.025},{"pts":[0.5514,0.8381,0.5643,0.8367,0.5786,0.8333,0.5929,0.8333,0.6071,0.8314,0.6214,0.8276,0.6357,0.8229,0.65,0.8162,0.6643,0.8076,0.6724,0.8052],"r":0.0217},{"pts":[0.48,0.8205,0.4929,0.8195,0.5071,0.8214,0.5214,0.8181,0.5357,0.8052,0.539,0.8029],"r":0.0179},{"pts":[0.5429,0.7986,0.5429,0.7857,0.5429,0.7714,0.5419,0.7571,0.5405,0.7429,0.5405,0.7286,0.539,0.7143,0.5381,0.7,0.5381,0.6857,0.5405,0.6714,0.5381,0.6571,0.5381,0.6429,0.5386,0.63],"r":0.0572},{"pts":[0.6057,0.429,0.5952,0.4343,0.5833,0.4452,0.5752,0.4533],"r":0.0627},{"pts":[0.6762,0.801,0.6762,0.7881,0.6762,0.7738,0.6767,0.7595,0.68,0.7452,0.6833,0.731,0.6871,0.7167,0.6881,0.7024,0.6919,0.6881,0.6981,0.6743,0.7119,0.6657,0.7195,0.6524,0.7224,0.6381,0.7262,0.6238,0.729,0.6095,0.7338,0.5952,0.7376,0.581,0.7433,0.5667,0.7486,0.5524,0.7529,0.5381,0.759,0.5238,0.7619,0.5095,0.7671,0.4952,0.7733,0.481,0.7762,0.4667,0.7814,0.4524,0.79,0.4386,0.7914,0.4371],"r":0.0218},{"pts":[0.5343,0.6267,0.5214,0.6381,0.5071,0.6524,0.4929,0.6657,0.4786,0.6686,0.4643,0.6629,0.461,0.6619],"r":0.0333},{"pts":[0.5433,0.8062,0.5457,0.8143,0.5476,0.8238,0.5476,0.8329,0.5476,0.8343],"r":0.0401},{"pts":[0.3738,0.3271,0.3643,0.3143,0.35,0.3,0.3357,0.2857,0.3219,0.2714,0.3167,0.2571,0.3138,0.2429,0.3095,0.2286,0.3043,0.2143,0.2943,0.2,0.281,0.1857,0.2667,0.1714,0.2567,0.1571,0.2481,0.1429,0.241,0.1286,0.2357,0.1143,0.2333,0.1062],"r":0.0767},{"pts":[0.57,1.2476,0.5619,1.2462,0.5524,1.2429,0.5433,1.2405,0.5419,1.2405],"r":0.099},{"pts":[0.5476,0.8419,0.549,0.8548,0.5524,0.869,0.55,0.8833,0.55,0.8976,0.551,0.9119,0.5524,0.9262,0.5524,0.9405,0.5524,0.9548,0.5543,0.969,0.5548,0.9833,0.5548,0.9976,0.5548,1.0119,0.5548,1.0262,0.5552,1.0405,0.5586,1.0548,0.5614,1.069,0.5629,1.0833,0.5662,1.0976,0.5667,1.1119,0.5686,1.1262,0.5724,1.1405,0.5738,1.1548,0.5719,1.169,0.5638,1.1833,0.55,1.1976,0.5395,1.2062],"r":0.038},{"pts":[0.4476,1.3343,0.4571,1.3214,0.469,1.3071,0.4833,1.2929,0.4976,1.2786,0.5119,1.2643,0.5262,1.25,0.5343,1.2419],"r":0.0433},{"pts":[0.7033,1.149,0.6905,1.1405,0.679,1.1262,0.6767,1.1124,0.6762,1.111],"r":0.0207},{"pts":[0.5738,1.2514,0.5738,1.2643,0.5786,1.2786,0.5843,1.2929,0.5881,1.3071,0.5919,1.3214,0.5952,1.3357,0.5971,1.35,0.5962,1.3643,0.5952,1.3786,0.5952,1.3929,0.5948,1.4071,0.5929,1.4214,0.5929,1.4357,0.5929,1.45,0.5905,1.4643,0.5905,1.4786,0.5895,1.4929,0.581,1.5057,0.5667,1.5186,0.5538,1.5257],"r":0.0479},{"pts":[0.3795,1.0943,0.3667,1.0905,0.3524,1.0881,0.3386,1.081,0.3262,1.0695,0.3119,1.0595,0.2976,1.0462,0.2833,1.0386,0.2748,1.0262,0.2643,1.0133,0.2524,1.0,0.2395,0.9857,0.2262,0.9805,0.2119,0.9762,0.1976,0.9667,0.1833,0.9576,0.1705,0.9452,0.1586,0.931,0.1457,0.9186,0.1357,0.9048,0.1224,0.8905,0.1152,0.8762,0.1048,0.8648,0.0914,0.8548,0.081,0.8452,0.0752,0.8452],"r":0.0282},{"pts":[0.4771,1.0824,0.4738,1.0976,0.4686,1.1143,0.4548,1.131,0.4395,1.1443],"r":0.0303},{"pts":[0.4129,1.1443,0.4,1.1595,0.3833,1.1762,0.3705,1.1871],"r":0.0281},{"pts":[0.4514,0.6014,0.4643,0.6071,0.4786,0.6119,0.4929,0.6143,0.5071,0.6143,0.5214,0.6143,0.5343,0.6143],"r":0.0338},{"pts":[0.5752,1.2467,0.5881,1.2381,0.6024,1.2252,0.6167,1.2119,0.631,1.2019,0.6452,1.1938,0.6595,1.1895,0.6738,1.1871,0.6867,1.1805,0.6971,1.1667,0.7014,1.161],"r":0.0431}],"j":[0.5357,0.6262,0.7048,1.1595,0.6095,0.4286,0.55,0.8381,0.5429,0.8,0.4143,0.369,0.6762,0.8024,0.4143,1.1429,0.4167,0.3333,0.3738,0.331,0.381,1.0952,0.5357,1.2071,0.4905,1.2071,0.5714,0.4571,0.5738,1.25],"t":[0.6571,0.5095,0.4048,0.9881,0.8714,1.0024,0.6619,0.4643,0.6762,1.1095,0.4786,1.081,0.6524,0.3929,0.369,1.1881,0.6024,0.1643,0.2857,1.231,0.7929,0.9667,0.081,0.4405,0.4595,0.6619,0.45,0.6,0.5524,1.5262,0.2333,0.1048,0.3238,0.6452,0.4786,0.8214,0.4476,1.3357,0.0738,0.8452,0.7929,0.4357,0.9357,0.6833]},"N-10":{"s":[{"pts":[0.5633,0.6095,0.5738,0.6095,0.5857,0.6095,0.5938,0.6095],"r":0.1531},{"pts":[0.2333,0.489,0.2357,0.4762,0.239,0.4619,0.2405,0.4476,0.2424,0.4333,0.2481,0.4195,0.2614,0.4143,0.2629,0.4143],"r":0.1264},{"pts":[0.2624,0.33,0.2662,0.3429,0.269,0.3571,0.271,0.3714,0.269,0.3857,0.2681,0.4,0.2667,0.4105],"r":0.1218},{"pts":[0.6371,0.8105,0.6295,0.7976,0.6286,0.7833,0.6286,0.769,0.6286,0.7548,0.6286,0.7405,0.6286,0.7262,0.6286,0.7119,0.6262,0.6976,0.6214,0.6833,0.6157,0.669,0.6129,0.6548,0.6086,0.6405,0.6038,0.6262,0.5981,0.6133],"r":0.1322},{"pts":[0.5181,0.9438,0.531,0.9462,0.5452,0.9443,0.5595,0.9395,0.5738,0.9338,0.5881,0.9333,0.601,0.9262,0.6062,0.9119,0.6071,0.8976,0.6071,0.8833,0.6105,0.869,0.6152,0.8548,0.6186,0.8405,0.6262,0.8262,0.6386,0.8133,0.6524,0.8119,0.6667,0.8119,0.681,0.8105,0.6952,0.8052,0.7095,0.8052,0.7238,0.8105,0.7381,0.8143,0.7524,0.8143,0.7667,0.8157,0.7805,0.8181,0.7819,0.8186],"r":0.1203},{"pts":[0.7538,0.5143,0.7667,0.5143,0.781,0.5129,0.7952,0.5067,0.8095,0.4929,0.8238,0.479,0.8295,0.4748],"r":0.0916},{"pts":[0.7486,0.5176,0.7357,0.5219,0.7214,0.531,0.7081,0.5452,0.6952,0.5533,0.681,0.5548,0.6667,0.5571,0.6524,0.5581,0.6381,0.5667,0.6238,0.581,0.6095,0.5952,0.599,0.6057],"r":0.1243},{"pts":[0.4371,0.4271,0.45,0.4143,0.4638,0.4,0.4719,0.3857,0.4805,0.3714,0.4848,0.3571,0.4971,0.3429,0.5052,0.3286,0.5076,0.3143,0.5133,0.3,0.52,0.2857,0.5333,0.2714,0.5471,0.2571,0.5543,0.2429,0.5548,0.2286,0.5548,0.2143,0.5548,0.2005,0.5548,0.199],"r":0.0655},{"pts":[0.4371,0.4348,0.45,0.4438,0.4624,0.4524,0.4662,0.4667,0.4705,0.481,0.4743,0.4952,0.4867,0.5071,0.4933,0.5214,0.499,0.5357,0.5052,0.55,0.519,0.5643,0.5333,0.5786,0.5476,0.5929,0.5586,0.6057],"r":0.1107},{"pts":[0.5586,0.611,0.5476,0.6238,0.5333,0.6381,0.519,0.6524,0.5048,0.6667,0.4905,0.681,0.4762,0.691,0.4619,0.6886,0.4476,0.6881,0.4333,0.6881,0.419,0.6881,0.4048,0.6924,0.3905,0.6995,0.3762,0.7067,0.3643,0.719,0.3567,0.7324,0.3467,0.7357],"r":0.0741},{"pts":[0.7514,0.461,0.75,0.4762,0.75,0.4929,0.75,0.509,0.75,0.5105],"r":0.1093},{"pts":[0.6319,0.2095,0.619,0.2086,0.6048,0.2,0.5905,0.19,0.5762,0.1881,0.5619,0.1924,0.5562,0.1967],"r":0.057},{"pts":[0.5533,0.1967,0.5405,0.19,0.5262,0.1886,0.5119,0.1924,0.4976,0.2,0.4833,0.2024,0.469,0.2,0.4548,0.2014,0.4467,0.2024],"r":0.0654},{"pts":[0.4319,0.431,0.419,0.431,0.4048,0.431,0.3905,0.431,0.3762,0.431,0.3619,0.431,0.3476,0.431,0.3333,0.431,0.319,0.431,0.3048,0.431,0.2905,0.4295,0.2762,0.4224,0.2681,0.4157],"r":0.1147}],"j":[0.5619,0.6095,0.4357,0.431,0.75,0.5119,0.2643,0.4143,0.5976,0.6119,0.5548,0.1976,0.6381,0.8119],"t":[0.2619,0.3286,0.4452,0.2024,0.3452,0.7357,0.6333,0.2095,0.7833,0.819,0.2333,0.4905,0.5167,0.9429,0.7524,0.4595,0.831,0.4738]},"N-13":{"s":[{"pts":[0.6452,1.3819,0.6505,1.369,0.6624,1.3548,0.6757,1.3405,0.6857,1.3262,0.7,1.3143,0.709,1.3024,0.7143,1.2881,0.719,1.2738,0.7295,1.2671],"r":0.0456},{"pts":[0.31,0.3557,0.3143,0.35,0.321,0.3429,0.3262,0.3362,0.3271,0.3348],"r":0.0847},{"pts":[0.8024,1.0548,0.8024,1.0476,0.8024,1.0405,0.8,1.0333],"r":0.0778},{"pts":[0.2119,0.8048,0.219,0.8095,0.2262,0.8119,0.231,0.8143],"r":0.0765},{"pts":[0.8557,0.7471,0.8429,0.741,0.8286,0.7343,0.8143,0.7338,0.8,0.741,0.7857,0.7381,0.7752,0.7381],"r":0.0297},{"pts":[0.4124,0.9657,0.4143,0.9786,0.4162,0.9929,0.419,1.0071,0.4229,1.0214,0.4238,1.0357,0.4257,1.05,0.4305,1.0605],"r":0.0404},{"pts":[0.3129,0.8186,0.2976,0.8129,0.281,0.8048,0.2643,0.8,0.2476,0.8005,0.2348,0.8105],"r":0.0322},{"pts":[0.099,0.4152,0.1119,0.4186,0.1262,0.4267,0.1405,0.4405,0.1548,0.4548,0.1686,0.469,0.1729,0.4748],"r":0.0286},{"pts":[0.2443,0.9348,0.2552,0.9452,0.2595,0.9595,0.261,0.9738,0.2629,0.9881,0.2667,1.0024,0.2757,1.0167,0.2762,1.031,0.2762,1.0452,0.2762,1.0486],"r":0.0646},{"pts":[0.8143,0.9405,0.819,0.9357,0.8238,0.931,0.8286,0.9262,0.831,0.9262],"r":0.0723},{"pts":[0.92,0.8524,0.9071,0.8548,0.8929,0.8581,0.879,0.869,0.8719,0.8833,0.8595,0.8976,0.8452,0.9119,0.8348,0.9224],"r":0.0266},{"pts":[0.7929,1.1057,0.7929,1.0905,0.7929,1.0738,0.7986,1.0586],"r":0.0724},{"pts":[0.7467,0.761,0.7595,0.7738,0.7738,0.7881,0.7881,0.8024,0.7986,0.809],"r":0.0328},{"pts":[0.7962,1.0314,0.7833,1.0429,0.769,1.0571,0.7548,1.0681,0.7405,1.079,0.7262,1.0852,0.7119,1.0924,0.6976,1.1043,0.6919,1.1086],"r":0.0369},{"pts":[0.4381,0.8024,0.4333,0.8024,0.4286,0.8048,0.4262,0.8048],"r":0.0545},{"pts":[0.1181,0.8924,0.131,0.8848,0.1424,0.8714,0.1548,0.8571,0.169,0.8429,0.1833,0.8305,0.1976,0.8167,0.2081,0.8062],"r":0.0336},{"pts":[0.75,0.6914,0.75,0.6786,0.75,0.6643,0.7529,0.65,0.7562,0.6357,0.7605,0.6252],"r":0.0202},{"pts":[0.3438,0.559,0.331,0.5524,0.3167,0.5433,0.3024,0.5362,0.2881,0.5295,0.2738,0.5214,0.2595,0.5071,0.249,0.4967],"r":0.031},{"pts":[0.6038,0.94,0.6167,0.9329,0.631,0.9233,0.6452,0.9167,0.6595,0.9119,0.6738,0.9,0.6857,0.8886,0.7,0.8876,0.7143,0.8833,0.72,0.88],"r":0.0371},{"pts":[0.47,0.3419,0.4571,0.3381,0.4429,0.3367,0.43,0.3319],"r":0.0552},{"pts":[0.4905,0.4367,0.4862,0.4238,0.4805,0.4095,0.4752,0.3952,0.4714,0.381,0.4714,0.3667,0.4714,0.3524,0.4762,0.3395,0.4905,0.3262,0.5048,0.3119,0.519,0.301,0.5333,0.2924,0.5414,0.2871],"r":0.0473},{"pts":[0.4405,0.7986,0.4443,0.7857,0.4471,0.7714,0.4476,0.7571,0.4476,0.7429,0.4476,0.7286,0.4476,0.7143,0.4476,0.7062],"r":0.0496},{"pts":[0.8438,1.1567,0.8286,1.1429,0.8119,1.1262,0.7967,1.111],"r":0.0393},{"pts":[0.2086,0.6867,0.2071,0.6738,0.2024,0.661,0.1881,0.6476,0.1738,0.6333,0.1595,0.619,0.1452,0.6052,0.131,0.5986,0.1167,0.5976,0.1024,0.5981,0.0881,0.6014,0.0848,0.6024],"r":0.0383},{"pts":[0.2086,0.6633,0.2214,0.6524,0.2314,0.6381,0.2352,0.6238,0.2381,0.6095,0.2381,0.5952,0.2381,0.581,0.241,0.5671,0.2419,0.5657],"r":0.0547},{"pts":[0.311,0.361,0.3238,0.3738,0.3381,0.3881,0.3519,0.4019,0.3533,0.4033],"r":0.0501},{"pts":[0.7338,1.2629,0.7452,1.2505,0.7557,1.2381,0.76,1.2238,0.7619,1.2095,0.7662,1.1952,0.7729,1.181,0.7781,1.1667,0.7819,1.1524,0.7852,1.1381,0.7876,1.1238,0.7895,1.1133],"r":0.0597},{"pts":[0.8462,1.0924,0.8333,1.0838,0.819,1.0738,0.8052,1.06,0.8038,1.0586],"r":0.063},{"pts":[0.2367,0.5062,0.2238,0.519,0.2095,0.5333,0.1952,0.5476,0.1824,0.5605],"r":0.0347},{"pts":[0.1681,1.0057,0.181,0.9929,0.1952,0.9786,0.2095,0.9643,0.2238,0.95,0.2362,0.9362,0.2371,0.9348],"r":0.036},{"pts":[0.6752,0.6824,0.6643,0.6948,0.65,0.7014,0.6357,0.7086,0.6214,0.7195,0.6071,0.729,0.6038,0.7305],"r":0.0137},{"pts":[0.3476,0.9057,0.3548,0.8929,0.369,0.8838,0.3833,0.8767,0.3976,0.8738,0.4105,0.8776],"r":0.0285},{"pts":[0.2105,0.699,0.2119,0.7119,0.2119,0.7262,0.2119,0.7405,0.2119,0.7548,0.2119,0.769,0.2119,0.7833,0.2119,0.7976,0.2119,0.801],"r":0.0768},{"pts":[0.49,0.8605,0.4829,0.8476,0.4714,0.8333,0.4571,0.819,0.4433,0.8052,0.4419,0.8038],"r":0.0259},{"pts":[0.3133,0.6152,0.3024,0.6043,0.2881,0.5971,0.2738,0.59,0.2595,0.5762,0.249,0.5657],"r":0.0283},{"pts":[0.4752,0.6657,0.4881,0.6786,0.5024,0.6929,0.5157,0.7071,0.5243,0.7214,0.5367,0.7343],"r":0.0285},{"pts":[0.3538,0.8129,0.3667,0.8019,0.381,0.7948,0.3952,0.789,0.4095,0.7895,0.4224,0.801],"r":0.0258},{"pts":[0.7562,0.9276,0.7452,0.9405,0.731,0.9548,0.7167,0.969,0.7024,0.9805,0.6881,0.9876,0.6738,0.9957,0.6657,0.9995],"r":0.0316},{"pts":[0.8348,0.93,0.8476,0.9371,0.8619,0.9419,0.8762,0.9476,0.8905,0.9519,0.9048,0.9543,0.919,0.9548,0.9333,0.9567,0.9438,0.9614],"r":0.0409},{"pts":[0.5667,0.6319,0.5652,0.6167,0.55,0.6,0.5333,0.5833,0.5205,0.5705],"r":0.0401},{"pts":[0.6181,0.8119,0.631,0.8095,0.6452,0.8071,0.6595,0.8033,0.6738,0.8024,0.6881,0.8095,0.7024,0.8238,0.7167,0.8371,0.72,0.8395],"r":0.0256},{"pts":[0.47,0.6367,0.4571,0.6238,0.4429,0.6143,0.4286,0.6171,0.4143,0.6233,0.4,0.6319,0.3943,0.6367],"r":0.0304},{"pts":[0.5033,0.4443,0.5081,0.4571,0.5114,0.4714,0.5119,0.4857,0.5119,0.5,0.5162,0.5143,0.5214,0.5286,0.5233,0.5429,0.5195,0.5571,0.519,0.5652],"r":0.0719},{"pts":[0.2776,1.0538,0.2843,1.0667,0.2886,1.081,0.2981,1.0952,0.3057,1.1095,0.3095,1.1238,0.3129,1.1381,0.32,1.1524,0.3243,1.1667,0.3286,1.181,0.3329,1.1952,0.3352,1.2095,0.3433,1.2238,0.3486,1.2381,0.35,1.2524,0.35,1.2667,0.3524,1.281,0.3562,1.2952,0.3571,1.3095,0.3571,1.3238,0.3552,1.3381,0.3524,1.3524,0.3514,1.3667,0.3476,1.381,0.3443,1.3952,0.3443,1.4095,0.3486,1.4152],"r":0.0493},{"pts":[0.7429,0.7557,0.7433,0.7405,0.7429,0.7238,0.7429,0.711],"r":0.0651},{"pts":[0.2252,1.0986,0.2405,1.0857,0.2571,1.069,0.2724,1.0538],"r":0.029},{"pts":[0.6033,0.4167,0.5905,0.4167,0.5762,0.4157,0.5619,0.409,0.5476,0.4048,0.5333,0.4076,0.519,0.4214,0.5052,0.4352,0.5038,0.4367],"r":0.0374},{"pts":[0.4152,0.8771,0.419,0.8643,0.4214,0.85,0.4214,0.8357,0.4214,0.8214,0.4229,0.8086],"r":0.0452},{"pts":[0.6824,0.681,0.6952,0.6886,0.7095,0.6957,0.7238,0.7024,0.7376,0.7067,0.739,0.7071],"r":0.0466},{"pts":[0.8105,0.9429,0.7952,0.9357,0.7786,0.9286,0.7624,0.9262,0.761,0.9262],"r":0.0854},{"pts":[0.5467,0.5443,0.5595,0.5571,0.5738,0.5695,0.5881,0.5748,0.6024,0.5762,0.6162,0.5762,0.6176,0.5762],"r":0.0502},{"pts":[0.7348,1.2681,0.7476,1.281,0.7619,1.2952,0.7738,1.3095,0.7762,1.32],"r":0.028},{"pts":[0.3681,0.959,0.381,0.9548,0.3952,0.9571,0.4081,0.9619],"r":0.0352},{"pts":[0.8914,1.0095,0.8786,1.0057,0.8643,0.9952,0.85,0.981,0.8357,0.9667,0.8214,0.9524,0.8157,0.9467],"r":0.0425},{"pts":[0.2086,0.3414,0.2214,0.3462,0.2357,0.3571,0.25,0.3714,0.2595,0.3833,0.2595,0.3976,0.2595,0.4119,0.2562,0.4262,0.251,0.4405,0.2462,0.4548,0.2429,0.4686,0.2429,0.47],"r":0.0533},{"pts":[0.3719,0.7343,0.381,0.7214,0.3952,0.7124,0.4095,0.7052,0.4238,0.6986,0.4381,0.6986,0.4438,0.7014],"r":0.026},{"pts":[0.6014,0.8686,0.6143,0.8652,0.6286,0.8614,0.6429,0.8595,0.6571,0.861,0.6714,0.8738,0.6824,0.8867],"r":0.0236},{"pts":[0.1776,0.4786,0.1929,0.4786,0.2095,0.4786,0.2262,0.4757,0.239,0.4738],"r":0.0717},{"pts":[0.6919,1.1748,0.7048,1.1648,0.719,1.1595,0.7333,1.1571,0.7476,1.1667,0.7619,1.1805,0.7676,1.1848],"r":0.0278},{"pts":[0.8,1.0271,0.8,1.0143,0.8,1.0,0.8,0.9857,0.8,0.9714,0.8,0.9571,0.8014,0.9443],"r":0.0827},{"pts":[0.4143,0.8929,0.4143,0.8881,0.4143,0.8833,0.4143,0.881],"r":0.0517},{"pts":[0.4738,0.6405,0.4738,0.6476,0.4738,0.6548,0.4738,0.6619],"r":0.0598},{"pts":[0.7252,0.88,0.7405,0.8943,0.7529,0.9095,0.7571,0.9224],"r":0.08},{"pts":[0.331,0.3271,0.331,0.3119,0.331,0.2952,0.331,0.2824],"r":0.0778},{"pts":[0.7538,0.6948,0.7667,0.6857,0.7805,0.6714,0.7905,0.6571,0.8048,0.6471,0.819,0.6395,0.8319,0.6314],"r":0.0203},{"pts":[0.2057,0.6957,0.1929,0.7019,0.1786,0.7143,0.1643,0.7286,0.15,0.7429,0.1357,0.751,0.1214,0.7557,0.1071,0.7629,0.1038,0.7652],"r":0.0371},{"pts":[0.4676,0.2562,0.4581,0.269,0.4533,0.2833,0.4486,0.2976,0.4419,0.3119,0.43,0.3257,0.429,0.3271],"r":0.0333},{"pts":[0.4181,0.8957,0.431,0.9019,0.4452,0.9143,0.4595,0.9243,0.4705,0.9352,0.471,0.9367],"r":0.0252},{"pts":[0.6776,0.6771,0.6738,0.6643,0.67,0.65,0.6643,0.6357,0.6524,0.6214,0.639,0.6071,0.6319,0.5929,0.6229,0.58],"r":0.03},{"pts":[0.3848,0.5343,0.3976,0.5214,0.4119,0.5071,0.4262,0.4929,0.4405,0.479,0.4548,0.4695,0.469,0.4614,0.4833,0.4476,0.489,0.4419],"r":0.0392},{"pts":[0.3057,0.36,0.2905,0.3671,0.2738,0.3748,0.261,0.3776],"r":0.0686},{"pts":[0.2452,0.4929,0.2452,0.4881,0.2452,0.4833,0.2429,0.4786,0.2429,0.4762],"r":0.0674},{"pts":[0.3176,0.7062,0.3048,0.6986,0.2905,0.6914,0.2762,0.6881,0.2619,0.6881,0.2476,0.6881,0.2333,0.6881,0.219,0.6881,0.2133,0.6881],"r":0.0373},{"pts":[0.7238,0.8748,0.7238,0.8643,0.7238,0.8524,0.7238,0.8443],"r":0.0688},{"pts":[0.351,1.0224,0.3381,1.0138,0.3238,1.0067,0.3095,1.0,0.2952,1.0005,0.281,1.011,0.2776,1.0133],"r":0.029},{"pts":[0.5152,0.5705,0.5029,0.5833,0.4967,0.5976,0.49,0.6119,0.4829,0.6262,0.4771,0.6367],"r":0.0671},{"pts":[0.7676,0.7381,0.7619,0.7371,0.7548,0.7357,0.7481,0.7357,0.7467,0.7357],"r":0.0715},{"pts":[0.3324,0.2776,0.3395,0.2667,0.3443,0.2529,0.3571,0.2405,0.3714,0.2262,0.3857,0.2162,0.4,0.2048,0.4138,0.191,0.4152,0.1895],"r":0.0376},{"pts":[0.5467,0.5367,0.5595,0.5238,0.5738,0.5095,0.5881,0.5,0.6024,0.5024,0.6167,0.5067,0.631,0.5086,0.6452,0.5071,0.6595,0.5033,0.6738,0.5019,0.6843,0.5],"r":0.028},{"pts":[0.8157,0.7914,0.8024,0.7762,0.7857,0.7595,0.7719,0.7433,0.7714,0.7419],"r":0.0319},{"pts":[0.449,0.701,0.4538,0.6905,0.4576,0.6786,0.4686,0.6671,0.47,0.6657],"r":0.0541},{"pts":[0.0776,0.5233,0.0905,0.5171,0.1048,0.5143,0.119,0.5133,0.1333,0.5043,0.1476,0.4971,0.1619,0.491,0.1729,0.48],"r":0.0382},{"pts":[0.2443,0.2248,0.2571,0.231,0.2714,0.2352,0.2857,0.24,0.3,0.2524,0.3143,0.2667,0.3271,0.2776],"r":0.0337},{"pts":[0.2333,0.8181,0.2333,0.831,0.2333,0.8452,0.2333,0.8595,0.2333,0.8738,0.2333,0.8881,0.2348,0.9024,0.2362,0.9167,0.24,0.9295],"r":0.0664},{"pts":[0.4133,0.8967,0.4119,0.9119,0.4119,0.9286,0.4119,0.9452,0.4119,0.9581],"r":0.0469},{"pts":[0.7033,0.5686,0.6905,0.5633,0.6762,0.5581,0.6619,0.5552,0.6476,0.5567,0.6333,0.5643,0.6229,0.5748],"r":0.0181},{"pts":[0.2414,0.5062,0.2452,0.519,0.2452,0.5333,0.2452,0.5476,0.2452,0.5605],"r":0.0637},{"pts":[0.3414,0.251,0.3286,0.2381,0.3171,0.2238,0.3129,0.2095,0.3105,0.1952,0.3071,0.181,0.3057,0.1667,0.3048,0.1633],"r":0.0307},{"pts":[0.5262,0.5381,0.531,0.5381,0.5357,0.5381,0.5405,0.5381,0.5429,0.5405],"r":0.0788},{"pts":[0.3348,0.331,0.3476,0.331,0.3619,0.331,0.3762,0.331,0.3905,0.331,0.4048,0.331,0.419,0.331,0.4248,0.331],"r":0.0667},{"pts":[0.7252,0.8395,0.7338,0.8286,0.7357,0.8143,0.7357,0.8,0.7357,0.7857,0.7357,0.7714,0.7395,0.761],"r":0.0523}],"j":[0.7929,1.1071,0.4381,0.8024,0.8,1.0333,0.2595,0.3786,0.5167,0.569,0.7571,0.9238,0.2095,0.8048,0.2381,0.9333,0.4738,0.6619,0.3286,0.2786,0.4119,0.8786,0.769,1.1857,0.1738,0.4786,0.7405,0.7071,0.2095,0.6952,0.2381,0.5048,0.681,0.681,0.2738,1.0524,0.4905,0.4381,0.3071,0.3595,0.8024,0.9429,0.4119,0.9595,0.7333,1.2667,0.7238,0.8762,0.6833,0.8881,0.7714,0.7381,0.2762,1.0143,0.4262,0.331,0.7429,0.7595,0.4452,0.7024,0.2429,0.5643,0.6214,0.5786,0.3286,0.331,0.5429,0.5405,0.7238,0.8405,0.8333,0.9238,0.4714,0.3429],"t":[0.0976,0.4143,0.9214,0.8524,0.181,0.5619,0.6857,0.5,0.5429,0.2857,0.319,0.7071,0.3048,0.1619,0.35,1.4167,0.2429,0.2238,0.431,1.0619,0.8571,0.7476,0.2071,0.3405,0.3714,0.7357,0.8333,0.631,0.0762,0.5238,0.6452,1.3833,0.1667,1.0071,0.469,0.2548,0.0833,0.6024,0.2238,1.1,0.8167,0.7929,0.8,0.8095,0.4905,0.8619,0.3524,0.8143,0.5667,0.6333,0.6,0.869,0.3929,0.6381,0.8452,1.1571,0.3667,0.9595,0.3833,0.5357,0.1167,0.8929,0.7619,0.6238,0.6024,0.9405,0.6167,0.8119,0.6905,1.1095,0.3524,1.0238,0.5381,0.7357,0.3452,0.5595,0.6024,0.731,0.6643,1.0,0.3476,0.9071,0.4167,0.1881,0.3548,0.4048,0.3143,0.6167,0.6048,0.4167,0.7762,1.3214,0.3143,0.819,0.8476,1.0929,0.9452,0.9619,0.8929,1.0095,0.6905,1.1762,0.4714,0.9381,0.7048,0.569,0.1024,0.7667]}};
// N-04(원숭이꼬리 선인장)는 줄기 하나하나를 생장점에서 끝까지 따라간 관(x, y, 반지름) — 털 가시까지 그림
const COMPANION_TAILS = { "N-04": [[0.5765,0.2449,0.0072,0.5705,0.2498,0.024,0.5621,0.2571,0.024,0.5548,0.2654,0.024,0.5484,0.2738,0.024,0.5421,0.2833,0.024,0.5357,0.2929,0.024,0.5295,0.3024,0.024,0.5254,0.3119,0.024,0.5238,0.3214,0.024,0.5238,0.331,0.024,0.5238,0.3405,0.024,0.523,0.35,0.024,0.5203,0.3595,0.024,0.516,0.3689,0.024,0.5094,0.3762,0.024,0.5014,0.3816,0.024,0.4929,0.3851,0.024,0.4833,0.3881,0.024,0.4738,0.3935,0.024,0.4643,0.4005,0.024,0.4548,0.4095,0.024,0.4452,0.419,0.024,0.4357,0.4286,0.024,0.4262,0.4381,0.024,0.4167,0.4476,0.024,0.4071,0.4571,0.024,0.3976,0.4667,0.024,0.3883,0.4762,0.024,0.3805,0.4857,0.024,0.3741,0.4952,0.024,0.3689,0.5048,0.024,0.3656,0.5143,0.024,0.3632,0.5238,0.024,0.3617,0.5333,0.024,0.3611,0.5429,0.024,0.3605,0.5524,0.024,0.3598,0.5619,0.024,0.3595,0.5714,0.024,0.3595,0.581,0.024,0.3595,0.5905,0.024,0.3589,0.6,0.024,0.3583,0.6095,0.024,0.3576,0.619,0.0239,0.3571,0.6286,0.0236,0.3568,0.6381,0.0234,0.3576,0.6471,0.0232,0.3595,0.656,0.023,0.3621,0.6649,0.0227,0.3649,0.6738,0.0225,0.3662,0.6833,0.0223,0.3667,0.6929,0.0221,0.3671,0.7024,0.0218,0.3678,0.7119,0.0216,0.3684,0.7214,0.0214,0.3697,0.731,0.0212,0.3706,0.7405,0.0209,0.3719,0.75,0.0207,0.373,0.7595,0.0205,0.3737,0.769,0.0203,0.3741,0.7786,0.02,0.3748,0.7881,0.0198,0.3754,0.7976,0.0196,0.376,0.8071,0.0193,0.3762,0.8167,0.0191,0.3762,0.8262,0.0189,0.3765,0.8357,0.0187,0.3771,0.8452,0.0184,0.3779,0.8548,0.0182,0.3792,0.8643,0.018,0.38,0.8738,0.0178,0.3806,0.8833,0.0175,0.381,0.8929,0.0173,0.3808,0.9024,0.0171,0.3802,0.9119,0.0169,0.3792,0.9214,0.0166,0.3779,0.931,0.0164,0.3768,0.9405,0.0162,0.3756,0.95,0.016,0.3744,0.9595,0.0157,0.3732,0.969,0.0155,0.3722,0.9786,0.0153,0.3716,0.9881,0.015,0.3714,0.9976,0.0148,0.3711,1.0071,0.0146,0.3705,1.0167,0.0144,0.3698,1.0262,0.0141,0.3681,1.0357,0.0139,0.366,1.0452,0.0137,0.3641,1.0548,0.0135,0.3621,1.0643,0.0132,0.3608,1.0738,0.013,0.3595,1.0833,0.0128,0.3581,1.0929,0.0126,0.3567,1.1024,0.0123,0.3557,1.1119,0.0121,0.3548,1.1214,0.0119,0.3538,1.131,0.0117,0.353,1.1405,0.0114,0.3517,1.15,0.0112,0.3502,1.1595,0.011,0.3468,1.1686,0.0107,0.344,1.1775,0.0105,0.3421,1.1863,0.0103,0.3413,1.1952,0.0101,0.3422,1.2048,0.0098,0.3429,1.2143,0.0096,0.3429,1.2238,0.0094,0.3424,1.2333,0.0092,0.3417,1.2429,0.0089,0.3411,1.2524,0.0087,0.3405,1.2619,0.0085,0.3405,1.2714,0.0083,0.34,1.281,0.008,0.3394,1.2905,0.0078,0.3387,1.3,0.0076,0.3381,1.3095,0.0074,0.3381,1.319,0.0071,0.3381,1.3286,0.0069,0.3381,1.3381,0.0067,0.3381,1.3476,0.0064,0.3381,1.3571,0.0062,0.3381,1.3667,0.006,0.3376,1.3762,0.0058,0.337,1.3857,0.0055,0.3362,1.3952,0.0053,0.3349,1.4048,0.0051,0.3341,1.4143,0.0049,0.3325,1.4238,0.0048,0.3306,1.4333,0.0048,0.3281,1.4429,0.0048,0.3254,1.4524,0.0048,0.3227,1.4619,0.0048,0.3197,1.4714,0.0048,0.3163,1.481,0.0048,0.3127,1.4905,0.0048,0.3092,1.5,0.0048,0.3051,1.5095,0.0048,0.3008,1.519,0.0048,0.297,1.5286,0.0048,0.294,1.5381,0.0044,0.2922,1.5476,0.0042,0.2906,1.5571,0.004,0.2887,1.5667,0.0038,0.2875,1.5762,0.0037,0.2873,1.5857,0.0035,0.2892,1.5952,0.0032,0.2938,1.6046,0.0025,0.2984,1.6119,0.0018,0.3005,1.6146,0.0014],[0.5163,0.3902,0.0072,0.5224,0.3962,0.024,0.531,0.4048,0.024,0.5405,0.4143,0.024,0.549,0.4238,0.024,0.5551,0.4333,0.024,0.5586,0.4429,0.024,0.5595,0.4524,0.024,0.5595,0.4619,0.024,0.5597,0.4714,0.024,0.5619,0.4806,0.024,0.5667,0.489,0.024,0.574,0.4963,0.024,0.5824,0.5033,0.024,0.5889,0.5108,0.024,0.5932,0.5192,0.024,0.5954,0.5286,0.024,0.5973,0.5381,0.024,0.5986,0.5476,0.024,0.5987,0.5571,0.024,0.5979,0.5667,0.024,0.596,0.5762,0.024,0.5941,0.5857,0.024,0.594,0.5952,0.024,0.5941,0.6048,0.024,0.5944,0.6143,0.024,0.5949,0.6238,0.024,0.5949,0.6333,0.024,0.5949,0.6429,0.024,0.5952,0.6524,0.024,0.5952,0.6619,0.024,0.5951,0.6714,0.024,0.5944,0.681,0.024,0.5938,0.6905,0.024,0.5932,0.7,0.024,0.5929,0.7095,0.024,0.5929,0.719,0.0238,0.5929,0.7286,0.0235,0.5924,0.7381,0.0232,0.5917,0.7476,0.023,0.5906,0.7571,0.0227,0.5894,0.7667,0.0224,0.5887,0.7762,0.0222,0.5875,0.7857,0.0219,0.5868,0.7952,0.0216,0.5862,0.8048,0.0213,0.5857,0.8143,0.0211,0.5857,0.8238,0.0208,0.5857,0.8333,0.0205,0.5856,0.8429,0.0202,0.5849,0.8524,0.02,0.584,0.8619,0.0197,0.5821,0.8714,0.0194,0.5805,0.881,0.0192,0.5792,0.8905,0.0189,0.5786,0.9,0.0186,0.5786,0.9095,0.0183,0.5786,0.919,0.0181,0.5786,0.9286,0.0178,0.5786,0.9381,0.0175,0.5786,0.9476,0.0172,0.5789,0.9571,0.017,0.5795,0.9667,0.0167,0.5802,0.9762,0.0164,0.5813,0.9857,0.0162,0.5843,0.9952,0.0159,0.5897,1.0038,0.0156,0.5976,1.0111,0.0153,0.607,1.0181,0.0151,0.6154,1.0252,0.0148,0.6211,1.0335,0.0145,0.6233,1.0429,0.0142,0.6233,1.0524,0.014,0.6221,1.0619,0.0137,0.6214,1.0714,0.0134,0.6214,1.081,0.0132,0.6214,1.0905,0.0129,0.6214,1.1,0.0126,0.6214,1.1095,0.0123,0.6214,1.119,0.0121,0.6214,1.1286,0.0118,0.6214,1.1381,0.0115,0.6214,1.1476,0.0112,0.6214,1.1571,0.011,0.6214,1.1667,0.0107,0.6214,1.1762,0.0104,0.6217,1.1857,0.0102,0.6224,1.1952,0.0099,0.6222,1.2048,0.0096,0.6216,1.2143,0.0093,0.6205,1.2238,0.0091,0.6192,1.2333,0.0088,0.619,1.2429,0.0085,0.619,1.2524,0.0082,0.6195,1.2619,0.008,0.6202,1.2714,0.0077,0.6208,1.281,0.0074,0.6214,1.2905,0.0072,0.6214,1.3,0.0069,0.6214,1.3095,0.0066,0.6217,1.319,0.0063,0.6224,1.3286,0.0061,0.6232,1.3381,0.0058,0.6244,1.3476,0.0055,0.6259,1.3571,0.0052,0.6276,1.3667,0.005,0.6297,1.3762,0.0047,0.6314,1.3857,0.0045,0.6343,1.3951,0.0042,0.6386,1.404,0.004,0.6444,1.4117,0.0039,0.6506,1.4194,0.0039,0.654,1.4273,0.0039,0.6544,1.4357,0.0036,0.6532,1.4452,0.0032,0.6537,1.4548,0.0025,0.6568,1.4643,0.0021,0.6627,1.4738,0.0019,0.6681,1.4833,0.0019,0.6708,1.4927,0.002,0.6692,1.5002,0.002,0.6643,1.5065,0.0019,0.661,1.5124,0.0016,0.6594,1.5163,0.0013,0.6594,1.5173,0.0012],[0.6306,1.2235,0.0072,0.6367,1.2286,0.024,0.6452,1.234,0.0217,0.6548,1.2381,0.018,0.6643,1.2402,0.0158,0.6738,1.2422,0.0149,0.6833,1.2448,0.0152,0.6929,1.2479,0.0165,0.7024,1.2513,0.019,0.7119,1.2548,0.0233,0.7214,1.2571,0.0236,0.731,1.259,0.0226,0.7392,1.2619,0.0216,0.7452,1.2667,0.0206,0.7487,1.274,0.0196,0.7498,1.2833,0.0186,0.75,1.2929,0.0176,0.75,1.3024,0.0165,0.75,1.3119,0.0155,0.7506,1.3214,0.0145,0.7513,1.331,0.0135,0.7522,1.3405,0.0125,0.7533,1.35,0.0115,0.7535,1.3595,0.0105,0.754,1.369,0.0095,0.7541,1.3786,0.0085,0.7541,1.3881,0.0075,0.7548,1.3976,0.0065,0.7554,1.4071,0.0055,0.7562,1.4167,0.0046,0.7571,1.4262,0.0043,0.7583,1.4357,0.004,0.7592,1.4451,0.0037,0.7602,1.4524,0.0034,0.7608,1.4551,0.0032],[0.5759,0.2621,0.0072,0.5819,0.2657,0.024,0.5905,0.2708,0.024,0.6,0.2749,0.024,0.6095,0.2776,0.024,0.619,0.2786,0.024,0.6286,0.2786,0.024,0.6381,0.2786,0.024,0.6476,0.2786,0.024,0.6571,0.279,0.024,0.6667,0.2819,0.024,0.6762,0.2873,0.024,0.6857,0.2952,0.024,0.6952,0.3048,0.024,0.7048,0.3143,0.024,0.7138,0.3238,0.024,0.7211,0.3333,0.024,0.7259,0.3429,0.024,0.729,0.3521,0.024,0.733,0.36,0.024,0.739,0.3668,0.024,0.7476,0.3722,0.024,0.7571,0.3773,0.024,0.7667,0.3821,0.024,0.7762,0.3867,0.024,0.7857,0.3913,0.024,0.7944,0.3968,0.024,0.8013,0.4038,0.024,0.8062,0.4121,0.024,0.809,0.4214,0.0239,0.8111,0.431,0.0235,0.8129,0.4405,0.0232,0.8144,0.45,0.0228,0.8157,0.4595,0.0225,0.8163,0.469,0.0222,0.8167,0.4786,0.0218,0.8171,0.4881,0.0215,0.8173,0.4976,0.0212,0.8167,0.5071,0.0208,0.816,0.5167,0.0205,0.8148,0.5262,0.0202,0.8143,0.5357,0.0198,0.8143,0.5452,0.0195,0.8143,0.5548,0.0192,0.814,0.5643,0.0188,0.8124,0.5738,0.0185,0.8087,0.5833,0.0181,0.8049,0.5929,0.0178,0.8016,0.6024,0.0175,0.8005,0.6119,0.0171,0.8011,0.6214,0.0168,0.8017,0.631,0.0165,0.8024,0.6405,0.0161,0.8024,0.65,0.0158,0.8024,0.6595,0.0155,0.8024,0.669,0.0151,0.8024,0.6786,0.0148,0.8024,0.6881,0.0144,0.8024,0.6976,0.0141,0.8024,0.7071,0.0138,0.8024,0.7167,0.0134,0.8024,0.7262,0.0131,0.8024,0.7357,0.0128,0.8024,0.7452,0.0124,0.8029,0.7548,0.0121,0.8035,0.7643,0.0118,0.8043,0.7738,0.0114,0.806,0.7833,0.0111,0.8073,0.7929,0.0108,0.8086,0.8024,0.0104,0.8095,0.8119,0.0101,0.8095,0.8214,0.0097,0.8095,0.831,0.0094,0.8095,0.8405,0.0091,0.8095,0.85,0.0087,0.8095,0.8595,0.0084,0.8095,0.869,0.0081,0.8097,0.8786,0.0077,0.8119,0.8881,0.0074,0.8167,0.8976,0.0071,0.824,0.9068,0.0067,0.8333,0.9157,0.0064,0.8429,0.9246,0.006,0.8524,0.9335,0.0057,0.8619,0.9429,0.0054,0.8698,0.9524,0.005,0.8757,0.9619,0.0048,0.8786,0.9714,0.0048,0.879,0.981,0.0048,0.8798,0.9905,0.0047,0.8806,1.0,0.0043,0.8814,1.0095,0.004,0.8825,1.019,0.0038,0.8829,1.0286,0.0037,0.8825,1.0381,0.0034,0.8821,1.0476,0.0031,0.8808,1.0571,0.0028,0.8789,1.0667,0.0024,0.8776,1.0762,0.0022,0.876,1.0848,0.0019,0.8749,1.0908,0.0017],[0.5717,1.0025,0.0072,0.5657,1.0062,0.024,0.5571,1.0114,0.024,0.5476,1.0168,0.024,0.5381,1.0219,0.024,0.5287,1.0267,0.024,0.5205,1.0322,0.0231,0.5135,1.0392,0.0214,0.5079,1.0476,0.0196,0.5037,1.0571,0.0179,0.5006,1.0667,0.0161,0.4987,1.0762,0.0144,0.4989,1.0857,0.0127,0.5022,1.0952,0.0109,0.5083,1.1048,0.0092,0.5151,1.1143,0.0074,0.5211,1.1238,0.0057,0.5251,1.1333,0.0046,0.5268,1.1424,0.004,0.5279,1.149,0.0035,0.5281,1.1503,0.0034],[0.3456,0.6548,0.0072,0.3395,0.6548,0.024,0.331,0.6548,0.024,0.3214,0.6548,0.024,0.3119,0.6548,0.024,0.3024,0.6548,0.024,0.2929,0.6549,0.024,0.2835,0.6571,0.024,0.2757,0.6619,0.024,0.2703,0.6692,0.024,0.2675,0.6786,0.024,0.2667,0.6881,0.024,0.2667,0.6976,0.024,0.2667,0.7071,0.024,0.2667,0.7167,0.0233,0.2667,0.7262,0.0226,0.2665,0.7357,0.0218,0.2659,0.7452,0.0211,0.2652,0.7548,0.0204,0.2646,0.7643,0.0196,0.2638,0.7738,0.0189,0.2632,0.7833,0.0182,0.2619,0.7929,0.0174,0.2606,0.8024,0.0167,0.2597,0.8119,0.016,0.2586,0.8214,0.0152,0.2579,0.831,0.0145,0.2567,0.8405,0.0138,0.2556,0.85,0.013,0.2543,0.8595,0.0123,0.2532,0.869,0.0113,0.2519,0.8786,0.0101,0.2511,0.8881,0.0092,0.2505,0.8976,0.0084,0.2494,0.9071,0.0074,0.2487,0.9167,0.0067,0.2478,0.9262,0.0058,0.2467,0.9357,0.0049,0.2459,0.9452,0.0043,0.2444,0.9548,0.0036,0.2429,0.9643,0.0034,0.2405,0.9738,0.0033,0.2371,0.9833,0.0031,0.2332,0.9929,0.0028,0.2284,1.0024,0.0025,0.2241,1.0103,0.0023,0.2217,1.0146,0.0021],[0.4694,0.3789,0.0072,0.4633,0.3729,0.024,0.4548,0.3643,0.024,0.4452,0.3552,0.024,0.4357,0.3486,0.024,0.4262,0.3448,0.024,0.4167,0.3441,0.024,0.4071,0.3457,0.024,0.3976,0.3481,0.024,0.3881,0.3506,0.024,0.3786,0.3535,0.024,0.369,0.3565,0.024,0.3595,0.3594,0.024,0.35,0.3625,0.024,0.3405,0.3657,0.024,0.331,0.369,0.024,0.3214,0.3729,0.024,0.3119,0.3768,0.024,0.3024,0.3811,0.024,0.2929,0.3856,0.024,0.2833,0.39,0.0238,0.2738,0.3948,0.0233,0.2646,0.4002,0.0228,0.257,0.4068,0.0223,0.2508,0.4148,0.0218,0.2462,0.4238,0.0213,0.2429,0.4333,0.0208,0.2395,0.4429,0.0203,0.2367,0.4524,0.0198,0.2338,0.4619,0.0193,0.2294,0.4714,0.0188,0.2252,0.481,0.0183,0.2205,0.4905,0.0178,0.2148,0.5,0.0174,0.2086,0.5095,0.0169,0.2,0.519,0.0164,0.1905,0.5278,0.0159,0.181,0.5351,0.0154,0.1714,0.5408,0.0149,0.1619,0.5451,0.0123,0.153,0.5502,0.0107,0.1452,0.5565,0.0101,0.1392,0.5644,0.0098,0.1346,0.5735,0.0096,0.1298,0.5824,0.0095,0.1254,0.5913,0.0093,0.1203,0.6002,0.0093,0.1165,0.6095,0.0089,0.1138,0.619,0.0087,0.111,0.6286,0.0085,0.1081,0.6381,0.0082,0.1044,0.6476,0.0076,0.1013,0.6571,0.0069,0.0984,0.6667,0.0062,0.0959,0.6762,0.0055,0.0944,0.6857,0.0051,0.0929,0.6952,0.0046,0.0913,0.7048,0.0041,0.0897,0.7143,0.0037,0.0878,0.7238,0.0034,0.0865,0.7333,0.0032,0.0859,0.7429,0.0031,0.0857,0.7524,0.003,0.0857,0.7619,0.0029,0.0857,0.7714,0.0027,0.0857,0.781,0.0025,0.0857,0.7905,0.0021,0.0851,0.7995,0.0016,0.0844,0.8062,0.0012,0.0843,0.8075,0.0011],[0.5146,0.2956,0.0072,0.5086,0.2895,0.024,0.5,0.281,0.024,0.4905,0.2714,0.024,0.481,0.2619,0.024,0.4714,0.2524,0.024,0.4619,0.2429,0.024,0.4524,0.2333,0.024,0.4429,0.2238,0.0239,0.4333,0.2143,0.0227,0.4238,0.2048,0.0215,0.4143,0.1952,0.0203,0.4048,0.186,0.0191,0.3952,0.1784,0.0179,0.3857,0.1721,0.0153,0.3762,0.1675,0.0134,0.3667,0.1643,0.0121,0.3571,0.1613,0.0109,0.3476,0.1586,0.0098,0.3381,0.156,0.0087,0.3286,0.1533,0.0076,0.319,0.1513,0.0064,0.3095,0.1505,0.0053,0.3,0.1506,0.0041,0.2905,0.1517,0.0031,0.281,0.1535,0.003,0.2714,0.1559,0.0028,0.2635,0.1584,0.0026,0.2592,0.1598,0.0025]] };

const XRAY_GREEN = "rgb(60, 150, 80)";

function cxPath(d, sw, op) {
  const cls = sw <= 0.55 ? "cx-w05" : sw <= 0.85 ? "cx-w08" : sw <= 1.3 ? "cx-w12" : "cx-w16";
  branchEl("path", {
    d, fill: "none", stroke: XRAY_GREEN, "stroke-opacity": op,
    "stroke-width": sw, "data-sw": sw, class: cls,
    "stroke-linecap": "round", "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke"
  });
}

// 점 배열을 부드러운 곡선(연속 2차 베지어)으로
function smoothD(P) {
  if (P.length < 3) return `M ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)} L ${P[P.length - 1][0].toFixed(1)} ${P[P.length - 1][1].toFixed(1)}`;
  let d = `M ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
    d += ` Q ${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const L = P[P.length - 1];
  return d + ` L ${L[0].toFixed(1)} ${L[1].toFixed(1)}`;
}

function drawCompanionSkeleton(c) {
  const sk = COMPANION_SKELETON[c.image];
  const gp = GROWTH_POINTS[c.image];
  if (!sk || !gp || !c.drawWidth) {
    branchCircle(c.x, c.y, 3.6, true);
    drawCompositePlantAtNode(c.input, c.image, c.x, c.y, c.index * 0.34, c.index);
    return;
  }
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "xray-genus xray-hue-0");
  (currentBranchGroup || growthBranchLayer).appendChild(group);
  const prevGroup = currentBranchGroup;
  currentBranchGroup = group;

  const w = c.drawWidth;
  const gx = gp[0];
  const gy = gp[1] * gp[2];
  const r = (c.rotDeg * Math.PI) / 180;
  const cos = Math.cos(r), sin = Math.sin(r);
  const map = (u, v) => {
    const lx = (u - gx) * w, ly = (v - gy) * w;
    return [c.x + lx * cos - ly * sin, c.y + lx * sin + ly * cos];
  };

  const tails = COMPANION_TAILS[c.image];
  if (tails) {
    drawTubeTails(tails, map, w);
  } else {
    // 줄기/잎 축: 굵은 축일수록 굵고 진하게, 가는 곁가지는 얇고 옅게
    sk.s.forEach((st) => {
      const P = [];
      for (let i = 0; i < st.pts.length; i += 2) P.push(map(st.pts[i], st.pts[i + 1]));
      const thick = st.r * w;                    // 화면상 실제 두께(px)
      const sw = Math.max(0.5, Math.min(1.6, 0.45 + thick * 0.09));
      const op = Math.max(0.4, Math.min(0.85, 0.35 + thick * 0.03));
      cxPath(smoothD(P), sw, op);
    });
    for (let i = 0; i < sk.j.length; i += 2) {
      const [x, y] = map(sk.j[i], sk.j[i + 1]);
      branchCircle(x, y, 1.8, true);
    }
    for (let i = 0; i < sk.t.length; i += 2) {
      const [x, y] = map(sk.t[i], sk.t[i + 1]);
      branchCircle(x, y, 1.3, false);
    }
  }

  // 꽃이 붙는 자리(N-04) — 가는 꽃잎 8장
  if (c.image === "N-04" && typeof PETAL_UNITS !== "undefined") {
    Object.values(PETAL_UNITS).forEach((u, k) => {
      const [x, y] = map(u.x + u.w / 2, (u.y + u.h / 2) * gp[2]);
      const R = u.w * w * 0.26;
      let d = "";
      for (let i = 0; i < 8; i++) {
        const a = k * 0.5 + (i * Math.PI) / 4;
        const tx = x + Math.cos(a) * R, ty = y + Math.sin(a) * R;
        const ca = a + 0.35, cb = a - 0.35;
        d += `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x + Math.cos(ca) * R * 0.6).toFixed(1)} ${(y + Math.sin(ca) * R * 0.6).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q ${(x + Math.cos(cb) * R * 0.6).toFixed(1)} ${(y + Math.sin(cb) * R * 0.6).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)} `;
      }
      cxPath(d, 0.6, 0.7);
      branchCircle(x, y, 1.4, true);
    });
  }

  branchCircle(c.x, c.y, 3.2, true); // 생장점
  currentBranchGroup = prevGroup;
}

// 관 모양 줄기: 중심선 + 양쪽 윤곽선 + 사이를 채우는 가는 털 가시
function drawTubeTails(tails, map, w) {
  tails.forEach((tl) => {
    const C = [], L = [], R = [], hair = [];
    for (let i = 0; i < tl.length; i += 3) C.push([tl[i], tl[i + 1], tl[i + 2]]);
    const n = C.length;
    const P = C.map(([u, v]) => map(u, v));
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
      let ux = b[0] - a[0], uy = b[1] - a[1];
      const len = Math.hypot(ux, uy) || 1; ux /= len; uy /= len;
      const rad = C[i][2] * w;
      const lp = [P[i][0] - uy * rad, P[i][1] + ux * rad];
      const rp = [P[i][0] + uy * rad, P[i][1] - ux * rad];
      L.push(lp); R.push(rp);
      // 털 가시: 중심에서 윤곽 쪽으로, 자라는 방향(끝 쪽)으로 비스듬히
      if (i > 0 && rad > 1.2) {
        const lean = rad * 0.7;
        hair.push(`M ${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)} L ${((P[i][0] + lp[0]) / 2 + ux * lean).toFixed(1)} ${((P[i][1] + lp[1]) / 2 + uy * lean).toFixed(1)}`);
        hair.push(`M ${P[i][0].toFixed(1)} ${P[i][1].toFixed(1)} L ${((P[i][0] + rp[0]) / 2 + ux * lean).toFixed(1)} ${((P[i][1] + rp[1]) / 2 + uy * lean).toFixed(1)}`);
      }
    }
    if (hair.length) cxPath(hair.join(" "), 0.5, 0.32);
    cxPath(smoothD(L), 0.55, 0.45);
    cxPath(smoothD(R), 0.55, 0.45);
    cxPath(smoothD(P), 1.1, 0.85);
    const tip = P[n - 1];
    branchCircle(tip[0], tip[1], 1.3, false);
  });
}