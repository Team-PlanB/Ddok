import { ImageResponse } from "next/og";

// 슬랙 일일 요약용 차트 이미지(PNG). 사이디 브랜드 컬러로 카드형 통계 + 직군별 막대.
// 쿼리: total, done, doing, todo, date, cats(JSON: [[name, done, total], ...])
// 공개 라우트(슬랙이 unauth로 fetch). 집계 수치만 받으므로 민감정보 없음.

const PRIMARY = "#3368FF";
const TRACK = "#EBF0FF";
const CARD_BG = "#F4F7FF";
const INK = "#111827";
const SUB = "#6B7280";

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

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function Bar({ percent, height = 18 }: { percent: number; height?: number }) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height,
        backgroundColor: TRACK,
        borderRadius: 999,
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          backgroundColor: PRIMARY,
          borderRadius: 999,
        }}
      />
    </div>
  );
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const n = (k: string) => Number(sp.get(k) ?? 0) || 0;
  const total = n("total");
  const done = n("done");
  const doing = n("doing");
  const todo = n("todo");
  const date = sp.get("date") ?? "";

  let cats: [string, number, number][] = [];
  try {
    cats = JSON.parse(sp.get("cats") ?? "[]");
  } catch {
    cats = [];
  }

  const overall = pct(done, total);
  const fonts = await loadFonts();
  const width = 800;
  const height = total === 0 ? 320 : 540 + cats.length * 72;

  const stats: [string, number][] = [
    ["완료", done],
    ["진행중", doing],
    ["대기", todo],
    ["전체", total],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#FFFFFF",
          padding: 52,
          fontFamily: "Pretendard",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 30 }}>
          <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: INK }}>
            Ddok 일일 요약
          </div>
          <div style={{ display: "flex", fontSize: 24, color: SUB, marginTop: 6 }}>
            Sidee · {date}
          </div>
        </div>

        {total === 0 ? (
          <div style={{ display: "flex", fontSize: 28, color: SUB }}>
            등록된 화면이 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* 전체 진행률 */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: SUB }}>
                  전체 진행률
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", fontSize: 60, fontWeight: 700, color: PRIMARY }}>
                    {overall}%
                  </div>
                  <div style={{ display: "flex", fontSize: 22, color: SUB, marginLeft: 12, marginBottom: 10 }}>
                    {done}/{total} 완료
                  </div>
                </div>
              </div>
              <Bar percent={overall} height={24} />
            </div>

            {/* 통계 카드 */}
            <div style={{ display: "flex", gap: 16, marginBottom: 34 }}>
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    backgroundColor: CARD_BG,
                    borderRadius: 18,
                    padding: "24px 26px",
                  }}
                >
                  <div style={{ display: "flex", fontSize: 20, color: SUB }}>{label}</div>
                  <div style={{ display: "flex", fontSize: 50, fontWeight: 700, color: INK, marginTop: 6 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* 직군별 진행률 */}
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: INK, marginBottom: 18 }}>
              직군별 진행률
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {cats.map(([name, cdone, ctotal]) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", fontSize: 23, fontWeight: 600, color: INK }}>
                      {name}
                    </div>
                    <div style={{ display: "flex", fontSize: 20, color: SUB }}>
                      {pct(cdone, ctotal)}% ({cdone}/{ctotal})
                    </div>
                  </div>
                  <Bar percent={pct(cdone, ctotal)} height={16} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ),
    { width, height, fonts },
  );
}
