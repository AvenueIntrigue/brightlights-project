import { Extension } from "@tiptap/core";

// --------- add this block ---- vvvvvv ----------
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size
       */
      setFontSize: (size: string) => ReturnType;
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType;
    };
  }
}
// ---------------- add this block ----- ^^^^ --------------

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
      availableFontSizes: ['12', '14', '16', '18', '20', '24', '30', '36', '48' ,'64', '72', '96', '144', '288'], // Define your array of font sizes
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        if (this.options.availableFontSizes.includes(fontSize)) {
          return chain()
            .setMark('textStyle', { fontSize: fontSize + "px" })
            .run();
        }
        return false;
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});
