import { useEffect, useState } from 'react';
import { Card, Table, Typography, Empty, Tag } from 'antd';
import { batchDB, getDB, getVersion } from '../db';
import type { DashboardStats } from '../types';

const { Title } = Typography;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    function compute() {
      const db = getDB();
      const codes = db.codes;

      const batchStats = batchDB.list().map((b) => {
        const batchCodes = codes.filter((c) => c.batchId === b.id);
        const redeemed = batchCodes.filter((c) => c.status === 'used').length;
        return {
          batchId: b.id,
          remark: b.remark,
          total: batchCodes.length,
          redeemed,
          rate: batchCodes.length ? redeemed / batchCodes.length : 0,
          status: b.status,
        };
      });

      setStats({
        totalCodes: 0,
        totalRedeemed: 0,
        totalVoided: 0,
        totalUnused: 0,
        redemptionRate: 0,
        recent7Days: [],
        recent30Days: [],
        batchStats,
      });
    }
    compute();
    const interval = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(interval);
  }, [getVersion()]);

  if (!stats) return null;

  const batchColumns = [
    { title: '批次号', dataIndex: 'batchId', key: 'batchId' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '总数', dataIndex: 'total', key: 'total' },
    { title: '已兑换', dataIndex: 'redeemed', key: 'redeemed' },
    {
      title: '兑换率',
      dataIndex: 'rate',
      key: 'rate',
      render: (r: number) => `${(r * 100).toFixed(1)}%`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => {
        const map: Record<string, string> = { inactive: 'default', active: 'green', voided: 'red' };
        const labels: Record<string, string> = { inactive: '未启用', active: '已启用', voided: '已作废' };
        return <Tag color={map[s]}>{labels[s]}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={4}>数据看板</Title>
      <Card title="各批次兑换率" style={{ marginTop: 16 }}>
        {stats.batchStats.length === 0 ? (
          <Empty description="暂无批次" />
        ) : (
          <Table
            dataSource={stats.batchStats}
            columns={batchColumns}
            rowKey="batchId"
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
