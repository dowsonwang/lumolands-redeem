import { useState } from 'react';
import { Card, Table, Input, Select, Space, Tag, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { adminLogDB } from '../db';
import type { AdminAction } from '../types';

const { Title, Text } = Typography;

const actionLabels: Record<AdminAction, string> = {
  login: '登录',
  logout: '退出登录',
  batch_create: '创建批次',
  batch_export: '导出批次',
  batch_activate: '启用批次',
  batch_deactivate: '停用批次',
  batch_void: '作废批次',
  code_void: '作废兑换码',
  code_supplement: '补发兑换码',
  redeem_rebind: '换绑',
  redeem_revoke: '撤销兑换',
};

const actionColors: Record<AdminAction, string> = {
  login: 'blue',
  logout: 'blue',
  batch_create: 'green',
  batch_export: 'gold',
  batch_activate: 'green',
  batch_deactivate: 'orange',
  batch_void: 'red',
  code_void: 'red',
  code_supplement: 'green',
  redeem_rebind: 'purple',
  redeem_revoke: 'orange',
};

export default function LogsPage() {
  const [refresh, setRefresh] = useState(0);
  const [operator, setOperator] = useState('');
  const [action, setAction] = useState('');

  const logs = adminLogDB.list();
  const filtered = logs
    .filter((l) => {
      if (operator && !l.operator.includes(operator.toLowerCase())) return false;
      if (action && l.action !== action) return false;
      return true;
    })
    .slice()
    .reverse();

  const columns = [
    {
      title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180,
      render: (t: string) => new Date(t).toLocaleString(),
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
    {
      title: '动作', dataIndex: 'action', key: 'action', width: 150,
      render: (a: AdminAction) => <Tag color={actionColors[a]}>{actionLabels[a]}</Tag>,
    },
    { title: '对象', dataIndex: 'target', key: 'target', width: 180 },
    {
      title: '详情', dataIndex: 'detail', key: 'detail',
      render: (d: string | undefined) => d ?? <Text type="secondary">-</Text>,
    },
  ];

  return (
    <div key={refresh}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>操作日志</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setRefresh((r) => r + 1)}>刷新</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="操作人"
            allowClear
            style={{ width: 180 }}
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
          />
          <Select
            placeholder="动作类型"
            allowClear
            style={{ width: 180 }}
            value={action || undefined}
            onChange={(v) => setAction(v ?? '')}
            options={Object.entries(actionLabels).map(([value, label]) => ({ value, label }))}
          />
          <Text type="secondary">共 {filtered.length} 条</Text>
        </Space>
      </Card>

      <Card>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 15 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
