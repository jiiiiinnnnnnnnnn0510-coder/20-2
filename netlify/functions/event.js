exports.handler = async function () {
  const headers = {
    "Content-Type": "application/json; charset=utf-8"
  };

  const apiKey = process.env.SEOUL_API_KEY?.trim();

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        RESULT: {
          CODE: "KEY-MISSING",
          MESSAGE: "SEOUL_API_KEY 환경변수를 설정하세요."
        }
      })
    };
  }

  try {
    const url =
      "http://openapi.seoul.go.kr:8088/" +
      encodeURIComponent(apiKey) +
      "/json/culturalEventInfo/1/1000";

    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error("서울시 API HTTP 오류: " + response.status);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({
        RESULT: {
          CODE: "FETCH-ERROR",
          MESSAGE: error.message
        }
      })
    };
  }
};
