import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Space,
  Switch,
  Tabs,
  Tag,
  Modal,
  Form,
  Input,
  Drawer,
  Alert,
  Tooltip,
  Typography,
  Popconfirm,
  message,
} from 'antd';
import {
  DownloadOutlined,
  LockOutlined,
  ReloadOutlined,
  DeleteOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import type {
  RoyaltyReport,
  RoyaltySnapshot,
  RoyaltySnapshotDetail,
  RoyaltyBookLine,
  RoyaltyAuthorLine,
  RoyaltySnapshotLine,
} from '../types';
import {
  getRoyaltyReport,
  getRoyaltySnapshots,
  getRoyaltySnapshot,
  createRoyaltySnapshot,
  deleteRoyaltySnapshot,
  rebuildListeningLedger,
} from '../api';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const DATE = 'YYYY-MM-DD';

/** The two halves of a year, which is how authors are paid. */
function halfYear(which: 'first' | 'second', year: number): [Dayjs, Dayjs] {
  return which === 'first'
    ? [dayjs(`${year}-01-01`), dayjs(`${year}-06-30`)]
    : [dayjs(`${year}-07-01`), dayjs(`${year}-12-31`)];
}

function defaultPeriod(): [Dayjs, Dayjs] {
  const now = dayjs();
  return now.month() < 6 ? halfYear('first', now.year()) : halfYear('second', now.year());
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(filename: string, header: string[], rows: unknown[][]) {
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  // A BOM, so Excel opens Devanagari book titles correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Royalty() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>(defaultPeriod);
  const [includeGuests, setIncludeGuests] = useState(true);
  const [report, setReport] = useState<RoyaltyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const [snapshots, setSnapshots] = useState<RoyaltySnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [openSnapshot, setOpenSnapshot] = useState<RoyaltySnapshotDetail | null>(null);

  const [freezeOpen, setFreezeOpen] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [form] = Form.useForm();

  const from = range[0].format(DATE);
  const to = range[1].format(DATE);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      setReport(await getRoyaltyReport(from, to, includeGuests));
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to load royalty report');
    } finally {
      setLoading(false);
    }
  }, [from, to, includeGuests]);

  const fetchSnapshots = useCallback(async () => {
    setSnapshotsLoading(true);
    try {
      setSnapshots(await getRoyaltySnapshots());
    } catch {
      message.error('Failed to load frozen periods');
    } finally {
      setSnapshotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const freeze = async () => {
    const values = await form.validateFields();
    setFreezing(true);
    try {
      const snapshot = await createRoyaltySnapshot({
        label: values.label,
        notes: values.notes || undefined,
        period_start: from,
        period_end: to,
        include_guests: includeGuests,
      });
      const books = snapshot.line_count === 1 ? '1 book' : `${snapshot.line_count} books`;
      message.success(`Froze “${snapshot.label}” — ${books}`);
      setFreezeOpen(false);
      form.resetFields();
      fetchSnapshots();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Failed to freeze the period');
    } finally {
      setFreezing(false);
    }
  };

  const removeSnapshot = async (id: string) => {
    try {
      await deleteRoyaltySnapshot(id);
      message.success('Frozen period deleted');
      setOpenSnapshot(null);
      fetchSnapshots();
    } catch {
      message.error('Failed to delete');
    }
  };

  const rebuild = async () => {
    try {
      const result = await rebuildListeningLedger(from, to);
      message.success(
        `Rebuilt from ${result.events_read} events — ${result.entries_written} ledger rows`
      );
      fetchReport();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Rebuild failed');
    }
  };

  const exportBooks = () => {
    if (!report) return;
    downloadCsv(
      `royalty-by-book-${from}-to-${to}.csv`,
      ['Book', 'Authors', 'Publisher', 'Hours listened', 'Seconds listened', 'Listeners', 'Devices', 'Share %'],
      report.books.map((b) => [
        b.book_title, b.author_names.join('; '), b.publisher_name ?? '',
        b.hours_listened, b.seconds_listened, b.unique_listeners, b.unique_devices, b.share_percentage,
      ])
    );
  };

  const exportAuthors = () => {
    if (!report) return;
    downloadCsv(
      `royalty-by-author-${from}-to-${to}.csv`,
      ['Author', 'Books', 'Hours listened', 'Seconds listened', 'Share %'],
      report.authors.map((a) => [
        a.author_name, a.books, a.hours_listened, a.seconds_listened, a.share_percentage,
      ])
    );
  };

  const exportSnapshot = (snapshot: RoyaltySnapshotDetail) => {
    downloadCsv(
      `royalty-${snapshot.label.replace(/\s+/g, '-').toLowerCase()}.csv`,
      ['Book', 'Authors', 'Publisher', 'Hours listened', 'Seconds listened', 'Listeners', 'Devices', 'Share %'],
      snapshot.lines.map((l) => [
        l.book_title, l.author_names, l.publisher_name ?? '',
        l.hours_listened, l.seconds_listened, l.unique_listeners, l.unique_devices, l.share_percentage,
      ])
    );
  };

  const bookColumns: ColumnsType<RoyaltyBookLine> = [
    { title: 'Book', dataIndex: 'book_title', key: 'book_title' },
    {
      title: 'Authors',
      dataIndex: 'author_names',
      key: 'author_names',
      render: (names: string[]) => names.join(', ') || <Text type="secondary">—</Text>,
    },
    {
      title: 'Hours listened',
      dataIndex: 'hours_listened',
      key: 'hours_listened',
      align: 'right',
      sorter: (a, b) => a.seconds_listened - b.seconds_listened,
      defaultSortOrder: 'descend',
    },
    { title: 'Listeners', dataIndex: 'unique_listeners', key: 'unique_listeners', align: 'right' },
    { title: 'Devices', dataIndex: 'unique_devices', key: 'unique_devices', align: 'right' },
    {
      title: 'Share',
      dataIndex: 'share_percentage',
      key: 'share_percentage',
      align: 'right',
      render: (value: number) => `${value}%`,
    },
  ];

  const authorColumns: ColumnsType<RoyaltyAuthorLine> = [
    { title: 'Author', dataIndex: 'author_name', key: 'author_name' },
    { title: 'Books', dataIndex: 'books', key: 'books', align: 'right' },
    {
      title: 'Hours listened',
      dataIndex: 'hours_listened',
      key: 'hours_listened',
      align: 'right',
      sorter: (a, b) => a.seconds_listened - b.seconds_listened,
      defaultSortOrder: 'descend',
    },
    {
      title: (
        <Tooltip title="Share of all listening in the period. A book with two authors is split equally between them.">
          <span>Share</span>
        </Tooltip>
      ),
      dataIndex: 'share_percentage',
      key: 'share_percentage',
      align: 'right',
      render: (value: number) => `${value}%`,
    },
  ];

  const snapshotColumns: ColumnsType<RoyaltySnapshot> = [
    { title: 'Period', dataIndex: 'label', key: 'label' },
    {
      title: 'Dates',
      key: 'dates',
      render: (_, row) => `${dayjs(row.period_start).format('DD MMM YYYY')} – ${dayjs(row.period_end).format('DD MMM YYYY')}`,
    },
    { title: 'Books', dataIndex: 'line_count', key: 'line_count', align: 'right' },
    { title: 'Hours', dataIndex: 'total_hours', key: 'total_hours', align: 'right' },
    {
      title: 'Guests',
      dataIndex: 'include_guests',
      key: 'include_guests',
      render: (value: boolean) => (value ? <Tag color="blue">Included</Tag> : <Tag>Excluded</Tag>),
    },
    {
      title: 'Frozen',
      key: 'generated_at',
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Text>{dayjs(row.generated_at).format('DD MMM YYYY HH:mm')}</Text>
          {row.generated_by_name && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              by {row.generated_by_name}
            </Text>
          )}
        </Space>
      ),
    },
  ];

  const snapshotLineColumns: ColumnsType<RoyaltySnapshotLine> = [
    { title: 'Book', dataIndex: 'book_title', key: 'book_title' },
    { title: 'Authors', dataIndex: 'author_names', key: 'author_names' },
    { title: 'Hours', dataIndex: 'hours_listened', key: 'hours_listened', align: 'right' },
    { title: 'Listeners', dataIndex: 'unique_listeners', key: 'unique_listeners', align: 'right' },
    {
      title: 'Share',
      dataIndex: 'share_percentage',
      key: 'share_percentage',
      align: 'right',
      render: (value: number) => `${value}%`,
    },
  ];

  const year = dayjs().year();

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        Royalty
      </Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="What these numbers are"
        description={
          <>
            Hours here are audio <b>actually played</b>, recorded day by day as it happens and never
            rewritten — so a past period reports the same figures however long after the fact you ask.
            Skipping ahead earns nothing; a book heard at double speed still counts in full. Dates
            follow the {report?.timezone || 'local'} calendar. Freeze a period before paying on it:
            a frozen period keeps its numbers even if late events arrive or a book is renamed.
          </>
        }
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <RangePicker
          value={range}
          allowClear={false}
          onChange={(value) => value && setRange(value as [Dayjs, Dayjs])}
        />
        <Button onClick={() => setRange(halfYear('first', year))}>Jan–Jun {year}</Button>
        <Button onClick={() => setRange(halfYear('second', year))}>Jul–Dec {year}</Button>
        <Button onClick={() => setRange(halfYear('second', year - 1))}>Jul–Dec {year - 1}</Button>
        <Tooltip title="Count listening from devices whose owner never signed in">
          <Space size={6}>
            <Switch checked={includeGuests} onChange={setIncludeGuests} size="small" />
            <Text>Include guests</Text>
          </Space>
        </Tooltip>
        <Button icon={<ReloadOutlined />} onClick={fetchReport}>
          Refresh
        </Button>
        <Button type="primary" icon={<LockOutlined />} onClick={() => setFreezeOpen(true)} disabled={!report}>
          Freeze this period
        </Button>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Hours listened" value={report?.total_hours ?? 0} loading={loading} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Books with listening" value={report?.books.length ?? 0} loading={loading} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Signed-in listeners" value={report?.total_listeners ?? 0} loading={loading} />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card size="small">
            <Statistic title="Devices" value={report?.total_devices ?? 0} loading={loading} />
          </Card>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="books"
        items={[
          {
            key: 'books',
            label: 'By book',
            children: (
              <>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportBooks}
                  disabled={!report?.books.length}
                  style={{ marginBottom: 12 }}
                >
                  Export CSV
                </Button>
                <Table<RoyaltyBookLine>
                  rowKey={(row) => row.book_id || row.book_title}
                  columns={bookColumns}
                  dataSource={report?.books || []}
                  loading={loading}
                  pagination={{ pageSize: 20, showTotal: (count) => `${count} books` }}
                  locale={{ emptyText: 'No listening recorded in this period' }}
                />
              </>
            ),
          },
          {
            key: 'authors',
            label: 'By author',
            children: (
              <>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={exportAuthors}
                  disabled={!report?.authors.length}
                  style={{ marginBottom: 12 }}
                >
                  Export CSV
                </Button>
                <Table<RoyaltyAuthorLine>
                  rowKey={(row) => row.author_id || row.author_name}
                  columns={authorColumns}
                  dataSource={report?.authors || []}
                  loading={loading}
                  pagination={{ pageSize: 20, showTotal: (count) => `${count} authors` }}
                  locale={{ emptyText: 'No listening recorded in this period' }}
                />
              </>
            ),
          },
          {
            key: 'snapshots',
            label: `Frozen periods${snapshots.length ? ` (${snapshots.length})` : ''}`,
            children: (
              <>
                <Space style={{ marginBottom: 12 }}>
                  <Button icon={<ReloadOutlined />} onClick={fetchSnapshots}>
                    Refresh
                  </Button>
                  <Popconfirm
                    title="Rebuild the ledger for this period?"
                    description="Recomputes the selected period from the raw event log. Frozen periods are not affected."
                    onConfirm={rebuild}
                    okText="Rebuild"
                  >
                    <Button icon={<SyncOutlined />}>Rebuild ledger ({from} → {to})</Button>
                  </Popconfirm>
                </Space>
                <Table<RoyaltySnapshot>
                  rowKey="id"
                  columns={snapshotColumns}
                  dataSource={snapshots}
                  loading={snapshotsLoading}
                  pagination={false}
                  locale={{ emptyText: 'No periods frozen yet' }}
                  onRow={(row) => ({
                    style: { cursor: 'pointer' },
                    onClick: async () => {
                      try {
                        setOpenSnapshot(await getRoyaltySnapshot(row.id));
                      } catch {
                        message.error('Failed to open the frozen period');
                      }
                    },
                  })}
                />
              </>
            ),
          },
        ]}
      />

      <Modal
        open={freezeOpen}
        title="Freeze this period"
        okText="Freeze"
        confirmLoading={freezing}
        onOk={freeze}
        onCancel={() => setFreezeOpen(false)}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`${dayjs(from).format('DD MMM YYYY')} – ${dayjs(to).format('DD MMM YYYY')}, guests ${
            includeGuests ? 'included' : 'excluded'
          }`}
          description="The figures as they stand right now are copied and kept. Later listening will not change them."
        />
        <Form form={form} layout="vertical">
          <Form.Item
            name="label"
            label="Name this period"
            rules={[{ required: true, message: 'Give the period a name' }]}
          >
            <Input placeholder={`e.g. ${dayjs(from).format('MMM YYYY')} – ${dayjs(to).format('MMM YYYY')} payout`} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Anything worth recording about this payout" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={!!openSnapshot}
        onClose={() => setOpenSnapshot(null)}
        width={820}
        title={openSnapshot?.label}
        extra={
          openSnapshot && (
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => exportSnapshot(openSnapshot)}>
                Export CSV
              </Button>
              <Popconfirm
                title="Delete this frozen period?"
                description="Only do this for a snapshot taken by mistake."
                onConfirm={() => removeSnapshot(openSnapshot.id)}
                okText="Delete"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {openSnapshot && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Statistic title="Hours listened" value={openSnapshot.total_hours} />
              </Col>
              <Col span={8}>
                <Statistic title="Books" value={openSnapshot.line_count} />
              </Col>
              <Col span={8}>
                <Statistic title="Guests" value={openSnapshot.include_guests ? 'Included' : 'Excluded'} />
              </Col>
            </Row>
            <Text type="secondary">
              {dayjs(openSnapshot.period_start).format('DD MMM YYYY')} –{' '}
              {dayjs(openSnapshot.period_end).format('DD MMM YYYY')} · frozen{' '}
              {dayjs(openSnapshot.generated_at).format('DD MMM YYYY HH:mm')}
              {openSnapshot.generated_by_name ? ` by ${openSnapshot.generated_by_name}` : ''}
            </Text>
            {openSnapshot.notes && (
              <Alert type="info" style={{ marginTop: 12 }} message={openSnapshot.notes} />
            )}
            <Table<RoyaltySnapshotLine>
              style={{ marginTop: 16 }}
              rowKey={(row) => row.book_id || row.book_title}
              size="small"
              columns={snapshotLineColumns}
              dataSource={openSnapshot.lines}
              pagination={false}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}

export default Royalty;
