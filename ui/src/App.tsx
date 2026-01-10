import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  GlobalOutlined,
  TagsOutlined,
  BookOutlined,
  UserOutlined,
  ShopOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import Languages from './pages/Languages';
import Genres from './pages/Genres';
import Authors from './pages/Authors';
import Artists from './pages/Artists';
import Publications from './pages/Publications';
import Books from './pages/Books';
import './App.css';

const { Header, Content, Sider } = Layout;

function App() {
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
  ];

  return (
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
        <Header style={{ padding: 0, background: colorBgContainer }} />
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
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
