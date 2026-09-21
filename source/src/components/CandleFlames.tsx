import { useMemo } from 'react';
import { birthdayContent } from '@/data/birthdayContent';
import { candleLayout } from '@/config/candles';
import { quality } from '@/config/qualityInstance';
import { CAKE } from '@/config/world';
import { Candle } from '@/three/Candle';
import { CandleLights } from '@/three/CandleLights';
import { ParticleField } from '@/three/ParticleField';
import { Smoke } from '@/three/Smoke';

/** Everything that belongs to the candles: wax, flames, lights, smoke and the warm dust around them. */
export function CandleFlames() {
  const spots = useMemo(() => candleLayout(birthdayContent.settings.candleCount), []);
  return (
    <group>
      {spots.map((spot, i) => (
        <Candle key={i} index={i} spot={spot} />
      ))}
      <CandleLights spots={spots} lightCount={quality.candleLights} />
      <Smoke spots={spots} puffs={quality.smokePuffs} />
      <ParticleField
        count={quality.candleDust}
        box={[3.4, 2.6, 3.4]}
        size={0.03}
        mode="anchor"
        offset={[0, CAKE.topY + 0.6, 0]}
        rise={0.12}
        seed={9}
        additive
        amount={(s) => s.candleDust}
      />
    </group>
  );
}
