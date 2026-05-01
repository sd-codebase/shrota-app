import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Upload,
  Popover,
  Switch,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Event, EventCreate } from '../types';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadEventCover,
  getEventCoverUrl,
} from '../api';

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch {
      message.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAdd = () => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({ show_on_home: false, is_active: true });
    setCoverFileList([]);
    setDrawerOpen(true);
  };

  const handleEdit = (record: Event) => {
    setEditingEvent(record);
    form.setFieldsValue(record);
    setCoverFileList(
      record.cover_image
        ? [{ uid: record.cover_image, name: record.cover_image, status: 'done', url: getEventCoverUrl(record.cover_image) }]
        : []
    );
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      message.success('Event deleted');
      fetchEvents();
    } catch {
      message.error('Failed to delete event');
    }
  };

  const handleSubmit = async (values: EventCreate) => {
    try {
      let coverFilename = editingEvent?.cover_image;

      if (coverFileList.length > 0 && coverFileList[0].originFileObj) {
        const uploadResponse = await uploadEventCover(
          coverFileList[0].originFileObj,
          values.title
        );
        coverFilename = uploadResponse.filename;
      } else if (coverFileList.length === 0) {
        coverFilename = undefined;
      }

      const eventData: EventCreate = {
        ...values,
        cover_image: coverFilename,
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
        message.success('Event updated');
      } else {
        await createEvent(eventData);
        message.success('Event created');
      }
      setDrawerOpen(false);
      fetchEvents();
    } catch {
      message.error('Failed to save event');
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'cover_image',
      key: 'cover_image',
      width: 50,
      render: (cover: string) =>
        cover ? (
          <Popover
            content={
              <img
                src={getEventCoverUrl(cover)}
                alt="cover"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getEventCoverUrl(cover)}
              alt="cover"
              style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            />
          </Popover>
        ) : (
          <div style={{ width: 32, height: 32, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PictureOutlined style={{ color: '#ccc', fontSize: 14 }} />
          </div>
        ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Text',
      dataIndex: 'text',
      key: 'text',
      render: (text: string) =>
        text.length > 80 ? `${text.substring(0, 80)}…` : text,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 90,
      render: (val: boolean) =>
        val ? <Tag color="green">Active</Tag> : <Tag color="red">Disabled</Tag>,
    },
    {
      title: 'Show on Home',
      dataIndex: 'show_on_home',
      key: 'show_on_home',
      width: 120,
      render: (val: boolean) =>
        val ? <Tag color="blue">Yes</Tag> : <Tag color="default">No</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Event) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          <Popconfirm title="Delete this event?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <div className="header-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Event
          </Button>
        </div>
      </div>

      <Table columns={columns} dataSource={events} rowKey="id" loading={loading} />

      <Drawer
        title={editingEvent ? 'Edit Event' : 'Add Event'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Event title" />
          </Form.Item>
          <Form.Item
            name="text"
            label="Text"
            rules={[{ required: true, message: 'Please enter the event text' }]}
          >
            <Input.TextArea rows={6} placeholder="Event description or content" />
          </Form.Item>
          <Form.Item label="Cover Image">
            <Upload
              listType="picture-card"
              fileList={coverFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setCoverFileList(fileList)}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.webp"
            >
              {coverFileList.length === 0 && (
                <div>
                  <PictureOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="show_on_home" label="Show on Home Page" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Events;
