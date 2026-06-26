import { ImageResponse } from "next/og";

// 슬랙 일일 요약용 차트 이미지(PNG) 렌더. 사이디 브랜드 컬러로 카드형 통계 + 직군별 막대.
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

function Bar({ percent, height = 14 }: { percent: number; height?: number }) {
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
  const width = 820;
  const height = total === 0 ? 300 : 470 + cats.length * 72;

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
          padding: 48,
          fontFamily: "Pretendard",
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: INK }}>
            Ddok 일일 요약
          </div>
          <div style={{ display: "flex", fontSize: 20, color: SUB, marginTop: 4 }}>
            Sidee · {date}
          </div>
        </div>

        {total === 0 ? (
          <div style={{ display: "flex", fontSize: 22, color: SUB }}>
            등록된 화면이 없습니다.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* 전체 진행률 */}
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: SUB }}>
                  전체 진행률
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: PRIMARY }}>
                    {overall}%
                  </div>
                  <div style={{ display: "flex", fontSize: 18, color: SUB, marginLeft: 10, marginBottom: 6 }}>
                    {done}/{total} 완료
                  </div>
                </div>
              </div>
              <Bar percent={overall} height={18} />
            </div>

            {/* 통계 카드 */}
            <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
              {stats.map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    backgroundColor: CARD_BG,
                    borderRadius: 16,
                    padding: "18px 20px",
                  }}
                >
                  <div style={{ display: "flex", fontSize: 16, color: SUB }}>{label}</div>
                  <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: INK, marginTop: 4 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* 직군별 진행률 */}
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: INK, marginBottom: 16 }}>
              직군별 진행률
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {cats.map(([name, cdone, ctotal]) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", fontSize: 19, fontWeight: 600, color: INK }}>
                      {name}
                    </div>
                    <div style={{ display: "flex", fontSize: 17, color: SUB }}>
                      {pct(cdone, ctotal)}% ({cdone}/{ctotal})
                    </div>
                  </div>
                  <Bar percent={pct(cdone, ctotal)} />
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
