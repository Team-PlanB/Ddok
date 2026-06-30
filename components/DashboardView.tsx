"use client";

import { Card, Col, Empty, Flex, Progress, Row, Statistic, Typography } from "antd";
import { STATUS_LABELS, type Summary } from "@/lib/tasks";

export default function DashboardView({ summary }: { summary: Summary }) {
  if (summary.total === 0) {
    return (
      <Empty description="등록된 화면이 없습니다. 체크리스트에서 추가해 보세요." />
    );
  }

  const stats: { title: string; value: number }[] = [
    { title: "전체", value: summary.total },
    { title: STATUS_LABELS.done, value: summary.done },
    { title: STATUS_LABELS.doing, value: summary.doing },
    { title: STATUS_LABELS.todo, value: summary.todo },
  ];

  return (
    <Flex vertical gap={24}>
      <Card>
        {/* 모바일: 원형 위 중앙 + 통계 2열 / PC: 원형 좌측 + 통계 4열 */}
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Progress type="circle" percent={summary.percent} />
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              {stats.map((s) => (
                <Col key={s.title} xs={12} sm={6}>
                  <Statistic title={s.title} value={s.value} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Card title="직군별 진행률">
        <Flex vertical gap={16}>
          {summary.byCategory.map((c) => (
            <div key={c.category}>
              <Flex justify="space-between">
                <Typography.Text>{c.category}</Typography.Text>
                <Typography.Text type="secondary">
                  {c.done}/{c.total} 완료
                </Typography.Text>
              </Flex>
              <Progress percent={c.percent} />
            </div>
          ))}
        </Flex>
      </Card>
    </Flex>
  );
}
