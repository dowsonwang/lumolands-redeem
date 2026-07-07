import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Tag } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || '/admin';

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      const result = login(values.username, values.password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error ?? '登录失败');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>lumolands</Title>
          <Text type="secondary">兑换码管理后台</Text>
        </div>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form name="login" onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>演示账号：</Text>
          <div style={{ marginTop: 6, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Tag color="gold">admin / admin</Tag>
            <Tag color="blue">service / service</Tag>
          </div>
        </div>
      </Card>
    </div>
  );
}
