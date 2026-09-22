import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Tag,
  Switch,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Admin, AdminCreate } from '../types';
import { getTeam, createTeamMember, updateTeamMember } from '../api';
import { useAuth } from '../context/AuthContext';

function Team() {
  const { admin: currentAdmin } = useAuth();
  const [team, setTeam] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const data = await getTeam();
      setTeam(data);
    } catch {
      message.error('Failed to fetch team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ role: 'publisher' });
    setDrawerOpen(true);
  };

  const handleSubmit = async (values: AdminCreate) => {
    try {
      await createTeamMember(values);
      message.success('Account created');
      setDrawerOpen(false);
      fetchTeam();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || 'Failed to create account');
    }
  };

  const handleToggleActive = async (record: Admin) => {
    try {
      await updateTeamMember(record.id, { is_active: !record.is_active });
      message.success(record.is_active ? 'Account deactivated' : 'Account activated');
      fetchTeam();
    } catch (error) {
      const err = error as Error;
      message.error(err.message || 'Failed to update account');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: Admin['role']) =>
        role === 'admin' ? <Tag color="purple">Admin</Tag> : <Tag color="blue">Publisher</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) =>
        isActive ? <Tag color="green">Active</Tag> : <Tag color="red">Deactivated</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Admin) => {
        const isSelf = record.id === currentAdmin?.id;
        return (
          <Switch
            checked={record.is_active}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            disabled={isSelf}
            onChange={() => handleToggleActive(record)}
          />
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Team</h1>
        <div className="header-actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Account
          </Button>
        </div>
      </div>

      <Table columns={columns} dataSource={team} rowKey="id" loading={loading} />

      <Drawer
        title="Add Account"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Create
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="name@example.com" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, min: 3, message: 'At least 3 characters' }]}
          >
            <Input placeholder="username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
          >
            <Input.Password placeholder="At least 8 characters" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
            tooltip="Publisher: can only manage books they create. Admin: full access to everything."
          >
            <Select>
              <Select.Option value="publisher">Publisher — books only, scoped to their own</Select.Option>
              <Select.Option value="admin">Admin — full access</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default Team;
