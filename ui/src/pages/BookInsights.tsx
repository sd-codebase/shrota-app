import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Drawer,
  Progress,
  Typography,
  Alert,
  Tooltip,
  Empty,
  Descriptions,
  message,
} from 'antd';
import {
  ReloadOutlined,
  ClearOutlined,
  HeartOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import type {
  BookInsight,
  BookInsightDetail,
  BookInsightFilters,
  InsightsSummary,
  Language,
  Genre,
  Author,
} from '../types';
import {
  getBookInsights,
  getBookInsightDetail,
  getInsightsSummary,
  getLanguages,
  getGenres,
  getAuthors,
} from '../api';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const PAGE_SIZE = 25;

// Magnitude is one hue, light to dark — never a categorical palette for
// what is a single measure. These are antd's blue ramp steps.
const BAR_HUE = '#1677ff';
const BAR_TRACK = '#f0f0f0';

function formatHours(seconds: number): string {
  if (!seconds) return '—';
  const hours = seconds / 3600;
  if (hours < 1) return `${Math.round(seconds / 60)} min`;
  return `${hours.toFixed(1)} h`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Sorter keys the API understands; anything else falls back to listeners.
const SORT_FIELDS = new Set([
  'listeners',
  'likes',
  'completion_rate',
  'listened_seconds',
  'avg_progress_percentage',
  'unique_players',
  'last_played_at',
  'title',
]);

function BookInsights() {
  const [rows, setRows] = useState<BookInsight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<InsightsSummary | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [languageId, setLanguageId] = useState<string | undefined>();
  const [genreId, setGenreId] = useState<string | undefined>();
  const [authorId, setAuthorId] = useState<string | undefined>();
  const [published, setPublished] = useState<boolean | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [sortBy, setSortBy] = useState('listeners');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Reference data for the dropdowns
  const [languages, setLanguages] = useState<Language[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);

  // Detail drawer
  const [detail, setDetail] = useState<BookInsightDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const dateFrom = range?.[0]?.startOf('day').toISOString();
  const dateTo = range?.[1]?.endOf('day').toISOString();

  const fetchRows = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const filters: BookInsightFilters = {
          search: search.trim() || undefined,
          language_ids: languageId,
          genre_ids: genreId,
          author_ids: authorId,
          is_published: published,
          date_from: dateFrom,
          date_to: dateTo,
          sort_by: sortBy,
          order,
          limit: PAGE_SIZE,
          offset: (targetPage - 1) * PAGE_SIZE,
        };
        const data = await getBookInsights(filters);
        setRows(data.books);
        setTotal(data.total);
      } catch {
        message.error('Failed to load book insights');
      } finally {
        setLoading(false);
      }
    },
    [page, search, languageId, genreId, authorId, published, dateFrom, dateTo, sortBy, order]
  );

  const fetchSummary = useCallback(async () => {
    try {
      setSummary(await getInsightsSummary(dateFrom, dateTo));
    } catch {
      /* the tiles simply stay empty */
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    Promise.all([getLanguages(), getGenres(), getAuthors()])
      .then(([l, g, a]) => {
        setLanguages(l);
        setGenres(g);
        setAuthors(a);
      })
      .catch(() => {
        /* dropdowns stay empty */
      });
  }, []);

  // Any filter change resets to page 1 — page 5 of a shorter result set is
  // just an empty table.
  useEffect(() => {
    setPage(1);
    fetchRows(1);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, languageId, genreId, authorId, published, dateFrom, dateTo, sortBy, order]);

  const openDetail = async (book: BookInsight) => {
    setDetailLoading(true);
    setDetail({ ...book, chapters: [], recent_listeners: [], view_sources: {} });
    try {
      setDetail(await getBookInsightDetail(book.book_id, dateFrom, dateTo));
    } catch {
      message.error('Failed to load book detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setLanguageId(undefined);
    setGenreId(undefined);
    setAuthorId(undefined);
    setPublished(undefined);
    setRange(null);
    setSortBy('listeners');
    setOrder('desc');
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<BookInsight> | SorterResult<BookInsight>[]
  ) => {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = single?.field as string | undefined;
    if (field && SORT_FIELDS.has(field) && single?.order) {
      setSortBy(field);
      setOrder(single.order === 'ascend' ? 'asc' : 'desc');
      return; // The filter effect refetches from page 1.
    }
    const nextPage = pagination.current || 1;
    setPage(nextPage);
    fetchRows(nextPage);
  };

  const columns: ColumnsType<BookInsight> = [
    {
      title: 'Book',
      dataIndex: 'title',
      key: 'title',
      sorter: true,
      width: 260,
      render: (title: string, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.authors.join(', ') || 'No author'}
            {record.language ? ` · ${record.language}` : ''}
          </Text>
          {!record.is_published && <Tag color="default">Unpublished</Tag>}
        </Space>
      ),
    },
    {
      title: (
        <Tooltip title="Signed-in users with listening progress on this book">
          <span>Listeners</span>
        </Tooltip>
      ),
      dataIndex: 'listeners',
      key: 'listeners',
      sorter: true,
      align: 'right',
      width: 110,
    },
    {
      title: 'Likes',
      dataIndex: 'likes',
      key: 'likes',
      sorter: true,
      align: 'right',
      width: 90,
    },
    {
      title: (
        <Tooltip title="Share of listeners who reached 95% or more">
          <span>Finished</span>
        </Tooltip>
      ),
      dataIndex: 'completion_rate',
      key: 'completion_rate',
      sorter: true,
      width: 180,
      render: (rate: number, record) =>
        record.listeners ? (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Progress
              percent={rate}
              size="small"
              strokeColor={BAR_HUE}
              trailColor={BAR_TRACK}
              format={(value) => `${value}%`}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.completed_listeners} of {record.listeners}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: (
        <Tooltip title="Average of each listener's furthest position">
          <span>Avg progress</span>
        </Tooltip>
      ),
      dataIndex: 'avg_progress_percentage',
      key: 'avg_progress_percentage',
      sorter: true,
      align: 'right',
      width: 120,
      render: (value: number) => (value ? `${value}%` : '—'),
    },
    {
      title: (
        <Tooltip title="Chapters reached on average, out of the book's total">
          <span>Chapters</span>
        </Tooltip>
      ),
      key: 'chapters',
      align: 'right',
      width: 110,
      render: (_, record) =>
        record.listeners ? `${record.avg_chapter_reached} / ${record.chapters_total}` : `— / ${record.chapters_total}`,
    },
    {
      title: (
        <Tooltip title="The chapter where the most unfinished listeners stopped">
          <span>Drop-off</span>
        </Tooltip>
      ),
      key: 'dropoff',
      width: 150,
      render: (_, record) =>
        record.dropoff_chapter_index === null || record.dropoff_chapter_index === undefined ? (
          <Text type="secondary">—</Text>
        ) : (
          <Space size={4}>
            <Tag color="orange">Ch {record.dropoff_chapter_index + 1}</Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.dropoff_listeners} stopped
            </Text>
          </Space>
        ),
    },
    {
      title: (
        <Tooltip title="Total listening time recorded against this book">
          <span>Listened</span>
        </Tooltip>
      ),
      dataIndex: 'listened_seconds',
      key: 'listened_seconds',
      sorter: true,
      align: 'right',
      width: 110,
      render: (seconds: number) => formatHours(seconds),
    },
    {
      title: (
        <Tooltip title="Devices that opened the book, and the share that pressed play. Counts guests too.">
          <span>Views → plays</span>
        </Tooltip>
      ),
      dataIndex: 'unique_players',
      key: 'unique_players',
      sorter: true,
      align: 'right',
      width: 140,
      render: (_, record) =>
        record.unique_viewers ? (
          <Text>
            {record.unique_viewers} → {record.unique_players}{' '}
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({record.view_to_play_rate}%)
            </Text>
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Last played',
      dataIndex: 'last_played_at',
      key: 'last_played_at',
      sorter: true,
      width: 140,
      render: (value?: string) =>
        value ? (
          <Tooltip title={dayjs(value).format('DD MMM YYYY HH:mm')}>
            {dayjs(value).format('DD MMM YYYY')}
          </Tooltip>
        ) : (
          <Text type="secondary">Never</Text>
        ),
    },
  ];

  const maxReached = Math.max(1, ...(detail?.chapters.map((c) => c.listeners_reached) || [1]));

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>
        Book Insights
      </Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="How to read these numbers"
        description={
          <>
            <b>Listeners, progress and drop-off</b> come from saved listening progress, which the app
            syncs only for signed-in users, and which holds each listener's furthest position rather
            than a history — so a date filter here means “last played in this period”.{' '}
            <b>Views → plays</b> comes from the activity event stream and counts devices, guests
            included. Good enough to decide what to publish and promote; not yet a basis for author
            royalties, which needs a period-accurate listening ledger.
          </>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic title="Books" value={summary?.books_total ?? 0} suffix={summary ? `/ ${summary.books_published} live` : ''} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic title="Listeners" value={summary?.listeners_total ?? 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic title="Likes" value={summary?.likes_total ?? 0} prefix={<HeartOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title="Listening time"
              value={summary?.listened_hours ?? 0}
              suffix="h"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic title="Books finished" value={summary?.books_completed ?? 0} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic title="Devices seen" value={summary?.unique_devices ?? 0} />
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by title"
          allowClear
          style={{ width: 220 }}
          onSearch={setSearch}
          defaultValue={search}
        />
        <Select
          placeholder="Language"
          allowClear
          style={{ width: 150 }}
          value={languageId}
          onChange={setLanguageId}
          options={languages.map((l) => ({ value: l.id, label: l.name }))}
        />
        <Select
          placeholder="Genre"
          allowClear
          style={{ width: 150 }}
          value={genreId}
          onChange={setGenreId}
          options={genres.map((g) => ({ value: g.id, label: g.name }))}
        />
        <Select
          placeholder="Author"
          allowClear
          showSearch
          optionFilterProp="label"
          style={{ width: 180 }}
          value={authorId}
          onChange={setAuthorId}
          options={authors.map((a) => ({ value: a.id, label: a.name }))}
        />
        <Select
          placeholder="Published"
          allowClear
          style={{ width: 140 }}
          value={published}
          onChange={setPublished}
          options={[
            { value: true, label: 'Published' },
            { value: false, label: 'Unpublished' },
          ]}
        />
        <RangePicker value={range} onChange={(value) => setRange(value as [Dayjs, Dayjs] | null)} />
        <Button icon={<ReloadOutlined />} onClick={() => { fetchRows(page); fetchSummary(); }}>
          Refresh
        </Button>
        <Button icon={<ClearOutlined />} onClick={clearFilters}>
          Clear
        </Button>
      </Space>

      <Table<BookInsight>
        rowKey="book_id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        scroll={{ x: 1500 }}
        onChange={handleTableChange}
        onRow={(record) => ({ onClick: () => openDetail(record), style: { cursor: 'pointer' } })}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (count) => `${count} books`,
        }}
      />

      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        width={720}
        title={detail?.title}
        loading={detailLoading}
      >
        {detail && (
          <>
            <Descriptions size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Authors">{detail.authors.join(', ') || '—'}</Descriptions.Item>
              <Descriptions.Item label="Language">{detail.language || '—'}</Descriptions.Item>
              <Descriptions.Item label="Genres">{detail.genres.join(', ') || '—'}</Descriptions.Item>
              <Descriptions.Item label="Access">{detail.access_type}</Descriptions.Item>
              <Descriptions.Item label="Duration">{formatDuration(detail.total_duration)}</Descriptions.Item>
              <Descriptions.Item label="Chapters">{detail.chapters_total}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic title="Listeners" value={detail.listeners} />
              </Col>
              <Col span={6}>
                <Statistic title="Finished" value={detail.completed_listeners} suffix={`/ ${detail.listeners}`} />
              </Col>
              <Col span={6}>
                <Statistic title="Likes" value={detail.likes} />
              </Col>
              <Col span={6}>
                <Statistic title="Listened" value={formatHours(detail.listened_seconds)} />
              </Col>
            </Row>

            <Title level={5}>Chapter drop-off</Title>
            <Text type="secondary">
              How many listeners got at least this far. A sharp fall is where the book loses people.
            </Text>
            <div style={{ marginTop: 12, marginBottom: 24 }}>
              {detail.chapters.length === 0 && <Empty description="No chapters" />}
              {detail.chapters.map((chapter) => (
                <div key={chapter.chapter_id} style={{ marginBottom: 10 }}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text style={{ fontSize: 13 }}>
                      Ch {chapter.order}. {chapter.title}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {chapter.listeners_reached} reached
                      {chapter.completions ? ` · ${chapter.completions} completed` : ''}
                    </Text>
                  </Space>
                  <div style={{ background: BAR_TRACK, borderRadius: 4, height: 8, marginTop: 4 }}>
                    <div
                      style={{
                        width: `${(chapter.listeners_reached / maxReached) * 100}%`,
                        background: BAR_HUE,
                        borderRadius: 4,
                        height: 8,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(detail.view_sources).length > 0 && (
              <>
                <Title level={5}>How listeners found it</Title>
                <Space wrap style={{ marginBottom: 24 }}>
                  {Object.entries(detail.view_sources).map(([source, views]) => (
                    <Tag key={source}>
                      {source}: {views}
                    </Tag>
                  ))}
                </Space>
              </>
            )}

            <Title level={5}>Recent listeners</Title>
            <Table<BookInsightDetail['recent_listeners'][number]>
              rowKey="user_id"
              size="small"
              pagination={false}
              dataSource={detail.recent_listeners}
              locale={{ emptyText: 'No signed-in listening progress yet' }}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                {
                  title: 'Progress',
                  dataIndex: 'progress_percentage',
                  key: 'progress_percentage',
                  render: (value: number, row) => (
                    <Space size={4}>
                      <Text>{value}%</Text>
                      {row.is_completed && <Tag color="green">Finished</Tag>}
                    </Space>
                  ),
                },
                {
                  title: 'Chapter',
                  dataIndex: 'current_chapter_index',
                  key: 'current_chapter_index',
                  render: (index: number) => `Ch ${index + 1}`,
                },
                {
                  title: 'Listened',
                  dataIndex: 'total_listened_seconds',
                  key: 'total_listened_seconds',
                  render: (seconds: number) => formatHours(seconds),
                },
                {
                  title: 'Last played',
                  dataIndex: 'last_played_at',
                  key: 'last_played_at',
                  render: (value: string) => dayjs(value).format('DD MMM YYYY HH:mm'),
                },
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}

export default BookInsights;
