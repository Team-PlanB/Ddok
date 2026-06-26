"use client";

import { Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { STATUS_COLOR } from "@/lib/colors";
import {
  STATUS_LABELS,
  type Category,
  type Matrix,
  type MatrixRow,
} from "@/lib/tasks";

export default function StatusMatrix({ matrix }: { matrix: Matrix }) {
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
