import { useState, useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Patches the WebGL context so getContextAttributes() never returns null.
 * postprocessing's EffectComposer calls renderer.getContext().getContextAttributes().alpha
 * in addPass() and setSize(). When multiple Canvases exist or the context isn't fully
 * ready, getContextAttributes() can return null, crashing the composer.
 */
function patchContextAttributes(gl) {
  if (!gl || gl.__postFxPatched) return false;

  const ctx = gl.getContext();
  if (!ctx) return false;

  const original = ctx.getContextAttributes.bind(ctx);
  ctx.getContextAttributes = () => {
    return original() || { alpha: true, antialias: false, depth: true, stencil: false };
  };

  gl.__postFxPatched = true;
  return true;
}

export default function PostEffects() {
  const gl = useThree((state) => state.gl);
  const [ready, setReady] = useState(false);

  const tryPatch = useCallback(() => {
    if (gl && patchContextAttributes(gl)) {
      setReady(true);
      return true;
    }
    return false;
  }, [gl]);

  useEffect(() => {
    if (tryPatch()) return;

    // Retry briefly if context isn't available yet
    let frame;
    let attempts = 0;
    const retry = () => {
      if (attempts++ > 30) return; // ~500ms max
      if (!tryPatch()) {
        frame = requestAnimationFrame(retry);
      }
    };
    frame = requestAnimationFrame(retry);
    return () => cancelAnimationFrame(frame);
  }, [tryPatch]);

  if (!ready) return null;

  return (
    <EffectComposer>
      <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} />
      <Vignette offset={0.3} darkness={0.9} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
