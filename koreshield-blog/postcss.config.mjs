import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';


export default {
    plugins: {
        'postcss-import': postcssImport, // to combine multiple css files
        tailwindcss: tailwindcss,
        autoprefixer: autoprefixer,
    }
};