import { Font } from '@react-pdf/renderer';

export const fontStyleMap: Record<string, string> = {
  "Modern Sans": "Montserrat",
  "Display Geometric": "Oswald",
  "Developer Mono": "JetBrains Mono",
  "Oswald": "Oswald",
  "Montserrat": "Montserrat",
  "JetBrains Mono": "JetBrains Mono",
  "Fira Code": "Fira Code",
  "Inter": "Inter",
  "Roboto": "Roboto",
  "Lora": "Lora",
  "Playfair Display": "Playfair Display",
  "Merriweather": "Merriweather",
  "Caveat": "Caveat",
  "Pacifico": "Pacifico",
  "Amatic SC": "Amatic SC",
  "Poppins": "Poppins",
  "PT Sans": "PT Sans"
};

export const fontOptions = [
  { value: "Modern Sans", label: "Modern Sans (Montserrat)" },
  { value: "Display Geometric", label: "Display Geometric (Oswald)" },
  { value: "Developer Mono", label: "Developer Mono (JetBrains Mono)" },
  { value: "Roboto", label: "Roboto" },
  { value: "Lora", label: "Lora (Serif)" },
  { value: "Playfair Display", label: "Playfair Display (Serif)" },
  { value: "Merriweather", label: "Merriweather (Serif)" },
  { value: "Poppins", label: "Poppins" },
  { value: "PT Sans", label: "PT Sans" },
  { value: "Caveat", label: "Caveat (Handwriting)" },
  { value: "Pacifico", label: "Pacifico (Handwriting)" },
  { value: "Amatic SC", label: "Amatic SC (Handwriting)" },
];

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

  Font.register({
    family: 'Roboto',
    fonts: [
      { src: '/fonts/roboto.ttf' },
      { src: '/fonts/roboto-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Lora',
    fonts: [
      { src: '/fonts/lora.ttf' },
      { src: '/fonts/lora-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Playfair Display',
    fonts: [
      { src: '/fonts/playfair.ttf' },
      { src: '/fonts/playfair-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Merriweather',
    fonts: [
      { src: '/fonts/merriweather.ttf' },
      { src: '/fonts/merriweather-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Caveat',
    fonts: [
      { src: '/fonts/caveat.ttf' },
      { src: '/fonts/caveat-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Pacifico',
    fonts: [
      { src: '/fonts/pacifico.ttf' }
    ]
  });

  Font.register({
    family: 'Amatic SC',
    fonts: [
      { src: '/fonts/amatic.ttf' },
      { src: '/fonts/amatic-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'Poppins',
    fonts: [
      { src: '/fonts/poppins.ttf' },
      { src: '/fonts/poppins-bold.ttf', fontWeight: 'bold' }
    ]
  });

  Font.register({
    family: 'PT Sans',
    fonts: [
      { src: '/fonts/ptsans.ttf' },
      { src: '/fonts/ptsans-bold.ttf', fontWeight: 'bold' }
    ]
  });
}
