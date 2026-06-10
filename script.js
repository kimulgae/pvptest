const parsedData = { my: { stats: {} }, enemy: { stats: {} } };
let cvReady = false;
let templatesDB = []; 

const SKILL_NAMES = ["Meat", "Arrows", "Shout", "Berserk", "Cannon", "Shuriken", "Buff", "ArrowRains", "Thorns", "Bomb", "Meteorite", "Morale", "Lightning", "Stampede", "Worm", "Drone", "HigherMorale", "StrafeRun"];
const TIERS = [
    { folder: "apex", prefix: "Apex_", val: "Apex" },
    { folder: "mega", prefix: "Mega_", val: "Mega" },
    { folder: "standard", prefix: "", val: "Normal" }
];

window.onload = () => {
    const skillHTML = `<option value="None" selected>스킬 없음</option>` + 
        `<option value="Meat">🍖 고기</option><option value="Arrows">🏹 화살</option><option value="Shout">🗣️ 외침</option><option value="Berserk">😡 광전사</option><option value="Cannon">💣 포격</option><option value="Shuriken">🥷 수리검</option><option value="Buff">💪 버프</option><option value="ArrowRains">🌧️ 화살비</option><option value="Thorns">🌵 가시</option><option value="Bomb">💣 폭탄</option><option value="Meteorite">☄️ 운석</option><option value="Morale">⭐ 사기</option><option value="Lightning">⚡ 번개</option><option value="Stampede">🐗 쇄도</option><option value="Worm">🐛 벌레</option><option value="Drone">🚁 드론</option><option value="HigherMorale">👼 높은사기</option><option value="StrafeRun">🛩️ 기총소사</option>`;
    
    ['mySkill1', 'mySkill2', 'mySkill3', 'enemySkill1', 'enemySkill2', 'enemySkill3'].forEach(id => {
        document.getElementById(id).innerHTML = skillHTML;
    });
};

window.onOpenCvReady = function() {
    checkOpenCvReady();
};

function checkOpenCvReady() {
    if (typeof cv !== 'undefined' && typeof cv.Mat === 'function') {
        console.log("[시스템] OpenCV 내부 코어 완벽 부팅 확인!");
        loadTemplates();
    } else {
        setTimeout(checkOpenCvReady, 200); 
    }
}

function loadTemplates() {
    cvReady = true;
    const statusEl = document.getElementById('ai-status');
    statusEl.innerText = "⏳ AI 엔진 부팅 완료! 스킬 아이콘을 학습하는 중...";
    
    let successCount = 0;
    let failCount = 0;

    TIERS.forEach(tier => {
        SKILL_NAMES.forEach(skill => {
            let img = new Image();
            img.crossOrigin = "Anonymous"; 
            let path = `templates/${tier.folder}/${tier.prefix}${skill}.png`;
            img.src = path;

            img.onload = () => {
                try {
                    let canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    let ctx = canvas.getContext('2d');
                    
                    // 배경을 하얗게 채워 대비를 높임 (다시 복구)
                    ctx.fillStyle = "#ffffff"; 
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    let mat = cv.imread(canvas);
                    let gray = new cv.Mat();
                    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY, 0);

                    templatesDB.push({ name: skill, tier: tier.val, mat: gray });
                    
                    mat.delete();
                    successCount++;
                } catch(e) {
                    console.error(`[변환 에러] ${path} 실패:`, e);
                }
            };
            img.onerror = () => { failCount++; };
        });
    });

    setTimeout(() => {
        if (templatesDB.length > 0) {
            statusEl.innerText = `✅ AI 엔진 장전 완료! (학습 완료: ${successCount}개)`;
            statusEl.style.color = "#4ade80";
        }
    }, 2000); 
}
const SKILL_DB = {
    "Meat": { type: "buff", dmgBonus: 0, hpBonus: 0.0001, duration: 10, count: 7.5 },
    "Arrows": { type: "dmg", power: 0.0002, cooldown: 7, count: 8.57 },
    "Shout": { type: "dmg", power: 0.00015, cooldown: 6, count: 10 },
    "Berserk": { type: "buff", dmgBonus: 0.00128, hpBonus: 0, duration: 10, count: 7.5 },
    "Cannon": { type: "dmg", power: 0.00128, cooldown: 5, count: 12 },
    "Shuriken": { type: "dmg", power: 0.00128, cooldown: 4, count: 15 },
    "Buff": { type: "buff", dmgBonus: 0.01, hpBonus: 0.08, duration: 10, count: 7.5 },
    "ArrowRains": { type: "dmg", power: 0.18, cooldown: 10, count: 6 },
    "Thorns": { type: "dmg", power: 0.0615, cooldown: 5, count: 12 },
    "Bomb": { type: "dmg", power: 0.3, cooldown: 6, count: 10 },
    "Meteorite": { type: "dmg", power: 0.5, cooldown: 9, count: 6.67 },
    "Morale": { type: "buff", dmgBonus: 0.04, hpBonus: 0.32, duration: 10, count: 7.5 },
    "Lightning": { type: "dmg", power: 0.5, cooldown: 3, count: 20 },
    "Stampede": { type: "dmg", power: 1.0, cooldown: 20, count: 3 },
    "Worm": { type: "dmg", power: 1.0, cooldown: 8, count: 7.5 },
    "Drone": { type: "dmg", power: 8.0, cooldown: 8, count: 7.5 },
    "HigherMorale": { type: "buff", dmgBonus: 1.5, hpBonus: 12.0, duration: 8, count: 7.5 },
    "StrafeRun": { type: "dmg", power: 12.0, cooldown: 10, count: 6 }
};
const ASCENSION_MULTIPLIERS = { 0: 1.0, 1: 49.0, 2: 2499.0, 3: 124999.0 };

function normalizeStatName(rawName) {
    if (rawName.includes("총") || rawName.includes("대장간") || rawName.includes("레벨") || rawName.includes("도감") || rawName.includes("장착")) return null;
    if (rawName.includes("치명") || rawName.includes("지명") || rawName.includes("명타")) return (rawName.includes("피해") || rawName.includes("피애")) ? "치명타 피해" : "치명타 확률";
    if (rawName.includes("확률") || rawName.includes("확럴") || rawName.includes("학률") || rawName.includes("블록") || rawName.includes("블럭") || rawName.includes("클록") || rawName.includes("플록")) return "블록 확률";
    if (rawName.includes("흡수") || rawName.includes("생명") || rawName.includes("흡슈")) return "생명력 흡수";
    if (rawName.includes("더블") || rawName.includes("떠블") || rawName.includes("찬스") || rawName.includes("단스")) return "더블 찬스";
    if (rawName.includes("속도") || rawName.includes("속토") || rawName.includes("공격")) return "공격 속도";
    if (rawName.includes("대기") || rawName.includes("재사용") || rawName.includes("시간")) return "스킬 재사용 대기시간";
    if (rawName.includes("근접") || rawName.includes("건접")) return "근접 피해";
    if (rawName.includes("원거리") || rawName.includes("원거")) return "원거리 피해";
    if (rawName.includes("스킬") || rawName.includes("스길")) return "스킬 피해";
    if (rawName.includes("재생") || rawName.includes("제생")) return "체력 재생";
    if (rawName.includes("체력") || rawName.includes("채력") || rawName.includes("최력") || rawName.includes("체럭")) return "체력";
    if (rawName.includes("피해") || rawName.includes("피애") || rawName.includes("파해") || rawName.includes("피헤")) return "피해";
    return null;
}

async function processImages(fileInputId, statusId, listId, playerKey) {
    const files = document.getElementById(fileInputId).files;
    if (files.length === 0) return;
    
    const statusEl = document.getElementById(statusId);
    
    // 리셋 로직
    document.getElementById(playerKey + 'Skill1').value = "None";
    document.getElementById(playerKey + 'Skill2').value = "None";
    document.getElementById(playerKey + 'Skill3').value = "None";
    document.getElementById(playerKey + 'Ascension').value = "0";
    document.getElementById(listId).innerHTML = ""; 

    if (!cvReady || templatesDB.length === 0) {
        statusEl.innerText = "⚠️ AI 엔진 미준비 (텍스트 옵션만 스캔합니다)";
        return;
    }

    // ⏱️ 초 단위 타이머 시작
    let startTime = Date.now();
    let timerInterval = setInterval(() => {
        let sec = Math.floor((Date.now() - startTime) / 1000);
        statusEl.innerText = `⏳ AI가 이미지를 분석하고 있습니다... (${sec}초 경과)`;
    }, 1000);

    try {
        // ==========================
        // 1. 고속 스킬 아이콘 매칭 (OpenCV)
        // ==========================
        const firstImg = await createImageFromBlob(files[0]);
        let src = cv.imread(firstImg);
        
        // 장비창을 제외하고 스킬과 펫이 위치한 황금 구역(55% ~ 72%)만 정밀 크롭
        let cropY_start = Math.floor(src.rows * 0.55);
        let cropHeight = Math.floor(src.rows * 0.17);
        let rect = new cv.Rect(0, cropY_start, src.cols, cropHeight);
        let croppedSrc = src.roi(rect);

        let gray = new cv.Mat();
        cv.cvtColor(croppedSrc, gray, cv.COLOR_RGBA2GRAY, 0);

        let detected = [];
        const THRESHOLD = 0.65; 
        const scales = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2]; // 스케일 스펙트럼 확장

        for (let scale of scales) {
            let scaledGray = new cv.Mat();
            let newSize = new cv.Size(Math.floor(gray.cols * scale), Math.floor(gray.rows * scale));
            cv.resize(gray, scaledGray, newSize, 0, 0, cv.INTER_LINEAR);

            for (let temp of templatesDB) {
                if (temp.mat.rows > scaledGray.rows || temp.mat.cols > scaledGray.cols) continue;

                let dst = new cv.Mat();
                let mask = new cv.Mat();
                cv.matchTemplate(scaledGray, temp.mat, dst, cv.TM_CCOEFF_NORMED, mask);
                
                // 🔥 [대폭 개선] 대량의 픽셀 루프 대신 고속 minMaxLoc 순회 알고리즘 적용
                for (let m = 0; m < 3; m++) {
                    let minMax = cv.minMaxLoc(dst);
                    if (minMax.maxVal >= THRESHOLD) {
                        let originalX = Math.floor(minMax.maxLoc.x / scale);
                        // 화면 우측의 펫(가로 52% 이후 영역)은 스킬칸이 아니므로 원천 배제
                        if (originalX < src.cols * 0.52) {
                            detected.push({ name: temp.name, x: originalX, conf: minMax.maxVal });
                        }
                        
                        // 이미 찾은 피크 주변을 지워 중복 검출 방지
                        let startX = Math.max(0, minMax.maxLoc.x - temp.mat.cols / 2);
                        let startY = Math.max(0, minMax.maxLoc.y - temp.mat.rows / 2);
                        let w = Math.min(dst.cols - startX, temp.mat.cols);
                        let h = Math.min(dst.rows - startY, temp.mat.rows);
                        let eraseRect = new cv.Rect(startX, startY, w, h);
                        let roi = dst.roi(eraseRect);
                        roi.setTo(new cv.Scalar(0));
                        roi.delete();
                    } else {
                        break;
                    }
                }
                dst.delete(); mask.delete();
            }
            scaledGray.delete();
        }
        src.delete(); croppedSrc.delete(); gray.delete();

        // X좌표 기준 근접 영역 클러스터링
        let slots = [];
        for (let d of detected) {
            let addedToSlot = false;
            for (let s of slots) {
                if (Math.abs(s.x - d.x) < 45) { 
                    if (d.conf > s.conf) {
                        s.name = d.name;
                        s.conf = d.conf;
                    }
                    addedToSlot = true;
                    break;
                }
            }
            if (!addedToSlot) {
                slots.push({ x: d.x, name: d.name, conf: d.conf });
            }
        }

        // 왼쪽부터 순서대로 정렬 후 상위 3개 자동 선택
        slots.sort((a, b) => a.x - b.x);
        let finalSkills = slots.slice(0, 3);
        
        if(finalSkills[0]) document.getElementById(playerKey + 'Skill1').value = finalSkills[0].name;
        if(finalSkills[1]) document.getElementById(playerKey + 'Skill2').value = finalSkills[1].name;
        if(finalSkills[2]) document.getElementById(playerKey + 'Skill3').value = finalSkills[2].name;
        console.log(`[오픈CV 성공] 추출된 스킬 목록:`, finalSkills);

        // ==========================
        // 2. 텍스트 옵션 읽기 (OCR)
        // ==========================
        parsedData[playerKey].stats = {}; 
        for (let i = 0; i < files.length; i++) {
            const imgForOcr = await createImageFromBlob(files[i]);
            const canvas = document.createElement('canvas');
            
            // 스킬칸 바로 아래부터 화면 하단 버튼 전(66% ~ 90%)까지 오려내기
            const startY = imgForOcr.height * 0.66; 
            const cropHeightForOcr = imgForOcr.height * 0.24; 
            
            canvas.width = imgForOcr.width * 1.5; 
            canvas.height = cropHeightForOcr * 1.5;
            const ctx = canvas.getContext('2d');
            
            ctx.filter = 'grayscale(1) contrast(1.2)'; 
            ctx.drawImage(imgForOcr, 0, startY, imgForOcr.width, cropHeightForOcr, 0, 0, canvas.width, canvas.height);
            
            const processedUrl = canvas.toDataURL('image/jpeg', 1.0);
            const { data: { text } } = await Tesseract.recognize(processedUrl, 'kor+eng');
            console.log(`[OCR 내부 원본 수집]:\n`, text);

            // 🔥 [대폭 개선] 오작동이 심한 연쇄 정규식 대신 줄바꿈 단위 키워드 분석법 도입
            const lines = text.split('\n');
            for (let line of lines) {
                let cleanLine = line.replace(/\s+/g, '');
                
                // 줄 내부에 포함된 숫자 부동소수점 매칭
                let numMatch = cleanLine.match(/([+-]?\d+[\.,]?\d*)/);
                if (!numMatch) continue;
                let value = parseFloat(numMatch[1].replace(',', '.'));
                
                let statName = null;
                // OCR 오타(클록, 왁률, 옵수 등) 방어 코드 탑재 완료
                if (cleanLine.includes("치명") || cleanLine.includes("지명") || cleanLine.includes("명타")) {
                    statName = (cleanLine.includes("피해") || cleanLine.includes("피애") || cleanLine.includes("파해")) ? "치명타 피해" : "치명타 확률";
                } else if (cleanLine.includes("블록") || cleanLine.includes("블럭") || cleanLine.includes("클록") || cleanLine.includes("플록") || cleanLine.includes("확률") || cleanLine.includes("왁률") || cleanLine.includes("학률")) {
                    statName = "블록 확률";
                } else if (cleanLine.includes("흡수") || cleanLine.includes("생명") || cleanLine.includes("흡슈") || cleanLine.includes("옵수") || cleanLine.includes("힙수")) {
                    statName = "생명력 흡수";
                } else if (cleanLine.includes("더블") || cleanLine.includes("떠블") || cleanLine.includes("찬스") || cleanLine.includes("잔스")) {
                    statName = "더블 찬스";
                } else if (cleanLine.includes("속도") || cleanLine.includes("공격") || cleanLine.includes("격속")) {
                    statName = "공격 속도";
                } else if (cleanLine.includes("대기") || cleanLine.includes("재사용") || cleanLine.includes("시간")) {
                    statName = "스킬 재사용 대기시간";
                } else if (cleanLine.includes("근접") || cleanLine.includes("건접")) {
                    statName = "근접 피해";
                } else if (cleanLine.includes("원거리")) {
                    statName = "원거리 피해";
                } else if (cleanLine.includes("스킬") || cleanLine.includes("스길")) {
                    statName = "스킬 피해";
                } else if (cleanLine.includes("체력") || cleanLine.includes("채력") || cleanLine.includes("최력")) {
                    statName = "체력";
                } else if (cleanLine.includes("피해") || cleanLine.includes("피애") || cleanLine.includes("파해")) {
                    statName = "피해";
                }
                
                if (statName && !isNaN(value) && Math.abs(value) < 30000) {
                    parsedData[playerKey].stats[statName] = value;
                }
            }
        }
        
        renderOptionList(parsedData[playerKey].stats, listId);
        
        // 타이머 정지 및 마감
        clearInterval(timerInterval);
        let totalSec = Math.floor((Date.now() - startTime) / 1000);
        statusEl.innerText = `✅ 스캔 완료! (${totalSec}초 소요)`;
        statusEl.style.color = "#4ade80";

    } catch (e) {
        clearInterval(timerInterval);
        console.error("[인식 엔진 치명적 에러]:", e);
        statusEl.innerText = "❌ 스캔 오류 발생. 대상을 다시 확인해 주세요.";
        statusEl.style.color = "#ff4b4b";
    }
}
function createImageFromBlob(file) {
    return new Promise((resolve) => {
        let img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => resolve(img);
    });
}

function renderOptionList(stats, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; 
    if(Object.keys(stats).length === 0) {
        container.innerHTML = "<p style='color: #8e8e9f; font-size: 13px; margin-top: 10px;'>인식된 옵션이 없습니다.</p>";
        return;
    }
    Object.keys(stats).forEach(name => {
        const prefix = name.includes("대기시간") ? "-" : "+";
        container.innerHTML += `<div class="simple-option-item"><span class="opt-name">${name}</span><span class="opt-value">${prefix}${stats[name]}%</span></div>`;
    });
}

document.getElementById('calcBtn').addEventListener('click', () => {
    const getMultiplier = (u) => ({'k': 1e3, 'm': 1e6, 'b': 1e9, 't': 1e12, 'q': 1e15}[u] || 1);
    const getVal = (v, u) => parseFloat(document.getElementById(v).value || 0) * getMultiplier(document.getElementById(u).value);

    const myBase = getVal('myDmgVal', 'myDmgUnit') * getVal('myHpVal', 'myHpUnit');
    const enemyBase = getVal('enemyDmgVal', 'enemyDmgUnit') * getVal('enemyHpVal', 'enemyHpUnit');

    if (myBase === 0 || enemyBase === 0) {
        alert("양쪽의 '총 피해'와 '총 체력'을 모두 숫자로 입력해주세요!");
        return;
    }

    const calcEff = (stats, pKey) => {
        const getS = (k) => stats[k] / 100 || 0; 
        let multi = 1.0;
        multi *= (1 + getS("피해") + getS("근접 피해") + getS("원거리 피해") + getS("스킬 피해"));
        multi *= (1 + getS("체력")); 
        multi *= (1 + getS("공격 속도"));
        multi *= (1 + getS("더블 찬스"));
        
        multi *= (1 + (getS("치명타 확률") * (0.2 + getS("치명타 피해"))));

        const ascLevel = parseInt(document.getElementById(pKey + 'Ascension').value);
        const ascBonus = ASCENSION_MULTIPLIERS[ascLevel] || 1.0;

        for (let i = 1; i <= 3; i++) {
            const skillKey = document.getElementById(pKey + 'Skill' + i).value;
            const s = SKILL_DB[skillKey];
            if (s) {
                if (s.type === "dmg") multi += (s.power * s.count * ascBonus); 
                else if (s.type === "buff") multi *= (1 + (s.dmgBonus * ascBonus * ((s.duration * s.count) / 60))); 
            }
        }
        return multi;
    };

    const myEff = calcEff(parsedData.my.stats, 'my');
    const enEff = calcEff(parsedData.enemy.stats, 'enemy');

    const winRate = ((myBase * myEff) / (myBase * myEff + enemyBase * enEff) * 100);
    const finalRate = Math.max(1, Math.min(99.9, winRate)).toFixed(1);
    
    document.getElementById('resultText').innerText = `예상 승리 확률: ${finalRate} %`;
    document.getElementById('winRateFill').style.width = `${finalRate}%`;

    let feedback = "";
    if (finalRate > 60) feedback = `🏆 예상 결과: <b>승리</b><br>전투력과 스킬 시너지가 상대를 완벽히 압도합니다.`;
    else if (finalRate > 40) feedback = `⚔️ 예상 결과: <b>박빙의 승부</b><br>능력치가 비슷합니다. 전투 내 운적 요소가 크게 작용합니다.`;
    else feedback = `⚠️ 예상 결과: <b>패배 위험</b><br>상대방의 스탯 및 옵션 효율이 더 높습니다. 스펙업이 필요합니다.`;
    
    document.getElementById('feedbackText').innerHTML = feedback;
});

document.getElementById('myImage').addEventListener('change', () => processImages('myImage', 'myStatus', 'myOptionList', 'my'));
document.getElementById('enemyImage').addEventListener('change', () => processImages('enemyImage', 'enemyStatus', 'enemyOptionList', 'enemy'));
