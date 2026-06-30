"use client";

import { Card, Col, Empty, Flex, Grid, Row, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { STATUS_COLOR } from "@/lib/colors";
import {
  STATUS_LABELS,
  type Category,
  type Matrix,
  type MatrixRow,
} from "@/lib/tasks";

export default function StatusMatrix({ matrix }: { matrix: Matrix }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  // 모바일: 화면당 카드 + 직군별 상태(2열 그리드), 가로 스크롤 없이 세로로
  if (isMobile) {
    if (matrix.rows.length === 0) {
      return <Empty description="등록된 화면이 없습니다." />;
    }
    return (
      <Flex vertical gap={12}>
        {matrix.rows.map((row) => (
          <Card key={row.name} size="small" title={row.name}>
            <Row gutter={[8, 8]}>
              {matrix.columns.map((category) => {
                const status = row.cells[category];
                return (
                  <Col span={12} key={category}>
                    <Flex justify="space-between" align="center" gap={8}>
                      <Typography.Text type="secondary">
                        {category}
                      </Typography.Text>
                      {status ? (
                        <Tag color={STATUS_COLOR[status]} style={{ marginInlineEnd: 0 }}>
                          {STATUS_LABELS[status]}
                        </Tag>
                      ) : (
                        <Typography.Text type="secondary">—</Typography.Text>
                      )}
                    </Flex>
                  </Col>
                );
              })}
            </Row>
          </Card>
        ))}
      </Flex>
    );
  }

  // 데스크톱/태블릿: 화면×직군 매트릭스 테이블
  const columns: ColumnsType<MatrixRow> = [
    {
      title: "화면",
      dataIndex: "name",
      fixed: "left",
      render: (_, row) => <Typography.Text strong>{row.name}</Typography.Text>,
    },
    ...matrix.columns.map((category: Category) => ({
      title: category,
      key: category,
      align: "center" as const,
      render: (_: unknown, row: MatrixRow) => {
        const status = row.cells[category];
        return status ? (
          <Tag color={STATUS_COLOR[status]}>{STATUS_LABELS[status]}</Tag>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    })),
  ];

  return (
    <Table<MatrixRow>
      rowKey="name"
      columns={columns}
      dataSource={matrix.rows}
      pagination={false}
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "등록된 화면이 없습니다." }}
    />
  );
}
