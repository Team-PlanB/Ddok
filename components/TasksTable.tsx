"use client";

import { useMemo, useState, useTransition } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Grid,
  Popconfirm,
  Segmented,
  Select,
  Spin,
  Table,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { deleteTask, updateTask, updateTaskStatus } from "@/app/actions";
import {
  CATEGORIES,
  STATUS_LABELS,
  STATUSES,
  type Category,
  type Status,
  type Task,
} from "@/lib/tasks";

type StatusFilter = "all" | Status;
type CategoryFilter = "all" | Category;

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "todo", label: STATUS_LABELS.todo },
  { value: "doing", label: STATUS_LABELS.doing },
  { value: "done", label: STATUS_LABELS.done },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "직군 전체" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const STATUS_OPTIONS = STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export default function TasksTable({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (statusFilter === "all" || t.status === statusFilter) &&
          (categoryFilter === "all" || t.category === categoryFilter),
      ),
    [tasks, statusFilter, categoryFilter],
  );

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        message.error(e instanceof Error ? e.message : "오류가 발생했습니다.");
      }
    });
  }

  function CategorySelect({ task }: { task: Task }) {
    return (
      <Select<Category>
        value={task.category}
        style={{ width: isMobile ? "100%" : 120 }}
        options={CATEGORY_OPTIONS}
        onChange={(value) => run(() => updateTask(task.id, task.name, value))}
      />
    );
  }

  function StatusSelect({ task }: { task: Task }) {
    return (
      <Select<Status>
        value={task.status}
        style={{ width: isMobile ? "100%" : 120 }}
        options={STATUS_OPTIONS}
        onChange={(value) => run(() => updateTaskStatus(task.id, value))}
      />
    );
  }

  function DeleteButton({ task }: { task: Task }) {
    return (
      <Popconfirm
        title="이 항목을 삭제할까요?"
        okText="삭제"
        cancelText="취소"
        onConfirm={() => run(() => deleteTask(task.id))}
      >
        <Button type="text" size="small">
          삭제
        </Button>
      </Popconfirm>
    );
  }

  const filters = (
    <Flex gap={12} wrap align="center">
      <Segmented
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as StatusFilter)}
        options={STATUS_FILTER_OPTIONS}
      />
      <Select
        value={categoryFilter}
        style={{ width: 140 }}
        onChange={(value) => setCategoryFilter(value as CategoryFilter)}
        options={CATEGORY_FILTER_OPTIONS}
      />
    </Flex>
  );

  // 모바일: 화면당 카드(가로 스크롤 없이 세로로)
  if (isMobile) {
    return (
      <Flex vertical gap={16}>
        {filters}
        <Spin spinning={pending}>
          {filtered.length === 0 ? (
            <Empty description="조건에 맞는 화면이 없습니다." />
          ) : (
            <Flex vertical gap={12}>
              {filtered.map((task) => (
                <Card key={task.id} size="small">
                  <Flex vertical gap={12}>
                    <Flex justify="space-between" align="center" gap={8}>
                      <Typography.Text strong>{task.name}</Typography.Text>
                      <DeleteButton task={task} />
                    </Flex>
                    <Flex gap={8}>
                      <div style={{ flex: 1 }}>
                        <CategorySelect task={task} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <StatusSelect task={task} />
                      </div>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </Spin>
      </Flex>
    );
  }

  // 데스크톱/태블릿: 테이블
  const columns: ColumnsType<Task> = [
    {
      title: "화면명",
      dataIndex: "name",
    },
    {
      title: "직군",
      dataIndex: "category",
      width: 140,
      render: (_, task) => <CategorySelect task={task} />,
    },
    {
      title: "상태",
      dataIndex: "status",
      width: 140,
      render: (_, task) => <StatusSelect task={task} />,
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, task) => <DeleteButton task={task} />,
    },
  ];

  return (
    <Flex vertical gap={16}>
      {filters}
      <Table<Task>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={pending}
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "조건에 맞는 화면이 없습니다." }}
      />
    </Flex>
  );
}
