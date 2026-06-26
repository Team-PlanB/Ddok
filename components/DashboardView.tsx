"use client";

import { Card, Empty, Flex, Progress, Statistic, Typography } from "antd";
import { STATUS_LABELS, type Summary } from "@/lib/tasks";

export default function DashboardView({ summary }: { summary: Summary }) {
  if (summary.total === 0) {
    return (
      <Empty description="등록된 화면이 없습니다. 체크리스트에서 추가해 보세요." />
    );
  }

  return (
    <Flex vertical gap={24}>
      <Card>
        <Flex align="center" gap={48} wrap>
          <Progress type="circle" percent={summary.percent} />
          <Flex gap={48} wrap>
            <Statistic title="전체" value={summary.total} />
            <Statistic title={STATUS_LABELS.done} value={summary.done} />
            <Statistic title={STATUS_LABELS.doing} value={summary.doing} />
            <Statistic title={STATUS_LABELS.todo} value={summary.todo} />
          </Flex>
        </Flex>
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
