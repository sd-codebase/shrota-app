import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Upload,
  message,
  Popconfirm,
  Switch,
  Tag,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined, VideoCameraOutlined, PictureOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { SplashResource } from '../types';
import {
  getSplashResources,
  createSplashResource,
  updateSplashResource,
  deleteSplashResource,
  uploadSplashFile,
  getSplashFileUrl,
} from '../api';

function Splash() {
  const [resources, setResources] = useState<SplashResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await getSplashResources();
      setResources(data);
    } catch {
      message.error('Failed to fetch splash resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const activeResource = resources.find((r) => r.is_active);

  const handleAdd = () => {
    setFileList([]);
    setDrawerOpen(true);
  };

  const handleUpload = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.warning('Please select an image or video file');
      return;
    }
    setUploading(true);
    try {
      const uploadResponse = await uploadSplashFile(fileList[0].originFileObj);
      await createSplashResource({
        resource_type: uploadResponse.resource_type,
        file: uploadResponse.filename,
        is_active: true,
      });
      message.success('Splash resource uploaded and enabled');
      setDrawerOpen(false);
      fetchResources();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (record: SplashResource) => {
    try {
      await updateSplashResource(record.id, !record.is_active);
      message.success(record.is_active ? 'Disabled' : 'Enabled');
      fetchResources();
    } catch {
      message.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSplashResource(id);
      message.success('Deleted');
      fetchResources();
    } catch {
      message.error('Failed to delete');
    }
  };

  const columns = [
    {
      title: 'Preview',
      key: 'preview',
      width: 100,
      render: (_: unknown, record: SplashResource) =>
        record.resource_type === 'video' ? (
          <video
            src={getSplashFileUrl(record.file)}
            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, background: '#000' }}
            muted
          />
        ) : (
          <img
            src={getSplashFileUrl(record.file)}
            alt="splash"
            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }}
          />
        ),
    },
    {
      title: 'Type',
      dataIndex: 'resource_type',
      key: 'resource_type',
      render: (type: string) =>
        type === 'video' ? (
          <Tag icon={<VideoCameraOutlined />} color="purple">Video</Tag>
        ) : (
          <Tag icon={<PictureOutlined />} color="blue">Image</Tag>
        ),
    },
    {
      title: 'File',
      dataIndex: 'file',
      key: 'file',
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Active',
      key: 'is_active',
      render: (_: unknown, record: SplashResource) => (
        <Switch checked={record.is_active} onChange={() => handleToggleActive(record)} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SplashResource) => (
        <Popconfirm title="Delete this splash resource?" onConfirm={() => handleDelete(record.id)}>
          <Button icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Splash Screen</h1>
        <div className="header-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Upload Resource
          </Button>
        </div>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="How this works"
        description="The app plays whichever active resource was uploaded most recently. Uploading a new resource enables it automatically — disable it below if you don't want it live yet."
      />

      {activeResource && (
        <Alert
          style={{ marginBottom: 16 }}
          type="success"
          showIcon
          message={`Currently playing on the app: ${activeResource.file} (${activeResource.resource_type})`}
        />
      )}

      <Table columns={columns} dataSource={resources} rowKey="id" loading={loading} />

      <Drawer
        title="Upload Splash Resource"
        open={drawerOpen}
        onClose={() => !uploading && setDrawerOpen(false)}
        width={420}
        closable={!uploading}
        maskClosable={!uploading}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)} disabled={uploading}>Cancel</Button>
            <Button type="primary" onClick={handleUpload} loading={uploading}>Upload</Button>
          </Space>
        }
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="Recommended file size"
          description="For a fast app launch, keep images around 50KB and videos around 500KB. This isn't enforced — just a guideline so the splash doesn't slow down startup."
        />
        <Upload
          listType="picture-card"
          fileList={fileList}
          beforeUpload={() => false}
          onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
          maxCount={1}
          accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.m4v"
        >
          {fileList.length === 0 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Image or Video</div>
            </div>
          )}
        </Upload>
        <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>
          Images: jpg, png, webp (hard limit 10MB). Videos: mp4, mov, m4v (hard limit 50MB).
          The uploaded resource is enabled immediately.
        </p>
      </Drawer>
    </div>
  );
}

export default Splash;
