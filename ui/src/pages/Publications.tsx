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
import type { Publication, PublicationCreate } from '../types';
import {
  getPublications,
  createPublication,
  updatePublication,
  deletePublication,
  bulkCreatePublications,
  uploadPublicationPhoto,
  getPublicationPhotoUrl,
} from '../api';

function Publications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
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
    setPhotoFileList([]);
    setDrawerOpen(true);
  };

  const handleEdit = (record: Publication) => {
    setEditingPublication(record);
    form.setFieldsValue(record);
    setPhotoFileList(
      record.photo
        ? [{ uid: record.photo, name: record.photo, status: 'done', url: getPublicationPhotoUrl(record.photo) }]
        : []
    );
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
      let photoFilename = editingPublication?.photo;

      // Upload new photo if a new file was selected
      if (photoFileList.length > 0 && photoFileList[0].originFileObj) {
        const photoResponse = await uploadPublicationPhoto(
          photoFileList[0].originFileObj,
          values.name
        );
        photoFilename = photoResponse.filename;
      } else if (photoFileList.length === 0) {
        // Photo was removed
        photoFilename = undefined;
      }

      const publicationData: PublicationCreate = {
        ...values,
        photo: photoFilename,
      };

      if (editingPublication) {
        await updatePublication(editingPublication.id, publicationData);
        message.success('Publication updated');
      } else {
        await createPublication(publicationData);
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
      title: '',
      dataIndex: 'photo',
      key: 'photo',
      width: 50,
      render: (photo: string) =>
        photo ? (
          <Popover
            content={
              <img
                src={getPublicationPhotoUrl(photo)}
                alt="photo"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getPublicationPhotoUrl(photo)}
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
