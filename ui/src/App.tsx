import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Dropdown, Avatar, Space } from 'antd';
import type { MenuProps } from 'antd';
import {
  GlobalOutlined,
  TagsOutlined,
  BookOutlined,
  UserOutlined,
  ShopOutlined,
  CustomerServiceOutlined,
  LogoutOutlined,
  StarOutlined,
  TeamOutlined,
  NotificationOutlined,
  CalendarOutlined,
  ReadOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import Languages from './pages/Languages';
import Genres from './pages/Genres';
import Authors from './pages/Authors';
import Artists from './pages/Artists';
import Publications from './pages/Publications';
import Books from './pages/Books';
import ContentPromotion from './pages/ContentPromotion';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Events from './pages/Events';
import NewsPage from './pages/News';
import Team from './pages/Team';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminOnlyRoute from './components/AdminOnlyRoute';
import { useAuth } from './context/AuthContext';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const location = useLocation();
  const { admin, logout, isAuthenticated, isFullAdmin } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Publishers only see Books plus read-only reference data (Languages,
  // Genres, Authors, Artists, Publications). Everything else — Content
  // Promotion, Users, Notifications, Events, News, Team — is admin-only.
  const menuItems = [
    {
      key: '/languages',
      icon: <GlobalOutlined />,
      label: <Link to="/languages">Languages</Link>,
    },
    {
      key: '/genres',
      icon: <TagsOutlined />,
      label: <Link to="/genres">Genres</Link>,
    },
    {
      key: '/authors',
      icon: <UserOutlined />,
      label: <Link to="/authors">Authors</Link>,
    },
    {
      key: '/artists',
      icon: <CustomerServiceOutlined />,
      label: <Link to="/artists">Artists</Link>,
    },
    {
      key: '/publications',
      icon: <ShopOutlined />,
      label: <Link to="/publications">Publications</Link>,
    },
    {
      key: '/books',
      icon: <BookOutlined />,
      label: <Link to="/books">Books</Link>,
    },
    ...(isFullAdmin
      ? [
          {
            key: '/content',
            icon: <StarOutlined />,
            label: <Link to="/content">Content Promotion</Link>,
          },
          {
            key: '/users',
            icon: <TeamOutlined />,
            label: <Link to="/users">Users</Link>,
          },
          {
            key: '/notifications',
            icon: <NotificationOutlined />,
            label: <Link to="/notifications">Notifications</Link>,
          },
          {
            key: '/events',
            icon: <CalendarOutlined />,
            label: <Link to="/events">Events</Link>,
          },
          {
            key: '/news',
            icon: <ReadOutlined />,
            label: <Link to="/news">News</Link>,
          },
          {
            key: '/team',
            icon: <IdcardOutlined />,
            label: <Link to="/team">Team</Link>,
          },
        ]
      : []),
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  // Show login page without layout
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider breakpoint="lg" collapsedWidth="0">
          <div className="logo">Shrota</div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}>
            {isAuthenticated && admin && (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  <span>{admin.name}</span>
                </Space>
              </Dropdown>
            )}
          </Header>
          <Content style={{ margin: '24px 16px 0' }}>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <Routes>
                <Route path="/" element={<Languages />} />
                <Route path="/languages" element={<Languages />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/publications" element={<Publications />} />
                <Route path="/books" element={<Books />} />
                <Route path="/content" element={<AdminOnlyRoute><ContentPromotion /></AdminOnlyRoute>} />
                <Route path="/users" element={<AdminOnlyRoute><Users /></AdminOnlyRoute>} />
                <Route path="/notifications" element={<AdminOnlyRoute><Notifications /></AdminOnlyRoute>} />
                <Route path="/events" element={<AdminOnlyRoute><Events /></AdminOnlyRoute>} />
                <Route path="/news" element={<AdminOnlyRoute><NewsPage /></AdminOnlyRoute>} />
                <Route path="/team" element={<AdminOnlyRoute><Team /></AdminOnlyRoute>} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
}

export default App;
