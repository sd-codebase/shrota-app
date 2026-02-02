import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  CheckOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { User, UserUpdate } from '../types';
import {
  getUsers,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../api';
import dayjs from 'dayjs';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchUsers = useCallback(async (page: number, pageSize: number, search: string) => {
    setLoading(true);
    try {
      const data = await getUsers(page, pageSize, search || undefined);
      setUsers(data.users);
      setPagination({
        current: data.page,
        pageSize: data.per_page,
        total: data.total,
      });
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, pagination.pageSize, searchText);
  }, [searchText, fetchUsers, pagination.pageSize]);

  const handleTableChange = (newPagination: { current?: number; pageSize?: number }) => {
    const page = newPagination.current || 1;
    const pageSize = newPagination.pageSize || 20;
    fetchUsers(page, pageSize, searchText);
  };

  const handleSearch = () => {
    setSearchText(searchInput);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      whatsapp_number: record.whatsapp_number,
      birth_date: record.birth_date ? dayjs(record.birth_date) : null,
    });
    setDrawerOpen(true);
  };

  const handleToggleStatus = async (record: User) => {
    try {
      await toggleUserStatus(record.id);
      message.success(`User ${record.is_active ? 'disabled' : 'enabled'} successfully`);
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error('Failed to toggle user status');
    }
  };

  const handleDelete = async (record: User) => {
    if (record.is_active) {
      message.error('Cannot delete an active user. Please disable the user first.');
      return;
    }
    try {
      await deleteUser(record.id);
      message.success('User deleted successfully');
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error((error as Error).message || 'Failed to delete user');
    }
  };

  const handleSubmit = async (values: {
    name: string;
    email?: string;
    whatsapp_number?: string;
    birth_date?: dayjs.Dayjs;
  }) => {
    if (!editingUser) return;

    try {
      const userData: UserUpdate = {
        name: values.name,
        email: values.email || undefined,
        whatsapp_number: values.whatsapp_number || undefined,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : undefined,
      };

      await updateUser(editingUser.id, userData);
      message.success('User updated successfully');
      setDrawerOpen(false);
      fetchUsers(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error((error as Error).message || 'Failed to update user');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string | undefined, record: User) => (
        <Space>
          {email || '-'}
          {email && (
            <Tooltip title={record.is_email_verified ? 'Email verified' : 'Email not verified'}>
              {record.is_email_verified ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
              )}
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'WhatsApp',
      dataIndex: 'whatsapp_number',
      key: 'whatsapp_number',
      render: (whatsapp: string | undefined, record: User) => (
        <Space>
          {whatsapp || '-'}
          {whatsapp && (
            <Tooltip title={record.is_whatsapp_verified ? 'WhatsApp verified' : 'WhatsApp not verified'}>
              {record.is_whatsapp_verified ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
              )}
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Birth Date',
      dataIndex: 'birth_date',
      key: 'birth_date',
      render: (date: string) => {
        if (!date) return '-';
        const age = dayjs().diff(dayjs(date), 'year');
        const isAdult = age >= 18;
        return (
          <span>
            {dayjs(date).format('MMM D, YYYY')}{' '}
            <span style={{ color: isAdult ? '#52c41a' : '#ff4d4f' }}>({age})</span>
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: User) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={record.is_active ? 'Disable user' : 'Enable user'}>
            <Popconfirm
              title={`${record.is_active ? 'Disable' : 'Enable'} this user?`}
              onConfirm={() => handleToggleStatus(record)}
            >
              <Button
                icon={record.is_active ? <StopOutlined /> : <CheckOutlined />}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title={record.is_active ? 'Disable user before deleting' : 'Delete user'}>
            <Popconfirm
              title="Delete this user permanently?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record)}
              disabled={record.is_active}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                disabled={record.is_active}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Users</h1>
        <Space>
          <Input
            placeholder="Search by name, email, or WhatsApp"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            allowClear
            onClear={() => {
              setSearchInput('');
              setSearchText('');
            }}
          />
          <Button icon={<SearchOutlined />} onClick={handleSearch}>
            Search
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
      />

      <Drawer
        title="Edit User"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Update
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
            <Input placeholder="User name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item
            name="whatsapp_number"
            label="WhatsApp Number"
          >
            <Input placeholder="+91XXXXXXXXXX" />
          </Form.Item>
          <Form.Item
            name="birth_date"
            label="Birth Date"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {editingUser && (
            <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <h4 style={{ marginTop: 0 }}>Read-only Information</h4>
              <p>
                <strong>Email Verified:</strong>{' '}
                {editingUser.is_email_verified ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="default">No</Tag>
                )}
              </p>
              <p>
                <strong>WhatsApp Verified:</strong>{' '}
                {editingUser.is_whatsapp_verified ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag color="default">No</Tag>
                )}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <Tag color={editingUser.is_active ? 'green' : 'red'}>
                  {editingUser.is_active ? 'Active' : 'Disabled'}
                </Tag>
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Created:</strong>{' '}
                {dayjs(editingUser.created_at).format('MMM D, YYYY h:mm A')}
              </p>
            </div>
          )}
        </Form>
      </Drawer>
    </div>
  );
}

export default Users;
