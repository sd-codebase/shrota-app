import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Upload,
  Input,
  message,
  Popconfirm,
  Switch,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload/interface';
import type { AppOpenAd as AppOpenAdType } from '../types';
import {
  getAppOpenAds,
  createAppOpenAd,
  updateAppOpenAd,
  deleteAppOpenAd,
  uploadAppOpenAdFile,
  getAppOpenAdFileUrl,
} from '../api';

// Required aspect ratio for the welcome image — 9:16 (portrait), matching
// a full-screen phone display, e.g. 1080x1920.
const TARGET_RATIO = 9 / 16;
const RATIO_TOLERANCE = 0.02; // ~2%, allows for rounding (e.g. 1079x1920)

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image dimensions'));
    };
    img.src = url;
  });
}

function AppOpenAd() {
  const [ads, setAds] = useState<AppOpenAdType[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [linkValue, setLinkValue] = useState('');

  const fetchAds = async () => {
    setLoading(true);
    try {
      const data = await getAppOpenAds();
      setAds(data);
    } catch {
      message.error('Failed to fetch app-open ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const activeAd = ads.find((a) => a.is_active);

  const handleAdd = () => {
    setFileList([]);
    setLinkValue('');
    setDrawerOpen(true);
  };

  const handleUpload = async () => {
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.warning('Please select an image file');
      return;
    }
    const trimmedLink = linkValue.trim();
    if (trimmedLink && !/^https?:\/\//i.test(trimmedLink)) {
      message.error('Link must start with http:// or https://');
      return;
    }
    setUploading(true);
    try {
      const uploadResponse = await uploadAppOpenAdFile(fileList[0].originFileObj);
      await createAppOpenAd({
        file: uploadResponse.filename,
        is_active: true,
        link: trimmedLink || undefined,
      });
      message.success('Welcome image uploaded and enabled');
      setDrawerOpen(false);
      fetchAds();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (record: AppOpenAdType) => {
    try {
      await updateAppOpenAd(record.id, !record.is_active);
      message.success(record.is_active ? 'Disabled' : 'Enabled');
      fetchAds();
    } catch {
      message.error('Failed to update');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppOpenAd(id);
      message.success('Deleted');
      fetchAds();
    } catch {
      message.error('Failed to delete');
    }
  };

  const columns = [
    {
      title: 'Preview',
      key: 'preview',
      width: 100,
      render: (_: unknown, record: AppOpenAdType) => (
        <img
          src={getAppOpenAdFileUrl(record.file)}
          alt="welcome"
          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }}
        />
      ),
    },
    {
      title: 'File',
      dataIndex: 'file',
      key: 'file',
    },
    {
      title: 'Know More Link',
      dataIndex: 'link',
      key: 'link',
      render: (link: string | undefined) =>
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {link}
          </a>
        ) : (
          <span style={{ color: 'rgba(0,0,0,0.35)' }}>None — Continue only</span>
        ),
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
      render: (_: unknown, record: AppOpenAdType) => (
        <Switch checked={record.is_active} onChange={() => handleToggleActive(record)} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: AppOpenAdType) => (
        <Popconfirm title="Delete this welcome image?" onConfirm={() => handleDelete(record.id)}>
          <Button icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>App Open Ad</h1>
        <div className="header-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Upload Image
          </Button>
        </div>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="How this works"
        description="Shown once per app launch, right after the splash screen. After 2 seconds, a “Continue to Shrota” button appears at the bottom (and a “Know More” button above it, if you set a link). The app shows whichever active image was uploaded most recently. Uploading a new image enables it automatically — disable it below if you don't want it live yet. This slot is meant to be sold as ad space once the app has enough downloads; for now it's self-managed."
      />

      {activeAd && (
        <Alert
          style={{ marginBottom: 16 }}
          type="success"
          showIcon
          message={`Currently shown on app launch: ${activeAd.file}`}
        />
      )}

      <Table columns={columns} dataSource={ads} rowKey="id" loading={loading} />

      <Drawer
        title="Upload Welcome Image"
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
          description="For a fast app launch, keep this image around 50KB. This isn't enforced — just a guideline."
        />
        <Upload
          listType="picture-card"
          fileList={fileList}
          beforeUpload={async (file: RcFile) => {
            try {
              const { width, height } = await getImageDimensions(file);
              const ratio = width / height;
              if (Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE) {
                message.error(
                  `Image must be 9:16 (portrait). This image is ${width}x${height}.`
                );
                return Upload.LIST_IGNORE;
              }
            } catch {
              message.error('Could not read this image — please try a different file.');
              return Upload.LIST_IGNORE;
            }
            return false; // valid — prevent antd's auto-upload, we upload manually
          }}
          onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
          maxCount={1}
          accept=".jpg,.jpeg,.png,.webp"
        >
          {fileList.length === 0 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Image only</div>
            </div>
          )}
        </Upload>
        <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, marginBottom: 16 }}>
          Images: jpg, png, webp (hard limit 10MB), must be 9:16 (portrait,
          e.g. 1080x1920). No video for this feature. The uploaded image is
          enabled immediately.
        </p>

        <div style={{ marginBottom: 4, fontWeight: 500 }}>Know More link (optional)</div>
        <Input
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          placeholder="https://example.com/offer"
        />
        <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>
          If set, a &quot;Know More&quot; button opens this link when tapped, shown
          above &quot;Continue to Shrota&quot;. Leave empty to show only
          &quot;Continue to Shrota&quot;.
        </p>
      </Drawer>
    </div>
  );
}

export default AppOpenAd;
