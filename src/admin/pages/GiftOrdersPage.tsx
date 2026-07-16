import { useState } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Tag, Modal,
  Descriptions, message, Popconfirm, Tooltip, Typography,
} from 'antd';
import { SearchOutlined, ReloadOutlined, SendOutlined, UndoOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { giftOrderDB } from '../db';
import type { GiftOrder, GiftOrderStatus } from '../types';

const { Title, Text } = Typography;

const statusTag = (s: GiftOrderStatus) => {
  if (s === 'pending') return <Tag color="orange">待发货</Tag>;
  if (s === 'shipped') return <Tag color="green">已发货</Tag>;
  return <Tag>{s}</Tag>;
};

export default function GiftOrdersPage() {
  const { hasPermission } = useOutletContext<{ hasPermission: (a: 'manage' | 'query') => boolean }>();
  const [refresh, setRefresh] = useState(0);
  const [inputValues, setInputValues] = useState({ email: '', phone: '', status: '' as GiftOrderStatus | '' });
  const [filters, setFilters] = useState({ email: '', phone: '', status: '' as GiftOrderStatus | '' });
  const [detailOrder, setDetailOrder] = useState<GiftOrder | null>(null);

  const canManage = hasPermission('manage');

  const handleSearch = () => {
    setFilters({ ...inputValues });
  };

  const handleReset = () => {
    const empty = { email: '', phone: '', status: '' as GiftOrderStatus | '' };
    setInputValues(empty);
    setFilters(empty);
  };

  const allOrders = giftOrderDB.list();
  const filtered = allOrders
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((o) => {
      if (filters.email && !o.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.phone && !o.phone.includes(filters.phone)) return false;
      if (filters.status && o.status !== filters.status) return false;
      return true;
    });

  const pendingCount = allOrders.filter((o) => o.status === 'pending').length;
  const shippedCount = allOrders.filter((o) => o.status === 'shipped').length;

  const handleShip = (order: GiftOrder) => {
    const ok = giftOrderDB.ship(order.id);
    if (ok) {
      message.success(`订单 ${order.id} 已标记为已发货`);
      setRefresh((r) => r + 1);
    } else {
      message.error('发货失败，订单状态异常');
    }
  };

  const handleResetDemo = () => {
    Modal.confirm({
      title: '重置演示数据',
      content: '将清空所有卷纸领取订单，恢复为 8 条初始 mock 数据（6 条待发货 + 2 条已发货）。仅用于演示测试。',
      okText: '重置',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        giftOrderDB.resetDemo();
        message.success('演示数据已重置');
        setRefresh((r) => r + 1);
      },
    });
  };

  const columns = [
    {
      title: '订单号', dataIndex: 'id', key: 'id', fixed: 'left' as const, width: 150,
      render: (id: string) => <Text code style={{ fontSize: 13 }}>{id}</Text>,
    },
    {
      title: '用户账户邮箱', dataIndex: 'email', key: 'email', width: 220,
      ellipsis: true,
    },
    {
      title: '收货地址', dataIndex: 'address', key: 'address',
      ellipsis: true,
      render: (addr: string) => (
        <Tooltip title={addr} placement="topLeft">
          <span style={{ cursor: 'default' }}>{addr}</span>
        </Tooltip>
      ),
    },
    { title: '电话号码', dataIndex: 'phone', key: 'phone', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: statusTag },
    {
      title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: '发货时间', dataIndex: 'shippedAt', key: 'shippedAt', width: 170,
      render: (t: string | null) => (t ? new Date(t).toLocaleString() : <Text type="secondary">-</Text>),
    },
    {
      title: '操作', key: 'actions', fixed: 'right' as const, width: 160,
      render: (_: unknown, record: GiftOrder) => (
        <Space size="small">
          <Button size="small" onClick={() => setDetailOrder(record)}>详情</Button>
          {record.status === 'pending' && canManage && (
            <Popconfirm
              title="确认标记为已发货？"
              description={`订单 ${record.id} 将标记为已发货`}
              okText="确认发货"
              okButtonProps={{ type: 'primary' }}
              cancelText="取消"
              onConfirm={() => handleShip(record)}
            >
              <Button size="small" type="primary" icon={<SendOutlined />}>发货</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div key={refresh}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          卷纸领取
          <Text type="secondary" style={{ fontSize: 13, marginLeft: 12, fontWeight: 400 }}>
            待发货 {pendingCount} · 已发货 {shippedCount}
          </Text>
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setRefresh((r) => r + 1)}>刷新</Button>
          <Button icon={<UndoOutlined />} onClick={handleResetDemo}>重置演示数据</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="用户账户邮箱"
            allowClear
            style={{ width: 220 }}
            value={inputValues.email}
            onChange={(e) => setInputValues({ ...inputValues, email: e.target.value })}
            onPressEnter={handleSearch}
          />
          <Input
            placeholder="电话号码"
            allowClear
            style={{ width: 180 }}
            value={inputValues.phone}
            onChange={(e) => setInputValues({ ...inputValues, phone: e.target.value })}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="发货状态"
            allowClear
            style={{ width: 140 }}
            value={inputValues.status || undefined}
            onChange={(v) => setInputValues({ ...inputValues, status: v ?? '' })}
            options={[
              { label: '待发货', value: 'pending' },
              { label: '已发货', value: 'shipped' },
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Text type="secondary">共 {filtered.length} 条</Text>
        </Space>
      </Card>

      <Card>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Modal
        title="订单详情"
        open={!!detailOrder}
        onCancel={() => setDetailOrder(null)}
        footer={null}
        width={560}
      >
        {detailOrder && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="订单号">
              <Text code>{detailOrder.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">{statusTag(detailOrder.status)}</Descriptions.Item>
            <Descriptions.Item label="用户账户邮箱">{detailOrder.email}</Descriptions.Item>
            <Descriptions.Item label="电话号码">{detailOrder.phone}</Descriptions.Item>
            <Descriptions.Item label="收货地址">{detailOrder.address}</Descriptions.Item>
            <Descriptions.Item label="申请时间">
              {new Date(detailOrder.createdAt).toLocaleString()}
            </Descriptions.Item>
            {detailOrder.shippedAt && (
              <Descriptions.Item label="发货时间">
                {new Date(detailOrder.shippedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
