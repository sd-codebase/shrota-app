import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  InputNumber,
  Switch,
  Tag,
  Tabs,
  Select,
  Popconfirm,
  Typography,
  Tooltip,
  Alert,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
  BillingPeriod,
  PlaySyncStatus,
  PrimeBookSync,
  StorePurchase,
  StorePurchaseKind,
  SubscriptionPlan,
  SubscriptionPlanCreate,
} from '../types';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  resyncSubscriptionPlan,
  getPrimeBookSync,
  resyncPrimeBook,
  getStorePurchases,
} from '../api';

const PERIOD_LABELS: Record<BillingPeriod, string> = {
  P1M: 'Monthly',
  P3M: 'Every 3 months',
  P6M: 'Every 6 months',
  P1Y: 'Yearly',
};

const SYNC_COLORS: Record<PlaySyncStatus, string> = {
  synced: 'green',
  pending: 'processing',
  error: 'red',
  disabled: 'default',
};

function PlaySyncTag({ status, error }: { status?: PlaySyncStatus | null; error?: string | null }) {
  if (!status) return <Tag>Not in Play</Tag>;
  const tag = (
    <Tag color={SYNC_COLORS[status]}>
      {status === 'synced' ? 'In Google Play' : status === 'disabled' ? 'Sync off' : status}
    </Tag>
  );
  return error ? <Tooltip title={error}>{tag}</Tooltip> : tag;
}

function PlansTab() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [form] = Form.useForm<SubscriptionPlanCreate>();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      setPlans(await getSubscriptionPlans());
    } catch {
      message.error('Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, sort_order: 0, billing_period: 'P1M' });
    setDrawerOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    form.setFieldsValue(plan);
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: SubscriptionPlanCreate) => {
    setSaving(true);
    try {
      if (editing) {
        const { billing_period: _ignored, ...update } = values;
        await updateSubscriptionPlan(editing.id, update);
        message.success('Plan saved — updating Google Play');
      } else {
        await createSubscriptionPlan(values);
        message.success('Plan created — adding it to Google Play');
      }
      setDrawerOpen(false);
      fetchPlans();
    } catch (error) {
      message.error((error as Error).message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscriptionPlan(id);
      message.success('Plan removed — new sign-ups stopped in Google Play');
      fetchPlans();
    } catch {
      message.error('Failed to delete plan');
    }
  };

  const handleResync = async (id: string) => {
    setSyncingId(id);
    try {
      const plan = await resyncSubscriptionPlan(id);
      if (plan.play_sync_status === 'synced') {
        message.success('Plan is in Google Play');
      } else {
        message.error(plan.play_sync_error || 'Sync failed');
      }
      fetchPlans();
    } catch (error) {
      message.error((error as Error).message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Price',
      key: 'price',
      render: (_: unknown, p: SubscriptionPlan) => `₹${p.price} · ${PERIOD_LABELS[p.billing_period]}`,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) =>
        active ? <Tag color="green">On sale</Tag> : <Tag color="default">Hidden</Tag>,
    },
    {
      title: 'Google Play',
      key: 'play',
      render: (_: unknown, p: SubscriptionPlan) => (
        <Space direction="vertical" size={0}>
          <PlaySyncTag status={p.play_sync_status} error={p.play_sync_error} />
          <Typography.Text type="secondary" copyable style={{ fontSize: 12 }}>
            {p.play_product_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SubscriptionPlan) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Tooltip title="Push to Google Play again">
            <Button
              icon={<SyncOutlined />}
              loading={syncingId === record.id}
              onClick={() => handleResync(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this plan?"
            description="Stops new sign-ups. Current subscribers keep renewing until they cancel in Play."
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
        <Typography.Text type="secondary">
          Auto-renewing subscriptions sold through Google Play. Saving a plan creates or updates it in
          Play automatically. Price changes apply to new subscribers.
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Plan
        </Button>
      </div>

      <Table columns={columns} dataSource={plans} rowKey="id" loading={loading} pagination={false} />

      <Drawer
        title={editing ? 'Edit Plan' : 'Add Plan'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input placeholder="e.g. Shrota Monthly" maxLength={55} showCount />
          </Form.Item>
          <Form.Item name="description" label="Description" tooltip="Shown in Google Play (80 characters max)">
            <Input maxLength={80} showCount />
          </Form.Item>
          <Form.Item
            name="billing_period"
            label="Billing period"
            tooltip="Can't be changed after the plan is created (Google Play rule)"
            rules={[{ required: true }]}
          >
            <Select
              disabled={!!editing}
              options={Object.entries(PERIOD_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price (₹ per period)"
            rules={[{ required: true, message: 'Please enter a price' }]}
          >
            <InputNumber min={10} max={100000} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sort_order" label="Display order" tooltip="Lower numbers are shown first in the app">
            <InputNumber precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="is_active" label="On sale" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}

function PrimeBooksTab() {
  const [books, setBooks] = useState<PrimeBookSync[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      setBooks(await getPrimeBookSync());
    } catch {
      message.error('Failed to fetch Prime books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleResync = async (id: string) => {
    setSyncingId(id);
    try {
      const book = await resyncPrimeBook(id);
      if (book.play_sync_status === 'synced') {
        message.success('Book is in Google Play');
      } else {
        message.error(book.play_sync_error || 'Sync failed');
      }
      fetchBooks();
    } catch (error) {
      message.error((error as Error).message || 'Sync failed');
    } finally {
      setSyncingId(null);
    }
  };

  const columns = [
    { title: 'Book', dataIndex: 'title', key: 'title' },
    {
      title: 'Price',
      dataIndex: 'prime_price',
      key: 'prime_price',
      render: (price?: number | null) => (price ? `₹${price}` : '—'),
    },
    {
      title: 'Published',
      dataIndex: 'is_published',
      key: 'is_published',
      render: (published: boolean) =>
        published ? <Tag color="green">Yes</Tag> : <Tooltip title="Not on sale until published"><Tag>No</Tag></Tooltip>,
    },
    {
      title: 'Google Play',
      key: 'play',
      render: (_: unknown, b: PrimeBookSync) => (
        <Space direction="vertical" size={0}>
          <PlaySyncTag status={b.play_sync_status} error={b.play_sync_error} />
          <Typography.Text type="secondary" copyable style={{ fontSize: 12 }}>
            {b.play_product_id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Last synced',
      dataIndex: 'play_synced_at',
      key: 'play_synced_at',
      render: (d?: string | null) => (d ? dayjs(d).format('DD MMM YYYY, HH:mm') : '—'),
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, b: PrimeBookSync) => (
        <Tooltip title="Push to Google Play again">
          <Button icon={<SyncOutlined />} loading={syncingId === b.id} onClick={() => handleResync(b.id)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <Typography.Paragraph type="secondary">
        Every Prime book is sold in the app as a Google Play one-time product. Setting a book to Prime (or
        changing its title or price) on the Books page updates Play automatically; unpublishing it stops
        new sales, and buyers keep it.
      </Typography.Paragraph>
      <Table columns={columns} dataSource={books} rowKey="id" loading={loading} pagination={false} />
    </>
  );
}

const STATUS_COLORS: Record<string, string> = {
  purchased: 'green',
  active: 'green',
  grace_period: 'gold',
  canceled: 'orange',
  on_hold: 'orange',
  paused: 'default',
  pending: 'processing',
  expired: 'default',
  refunded: 'red',
  revoked: 'red',
};

const STATUS_HINTS: Record<string, string> = {
  canceled: 'Auto-renew is off; access continues until the end of the paid period',
  grace_period: 'Payment failed; Google is retrying and access continues for now',
  on_hold: 'Payment failed; no access until the listener fixes their payment method',
  pending: 'Waiting for payment to complete (e.g. UPI, cash)',
};

function PurchasesTab() {
  const [purchases, setPurchases] = useState<StorePurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<StorePurchaseKind | undefined>(undefined);
  const [includeTest, setIncludeTest] = useState(true);
  const perPage = 20;

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStorePurchases({ page, per_page: perPage, status, kind, include_test: includeTest });
      setPurchases(data.purchases);
      setTotal(data.total);
    } catch {
      message.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, [page, status, kind, includeTest]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('DD MMM YYYY, HH:mm'),
    },
    {
      title: 'Listener',
      key: 'user',
      render: (_: unknown, p: StorePurchase) =>
        p.user_name ? (
          <div>
            <div>{p.user_name}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{p.user_email}</Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">Deleted user</Typography.Text>
        ),
    },
    {
      title: 'Item',
      key: 'item',
      render: (_: unknown, p: StorePurchase) => (
        <Space wrap>
          <Tag color={p.kind === 'book' ? 'gold' : 'blue'}>{p.kind === 'book' ? 'Prime book' : 'Subscription'}</Tag>
          {p.item_title}
          {p.is_test && <Tag>Test</Tag>}
        </Space>
      ),
    },
    {
      title: 'List price',
      dataIndex: 'list_price',
      key: 'list_price',
      render: (price?: number | null) => (price ? `₹${price}` : '—'),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, p: StorePurchase) => {
        const tag = <Tag color={STATUS_COLORS[p.status] ?? 'default'}>{p.status.replace('_', ' ')}</Tag>;
        return STATUS_HINTS[p.status] ? <Tooltip title={STATUS_HINTS[p.status]}>{tag}</Tooltip> : tag;
      },
    },
    {
      title: 'Access until',
      dataIndex: 'expires_at',
      key: 'expires_at',
      render: (d: string | null, p: StorePurchase) =>
        p.kind === 'book' ? 'Forever' : d ? dayjs(d).format('DD MMM YYYY') : '—',
    },
    {
      title: 'Google order',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id?: string | null) => <Typography.Text style={{ fontSize: 12 }}>{id || '—'}</Typography.Text>,
    },
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Purchases made in the Android app through Google Play."
        description="List price is Shrota's catalogue price. Actual earnings (after Google's fee and taxes) are in Play Console → Financial reports."
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear
          placeholder="All statuses"
          style={{ width: 170 }}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          options={Object.keys(STATUS_COLORS).map((s) => ({ value: s, label: s.replace('_', ' ') }))}
        />
        <Select
          allowClear
          placeholder="All types"
          style={{ width: 160 }}
          value={kind}
          onChange={(v) => { setKind(v); setPage(1); }}
          options={[
            { value: 'book', label: 'Prime books' },
            { value: 'subscription', label: 'Subscriptions' },
          ]}
        />
        <Space>
          <Switch checked={includeTest} onChange={(v) => { setIncludeTest(v); setPage(1); }} />
          <span>Include test purchases</span>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={fetchPurchases} />
      </Space>

      <Table
        columns={columns}
        dataSource={purchases}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, pageSize: perPage, total, showSizeChanger: false, onChange: setPage }}
      />
    </>
  );
}

function Billing() {
  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        Billing
      </Typography.Title>
      <Tabs
        items={[
          { key: 'purchases', label: 'Purchases', children: <PurchasesTab /> },
          { key: 'plans', label: 'Subscription Plans', children: <PlansTab /> },
          { key: 'books', label: 'Prime Books', children: <PrimeBooksTab /> },
        ]}
      />
    </div>
  );
}

export default Billing;
