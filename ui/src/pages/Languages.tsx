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
import type { Language, LanguageCreate } from '../types';
import {
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  bulkCreateLanguages,
} from '../api';

function Languages() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const data = await getLanguages();
      setLanguages(data);
    } catch (error) {
      message.error('Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleAdd = () => {
    setEditingLanguage(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const handleEdit = (record: Language) => {
    setEditingLanguage(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLanguage(id);
      message.success('Language deleted');
      fetchLanguages();
    } catch (error) {
      message.error('Failed to delete language');
    }
  };

  const handleSubmit = async (values: LanguageCreate) => {
    try {
      if (editingLanguage) {
        await updateLanguage(editingLanguage.id, values);
        message.success('Language updated');
      } else {
        await createLanguage(values);
        message.success('Language created');
      }
      setDrawerOpen(false);
      fetchLanguages();
    } catch (error) {
      message.error('Failed to save language');
    }
  };

  const handleBulkAdd = () => {
    bulkForm.resetFields();
    setBulkDrawerOpen(true);
  };

  const handleBulkSubmit = async (values: { languages: string }) => {
    try {
      const lines = values.languages.split('\n').filter((line) => line.trim());
      const languagesToCreate: LanguageCreate[] = lines.map((line) => {
        const [name, code] = line.split(',').map((s) => s.trim());
        return { name, code };
      });

      if (languagesToCreate.some((l) => !l.name || !l.code)) {
        message.error('Invalid format. Use: Name, Code (one per line)');
        return;
      }

      await bulkCreateLanguages(languagesToCreate);
      message.success(`${languagesToCreate.length} languages created`);
      setBulkDrawerOpen(false);
      fetchLanguages();
    } catch (error) {
      message.error('Failed to create languages');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Language) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this language?"
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
        <h1>Languages</h1>
        <div className="header-actions">
          <Button onClick={handleBulkAdd}>Bulk Add</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Language
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={languages}
        rowKey="id"
        loading={loading}
      />

      <Drawer
        title={editingLanguage ? 'Edit Language' : 'Add Language'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingLanguage ? 'Update' : 'Create'}
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
            <Input placeholder="e.g., English" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, message: 'Please enter code' }]}
          >
            <Input placeholder="e.g., en" />
          </Form.Item>
        </Form>
      </Drawer>

      <Drawer
        title="Bulk Add Languages"
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
            name="languages"
            label="Languages (Name, Code - one per line)"
            rules={[{ required: true, message: 'Please enter languages' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder={`English, en\nHindi, hi\nSpanish, es`}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Languages;
