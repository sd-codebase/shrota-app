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
import type { Publication, PublicationCreate } from '../types';
import {
  getPublications,
  createPublication,
  updatePublication,
  deletePublication,
  bulkCreatePublications,
} from '../api';

function Publications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const fetchPublications = async () => {
    setLoading(true);
    try {
      const data = await getPublications();
      setPublications(data);
    } catch (error) {
      message.error('Failed to fetch publications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const handleAdd = () => {
    setEditingPublication(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleEdit = (record: Publication) => {
    setEditingPublication(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePublication(id);
      message.success('Publication deleted');
      fetchPublications();
    } catch (error) {
      message.error('Failed to delete publication');
    }
  };

  const handleSubmit = async (values: PublicationCreate) => {
    try {
      if (editingPublication) {
        await updatePublication(editingPublication.id, values);
        message.success('Publication updated');
      } else {
        await createPublication(values);
        message.success('Publication created');
      }
      setDrawerOpen(false);
      fetchPublications();
    } catch (error) {
      message.error('Failed to save publication');
    }
  };

  const handleBulkAdd = () => {
    bulkForm.resetFields();
    setBulkDrawerOpen(true);
  };

  const handleBulkSubmit = async (values: { publications: string }) => {
    try {
      const lines = values.publications.split('\n').filter((line) => line.trim());
      const publicationsToCreate: PublicationCreate[] = lines.map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0],
          description: parts[1] || undefined,
        };
      });

      if (publicationsToCreate.some((p) => !p.name)) {
        message.error('Invalid format. Use: Name, Description (one per line)');
        return;
      }

      await bulkCreatePublications(publicationsToCreate);
      message.success(`${publicationsToCreate.length} publications created`);
      setBulkDrawerOpen(false);
      fetchPublications();
    } catch (error) {
      message.error('Failed to create publications');
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
      render: (_: unknown, record: Publication) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this publication?"
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
        <h1>Publications</h1>
        <div className="header-actions">
          <Button onClick={handleBulkAdd}>Bulk Add</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Publication
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={publications}
        rowKey="id"
        loading={loading}
      />

      <Drawer
        title={editingPublication ? 'Edit Publication' : 'Add Publication'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingPublication ? 'Update' : 'Create'}
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
            <Input placeholder="e.g., Sunrise Publications" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Bulk Add Publications"
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
            name="publications"
            label="Publications (Name, Description - one per line)"
            rules={[{ required: true, message: 'Please enter publications' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder={`Sunrise Publications, Fiction and literature\nTechBooks India, Technical books publisher\nHeritage Press`}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Publications;
