import { useState } from 'react';
import {
  Card, Table, Button, Input, Select, Space, Tag, Modal,
  Descriptions, message, Popconfirm, Typography, Timeline,
} from 'antd';
import { SearchOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { codeDB, batchDB, redemptionLogDB, adminLogDB } from '../db';
import { formatCode } from '../codeGenerator';
import type { Code, CodeStatus } from '../types';

const { Title, Text } = Typography;

const statusTag = (s: CodeStatus) => {
  const map = { unused: 'default', used: 'green', voided: 'red' } as const;
  const labels = { unused: '未使用', used: '已使用', voided: '已作废' } as const;
  return <Tag color={map[s]}>{labels[s]}</Tag>;
};

const resultLabels: Record<string, string> = {
  success: '成功',
  invalid_code: '码无效',
  already_used: '已被使用',
  voided: '已作废',
  email_not_registered: '邮箱未注册',
  batch_inactive: '批次未启用',
  rate_limited: '触发限频',
};

export default function CodesPage() {
  const { hasPermission } = useOutletContext<{ hasPermission: (a: 'manage' | 'query') => boolean }>();
  const [refresh, setRefresh] = useState(0);
  // 输入框的临时值
  const [inputValues, setInputValues] = useState({ code: '', email: '', batchId: '', status: '' });
  // 点击查询后实际应用的过滤条件
  const [filters, setFilters] = useState({ code: '', email: '', batchId: '', status: '' });
  const [detailCode, setDetailCode] = useState<Code | null>(null);

  const batches = batchDB.list();
  const allCodes = codeDB.list();

  const handleSearch = () => {
    setFilters({ ...inputValues });
  };

  const handleReset = () => {
    const empty = { code: '', email: '', batchId: '', status: '' };
    setInputValues(empty);
    setFilters(empty);
  };

  const filtered = allCodes.filter((c) => {
    if (filters.code && !c.id.includes(filters.code.toUpperCase())) return false;
    if (filters.email && !(c.redeemedEmail ?? '').toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.batchId && c.batchId !== filters.batchId) return false;
    if (filters.status && c.status !== filters.status) return false;
    return true;
  });

  const handleVoid = (code: Code) => {
    const ok = codeDB.void(code.id, '手动作废');
    if (ok) {
      adminLogDB.add({
        operator: 'admin',
        action: 'code_void',
        target: code.id,
      });
      message.success(`兑换码 ${formatCode(code.id)} 已作废`);
      setRefresh((r) => r + 1);
    } else {
      message.error('只有未使用的码才能作废');
    }
  };

  const columns = [
    {
      title: '兑换码', dataIndex: 'id', key: 'id', fixed: 'left' as const, width: 200,
      render: (id: string) => <Text code style={{ fontSize: 13 }}>{formatCode(id)}</Text>,
    },
    { title: '所属批次', dataIndex: 'batchId', key: 'batchId', width: 150 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: statusTag },
    {
      title: '兑换邮箱', dataIndex: 'redeemedEmail', key: 'redeemedEmail', width: 220,
      render: (e: string | null) => e ?? <Text type="secondary">-</Text>,
    },
    {
      title: '兑换时间', dataIndex: 'redeemedAt', key: 'redeemedAt', width: 170,
      render: (t: string | null) => (t ? new Date(t).toLocaleString() : <Text type="secondary">-</Text>),
    },
    {
      title: '操作', key: 'actions', fixed: 'right' as const, width: 200,
      render: (_: unknown, record: Code) => (
        <Space size="small">
          <Button size="small" onClick={() => setDetailCode(record)}>详情</Button>
          {record.status === 'unused' && hasPermission('manage') && (
            <Popconfirm title="确认作废该码？" onConfirm={() => handleVoid(record)}>
              <Button size="small" danger icon={<StopOutlined />}>作废</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const detailLogs = detailCode ? redemptionLogDB.getByCode(detailCode.id) : [];

  return (
    <div key={refresh}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>兑换码查询</Title>
        <Button icon={<ReloadOutlined />} onClick={() => setRefresh((r) => r + 1)}>刷新</Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <Input
            placeholder="兑换码（支持模糊）"
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 200 }}
            value={inputValues.code}
            onChange={(e) => setInputValues({ ...inputValues, code: e.target.value })}
            onPressEnter={handleSearch}
          />
          <Input
            placeholder="兑换邮箱"
            allowClear
            style={{ width: 200 }}
            value={inputValues.email}
            onChange={(e) => setInputValues({ ...inputValues, email: e.target.value })}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="所属批次"
            allowClear
            style={{ width: 180 }}
            value={inputValues.batchId || undefined}
            onChange={(v) => setInputValues({ ...inputValues, batchId: v ?? '' })}
            options={batches.map((b) => ({ label: `${b.id} (${b.remark})`, value: b.id }))}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 130 }}
            value={inputValues.status || undefined}
            onChange={(v) => setInputValues({ ...inputValues, status: v ?? '' })}
            options={[
              { label: '未使用', value: 'unused' },
              { label: '已使用', value: 'used' },
              { label: '已作废', value: 'voided' },
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
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Modal
        title="兑换码详情"
        open={!!detailCode}
        onCancel={() => setDetailCode(null)}
        footer={null}
        width={640}
      >
        {detailCode && (
          <div>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="兑换码">
                <Text code style={{ fontSize: 14 }}>{formatCode(detailCode.id)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">{statusTag(detailCode.status)}</Descriptions.Item>
              <Descriptions.Item label="所属批次">{detailCode.batchId}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(detailCode.createdAt).toLocaleString()}
              </Descriptions.Item>
              {detailCode.redeemedEmail && (
                <Descriptions.Item label="兑换邮箱">{detailCode.redeemedEmail}</Descriptions.Item>
              )}
              {detailCode.redeemedAt && (
                <Descriptions.Item label="兑换时间">
                  {new Date(detailCode.redeemedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {detailCode.redeemedIp && (
                <Descriptions.Item label="兑换 IP">{detailCode.redeemedIp}</Descriptions.Item>
              )}
              {detailCode.isSupplement && (
                <Descriptions.Item label="补发备注">{detailCode.supplementRemark}</Descriptions.Item>
              )}
            </Descriptions>

            <Title level={5} style={{ marginTop: 24 }}>兑换尝试记录</Title>
            {detailLogs.length === 0 ? (
              <Text type="secondary">暂无兑换尝试记录</Text>
            ) : (
              <Timeline
                items={detailLogs
                  .slice()
                  .reverse()
                  .map((log) => ({
                    color: log.result === 'success' ? 'green' : 'red',
                    children: (
                      <div>
                        <div>
                          <Text strong>{resultLabels[log.result] ?? log.result}</Text>
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          邮箱：{log.email} · IP：{log.ip}
                        </Text>
                      </div>
                    ),
                  }))}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
