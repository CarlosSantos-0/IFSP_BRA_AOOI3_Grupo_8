import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Gera os ícones PNG do app a partir de public/logo.svg.
// Rode `npm run icons` só quando o logo mudar; os PNGs ficam em public/.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // O logo já tem fundo verde próprio; nos ícones "maskable" (Android) e da Apple
    // o fundo precisa ocupar tudo, então usamos a mesma cor.
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0f766e' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0f766e' } },
  },
  images: ['public/logo.svg'],
});
