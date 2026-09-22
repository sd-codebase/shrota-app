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
import type { News, NewsCreate } from '../types';
import {
  getNews,
  createNews,
  updateNews,
  deleteNews,
  uploadNewsCover,
  getNewsCoverUrl,
} from '../api';

function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await getNews();
      setNews(data);
    } catch {
      message.error('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleAdd = () => {
    setEditingNews(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setCoverFileList([]);
    setDrawerOpen(true);
  };

  const handleEdit = (record: News) => {
    setEditingNews(record);
    form.setFieldsValue(record);
    setCoverFileList(
      record.cover_image
        ? [{ uid: record.cover_image, name: record.cover_image, status: 'done', url: getNewsCoverUrl(record.cover_image) }]
        : []
    );
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNews(id);
      message.success('News deleted');
      fetchNews();
    } catch {
      message.error('Failed to delete news');
    }
  };

  const handleSubmit = async (values: NewsCreate) => {
    try {
      let coverFilename = editingNews?.cover_image;

      if (coverFileList.length > 0 && coverFileList[0].originFileObj) {
        const uploadResponse = await uploadNewsCover(
          coverFileList[0].originFileObj,
          values.title
        );
        coverFilename = uploadResponse.filename;
      } else if (coverFileList.length === 0) {
        coverFilename = undefined;
      }

      const newsData: NewsCreate = {
        ...values,
        cover_image: coverFilename,
      };

      if (editingNews) {
        await updateNews(editingNews.id, newsData);
        message.success('News updated');
      } else {
        await createNews(newsData);
        message.success('News created');
      }
      setDrawerOpen(false);
      fetchNews();
    } catch {
      message.error('Failed to save news');
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
                src={getNewsCoverUrl(cover)}
                alt="cover"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getNewsCoverUrl(cover)}
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
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: News) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small" />
          <Popconfirm title="Delete this news item?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>News</h1>
        <div className="header-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add News
          </Button>
        </div>
      </div>

      <Table columns={columns} dataSource={news} rowKey="id" loading={loading} />

      <Drawer
        title={editingNews ? 'Edit News' : 'Add News'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingNews ? 'Update' : 'Create'}
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
            <Input placeholder="News title" />
          </Form.Item>
          <Form.Item
            name="text"
            label="Text"
            rules={[{ required: true, message: 'Please enter the news text' }]}
          >
            <Input.TextArea rows={6} placeholder="News description or content" />
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
        </Form>
      </Drawer>
    </div>
  );
}

export default NewsPage;
