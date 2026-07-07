import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Tag, Typography } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ToolOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/admin/batches', icon: <AppstoreOutlined />, label: '批次管理' },
  { key: '/admin/codes', icon: <SearchOutlined />, label: '兑换码查询' },
  { key: '/admin/remedy', icon: <ToolOutlined />, label: '客服补救' },
  { key: '/admin/logs', icon: <HistoryOutlined />, label: '操作日志' },
];

export default function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const dropdownItems = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light" style={{ boxShadow: '1px 0 0 #f0f0f0' }}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: collapsed ? 14 : 16,
            color: '#1c1917',
            borderBottom: '1px solid #f0f0f0',
            letterSpacing: collapsed ? 0 : '0.05em',
          }}
        >
          {collapsed ? 'L' : 'lumolands'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 0 #f0f0f0',
          }}
        >
          <span
            style={{ fontSize: 16, cursor: 'pointer', padding: 4 }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
          <Dropdown menu={dropdownItems} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text>{user.nickname}</Text>
              <Tag color={user.role === 'admin' ? 'gold' : 'blue'}>
                {user.role === 'admin' ? '管理员' : '客服'}
              </Tag>
            </span>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet context={{ hasPermission }} />
        </Content>
      </Layout>
    </Layout>
  );
}
