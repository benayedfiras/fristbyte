import { EffectComposer, Bloom, N8AO, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export default function PostEffects() {
  return (
    <EffectComposer>
      <N8AO aoRadius={0.5} intensity={2.0} />
      <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
      <Vignette offset={0.3} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
