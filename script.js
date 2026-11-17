const url = "/.netlify/functions/event";

let dataDiv = document.getElementById("dataDiv");
let watchButton = document.getElementById("what");
let gu = document.getElementById("gu");
let message = document.getElementById("message");

let eventList = null;

// 화면에 사용할 텍스트 요소 생성
function makeText(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  return element;
}

// 이미지와 홈페이지에 HTTP/HTTPS 주소만 사용
function safeUrl(value) {
  if (!value) return null;

  try {
    const address = new URL(value);

    if (
      address.protocol === "http:" ||
      address.protocol === "https:"
    ) {
      return address.href;
    }
  } catch {
    return null;
  }

  return null;
}

// API에서 받은 CODENAME 전체를 확인하고 누락된 분야 추가
function addCategories() {
  const categories = [...new Set(
    eventList.map(event => event.CODENAME).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, "ko"));

  console.log("조회 데이터의 전체 공연분야(CODENAME):", categories);

  const existing = new Set(
    Array.from(gu.options).map(option => option.value)
  );

  for (const category of categories) {
    if (!existing.has(category)) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      gu.appendChild(option);
      existing.add(category);
    }
  }
}

function showEvents() {
  // 재검색할 때 이전 검색 결과 삭제
  dataDiv.replaceChildren();

  let gus = gu.options[gu.selectedIndex].value;

  if (gus === "") {
    message.textContent = "공연 분야를 선택한 뒤 검색하세요.";
    return;
  }

  let count = 0;

  for (let i = 0; i < eventList.length; i++) {
    if (gus === eventList[i].CODENAME) {
      const event = eventList[i];

      const div = document.createElement("div");
      div.setAttribute("class", "dataItem");

      const card = document.createElement("div");
      card.setAttribute("class", "card event-card");

      const imageUrl = safeUrl(event.MAIN_IMG);

      if (imageUrl) {
        const image = document.createElement("img");
        image.className = "card-img-top";
        image.src = imageUrl;
        image.alt = event.TITLE || "공연 포스터";
        image.loading = "lazy";

        image.addEventListener("error", () => {
          image.style.display = "none";
        }, { once: true });

        card.appendChild(image);
      }

      const body = document.createElement("div");
      body.className = "card-body";

      body.appendChild(
        makeText("p", "제목: " + (event.TITLE || "정보 없음"))
      );

      body.appendChild(
        makeText("p", "공연기간: " + (event.DATE || "정보 없음"))
      );

      body.appendChild(
        makeText("p", "공연장: " + (event.PLACE || "정보 없음"))
      );

      const homepage =
        safeUrl(event.ORG_LINK) || safeUrl(event.HMPG_ADDR);

      if (homepage) {
        const link = document.createElement("a");
        link.href = homepage;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "홈페이지 바로가기";
        body.appendChild(link);
      }

      card.appendChild(body);
      div.appendChild(card);

      dataDiv.appendChild(div);
      count++;
    }
  }

  message.textContent =
    count > 0
      ? gus + " 분야 검색 결과: " + count + "건"
      : "조회한 데이터에 해당 분야의 행사가 없습니다.";
}

async function getEvent() {
  watchButton.disabled = true;
  message.textContent = "공연 정보를 불러오는 중입니다.";

  try {
    if (eventList === null) {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          "API 또는 강의자료 프록시 요청 실패: HTTP " +
          response.status
        );
      }

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "JSON 데이터가 아닌 응답을 받았습니다. " +
          "강의자료 프록시의 동작 상태를 확인해야 합니다."
        );
      }

      console.log("API 응답:", data);

      const service = data.culturalEventInfo;
      const result = service?.RESULT || data.RESULT;

      if (result?.CODE === "INFO-200") {
        eventList = [];
      } else {
        if (result?.CODE && result.CODE !== "INFO-000") {
          throw new Error(result.CODE + ": " + result.MESSAGE);
        }

        if (!service || !Array.isArray(service.row)) {
          throw new Error("문화행사 데이터 형식이 올바르지 않습니다.");
        }

        eventList = service.row;
      }

      console.log("행사 목록:", eventList);
      addCategories();
    }

    showEvents();
  } catch (error) {
    message.textContent = "조회 실패: " + error.message;
    console.error(error);
  } finally {
    watchButton.disabled = false;
  }
}

// 강의자료와 같이 처음 열었을 때 API 조회
window.onload = function () {
  getEvent();
};

// 검색 버튼을 클릭하면 선택한 분야 출력
watchButton.addEventListener("click", () => {
  getEvent();
});
