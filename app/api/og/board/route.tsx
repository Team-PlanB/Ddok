import { ImageResponse } from "next/og";
import { SIDEE, STATUS_COLOR } from "@/lib/colors";
import { STATUS_LABELS, type Status } from "@/lib/tasks";

// 현황판(화면×직군 매트릭스) 이미지(PNG). 데이터는 쿼리로만 전달(공개 DB 노출 없음).
// 쿼리: date, cols(JSON: string[]), rows(JSON: [name, digits][])  digit: 0=없음/1=대기/2=진행중/3=완료

const FONT_BASE =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static";

async function loadFonts() {
  const [semibold, bold] = await Promise.all([
    fetch(`${FONT_BASE}/Pretendard-SemiBold.otf`).then((r) => r.arrayBuffer()),
    fetch(`${FONT_BASE}/Pretendard-Bold.otf`).then((r) => r.arrayBuffer()),
  ]);
  return [
    { name: "Pretendard", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Pretendard", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

const DIGIT_STATUS: Record<string, Status | undefined> = {
  "1": "todo",
  "2": "doing",
  "3": "done",
};

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const date = sp.get("date") ?? "";
  let cols: string[] = [];
  let rows: [string, string][] = [];
  try {
    cols = JSON.parse(sp.get("cols") ?? "[]");
  } catch {
    cols = [];
  }
  try {
    rows = JSON.parse(sp.get("rows") ?? "[]");
  } catch {
    rows = [];
  }

  const fonts = await loadFonts();
  const NAME_W = 220;
  const COL_W = 120;
  const ROW_H = 46;
  const PAD = 48;
  const width = Math.max(480, PAD * 2 + NAME_W + cols.length * COL_W);
  const height =
    rows.length === 0 ? 260 : PAD * 2 + 74 + 46 + rows.length * ROW_H + 8;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          padding: PAD,
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: SIDEE.gray900 }}>
            Ddok 현황판
          </div>
          <div style={{ display: "flex", fontSize: 18, color: SIDEE.gray500, marginTop: 4 }}>
            Sidee · {date}
          </div>
        </div>

        {rows.length === 0 ? (
          <div style={{ display: "flex", fontSize: 20, color: SIDEE.gray500 }}>
            등록된 화면이 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* 헤더 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                height: 46,
                borderBottomWidth: 2,
                borderBottomStyle: "solid",
                borderBottomColor: SIDEE.gray200,
              }}
            >
              <div style={{ display: "flex", width: NAME_W, fontSize: 18, fontWeight: 700, color: SIDEE.gray800 }}>
                화면
              </div>
              {cols.map((c) => (
                <div
                  key={c}
                  style={{ display: "flex", width: COL_W, justifyContent: "center", fontSize: 17, fontWeight: 600, color: SIDEE.gray600 }}
                >
                  {c}
                </div>
              ))}
            </div>

            {/* 본문 */}
            {rows.map(([name, digits]) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: ROW_H,
                  borderBottomWidth: 1,
                  borderBottomStyle: "solid",
                  borderBottomColor: SIDEE.gray100,
                }}
              >
                <div style={{ display: "flex", width: NAME_W, fontSize: 17, fontWeight: 600, color: SIDEE.gray900 }}>
                  {name}
                </div>
                {cols.map((c, ci) => {
                  const status = DIGIT_STATUS[digits[ci] ?? "0"];
                  return (
                    <div key={c} style={{ display: "flex", width: COL_W, justifyContent: "center" }}>
                      {status ? (
                        <div
                          style={{
                            display: "flex",
                            backgroundColor: STATUS_COLOR[status],
                            color: "#FFFFFF",
                            fontSize: 14,
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: 999,
                          }}
                        >
                          {STATUS_LABELS[status]}
                        </div>
                      ) : (
                        <div style={{ display: "flex", color: SIDEE.gray400, fontSize: 16 }}>—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { width, height, fonts },
  );
}
