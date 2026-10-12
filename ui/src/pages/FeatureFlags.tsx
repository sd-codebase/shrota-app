import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Switch,
  Select,
  Popconfirm,
  Typography,
  Tag,
  Spin,
  message,
} from 'antd';
import { DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { FeatureFlag, FeatureFlagDetail, FeatureFlagUser, User } from '../types';
import {
  getFeatureFlags,
  getFeatureFlag,
  setFeatureFlagForAll,
  addFeatureFlagUser,
  removeFeatureFlagUser,
  getUsers,
} from '../api';

function userLabel(user: { name: string; email?: string | null; whatsapp_number?: string | null }) {
  return [user.name, user.whatsapp_number, user.email].filter(Boolean).join(' · ');
}

function FlagCard({ flag: initial }: { flag: FeatureFlag }) {
  const [flag, setFlag] = useState<FeatureFlagDetail | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [options, setOptions] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    getFeatureFlag(initial.key)
      .then(setFlag)
      .catch(() => message.error(`Failed to load ${initial.name}`));
  }, [initial.key]);

  const handleSearch = (text: string) => {
    clearTimeout(searchTimer.current);
    if (!text.trim()) {
      setOptions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        setOptions((await getUsers(1, 10, text.trim())).users);
      } catch {
        message.error('Failed to search users');
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleForAll = async (enabled: boolean) => {
    setSavingAll(true);
    try {
      setFlag(await setFeatureFlagForAll(initial.key, enabled));
      message.success(enabled ? `${initial.name} is on for all users` : `${initial.name} is off for all users`);
    } catch (e: any) {
      message.error(e?.message || 'Failed to update');
    } finally {
      setSavingAll(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setAdding(true);
    try {
      setFlag(await addFeatureFlagUser(initial.key, selectedUserId));
      setSelectedUserId(null);
      setOptions([]);
    } catch (e: any) {
      message.error(e?.message || 'Failed to add user');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      setFlag(await removeFeatureFlagUser(initial.key, userId));
    } catch (e: any) {
      message.error(e?.message || 'Failed to remove user');
    }
  };

  if (!flag) {
    return (
      <Card title={initial.name}>
        <Spin />
      </Card>
    );
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'WhatsApp', dataIndex: 'whatsapp_number', key: 'whatsapp_number', render: (v?: string) => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Added',
      dataIndex: 'added_at',
      key: 'added_at',
      render: (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, user: FeatureFlagUser) => (
        <Popconfirm title={`Remove ${user.name}?`} onConfirm={() => handleRemove(user.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          {flag.name}
          {flag.enabled_for_all ? (
            <Tag color="green">On for all users</Tag>
          ) : flag.users.length > 0 ? (
            <Tag color="blue">On for {flag.users.length} user{flag.users.length === 1 ? '' : 's'}</Tag>
          ) : (
            <Tag>Off</Tag>
          )}
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">{flag.description}</Typography.Paragraph>

      <Space align="center" style={{ marginBottom: 24 }}>
        <Popconfirm
          title={flag.enabled_for_all ? `Turn off ${flag.name} for all users?` : `Turn on ${flag.name} for all users?`}
          description={
            flag.enabled_for_all
              ? 'Only the users listed below will keep it.'
              : 'Every app user gets it straight away.'
          }
          onConfirm={() => handleForAll(!flag.enabled_for_all)}
        >
          <Switch checked={flag.enabled_for_all} loading={savingAll} />
        </Popconfirm>
        <Typography.Text strong>All users</Typography.Text>
      </Space>

      <Typography.Title level={5}>Specific users</Typography.Title>
      <Typography.Paragraph type="secondary">
        {flag.enabled_for_all
          ? 'It is on for everyone right now. These users keep it if you turn it off for all users.'
          : 'Only these users get it.'}
      </Typography.Paragraph>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          showSearch
          allowClear
          style={{ width: 360 }}
          placeholder="Search users by name, WhatsApp or email"
          filterOption={false}
          onSearch={handleSearch}
          notFoundContent={searching ? <Spin size="small" /> : null}
          value={selectedUserId}
          onChange={(v) => setSelectedUserId(v ?? null)}
          options={options.map((u) => ({
            value: u.id,
            label: userLabel(u),
            disabled: flag.users.some((fu) => fu.id === u.id),
          }))}
        />
        <Button type="primary" icon={<UserAddOutlined />} disabled={!selectedUserId} loading={adding} onClick={handleAdd}>
          Add user
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={flag.users}
        rowKey="id"
        size="small"
        pagination={flag.users.length > 20 ? { pageSize: 20 } : false}
        locale={{ emptyText: 'No users added' }}
      />
    </Card>
  );
}

function FeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeatureFlags()
      .then(setFlags)
      .catch(() => message.error('Failed to fetch feature flags'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Feature Flags
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        Turn app features on for everyone, or only for chosen users. Changes reach the app the next time it opens or
        comes back to the foreground.
      </Typography.Paragraph>
      {loading ? (
        <Spin />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {flags.map((flag) => (
            <FlagCard key={flag.key} flag={flag} />
          ))}
        </Space>
      )}
    </div>
  );
}

export default FeatureFlags;
