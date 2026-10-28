import React from 'react';
import { Screen, Header } from '../../src/components/ui';
import { StatsBlock } from '../../src/components/StrengthStats';

export default function Stats() {
  return (
    <Screen>
      <Header back title="Stats" />
      <StatsBlock />
    </Screen>
  );
}
