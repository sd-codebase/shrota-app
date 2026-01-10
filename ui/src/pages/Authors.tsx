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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Author, AuthorCreate, SocialMedia } from '../types';
import {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  bulkCreateAuthors,
} from '../api';

function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const fetchAuthors = async () => {
    setLoading(true);
    try {
      const data = await getAuthors();
      setAuthors(data);
    } catch (error) {
      message.error('Failed to fetch authors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleAdd = () => {
    setEditingAuthor(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleEdit = (record: Author) => {
    setEditingAuthor(record);
    form.setFieldsValue({
      ...record,
      social_media: record.social_media || {},
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAuthor(id);
      message.success('Author deleted');
      fetchAuthors();
    } catch (error) {
      message.error('Failed to delete author');
    }
  };

  const handleSubmit = async (values: AuthorCreate & { social_media?: SocialMedia }) => {
    try {
      const authorData: AuthorCreate = {
        ...values,
        social_media: values.social_media && Object.values(values.social_media).some(v => v)
          ? values.social_media
          : undefined,
      };

      if (editingAuthor) {
        await updateAuthor(editingAuthor.id, authorData);
        message.success('Author updated');
      } else {
        await createAuthor(authorData);
        message.success('Author created');
      }
      setDrawerOpen(false);
      fetchAuthors();
    } catch (error) {
      message.error('Failed to save author');
    }
  };

  const handleBulkAdd = () => {
    bulkForm.resetFields();
    setBulkDrawerOpen(true);
  };

  const handleBulkSubmit = async (values: { authors: string }) => {
    try {
      const lines = values.authors.split('\n').filter((line) => line.trim());
      const authorsToCreate: AuthorCreate[] = lines.map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0],
          bio: parts[1] || undefined,
        };
      });

      if (authorsToCreate.some((a) => !a.name)) {
        message.error('Invalid format. Use: Name, Bio (one per line)');
        return;
      }

      await bulkCreateAuthors(authorsToCreate);
      message.success(`${authorsToCreate.length} authors created`);
      setBulkDrawerOpen(false);
      fetchAuthors();
    } catch (error) {
      message.error('Failed to create authors');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Bio',
      dataIndex: 'bio',
      key: 'bio',
      render: (text: string) => text || '-',
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Author) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this author?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Authors</h1>
        <div className="header-actions">
          <Button onClick={handleBulkAdd}>Bulk Add</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Author
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={authors}
        rowKey="id"
        loading={loading}
      />

      <Drawer
        title={editingAuthor ? 'Edit Author' : 'Add Author'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingAuthor ? 'Update' : 'Create'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Author name" />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} placeholder="Author biography" />
          </Form.Item>
          <h4>Social Media Links</h4>
          <Form.Item name={['social_media', 'facebook']} label="Facebook">
            <Input placeholder="https://facebook.com/..." />
          </Form.Item>
          <Form.Item name={['social_media', 'instagram']} label="Instagram">
            <Input placeholder="https://instagram.com/..." />
          </Form.Item>
          <Form.Item name={['social_media', 'youtube']} label="YouTube">
            <Input placeholder="https://youtube.com/..." />
          </Form.Item>
          <Form.Item name={['social_media', 'x']} label="X (Twitter)">
            <Input placeholder="https://x.com/..." />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Bulk Add Authors"
        open={bulkDrawerOpen}
        onClose={() => setBulkDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setBulkDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => bulkForm.submit()}>
              Create All
            </Button>
          </Space>
        }
      >
        <Form form={bulkForm} layout="vertical" onFinish={handleBulkSubmit}>
          <Form.Item
            name="authors"
            label="Authors (Name, Bio - one per line)"
            rules={[{ required: true, message: 'Please enter authors' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder={`Priya Sharma, Award-winning fiction writer\nRahul Verma, Science fiction author\nMeera Patel`}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Authors;
