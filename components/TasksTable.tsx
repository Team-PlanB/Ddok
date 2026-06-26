"use client";

import { useMemo, useState, useTransition } from "react";
import {
  App,
  Button,
  Flex,
  Popconfirm,
  Segmented,
  Select,
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

export default function TasksTable({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const { message } = App.useApp();

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

  const columns: ColumnsType<Task> = [
    {
      title: "화면명",
      dataIndex: "name",
      render: (_, task) => (
        <Typography.Text
          editable={{
            onChange: (value) => {
              const name = value.trim();
              if (name && name !== task.name) {
                run(() => updateTask(task.id, name, task.category));
              }
            },
          }}
        >
          {task.name}
        </Typography.Text>
      ),
    },
    {
      title: "직군",
      dataIndex: "category",
      width: 140,
      render: (_, task) => (
        <Select<Category>
          value={task.category}
          style={{ width: 120 }}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          onChange={(value) => run(() => updateTask(task.id, task.name, value))}
        />
      ),
    },
    {
      title: "상태",
      dataIndex: "status",
      width: 140,
      render: (_, task) => (
        <Select<Status>
          value={task.status}
          style={{ width: 120 }}
          options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          onChange={(value) => run(() => updateTaskStatus(task.id, value))}
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_, task) => (
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
      ),
    },
  ];

  return (
    <Flex vertical gap={16}>
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
      <Table<Task>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={pending}
        pagination={false}
        locale={{ emptyText: "조건에 맞는 화면이 없습니다." }}
      />
    </Flex>
  );
}
