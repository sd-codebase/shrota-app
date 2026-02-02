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
import type { Genre, GenreCreate } from '../types';
import {
  getGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  bulkCreateGenres,
  uploadGenreThumbnail,
  getGenreThumbnailUrl,
} from '../api';

function Genres() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [thumbnailFileList, setThumbnailFileList] = useState<UploadFile[]>([]);
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
    setThumbnailFileList([]);
    setDrawerOpen(true);
  };

  const handleEdit = (record: Genre) => {
    setEditingGenre(record);
    form.setFieldsValue(record);
    setThumbnailFileList(
      record.thumbnail
        ? [{ uid: record.thumbnail, name: record.thumbnail, status: 'done', url: getGenreThumbnailUrl(record.thumbnail) }]
        : []
    );
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
      let thumbnailFilename = editingGenre?.thumbnail;

      // Upload new thumbnail if a new file was selected
      if (thumbnailFileList.length > 0 && thumbnailFileList[0].originFileObj) {
        const thumbnailResponse = await uploadGenreThumbnail(
          thumbnailFileList[0].originFileObj,
          values.name
        );
        thumbnailFilename = thumbnailResponse.filename;
      } else if (thumbnailFileList.length === 0) {
        // Thumbnail was removed
        thumbnailFilename = undefined;
      }

      const genreData: GenreCreate = {
        ...values,
        thumbnail: thumbnailFilename,
      };

      if (editingGenre) {
        await updateGenre(editingGenre.id, genreData);
        message.success('Genre updated');
      } else {
        await createGenre(genreData);
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
      title: '',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 50,
      render: (thumbnail: string) =>
        thumbnail ? (
          <Popover
            content={
              <img
                src={getGenreThumbnailUrl(thumbnail)}
                alt="thumbnail"
                style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
              />
            }
            placement="right"
            trigger="hover"
          >
            <img
              src={getGenreThumbnailUrl(thumbnail)}
              alt="thumbnail"
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
      title: 'Adult',
      dataIndex: 'is_adult',
      key: 'is_adult',
      width: 70,
      render: (isAdult: boolean) => (
        isAdult ? <Tag color="red">18+</Tag> : null
      ),
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
          <Form.Item label="Thumbnail">
            <Upload
              listType="picture-card"
              fileList={thumbnailFileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setThumbnailFileList(fileList)}
              maxCount={1}
              accept=".jpg,.jpeg,.png,.webp"
            >
              {thumbnailFileList.length === 0 && (
                <div>
                  <PictureOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="is_adult" label="Adult Content" valuePropName="checked">
            <Switch />
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
