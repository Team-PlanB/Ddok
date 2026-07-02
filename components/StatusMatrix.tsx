"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
  type FC,
  type HTMLAttributes,
} from "react";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Grid,
  Row,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderScreens } from "@/app/board/actions";
import { SIDEE, STATUS_COLOR } from "@/lib/colors";
import {
  isNewToday,
  STATUS_LABELS,
  type Category,
  type Matrix,
  type MatrixRow,
} from "@/lib/tasks";

// 드래그 핸들이 tr/카드로 listeners 를 전달받는 통로.
type SortableListeners = ReturnType<typeof useSortable>["listeners"];
const RowContext = createContext<{
  setActivatorNodeRef?: (el: HTMLElement | null) => void;
  listeners?: SortableListeners;
}>({});

// 아이콘 의존성 없이 문자(⠿) 핸들. touchAction:none 이라야 모바일에서 드래그가 스크롤에 안 먹힘.
function GripButton({
  setRef,
  listeners,
}: {
  setRef?: (el: HTMLElement | null) => void;
  listeners?: SortableListeners;
}) {
  return (
    <Button
      type="text"
      size="small"
      ref={setRef}
      {...listeners}
      style={{ cursor: "grab", touchAction: "none", paddingInline: 6 }}
      aria-label="드래그로 순서 변경"
    >
      ⠿
    </Button>
  );
}

// 데스크톱 테이블: 화면명 칸 안에서 쓰는 핸들(컨텍스트에서 listeners 수신).
const TableDragHandle: FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return <GripButton setRef={setActivatorNodeRef} listeners={listeners} />;
};

// 데스크톱 테이블의 <tr> 를 정렬 가능한 노드로 감싼다.
type RowProps = HTMLAttributes<HTMLTableRowElement> & { "data-row-key": string };
const SortableRow: FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });

  const style: CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 999 } : {}),
  };

  const ctx = useMemo(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={ctx}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

// 모바일: 화면 카드 하나를 정렬 가능하게. 핸들(extra)만 잡아서 끌고, 본문 터치는 스크롤.
function SortableCard({
  row,
  columns,
}: {
  row: MatrixRow;
  columns: Category[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.name });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: "relative", zIndex: 999 } : {}),
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        size="small"
        title={
          <Flex align="center" gap={8}>
            <span>{row.name}</span>
            {isNewToday(row.createdAt) && <Tag color={SIDEE.warning}>NEW</Tag>}
          </Flex>
        }
        extra={<GripButton setRef={setActivatorNodeRef} listeners={listeners} />}
      >
        <Row gutter={[8, 8]}>
          {columns.map((category) => {
            const status = row.cells[category];
            return (
              <Col span={12} key={category}>
                <Flex justify="space-between" align="center" gap={8}>
                  <Typography.Text type="secondary">{category}</Typography.Text>
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
    </div>
  );
}

export default function StatusMatrix({ matrix }: { matrix: Matrix }) {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const { message } = App.useApp();
  const [pending, startTransition] = useTransition();

  // 낙관적 로컬 순서. 서버가 새 순서를 내려주면(재검증) 동기화.
  const [rows, setRows] = useState<MatrixRow[]>(matrix.rows);
  useEffect(() => {
    setRows(matrix.rows);
  }, [matrix.rows]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // 모바일: 살짝 길게 눌러야 드래그 시작 → 빠른 스와이프는 스크롤로.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.name === active.id);
    const newIndex = rows.findIndex((r) => r.name === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(rows, oldIndex, newIndex);
    setRows(next); // 낙관적 반영
    const names = next.map((r) => r.name);
    startTransition(async () => {
      const res = await reorderScreens(names);
      if (res && "error" in res) {
        message.error(res.error);
        setRows(matrix.rows); // 실패 시 되돌리기
      }
    });
  }

  if (rows.length === 0) {
    return <Empty description="등록된 화면이 없습니다." />;
  }

  const items = rows.map((r) => r.name);

  // 모바일: 화면당 카드(세로)
  if (isMobile) {
    return (
      <DndContext
        id="board-sort"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <Spin spinning={pending}>
            <Flex vertical gap={12}>
              {rows.map((row) => (
                <SortableCard key={row.name} row={row} columns={matrix.columns} />
              ))}
            </Flex>
          </Spin>
        </SortableContext>
      </DndContext>
    );
  }

  // 데스크톱/태블릿: 화면×직군 매트릭스 테이블(화면명 칸에 드래그 핸들)
  const columns: ColumnsType<MatrixRow> = [
    {
      title: "화면",
      dataIndex: "name",
      fixed: "left",
      render: (_, row) => (
        <Flex align="center" gap={8}>
          <TableDragHandle />
          <Typography.Text strong>{row.name}</Typography.Text>
          {isNewToday(row.createdAt) && <Tag color={SIDEE.warning}>NEW</Tag>}
        </Flex>
      ),
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <Table<MatrixRow>
          rowKey="name"
          components={{ body: { row: SortableRow } }}
          columns={columns}
          dataSource={rows}
          loading={pending}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </SortableContext>
    </DndContext>
  );
}
