import { EffectComposer, Bloom, N8AO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useControls } from 'leva';

export default function PostEffects() {
  const { bloomIntensity, aoIntensity } = useControls('Post FX', {
    bloomIntensity: { value: 1.5, min: 0, max: 5 },
    aoIntensity: { value: 2.0, min: 0, max: 10 },
  });

  return (
    <EffectComposer>
      <N8AO aoRadius={0.5} intensity={aoIntensity} />
      <Bloom luminanceThreshold={1} mipmapBlur intensity={bloomIntensity} />
      <Vignette offset={0.3} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
