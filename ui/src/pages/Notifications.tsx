import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  message,
  Card,
  Tag,
  Typography,
} from 'antd';
import { SendOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Notification, NotificationSend } from '../types';
import { getNotifications, sendNotification } from '../api';

const { TextArea } = Input;
const { Title, Text } = Typography;

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      message.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (values: NotificationSend) => {
    setSending(true);
    try {
      const result = await sendNotification(values);
      if (result.success) {
        message.success('Notification sent successfully to all users');
        form.resetFields();
        fetchNotifications();
      } else {
        message.error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      message.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'sent':
        return <Tag color="success">Sent</Tag>;
      case 'failed':
        return <Tag color="error">Failed</Tag>;
      case 'pending':
        return <Tag color="processing">Pending</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Body',
      dataIndex: 'body',
      key: 'body',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Sent At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Error',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      ellipsis: true,
      render: (error: string | null) =>
        error ? <Text type="danger">{error}</Text> : '-',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Push Notifications</h1>
        <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>
          Refresh
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          Send Notification to All Users
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSend}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: 'Please enter notification title' },
              { max: 200, message: 'Title must be at most 200 characters' },
            ]}
          >
            <Input placeholder="e.g., New audiobook available!" maxLength={200} />
          </Form.Item>

          <Form.Item
            name="body"
            label="Body"
            rules={[
              { required: true, message: 'Please enter notification body' },
              { max: 1000, message: 'Body must be at most 1000 characters' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="e.g., Check out our latest audiobook release..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="image_url"
            label="Image URL (optional)"
            rules={[
              { max: 500, message: 'URL must be at most 500 characters' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input placeholder="https://example.com/image.png" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={sending}
              >
                Send Notification
              </Button>
              <Button onClick={() => form.resetFields()}>Clear</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Title level={4} style={{ marginTop: 0 }}>
          Notification History
        </Title>
        <Table
          columns={columns}
          dataSource={notifications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

export default Notifications;
