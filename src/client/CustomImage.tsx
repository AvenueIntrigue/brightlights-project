import { Node, Command, RawCommands } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

interface ImageOptions {
  src: string;
  alt?: string;
  title?: string;
}

const CustomImage = Node.create({
  name: 'image',

  inline: true,
  group: 'inline',
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addCommands() {
    return {
      setImage:
        (options: ImageOptions): Command =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    } as Partial<RawCommands>; // Explicitly cast to Partial<RawCommands>
  },
});

export default CustomImage;