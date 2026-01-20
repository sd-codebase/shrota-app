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
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { Author, AuthorCreate, SocialMedia } from '../types';
import {
  getAuthors,
  createAuthor,
  updateAuthor,
  deleteAuthor,
  bulkCreateAuthors,
  uploadAuthorPhoto,
  getAuthorPhotoUrl,
} from '../api';

function Authors() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
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
    setPhotoFileList([]);
    setDrawerOpen(true);
  };

  const handleEdit = (record: Author) => {
    setEditingAuthor(record);
    form.setFieldsValue({
      ...record,
      social_media: record.social_media || {},
    });
    setPhotoFileList(
      record.photo
        ? [{ uid: record.photo, name: record.photo, status: 'done', url: getAuthorPhotoUrl(record.photo) }]
        : []
    );
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
      let photoFilename = editingAuthor?.photo;

      // Upload new photo if a new file was selected
      if (photoFileList.length > 0 && photoFileList[0].originFileObj) {
        const photoResponse = await uploadAuthorPhoto(
          photoFileList[0].originFileObj,
          values.name
        );
        photoFilename = photoResponse.filename;
      } else if (photoFileList.length === 0) {
        // Photo was removed
        photoFilename = undefined;
      }

      const authorData: AuthorCreate = {
        ...values,
        photo: photoFilename,
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
      title: '',
      dataIndex: 'photo',
      key: 'photo',
      width: 50,
      render: (photo: string) =>
        photo ? (
          <Popover
            content={
              <img
                src={getAuthorPhotoUrl(photo)}
                alt="photo"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getAuthorPhotoUrl(photo)}
              alt="photo"
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
          <Form.Item label="Photo">
            <Upload
              listType="picture-card"
              fileList={photoFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setPhotoFileList(fileList)}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.webp"
            >
              {photoFileList.length === 0 && (
                <div>
                  <PictureOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
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
