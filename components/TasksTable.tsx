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

type Filter = "all" | Status;

const FILTER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "todo", label: STATUS_LABELS.todo },
  { value: "doing", label: STATUS_LABELS.doing },
  { value: "done", label: STATUS_LABELS.done },
];

export default function TasksTable({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const { message } = App.useApp();

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.status === filter)),
    [tasks, filter],
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
      <Segmented
        value={filter}
        onChange={(value) => setFilter(value as Filter)}
        options={FILTER_OPTIONS}
      />
      <Table<Task>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={pending}
        pagination={false}
        locale={{ emptyText: "등록된 화면이 없습니다. 위에서 추가해 보세요." }}
      />
    </Flex>
  );
}
