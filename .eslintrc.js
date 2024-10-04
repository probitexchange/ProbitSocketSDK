module.exports = {
    overrides: [
        {
            env: {
                node: true,
            },
            files: ['.eslintrc.{js,cjs}'],
        },
    ],
    parserOptions: {
        project: 'tsconfig.json',
        ecmaVersion: 2020,
        sourceType: 'module',
    },
    rules: {},
    extends: ['airbnb-base', 'prettier'],
};
