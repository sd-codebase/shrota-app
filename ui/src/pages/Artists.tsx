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
import type { Artist, ArtistCreate, SocialMedia } from '../types';
import {
  getArtists,
  createArtist,
  updateArtist,
  deleteArtist,
  bulkCreateArtists,
  uploadArtistPhoto,
  getArtistPhotoUrl,
} from '../api';

function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [photoFileList, setPhotoFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const data = await getArtists();
      setArtists(data);
    } catch (error) {
      message.error('Failed to fetch artists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleAdd = () => {
    setEditingArtist(null);
    form.resetFields();
    setPhotoFileList([]);
    setDrawerOpen(true);
  };

  const handleEdit = (record: Artist) => {
    setEditingArtist(record);
    form.setFieldsValue({
      ...record,
      social_media: record.social_media || {},
    });
    setPhotoFileList(
      record.photo
        ? [{ uid: record.photo, name: record.photo, status: 'done', url: getArtistPhotoUrl(record.photo) }]
        : []
    );
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteArtist(id);
      message.success('Artist deleted');
      fetchArtists();
    } catch (error) {
      message.error('Failed to delete artist');
    }
  };

  const handleSubmit = async (values: ArtistCreate & { social_media?: SocialMedia }) => {
    try {
      let photoFilename = editingArtist?.photo;

      // Upload new photo if a new file was selected
      if (photoFileList.length > 0 && photoFileList[0].originFileObj) {
        const photoResponse = await uploadArtistPhoto(
          photoFileList[0].originFileObj,
          values.name
        );
        photoFilename = photoResponse.filename;
      } else if (photoFileList.length === 0) {
        // Photo was removed
        photoFilename = undefined;
      }

      const artistData: ArtistCreate = {
        ...values,
        photo: photoFilename,
        social_media: values.social_media && Object.values(values.social_media).some(v => v)
          ? values.social_media
          : undefined,
      };

      if (editingArtist) {
        await updateArtist(editingArtist.id, artistData);
        message.success('Artist updated');
      } else {
        await createArtist(artistData);
        message.success('Artist created');
      }
      setDrawerOpen(false);
      fetchArtists();
    } catch (error) {
      message.error('Failed to save artist');
    }
  };

  const handleBulkAdd = () => {
    bulkForm.resetFields();
    setBulkDrawerOpen(true);
  };

  const handleBulkSubmit = async (values: { artists: string }) => {
    try {
      const lines = values.artists.split('\n').filter((line) => line.trim());
      const artistsToCreate: ArtistCreate[] = lines.map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0],
          bio: parts[1] || undefined,
        };
      });

      if (artistsToCreate.some((a) => !a.name)) {
        message.error('Invalid format. Use: Name, Bio (one per line)');
        return;
      }

      await bulkCreateArtists(artistsToCreate);
      message.success(`${artistsToCreate.length} artists created`);
      setBulkDrawerOpen(false);
      fetchArtists();
    } catch (error) {
      message.error('Failed to create artists');
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
                src={getArtistPhotoUrl(photo)}
                alt="photo"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getArtistPhotoUrl(photo)}
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
      render: (_: unknown, record: Artist) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete this artist?"
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
        <h1>Artists</h1>
        <div className="header-actions">
          <Button onClick={handleBulkAdd}>Bulk Add</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Artist
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={artists}
        rowKey="id"
        loading={loading}
      />

      <Drawer
        title={editingArtist ? 'Edit Artist' : 'Add Artist'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              {editingArtist ? 'Update' : 'Create'}
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
            <Input placeholder="Artist name" />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} placeholder="Artist biography" />
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
        title="Bulk Add Artists"
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
            name="artists"
            label="Artists (Name, Bio - one per line)"
            rules={[{ required: true, message: 'Please enter artists' }]}
          >
            <Input.TextArea
              rows={10}
              placeholder={`Sunidhi Chauhan, Playback singer\nArijit Singh, Bollywood singer\nSonu Nigam`}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Artists;
