import { useState } from 'react';
import {
  Card, Table, Button, Modal, Form, InputNumber, Input, Tag, Space,
  message, Popconfirm, Tooltip, Typography,
} from 'antd';
import {
  PlusOutlined, DownloadOutlined, CheckOutlined, StopOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useOutletContext } from 'react-router-dom';
import { batchDB, codeDB, adminLogDB } from '../db';
import { formatCode } from '../codeGenerator';
import type { Batch, BatchStatus } from '../types';

const { Title, Text } = Typography;

const statusTag = (s: BatchStatus) => {
  const map = { inactive: 'default', active: 'green', voided: 'red' } as const;
  const labels = { inactive: '未启用', active: '已启用', voided: '已作废' } as const;
  return <Tag color={map[s]}>{labels[s]}</Tag>;
};

export default function BatchesPage() {
  const { hasPermission } = useOutletContext<{ hasPermission: (a: 'manage' | 'query') => boolean }>();
  const canManage = hasPermission('manage');
  const [refresh, setRefresh] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const batches = batchDB.list();
  const allCodes = codeDB.list();

  const data = batches.map((b) => {
    const codes = allCodes.filter((c) => c.batchId === b.id);
    const redeemed = codes.filter((c) => c.status === 'used').length;
    return {
      ...b,
      total: codes.length,
      redeemed,
      rate: codes.length ? redeemed / codes.length : 0,
    };
  });

  const handleCreate = async () => {
    const values = await form.validateFields();
    setLoading(true);
    setTimeout(() => {
      const batch = batchDB.create({
        count: values.count,
        remark: values.remark,
        createdBy: 'admin',
      });
      adminLogDB.add({
        operator: 'admin',
        action: 'batch_create',
        target: batch.id,
        detail: `生成 ${values.count} 个兑换码`,
      });
      message.success(`批次 ${batch.id} 已创建，含 ${values.count} 个兑换码`);
      setCreateOpen(false);
      form.resetFields();
      setLoading(false);
      setRefresh((r) => r + 1);
    }, 400);
  };

  const handleExport = (batch: Batch) => {
    const codes = allCodes.filter((c) => c.batchId === batch.id);
    // CSV 加 BOM 头确保 Excel 正确识别中文；兑换码以 4-4-4-4 格式展示方便阅读
    const csv = ['\uFEFFCode,Status,RedeemedAt,RedeemedEmail']
      .concat(
        codes.map((c) =>
          [formatCode(c.id), c.status, c.redeemedAt ?? '', c.redeemedEmail ?? ''].join(','),
        ),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.id}_codes.csv`;
    a.click();
    URL.revokeObjectURL(url);
    adminLogDB.add({
      operator: 'admin',
      action: 'batch_export',
      target: batch.id,
      detail: `导出 ${codes.length} 个兑换码`,
    });
    message.success(`已导出 ${codes.length} 个兑换码`);
    setRefresh((r) => r + 1);
  };

  const handleActivate = (batch: Batch) => {
    batchDB.setStatus(batch.id, 'active');
    adminLogDB.add({ operator: 'admin', action: 'batch_activate', target: batch.id });
    message.success(`批次 ${batch.id} 已启用`);
    setRefresh((r) => r + 1);
  };

  const handleDeactivate = (batch: Batch) => {
    batchDB.setStatus(batch.id, 'inactive');
    adminLogDB.add({ operator: 'admin', action: 'batch_deactivate', target: batch.id });
    message.success(`批次 ${batch.id} 已停用`);
    setRefresh((r) => r + 1);
  };

  const handleVoid = (batch: Batch) => {
    batchDB.void(batch.id);
    adminLogDB.add({
      operator: 'admin',
      action: 'batch_void',
      target: batch.id,
      detail: '作废该批次所有未使用的码',
    });
    message.success(`批次 ${batch.id} 已作废`);
    setRefresh((r) => r + 1);
  };

  const columns = [
    { title: '批次号', dataIndex: 'id', key: 'id', fixed: 'left' as const, width: 160 },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '会员时长', key: 'duration', width: 100, render: () => '12 个月' },
    { title: '总数', dataIndex: 'total', key: 'total', width: 80 },
    { title: '已兑换', dataIndex: 'redeemed', key: 'redeemed', width: 90 },
    {
      title: '兑换率', dataIndex: 'rate', key: 'rate', width: 90,
      render: (r: number) => `${(r * 100).toFixed(1)}%`,
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: statusTag },
    { title: '创建人', dataIndex: 'createdBy', key: 'createdBy', width: 100 },
    {
      title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: '操作', key: 'actions', fixed: 'right' as const, width: 280,
      render: (_: unknown, record: Batch & { total: number; redeemed: number }) => (
        <Space size="small">
          {canManage && (
            <>
              <Tooltip title="导出 CSV">
                <Button size="small" icon={<DownloadOutlined />} onClick={() => handleExport(record)} />
              </Tooltip>
              {record.status === 'inactive' && (
                <Popconfirm title="确认启用该批次？启用后码即可兑换。" onConfirm={() => handleActivate(record)}>
                  <Button size="small" type="primary" ghost icon={<CheckOutlined />}>启用</Button>
                </Popconfirm>
              )}
              {record.status === 'active' && (
                <Popconfirm title="确认停用该批次？停用后码将无法兑换。" onConfirm={() => handleDeactivate(record)}>
                  <Button size="small" icon={<StopOutlined />}>停用</Button>
                </Popconfirm>
              )}
              {record.status !== 'voided' && (
                <Popconfirm
                  title="确认作废该批次？"
                  description="所有未使用的码将被作废，已兑换的码不受影响。此操作不可撤销。"
                  okText="作废"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleVoid(record)}
                >
                  <Button size="small" danger>作废</Button>
                </Popconfirm>
              )}
            </>
          )}
          {!canManage && <Text type="secondary">仅查看</Text>}
        </Space>
      ),
    },
  ];

  return (
    <div key={refresh}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>批次管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => setRefresh((r) => r + 1)}>刷新</Button>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建批次
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </Card>

      <Modal
        title="新建批次"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateOpen(false)}>取消</Button>,
          <Button key="create" type="primary" loading={loading} onClick={handleCreate}>
            创建并生成兑换码
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="会员时长" name="duration">
            <Input value="12 个月" disabled />
          </Form.Item>
          <Form.Item
            label="数量"
            name="count"
            rules={[
              { required: true, message: '请输入数量' },
              { type: 'number', min: 1, max: 50000, message: '1 - 50000' },
            ]}
          >
            <InputNumber min={1} max={50000} style={{ width: '100%' }} placeholder="例如 1000" />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
            rules={[{ required: true, message: '请输入备注' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="例如：2026-07 批次，印刷订单 PO-888，发往欧洲仓"
            />
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            注意：批次创建后默认为<b>未启用</b>状态，码无法兑换。需手动启用后码才生效。
          </Text>
        </Form>
      </Modal>
    </div>
  );
}

void formatCode;
