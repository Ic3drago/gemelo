import React from 'react';
import { Stat } from '@/design-system/Stat';
import { Card } from '@/design-system/Card';

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  decimals?: number;
}

/**
 * StatCard — thin wrapper around design-system Stat + Card.
 * Kept for backwards compatibility with existing imports.
 */
export default function StatCard({
  title,
  value,
  unit,
  prefix,
  icon,
  trend,
  decimals = 0,
}: StatCardProps) {
  return (
    <Card variant="flat">
      <Stat
        label={title}
        value={value}
        unit={unit}
        prefix={prefix}
        icon={icon}
        trend={trend}
        decimals={decimals}
      />
    </Card>
  );
}
