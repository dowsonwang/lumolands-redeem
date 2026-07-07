import { useState } from 'react';
import {
  Card, Form, Input, Button, Descriptions, Tag, message,
  Typography, Empty, Steps, Alert, Modal,
} from 'antd';
import { SearchOutlined, SwapOutlined, UndoOutlined } from '@ant-design/icons';
import { codeDB, adminLogDB, appMemberDB } from '../db';
import { formatCode } from '../codeGenerator';
import type { Code } from '../types';

const { Title, Text } = Typography;

export default function RemedyPage() {
  const [searchCode, setSearchCode] = useState('');
  const [foundCode, setFoundCode] = useState<Code | null>(null);
  const [rebindForm] = Form.useForm();
  const [rebindOpen, setRebindOpen] = useState(false);

  const handleSearch = () => {
    const code = searchCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!code) {
      message.warning('请输入兑换码');
      return;
    }
    const found = codeDB.get(code);
    setFoundCode(found ?? null);
    if (!found) {
      message.error('未找到该兑换码');
    }
  };

  // 撤销兑换
  const handleRevoke = () => {
    if (!foundCode || foundCode.status !== 'used') return;
    Modal.confirm({
      title: '确认撤销兑换',
      content: (
        <div>
          <p>此操作将回收 <b>{foundCode.redeemedEmail}</b> 的会员，并将兑换码重置为未使用。</p>
          <p>用户可使用其他邮箱重新兑换。</p>
        </div>
      ),
      okText: '确认撤销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        appMemberDB.revoke(foundCode.redeemedEmail!, `redeem_revoke:${foundCode.id}`);
        codeDB.revoke(foundCode.id);
        adminLogDB.add({
          operator: 'admin',
          action: 'redeem_revoke',
          target: foundCode.id,
          detail: `撤销 ${foundCode.redeemedEmail} 的会员`,
        });
        message.success('已撤销兑换，兑换码已重置为未使用');
        setFoundCode({ ...foundCode, status: 'unused', redeemedEmail: null, redeemedAt: null, redeemedIp: null });
      },
    });
  };

  const handleRebindOpen = () => setRebindOpen(true);

  const handleRebind = async () => {
    const values = await rebindForm.validateFields();
    if (!foundCode) return;
    const oldEmail = foundCode.redeemedEmail!;
    const newEmail = values.newEmail.trim().toLowerCase();

    appMemberDB.revoke(oldEmail, `redeem_rebind:${foundCode.id}`);
    appMemberDB.grant(newEmail, 12, `redeem_rebind:${foundCode.id}`);
    codeDB.rebind(foundCode.id, newEmail);
    adminLogDB.add({
      operator: 'admin',
      action: 'redeem_rebind',
      target: foundCode.id,
      detail: `换绑：${oldEmail} → ${newEmail}`,
    });
    message.success(`会员已换绑至 ${newEmail}`);
    setFoundCode({ ...foundCode, redeemedEmail: newEmail });
    setRebindOpen(false);
    rebindForm.resetFields();
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>客服补救</Title>
      <Text type="secondary">输入兑换码查询，可换绑到其他邮箱或撤销兑换。</Text>

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="兑换码" style={{ flex: 1, maxWidth: 400 }}>
            <Input
              placeholder="输入 16 位兑换码（横线可选）"
              prefix={<SearchOutlined />}
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSearch}>查询</Button>
          </Form.Item>
        </Form>
      </Card>

      {foundCode ? (
        <Card title="兑换码信息">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="兑换码">
              <Text code style={{ fontSize: 14 }}>{formatCode(foundCode.id)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={foundCode.status === 'used' ? 'green' : foundCode.status === 'voided' ? 'red' : 'default'}>
                {foundCode.status === 'used' ? '已使用' : foundCode.status === 'voided' ? '已作废' : '未使用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属批次">{foundCode.batchId}</Descriptions.Item>
            <Descriptions.Item label="兑换邮箱">
              {foundCode.redeemedEmail ?? <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="兑换时间">
              {foundCode.redeemedAt ? new Date(foundCode.redeemedAt).toLocaleString() : <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="兑换 IP">
              {foundCode.redeemedIp ?? <Text type="secondary">-</Text>}
            </Descriptions.Item>
          </Descriptions>

          {foundCode.status === 'used' ? (
            <div style={{ marginTop: 24 }}>
              <Alert
                type="info"
                showIcon
                message="补救操作"
                description="换绑：将会员转移到其他邮箱（例如用户输错了邮箱）。撤销：取消本次兑换，码重置为未使用。"
                style={{ marginBottom: 16 }}
              />
              <Steps
                size="small"
                current={-1}
                items={[
                  { title: '核实用户', description: '要求提供卡密照片 + 订单截图' },
                  { title: '选择操作', description: '换绑或撤销' },
                  { title: '完成', description: '会员已更新' },
                ]}
                style={{ marginBottom: 24 }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <Button type="primary" icon={<SwapOutlined />} onClick={handleRebindOpen}>
                  换绑到新邮箱
                </Button>
                <Button danger icon={<UndoOutlined />} onClick={handleRevoke}>
                  撤销兑换
                </Button>
              </div>
            </div>
          ) : (
            <Alert
              type="warning"
              showIcon
              message={foundCode.status === 'unused' ? '该码尚未被兑换。' : '该码已被作废。'}
              style={{ marginTop: 16 }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <Empty description="请输入兑换码查询后进行补救操作" />
        </Card>
      )}

      <Modal
        title="换绑会员"
        open={rebindOpen}
        onCancel={() => setRebindOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRebindOpen(false)}>取消</Button>,
          <Button key="ok" type="primary" onClick={handleRebind}>确认换绑</Button>,
        ]}
      >
        <Form form={rebindForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="当前邮箱">
            <Input value={foundCode?.redeemedEmail ?? ''} disabled />
          </Form.Item>
          <Form.Item
            label="新邮箱"
            name="newEmail"
            rules={[
              { required: true, message: '请输入新邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input placeholder="请输入正确的邮箱" />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="此操作将：回收当前邮箱的会员，并为新邮箱开通 12 个月会员。"
          />
        </Form>
      </Modal>
    </div>
  );
}
