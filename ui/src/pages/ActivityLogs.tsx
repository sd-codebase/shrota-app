import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Drawer,
  Tag,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Timeline,
  Empty,
  Tooltip,
  Typography,
  message,
} from 'antd';
import { ReloadOutlined, ClearOutlined, UserOutlined, MobileOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import type {
  ActivitySession,
  ActivityEvent,
  ActivityFilterOptions,
  ActivitySessionFilters,
} from '../types';
import {
  getActivitySessions,
  getActivitySessionEvents,
  getActivityFilterOptions,
} from '../api';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PAGE_SIZE = 25;

function formatDuration(startedAt: string, endedAt?: string): string {
  if (!endedAt) return 'In progress';
  const seconds = Math.max(0, dayjs(endedAt).diff(dayjs(startedAt), 'second'));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// Distinct colours for the event types that matter most at a glance.
const EVENT_COLORS: Record<string, string> = {
  app_opened: 'green',
  app_backgrounded: 'default',
  login_success: 'blue',
  login_failed: 'red',
  user_registered: 'purple',
  otp_sent: 'gold',
  logout: 'orange',
  playback_started: 'cyan',
  book_viewed: 'geekblue',
};

function ActivityLogs() {
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ActivityFilterOptions>({
    platforms: [],
    app_versions: [],
    event_names: [],
  });

  // Filters
  const [search, setSearch] = useState('');
  const [identified, setIdentified] = useState<boolean | undefined>(undefined);
  const [platform, setPlatform] = useState<string | undefined>(undefined);
  const [appVersion, setAppVersion] = useState<string | undefined>(undefined);
  const [eventName, setEventName] = useState<string | undefined>(undefined);
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);

  // Timeline drawer
  const [selected, setSelected] = useState<ActivitySession | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchSessions = useCallback(
    async (targetPage = page) => {
      setLoading(true);
      try {
        const filters: ActivitySessionFilters = {
          limit: PAGE_SIZE,
          offset: (targetPage - 1) * PAGE_SIZE,
          search: search.trim() || undefined,
          identified,
          platform,
          app_version: appVersion,
          event_name: eventName,
          date_from: range?.[0]?.startOf('day').toISOString(),
          date_to: range?.[1]?.endOf('day').toISOString(),
        };
        const data = await getActivitySessions(filters);
        setSessions(data.sessions);
        setTotal(data.total);
      } catch {
        message.error('Failed to load activity sessions');
      } finally {
        setLoading(false);
      }
    },
    [page, search, identified, platform, appVersion, eventName, range]
  );

  useEffect(() => {
    getActivityFilterOptions()
      .then(setOptions)
      .catch(() => {
        /* dropdowns simply stay empty */
      });
  }, []);

  // Any filter change resets to the first page — staying on page 5 of a
  // result set that no longer has 5 pages just shows an empty table.
  useEffect(() => {
    setPage(1);
    fetchSessions(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, identified, platform, appVersion, eventName, range]);

  const openTimeline = async (session: ActivitySession) => {
    setSelected(session);
    setEventsLoading(true);
    try {
      setEvents(await getActivitySessionEvents(session.id));
    } catch {
      message.error('Failed to load session events');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setIdentified(undefined);
    setPlatform(undefined);
    setAppVersion(undefined);
    setEventName(undefined);
    setRange(null);
  };

  const hasFilters =
    !!search || identified !== undefined || !!platform || !!appVersion || !!eventName || !!range;

  const columns: ColumnsType<ActivitySession> = [
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 170,
      render: (value: string) => (
        <Tooltip title={dayjs(value).format('DD MMM YYYY, HH:mm:ss')}>
          <span>{dayjs(value).format('DD MMM, HH:mm')}</span>
        </Tooltip>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: ActivitySession) =>
        record.user_id ? (
          <Space direction="vertical" size={0}>
            <Space size={4}>
              <UserOutlined />
              <Text strong>{record.user_name || 'Unknown'}</Text>
            </Space>
            {record.user_whatsapp && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.user_whatsapp}
              </Text>
            )}
          </Space>
        ) : (
          <Tag>Anonymous</Tag>
        ),
    },
    {
      title: 'Device',
      key: 'device',
      render: (_: unknown, record: ActivitySession) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <MobileOutlined />
            <span>{record.device_model || '—'}</span>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.platform || '—'}
            {record.os_version ? ` ${record.os_version}` : ''}
            {record.app_version ? ` · v${record.app_version}` : ''}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 110,
      render: (_: unknown, record: ActivitySession) =>
        formatDuration(record.started_at, record.ended_at),
    },
    {
      title: 'Events',
      dataIndex: 'event_count',
      key: 'event_count',
      width: 90,
      render: (count: number) => <Tag color={count ? 'blue' : 'default'}>{count}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_: unknown, record: ActivitySession) => (
        <Button size="small" onClick={() => openTimeline(record)}>
          View timeline
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Activity Logs</h1>
        <div className="header-actions">
          <Space>
            {hasFilters && (
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => fetchSessions()}>
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Name, WhatsApp, session or install id"
          allowClear
          style={{ width: 280 }}
          onSearch={setSearch}
          onChange={(e) => !e.target.value && setSearch('')}
        />
        <Select
          placeholder="All users"
          allowClear
          style={{ width: 150 }}
          value={identified}
          onChange={setIdentified}
          options={[
            { value: true, label: 'Signed in' },
            { value: false, label: 'Anonymous' },
          ]}
        />
        <Select
          placeholder="Platform"
          allowClear
          style={{ width: 130 }}
          value={platform}
          onChange={setPlatform}
          options={options.platforms.map((p) => ({ value: p, label: p }))}
        />
        <Select
          placeholder="App version"
          allowClear
          style={{ width: 140 }}
          value={appVersion}
          onChange={setAppVersion}
          options={options.app_versions.map((v) => ({ value: v, label: `v${v}` }))}
        />
        <Select
          placeholder="Contains event"
          allowClear
          showSearch
          style={{ width: 220 }}
          value={eventName}
          onChange={setEventName}
          options={options.event_names.map((n) => ({ value: n, label: n }))}
        />
        <RangePicker
          value={range}
          onChange={(values) => setRange(values as [Dayjs, Dayjs] | null)}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={sessions}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} session${t === 1 ? '' : 's'}`,
          onChange: (next) => {
            setPage(next);
            fetchSessions(next);
          },
        }}
      />

      <Drawer
        title="Session timeline"
        open={!!selected}
        onClose={() => setSelected(null)}
        width={560}
      >
        {selected && (
          <>
            <Space direction="vertical" size={2} style={{ marginBottom: 20 }}>
              <Text strong style={{ fontSize: 15 }}>
                {selected.user_id ? selected.user_name || 'Unknown user' : 'Anonymous session'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(selected.started_at).format('DD MMM YYYY, HH:mm:ss')} ·{' '}
                {formatDuration(selected.started_at, selected.ended_at)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selected.device_model || '—'} · {selected.platform || '—'}
                {selected.app_version ? ` · v${selected.app_version}` : ''}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                session {selected.id}
              </Text>
            </Space>

            {eventsLoading ? (
              <Text type="secondary">Loading…</Text>
            ) : events.length === 0 ? (
              <Empty description="No events in this session" />
            ) : (
              <Timeline
                items={events.map((event) => ({
                  color: EVENT_COLORS[event.event_name] || 'gray',
                  children: (
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space size={6}>
                        <Text strong>{event.event_name}</Text>
                        {!event.user_id && <Tag>anon</Tag>}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(event.occurred_at).format('HH:mm:ss')}
                      </Text>
                      {event.params && Object.keys(event.params).length > 0 && (
                        <pre
                          style={{
                            margin: 0,
                            fontSize: 11,
                            background: 'rgba(0,0,0,0.04)',
                            padding: '6px 8px',
                            borderRadius: 4,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(event.params, null, 2)}
                        </pre>
                      )}
                    </Space>
                  ),
                }))}
              />
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}

export default ActivityLogs;
