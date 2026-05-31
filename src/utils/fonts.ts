import { Font } from '@react-pdf/renderer';

export const fontStyleMap: Record<string, string> = {
  "Modern Sans": "Montserrat",
  "Display Geometric": "Oswald",
  "Developer Mono": "JetBrains Mono",
  "Oswald": "Oswald",
  "Montserrat": "Montserrat",
  "JetBrains Mono": "JetBrains Mono",
  "Fira Code": "Fira Code",
  "Inter": "Inter"
};

export function registerFonts() {
  Font.register({
    family: 'Montserrat',
    fonts: [
      { src: '/fonts/montserrat.ttf' },
      { src: '/fonts/montserrat.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Inter',
    fonts: [
      { src: '/fonts/inter.ttf' },
      { src: '/fonts/inter.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Oswald',
    fonts: [
      { src: '/fonts/oswald.ttf' },
      { src: '/fonts/oswald.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'JetBrains Mono',
    fonts: [
      { src: '/fonts/jetbrains-mono.ttf' },
      { src: '/fonts/jetbrains-mono.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Fira Code',
    fonts: [
      { src: '/fonts/fira-code.ttf' },
      { src: '/fonts/fira-code.ttf', fontWeight: 'bold' }
    ]
  });
}
