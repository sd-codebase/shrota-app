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
import type { Genre, GenreCreate } from '../types';
import {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  bulkCreateGenres,
} from '../api';

function Genres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const fetchGenres = async () => {
    setLoading(true);
    try {
      const data = await getGenres();
      setGenres(data);
    } catch (error) {
      message.error('Failed to fetch genres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleAdd = () => {
    setEditingGenre(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleEdit = (record: Genre) => {
    setEditingGenre(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGenre(id);
      message.success('Genre deleted');
      fetchGenres();
    } catch (error) {
      message.error('Failed to delete genre');
    }
  };

  const handleSubmit = async (values: GenreCreate) => {
    try {
      if (editingGenre) {
        await updateGenre(editingGenre.id, values);
        message.success('Genre updated');
      } else {
        await createGenre(values);
        message.success('Genre created');
      }
      setDrawerOpen(false);
      fetchGenres();
    } catch (error) {
      message.error('Failed to save genre');
    }
  };

  const handleBulkAdd = () => {
    bulkForm.resetFields();
    setBulkDrawerOpen(true);
  };

  const handleBulkSubmit = async (values: { genres: string }) => {
    try {
      const lines = values.genres.split('\n').filter((line) => line.trim());
      const genresToCreate: GenreCreate[] = lines.map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0],
          description: parts[1] || undefined,
        };
      });

      if (genresToCreate.some((g) => !g.name)) {
        message.error('Invalid format. Use: Name, Description (one per line)');
        return;
      }

      await bulkCreateGenres(genresToCreate);
      message.success(`${genresToCreate.length} genres created`);
      setBulkDrawerOpen(false);
      fetchGenres();
    } catch (error) {
      message.error('Failed to create genres');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Genre) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this genre?"
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
        <h1>Genres</h1>
        <div className="header-actions">
          <Button onClick={handleBulkAdd}>Bulk Add</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Genre
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={genres}
        rowKey="id"
        loading={loading}
      />

      <Drawer
        title={editingGenre ? 'Edit Genre' : 'Add Genre'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingGenre ? 'Update' : 'Create'}
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
            <Input placeholder="e.g., Fiction" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Bulk Add Genres"
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
            name="genres"
            label="Genres (Name, Description - one per line)"
            rules={[{ required: true, message: 'Please enter genres' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder={`Fiction, Stories and novels\nMystery, Crime and detective stories\nScience Fiction`}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Genres;
