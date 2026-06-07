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
                    let mat = cv.imread(img);
                    cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
                    templatesDB.push({ name: skill, tier: tier.val, mat: mat });
                    successCount++;
                } catch(e) {
                    console.error(`[변환 에러] ${path} 실패:`, e);
                }
            };
            img.onerror = () => {
                failCount++;
            };
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
    if (rawName.includes("확률") || rawName.includes("확럴") || rawName.includes("학률") || rawName.includes("블록") || rawName.includes("블럭")) return "블록 확률";
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
    console.log(`[작업 시작] ${playerKey} 이미지 스캔을 시작합니다.`);

    // 사진이 올라가면 무조건 기존 스킬칸 리셋 (빈칸으로 되돌리기)
    document.getElementById(playerKey + 'Skill1').value = "None";
    document.getElementById(playerKey + 'Skill2').value = "None";
    document.getElementById(playerKey + 'Skill3').value = "None";
    document.getElementById(playerKey + 'Ascension').value = "0";
    console.log(`[초기화] ${playerKey} 스킬 슬롯 리셋 완료`);

    if (!cvReady || templatesDB.length === 0) {
        console.warn("[경고] 스킬 템플릿이 로드되지 않았습니다.");
        statusEl.innerText = "⚠️ 스킬 자동인식 실패 (텍스트 옵션만 스캔합니다)";
    } else {
        try {
            statusEl.innerText = `⏳ AI가 장착 스킬을 탐색하고 있습니다...`;
            
            const firstImg = await createImageFromBlob(files[0]);
            let src = cv.imread(firstImg);
            
            // 🔥 범위 제한 삭제! 사진 전체(100%)를 검색하도록 수정
            let gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

            let detected = [];
            for (let temp of templatesDB) {
                // 템플릿 크기가 스크린샷보다 크면 에러 나므로 예외 처리
                if (gray.rows < temp.mat.rows || gray.cols < temp.mat.cols) continue;

                let dst = new cv.Mat();
                let mask = new cv.Mat();
                cv.matchTemplate(gray, temp.mat, dst, cv.TM_CCOEFF_NORMED, mask);
                let result = cv.minMaxLoc(dst, mask);
                
                // 🔥 합격 기준 완화 (0.85 -> 0.78)
                if (result.maxVal >= 0.78) {
                    detected.push({ name: temp.name, tier: temp.tier, x: result.maxLoc.x, conf: result.maxVal });
                }
                dst.delete(); mask.delete(); 
            }
            src.delete(); gray.delete();

            // 왼쪽부터 오른쪽 순서로 나열
            detected.sort((a, b) => a.x - b.x);
            
            let finalSkills = [];
            if (detected.length > 0) {
                let best = detected[0];
                for (let i = 1; i < detected.length; i++) {
                    // 🔥 너무 가까이 붙어 있는 포인트는 하나로 묶기 (간격 오차 50px로 넉넉하게 변경)
                    if (Math.abs(detected[i].x - best.x) < 50) {
                        if (detected[i].conf > best.conf) best = detected[i];
                    } else {
                        finalSkills.push(best);
                        best = detected[i];
                    }
                }
                finalSkills.push(best);
            }
            
            finalSkills = finalSkills.slice(0, 3); // 최대 3개까지만 가져오기
            if(finalSkills[0]) document.getElementById(playerKey + 'Skill1').value = finalSkills[0].name;
            if(finalSkills[1]) document.getElementById(playerKey + 'Skill2').value = finalSkills[1].name;
            if(finalSkills[2]) document.getElementById(playerKey + 'Skill3').value = finalSkills[2].name;

            const tiers = finalSkills.map(s => s.tier);
            if(tiers.includes("Apex")) document.getElementById(playerKey + 'Ascension').value = "3";
            else if(tiers.includes("Mega")) document.getElementById(playerKey + 'Ascension').value = "1";
            
            console.log(`[성공] 발견된 스킬 (${finalSkills.length}개):`, finalSkills);

        } catch (e) { 
            console.error("[치명적 에러] 스킬 분석 중 에러 발생:", e);
        }
    }

    parsedData[playerKey].stats = {}; 
    try {
        for (let i = 0; i < files.length; i++) {
            statusEl.innerText = `⏳ ${i + 1}/${files.length}번째 이미지 텍스트 옵션 스캔 중...`;
            
            const imgUrl = URL.createObjectURL(files[i]);
            const { data: { text } } = await Tesseract.recognize(imgUrl, 'kor+eng');
            URL.revokeObjectURL(imgUrl); 

            const cleanText = text.replace(/\s+/g, '');
            const regex = /([+-]?)(\d+[\.,]?\d*)[^a-zA-Z가-힣0-9]*([a-zA-Z가-힣]+)/g;
            let match;
            
            while ((match = regex.exec(cleanText)) !== null) {
                let value = parseFloat(match[2].replace(',', '.'));
                if (match[1] === '-') value = -value;
                if (Math.abs(value) > 30000) continue;

                const statName = normalizeStatName(match[3]);
                if (statName) parsedData[playerKey].stats[statName] = value;
            }
        }
        
        renderOptionList(parsedData[playerKey].stats, listId);
        statusEl.innerText = `✅ 분석 완료! 결과를 확인하세요.`;
        statusEl.style.color = "#4ade80";

    } catch (e) {
        console.error("[치명적 에러] Tesseract 스캔 중 에러:", e);
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
